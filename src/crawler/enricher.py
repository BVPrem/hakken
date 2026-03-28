#!/usr/bin/env python3
"""
Hakken AI Enricher
Calls NVIDIA API to enrich articles with:
- 3-bullet summary
- Sentiment score (-1.0 to 1.0)
- Topic tags (3-7 per article)
"""

import json
import logging
import time
from typing import Optional
from openai import OpenAI
from config import NVIDIA_API_KEY, NVIDIA_BASE_URL, MODEL_FAST, \
    MODEL_SMART, ARTICLE_CONTENT_MAX

logger = logging.getLogger("hakken.enricher")

# Initialise NVIDIA client
_client = OpenAI(
    api_key=NVIDIA_API_KEY,
    base_url=NVIDIA_BASE_URL,
)


def _call_nvidia(
    prompt: str,
    model: str = MODEL_FAST,
    max_tokens: int = 512,
    retries: int = 2,
) -> Optional[str]:
    """
    Call NVIDIA API with retry logic.
    Returns response text or None on failure.
    """
    for attempt in range(retries + 1):
        try:
            response = _client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=0.2,
            )
            return response.choices[0].message.content
        except Exception as e:
            if attempt < retries:
                logger.warning(
                    f"NVIDIA API attempt {attempt + 1} failed: {e}. "
                    f"Retrying..."
                )
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                logger.error(
                    f"NVIDIA API failed after {retries + 1} attempts: {e}"
                )
                return None


def generate_summary(title: str, content: str) -> Optional[str]:
    """
    Generate a 3-bullet summary of an article.
    Returns plain text with bullet points or None.
    """
    prompt = f"""Summarise this anime/manga news article in exactly \
3 bullet points.
Be concise. Each bullet must be one sentence max.
Format as plain text starting each line with "• ".
Do not include any preamble or headers.

Title: {title}
Content: {content[:ARTICLE_CONTENT_MAX]}"""

    return _call_nvidia(prompt, model=MODEL_FAST, max_tokens=256)


def score_sentiment(
    title: str, content: str
) -> tuple[Optional[str], Optional[float]]:
    """
    Score the sentiment of an article.
    Returns (sentiment_label, sentiment_score) tuple.
    sentiment_label: "positive" | "negative" | "neutral" | "mixed"
    sentiment_score: float from -1.0 (very negative) to 1.0 (very positive)
    """
    prompt = f"""Analyze the sentiment of this anime/manga news article.
Respond with ONLY a valid JSON object — no markdown, no explanation:
{{"sentiment": "positive|negative|neutral|mixed", "score": -1.0}}

Where score is a float from -1.0 (very negative) to 1.0 (very positive).

Title: {title}
Content: {content[:500]}"""

    result = _call_nvidia(prompt, model=MODEL_SMART, max_tokens=64)
    if not result:
        return None, None

    try:
        # Strip any markdown fences if present
        cleaned = result.strip().strip("```json").strip("```").strip()
        parsed = json.loads(cleaned)
        sentiment = parsed.get("sentiment", "neutral")
        score = float(parsed.get("score", 0.0))
        # Clamp score to valid range
        score = max(-1.0, min(1.0, score))
        return sentiment, score
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        logger.warning(f"Failed to parse sentiment response: {e} | "
                       f"Raw: {result}")
        return "neutral", 0.0


def extract_tags(title: str, content: str) -> list[str]:
    """
    Extract 3-7 topic tags from an article.
    Returns list of tag strings.
    """
    prompt = f"""Extract 3 to 7 topic tags from this anime/manga article.
Tags should be specific: series names, studio names, event names, \
or broad topics.
Respond with ONLY a valid JSON array of strings — no markdown:
["tag1", "tag2", "tag3"]

Title: {title}
Content: {content[:800]}"""

    result = _call_nvidia(prompt, model=MODEL_FAST, max_tokens=128)
    if not result:
        return []

    try:
        cleaned = result.strip().strip("```json").strip("```").strip()
        tags = json.loads(cleaned)
        if isinstance(tags, list):
            return [str(t).strip() for t in tags[:7]]
        return []
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning(f"Failed to parse tags response: {e} | "
                       f"Raw: {result}")
        return []


def enrich_article(article: dict) -> dict:
    """
    Fully enrich a single article with AI data.
    Returns dict with summary, sentiment, sentiment_score, tags.
    Safe — never raises, always returns something.
    """
    title = article.get("title", "")
    content = article.get("content", "")

    logger.info(f"Enriching: {title[:60]}...")

    summary = generate_summary(title, content)
    sentiment, sentiment_score = score_sentiment(title, content)
    tags = extract_tags(title, content)

    return {
        "summary": summary,
        "sentiment": sentiment,
        "sentiment_score": sentiment_score,
        "tags": tags,
    }


def enrich_batch(
    articles: list[dict],
    delay_between: float = 0.5,
) -> list[dict]:
    """
    Enrich a batch of articles.
    delay_between: seconds to wait between API calls (rate limiting).
    Returns list of enrichment dicts in same order as input.
    """
    results = []
    total = len(articles)

    for i, article in enumerate(articles):
        logger.info(f"Enriching article {i + 1}/{total}")
        enrichment = enrich_article(article)
        results.append(enrichment)

        # Small delay to avoid rate limiting
        if i < total - 1:
            time.sleep(delay_between)

    return results