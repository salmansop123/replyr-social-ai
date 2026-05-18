SYSTEM_PROMPT_TEMPLATE = """You are a customer support representative for {business_name}.

About this business:
{ai_system_prompt}

{business_knowledge}

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
- Match the customer's energy: if they are casual, be casual
- Use uploaded business knowledge when relevant; do not invent facts not in the knowledge base"""


from app.config import settings
from app.services.openrouter_client import OpenRouterClient

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
    """Customer-facing AI via OpenRouter — all inference goes through OpenRouterClient."""

    def __init__(self, client: OpenRouterClient | None = None) -> None:
        self._llm = client or OpenRouterClient()

    async def generate_reply(
        self,
        organization,
        conversation_history: list[dict],
        customer_message: str,
        post_context: str = "",
        business_knowledge: str = "",
    ) -> str:
        knowledge_block = ""
        if business_knowledge and business_knowledge.strip():
            knowledge_block = "## Business Knowledge\n\n" + business_knowledge.strip()

        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            business_name=organization.name,
            ai_system_prompt=organization.ai_system_prompt or "",
            business_knowledge=knowledge_block,
            post_context=post_context or "general inquiry",
            language=_language_label(organization.ai_language),
            tone=organization.ai_tone or "friendly",
        )
        messages: list[dict] = [{"role": "system", "content": system_prompt}]
        messages.extend(conversation_history[-10:])
        messages.append({"role": "user", "content": customer_message})

        if not self._llm.is_configured:
            return "Thanks for reaching out! We'll get back to you shortly."

        try:
            return await self._llm.chat_completion(
                messages,
                max_tokens=150,
                temperature=0.7,
            )
        except Exception:
            return "Thanks for reaching out! We'll get back to you shortly."

    async def _complete_short(self, user_prompt: str, max_tokens: int = 48) -> str:
        if not self._llm.is_configured:
            return ""
        try:
            return await self._llm.chat_completion(
                [{"role": "user", "content": user_prompt}],
                max_tokens=max_tokens,
                temperature=0.2,
            )
        except Exception:
            return ""

    async def detect_sentiment(self, text: str) -> str:
        raw = (text or "").strip()
        if not raw:
            return "neutral"
        if not self._llm.is_configured:
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
        raw = (text or "").strip()
        if not raw:
            return False
        if not self._llm.is_configured:
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
