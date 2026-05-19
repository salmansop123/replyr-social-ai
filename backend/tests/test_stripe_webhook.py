"""Phase 4 — Stripe webhook plan mapping and org sync."""

from __future__ import annotations

import uuid
from unittest.mock import MagicMock, patch

from app.services.stripe_webhook import (
    apply_stripe_subscription,
    handle_stripe_event,
    plan_from_price_id,
    validate_checkout_price_id,
)


@patch("app.services.stripe_webhook.settings")
def test_plan_from_price_id(mock_settings) -> None:
    mock_settings.stripe_price_starter = "price_starter"
    mock_settings.stripe_price_professional = "price_pro"
    mock_settings.stripe_price_enterprise = ""
    assert plan_from_price_id("price_pro") == "professional"
    assert plan_from_price_id("price_unknown") == "starter"


@patch("app.services.stripe_webhook.settings")
def test_validate_checkout_price_id_rejects_unknown(mock_settings) -> None:
    mock_settings.stripe_price_starter = "price_starter"
    mock_settings.stripe_price_professional = ""
    mock_settings.stripe_price_enterprise = ""
    validate_checkout_price_id("price_starter")
    try:
        validate_checkout_price_id("price_bad")
        assert False, "expected ValueError"
    except ValueError:
        pass


@patch("app.services.stripe_webhook.settings")
def test_apply_stripe_subscription_updates_org(mock_settings) -> None:
    mock_settings.stripe_price_professional = "price_pro"
    mock_settings.stripe_price_starter = ""
    mock_settings.stripe_price_enterprise = ""

    org_id = uuid.uuid4()
    org = MagicMock()
    org.id = org_id
    org.subscription_tier = "starter"

    sub_row = MagicMock()
    sub_row.stripe_customer_id = None
    sub_row.stripe_subscription_id = None

    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = org

    with patch("app.services.stripe_webhook.get_or_create_subscription_row", return_value=sub_row):
        apply_stripe_subscription(
            db,
            organization_id=org_id,
            stripe_customer_id="cus_123",
            stripe_subscription={
                "id": "sub_123",
                "status": "active",
                "current_period_end": 1893456000,
                "items": {"data": [{"price": {"id": "price_pro"}}]},
            },
        )

    assert org.subscription_tier == "professional"
    assert sub_row.plan == "professional"
    db.commit.assert_called()


def test_handle_checkout_session_completed() -> None:
    org_id = str(uuid.uuid4())
    db = MagicMock()
    stripe_mod = MagicMock()
    stripe_mod.Subscription.retrieve.return_value = {
        "id": "sub_new",
        "status": "active",
        "customer": "cus_1",
        "current_period_end": 1893456000,
        "items": {"data": [{"price": {"id": "price_starter"}}]},
        "metadata": {"organization_id": org_id},
    }

    with patch("app.services.stripe_webhook.apply_stripe_subscription") as mock_apply:
        handle_stripe_event(
            db,
            {
                "type": "checkout.session.completed",
                "data": {
                    "object": {
                        "metadata": {"organization_id": org_id},
                        "customer": "cus_1",
                        "subscription": "sub_new",
                    }
                },
            },
            stripe_mod,
        )
        mock_apply.assert_called_once()
