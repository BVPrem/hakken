import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { series, userSeries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

  const seriesId = req.nextUrl.searchParams.get("seriesId");
  if (!seriesId) return NextResponse.json(
    { error: "seriesId required" }, { status: 400 }
  );

  const cacheKey = `insight:${userId}:${seriesId}`;
  const cached = await getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // Get series data
    const seriesRows = await db
      .select()
      .from(series)
      .where(eq(series.id, seriesId))
      .limit(1);

    const seriesData = seriesRows[0];
    if (!seriesData) return NextResponse.json(
      { error: "Series not found" }, { status: 404 }
    );

    // Get user's taste profile for personalisation
    const watchlist = await db
      .select({
        genres: series.genres,
        title: series.titleEn,
      })
      .from(userSeries)
      .leftJoin(series, eq(userSeries.seriesId, series.id))
      .where(eq(userSeries.userId, userId))
      .limit(15);

    const userGenres = [...new Set(
      watchlist.flatMap(w => w.genres ?? [])
    )].slice(0, 5);

    const title = seriesData.titleEn
      ?? seriesData.titleRomaji ?? "this series";

    const insightRes = await nvidia.chat.completions.create(
      {
        model: "meta/llama-3.1-8b-instruct",
        messages: [{
          role: "user",
          content: `You are an anime analyst on Hakken.
Generate a personalised insight for a user viewing this series page.

Series: ${title}
Genres: ${(seriesData.genres ?? []).join(", ")}
Status: ${seriesData.status}
Score: ${seriesData.averageScore ?? "N/A"}
Episodes: ${seriesData.episodeCount ?? "unknown"}
User's taste: ${userGenres.join(", ") || "Unknown"}

Respond ONLY with this exact JSON, no other text:
{
  "match": "One sentence on why this fits (or doesn't fit) the user's taste. Be specific.",
  "community_mood": "One sentence summarising community reception based on the score and status.",
  "verdict": "MUST_WATCH" | "WORTH_IT" | "NICHE_PICK" | "SKIP_IT",
  "verdict_reason": "One sentence explaining the verdict (max 15 words)"
}`,
        }],
        max_tokens: 200,
        temperature: 0.6,
      }
    );

    let insight = null;
    try {
      const raw = insightRes.choices[0]?.message?.content ?? "{}";
      const clean = raw.replace(/```json|```/g, "").trim();
      insight = JSON.parse(clean);
    } catch { insight = null; }

    const result = { insight };
    await setCached(cacheKey, result, 86400); // 24hr
    return NextResponse.json(result);
  } catch (err) {
    console.error("Series insight error:", err);
    return NextResponse.json(
      { error: "Failed" }, { status: 500 }
    );
  }
}