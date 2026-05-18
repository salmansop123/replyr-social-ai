import asyncio
import logging
import uuid
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.social_account import SocialAccount
from app.services.encryption import decrypt_token
from app.services.facebook_service import FacebookService
from app.services.webhook_dedup import claim_inbound_message
from app.workers.ai_tasks import process_and_reply

logger = logging.getLogger(__name__)


def process_meta_webhook(payload: dict) -> None:
    """Handle Meta webhook payload: WhatsApp, Facebook Page comments and DMs."""
    db = SessionLocal()
    try:
        for entry in payload.get("entry", []):
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
                _handle_facebook_dm(db, social_account, messaging, source="messaging")

            for change in entry.get("changes", []):
                field = change.get("field")
                value = change.get("value") or {}
                if field == "feed":
                    _handle_facebook_feed(db, social_account, value)
                elif field == "messages":
                    _handle_facebook_dm(db, social_account, value, source="messages")
                elif field == "comments":
                    _handle_facebook_comment_value(db, social_account, value)
    finally:
        db.close()


def _touch_account(db, social_account: SocialAccount) -> None:
    social_account.last_webhook_received_at = datetime.now(timezone.utc)


def _is_duplicate_inbound(db, platform_message_id: str | None) -> bool:
    """Redis SET NX first, then PostgreSQL platform_message_id check."""
    if not platform_message_id:
        return False
    mid = str(platform_message_id)
    if not claim_inbound_message(mid):
        return True
    existing = db.query(Message).filter(Message.platform_message_id == mid).first()
    return existing is not None


def _handle_facebook_dm(db, social_account: SocialAccount, payload: dict, *, source: str) -> None:
    """Facebook Messenger DM (entry.messaging or changes[].field == messages)."""
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
    """Page feed webhook — comments arrive with field feed."""
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
    """Fetch parent post text for AI context (FB-007)."""
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


def _handle_dm(db, social_account, messaging: dict) -> None:
    """Legacy alias — WhatsApp uses messaging on entry; Facebook uses _handle_facebook_dm."""
    _handle_facebook_dm(db, social_account, messaging, source="messaging")


def _handle_comment(db, social_account, value: dict) -> None:
    _handle_facebook_comment_value(db, social_account, value)
