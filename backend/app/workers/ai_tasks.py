"""Celery tasks for AI reply pipeline."""

from __future__ import annotations

import asyncio
import random
import time
import uuid
from datetime import datetime, time as dt_time, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import func as sql_func
from sqlalchemy.orm import joinedload

from app.config import settings
from app.database import SessionLocal
from app.models.conversation import Conversation
from app.models.lead import Lead
from app.models.message import Message
from app.services.ai_agent import AIAgentService
from app.services.knowledge_service import get_knowledge_context
from app.services.reply_service import post_reply
from app.workers.celery_app import celery


def _monthly_ai_reply_limit(subscription_tier: str | None) -> int:
    """Outbound AI messages allowed per calendar month (UTC) by org tier."""
    t = (subscription_tier or "starter").lower()
    return {
        "starter": 500,
        "professional": 5_000,
        "enterprise": 1_000_000,
        "cancelled": 0,
    }.get(t, 500)


def _parse_hhmm(s: str | None) -> dt_time:
    raw = (s or "00:00").strip()
    parts = raw.split(":")
    h = int(parts[0])
    m = int(parts[1]) if len(parts) > 1 else 0
    return dt_time(h, m)


def _within_business_hours(org) -> bool:
    if not getattr(org, "business_hours_enabled", False):
        return True
    tzname = getattr(org, "business_hours_timezone", None) or "UTC"
    try:
        tz = ZoneInfo(tzname)
    except Exception:
        tz = ZoneInfo("UTC")
    now = datetime.now(tz).time()
    start = _parse_hhmm(getattr(org, "business_hours_start", None))
    end = _parse_hhmm(getattr(org, "business_hours_end", None))
    if start <= end:
        return start <= now <= end
    return now >= start or now <= end


def _message_matches_escalation(text: str, keywords: list[str] | None) -> bool:
    if not keywords:
        return False
    blob = (text or "").lower()
    for kw in keywords:
        k = (kw or "").strip().lower()
        if k and k in blob:
            return True
    return False


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
        if convo.status == "ignored":
            return
        if convo.organization.subscription_tier == "cancelled":
            return

        limit = _monthly_ai_reply_limit(convo.organization.subscription_tier)

        month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        usage = (
            db.query(sql_func.count(Message.id))
            .join(Conversation, Message.conversation_id == Conversation.id)
            .filter(
                Conversation.organization_id == convo.organization_id,
                Message.direction == "outbound",
                Message.ai_generated.is_(True),
                Message.created_at >= month_start,
            )
            .scalar()
        )
        usage = int(usage or 0)
        if limit > 0 and usage >= limit:
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

        if _message_matches_escalation(latest_inbound, getattr(org, "escalation_keywords", None)):
            convo.is_human_takeover = True
            db.add(convo)
            db.commit()
            return

        if not _within_business_hours(org):
            outside = (getattr(org, "outside_hours_message", None) or "").strip()
            if outside:
                time.sleep(2)
                asyncio.run(post_reply(convo, outside, db))
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

        asyncio.run(post_reply(convo, reply_text, db))

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
            db.add(
                Lead(
                    organization_id=convo.organization_id,
                    conversation_id=convo.id,
                    source_platform=convo.platform,
                    name=convo.customer_name,
                )
            )

        db.commit()

    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc) from exc
    finally:
        db.close()
