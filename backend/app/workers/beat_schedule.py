from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from app.database import SessionLocal
from app.models.social_account import SocialAccount
from app.services.encryption import decrypt_token, encrypt_token
from app.services.meta_facebook_oauth import refresh_long_lived_token
from app.services.notify_service import organization_admin_emails, send_operator_email
from app.workers.celery_app import celery

logger = logging.getLogger(__name__)


@celery.task(name="app.workers.beat_schedule.whatsapp_poll_tick")
def whatsapp_poll_tick() -> None:
    """Placeholder: poll WhatsApp Cloud API every minute (implement Meta calls here)."""
    return None


@celery.task(name="app.workers.beat_schedule.refresh_facebook_tokens")
def refresh_facebook_tokens() -> dict:
    """Daily: refresh Facebook Page tokens expiring within 7 days (FB-006)."""
    db = SessionLocal()
    refreshed = 0
    failed = 0
    try:
        threshold = datetime.now(timezone.utc) + timedelta(days=7)
        accounts = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.platform == "facebook",
                SocialAccount.is_active.is_(True),
                SocialAccount.access_token.isnot(None),
            )
            .all()
        )
        for acc in accounts:
            if acc.token_expires_at and acc.token_expires_at > threshold:
                continue
            try:
                plain = decrypt_token(acc.access_token or "")
            except Exception:
                plain = acc.access_token or ""
            if not plain:
                failed += 1
                continue
            try:
                new_token, expires_at = asyncio.run(refresh_long_lived_token(plain))
                acc.access_token = encrypt_token(new_token)
                acc.token_expires_at = expires_at or (
                    datetime.now(timezone.utc) + timedelta(days=60)
                )
                db.commit()
                refreshed += 1
            except Exception as exc:
                db.rollback()
                failed += 1
                logger.exception("Facebook token refresh failed for account %s", acc.id)
                emails = organization_admin_emails(db, acc.organization_id)
                page_label = acc.display_name or acc.platform_user_id
                asyncio.run(
                    send_operator_email(
                        emails,
                        f"Replyr: reconnect Facebook Page “{page_label}”",
                        (
                            f"<p>We could not refresh the access token for your Facebook Page "
                            f"<strong>{page_label}</strong>.</p>"
                            f"<p>Please open Channels in Replyr and connect Facebook again.</p>"
                            f"<p>Error: {exc}</p>"
                        ),
                    )
                )
    finally:
        db.close()
    return {"refreshed": refreshed, "failed": failed}
