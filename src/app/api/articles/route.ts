import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq, desc, ilike, sql, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10))
    );
    const source = searchParams.get("source") ?? "";
    const query = searchParams.get("q") ?? "";

    const conditions = [];
    if (source) conditions.push(eq(articles.source, source));
    if (query) conditions.push(ilike(articles.title, `%${query}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, countResult, sourcesResult] = await Promise.all([
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
      db
        .selectDistinct({ source: articles.source })
        .from(articles)
        .orderBy(articles.source),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const sources = sourcesResult.map((r) => r.source);

    return NextResponse.json({
      articles: items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
      sources,
    });
  } catch (err) {
    console.error("Articles API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
