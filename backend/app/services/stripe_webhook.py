"""Stripe webhook handlers — sync subscriptions to DB and organization tier."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.config import settings
from app.models.organization import Organization
from app.services.billing_service import get_or_create_subscription_row, normalize_status

logger = logging.getLogger(__name__)


def configured_price_to_plan() -> dict[str, str]:
    mapping: dict[str, str] = {}
    if settings.stripe_price_starter:
        mapping[settings.stripe_price_starter] = "starter"
    if settings.stripe_price_professional:
        mapping[settings.stripe_price_professional] = "professional"
    if settings.stripe_price_enterprise:
        mapping[settings.stripe_price_enterprise] = "enterprise"
    return mapping


def plan_from_price_id(price_id: str | None) -> str:
    if not price_id:
        return "starter"
    return configured_price_to_plan().get(price_id, "starter")


def _period_end_from_subscription(stripe_sub: dict[str, Any]) -> datetime | None:
    ts = stripe_sub.get("current_period_end")
    if not ts:
        return None
    return datetime.fromtimestamp(int(ts), tz=timezone.utc)


def _primary_price_id(stripe_sub: dict[str, Any]) -> str | None:
    items = stripe_sub.get("items") or {}
    data = items.get("data") if isinstance(items, dict) else None
    if not data:
        return None
    first = data[0] if data else None
    if not first:
        return None
    price = first.get("price")
    if isinstance(price, dict):
        return price.get("id")
    return None


def apply_stripe_subscription(
    db: Session,
    *,
    organization_id: uuid.UUID,
    stripe_customer_id: str | None,
    stripe_subscription: dict[str, Any],
) -> None:
    org = db.query(Organization).filter(Organization.id == organization_id).first()
    if not org:
        logger.warning("Stripe sync: organization %s not found", organization_id)
        return

    sub_row = get_or_create_subscription_row(db, org)
    price_id = _primary_price_id(stripe_subscription)
    plan = plan_from_price_id(price_id)
    status = normalize_status(stripe_subscription.get("status"))
    if status == "cancelled":
        plan = "free"

    sub_row.stripe_customer_id = stripe_customer_id or sub_row.stripe_customer_id
    sub_row.stripe_subscription_id = stripe_subscription.get("id") or sub_row.stripe_subscription_id
    sub_row.plan = plan
    sub_row.status = status
    sub_row.current_period_end = _period_end_from_subscription(stripe_subscription)

    org.subscription_tier = plan
    db.add(sub_row)
    db.add(org)
    db.commit()
    logger.info(
        "Stripe sync org=%s plan=%s status=%s sub=%s",
        organization_id,
        plan,
        status,
        sub_row.stripe_subscription_id,
    )


def clear_stripe_subscription(db: Session, *, organization_id: uuid.UUID) -> None:
    org = db.query(Organization).filter(Organization.id == organization_id).first()
    if not org:
        return
    sub_row = get_or_create_subscription_row(db, org)
    sub_row.plan = "free"
    sub_row.status = "cancelled"
    sub_row.stripe_subscription_id = None
    sub_row.current_period_end = None
    org.subscription_tier = "free"
    db.add(sub_row)
    db.add(org)
    db.commit()


def _parse_org_id(raw: str | None) -> uuid.UUID | None:
    if not raw:
        return None
    try:
        return uuid.UUID(str(raw))
    except ValueError:
        return None


def handle_stripe_event(db: Session, event: dict[str, Any], stripe_module) -> None:
    etype = event.get("type") or ""
    obj = (event.get("data") or {}).get("object") or {}

    if etype == "checkout.session.completed":
        org_id = _parse_org_id(
            (obj.get("metadata") or {}).get("organization_id") or obj.get("client_reference_id")
        )
        if not org_id:
            logger.warning("checkout.session.completed without organization_id")
            return
        customer_id = obj.get("customer")
        sub_id = obj.get("subscription")
        if sub_id:
            stripe_sub = stripe_module.Subscription.retrieve(sub_id)
            apply_stripe_subscription(
                db,
                organization_id=org_id,
                stripe_customer_id=str(customer_id) if customer_id else None,
                stripe_subscription=stripe_sub,
            )
        elif customer_id:
            org = db.query(Organization).filter(Organization.id == org_id).first()
            if org:
                sub_row = get_or_create_subscription_row(db, org)
                sub_row.stripe_customer_id = str(customer_id)
                db.add(sub_row)
                db.commit()
        return

    if etype in ("customer.subscription.created", "customer.subscription.updated"):
        org_id = _resolve_org_id_from_subscription(db, obj)
        if not org_id:
            return
        apply_stripe_subscription(
            db,
            organization_id=org_id,
            stripe_customer_id=str(obj.get("customer")) if obj.get("customer") else None,
            stripe_subscription=obj,
        )
        return

    if etype == "customer.subscription.deleted":
        org_id = _resolve_org_id_from_subscription(db, obj)
        if org_id:
            clear_stripe_subscription(db, organization_id=org_id)
        return


def _resolve_org_id_from_subscription(db: Session, stripe_sub: dict[str, Any]) -> uuid.UUID | None:
    meta = stripe_sub.get("metadata") or {}
    org_id = _parse_org_id(meta.get("organization_id"))
    if org_id:
        return org_id

    sub_id = stripe_sub.get("id")
    if sub_id:
        from app.models.subscription import Subscription

        row = db.query(Subscription).filter(Subscription.stripe_subscription_id == sub_id).first()
        if row:
            return row.organization_id

    customer_id = stripe_sub.get("customer")
    if customer_id:
        from app.models.subscription import Subscription

        row = db.query(Subscription).filter(Subscription.stripe_customer_id == str(customer_id)).first()
        if row:
            return row.organization_id

    return None


def validate_checkout_price_id(price_id: str) -> None:
    """Reject unknown price IDs when backend STRIPE_PRICE_* are configured."""
    allowed = set(configured_price_to_plan().keys())
    if allowed and price_id not in allowed:
        raise ValueError(
            f"Unknown price_id. Configure STRIPE_PRICE_* in backend/.env to match Stripe Dashboard prices."
        )
