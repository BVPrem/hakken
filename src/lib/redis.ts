import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://nice-spaniel-67699.upstash.io",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "gQAAAAAAAQhzAAIncDI5NzRiNTM2NTFlYTc0NDBhYmQxYWZhYzk0ZTk1NjAxM3AyNjc2OTk",
});

// ─── Helper: Crawler deduplication ───────────────────────
// Returns true if article URL is new (not seen before)
// Returns false if already crawled (duplicate)
export async function isNewArticle(url: string): Promise<boolean> {
  const key = `crawled:${url}`;
  const result = await redis.set(key, "1", {
    ex: 60 * 60 * 24 * 30, // 30 day TTL
    nx: true,              // Only set if not exists
  });
  return result === "OK";
}

// ─── Helper: Query result caching ────────────────────────
export async function getCached<T>(key: string): Promise<T | null> {
  return redis.get<T>(key);
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = 600 // 10 min default
): Promise<void> {
  await redis.set(key, value, { ex: ttlSeconds });
}

export async function invalidateCache(key: string): Promise<void> {
  await redis.del(key);
}
