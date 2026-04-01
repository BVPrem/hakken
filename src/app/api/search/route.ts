import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { series } from "@/lib/db/schema";
import { ilike, or } from "drizzle-orm";
import { searchAniList, getBestCoverUrl } from "@/lib/api/anilist";
import { getCached, setCached } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type") as "anime" | "manga" | null;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "12"), 24);

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = `search:${q}:${type ?? "all"}:${limit}`;
  const cached = await getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ results: cached, cached: true });
  }

  try {
    const localResults = await db
      .select()
      .from(series)
      .where(
        or(
          ilike(series.titleEn, `%${q}%`),
          ilike(series.titleRomaji, `%${q}%`),
          ilike(series.titleJa, `%${q}%`)
        )
      )
      .limit(limit);

    const anilistResults = await searchAniList(
      q,
      type === "anime" ? "ANIME" : type === "manga" ? "MANGA" : undefined,
      limit
    );

    const localIds = new Set(localResults.map((r) => r.externalId));

    const anilistExtra = anilistResults
      .filter((r) => !localIds.has(r.id))
      .slice(0, limit - localResults.length)
      .map((r) => ({
        id: `anilist-${r.id}`,
        externalId: r.id,
        source: "anilist",
        type: (r.type === "ANIME" ? "anime" : "manga") as "anime" | "manga",
        titleEn: r.title.english,
        titleRomaji: r.title.romaji,
        titleJa: r.title.native,
        coverImage: getBestCoverUrl(r),
        genres: r.genres,
        averageScore: r.averageScore ? r.averageScore / 10 : null,
        status: r.status,
        seasonYear: r.seasonYear,
        popularity: r.popularity,
        synopsis: null,
        tags: [] as string[],
        studios: [] as string[],
        bannerImage: null,
        chapterCount: null,
        episodeCount: r.episodes,
        season: r.season,
        nextEpisodeAt: null,
        isAdult: r.isAdult,
        aiSummary: null,
        embeddingUpdatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    const results = [...localResults, ...anilistExtra];

    await setCached(cacheKey, results, 600);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
