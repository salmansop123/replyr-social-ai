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

_LANG_LABELS = {"en": "English", "es": "Spanish", "fr": "French", "de": "German", "ar": "Arabic"}


def _language_label(code: str | None) -> str:
    if not code:
        return "English"
    return _LANG_LABELS.get(code.lower(), code)


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
