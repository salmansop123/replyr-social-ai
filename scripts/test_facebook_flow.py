#!/usr/bin/env python3
"""
ENH-006 — Simulate Facebook Page webhooks (feed comment + Messenger DM) against local API.

Requires:
  - API on http://localhost:8000
  - backend/.env: META_APP_SECRET
  - SocialAccount with platform=facebook and platform_user_id = WEBHOOK_TEST_PAGE_ID

Optional:
  - TEST_JWT for GET /api/v1/conversations after ingest
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
    if not secret:
        print("META_APP_SECRET is not set.", file=sys.stderr)
        return 1

    page_id = (os.environ.get("WEBHOOK_TEST_PAGE_ID") or "").strip()
    if not page_id:
        print("Set WEBHOOK_TEST_PAGE_ID to your Facebook SocialAccount.platform_user_id.", file=sys.stderr)
        return 1

    suffix = uuid.uuid4().hex[:8]
    comment_id = os.environ.get("WEBHOOK_TEST_COMMENT_ID", f"cmt_script_{suffix}")
    post_id = os.environ.get("WEBHOOK_TEST_POST_ID", f"post_script_{suffix}")
    mid = os.environ.get("WEBHOOK_TEST_DM_MID", f"mid_script_{suffix}")
    sender_id = os.environ.get("WEBHOOK_TEST_SENDER_ID", "fb_sender_script")

    comment_text = os.environ.get("WEBHOOK_TEST_COMMENT_TEXT", "Interested in pricing from script")
    dm_text = os.environ.get("WEBHOOK_TEST_DM_TEXT", "Hello via Messenger script")

    with httpx.Client(timeout=30.0) as client:
        print("--- Facebook comment (feed) ---")
        r1 = post_webhook(
            client,
            build_comment_payload(page_id, comment_id, post_id, comment_text),
            secret,
        )
        print("Status:", r1.status_code, r1.text[:200])

        print("\n--- Facebook DM (messaging) ---")
        r2 = post_webhook(client, build_dm_payload(page_id, sender_id, mid, dm_text), secret)
        print("Status:", r2.status_code, r2.text[:200])

        print("\n--- Duplicate comment (expect dedupe) ---")
        r3 = post_webhook(
            client,
            build_comment_payload(page_id, comment_id, post_id, comment_text),
            secret,
        )
        print("Status:", r3.status_code, r3.text[:200])

    print("\nWaiting 3s for background processing…")
    time.sleep(3)

    jwt = (os.environ.get("TEST_JWT") or "").strip()
    if not jwt:
        print("Set TEST_JWT to verify conversations via API.")
        return 0 if r1.status_code == 200 and r2.status_code == 200 else 1

    headers = {"Authorization": f"Bearer {jwt}"}
    with httpx.Client(timeout=30.0) as client:
        cr = client.get(
            f"{BASE}/api/v1/conversations",
            headers=headers,
            params={"limit": 20, "platform": "facebook"},
        )
    print("Conversations:", cr.status_code)
    print(cr.text[:2500])
    return 0 if cr.status_code == 200 else 1


if __name__ == "__main__":
    raise SystemExit(main())
