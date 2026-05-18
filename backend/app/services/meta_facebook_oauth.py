"""Facebook Login + Page token exchange (Graph API v18.0)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import time
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

META_GRAPH = "https://graph.facebook.com/v18.0"
FB_OAUTH_DIALOG = "https://www.facebook.com/v18.0/dialog/oauth"

FACEBOOK_PAGE_SCOPES = (
    "pages_manage_posts",
    "pages_messaging",
    "pages_read_engagement",
    "pages_show_list",
    "pages_manage_metadata",
)


def facebook_oauth_redirect_uri() -> str:
    """OAuth callback must hit the API host — not the ngrok URL used only for webhooks."""
    if settings.meta_oauth_redirect_uri:
        return settings.meta_oauth_redirect_uri.strip()
    api_base = (settings.webhook_base_url or "").strip()
    if api_base.startswith("http://localhost") or api_base.startswith("http://127.0.0.1"):
        return f"{api_base.rstrip('/')}/api/v1/social/callback/facebook"
    return "http://localhost:8000/api/v1/social/callback/facebook"


def sign_oauth_state(organization_id: uuid.UUID, user_id: uuid.UUID) -> str:
    payload = {
        "org_id": str(organization_id),
        "user_id": str(user_id),
        "exp": int(time.time()) + 3600,
    }
    raw = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode()
    sig = hmac.new(settings.secret_key.encode("utf-8"), raw.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{raw}.{sig}"


def verify_oauth_state(state: str) -> tuple[uuid.UUID, uuid.UUID]:
    if not state or "." not in state:
        raise ValueError("Invalid OAuth state")
    raw, sig = state.rsplit(".", 1)
    expected = hmac.new(settings.secret_key.encode("utf-8"), raw.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        raise ValueError("Invalid OAuth state signature")
    try:
        payload = json.loads(base64.urlsafe_b64decode(raw.encode("utf-8")))
    except (json.JSONDecodeError, ValueError) as e:
        raise ValueError("Invalid OAuth state payload") from e
    if int(payload.get("exp", 0)) < int(time.time()):
        raise ValueError("OAuth state expired")
    return uuid.UUID(payload["org_id"]), uuid.UUID(payload["user_id"])


def build_facebook_authorization_url(state: str) -> str:
    if not settings.meta_app_id:
        raise ValueError("META_APP_ID is not configured")
    params = {
        "client_id": settings.meta_app_id,
        "redirect_uri": facebook_oauth_redirect_uri(),
        "state": state,
        "scope": ",".join(FACEBOOK_PAGE_SCOPES),
        "response_type": "code",
    }
    return f"{FB_OAUTH_DIALOG}?{urlencode(params)}"


async def exchange_code_for_user_token(code: str) -> str:
    if not settings.meta_app_id or not settings.meta_app_secret:
        raise ValueError("META_APP_ID and META_APP_SECRET are required")
    params = {
        "client_id": settings.meta_app_id,
        "client_secret": settings.meta_app_secret,
        "redirect_uri": facebook_oauth_redirect_uri(),
        "code": code,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{META_GRAPH}/oauth/access_token", params=params)
        if r.status_code != 200:
            raise ValueError(f"Code exchange failed: {r.text[:500]}")
        data = r.json()
    token = data.get("access_token")
    if not token:
        raise ValueError("No access_token in code exchange response")
    return str(token)


async def exchange_long_lived_user_token(short_lived_token: str) -> tuple[str, datetime | None]:
    params = {
        "grant_type": "fb_exchange_token",
        "client_id": settings.meta_app_id,
        "client_secret": settings.meta_app_secret,
        "fb_exchange_token": short_lived_token,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{META_GRAPH}/oauth/access_token", params=params)
        if r.status_code != 200:
            raise ValueError(f"Long-lived token exchange failed: {r.text[:500]}")
        data = r.json()
    token = str(data.get("access_token") or "")
    if not token:
        raise ValueError("No access_token in long-lived exchange response")
    expires_in = data.get("expires_in")
    expires_at = None
    if expires_in:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
    return token, expires_at


async def list_managed_pages(user_access_token: str) -> list[dict]:
    pages: list[dict] = []
    url = f"{META_GRAPH}/me/accounts"
    params: dict = {
        "fields": "id,name,access_token,category",
        "access_token": user_access_token,
        "limit": 100,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        while url:
            r = await client.get(url, params=params)
            if r.status_code != 200:
                raise ValueError(f"Failed to list pages: {r.text[:500]}")
            data = r.json()
            pages.extend(data.get("data") or [])
            next_url = (data.get("paging") or {}).get("next")
            url = next_url
            params = None
    return pages


async def subscribe_page_webhooks(page_id: str, page_access_token: str) -> tuple[bool, str]:
    url = f"{META_GRAPH}/{page_id}/subscribed_apps"
    params = {
        "subscribed_fields": "feed,messages,messaging_postbacks",
        "access_token": page_access_token,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(url, params=params)
        if r.status_code == 200:
            return True, ""
        return False, r.text[:500]


async def refresh_long_lived_token(current_token: str) -> tuple[str, datetime | None]:
    """Exchange an expiring long-lived token for a new one (60-day rotation)."""
    params = {
        "grant_type": "fb_exchange_token",
        "client_id": settings.meta_app_id,
        "client_secret": settings.meta_app_secret,
        "fb_exchange_token": current_token,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{META_GRAPH}/oauth/access_token", params=params)
        if r.status_code != 200:
            raise ValueError(f"Token refresh failed: {r.text[:500]}")
        data = r.json()
    token = str(data.get("access_token") or "")
    if not token:
        raise ValueError("No access_token in refresh response")
    expires_at = None
    if data.get("expires_in"):
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(data["expires_in"]))
    return token, expires_at
