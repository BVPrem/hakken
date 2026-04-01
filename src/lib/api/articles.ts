import { db } from "@/lib/db";
import { articles, type Article } from "@/lib/db/schema";
import { getCached, setCached } from "@/lib/redis";
import { eq, desc, ilike, and, sql, inArray } from "drizzle-orm";

const CACHE_TTL = 300; // 5 min

export type ArticleWithRelations = Article;

export interface ArticleFilters {
  source?: string;
  search?: string;
  sentiment?: "positive" | "negative" | "neutral" | "mixed";
  tag?: string;
}

export interface ArticleListResult {
  articles: Article[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Get paginated articles with optional filters ─────────
export async function getArticles(
  page = 1,
  pageSize = 20,
  filters: ArticleFilters = {}
): Promise<ArticleListResult | null> {
  const cacheKey = `articles:list:${page}:${pageSize}:${JSON.stringify(filters)}`;
  const cached = await getCached<ArticleListResult>(cacheKey);
  if (cached) return cached;

  try {
    const conditions = [];
    if (filters.source) {
      conditions.push(eq(articles.source, filters.source));
    }
    if (filters.search) {
      conditions.push(ilike(articles.title, `%${filters.search}%`));
    }
    if (filters.sentiment) {
      conditions.push(eq(articles.sentiment, filters.sentiment));
    }
    if (filters.tag) {
      conditions.push(
        sql`${filters.tag} = ANY(${articles.tags})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(articles)
        .where(whereClause)
        .orderBy(desc(articles.publishedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const result: ArticleListResult = {
      articles: items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };

    await setCached(cacheKey, result, CACHE_TTL);
    return result;
  } catch (err) {
    console.error("Failed to fetch articles:", err);
    return null;
  }
}

// ─── Get a single article by ID ───────────────────────────
export async function getArticleById(
  id: string
): Promise<Article | null> {
  const cacheKey = `articles:id:${id}`;
  const cached = await getCached<Article>(cacheKey);
  if (cached) return cached;

  try {
    const result = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);

    const article = result[0] ?? null;
    if (article) await setCached(cacheKey, article, CACHE_TTL);
    return article;
  } catch (err) {
    console.error("Failed to fetch article:", err);
    return null;
  }
}

// ─── Get distinct sources ─────────────────────────────────
export async function getArticleSources(): Promise<string[]> {
  const cacheKey = `articles:sources`;
  const cached = await getCached<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const result = await db
      .selectDistinct({ source: articles.source })
      .from(articles)
      .orderBy(articles.source);

    const sources = result.map((r) => r.source);
    await setCached(cacheKey, sources, CACHE_TTL * 2);
    return sources;
  } catch (err) {
    console.error("Failed to fetch article sources:", err);
    return [];
  }
}

// ─── Get articles by tag ──────────────────────────────────
export async function getArticlesByTag(
  tag: string,
  limit = 10
): Promise<Article[]> {
  if (!tag.trim()) return [];

  const cacheKey = `articles:tag:${tag}:${limit}`;
  const cached = await getCached<Article[]>(cacheKey);
  if (cached) return cached;

  try {
    const result = await db
      .select()
      .from(articles)
      .where(sql`${tag} = ANY(${articles.tags})`)
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    if (result.length) await setCached(cacheKey, result, CACHE_TTL);
    return result;
  } catch (err) {
    console.error("Failed to fetch articles by tag:", err);
    return [];
  }
}

// ─── Get recent articles for a specific series ────────────
export async function getArticlesBySeries(
  seriesId: string,
  limit = 10
): Promise<Article[]> {
  const cacheKey = `articles:series:${seriesId}:${limit}`;
  const cached = await getCached<Article[]>(cacheKey);
  if (cached) return cached;

  try {
    const result = await db
      .select()
      .from(articles)
      .where(sql`${seriesId} = ANY(${articles.relatedSeriesIds})`)
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    if (result.length) await setCached(cacheKey, result, CACHE_TTL);
    return result;
  } catch (err) {
    console.error("Failed to fetch articles by series:", err);
    return [];
  }
}

// ─── Helper: format source name for display ───────────────
export function formatSourceName(source: string): string {
  const names: Record<string, string> = {
    animenewsnetwork: "Anime News Network",
    crunchyroll: "Crunchyroll",
    myanimelist: "MyAnimeList",
    reddit: "Reddit",
    mangaupdates: "Manga Updates",
    otakuusamagazine: "Otaku USA",
  };
  return names[source] ?? source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Helper: relative time string ─────────────────────────
export function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: diffDay > 365 ? "numeric" : undefined,
  });
}
