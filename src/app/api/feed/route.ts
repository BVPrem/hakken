import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { getCached, setCached } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "12"));
  const source = searchParams.get("source");
  const sentiment = searchParams.get("sentiment");
  const seriesId = searchParams.get("seriesId");
  const offset = (page - 1) * limit;

  const cacheKey = `feed:${page}:${limit}:${source ?? "all"}:${sentiment ?? "all"}`;
  const cached = await getCached(cacheKey);
  if (cached) return NextResponse.json({ ...cached, cached: true });

  try {
    const conditions = [];
    if (source) conditions.push(eq(articles.source, source));
    if (sentiment)
      conditions.push(
        eq(
          articles.sentiment,
          sentiment as "positive" | "negative" | "neutral" | "mixed"
        )
      );
    if (seriesId)
      conditions.push(
        sql`${articles.relatedSeriesIds} @> ARRAY[${seriesId}]::text[]`
      );

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(articles)
        .where(where)
        .orderBy(desc(articles.publishedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .where(where),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const response = {
      articles: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };

    await setCached(cacheKey, response, 300);
    return NextResponse.json(response);
  } catch (err) {
    console.error("Feed error:", err);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
