import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userSeries, series } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
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

  const bust = req.nextUrl.searchParams.get("bust");
  const cacheKey = `taste:${userId}`;
  const cached = !bust ? await getCached(cacheKey) : null;
  if (cached) return NextResponse.json(cached);

  try {
    const watchlist = await db
      .select({
        status: userSeries.status,
        score: userSeries.score,
        title: series.titleEn,
        titleRomaji: series.titleRomaji,
        genres: series.genres,
        studios: series.studios,
        type: series.type,
        averageScore: series.averageScore,
      })
      .from(userSeries)
      .leftJoin(series, eq(userSeries.seriesId, series.id))
      .where(eq(userSeries.userId, userId));

    if (watchlist.length === 0) {
      return NextResponse.json({
        isEmpty: true,
        genreData: [],
        studioData: [],
        statusData: [],
        aiProfile: null,
        recommendations: [],
      });
    }

    // Build genre breakdown
    const genreCount: Record<string, number> = {};
    watchlist.forEach(w => {
      (w.genres ?? []).forEach(g => {
        genreCount[g] = (genreCount[g] ?? 0) + 1;
      });
    });
    const genreData = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }));

    // Build studio breakdown
    const studioCount: Record<string, number> = {};
    watchlist.forEach(w => {
      (w.studios ?? []).forEach((s: string) => {
        studioCount[s] = (studioCount[s] ?? 0) + 1;
      });
    });
    const studioData = Object.entries(studioCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([studio, count]) => ({ studio, count }));

    // Build status breakdown
    const statusCount: Record<string, number> = {};
    watchlist.forEach(w => {
      statusCount[w.status] =
        (statusCount[w.status] ?? 0) + 1;
    });
    const statusData = Object.entries(statusCount)
      .map(([status, count]) => ({ status, count }));

    // Top genres for AI prompt
    const topGenres = genreData.slice(0, 5)
      .map(g => g.genre).join(", ");
    const topStudios = studioData.slice(0, 3)
      .map(s => s.studio).join(", ");
    const completedTitles = watchlist
      .filter(w => w.status === "completed")
      .map(w => w.title ?? w.titleRomaji)
      .filter(Boolean)
      .slice(0, 8)
      .join(", ");

    // Generate AI taste profile
    const profileRes = await nvidia.chat.completions.create(
      {
        model: "meta/llama-3.1-8b-instruct",
        messages: [{
          role: "user",
          content: `You are an anime taste analyst for the Hakken platform.
Analyse this user's anime/manga watching history and write a personalised taste profile.

Their data:
- Top genres: ${topGenres || "Not enough data"}
- Favourite studios: ${topStudios || "Various"}
- Completed: ${completedTitles || "Nothing completed yet"}
- Total tracked: ${watchlist.length} series
- Completed: ${statusData.find(s => s.status === "completed")?.count ?? 0}
- Watching: ${statusData.find(s => s.status === "watching")?.count ?? 0}

Write exactly 3 sentences:
1. Their core taste archetype (e.g. "You're a dark fantasy devotee who...")
2. What they value in storytelling based on their genres
3. One specific prediction about what they'll love next

Be specific, insightful and enthusiastic. Use second person (you/your).
No bullet points. Just 3 flowing sentences.`,
        }],
        max_tokens: 200,
        temperature: 0.8,
      }
    );

    const aiProfile =
      profileRes.choices[0]?.message?.content ?? null;

    // Generate 3 AI recommendations
    const recsRes = await nvidia.chat.completions.create(
      {
        model: "meta/llama-3.1-8b-instruct",
        messages: [{
          role: "user",
          content: `Based on this anime fan's taste profile, recommend exactly 3 anime series they haven't seen yet.

Their top genres: ${topGenres}
Series they've watched: ${completedTitles}

Respond ONLY in this exact JSON format, no other text:
[
  {
    "title": "Series Name",
    "reason": "One sentence why this matches their taste",
    "genre": "Primary Genre"
  },
  {
    "title": "Series Name",
    "reason": "One sentence why this matches their taste",
    "genre": "Primary Genre"
  },
  {
    "title": "Series Name",
    "reason": "One sentence why this matches their taste",
    "genre": "Primary Genre"
  }
]`,
        }],
        max_tokens: 300,
        temperature: 0.7,
      }
    );

    let recommendations = [];
    try {
      const recsText =
        recsRes.choices[0]?.message?.content ?? "[]";
      const clean = recsText
        .replace(/```json|```/g, "").trim();
      recommendations = JSON.parse(clean);
    } catch { recommendations = []; }

    const result = {
      isEmpty: false,
      genreData,
      studioData,
      statusData,
      aiProfile,
      recommendations,
      totalTracked: watchlist.length,
    };

    // Cache for 2 hours
    await setCached(cacheKey, result, 7200);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Taste API error:", err);
    return NextResponse.json(
      { error: "Failed" }, { status: 500 }
    );
  }
}