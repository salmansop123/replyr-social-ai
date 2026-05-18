"""GAP-006 — knowledge context must appear in OpenRouter payload."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.ai_agent import AIAgentService


@pytest.mark.asyncio
async def test_generate_reply_includes_business_knowledge_heading() -> None:
    captured: dict = {}

    async def fake_chat(messages, **kwargs):
        captured["messages"] = messages
        return "Sure, we can help with that."

    mock_client = MagicMock()
    mock_client.is_configured = True
    mock_client.chat_completion = AsyncMock(side_effect=fake_chat)

    org = MagicMock()
    org.name = "Acme Soaps"
    org.ai_system_prompt = "We sell handmade soap."
    org.ai_tone = "friendly"
    org.ai_language = "en"

    knowledge = "Lavender Dreams is $12 and ships free over $50."

    agent = AIAgentService(client=mock_client)
    reply = await agent.generate_reply(
        organization=org,
        conversation_history=[],
        customer_message="How much is Lavender Dreams?",
        post_context="",
        business_knowledge=knowledge,
    )

    assert reply == "Sure, we can help with that."
    messages = captured["messages"]
    system = messages[0]["content"]
    assert "## Business Knowledge" in system
    assert knowledge in system
    assert "Lavender Dreams" in system
