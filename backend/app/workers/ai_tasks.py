import asyncio
import random
import time
import uuid

from sqlalchemy.orm import joinedload

from app.config import settings
from app.database import SessionLocal
from app.models.conversation import Conversation
from app.models.message import Message
from app.services.ai_agent import AIAgentService
from app.services.reply_service import post_reply_to_platform
from app.workers.celery_app import celery


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def process_and_reply(self, conversation_id: str) -> None:
    db = SessionLocal()
    try:
        convo = (
            db.query(Conversation)
            .options(joinedload(Conversation.organization))
            .filter(Conversation.id == uuid.UUID(conversation_id))
            .first()
        )
        if not convo:
            return
        if convo.is_human_takeover:
            return
        if convo.status == "ignored":
            return

        history_msgs = (
            db.query(Message)
            .filter(Message.conversation_id == convo.id)
            .order_by(Message.created_at.asc())
            .all()
        )
        history = [
            {"role": "assistant" if m.direction == "outbound" else "user", "content": m.content} for m in history_msgs
        ]
        latest = history_msgs[-1].content if history_msgs else ""
        agent = AIAgentService()
        reply_text = asyncio.run(
            agent.generate_reply(
                organization=convo.organization,
                conversation_history=history[:-1] if history else [],
                customer_message=latest,
                post_context=convo.post_context or "",
            )
        )
        org = convo.organization
        delay = random.randint(org.reply_delay_min, org.reply_delay_max)
        time.sleep(delay)
        asyncio.run(post_reply_to_platform(convo, reply_text, db))

        out_msg = Message(
            conversation_id=convo.id,
            direction="outbound",
            content=reply_text,
            ai_generated=True,
            ai_model=settings.openrouter_default_model,
            reply_delay_seconds=delay,
        )
        db.add(out_msg)
        convo.status = "answered"
        db.commit()
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc) from exc
    finally:
        db.close()
