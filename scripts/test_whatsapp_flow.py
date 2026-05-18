#!/usr/bin/env python3
"""
Phase 2 — Simulate a Meta WhatsApp Cloud API webhook against local API.

Requires:
  - ./start.sh running (API :8000, Celery, Postgres, Redis)
  - backend/.env: META_APP_SECRET
  - SocialAccount with platform_user_id = phone_number_id
    OR META_WHATSAPP_PHONE_NUMBER_ID + META_WHATSAPP_ACCESS_TOKEN (dev auto-provision)

Usage:
  WEBHOOK_TEST_PHONE_NUMBER_ID=123456789 python scripts/test_whatsapp_flow.py
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

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get("REPLYR_API_URL", "http://localhost:8000").rstrip("/")


def _load_dotenv() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    for name in (".env", ".env.local"):
        p = ROOT / "backend" / name
        if p.is_file():
            load_dotenv(p)


def _sign_body(body: bytes, secret: str) -> str:
    return "sha256=" + hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()


def build_whatsapp_cloud_payload(
    phone_number_id: str,
    customer_wa_id: str,
    text: str,
    mid: str,
) -> dict:
    return {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "waba_script_test",
                "changes": [
                    {
                        "field": "messages",
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {
                                "display_phone_number": "15550000000",
                                "phone_number_id": phone_number_id,
                            },
                            "contacts": [
                                {
                                    "profile": {"name": "Script Tester"},
                                    "wa_id": customer_wa_id,
                                }
                            ],
                            "messages": [
                                {
                                    "from": customer_wa_id,
                                    "id": mid,
                                    "timestamp": str(int(time.time())),
                                    "type": "text",
                                    "text": {"body": text},
                                }
                            ],
                        },
                    }
                ],
            }
        ],
    }


def main() -> int:
    _load_dotenv()
    secret = (os.environ.get("META_APP_SECRET") or "").strip()
    if not secret or secret == "your_meta_app_secret":
        print("Set META_APP_SECRET in backend/.env", file=sys.stderr)
        return 1

    phone_number_id = (os.environ.get("WEBHOOK_TEST_PHONE_NUMBER_ID") or os.environ.get("META_WHATSAPP_PHONE_NUMBER_ID") or "").strip()
    if not phone_number_id:
        print("Set WEBHOOK_TEST_PHONE_NUMBER_ID or META_WHATSAPP_PHONE_NUMBER_ID", file=sys.stderr)
        return 1

    customer_id = os.environ.get("WEBHOOK_TEST_CUSTOMER_WA_ID", "1555987654321")
    mid = os.environ.get("WEBHOOK_TEST_MESSAGE_MID", f"wamid.script_{int(time.time())}")
    text = os.environ.get("WEBHOOK_TEST_MESSAGE_TEXT", "Hello from scripts/test_whatsapp_flow.py")

    payload = build_whatsapp_cloud_payload(phone_number_id, customer_id, text, mid)
    body_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sig = _sign_body(body_bytes, secret)

    print("POST", f"{BASE}/webhooks/meta")
    print("phone_number_id:", phone_number_id)

    with httpx.Client(timeout=30.0) as client:
        health = client.get(f"{BASE}/health")
        if health.status_code != 200:
            print("API not healthy — run ./start.sh first", file=sys.stderr)
            return 1

        r = client.post(
            f"{BASE}/webhooks/meta",
            content=body_bytes,
            headers={
                "Content-Type": "application/json",
                "X-Hub-Signature-256": sig,
            },
        )
    print("Webhook response:", r.status_code, r.text[:200])

    if r.status_code != 200:
        return 1

    wait = int(os.environ.get("WEBHOOK_TEST_WAIT_SEC", "5"))
    print(f"\nWaiting {wait}s for Celery + AI reply…")
    time.sleep(wait)

    token = (os.environ.get("TEST_JWT") or "dev-local").strip()
    headers = {"Authorization": f"Bearer {token}"}
    with httpx.Client(timeout=30.0) as client:
        client.post(f"{BASE}/api/v1/auth/dev-bootstrap")
        cr = client.get(
            f"{BASE}/api/v1/conversations",
            headers=headers,
            params={"limit": 20, "platform": "whatsapp"},
        )
    print("Conversations:", cr.status_code)
    if cr.status_code == 200:
        items = cr.json()
        if isinstance(items, list) and items:
            print(json.dumps(items[0], indent=2, default=str)[:1500])
        else:
            print("(no conversations yet — connect WhatsApp on Channels or set META_WHATSAPP_* in .env)")
    return 0 if cr.status_code == 200 else 1


if __name__ == "__main__":
    raise SystemExit(main())
