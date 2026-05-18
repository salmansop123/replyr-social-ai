"""GAP-002 — monthly reply limit helper."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.services.reply_limits import check_reply_limit, monthly_ai_reply_limit


def test_monthly_limit_starter() -> None:
    assert monthly_ai_reply_limit("starter") == 500


def test_monthly_limit_enterprise_unlimited() -> None:
    assert monthly_ai_reply_limit("enterprise") == -1


@patch("app.services.reply_limits.count_ai_replies_this_month", return_value=500)
def test_check_reply_limit_at_cap(mock_count) -> None:
    org = MagicMock()
    org.id = "00000000-0000-0000-0000-000000000001"
    org.subscription_tier = "starter"
    db = MagicMock()
    assert check_reply_limit(org, db) is True


@patch("app.services.reply_limits.count_ai_replies_this_month", return_value=10)
def test_check_reply_limit_under_cap(mock_count) -> None:
    org = MagicMock()
    org.id = "00000000-0000-0000-0000-000000000001"
    org.subscription_tier = "starter"
    db = MagicMock()
    assert check_reply_limit(org, db) is False
