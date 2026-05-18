"""Post AI-generated replies to social platforms."""

from __future__ import annotations

import logging
import re

from cryptography.fernet import InvalidToken
from sqlalchemy.orm import Session

from app.config import settings
from app.models.conversation import Conversation
from app.models.message import Message

logger = logging.getLogger(__name__)


def _normalize_whatsapp_to(raw: str | None) -> str:
    """Graph `to` field: digits only, country code included, no + prefix."""
    if not raw:
        return ""
    return re.sub(r"\D", "", raw.strip())


def _resolve_access_token(encrypted_or_plain: str | None) -> str:
    """Decrypt Fernet-stored token; if value is plaintext (dev), use as-is."""
    from app.services.encryption import decrypt_token

    if not encrypted_or_plain:
        return ""
    try:
        return decrypt_token(encrypted_or_plain)
    except InvalidToken:
        return encrypted_or_plain


def _latest_inbound_platform_message_id(conversation: Conversation, db: Session) -> str | None:
    row = (
        db.query(Message.platform_message_id)
        .filter(
            Message.conversation_id == conversation.id,
            Message.direction == "inbound",
            Message.platform_message_id.isnot(None),
        )
        .order_by(Message.created_at.desc())
        .first()
    )
    return row[0] if row else None


async def post_reply(conversation: Conversation, reply_text: str, db: Session) -> bool:
    """
    Orchestrator: routes to the correct platform service based on conversation.platform.

    Returns True when a reply was dispatched. False for unsupported platforms (logged, no raise)
    so Celery tasks complete without retry storms.
    """
    social_account = conversation.social_account
    if not social_account:
        logger.error("Conversation %s has no social_account; cannot post reply", conversation.id)
        return False

    access_token = _resolve_access_token(social_account.access_token)
    if not access_token and conversation.platform == "whatsapp":
        access_token = (settings.meta_whatsapp_access_token or "").strip()
    if not access_token:
        logger.error(
            "No access token for conversation %s (platform=%s)",
            conversation.id,
            conversation.platform,
        )
        return False

    platform = (conversation.platform or "").lower()

    if platform == "whatsapp":
        from app.services.whatsapp_service import WhatsAppService

        svc = WhatsAppService()
        to_number = _normalize_whatsapp_to(
            conversation.customer_platform_id or conversation.platform_conversation_id
        )
        if not to_number:
            logger.warning("WhatsApp reply missing recipient for conversation %s", conversation.id)
            return False
        phone_number_id = (social_account.platform_user_id or "").strip() or (
            settings.meta_whatsapp_phone_number_id or ""
        ).strip()
        if not phone_number_id:
            logger.warning("WhatsApp phone_number_id missing for conversation %s", conversation.id)
            return False
        await svc.send_text_message(
            phone_number_id=phone_number_id,
            to_number=to_number,
            message_text=reply_text,
            access_token=access_token,
        )
        return True
    elif platform == "facebook":
        from app.services.facebook_service import FacebookService

        svc = FacebookService()
        page_id = (social_account.platform_user_id or "").strip()
        thread_type = conversation.facebook_thread_type or "dm"

        if thread_type == "comment":
            comment_id = _latest_inbound_platform_message_id(conversation, db)
            if not comment_id:
                raw = conversation.platform_conversation_id or ""
                comment_id = raw.removeprefix("comment:") if raw.startswith("comment:") else raw
            if not comment_id:
                logger.warning("Facebook comment reply missing comment_id for conversation %s", conversation.id)
                return False
            await svc.post_comment_reply(comment_id, reply_text, access_token)
        else:
            recipient_id = (
                conversation.customer_platform_id
                or (conversation.platform_conversation_id or "").removeprefix("dm:")
            )
            if not recipient_id:
                logger.warning("Facebook DM reply missing recipient for conversation %s", conversation.id)
                return False
            if not page_id:
                logger.warning("Facebook page_id missing for conversation %s", conversation.id)
                return False
            await svc.post_dm_reply(recipient_id, reply_text, page_id, access_token)
        return True

    logger.warning(
        "Unsupported platform %r for conversation %s — reply skipped",
        conversation.platform,
        conversation.id,
    )
    return False


async def post_reply_to_platform(conversation: Conversation, reply_text: str, db: Session) -> bool:
    """Alias for :func:`post_reply` (backward compatibility)."""
    return await post_reply(conversation, reply_text, db)
