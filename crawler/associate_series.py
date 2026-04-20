#!/usr/bin/env python3
"""
Series-article association engine.
Matches articles to series by scanning title + tags
against series names in the Neon series table.
Run once as backfill, then integrated into main.py.
"""
import re
import logging
import psycopg2
import psycopg2.extras
from config import DATABASE_URL

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("associate")


def normalize(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def build_series_index(conn) -> list[dict]:
    """Load all series from DB and build a lookup index."""
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute("""
            SELECT id, title_en, title_romaji, title_ja, tags
            FROM series
            WHERE title_en IS NOT NULL
               OR title_romaji IS NOT NULL
        """)
        rows = cur.fetchall()

    index = []
    for row in rows:
        names = []
        for field in [row["title_en"], row["title_romaji"]]:
            if field:
                names.append(normalize(field))
                parts = normalize(field).split()
                if len(parts) >= 3:
                    names.append(" ".join(parts[:3]))

        index.append({
            "id": row["id"],
            "names": [n for n in names if len(n) >= 3],
        })

    logger.info(f"Loaded {len(index)} series into index")
    return index


def match_article_to_series(
    article: dict,
    series_index: list[dict],
    min_name_length: int = 4
) -> list[str]:
    """
    Return list of series IDs that match this article.
    Matches against article title + summary + tags.
    """
    searchable_parts = []
    if article.get("title"):
        searchable_parts.append(normalize(article["title"]))
    if article.get("summary"):
        searchable_parts.append(normalize(article["summary"][:500]))
    if article.get("tags"):
        for tag in (article["tags"] or []):
            searchable_parts.append(normalize(tag))

    searchable = " ".join(searchable_parts)
    if not searchable.strip():
        return []

    matched_ids = []
    for series in series_index:
        for name in series["names"]:
            if len(name) < min_name_length:
                continue
            pattern = r"\b" + re.escape(name) + r"\b"
            if re.search(pattern, searchable):
                matched_ids.append(series["id"])
                break

    return matched_ids


def run_association(batch_size: int = 100):
    """
    Backfill: match all articles to series.
    Also works incrementally — skips already-associated.
    """
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False

    try:
        series_index = build_series_index(conn)
        if not series_index:
            logger.error("No series found in DB — run seed first")
            return

        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("""
                SELECT id, title, summary, tags,
                       related_series_ids
                FROM articles
                WHERE related_series_ids IS NULL
                   OR related_series_ids = '{}'
                ORDER BY published_at DESC
            """)
            articles = cur.fetchall()

        logger.info(
            f"Found {len(articles)} articles to associate"
        )

        total_associated = 0
        total_skipped = 0
        offset = 0

        while offset < len(articles):
            batch = articles[offset:offset + batch_size]
            updates = []

            for article in batch:
                matched = match_article_to_series(
                    dict(article), series_index
                )
                if matched:
                    updates.append((matched, article["id"]))
                    total_associated += 1
                else:
                    total_skipped += 1

            if updates:
                with conn.cursor() as cur:
                    psycopg2.extras.execute_batch(
                        cur,
                        """
                        UPDATE articles
                        SET related_series_ids = %s
                        WHERE id = %s
                        """,
                        updates
                    )
                conn.commit()
                logger.info(
                    f"Batch {offset // batch_size + 1}: "
                    f"{len(updates)} articles associated"
                )

            offset += batch_size

        logger.info(
            f"\n=== Association complete!===\n"
            f"   Associated: {total_associated}\n"
            f"   No match:   {total_skipped}"
        )

        with conn.cursor() as cur:
            cur.execute("""
                SELECT COUNT(*) FROM articles
                WHERE related_series_ids IS NOT NULL
                  AND related_series_ids != '{}'
            """)
            count = cur.fetchone()[0]
            logger.info(
                f"   Total articles with series: {count}"
            )

    finally:
        conn.close()


if __name__ == "__main__":
    run_association()