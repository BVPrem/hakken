#!/usr/bin/env python3
"""
Hakken Crawler Configuration
Loads environment variables and exposes typed config constants.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env.local from project root (one level up from src/crawler/)
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(dotenv_path=env_path)

# ─── Database ────────────────────────────────────────────
DATABASE_URL: str = os.environ["DATABASE_URL"]

# ─── Upstash Redis ───────────────────────────────────────
UPSTASH_REDIS_REST_URL: str = os.environ["UPSTASH_REDIS_REST_URL"]
UPSTASH_REDIS_REST_TOKEN: str = os.environ["UPSTASH_REDIS_REST_TOKEN"]

# ─── NVIDIA AI ───────────────────────────────────────────
NVIDIA_API_KEY: str = os.environ["NVIDIA_API_KEY"]
NVIDIA_BASE_URL: str = os.environ.get(
    "NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"
)

# ─── Models ──────────────────────────────────────────────
MODEL_FAST = "meta/llama-3.1-8b-instruct"
MODEL_SMART = "meta/llama-3.1-70b-instruct"
MODEL_EMBED = "nvidia/nv-embedqa-e5-v5"

# ─── Crawler settings ────────────────────────────────────
REDIS_DEDUP_TTL_DAYS = 30       # How long to remember seen URLs
ARTICLE_CONTENT_MAX = 2000      # Max chars sent to AI for enrichment
EMBED_BATCH_SIZE = 10           # Articles to embed per batch
REQUEST_TIMEOUT = 15            # RSS fetch timeout in seconds
MAX_FEED_WORKERS = 5            # Concurrent feed fetchers