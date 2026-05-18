"""Pytest fixtures for backend tests."""

from __future__ import annotations

import uuid
from collections.abc import Generator

import pytest
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.organization import Organization
from app.models.social_account import SocialAccount


@pytest.fixture
def meta_test_secret(monkeypatch: pytest.MonkeyPatch) -> str:
    """Stable Meta app secret + verify token for webhook tests."""
    import app.config as config_module

    secret = "unit_test_meta_app_secret_32chars!!"
    monkeypatch.setattr(config_module.settings, "meta_app_secret", secret)
    monkeypatch.setattr(config_module.settings, "meta_verify_token", "unit_verify_token_replyr")
    return secret


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
    except OperationalError as e:
        db.close()
        pytest.skip(f"PostgreSQL not reachable: {e}")
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def whatsapp_social_account(
    db_session: Session,
) -> Generator[tuple[Organization, SocialAccount, str], None, None]:
    """Org + WhatsApp SocialAccount; entry id matches platform_user_id for webhook routing."""
    phone_number_id = f"test_pn_{uuid.uuid4().hex[:12]}"
    org = Organization(
        name="Webhook Test Org",
        slug=f"wh-test-{uuid.uuid4().hex[:8]}",
        subscription_tier="starter",
        escalation_keywords=[],
    )
    db_session.add(org)
    db_session.flush()
    acc = SocialAccount(
        organization_id=org.id,
        platform="whatsapp",
        platform_user_id=phone_number_id,
        display_name="Test WA",
        access_token="encrypted-or-plain-placeholder",
        is_active=True,
    )
    db_session.add(acc)
    db_session.commit()
    db_session.refresh(org)
    db_session.refresh(acc)
    try:
        yield org, acc, phone_number_id
    finally:
        convs = db_session.query(Conversation).filter(Conversation.social_account_id == acc.id).all()
        for c in convs:
            db_session.query(Message).filter(Message.conversation_id == c.id).delete()
            db_session.delete(c)
        db_session.delete(acc)
        db_session.delete(org)
        db_session.commit()


@pytest.fixture
def facebook_social_account(
    db_session: Session,
) -> Generator[tuple[Organization, SocialAccount, str], None, None]:
    page_id = f"test_page_{uuid.uuid4().hex[:12]}"
    org = Organization(
        name="Facebook Webhook Test Org",
        slug=f"fb-test-{uuid.uuid4().hex[:8]}",
        subscription_tier="starter",
        escalation_keywords=[],
    )
    db_session.add(org)
    db_session.flush()
    acc = SocialAccount(
        organization_id=org.id,
        platform="facebook",
        platform_user_id=page_id,
        display_name="Test FB Page",
        access_token="plain-test-token",
        is_active=True,
    )
    db_session.add(acc)
    db_session.commit()
    db_session.refresh(org)
    db_session.refresh(acc)
    try:
        yield org, acc, page_id
    finally:
        convs = db_session.query(Conversation).filter(Conversation.social_account_id == acc.id).all()
        for c in convs:
            db_session.query(Message).filter(Message.conversation_id == c.id).delete()
            db_session.delete(c)
        db_session.delete(acc)
        db_session.delete(org)
        db_session.commit()
