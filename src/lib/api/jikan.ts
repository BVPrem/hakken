import { getCached, setCached } from "@/lib/redis";

const JIKAN_BASE = "https://api.jikan.moe/v4";
const CACHE_TTL = 3600;

// Jikan has strict rate limiting — 3 req/sec, 60 req/min
// Always cache aggressively
async function jikanFetch<T>(
  path: string,
  ttl = CACHE_TTL
): Promise<T | null> {
  const cacheKey = `jikan:${path}`;
  const cached = await getCached<T>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${JIKAN_BASE}${path}`, {
      next: { revalidate: ttl },
    });
    if (res.status === 429) {
      console.warn("Jikan rate limit hit — returning null");
      return null;
    }
    if (!res.ok) throw new Error(`Jikan error: ${res.status}`);
    const json = await res.json();
    await setCached(cacheKey, json.data, ttl);
    return json.data as T;
  } catch (err) {
    console.error("Jikan fetch failed:", err);
    return null;
  }
}

export interface JikanAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  type: string | null;
  source: string | null;
  episodes: number | null;
  status: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  synopsis: string | null;
  season: string | null;
  year: number | null;
  images: {
    jpg: { image_url: string | null; large_image_url: string | null };
    webp: { image_url: string | null; large_image_url: string | null };
  };
  genres: Array<{ mal_id: number; name: string }>;
  studios: Array<{ mal_id: number; name: string }>;
  url: string;
}

export async function getTopAnimeJikan(
  page = 1,
  limit = 25
): Promise<JikanAnime[]> {
  return (await jikanFetch<JikanAnime[]>(
    `/top/anime?page=${page}&limit=${limit}`
  )) ?? [];
}

export async function searchAnimeJikan(
  query: string,
  limit = 10
): Promise<JikanAnime[]> {
  if (!query.trim()) return [];
  return (await jikanFetch<JikanAnime[]>(
    `/anime?q=${encodeURIComponent(query)}&limit=${limit}&sfw=true`,
    600
  )) ?? [];
}

export async function getAnimeByMalId(
  malId: number
): Promise<JikanAnime | null> {
  return jikanFetch<JikanAnime>(`/anime/${malId}`);
}

export async function getRecentAnimeReviews(
  page = 1
): Promise<unknown[]> {
  return (await jikanFetch<unknown[]>(
    `/reviews/anime?page=${page}`, 1800
  )) ?? [];
}
