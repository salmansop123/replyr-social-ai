import asyncio
import logging
import uuid
from datetime import datetime, timezone

from app.config import settings
from app.database import SessionLocal
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.organization import Organization
from app.models.social_account import SocialAccount
from app.services.encryption import decrypt_token, encrypt_token
from app.services.facebook_service import FacebookService
from app.services.webhook_dedup import claim_inbound_message
from app.workers.ai_tasks import process_and_reply

logger = logging.getLogger(__name__)


def process_meta_webhook(payload: dict) -> None:
    """Handle Meta webhook payload: WhatsApp Cloud API, Facebook Page comments and DMs."""
    db = SessionLocal()
    obj = payload.get("object")
    try:
        for entry in payload.get("entry", []):
            if obj == "whatsapp_business_account":
                for change in entry.get("changes", []):
                    if change.get("field") == "messages":
                        _handle_whatsapp_value(db, change.get("value") or {})
                for messaging in entry.get("messaging", []):
                    acc = _find_whatsapp_account(db, str(entry.get("id") or ""))
                    if acc:
                        _handle_whatsapp_legacy_messaging(db, acc, messaging)
                continue

            page_id = entry.get("id")
            social_account = (
                db.query(SocialAccount)
                .filter(
                    SocialAccount.platform_user_id == str(page_id),
                    SocialAccount.is_active.is_(True),
                )
                .first()
            )
            if not social_account:
                continue
            social_account.last_webhook_received_at = datetime.now(timezone.utc)
            db.flush()

            for messaging in entry.get("messaging", []):
                if social_account.platform == "whatsapp":
                    _handle_whatsapp_legacy_messaging(db, social_account, messaging)
                else:
                    _handle_facebook_dm(db, social_account, messaging, source="messaging")

            for change in entry.get("changes", []):
                field = change.get("field")
                value = change.get("value") or {}
                if field == "feed":
                    _handle_facebook_feed(db, social_account, value)
                elif field == "messages" and social_account.platform == "facebook":
                    _handle_facebook_dm(db, social_account, value, source="messages")
                elif field == "comments":
                    _handle_facebook_comment_value(db, social_account, value)
    finally:
        db.close()


def _find_whatsapp_account(db, phone_number_id: str) -> SocialAccount | None:
    if not phone_number_id:
        return None
    acc = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.platform == "whatsapp",
            SocialAccount.platform_user_id == phone_number_id,
            SocialAccount.is_active.is_(True),
        )
        .first()
    )
    if acc:
        return acc
    return _auto_provision_whatsapp_from_env(db, phone_number_id)


def _auto_provision_whatsapp_from_env(db, phone_number_id: str) -> SocialAccount | None:
    """Dev convenience: bind webhook to org when META_WHATSAPP_* env matches metadata phone_number_id."""
    env_pn = (settings.meta_whatsapp_phone_number_id or "").strip()
    env_token = (settings.meta_whatsapp_access_token or "").strip()
    if settings.app_env != "development" or not env_pn or not env_token:
        return None
    if env_pn != phone_number_id:
        return None

    org = db.query(Organization).filter(Organization.slug == "dev-workspace").first()
    if not org:
        org = db.query(Organization).order_by(Organization.created_at.asc()).first()
    if not org:
        logger.warning("WhatsApp webhook for %s but no organization to attach env account", phone_number_id)
        return None

    encrypted = encrypt_token(env_token)
    acc = SocialAccount(
        organization_id=org.id,
        platform="whatsapp",
        platform_user_id=phone_number_id,
        display_name="WhatsApp (env)",
        access_token=encrypted,
        is_active=True,
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)
    logger.info("Auto-provisioned WhatsApp SocialAccount for phone_number_id=%s org=%s", phone_number_id, org.id)
    return acc


def _touch_account(db, social_account: SocialAccount) -> None:
    social_account.last_webhook_received_at = datetime.now(timezone.utc)


def _is_duplicate_inbound(db, platform_message_id: str | None) -> bool:
    if not platform_message_id:
        return False
    mid = str(platform_message_id)
    if not claim_inbound_message(mid):
        return True
    existing = db.query(Message).filter(Message.platform_message_id == mid).first()
    return existing is not None


def _handle_whatsapp_value(db, value: dict) -> None:
    """WhatsApp Cloud API: entry.changes[].value when field == messages."""
    if value.get("messaging_product") != "whatsapp":
        return

    metadata = value.get("metadata") or {}
    phone_number_id = str(metadata.get("phone_number_id") or "")
    social_account = _find_whatsapp_account(db, phone_number_id)
    if not social_account:
        logger.warning("WhatsApp webhook: no account for phone_number_id=%s", phone_number_id)
        return

    _touch_account(db, social_account)
    db.flush()

    contacts: dict[str, str | None] = {}
    for c in value.get("contacts") or []:
        wa_id = str(c.get("wa_id") or "")
        if wa_id:
            profile = c.get("profile") if isinstance(c.get("profile"), dict) else {}
            contacts[wa_id] = profile.get("name")

    for msg in value.get("messages") or []:
        _handle_whatsapp_inbound_message(db, social_account, msg, contacts)


def _handle_whatsapp_legacy_messaging(db, social_account: SocialAccount, messaging: dict) -> None:
    """Legacy/test shape: entry.messaging[] with sender + message (used in unit tests)."""
    msg_obj = messaging.get("message") or {}
    mid = msg_obj.get("mid") or msg_obj.get("id")
    sender = messaging.get("sender") or {}
    sender_id = str(sender.get("id") or "")
    raw_text = msg_obj.get("text", "")
    if isinstance(raw_text, dict):
        text = (raw_text.get("body") or "").strip()
    else:
        text = str(raw_text or "").strip()

    synthetic = {
        "id": mid,
        "from": sender_id,
        "type": "text",
        "text": {"body": text},
    }
    contacts = {sender_id: sender.get("name")} if sender_id else {}
    _touch_account(db, social_account)
    db.flush()
    _handle_whatsapp_inbound_message(db, social_account, synthetic, contacts)


def _handle_whatsapp_inbound_message(
    db,
    social_account: SocialAccount,
    msg: dict,
    contacts: dict[str, str | None],
) -> None:
    msg_type = msg.get("type") or "text"
    if msg_type != "text":
        logger.debug("Skipping WhatsApp message type=%s", msg_type)
        return

    mid = msg.get("id")
    if _is_duplicate_inbound(db, str(mid) if mid else None):
        return

    from_id = str(msg.get("from") or "")
    text_body = msg.get("text") if isinstance(msg.get("text"), dict) else {}
    text = (text_body.get("body") or "").strip()
    if not from_id or not text:
        return

    customer_name = contacts.get(from_id)
    convo = (
        db.query(Conversation)
        .filter(
            Conversation.platform_conversation_id == from_id,
            Conversation.social_account_id == social_account.id,
        )
        .first()
    )
    if not convo:
        convo = Conversation(
            organization_id=social_account.organization_id,
            social_account_id=social_account.id,
            platform="whatsapp",
            platform_conversation_id=from_id,
            customer_platform_id=from_id,
            customer_name=customer_name,
            status="pending",
        )
        db.add(convo)
        db.flush()
    elif customer_name:
        convo.customer_name = customer_name

    db.add(
        Message(
            conversation_id=convo.id,
            direction="inbound",
            content=text,
            platform_message_id=str(mid) if mid else None,
        )
    )
    db.commit()
    process_and_reply.delay(str(convo.id))
    logger.info("WhatsApp inbound queued convo=%s mid=%s", convo.id, mid)


def _handle_facebook_dm(db, social_account: SocialAccount, payload: dict, *, source: str) -> None:
    msg_obj = payload.get("message") or {}
    mid = msg_obj.get("mid") or msg_obj.get("id")
    if _is_duplicate_inbound(db, str(mid) if mid else None):
        return

    sender = payload.get("sender") or {}
    sender_id = sender.get("id")
    raw_text = msg_obj.get("text", "")
    if isinstance(raw_text, dict):
        text = (raw_text.get("body") or "").strip()
    else:
        text = str(raw_text or "").strip()
    if not sender_id or not text:
        return

    _touch_account(db, social_account)
    thread_key = f"dm:{sender_id}"
    convo = (
        db.query(Conversation)
        .filter(
            Conversation.platform_conversation_id == thread_key,
            Conversation.social_account_id == social_account.id,
        )
        .first()
    )
    if not convo:
        convo = Conversation(
            organization_id=social_account.organization_id,
            social_account_id=social_account.id,
            platform=social_account.platform,
            platform_conversation_id=thread_key,
            customer_platform_id=str(sender_id),
            customer_name=sender.get("name"),
            facebook_thread_type="dm",
            status="pending",
        )
        db.add(convo)
        db.flush()
    else:
        convo.facebook_thread_type = "dm"
        if sender.get("name"):
            convo.customer_name = sender.get("name")

    msg = Message(
        conversation_id=convo.id,
        direction="inbound",
        content=text,
        platform_message_id=str(mid) if mid else None,
    )
    db.add(msg)
    db.commit()
    process_and_reply.delay(str(convo.id))
    logger.debug("Facebook DM queued (%s) convo=%s", source, convo.id)


def _handle_facebook_feed(db, social_account: SocialAccount, value: dict) -> None:
    if value.get("item") != "comment":
        return
    if value.get("verb") not in (None, "add", "edited"):
        return
    _handle_facebook_comment_value(db, social_account, value)


def _handle_facebook_comment_value(db, social_account: SocialAccount, value: dict) -> None:
    comment_id = value.get("comment_id") or value.get("id")
    from_obj = value.get("from") if isinstance(value.get("from"), dict) else {}
    from_id = from_obj.get("id")
    text = (value.get("message") or value.get("text") or "").strip()
    post_id = value.get("post_id") or value.get("parent_id")

    if not text or not comment_id:
        return
    if _is_duplicate_inbound(db, str(comment_id)):
        return

    _touch_account(db, social_account)
    thread_key = f"comment:{comment_id}"
    convo = (
        db.query(Conversation)
        .filter(
            Conversation.platform_conversation_id == thread_key,
            Conversation.social_account_id == social_account.id,
        )
        .first()
    )
    if not convo:
        convo = Conversation(
            organization_id=social_account.organization_id,
            social_account_id=social_account.id,
            platform=social_account.platform,
            platform_conversation_id=thread_key,
            customer_platform_id=str(from_id) if from_id else None,
            customer_name=from_obj.get("name"),
            facebook_thread_type="comment",
            facebook_post_id=str(post_id) if post_id else None,
            status="pending",
        )
        db.add(convo)
        db.flush()
    else:
        convo.facebook_thread_type = "comment"
        if post_id:
            convo.facebook_post_id = str(post_id)

    if post_id and not convo.post_context:
        _populate_post_context(db, convo, social_account, str(post_id))

    msg = Message(
        conversation_id=convo.id,
        direction="inbound",
        content=text,
        platform_message_id=str(comment_id),
    )
    db.add(msg)
    db.commit()
    process_and_reply.delay(str(convo.id))


def _populate_post_context(db, convo: Conversation, social_account: SocialAccount, post_id: str) -> None:
    token = social_account.access_token
    if not token:
        return
    try:
        plain = decrypt_token(token)
    except Exception:
        plain = token
    if not plain:
        return
    svc = FacebookService()
    try:
        ctx = asyncio.run(svc.fetch_post_context(post_id, plain))
        if ctx:
            convo.post_context = ctx
            db.flush()
    except Exception:
        logger.exception("Failed to fetch Facebook post context for %s", post_id)
