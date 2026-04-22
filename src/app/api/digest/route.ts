import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { series, articles, userSeries } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getCached, setCached } from "@/lib/redis";
import OpenAI from "openai";

const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY!,
  baseURL: process.env.NVIDIA_BASE_URL
    ?? "https://integrate.api.nvidia.com/v1",
});

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(
    { error: "Unauthorized" }, { status: 401 }
  );

  // Cache with weekly TTL keyed by userId
  const now = new Date();
  const weekKey = `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`;
  const cacheKey = `digest:${userId}:${weekKey}`;
  const cached = await getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // Get user's watchlist genres for personalisation
    const watchlist = await db
      .select({
        genres: series.genres,
        title: series.titleEn,
        status: userSeries.status,
      })
      .from(userSeries)
      .leftJoin(series, eq(userSeries.seriesId, series.id))
      .where(eq(userSeries.userId, userId))
      .limit(10);

    const userGenres = [...new Set(
      watchlist.flatMap(w => w.genres ?? [])
    )].slice(0, 5);

    // Get trending series
    const trending = await db
      .select({ titleEn: series.titleEn,
                popularity: series.popularity })
      .from(series)
      .where(eq(series.status, "RELEASING"))
      .orderBy(desc(series.popularity))
      .limit(5);

    // Get latest news headlines
    const news = await db
      .select({ title: articles.title,
                source: articles.source })
      .from(articles)
      .orderBy(desc(articles.publishedAt))
      .limit(10);

    const trendingNames = trending
      .map(t => t.titleEn).filter(Boolean).join(", ");
    const newsHeadlines = news
      .map(n => `- ${n.title}`).join("\n");
    const genreStr = userGenres.join(", ")
      || "action, adventure";
    const watchingTitles = watchlist
      .filter(w => w.status === "watching")
      .map(w => w.title).filter(Boolean).join(", ");

    const digestRes = await nvidia.chat.completions.create(
      {
        model: "meta/llama-3.1-8b-instruct",
        messages: [{
          role: "user",
          content: `You are writing a weekly anime digest for a fan on Hakken.

User's favourite genres: ${genreStr}
Currently watching: ${watchingTitles || "nothing yet"}
Trending this week: ${trendingNames}
Recent news headlines:
${newsHeadlines}

Write a SHORT weekly digest with EXACTLY this JSON structure, no other text:
{
  "greeting": "One punchy opening line (max 12 words)",
  "trending_pick": {
    "title": "Best trending series to watch this week",
    "reason": "One sentence why (max 20 words)"
  },
  "news_summary": "One sentence summarising the biggest anime news this week (max 25 words)",
  "recommendation": {
    "title": "One series recommendation based on their genres",
    "reason": "One sentence why (max 20 words)"
  },
  "fun_fact": "One interesting anime/manga fact or trivia (max 20 words)"
}`,
        }],
        max_tokens: 400,
        temperature: 0.8,
      }
    );

    let digest = null;
    try {
      const raw = digestRes.choices[0]?.message?.content ?? "{}";
      const clean = raw.replace(/```json|```/g, "").trim();
      digest = JSON.parse(clean);
    } catch { digest = null; }

    const result = { digest, generatedAt: now.toISOString() };
    await setCached(cacheKey, result, 604800);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Digest API error:", err);
    return NextResponse.json(
      { error: "Failed" }, { status: 500 }
    );
  }
}