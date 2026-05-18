"""Meta (WhatsApp / Facebook) webhook — Graph API v18.0 compatible."""

from __future__ import annotations

import hashlib
import hmac
import json
import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse

from app.config import settings
from app.workers.webhook_tasks import process_meta_webhook

logger = logging.getLogger(__name__)

router = APIRouter(tags=["webhooks"])


@router.get("/meta")
async def verify_meta_webhook(
    hub_mode: str = Query(..., alias="hub.mode"),
    hub_challenge: str = Query(..., alias="hub.challenge"),
    hub_verify_token: str = Query(..., alias="hub.verify_token"),
):
    """Meta subscription verification (must respond before other app logic matters for registration)."""
    if hub_verify_token != settings.meta_verify_token:
        raise HTTPException(status_code=403, detail="Invalid verify token")
    if hub_mode == "subscribe":
        try:
            challenge_int = int(hub_challenge)
        except (TypeError, ValueError) as e:
            raise HTTPException(status_code=400, detail="Invalid challenge") from e
        return PlainTextResponse(content=str(challenge_int))
    raise HTTPException(status_code=400, detail="Invalid hub.mode")


@router.post("/meta")
async def receive_meta_event(request: Request, background_tasks: BackgroundTasks):
    """
    Ingest Meta webhook events. Always ACK with 200 quickly; never run AI inline.
    Invalid HMAC: log warning, still 200 (Meta retries 4xx aggressively).
    """
    try:
        body_bytes = await request.body()
        sig = request.headers.get("X-Hub-Signature-256", "")
        if not settings.meta_app_secret:
            logger.warning("META_APP_SECRET not set; skipping HMAC verification and payload dispatch")
            return {"status": "ok"}

        expected = "sha256=" + hmac.new(
            settings.meta_app_secret.encode(),
            body_bytes,
            hashlib.sha256,
        ).hexdigest()
        try:
            valid = hmac.compare_digest(sig, expected)
        except ValueError:
            valid = False

        if not valid:
            logger.warning("Meta webhook X-Hub-Signature-256 verification failed; ACK 200 without dispatch")
            return {"status": "ok"}

        try:
            payload = json.loads(body_bytes.decode("utf-8") or "{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            payload = {}

        background_tasks.add_task(process_meta_webhook, payload)
        return {"status": "ok"}
    except Exception:
        logger.exception("Meta webhook POST handler error; returning 200 ACK")
        return {"status": "ok"}
