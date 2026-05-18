"""Development-only auth helpers when Clerk is not configured."""

from __future__ import annotations

import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.models.organization import Organization
from app.models.user import User

logger = logging.getLogger(__name__)

DEV_BEARER = "dev-local"
DEV_CLERK_USER_ID = "dev_local_user"


def dev_auth_allowed() -> bool:
    if settings.app_env != "development":
        return False
    if not settings.dev_auth_enabled:
        return False
    domain = (settings.clerk_domain or "").strip().lower()
    secret = (settings.clerk_secret_key or "").strip()
    if "placeholder" in domain or secret.startswith("sk_test_placeholder"):
        return True
    return settings.dev_auth_enabled


def is_dev_bearer(token: str | None) -> bool:
    return bool(token) and token.strip() == DEV_BEARER


def get_or_create_dev_user(db: Session) -> User:
    user = db.query(User).filter(User.clerk_user_id == DEV_CLERK_USER_ID).first()
    if user:
        return user

    org = db.query(Organization).filter(Organization.slug == "dev-workspace").first()
    if not org:
        org = Organization(
            clerk_org_id=None,
            name="Dev Workspace",
            slug="dev-workspace",
            escalation_keywords=[],
        )
        db.add(org)
        db.flush()

    user = User(
        clerk_user_id=DEV_CLERK_USER_ID,
        organization_id=org.id,
        email="dev@localhost",
        name="Local Developer",
        role="owner",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("Created development user org_id=%s user_id=%s", org.id, user.id)
    return user


def require_dev_auth_enabled() -> None:
    if not dev_auth_allowed():
        raise HTTPException(status_code=404, detail="Development auth is not enabled")
