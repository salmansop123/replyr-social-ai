"""Escalation keyword detection (GAP-005)."""

from __future__ import annotations


def message_matches_escalation(text: str, keywords: list[str] | None) -> bool:
    if not keywords:
        return False
    blob = (text or "").lower()
    for kw in keywords:
        token = (kw or "").strip().lower()
        if token and token in blob:
            return True
    return False
