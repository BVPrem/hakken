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
  
  const shouldRefresh = req.nextUrl.searchParams.get("refresh") === "1";
  const cached = !shouldRefresh ? await getCached(cacheKey) : null;
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
          content: `You are the Hakken AI writing a weekly anime digest.
You MUST use specific, real data provided. Do not add
generic filler. If you don't have specific data for a
field, say so honestly rather than being vague.

DATA AVAILABLE:
Currently airing series (by popularity):
${trending.map((t, i) => `${i+1}. ${t.titleEn} (popularity: ${t.popularity})`).join("\n")}

Recent news headlines this week:
${newsHeadlines}

User's currently watching:
${watchingTitles || "Nothing tracked yet"}

User's favourite genres:
${genreStr}

RULES:
1. trending_pick MUST be one of the series listed above
2. news_summary MUST reference a specific headline above
3. recommendation MUST be based on the user's genres
4. fun_fact must be a specific verifiable fact
5. greeting must reference something from the data

Respond ONLY with this exact JSON:
{
  "greeting": "One specific sentence referencing real data (max 15 words)",
  "trending_pick": {
    "title": "EXACT name from the trending list above",
    "reason": "Specific reason based on news or popularity data (max 20 words)"
  },
  "news_summary": "Specific headline reference - name the actual show and event (max 25 words)",
  "recommendation": {
    "title": "Real anime matching user genres: ${genreStr}",
    "reason": "Specific reason tied to their genre preference (max 20 words)"
  },
  "fun_fact": "Specific verifiable anime fact with a number or name (max 20 words)"
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