import { getCached, setCached } from "@/lib/redis";

const MANGADEX_BASE = "https://api.mangadex.org";
const COVER_BASE = "https://uploads.mangadex.org/covers";
const CACHE_TTL = 3600;

async function mdFetch<T>(
  path: string,
  ttl = CACHE_TTL
): Promise<T | null> {
  const cacheKey = `mangadex:${path}`;
  const cached = await getCached<T>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${MANGADEX_BASE}${path}`, {
      headers: { "User-Agent": "Hakken/1.0 (hakken.app)" },
      next: { revalidate: ttl },
    });
    if (!res.ok) throw new Error(`MangaDex error: ${res.status}`);
    const json = await res.json();
    const data = json.data ?? json;
    await setCached(cacheKey, data, ttl);
    return data as T;
  } catch (err) {
    console.error("MangaDex fetch failed:", err);
    return null;
  }
}

export interface MangaDexManga {
  id: string;
  type: "manga";
  attributes: {
    title: Record<string, string>;
    altTitles: Array<Record<string, string>>;
    description: Record<string, string>;
    status: string | null;
    year: number | null;
    contentRating: string | null;
    tags: Array<{
      id: string;
      attributes: { name: Record<string, string>; group: string };
    }>;
    lastChapter: string | null;
    lastVolume: string | null;
    latestUploadedChapter: string | null;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: Record<string, unknown>;
  }>;
}

export interface MangaDexChapter {
  id: string;
  attributes: {
    title: string | null;
    volume: string | null;
    chapter: string | null;
    pages: number;
    translatedLanguage: string;
    publishAt: string;
    readableAt: string;
  };
  relationships: Array<{ id: string; type: string }>;
}

// ─── Get manga title (English preferred) ─────────────────
export function getMangaTitle(manga: MangaDexManga): string {
  const attrs = manga.attributes;
  return (
    attrs.title["en"] ??
    attrs.title["ja-ro"] ??
    Object.values(attrs.title)[0] ??
    "Unknown"
  );
}

// ─── Get cover art URL ────────────────────────────────────
export function getCoverUrl(
  manga: MangaDexManga,
  size: "256" | "512" = "512"
): string | null {
  const cover = manga.relationships.find((r) => r.type === "cover_art");
  if (!cover?.attributes?.fileName) return null;
  return `${COVER_BASE}/${manga.id}/${cover.attributes.fileName}.${size}.jpg`;
}

// ─── Search manga ─────────────────────────────────────────
export async function searchManga(
  title: string,
  limit = 10
): Promise<MangaDexManga[]> {
  if (!title.trim()) return [];
  const path = `/manga?title=${encodeURIComponent(title)}&limit=${limit}&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art&order[relevance]=desc`;
  return (await mdFetch<MangaDexManga[]>(path, 600)) ?? [];
}

// ─── Get manga by ID ──────────────────────────────────────
export async function getMangaById(
  id: string
): Promise<MangaDexManga | null> {
  const path = `/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`;
  const data = await mdFetch<MangaDexManga>(path);
  return data;
}

// ─── Get latest chapters across all manga ────────────────
export async function getLatestChapters(
  limit = 20,
  lang = "en"
): Promise<MangaDexChapter[]> {
  const path = `/chapter?limit=${limit}&translatedLanguage[]=${lang}&order[publishAt]=desc&includes[]=manga`;
  return (await mdFetch<MangaDexChapter[]>(path, 600)) ?? [];
}

// ─── Get chapters for a specific manga ───────────────────
export async function getMangaChapters(
  mangaId: string,
  limit = 10,
  lang = "en"
): Promise<MangaDexChapter[]> {
  const path = `/manga/${mangaId}/feed?limit=${limit}&translatedLanguage[]=${lang}&order[chapter]=desc`;
  return (await mdFetch<MangaDexChapter[]>(path)) ?? [];
}

// ─── Get popular manga ────────────────────────────────────
export async function getPopularManga(
  limit = 20
): Promise<MangaDexManga[]> {
  const path = `/manga?limit=${limit}&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art&order[followedCount]=desc`;
  return (await mdFetch<MangaDexManga[]>(path)) ?? [];
}
