SYSTEM_PROMPT_TEMPLATE = """You are a customer support representative for {business_name}.

About this business:
{ai_system_prompt}

The customer is messaging you on WhatsApp about this topic/context:
{post_context}

Your communication rules:
- Respond in {language}
- Tone: {tone}
- Keep replies SHORT: 1 to 3 sentences maximum
- Sound like a real human employee — warm, helpful, natural
- NEVER say you are an AI, a bot, or an automated system
- NEVER mention Replyr, OpenRouter, or any technology
- NEVER make promises about refunds, legal matters, or guarantees
- If the customer is angry, be empathetic and offer to help
- If you genuinely cannot answer, say you will follow up personally
- Do NOT use generic phrases like 'Great question!' or 'Certainly!'
- Match the customer's energy: if they are casual, be casual"""


import httpx

from app.config import settings

_LANG_LABELS = {
    "en": "English",
    "ar": "Arabic",
    "ur": "Urdu",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "tr": "Turkish",
    "hi": "Hindi",
    "bn": "Bengali",
    "id": "Indonesian",
    "pt": "Portuguese",
    "ru": "Russian",
    "ja": "Japanese",
    "zh": "Chinese (Simplified)",
}


def _language_label(code: str | None) -> str:
    if not code:
        return "English"
    c = code.lower().strip()
    if c == "auto":
        return "the same language as the customer (match their last message)"
    return _LANG_LABELS.get(c, code)


class AIAgentService:
    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

    async def generate_reply(
        self,
        organization,
        conversation_history: list[dict],
        customer_message: str,
        post_context: str = "",
    ) -> str:
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            business_name=organization.name,
            ai_system_prompt=organization.ai_system_prompt or "",
            post_context=post_context or "general inquiry",
            language=_language_label(organization.ai_language),
            tone=organization.ai_tone or "friendly",
        )
        messages: list[dict] = [{"role": "system", "content": system_prompt}]
        messages.extend(conversation_history[-10:])
        messages.append({"role": "user", "content": customer_message})

        if not settings.openrouter_api_key:
            return "Thanks for reaching out! We'll get back to you shortly."

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                self.OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "HTTP-Referer": settings.frontend_url,
                    "X-Title": "Replyr AI",
                },
                json={
                    "model": settings.openrouter_default_model,
                    "messages": messages,
                    "max_tokens": 150,
                    "temperature": 0.7,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

    async def _complete_short(self, user_prompt: str, max_tokens: int = 48) -> str:
        """Single-turn completion for classification-style prompts."""
        if not settings.openrouter_api_key:
            return ""
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                self.OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "HTTP-Referer": settings.frontend_url,
                    "X-Title": "Replyr AI",
                },
                json={
                    "model": settings.openrouter_default_model,
                    "messages": [{"role": "user", "content": user_prompt}],
                    "max_tokens": max_tokens,
                    "temperature": 0.2,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

    async def detect_sentiment(self, text: str) -> str:
        """Return one of: positive, neutral, negative."""
        raw = (text or "").strip()
        if not raw:
            return "neutral"
        if not settings.openrouter_api_key:
            return _heuristic_sentiment(raw)
        prompt = (
            "Classify the sentiment of this customer message as exactly one word: "
            "positive, neutral, or negative. No punctuation or explanation.\n\nMessage:\n"
            f"{raw[:2000]}"
        )
        try:
            label = (await self._complete_short(prompt, max_tokens=8)).lower()
            for allowed in ("positive", "neutral", "negative"):
                if allowed in label:
                    return allowed
        except Exception:
            pass
        return _heuristic_sentiment(raw)

    async def detect_lead_intent(self, text: str) -> bool:
        """Whether the message suggests purchase / signup / pricing intent."""
        raw = (text or "").strip()
        if not raw:
            return False
        if not settings.openrouter_api_key:
            return _heuristic_lead_intent(raw)
        prompt = (
            "Does this message show clear sales or lead intent (pricing, demo, signup, purchase)? "
            "Reply exactly yes or no.\n\nMessage:\n"
            f"{raw[:2000]}"
        )
        try:
            ans = (await self._complete_short(prompt, max_tokens=4)).lower()
            return ans.startswith("y")
        except Exception:
            return _heuristic_lead_intent(raw)


def _heuristic_sentiment(text: str) -> str:
    t = text.lower()
    negatives = ("angry", "frustrated", "terrible", "awful", "hate", "worst", "refund", "useless", "disappointed")
    positives = ("thanks", "thank you", "great", "love", "awesome", "perfect", "excellent", "amazing")
    neg = sum(1 for w in negatives if w in t)
    pos = sum(1 for w in positives if w in t)
    if neg > pos:
        return "negative"
    if pos > neg:
        return "positive"
    return "neutral"


def _heuristic_lead_intent(text: str) -> bool:
    t = text.lower()
    keys = (
        "price",
        "pricing",
        "cost",
        "buy",
        "purchase",
        "quote",
        "demo",
        "trial",
        "sign up",
        "signup",
        "interested in",
        "how much",
        "package",
        "plan",
        "subscribe",
    )
    return any(k in t for k in keys)
