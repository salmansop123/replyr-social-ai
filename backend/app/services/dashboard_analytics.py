"""Dashboard analytics queries — always scoped by organization_id."""

from __future__ import annotations

from calendar import monthrange
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.lead import Lead
from app.models.message import Message
from app.models.social_account import SocialAccount

# Dashboard summary cards: one row per connected channel type.
PLATFORMS = ("whatsapp", "facebook")


def month_start_utc(now: datetime | None = None) -> datetime:
    n = now or datetime.now(timezone.utc)
    return n.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def month_end_utc(start: datetime) -> datetime:
    last_day = monthrange(start.year, start.month)[1]
    return start.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)


def count_inbound_messages_by_platform(
    db: Session, org_id: UUID, start: datetime, end: datetime
) -> dict[str, int]:
    rows = (
        db.query(Conversation.platform, func.count(Message.id))
        .join(Message, Message.conversation_id == Conversation.id)
        .filter(
            Conversation.organization_id == org_id,
            Message.direction == "inbound",
            Message.created_at >= start,
            Message.created_at <= end,
        )
        .group_by(Conversation.platform)
        .all()
    )
    return {platform: int(cnt) for platform, cnt in rows}


def count_facebook_inbound_split(
    db: Session, org_id: UUID, start: datetime, end: datetime
) -> tuple[int, int]:
    """Returns (comments, dms) for Facebook inbound messages this period."""
    rows = (
        db.query(Conversation.facebook_thread_type, func.count(Message.id))
        .join(Message, Message.conversation_id == Conversation.id)
        .filter(
            Conversation.organization_id == org_id,
            Conversation.platform == "facebook",
            Message.direction == "inbound",
            Message.created_at >= start,
            Message.created_at <= end,
        )
        .group_by(Conversation.facebook_thread_type)
        .all()
    )
    comments = 0
    dms = 0
    for thread_type, cnt in rows:
        if thread_type == "comment":
            comments += int(cnt)
        else:
            dms += int(cnt)
    return comments, dms


def count_ai_outbound_by_platform(
    db: Session, org_id: UUID, start: datetime, end: datetime
) -> dict[str, int]:
    rows = (
        db.query(Conversation.platform, func.count(Message.id))
        .join(Message, Message.conversation_id == Conversation.id)
        .filter(
            Conversation.organization_id == org_id,
            Message.direction == "outbound",
            Message.ai_generated.is_(True),
            Message.created_at >= start,
            Message.created_at <= end,
        )
        .group_by(Conversation.platform)
        .all()
    )
    return {platform: int(cnt) for platform, cnt in rows}


def count_leads_by_platform(db: Session, org_id: UUID, start: datetime, end: datetime) -> dict[str, int]:
    rows = (
        db.query(Lead.source_platform, func.count(Lead.id))
        .filter(
            Lead.organization_id == org_id,
            Lead.created_at >= start,
            Lead.created_at <= end,
            Lead.source_platform.isnot(None),
        )
        .group_by(Lead.source_platform)
        .all()
    )
    out: dict[str, int] = {}
    for platform, cnt in rows:
        if platform:
            out[platform] = int(cnt)
    return out


def connected_platforms(db: Session, org_id: UUID) -> set[str]:
    rows = (
        db.query(SocialAccount.platform)
        .filter(
            SocialAccount.organization_id == org_id,
            SocialAccount.is_active.is_(True),
        )
        .distinct()
        .all()
    )
    return {r[0] for r in rows if r[0]}


def build_platform_summary(db: Session, org_id: UUID) -> list[dict]:
    start = month_start_utc()
    end = month_end_utc(start)
    inbound = count_inbound_messages_by_platform(db, org_id, start, end)
    ai_out = count_ai_outbound_by_platform(db, org_id, start, end)
    leads = count_leads_by_platform(db, org_id, start, end)
    connected = connected_platforms(db, org_id)
    fb_comments, fb_dms = count_facebook_inbound_split(db, org_id, start, end)

    rows: list[dict] = []
    for p in PLATFORMS:
        row = {
            "platform": p,
            "comments_received": inbound.get(p, 0),
            "ai_replies_sent": ai_out.get(p, 0),
            "leads_captured": leads.get(p, 0),
            "connected": p in connected,
        }
        if p == "facebook":
            row["comments_received"] = fb_comments
            row["dms_received"] = fb_dms
        else:
            row["dms_received"] = inbound.get(p, 0)
        rows.append(row)
    return rows


def _day_counts(
    db: Session,
    org_id: UUID,
    day_start: datetime,
    day_end: datetime,
    *,
    platform: str | None = None,
) -> tuple[int, int, int]:
    inbound_q = (
        db.query(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(
            Conversation.organization_id == org_id,
            Message.direction == "inbound",
            Message.created_at >= day_start,
            Message.created_at < day_end,
        )
    )
    outbound_q = (
        db.query(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(
            Conversation.organization_id == org_id,
            Message.direction == "outbound",
            Message.created_at >= day_start,
            Message.created_at < day_end,
        )
    )
    if platform:
        inbound_q = inbound_q.filter(Conversation.platform == platform)
        outbound_q = outbound_q.filter(Conversation.platform == platform)

    inbound = inbound_q.scalar() or 0
    outbound = outbound_q.scalar() or 0
    leads = (
        db.query(func.count(Lead.id))
        .filter(
            Lead.organization_id == org_id,
            Lead.created_at >= day_start,
            Lead.created_at < day_end,
            *([Lead.source_platform == platform] if platform else []),
        )
        .scalar()
    ) or 0
    return int(inbound), int(outbound), int(leads)


def build_timeseries(db: Session, org_id: UUID, days: int) -> dict:
    days = max(1, min(days, 366))
    end_day = datetime.now(timezone.utc).date()
    start_day = end_day - timedelta(days=days - 1)
    points: list[dict] = []
    by_platform: dict[str, list[dict]] = {p: [] for p in PLATFORMS}

    for i in range(days):
        d = start_day + timedelta(days=i)
        day_start = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        inbound, outbound, leads = _day_counts(db, org_id, day_start, day_end)
        points.append(
            {
                "date": d.isoformat(),
                "inbound": inbound,
                "outbound": outbound,
                "leads": leads,
            }
        )
        for p in PLATFORMS:
            p_in, p_out, p_leads = _day_counts(db, org_id, day_start, day_end, platform=p)
            by_platform[p].append(
                {
                    "date": d.isoformat(),
                    "inbound": p_in,
                    "outbound": p_out,
                    "leads": p_leads,
                }
            )
    return {"points": points, "by_platform": by_platform}


def latest_inbound_feed(db: Session, org_id: UUID, limit: int = 20) -> list[dict]:
    limit = max(1, min(limit, 100))
    rows = (
        db.query(Message, Conversation)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(
            Conversation.organization_id == org_id,
            Message.direction == "inbound",
        )
        .order_by(Message.created_at.desc())
        .limit(limit)
        .all()
    )
    out: list[dict] = []
    for msg, conv in rows:
        preview = msg.content[:80] + "…" if len(msg.content) > 80 else msg.content
        out.append(
            {
                "conversation_id": str(conv.id),
                "platform": conv.platform,
                "customer_name": conv.customer_name,
                "message_preview": preview,
                "status": conv.status,
                "created_at": msg.created_at,
            }
        )
    return out
