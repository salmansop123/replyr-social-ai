"""ENH-006 — Facebook webhook ingest, dedupe, and reply routing."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport
from sqlalchemy.orm import Session

from app.main import app
from app.models.conversation import Conversation
from app.models.message import Message
from app.workers.webhook_tasks import process_meta_webhook
from fastapi.testclient import TestClient

from tests.test_meta_webhook import _fb_comment_payload, _hub_sig256


@pytest.fixture
def sync_client() -> TestClient:
    return TestClient(app)


def test_process_facebook_comment_creates_thread(db_session: Session, facebook_social_account: tuple) -> None:
    _, acc, page_id = facebook_social_account
    payload = _fb_comment_payload(page_id, "cmt_unit_fb_100", "post_unit_100", "Need a quote")

    with patch("app.services.facebook_service.FacebookService.fetch_post_context", new_callable=AsyncMock, return_value="Promo post"):
        with patch("app.workers.webhook_tasks.process_and_reply.delay") as delay:
            process_meta_webhook(payload)

    delay.assert_called_once()
    conv = (
        db_session.query(Conversation)
        .filter(
            Conversation.social_account_id == acc.id,
            Conversation.platform_conversation_id == "comment:cmt_unit_fb_100",
        )
        .first()
    )
    assert conv is not None
    assert conv.facebook_thread_type == "comment"
    assert conv.post_context == "Promo post"
    assert acc.last_webhook_received_at is not None


def test_facebook_webhook_http_dedupe(
    meta_test_secret: str,
    sync_client: TestClient,
    db_session: Session,
    facebook_social_account: tuple,
) -> None:
    _, acc, page_id = facebook_social_account
    payload = _fb_comment_payload(page_id, "cmt_http_dedup_101", "post_101", "Dedup test")
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sig = _hub_sig256(body, meta_test_secret)

    with patch("app.workers.webhook_tasks.process_and_reply.delay") as delay, patch(
        "app.services.facebook_service.FacebookService.fetch_post_context",
        new_callable=AsyncMock,
        return_value=None,
    ):
        r1 = sync_client.post(
            "/webhooks/meta",
            content=body,
            headers={"Content-Type": "application/json", "X-Hub-Signature-256": sig},
        )
        r2 = sync_client.post(
            "/webhooks/meta",
            content=body,
            headers={"Content-Type": "application/json", "X-Hub-Signature-256": sig},
        )

    assert r1.status_code == r2.status_code == 200
    assert delay.call_count == 1
    rows = db_session.query(Message).filter(Message.platform_message_id == "cmt_http_dedup_101").all()
    assert len(rows) == 1
