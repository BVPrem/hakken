#!/usr/bin/env python3
"""
Hakken Crawler — Main Pipeline Orchestrator

Full pipeline:
  1. Load RSS feeds from feeds.py
  2. Fetch + parse all feeds concurrently (parser.py)
  3. Check Redis for duplicates (dedup.py)
  4. Insert new articles to Neon (db.py)
  5. Enrich with NVIDIA AI (enricher.py)
  6. Update Neon with enrichment data (db.py)
  7. Log run to crawler_runs table (db.py)

Run locally: python main.py
Run on Lambda: handler() is the entrypoint
"""

import logging
import uuid
from datetime import datetime, timezone

from config import MAX_FEED_WORKERS
from feeds import FEEDS
from parser import parse_all_feeds
from dedup import is_new_article, get_dedup_stats
from db import (
    insert_article,
    update_article_enrichment,
    log_crawler_run,
)
from enricher import enrich_article
from associate_series import run_association

# ─── Logging setup ───────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("hakken.main")


def run_crawler(max_enrich: int = 20) -> dict:
    """
    Run the full crawler pipeline.
    max_enrich: max articles to AI-enrich per run (cost control).
    Returns a summary dict.
    """
    run_id = str(uuid.uuid4())
    started_at = datetime.now(timezone.utc)
    errors = []

    logger.info("=" * 60)
    logger.info(f"🚀 Hakken Crawler starting — run ID: {run_id}")
    logger.info(f"   Feeds to process: {len(FEEDS)}")
    logger.info("=" * 60)

    # ─── Step 1: Fetch all feeds ──────────────────────────
    logger.info("📡 Step 1: Fetching RSS feeds...")
    all_articles = parse_all_feeds(FEEDS, max_workers=MAX_FEED_WORKERS)
    articles_found = len(all_articles)
    logger.info(f"   Found {articles_found} total articles")

    # ─── Step 2: Deduplication ────────────────────────────
    logger.info("🔍 Step 2: Checking for duplicates via Redis...")
    new_articles = []
    duplicates = 0

    for article in all_articles:
        if is_new_article(article["id"]):
            new_articles.append(article)
        else:
            duplicates += 1

    logger.info(
        f"   New: {len(new_articles)} | "
        f"Duplicates skipped: {duplicates}"
    )

    if not new_articles:
        logger.info("   No new articles found. Run complete.")
        log_crawler_run(
            run_id=run_id,
            feeds_processed=len(FEEDS),
            articles_found=articles_found,
            articles_new=0,
            articles_duplicate=duplicates,
            errors=errors,
            status="completed",
        )
        return {
            "run_id": run_id,
            "articles_found": articles_found,
            "articles_new": 0,
            "articles_duplicate": duplicates,
        }

    # ─── Step 3: Insert new articles to Neon ─────────────
    logger.info(
        f"💾 Step 3: Inserting {len(new_articles)} articles to Neon..."
    )
    inserted = 0
    insert_errors = 0

    for article in new_articles:
        if insert_article(article):
            inserted += 1
        else:
            insert_errors += 1
            errors.append({
                "type": "insert_error",
                "article_id": article["id"],
                "title": article.get("title", ""),
            })

    logger.info(
        f"   Inserted: {inserted} | Failed: {insert_errors}"
    )

    # ─── Step 4: AI Enrichment ────────────────────────────
    # Only enrich up to max_enrich articles per run to control costs
    to_enrich = new_articles[:max_enrich]

    logger.info(
        f"🤖 Step 4: AI enriching {len(to_enrich)} articles "
        f"(cap: {max_enrich})..."
    )
    enriched = 0
    enrich_errors = 0

    for article in to_enrich:
        try:
            enrichment = enrich_article(article)

            success = update_article_enrichment(
                article_id=article["id"],
                summary=enrichment.get("summary"),
                sentiment=enrichment.get("sentiment"),
                sentiment_score=enrichment.get("sentiment_score"),
                tags=enrichment.get("tags"),
            )

            if success:
                enriched += 1
                logger.info(
                    f"   ✅ Enriched: {article['title'][:50]}... "
                    f"| Sentiment: {enrichment.get('sentiment')} "
                    f"({enrichment.get('sentiment_score', 0):.2f})"
                )
            else:
                enrich_errors += 1

        except Exception as e:
            enrich_errors += 1
            errors.append({
                "type": "enrich_error",
                "article_id": article["id"],
                "error": str(e),
            })
            logger.error(
                f"   ❌ Enrich failed for "
                f"{article.get('title', '')[:50]}: {e}"
            )

    # ─── Step 5: Series association ────────────────────────────
    logger.info("🔗 Step 5: Associating articles with series...")
    try:
        run_association()
        logger.info("   ✅ Series association complete")
    except Exception as e:
        logger.error(f"   ❌ Association failed: {e}")

    # ─── Step 7: Log run ─────────────────────────────────
    duration = (
        datetime.now(timezone.utc) - started_at
    ).total_seconds()

    log_crawler_run(
        run_id=run_id,
        feeds_processed=len(FEEDS),
        articles_found=articles_found,
        articles_new=inserted,
        articles_duplicate=duplicates,
        errors=errors,
        status="completed",
    )

    summary = {
        "run_id": run_id,
        "duration_seconds": round(duration, 1),
        "feeds_processed": len(FEEDS),
        "articles_found": articles_found,
        "articles_new": inserted,
        "articles_duplicate": duplicates,
        "articles_enriched": enriched,
        "enrich_errors": enrich_errors,
    }

    logger.info("=" * 60)
    logger.info("✅ Hakken Crawler run complete!")
    logger.info(f"   Duration: {duration:.1f}s")
    logger.info(f"   Articles found: {articles_found}")
    logger.info(f"   New + inserted: {inserted}")
    logger.info(f"   Duplicates skipped: {duplicates}")
    logger.info(f"   AI enriched: {enriched}")
    logger.info("=" * 60)

    return summary


# ─── Lambda entrypoint ───────────────────────────────────
def handler(event=None, context=None):
    """AWS Lambda handler — same as run_crawler()."""
    result = run_crawler()
    return {"statusCode": 200, "body": result}


# ─── Local execution ─────────────────────────────────────
if __name__ == "__main__":
    result = run_crawler(max_enrich=10)
    print("\n📊 Run Summary:")
    for key, value in result.items():
        print(f"   {key}: {value}")