#!/usr/bin/env python3
"""
Phase 3 — Simulate Facebook Page webhooks (feed comment + Messenger DM).

Requires:
  - ./start.sh (API :8000, Celery)
  - META_APP_SECRET in backend/.env
  - SocialAccount platform=facebook, platform_user_id = WEBHOOK_TEST_PAGE_ID

Usage:
  WEBHOOK_TEST_PAGE_ID=123456789 META_APP_SECRET=... python3 scripts/test_facebook_flow.py
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import sys
import time
import uuid
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get("REPLYR_API_URL", "http://localhost:8000").rstrip("/")


def _ensure_auth_token(client: httpx.Client) -> str:
    token = (os.environ.get("TEST_JWT") or "").strip()
    if token:
        return token
    email = f"script_{uuid.uuid4().hex[:10]}@example.com"
    r = client.post(
        f"{BASE}/api/v1/auth/sign-up",
        json={"email": email, "password": "scriptpass123", "business_name": "Script Test Org"},
    )
    r.raise_for_status()
    return r.json()["access_token"]


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


def build_comment_payload(page_id: str, comment_id: str, post_id: str, text: str) -> dict:
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
                            "from": {"id": "fb_user_script", "name": "Script Tester"},
                            "message": text,
                        },
                    }
                ],
            }
        ],
    }


def build_dm_payload(page_id: str, sender_id: str, mid: str, text: str) -> dict:
    return {
        "object": "page",
        "entry": [
            {
                "id": page_id,
                "messaging": [
                    {
                        "sender": {"id": sender_id},
                        "recipient": {"id": page_id},
                        "timestamp": str(int(time.time())),
                        "message": {"mid": mid, "text": text},
                    }
                ],
            }
        ],
    }


def build_dm_changes_payload(page_id: str, sender_id: str, mid: str, text: str) -> dict:
    """Alternate Meta shape: entry.changes[].field == messages."""
    return {
        "object": "page",
        "entry": [
            {
                "id": page_id,
                "changes": [
                    {
                        "field": "messages",
                        "value": {
                            "sender": {"id": sender_id},
                            "recipient": {"id": page_id},
                            "timestamp": str(int(time.time())),
                            "message": {"mid": mid, "text": text},
                        },
                    }
                ],
            }
        ],
    }


def post_webhook(client: httpx.Client, payload: dict, secret: str) -> httpx.Response:
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sig = _sign_body(body, secret)
    return client.post(
        f"{BASE}/webhooks/meta",
        content=body,
        headers={"Content-Type": "application/json", "X-Hub-Signature-256": sig},
    )


def main() -> int:
    _load_dotenv()
    secret = (os.environ.get("META_APP_SECRET") or "").strip()
    if not secret or secret == "your_meta_app_secret":
        print("Set META_APP_SECRET in backend/.env", file=sys.stderr)
        return 1

    page_id = (os.environ.get("WEBHOOK_TEST_PAGE_ID") or "").strip()
    if not page_id:
        print("Set WEBHOOK_TEST_PAGE_ID to your Facebook Page ID (SocialAccount.platform_user_id).", file=sys.stderr)
        return 1

    suffix = uuid.uuid4().hex[:8]
    comment_id = os.environ.get("WEBHOOK_TEST_COMMENT_ID", f"cmt_script_{suffix}")
    post_id = os.environ.get("WEBHOOK_TEST_POST_ID", f"post_script_{suffix}")
    mid = os.environ.get("WEBHOOK_TEST_DM_MID", f"mid_script_{suffix}")
    mid2 = f"mid_changes_{suffix}"
    sender_id = os.environ.get("WEBHOOK_TEST_SENDER_ID", f"fb_sender_{suffix}")

    comment_text = os.environ.get("WEBHOOK_TEST_COMMENT_TEXT", "Interested in pricing from script")
    dm_text = os.environ.get("WEBHOOK_TEST_DM_TEXT", "Hello via Messenger script")

    with httpx.Client(timeout=30.0) as client:
        if client.get(f"{BASE}/health").status_code != 200:
            print("API not healthy — run ./start.sh", file=sys.stderr)
            return 1

        print("--- Facebook comment (feed) ---")
        r1 = post_webhook(client, build_comment_payload(page_id, comment_id, post_id, comment_text), secret)
        print("Status:", r1.status_code, r1.text[:200])

        print("\n--- Facebook DM (messaging) ---")
        r2 = post_webhook(client, build_dm_payload(page_id, sender_id, mid, dm_text), secret)
        print("Status:", r2.status_code, r2.text[:200])

        print("\n--- Facebook DM (changes.messages) ---")
        r2b = post_webhook(
            client,
            build_dm_changes_payload(page_id, f"{sender_id}_2", mid2, dm_text + " (changes)"),
            secret,
        )
        print("Status:", r2b.status_code, r2b.text[:200])

        print("\n--- Duplicate comment (expect dedupe) ---")
        r3 = post_webhook(
            client,
            build_comment_payload(page_id, comment_id, post_id, comment_text),
            secret,
        )
        print("Status:", r3.status_code, r3.text[:200])

    wait = int(os.environ.get("WEBHOOK_TEST_WAIT_SEC", "5"))
    print(f"\nWaiting {wait}s for Celery…")
    time.sleep(wait)

    with httpx.Client(timeout=30.0) as client:
        token = _ensure_auth_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        cr = client.get(
            f"{BASE}/api/v1/conversations",
            headers=headers,
            params={"limit": 20, "platform": "facebook"},
        )
    print("Conversations:", cr.status_code)
    if cr.status_code == 200:
        data = cr.json()
        if isinstance(data, list) and data:
            print(json.dumps(data[0], indent=2, default=str)[:1500])
        else:
            print("(no Facebook threads — connect a Page or check WEBHOOK_TEST_PAGE_ID)")
    return 0 if r1.status_code == 200 and r2.status_code == 200 else 1


if __name__ == "__main__":
    raise SystemExit(main())
