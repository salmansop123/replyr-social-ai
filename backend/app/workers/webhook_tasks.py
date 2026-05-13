import uuid

from app.database import SessionLocal
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.social_account import SocialAccount
from app.workers.ai_tasks import process_and_reply


def process_meta_event(payload: dict) -> None:
    """Handle Meta webhook payload: DMs and comments."""
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
            for messaging in entry.get("messaging", []):
                _handle_dm(db, social_account, messaging)
            for change in entry.get("changes", []):
                if change.get("field") == "comments":
                    _handle_comment(db, social_account, change.get("value") or {})
    finally:
        db.close()


def _handle_dm(db, social_account, messaging: dict) -> None:
    sender_id = messaging.get("sender", {}).get("id")
    text = messaging.get("message", {}).get("text", "")
    if not sender_id or not text:
        return
    convo = (
        db.query(Conversation)
        .filter(
            Conversation.platform_conversation_id == str(sender_id),
            Conversation.social_account_id == social_account.id,
        )
        .first()
    )
    if not convo:
        convo = Conversation(
            organization_id=social_account.organization_id,
            social_account_id=social_account.id,
            platform=social_account.platform,
            platform_conversation_id=str(sender_id),
            customer_platform_id=str(sender_id),
            status="pending",
        )
        db.add(convo)
        db.flush()
    msg = Message(conversation_id=convo.id, direction="inbound", content=text)
    db.add(msg)
    db.commit()
    process_and_reply.delay(str(convo.id))


def _handle_comment(db, social_account, value: dict) -> None:
    """Minimal comment handler — extend with Graph comment reply IDs as needed."""
    comment_id = value.get("comment_id") or value.get("id")
    from_id = value.get("from", {}).get("id") if isinstance(value.get("from"), dict) else None
    text = value.get("message") or value.get("text") or ""
    if not text:
        return
    thread_key = str(comment_id or from_id or uuid.uuid4())
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
            post_context=value.get("post", {}).get("message") if isinstance(value.get("post"), dict) else None,
            status="pending",
        )
        db.add(convo)
        db.flush()
    msg = Message(conversation_id=convo.id, direction="inbound", content=text)
    db.add(msg)
    db.commit()
    process_and_reply.delay(str(convo.id))
