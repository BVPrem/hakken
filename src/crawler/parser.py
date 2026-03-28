#!/usr/bin/env python3
"""
Hakken RSS Parser
Fetches each feed, parses with feedparser, and normalises
all entries into a consistent CrawledArticle dict.
Handles missing fields gracefully — never crashes on bad data.
"""

import hashlib
import logging
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import TypedDict, Optional

import feedparser
import requests
from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("hakken.parser")


class CrawledArticle(TypedDict):
    id: str                          # MD5 hash of URL
    url: str
    title: str
    content: str                     # Cleaned text content
    source_id: str                   # e.g. "ann", "reddit_anime"
    source_name: str                 # Human readable
    source_url: str                  # Feed URL
    author: Optional[str]
    published_at: Optional[str]      # ISO 8601 string or None
    image_url: Optional[str]
    category: str                    # "news" | "community" | etc.


def _make_id(url: str) -> str:
    """Generate a stable MD5 ID from a URL."""
    return hashlib.md5(url.encode("utf-8")).hexdigest()


def _clean_html(raw: str) -> str:
    """Strip HTML tags and return plain text, max 5000 chars."""
    if not raw:
        return ""
    try:
        soup = BeautifulSoup(raw, "lxml")
        text = soup.get_text(separator=" ", strip=True)
        return text[:5000]
    except Exception:
        return raw[:5000]


def _parse_date(entry: feedparser.FeedParserDict) -> Optional[str]:
    """
    Extract and normalise publish date from a feed entry.
    Returns ISO 8601 string or None.
    """
    # Try published_parsed first (feedparser's parsed tuple)
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        try:
            dt = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
            return dt.isoformat()
        except Exception:
            pass

    # Try updated_parsed as fallback
    if hasattr(entry, "updated_parsed") and entry.updated_parsed:
        try:
            dt = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
            return dt.isoformat()
        except Exception:
            pass

    # Try raw published string
    if hasattr(entry, "published") and entry.published:
        try:
            dt = parsedate_to_datetime(entry.published)
            return dt.isoformat()
        except Exception:
            pass

    return None


def _extract_image(entry: feedparser.FeedParserDict) -> Optional[str]:
    """Try to extract a thumbnail or image URL from entry."""
    # media:thumbnail (YouTube, some news feeds)
    if hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
        return entry.media_thumbnail[0].get("url")

    # media:content
    if hasattr(entry, "media_content") and entry.media_content:
        for media in entry.media_content:
            if media.get("type", "").startswith("image"):
                return media.get("url")

    # enclosures (podcasts/images)
    if hasattr(entry, "enclosures") and entry.enclosures:
        for enc in entry.enclosures:
            if enc.get("type", "").startswith("image"):
                return enc.get("href")

    # Parse first <img> from content
    content = ""
    if hasattr(entry, "content") and entry.content:
        content = entry.content[0].get("value", "")
    elif hasattr(entry, "summary"):
        content = entry.summary or ""

    if content:
        try:
            soup = BeautifulSoup(content, "lxml")
            img = soup.find("img")
            if img and img.get("src"):
                return img["src"]
        except Exception:
            pass

    return None


def _extract_content(entry: feedparser.FeedParserDict) -> str:
    """Extract the best available text content from an entry."""
    # Full content block (preferred)
    if hasattr(entry, "content") and entry.content:
        raw = entry.content[0].get("value", "")
        if raw:
            return _clean_html(raw)

    # Summary / description fallback
    if hasattr(entry, "summary") and entry.summary:
        return _clean_html(entry.summary)

    # Title only as last resort
    return getattr(entry, "title", "") or ""


def parse_feed(
    feed_config: dict,
    timeout: int = 15,
) -> list[CrawledArticle]:
    """
    Fetch and parse a single RSS feed.
    Returns a list of CrawledArticle dicts.
    Never raises — logs errors and returns empty list on failure.
    """
    source_id = feed_config["source_id"]
    source_name = feed_config["name"]
    feed_url = feed_config["url"]
    category = feed_config["category"]

    logger.info(f"Fetching: {source_name} ({feed_url})")

    try:
        # Use requests for fetching so we can set proper headers
        # Reddit and some sites block default feedparser UA
        headers = {
            "User-Agent": (
                "Hakken/1.0 (Anime & Manga Intelligence Platform; "
                "https://hakken.app; contact@hakken.app)"
            ),
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
        }
        response = requests.get(feed_url, headers=headers, timeout=timeout)
        response.raise_for_status()

        # Parse the fetched content with feedparser
        feed = feedparser.parse(response.content)

        if feed.bozo and not feed.entries:
            logger.warning(
                f"Feed parse warning for {source_id}: {feed.bozo_exception}"
            )
            return []

        articles: list[CrawledArticle] = []

        for entry in feed.entries:
            # Skip entries with no URL
            url = getattr(entry, "link", None)
            if not url:
                continue

            # Skip entries with no title
            title = getattr(entry, "title", "").strip()
            if not title:
                continue

            article: CrawledArticle = {
                "id": _make_id(url),
                "url": url,
                "title": title,
                "content": _extract_content(entry),
                "source_id": source_id,
                "source_name": source_name,
                "source_url": feed_url,
                "author": getattr(entry, "author", None),
                "published_at": _parse_date(entry),
                "image_url": _extract_image(entry),
                "category": category,
            }
            articles.append(article)

        logger.info(
            f"✅ {source_name}: {len(articles)} articles parsed"
        )
        return articles

    except requests.exceptions.Timeout:
        logger.error(f"❌ Timeout fetching {source_name}")
        return []
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request error for {source_name}: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Unexpected error parsing {source_name}: {e}")
        return []


def parse_all_feeds(
    feeds: list[dict],
    max_workers: int = 5,
) -> list[CrawledArticle]:
    """
    Parse all feeds concurrently using a thread pool.
    Returns deduplicated list of all articles across all feeds.
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    all_articles: list[CrawledArticle] = []
    seen_ids: set[str] = set()

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(parse_feed, feed): feed
            for feed in feeds
        }
        for future in as_completed(futures):
            feed = futures[future]
            try:
                articles = future.result()
                for article in articles:
                    if article["id"] not in seen_ids:
                        seen_ids.add(article["id"])
                        all_articles.append(article)
            except Exception as e:
                logger.error(
                    f"❌ Future error for {feed['source_id']}: {e}"
                )

    logger.info(
        f"Total unique articles across all feeds: {len(all_articles)}"
    )
    return all_articles