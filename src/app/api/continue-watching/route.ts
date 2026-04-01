import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userSeries, series } from "@/lib/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { getCached, setCached } from "@/lib/redis";

export const revalidate = 300; // 5 min

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cacheKey = `continue-watching:${userId}`;
    const cached = await getCached(cacheKey);
    if (cached) return NextResponse.json(cached);

    const rows = await db
      .select({
        us_status: userSeries.status,
        us_progress: userSeries.progress,
        us_score: userSeries.score,
        us_updatedAt: userSeries.updatedAt,
        s_id: series.id,
        s_titleEn: series.titleEn,
        s_titleJa: series.titleJa,
        s_titleRomaji: series.titleRomaji,
        s_type: series.type,
        s_status: series.status,
        s_coverImage: series.coverImage,
        s_episodeCount: series.episodeCount,
        s_chapterCount: series.chapterCount,
        s_averageScore: series.averageScore,
        s_genres: series.genres,
        s_nextEpisodeAt: series.nextEpisodeAt,
        s_nextChapterAt: series.nextChapterAt,
        s_popularity: series.popularity,
      })
      .from(userSeries)
      .innerJoin(series, eq(userSeries.seriesId, series.id))
      .where(
        and(
          eq(userSeries.userId, userId),
          inArray(userSeries.status, ["watching", "on_hold"])
        )
      )
      .orderBy(desc(userSeries.updatedAt));

    const items = rows.map((r) => {
      const title = r.s_titleEn ?? r.s_titleRomaji ?? r.s_titleJa ?? "Unknown";
      const total =
        r.s_type === "anime"
          ? (r.s_episodeCount ?? 0)
          : (r.s_chapterCount ?? 0);
      const progress = r.us_progress ?? 0;
      const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

      return {
        id: r.s_id,
        title,
        type: r.s_type,
        status: r.us_status,
        coverImage: r.s_coverImage,
        progress,
        totalEpisodesOrChapters: total,
        percentage,
        score: r.us_score,
        seriesStatus: r.s_status,
        averageScore: r.s_averageScore,
        genres: r.s_genres ?? [],
        nextEpisodeAt: r.s_nextEpisodeAt
          ? new Date(r.s_nextEpisodeAt).toISOString()
          : null,
        nextChapterAt: r.s_nextChapterAt
          ? new Date(r.s_nextChapterAt).toISOString()
          : null,
        popularity: r.s_popularity,
        updatedAt: r.us_updatedAt
          ? new Date(r.us_updatedAt).toISOString()
          : null,
      };
    });

    await setCached(cacheKey, items, 300);
    return NextResponse.json(items);
  } catch (err) {
    console.error("Continue watching fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch continue watching data" },
      { status: 500 }
    );
  }
}
