"""Business hours helpers (GAP-004)."""

from __future__ import annotations

from datetime import datetime, time as dt_time
from zoneinfo import ZoneInfo


def parse_hhmm(value: str | None) -> dt_time:
    raw = (value or "00:00").strip()
    parts = raw.split(":")
    hour = int(parts[0])
    minute = int(parts[1]) if len(parts) > 1 else 0
    return dt_time(hour, minute)


def is_within_business_hours(organization) -> bool:
    """
    True when auto-replies may run now.
    Disabled business hours always returns True.
    Supports windows that cross midnight (e.g. 22:00–06:00).
    """
    if not getattr(organization, "business_hours_enabled", False):
        return True
    tzname = getattr(organization, "business_hours_timezone", None) or "UTC"
    try:
        tz = ZoneInfo(tzname)
    except Exception:
        tz = ZoneInfo("UTC")
    now = datetime.now(tz).time()
    start = parse_hhmm(getattr(organization, "business_hours_start", None))
    end = parse_hhmm(getattr(organization, "business_hours_end", None))
    if start <= end:
        return start <= now <= end
    return now >= start or now <= end
