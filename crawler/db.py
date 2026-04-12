#!/usr/bin/env python3
"""
Hakken Crawler Database Layer
Writes crawled + enriched articles to Neon via psycopg2.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional
import psycopg2
import psycopg2.extras
from config import DATABASE_URL

logger = logging.getLogger("hakken.db")


def get_connection():
    """Get a psycopg2 connection to Neon."""
    return psycopg2.connect(DATABASE_URL, sslmode="require")


def insert_article(article: dict) -> bool:
    """
    Insert a single crawled article into the articles table.
    Returns True on success, False if duplicate or error.
    Uses INSERT ... ON CONFLICT DO NOTHING for safety.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO articles (
                        id, url, title, content, source,
                        source_url, author, published_at,
                        crawled_at, image_url
                    ) VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s
                    )
                    ON CONFLICT (url) DO NOTHING
                    """,
                    (
                        article["id"],
                        article["url"],
                        article["title"],
                        article.get("content", ""),
                        article["source_id"],
                        article.get("source_url", ""),
                        article.get("author"),
                        article.get("published_at"),
                        datetime.now(timezone.utc).isoformat(),
                        article.get("image_url"),
                    ),
                )
                inserted = cur.rowcount > 0
                conn.commit()
                return inserted
    except Exception as e:
        logger.error(f"Failed to insert article {article['id']}: {e}")
        return False


def update_article_enrichment(
    article_id: str,
    summary: Optional[str],
    sentiment: Optional[str],
    sentiment_score: Optional[float],
    tags: Optional[list[str]],
) -> bool:
    """
    Update an article with AI-generated enrichment data.
    Called after NVIDIA API processing.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE articles
                    SET summary = %s,
                        sentiment = %s,
                        sentiment_score = %s,
                        tags = %s,
                        pinecone_indexed = false
                    WHERE id = %s
                    """,
                    (
                        summary,
                        sentiment,
                        sentiment_score,
                        tags,
                        article_id,
                    ),
                )
                conn.commit()
                return True
    except Exception as e:
        logger.error(
            f"Failed to update enrichment for {article_id}: {e}"
        )
        return False


def log_crawler_run(
    run_id: str,
    feeds_processed: int,
    articles_found: int,
    articles_new: int,
    articles_duplicate: int,
    errors: list,
    status: str = "completed",
) -> None:
    """Write a crawler run audit log to crawler_runs table."""
    try:
        import json
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO crawler_runs (
                        id, feeds_processed, articles_found,
                        articles_new, articles_duplicate,
                        errors, status, completed_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        run_id,
                        feeds_processed,
                        articles_found,
                        articles_new,
                        articles_duplicate,
                        json.dumps(errors),
                        status,
                        datetime.now(timezone.utc).isoformat(),
                    ),
                )
                conn.commit()
        logger.info(f"Crawler run {run_id} logged to DB")
    except Exception as e:
        logger.error(f"Failed to log crawler run: {e}")


def get_unenriched_articles(limit: int = 50) -> list[dict]:
    """
    Fetch articles that haven't been AI-enriched yet.
    Used for enrichment backfill if needed.
    """
    try:
        with get_connection() as conn:
            with conn.cursor(
                cursor_factory=psycopg2.extras.RealDictCursor
            ) as cur:
                cur.execute(
                    """
                    SELECT id, title, content, source
                    FROM articles
                    WHERE summary IS NULL
                    ORDER BY crawled_at DESC
                    LIMIT %s
                    """,
                    (limit,),
                )
                return [dict(row) for row in cur.fetchall()]
    except Exception as e:
        logger.error(f"Failed to fetch unenriched articles: {e}")
        return []