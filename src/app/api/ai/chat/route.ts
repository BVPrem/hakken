import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userSeries, series, articles } from "@/lib/db/schema";
 import { eq, desc, sql } from "drizzle-orm";
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
       db.select({
         seriesId: userSeries.seriesId,
         status: userSeries.status,
       })
         .from(userSeries)
         .where(eq(userSeries.userId, userId))
         .limit(20),
       db.select({
         title: articles.title,
         source: articles.source,
         summary: articles.summary,
         publishedAt: articles.publishedAt,
       })
         .from(articles)
         .where(
           sql`published_at > NOW() - INTERVAL '7 days'
             AND summary IS NOT NULL`
         )
         .orderBy(desc(articles.publishedAt))
         .limit(20),
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
       .slice(0, 15)
       .map(n => {
         const source = n.source?.replace("_", "/")
           .toUpperCase();
         const summary = n.summary
           ? "\n  " + n.summary
               .split("\n")
               .filter(l => l.trim().startsWith("•"))
               .slice(0, 1)
               .join("")
               .replace("•", "").trim()
           : "";
         return `[${source}] ${n.title}${summary}`;
       })
       .join("\n\n");

     const mostRecentDate = recentNews[0]?.publishedAt
       ? new Date(recentNews[0].publishedAt)
           .toLocaleDateString("en-US", {
             month: "short", day: "numeric",
             year: "numeric"
           })
        : "unknown";
      const user = await currentUser();
      const displayName = user?.firstName ?? "Anime fan";

       const systemPrompt = `You are Hakken AI — the most knowledgeable anime and manga assistant on the internet. You are embedded in Hakken, an anime intelligence platform. You have deep expertise in:
 - All anime and manga series, their story arcs, characters, themes and quality
 - Watch orders for complex franchises (One Piece, Naruto, Fate series, Monogatari, etc)
 - Filler episode identification and skip guides
 - Manga vs anime differences
 - Studio quality, directors, composers
 - Seasonal anime trends and community sentiment

 USER PROFILE:
 Name: ${displayName}
 Currently watching / tracked: ${watchlistTitles.length > 0
   ? watchlistTitles.join(", ")
   : "Nothing yet — suggest popular entry points"}
 ${watchlistTitles.length > 0
   ? `\nBased on their list, they seem to enjoy:
   ${[...new Set(watchlistTitles.map(t =>
     t.split("(")[0].trim()))].slice(0, 5).join(", ")}`
   : ""}

 RECENT ANIME/MANGA NEWS (last 7 days, ${recentNews.length} articles, most recent: ${mostRecentDate}):
 ${newsContext || "No recent news in the last 7 days"}

 CAPABILITIES — you can help with:
 1. "What should I watch next?" → analyse their list and recommend with reasons
 2. "Give me a watch order for [series]" → provide complete spoiler-free watch order with filler notes
 3. "Is [series] worth watching?" → honest assessment
 4. "Catch me up on [series] news" → summarise recent articles
 5. "What's the best arc in [series]?" → deep knowledge
 6. "Compare [series A] and [series B]" → detailed comparison

 WATCH ORDER FORMATTING RULES:
 When asked for a watch order, ALWAYS respond in this exact format:

 📺 WATCH ORDER: [Series Name]

 **Starting Point:**
 [Where to begin and why]

 **Main Order:**
 1. [Season/Entry] — [brief note]
 2. [Season/Entry] — [brief note]
 ...

 **Filler to Skip:**
 - Episodes [X-Y]: [reason] — SKIP
 - Episodes [X-Y]: [reason] — OPTIONAL

 **Movies/OVAs:**
 - [Movie name]: Watch after [episode/season]

 **Time to Complete:**
 ~[X] hours (canon only) / ~[Y] hours (everything)

 Always be specific with episode numbers for filler.
 Never guess — only provide watch orders for series you have confident knowledge about.

 RULES:
 - Never make up anime titles or episode numbers
 - Keep responses under 300 words unless asked for detail
 - Use enthusiasm — you love anime as much as the user
 - For watch orders, always note filler clearly
 - Reference their watchlist naturally when relevant
 - If asked about a specific news event and you don't see it in the news context above, say exactly: "I don't see that in my current news feed — the most recent news I have is from ${mostRecentDate}. You can check the Latest News section on the series page for the freshest updates." Never make up news events or confirm things you can't verify from the context.
 - When you CAN see relevant news in the context, always quote or reference the specific headline.`

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
