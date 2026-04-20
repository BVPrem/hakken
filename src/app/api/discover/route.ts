import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { series } from "@/lib/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { getCached, setCached } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "popular";
  const type = searchParams.get("type");
  const genre = searchParams.get("genre");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 24;
  const offset = (page - 1) * limit;

  const cacheKey = `discover:${tab}:${type ?? "all"}:${genre ?? "all"}:${page}`;
  const cached = await getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const conditions: any[] = [];
    if (type) conditions.push(eq(series.type, type as "anime" | "manga"));
    if (genre) conditions.push(
      sql`${series.genres} @> ARRAY[${genre}]::text[]`
    );

    const where = conditions.length > 0
      ? and(...conditions)
      : undefined;

    const orderBy =
      tab === "airing"   ? desc(series.popularity) :
      tab === "top"      ? desc(series.averageScore) :
      tab === "newest"   ? desc(series.seasonYear) :
                           desc(series.popularity);

    const airingCondition = tab === "airing"
      ? eq(series.status, "RELEASING")
      : undefined;

    const finalWhere = airingCondition
      ? (where ? and(where, airingCondition) : airingCondition)
      : where;

    const [rows, countResult] = await Promise.all([
      db.select().from(series)
        .where(finalWhere)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(series)
        .where(finalWhere),
    ]);

    const genreRows = await db
      .select({ genres: series.genres })
      .from(series)
      .where(type ? eq(series.type, type as "anime" | "manga") : undefined)
      .limit(200);

    const allGenres = new Set<string>();
    genreRows.forEach(r =>
      (r.genres ?? []).forEach(g => allGenres.add(g))
    );
    const topGenres = [...allGenres]
      .sort()
      .filter(g => g.length < 20)
      .slice(0, 20);

    const total = Number(countResult[0]?.count ?? 0);
    const result = {
      series: rows,
      genres: topGenres,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
      },
    };

    await setCached(cacheKey, result, 600);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Discover API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch" }, { status: 500 }
    );
  }
}