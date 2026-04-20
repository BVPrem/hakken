import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userSeries, series } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(
    { error: "Unauthorized" }, { status: 401 }
  );

  try {
    const watchlist = await db
      .select({
        seriesId: userSeries.seriesId,
        status: userSeries.status,
        score: userSeries.score,
        progress: userSeries.progress,
        updatedAt: userSeries.updatedAt,
        title: series.titleEn,
        titleRomaji: series.titleRomaji,
        coverImage: series.coverImage,
        type: series.type,
        episodeCount: series.episodeCount,
        genres: series.genres,
      })
      .from(userSeries)
      .leftJoin(series, eq(userSeries.seriesId, series.id))
      .where(eq(userSeries.userId, userId))
      .orderBy(desc(userSeries.updatedAt));

    return NextResponse.json({ watchlist });
  } catch (err) {
    console.error("Profile watchlist error:", err);
    return NextResponse.json(
      { error: "Failed" }, { status: 500 }
    );
  }
}