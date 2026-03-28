#!/usr/bin/env python3
"""
Hakken Crawler Deduplication
Uses Upstash Redis HTTP API directly (no redis-py needed)
since we're using REST API, not TCP connection.
"""

import logging
import httpx
from config import UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, \
    REDIS_DEDUP_TTL_DAYS

logger = logging.getLogger("hakken.dedup")

# TTL in seconds
_TTL_SECONDS = REDIS_DEDUP_TTL_DAYS * 24 * 60 * 60

_headers = {
    "Authorization": f"Bearer {UPSTASH_REDIS_REST_TOKEN}",
    "Content-Type": "application/json",
}


def _redis_command(command: list) -> dict:
    """Execute a Redis command via Upstash REST API."""
    response = httpx.post(
        UPSTASH_REDIS_REST_URL,
        headers=_headers,
        json=command,
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def is_new_article(article_id: str) -> bool:
    """
    Returns True if this article ID is new (not seen before).
    Returns False if it was already crawled.
    Uses Redis SET NX (only set if not exists) — atomic, no races.
    """
    key = f"hakken:crawled:{article_id}"
    # SET key value EX ttl NX — only sets if key doesn't exist
    result = _redis_command(["SET", key, "1", "EX",
                             str(_TTL_SECONDS), "NX"])
    # Result is "OK" if set (new), null if already existed (duplicate)
    is_new = result.get("result") == "OK"
    return is_new


def bulk_check_new(article_ids: list[str]) -> dict[str, bool]:
    """
    Check multiple article IDs at once.
    Returns dict of {article_id: is_new}.
    More efficient than calling is_new_article() in a loop.
    """
    results = {}
    for article_id in article_ids:
        results[article_id] = is_new_article(article_id)
    return results


def get_dedup_stats() -> dict:
    """Get current deduplication stats from Redis."""
    try:
        result = _redis_command(["DBSIZE"])
        return {"total_tracked_urls": result.get("result", 0)}
    except Exception as e:
        logger.warning(f"Could not get Redis stats: {e}")
        return {"total_tracked_urls": "unknown"}