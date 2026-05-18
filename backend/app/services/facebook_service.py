"""Facebook Graph API client — comments, Messenger, post context."""

from __future__ import annotations

import asyncio
import logging

import httpx

logger = logging.getLogger(__name__)

META_GRAPH = "https://graph.facebook.com/v18.0"
MAX_RETRIES = 5


class FacebookService:
    async def _request_with_retry(
        self,
        method: str,
        url: str,
        *,
        headers: dict | None = None,
        params: dict | None = None,
        json_body: dict | None = None,
    ) -> httpx.Response:
        backoff = 1.0
        last: httpx.Response | None = None
        for attempt in range(MAX_RETRIES):
            async with httpx.AsyncClient(timeout=20.0) as client:
                last = await client.request(
                    method,
                    url,
                    headers=headers,
                    params=params,
                    json=json_body,
                )
            if last.status_code != 429:
                return last
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 60.0)
        assert last is not None
        return last

    async def post_comment_reply(
        self,
        comment_id: str,
        reply_text: str,
        access_token: str,
    ) -> dict:
        url = f"{META_GRAPH}/{comment_id}/comments"
        headers = {"Authorization": f"Bearer {access_token}"}
        payload = {"message": reply_text[:8000]}
        r = await self._request_with_retry("POST", url, headers=headers, json_body=payload)
        if r.status_code not in (200, 201):
            raise RuntimeError(f"Facebook comment reply failed {r.status_code}: {r.text[:500]}")
        return r.json()

    async def post_dm_reply(
        self,
        recipient_id: str,
        reply_text: str,
        page_id: str,
        access_token: str,
    ) -> dict:
        url = f"{META_GRAPH}/{page_id}/messages"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "recipient": {"id": recipient_id},
            "message": {"text": reply_text[:2000]},
            "messaging_type": "RESPONSE",
        }
        r = await self._request_with_retry("POST", url, headers=headers, json_body=payload)
        if r.status_code not in (200, 201):
            raise RuntimeError(f"Facebook DM reply failed {r.status_code}: {r.text[:500]}")
        return r.json()

    async def fetch_post_context(self, post_id: str, access_token: str) -> str | None:
        url = f"{META_GRAPH}/{post_id}"
        params = {"fields": "message,story", "access_token": access_token}
        r = await self._request_with_retry("GET", url, params=params)
        if r.status_code != 200:
            logger.warning("Facebook post context fetch failed %s: %s", r.status_code, r.text[:300])
            return None
        data = r.json()
        message = (data.get("message") or "").strip()
        story = (data.get("story") or "").strip()
        if message and story:
            return f"{message}\n\n{story}"
        return message or story or None
