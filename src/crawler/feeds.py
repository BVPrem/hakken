#!/usr/bin/env python3
"""
Hakken RSS Feed Configuration
Add new feeds here — one dict entry per source.
The crawler reads this list and processes all feeds automatically.
"""

from typing import TypedDict

class Feed(TypedDict):
    name: str           # Human readable name
    url: str            # RSS feed URL
    source_id: str      # Unique slug — used in DB + Redis keys
    category: str       # "news" | "community" | "youtube" | "releases"
    language: str       # "en" | "ja"
    priority: int       # 1 = high (fetch every run), 2 = medium, 3 = low

FEEDS: list[Feed] = [
    # ─── Anime News ──────────────────────────────────────
    {
        "name": "Anime News Network",
        "url": "https://www.animenewsnetwork.com/all/rss.xml?ann-edition=us",
        "source_id": "ann",
        "category": "news",
        "language": "en",
        "priority": 1,
    },
    {
        "name": "Anime Feminist",
        "url": "https://www.animefeminist.com/feed/",
        "source_id": "anime_feminist",
        "category": "news",
        "language": "en",
        "priority": 2,
    },
    {
        "name": "MyAnimeList News",
        "url": "https://myanimelist.net/rss/news.xml",
        "source_id": "mal_news",
        "category": "news",
        "language": "en",
        "priority": 1,
    },
    {
        "name": "Anime Corner",
        "url": "https://animecorner.me/feed/",
        "source_id": "anime_corner",
        "category": "news",
        "language": "en",
        "priority": 2,
    },
    {
        "name": "Anime Trending News",
        "url": "https://anitrendz.net/news/feed/",
        "source_id": "anitrendz",
        "category": "news",
        "language": "en",
        "priority": 2,
    },

    # ─── Community / Reddit ───────────────────────────────
    {
        "name": "Reddit r/anime",
        "url": "https://www.reddit.com/r/anime/hot.rss?limit=25",
        "source_id": "reddit_anime",
        "category": "community",
        "language": "en",
        "priority": 1,
    },
    {
        "name": "Reddit r/manga",
        "url": "https://www.reddit.com/r/manga/hot.rss?limit=25",
        "source_id": "reddit_manga",
        "category": "community",
        "language": "en",
        "priority": 1,
    },
    {
        "name": "Reddit r/animenews",
        "url": "https://www.reddit.com/r/animenews/hot.rss?limit=25",
        "source_id": "reddit_animenews",
        "category": "community",
        "language": "en",
        "priority": 1,
    },

    # ─── Release Trackers ─────────────────────────────────
    {
        "name": "Livechart.me",
        "url": "https://www.livechart.me/feeds/episodes",
        "source_id": "livechart",
        "category": "releases",
        "language": "en",
        "priority": 1,
    },

    # ─── YouTube (via RSS) ────────────────────────────────
    {
        "name": "Kotaku Gaming/Anime",
        "url": "https://kotaku.com/tag/anime/rss",
        "source_id": "kotaku_anime",
        "category": "news",
        "language": "en",
        "priority": 3,
    },
    {
        "name": "Anime Senpai",
        "url": "https://www.animesenpai.net/feed/",
        "source_id": "anime_senpai",
        "category": "news",
        "language": "en",
        "priority": 2,
    },
]

# Quick lookup by source_id
FEED_MAP: dict[str, Feed] = {f["source_id"]: f for f in FEEDS}

def get_feeds_by_priority(priority: int) -> list[Feed]:
    """Return all feeds matching a given priority level."""
    return [f for f in FEEDS if f["priority"] == priority]

def get_feeds_by_category(category: str) -> list[Feed]:
    """Return all feeds in a given category."""
    return [f for f in FEEDS if f["category"] == category]