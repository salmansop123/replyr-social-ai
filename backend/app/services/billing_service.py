"""Billing helpers: plan limits, usage counts, Stripe customer resolution."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.organization import Organization
from app.models.social_account import SocialAccount
from app.models.subscription import Subscription
from app.models.user import User

PLAN_LIMITS: dict[str, dict[str, int]] = {
    "free": {"ai_replies": 500, "accounts": 3},
    "starter": {"ai_replies": 500, "accounts": 3},
    "professional": {"ai_replies": 5_000, "accounts": 10},
    "enterprise": {"ai_replies": -1, "accounts": -1},
}

PLAN_ORDER = {"free": 0, "starter": 1, "professional": 2, "enterprise": 3}


def normalize_plan(raw: str | None) -> str:
    p = (raw or "free").lower().strip()
    if p in PLAN_LIMITS:
        return p
    if p == "cancelled":
        return "free"
    return "free"


def normalize_status(raw: str | None) -> str:
    s = (raw or "active").lower().strip()
    if s in ("active", "past_due", "cancelled", "trialing"):
        return s
    if s in ("canceled", "incomplete", "unpaid"):
        return "cancelled" if s == "canceled" else "past_due"
    return "active"


def month_start_utc() -> datetime:
    return datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def first_of_next_month_utc() -> datetime:
    now = datetime.now(timezone.utc)
    if now.month == 12:
        return now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    return now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)


def count_ai_replies_this_month(db: Session, org_id) -> int:
    start = month_start_utc()
    return int(
        db.query(sql_func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(
            Conversation.organization_id == org_id,
            Message.direction == "outbound",
            Message.ai_generated.is_(True),
            Message.created_at >= start,
        )
        .scalar()
        or 0
    )


def count_connected_accounts(db: Session, org_id) -> int:
    return int(
        db.query(sql_func.count(SocialAccount.id))
        .filter(
            SocialAccount.organization_id == org_id,
            SocialAccount.is_active.is_(True),
        )
        .scalar()
        or 0
    )


def get_or_create_subscription_row(db: Session, org: Organization) -> Subscription:
    sub = db.query(Subscription).filter(Subscription.organization_id == org.id).first()
    if sub:
        return sub
    plan = normalize_plan(org.subscription_tier)
    sub = Subscription(
        organization_id=org.id,
        plan=plan,
        status="active",
    )
    db.add(sub)
    db.flush()
    return sub


def build_subscription_payload(db: Session, user: User) -> dict[str, Any]:
    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    if not org:
        raise ValueError("Organization not found")

    sub = get_or_create_subscription_row(db, org)
    plan = normalize_plan(sub.plan or org.subscription_tier)
    status = normalize_status(sub.status)
    limits = PLAN_LIMITS[plan]

    return {
        "plan": plan,
        "status": status,
        "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
        "stripe_subscription_id": sub.stripe_subscription_id,
        "ai_replies_used_this_month": count_ai_replies_this_month(db, org.id),
        "ai_replies_limit": limits["ai_replies"],
        "connected_accounts": count_connected_accounts(db, org.id),
        "accounts_limit": limits["accounts"],
        "usage_resets_at": first_of_next_month_utc().isoformat(),
    }


def resolve_stripe_customer_id(db: Session, user: User, stripe_module) -> str:
    """Return Stripe customer id, creating customer + subscription row if needed."""
    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    if not org:
        raise ValueError("Organization not found")
    sub = get_or_create_subscription_row(db, org)
    if sub.stripe_customer_id:
        return sub.stripe_customer_id

    if not user.email:
        raise ValueError("User email required to create Stripe customer")

    customer = stripe_module.Customer.create(
        email=user.email,
        metadata={"organization_id": str(user.organization_id)},
    )
    sub.stripe_customer_id = customer.id
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return customer.id
