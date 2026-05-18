"""Monthly AI reply quota checks (GAP-002)."""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.services.billing_service import PLAN_LIMITS, count_ai_replies_this_month, normalize_plan

logger = logging.getLogger(__name__)


def monthly_ai_reply_limit(subscription_tier: str | None) -> int:
    """Outbound AI messages allowed per calendar month (UTC). -1 = unlimited."""
    plan = normalize_plan(subscription_tier)
    return PLAN_LIMITS[plan]["ai_replies"]


def check_reply_limit(organization: Organization, db: Session) -> bool:
    """
    Return True when the organization has reached its monthly AI reply cap.
    Enterprise/unlimited tiers never return True.
    """
    limit = monthly_ai_reply_limit(organization.subscription_tier)
    if limit < 0:
        return False
    usage = count_ai_replies_this_month(db, organization.id)
    if limit > 0 and usage >= limit:
        logger.info(
            "AI reply limit reached for org %s (tier=%s usage=%s limit=%s)",
            organization.id,
            organization.subscription_tier,
            usage,
            limit,
        )
        return True
    return False


def reply_usage_snapshot(organization: Organization, db: Session) -> dict:
    """Used by billing UI — used, limit, percent."""
    limit = monthly_ai_reply_limit(organization.subscription_tier)
    used = count_ai_replies_this_month(db, organization.id)
    if limit < 0:
        pct = 0.0
    elif limit == 0:
        pct = 100.0
    else:
        pct = min(100.0, (used / limit) * 100.0)
    return {"used": used, "limit": limit, "percent": pct}
