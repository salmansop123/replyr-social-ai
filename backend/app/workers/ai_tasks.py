"""Celery tasks for AI reply pipeline."""

from __future__ import annotations

import asyncio
import logging
import random
import time
import uuid

from sqlalchemy.orm import joinedload

from app.config import settings
from app.database import SessionLocal
from app.models.conversation import Conversation
from app.models.lead import Lead
from app.models.message import Message
from app.services.ai_agent import AIAgentService
from app.services.business_hours import is_within_business_hours
from app.services.escalation import message_matches_escalation
from app.services.knowledge_service import get_knowledge_context
from app.services.reply_limits import check_reply_limit
from app.services.reply_service import post_reply
from app.workers.celery_app import celery

logger = logging.getLogger(__name__)


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def process_and_reply(self, conversation_id: str) -> None:
    db = SessionLocal()
    try:
        try:
            cid = uuid.UUID(conversation_id)
        except ValueError:
            return

        convo = (
            db.query(Conversation)
            .options(
                joinedload(Conversation.organization),
                joinedload(Conversation.social_account),
            )
            .filter(Conversation.id == cid)
            .first()
        )

        if not convo:
            return

        if convo.is_human_takeover:
            return
        if convo.status in ("ignored", "escalated", "limit_reached"):
            return
        if convo.organization.subscription_tier == "cancelled":
            return

        if check_reply_limit(convo.organization, db):
            convo.status = "limit_reached"
            db.commit()
            return

        history_msgs = (
            db.query(Message)
            .filter(Message.conversation_id == convo.id)
            .order_by(Message.created_at.asc())
            .limit(20)
            .all()
        )

        history = [
            {"role": "assistant" if m.direction == "outbound" else "user", "content": m.content}
            for m in history_msgs
        ]

        latest_inbound = next(
            (m.content for m in reversed(history_msgs) if m.direction == "inbound"),
            None,
        )
        if not latest_inbound:
            return

        org = convo.organization

        if not getattr(org, "auto_reply_enabled", True):
            return

        if message_matches_escalation(latest_inbound, getattr(org, "escalation_keywords", None)):
            convo.is_human_takeover = True
            convo.status = "escalated"
            db.add(convo)
            db.commit()
            logger.info("Conversation %s escalated via keyword match", convo.id)
            return

        if not is_within_business_hours(org):
            outside = (getattr(org, "outside_hours_message", None) or "").strip()
            if outside:
                time.sleep(2)
                sent = asyncio.run(post_reply(convo, outside, db))
                if sent:
                    db.add(
                        Message(
                            conversation_id=convo.id,
                            direction="outbound",
                            content=outside,
                            ai_generated=False,
                            ai_model=None,
                            reply_delay_seconds=2,
                        )
                    )
                    convo.status = "answered"
                    db.add(convo)
                    db.commit()
            else:
                convo.status = "pending"
                db.add(convo)
                db.commit()
            return

        agent = AIAgentService()
        sentiment = asyncio.run(agent.detect_sentiment(latest_inbound))
        convo.sentiment = sentiment
        db.flush()

        is_lead = asyncio.run(agent.detect_lead_intent(latest_inbound))

        knowledge_ctx = get_knowledge_context(db, convo.organization_id)

        reply_text = asyncio.run(
            agent.generate_reply(
                organization=convo.organization,
                conversation_history=history[:-1],
                customer_message=latest_inbound,
                post_context=convo.post_context or "",
                business_knowledge=knowledge_ctx,
            )
        )

        delay = random.randint(
            convo.organization.reply_delay_min or 30,
            convo.organization.reply_delay_max or 90,
        )
        time.sleep(delay)

        sent = asyncio.run(post_reply(convo, reply_text, db))
        if not sent:
            logger.warning("Reply not sent for conversation %s; leaving status pending", convo.id)
            convo.status = "pending"
            db.commit()
            return

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

        if is_lead:
            lead_platform = convo.platform or "whatsapp"
            db.add(
                Lead(
                    organization_id=convo.organization_id,
                    conversation_id=convo.id,
                    source_platform=lead_platform,
                    name=convo.customer_name,
                )
            )
            logger.info(
                "Lead captured org=%s platform=%s thread_type=%s convo=%s",
                convo.organization_id,
                lead_platform,
                convo.facebook_thread_type,
                convo.id,
            )

        db.commit()

    except Exception as exc:
        db.rollback()
        logger.exception("process_and_reply failed for %s", conversation_id)
        raise self.retry(exc=exc) from exc
    finally:
        db.close()
