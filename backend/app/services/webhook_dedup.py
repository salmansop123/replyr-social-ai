"""Redis-backed webhook deduplication (GAP-003)."""

from __future__ import annotations

import logging

import redis

from app.config import settings

logger = logging.getLogger(__name__)

_redis_client: redis.Redis | None = None
DEDUP_TTL_SECONDS = 300


def _client() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    return _redis_client


def claim_inbound_message(platform_message_id: str | None, *, ttl_seconds: int = DEDUP_TTL_SECONDS) -> bool:
    """
    Atomically claim an inbound platform message id.

    Returns True if this worker should process the event (first claim).
    Returns False if Redis already has the key (Meta retry duplicate).
    On Redis failure, returns True so DB-level dedupe still applies.
    """
    if not platform_message_id:
        return True
    key = f"dedup:{platform_message_id}"
    try:
        claimed = _client().set(key, "1", nx=True, ex=ttl_seconds)
        if not claimed:
            logger.debug("Redis dedup skip: %s", platform_message_id)
        return bool(claimed)
    except redis.RedisError:
        logger.warning("Redis dedup unavailable for %s; continuing with DB dedupe only", platform_message_id)
        return True
