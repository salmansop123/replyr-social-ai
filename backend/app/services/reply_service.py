"""Post AI-generated replies to social platforms."""

from __future__ import annotations

import re

from cryptography.fernet import InvalidToken
from sqlalchemy.orm import Session

from app.config import settings
from app.models.conversation import Conversation


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


async def post_reply(conversation: Conversation, reply_text: str, db: Session) -> None:
    """
    Orchestrator: routes to the correct platform service
    based on conversation.platform.
    """
    _ = db
    social_account = conversation.social_account
    if not social_account:
        raise ValueError("Conversation has no linked social_account; cannot post reply")

    access_token = _resolve_access_token(social_account.access_token)
    if not access_token and conversation.platform == "whatsapp":
        access_token = (settings.meta_whatsapp_access_token or "").strip()
    if not access_token:
        raise ValueError("No access token on social account (or META_WHATSAPP_ACCESS_TOKEN for dev)")

    if conversation.platform == "whatsapp":
        from app.services.whatsapp_service import WhatsAppService

        svc = WhatsAppService()
        to_number = _normalize_whatsapp_to(
            conversation.customer_platform_id or conversation.platform_conversation_id
        )
        if not to_number:
            raise ValueError(
                "WhatsApp reply requires customer_platform_id or platform_conversation_id (customer WA id / phone)"
            )
        phone_number_id = (social_account.platform_user_id or "").strip() or (
            settings.meta_whatsapp_phone_number_id or ""
        ).strip()
        if not phone_number_id:
            raise ValueError(
                "WhatsApp phone_number_id missing: set SocialAccount.platform_user_id or META_WHATSAPP_PHONE_NUMBER_ID"
            )
        await svc.send_text_message(
            phone_number_id=phone_number_id,
            to_number=to_number,
            message_text=reply_text,
            access_token=access_token,
        )
    elif conversation.platform == "facebook":
        raise NotImplementedError("Facebook not yet implemented")
    else:
        raise ValueError(f"Unknown platform: {conversation.platform}")


async def post_reply_to_platform(conversation: Conversation, reply_text: str, db: Session) -> None:
    """Alias for :func:`post_reply` (backward compatibility)."""
    await post_reply(conversation, reply_text, db)
