#!/usr/bin/env python3
"""
Simulate a Meta WhatsApp-style webhook POST against a running local API.

Requires:
  - API listening on http://localhost:8000 (e.g. uvicorn)
  - backend/.env: META_APP_SECRET must match the app verifying signatures
  - A SocialAccount row with platform_user_id equal to WEBHOOK_TEST_PHONE_NUMBER_ID (entry id)

Optional:
  - TEST_JWT: Bearer token for GET /api/v1/conversations (Clerk JWT for a user in that org)
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import sys
import time
from pathlib import Path

import httpx

BASE = "http://localhost:8000"


def _load_dotenv() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    env_file = Path(__file__).resolve().parents[1] / "backend" / ".env"
    if env_file.is_file():
        load_dotenv(env_file)


def _sign_body(body: bytes, secret: str) -> str:
    return "sha256=" + hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()


def build_whatsapp_payload(phone_number_id: str, customer_id: str, text: str, mid: str) -> dict:
    """Same entry/messaging/message shape as backend/app/workers/webhook_tasks._handle_dm."""
    return {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": phone_number_id,
                "messaging": [
                    {
                        "sender": {"id": customer_id},
                        "recipient": {"id": phone_number_id},
                        "timestamp": str(int(time.time())),
                        "message": {
                            "mid": mid,
                            "type": "text",
                            "text": {"body": text},
                        },
                    }
                ],
            }
        ],
    }


def main() -> int:
    _load_dotenv()
    secret = (os.environ.get("META_APP_SECRET") or "").strip()
    if not secret:
        print("META_APP_SECRET is not set (load backend/.env or export it).", file=sys.stderr)
        return 1

    phone_number_id = (os.environ.get("WEBHOOK_TEST_PHONE_NUMBER_ID") or "").strip()
    if not phone_number_id:
        print(
            "Set WEBHOOK_TEST_PHONE_NUMBER_ID to your SocialAccount.platform_user_id / WABA phone number id.",
            file=sys.stderr,
        )
        return 1

    customer_id = os.environ.get("WEBHOOK_TEST_CUSTOMER_WA_ID", "1555987654321")
    mid = os.environ.get("WEBHOOK_TEST_MESSAGE_MID", f"wamid.script_{int(time.time())}")
    text = os.environ.get("WEBHOOK_TEST_MESSAGE_TEXT", "Hello from scripts/test_whatsapp_flow.py")

    payload = build_whatsapp_payload(phone_number_id, customer_id, text, mid)
    body_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sig = _sign_body(body_bytes, secret)

    print("POST", f"{BASE}/webhooks/meta")
    print("Payload entry id (phone_number_id):", phone_number_id)

    with httpx.Client(timeout=30.0) as client:
        r = client.post(
            f"{BASE}/webhooks/meta",
            content=body_bytes,
            headers={
                "Content-Type": "application/json",
                "X-Hub-Signature-256": sig,
            },
        )
    print("Response:", r.status_code, r.text[:500])

    print("\nWaiting 3s for background webhook processing…")
    time.sleep(3)

    jwt = (os.environ.get("TEST_JWT") or "").strip()
    if not jwt:
        print(
            "Skipping GET /api/v1/conversations (set TEST_JWT to a Clerk Bearer token for your org)."
        )
        return 0

    headers = {"Authorization": f"Bearer {jwt}"}
    with httpx.Client(timeout=30.0) as client:
        cr = client.get(f"{BASE}/api/v1/conversations", headers=headers, params={"limit": 50})
    print("Conversations GET:", cr.status_code, cr.text[:2000])
    return 0 if cr.status_code == 200 else 1


if __name__ == "__main__":
    raise SystemExit(main())
