"""Operator notifications (email via Resend)."""

from __future__ import annotations

import logging

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)


def organization_admin_emails(db: Session, organization_id) -> list[str]:
    rows = (
        db.query(User.email)
        .filter(
            User.organization_id == organization_id,
            User.email.isnot(None),
        )
        .all()
    )
    return [e[0] for e in rows if e[0]]


async def send_operator_email(to_addresses: list[str], subject: str, html_body: str) -> bool:
    if not settings.resend_api_key or not to_addresses:
        logger.warning(
            "Skipping operator email (resend=%s, recipients=%s): %s",
            bool(settings.resend_api_key),
            len(to_addresses),
            subject,
        )
        return False
    payload = {
        "from": settings.from_email,
        "to": to_addresses[:5],
        "subject": subject,
        "html": html_body,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
    if r.status_code not in (200, 201):
        logger.error("Resend API error %s: %s", r.status_code, r.text[:300])
        return False
    return True
