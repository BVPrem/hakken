import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userSeries, series, articles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import OpenAI from "openai";

const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY!,
  baseURL: process.env.NVIDIA_BASE_URL ??
    "https://integrate.api.nvidia.com/v1",
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { messages } = body as {
    messages: Array<{ role: string; content: string }>;
  };

  if (!messages?.length) {
    return new Response("Messages required", { status: 400 });
  }

  try {
    // Build context — user watchlist + recent news
    const [watchlist, recentNews] = await Promise.all([
      db.select({ seriesId: userSeries.seriesId, status: userSeries.status })
        .from(userSeries)
        .where(eq(userSeries.userId, userId))
        .limit(20),
      db.select({ title: articles.title, source: articles.source,
                  summary: articles.summary })
        .from(articles)
        .where(eq(articles.source, "ann"))
        .orderBy(desc(articles.publishedAt))
        .limit(5),
    ]);

    // Get series titles for watchlist items
    const watchlistTitles = await Promise.all(
      watchlist.slice(0, 10).map(async (w) => {
        const s = await db.select({ title: series.titleEn,
                                    romaji: series.titleRomaji })
          .from(series)
          .where(eq(series.id, w.seriesId))
          .limit(1);
        return s[0]
          ? `${s[0].title ?? s[0].romaji} (${w.status.replace("_", " ")})`
          : w.seriesId;
      })
    );

    const newsContext = recentNews
      .filter(n => n.summary)
      .slice(0, 3)
      .map(n => `- ${n.title}`)
      .join("\n");

    const systemPrompt = `You are Hakken AI — an intelligent assistant for the Hakken anime and manga intelligence platform. You have deep knowledge of anime, manga, light novels, and Japanese pop culture.

USER CONTEXT:
Watchlist: ${watchlistTitles.length > 0
  ? watchlistTitles.join(", ")
  : "No series tracked yet"}

RECENT ANIME NEWS:
${newsContext || "No recent news available"}

GUIDELINES:
- Be concise, enthusiastic, and knowledgeable about anime/manga
- Use the user's watchlist to personalise recommendations
- Reference recent news when relevant
- If asked what to watch next, consider their taste profile
- Keep responses under 200 words unless the user asks for detail
- You can use the user's name if known but don't be creepy about it
- Don't make up anime/manga titles — only recommend real series`;

    // Build message array with system prompt
    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Stream the response
    const stream = await nvidia.chat.completions.create({
      model: "meta/llama-3.3-70b-instruct",
      messages: chatMessages,
      max_tokens: 512,
      temperature: 0.7,
      stream: true,
    });

    // Return SSE stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }
          controller.enqueue(
            encoder.encode("data: [DONE]\n\n")
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("Hakken AI error:", err);
    return new Response("AI service error", { status: 500 });
  }
}
