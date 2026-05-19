from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.organization import Organization
from app.models.user import User
from app.services.billing_service import (
    build_subscription_payload,
    get_or_create_subscription_row,
    resolve_stripe_customer_id,
)
from app.services.stripe_webhook import handle_stripe_event, validate_checkout_price_id

router = APIRouter(prefix="/billing", tags=["billing"])


class CreateCheckoutIn(BaseModel):
    price_id: str = Field(..., min_length=1)
    success_url: str = Field(..., min_length=1)
    cancel_url: str = Field(..., min_length=1)


class SubscriptionOut(BaseModel):
    plan: str
    status: str
    current_period_end: str | None
    stripe_subscription_id: str | None
    ai_replies_used_this_month: int
    ai_replies_limit: int
    connected_accounts: int
    accounts_limit: int
    usage_resets_at: str


class CheckoutOut(BaseModel):
    checkout_url: str


class PortalOut(BaseModel):
    portal_url: str


class InvoiceRow(BaseModel):
    id: str
    date: str
    description: str
    amount: str
    status: str
    pdf_url: str | None = None


def _require_stripe():
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=503,
            detail="Stripe is not configured. Set STRIPE_SECRET_KEY in backend/.env",
        )
    import stripe

    stripe.api_key = settings.stripe_secret_key
    return stripe


@router.get("/subscription", response_model=SubscriptionOut)
def get_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SubscriptionOut:
    payload = build_subscription_payload(db, current_user)
    return SubscriptionOut(**payload)


@router.post("/create-checkout", response_model=CheckoutOut)
def create_checkout(
    body: CreateCheckoutIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CheckoutOut:
    stripe = _require_stripe()
    try:
        validate_checkout_price_id(body.price_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    sub_row = get_or_create_subscription_row(db, org)
    org_id = str(current_user.organization_id)
    session_kwargs: dict = {
        "mode": "subscription",
        "line_items": [{"price": body.price_id, "quantity": 1}],
        "success_url": body.success_url,
        "cancel_url": body.cancel_url,
        "metadata": {"organization_id": org_id},
        "client_reference_id": org_id,
        "subscription_data": {"metadata": {"organization_id": org_id}},
    }
    if sub_row.stripe_customer_id:
        session_kwargs["customer"] = sub_row.stripe_customer_id
    elif current_user.email:
        session_kwargs["customer_email"] = current_user.email

    try:
        session = stripe.checkout.Session.create(**session_kwargs)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    if not session.url:
        raise HTTPException(status_code=502, detail="Stripe did not return a checkout URL")
    return CheckoutOut(checkout_url=session.url)


@router.get("/portal", response_model=PortalOut)
def get_billing_portal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PortalOut:
    stripe = _require_stripe()
    try:
        customer_id = resolve_stripe_customer_id(db, current_user, stripe)
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{settings.frontend_url.rstrip('/')}/dashboard/billing",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return PortalOut(portal_url=session.url)


@router.get("/invoices", response_model=list[InvoiceRow])
def list_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[InvoiceRow]:
    """Recent Stripe invoices for the org's customer (empty if none)."""
    stripe = _require_stripe()
    from app.services.billing_service import get_or_create_subscription_row
    from app.models.organization import Organization

    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        return []
    sub = get_or_create_subscription_row(db, org)
    if not sub.stripe_customer_id:
        try:
            customer_id = resolve_stripe_customer_id(db, current_user, stripe)
        except ValueError:
            return []
    else:
        customer_id = sub.stripe_customer_id

    try:
        invoices = stripe.Invoice.list(customer=customer_id, limit=10)
    except Exception:
        return []

    rows: list[InvoiceRow] = []
    for inv in invoices.data:
        created = inv.get("created")
        date_str = ""
        if created:
            from datetime import datetime, timezone

            date_str = datetime.fromtimestamp(created, tz=timezone.utc).strftime("%b %d, %Y")
        amount_cents = inv.get("amount_paid") or inv.get("amount_due") or 0
        currency = (inv.get("currency") or "usd").upper()
        amount_str = f"${amount_cents / 100:.2f} {currency}" if currency == "USD" else f"{amount_cents / 100:.2f} {currency}"
        lines = inv.get("lines", {}).get("data", [])
        desc = lines[0].get("description") if lines else inv.get("description") or "Subscription"
        rows.append(
            InvoiceRow(
                id=inv["id"],
                date=date_str,
                description=desc or "Invoice",
                amount=amount_str,
                status=(inv.get("status") or "unknown").replace("_", " ").title(),
                pdf_url=inv.get("invoice_pdf"),
            )
        )
    return rows


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)) -> dict[str, str]:
    """Stripe billing webhooks — configure Dashboard → Developers → Webhooks → this URL."""
    if not settings.stripe_webhook_secret:
        raise HTTPException(
            status_code=503,
            detail="STRIPE_WEBHOOK_SECRET is not configured",
        )
    stripe = _require_stripe()
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    if not sig:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")
    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook signature verification failed: {e}") from e

    try:
        handle_stripe_event(db, event, stripe)
    except Exception:
        logger.exception("Stripe webhook handler failed for event %s", event.get("id"))
        raise HTTPException(status_code=500, detail="Webhook handler error") from None

    return {"received": "true"}


logger = logging.getLogger(__name__)
