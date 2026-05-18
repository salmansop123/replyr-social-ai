"""Meta / WhatsApp webhook HTTP behaviour."""

from __future__ import annotations

import hashlib
import hmac
import json
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from httpx import ASGITransport
from sqlalchemy.orm import Session

from app.main import app
from app.models.conversation import Conversation
from app.models.message import Message
from fastapi.testclient import TestClient


def _hub_sig256(body: bytes, secret: str) -> str:
    return "sha256=" + hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()


def _wa_payload(phone_number_id: str, customer_wa_id: str, mid: str, body_text: str) -> dict:
    """Shape compatible with app.workers.webhook_tasks.process_meta_webhook / _handle_dm."""
    return {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": phone_number_id,
                "messaging": [
                    {
                        "sender": {"id": customer_wa_id},
                        "recipient": {"id": phone_number_id},
                        "timestamp": "1700000000",
                        "message": {
                            "mid": mid,
                            "type": "text",
                            "text": {"body": body_text},
                        },
                    }
                ],
            }
        ],
    }


@pytest.fixture
def sync_client() -> TestClient:
    return TestClient(app)


def test_verification_challenge_valid_token(meta_test_secret: str, sync_client: TestClient) -> None:
    r = sync_client.get(
        "/webhooks/meta",
        params={
            "hub.mode": "subscribe",
            "hub.challenge": "424242",
            "hub.verify_token": "unit_verify_token_replyr",
        },
    )
    assert r.status_code == 200
    assert r.text == "424242"


def test_verification_challenge_invalid_token(meta_test_secret: str, sync_client: TestClient) -> None:
    r = sync_client.get(
        "/webhooks/meta",
        params={
            "hub.mode": "subscribe",
            "hub.challenge": "424242",
            "hub.verify_token": "wrong_token",
        },
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_webhook_invalid_signature_returns_200(meta_test_secret: str) -> None:
    transport = ASGITransport(app=app)
    body = b'{"object":"whatsapp_business_account","entry":[]}'
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post(
            "/webhooks/meta",
            content=body,
            headers={
                "Content-Type": "application/json",
                "X-Hub-Signature-256": "sha256=deadbeef00000000000000000000000000000000000000000000000000000000",
            },
        )
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_webhook_valid_signature_processes_message(
    meta_test_secret: str,
    sync_client: TestClient,
    db_session: Session,
    whatsapp_social_account: tuple,
) -> None:
    _, acc, phone_number_id = whatsapp_social_account
    payload = _wa_payload(phone_number_id, "1555987654321", "wamid.testmsg_unique_001", "Hello pytest")
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sig = _hub_sig256(body, meta_test_secret)

    with patch("app.workers.webhook_tasks.process_and_reply.delay") as delay_mock:
        r = sync_client.post(
            "/webhooks/meta",
            content=body,
            headers={
                "Content-Type": "application/json",
                "X-Hub-Signature-256": sig,
            },
        )
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
    delay_mock.assert_called_once()

    msg_count = (
        db_session.query(Message)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(Conversation.social_account_id == acc.id)
        .count()
    )
    assert msg_count == 1
    m = db_session.query(Message).filter(Message.platform_message_id == "wamid.testmsg_unique_001").first()
    assert m is not None
    assert m.content == "Hello pytest"


def test_duplicate_message_not_processed_twice(
    meta_test_secret: str,
    sync_client: TestClient,
    db_session: Session,
    whatsapp_social_account: tuple,
) -> None:
    _, acc, phone_number_id = whatsapp_social_account
    mid = "wamid.dedup_same_mid_002"
    payload = _wa_payload(phone_number_id, "1555111222333", mid, "Duplicate probe")
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sig = _hub_sig256(body, meta_test_secret)

    with patch("app.workers.webhook_tasks.process_and_reply.delay") as delay_mock:
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
    assert delay_mock.call_count == 1

    rows = (
        db_session.query(Message)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(
            Conversation.social_account_id == acc.id,
            Message.platform_message_id == mid,
        )
        .all()
    )
    assert len(rows) == 1


def _fb_comment_payload(page_id: str, comment_id: str, post_id: str, text: str) -> dict:
    return {
        "object": "page",
        "entry": [
            {
                "id": page_id,
                "changes": [
                    {
                        "field": "feed",
                        "value": {
                            "item": "comment",
                            "verb": "add",
                            "comment_id": comment_id,
                            "post_id": post_id,
                            "from": {"id": "user_123", "name": "Test User"},
                            "message": text,
                        },
                    }
                ],
            }
        ],
    }


def test_facebook_feed_comment_creates_conversation(
    meta_test_secret: str,
    sync_client: TestClient,
    db_session: Session,
    facebook_social_account: tuple,
) -> None:
    _, acc, page_id = facebook_social_account
    payload = _fb_comment_payload(page_id, "cmt_unique_001", "post_999", "Nice product!")
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sig = _hub_sig256(body, meta_test_secret)

    with patch("app.workers.webhook_tasks.process_and_reply.delay") as delay_mock, patch(
        "app.services.facebook_service.FacebookService.fetch_post_context",
        new_callable=AsyncMock,
        return_value="Summer sale — 20% off",
    ):
        r = sync_client.post(
            "/webhooks/meta",
            content=body,
            headers={"Content-Type": "application/json", "X-Hub-Signature-256": sig},
        )
    assert r.status_code == 200
    delay_mock.assert_called_once()

    conv = (
        db_session.query(Conversation)
        .filter(
            Conversation.social_account_id == acc.id,
            Conversation.platform_conversation_id == "comment:cmt_unique_001",
        )
        .first()
    )
    assert conv is not None
    assert conv.facebook_thread_type == "comment"
    assert conv.post_context == "Summer sale — 20% off"
    m = db_session.query(Message).filter(Message.platform_message_id == "cmt_unique_001").first()
    assert m is not None
    assert m.content == "Nice product!"


def test_facebook_comment_deduped(
    meta_test_secret: str,
    sync_client: TestClient,
    db_session: Session,
    facebook_social_account: tuple,
) -> None:
    _, acc, page_id = facebook_social_account
    payload = _fb_comment_payload(page_id, "cmt_dedup_002", "post_888", "Duplicate comment")
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sig = _hub_sig256(body, meta_test_secret)

    with patch("app.workers.webhook_tasks.process_and_reply.delay") as delay_mock, patch(
        "app.services.facebook_service.FacebookService.fetch_post_context",
        new_callable=AsyncMock,
        return_value=None,
    ):
        sync_client.post(
            "/webhooks/meta",
            content=body,
            headers={"Content-Type": "application/json", "X-Hub-Signature-256": sig},
        )
        sync_client.post(
            "/webhooks/meta",
            content=body,
            headers={"Content-Type": "application/json", "X-Hub-Signature-256": sig},
        )
    assert delay_mock.call_count == 1
    rows = db_session.query(Message).filter(Message.platform_message_id == "cmt_dedup_002").all()
    assert len(rows) == 1
