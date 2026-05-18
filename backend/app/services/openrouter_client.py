"""Central OpenRouter client for all LLM inference in Replyr."""

from __future__ import annotations

from typing import Any

import httpx

from app.config import settings


class OpenRouterClient:
    """Thin wrapper around OpenRouter chat completions — swap providers/models via config."""

    CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key if api_key is not None else settings.openrouter_api_key
        self.model = model if model is not None else settings.openrouter_default_model
        self.referer = settings.frontend_url

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": self.referer,
            "X-Title": "Replyr AI",
        }

    async def chat_completion(
        self,
        messages: list[dict[str, str]],
        *,
        max_tokens: int = 256,
        temperature: float = 0.7,
        model: str | None = None,
    ) -> str:
        if not self.is_configured:
            return ""
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                self.CHAT_URL,
                headers=self._headers(),
                json={
                    "model": model or self.model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
            )
            resp.raise_for_status()
            data: dict[str, Any] = resp.json()
            return data["choices"][0]["message"]["content"].strip()
