import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { series, articles } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { SeriesCarousel } from "@/components/series/series-carousel";
import { NewsCard } from "@/components/feed/news-card";

export default async function HomePage() {
  const user = await currentUser();

  const [trendingSeries, airingSeries, feedArticles] = await Promise.all([
    db.select().from(series).orderBy(desc(series.popularity)).limit(20),
    db.select().from(series).where(eq(series.status, "RELEASING"))
      .orderBy(desc(series.popularity)).limit(20),
    // Direct DB query — no HTTP self-fetch, never breaks on port changes
    db.select().from(articles).orderBy(desc(articles.publishedAt)).limit(6),
  ]);

  return (
    <div className="flex flex-col gap-14">

      {/* Hero */}
      <div
        className="relative -mx-4 md:-mx-8 px-4 md:px-8 py-10
          overflow-hidden border-b border-foreground/10"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--foreground) / 0.05) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          borderBottom: "1px solid hsl(var(--foreground) / 0.08)",
        }}
      >
        <p className="font-display text-[10px] tracking-[0.5em]
          uppercase text-primary mb-2">
          {user?.firstName
            ? `Welcome back, ${user.firstName}`
            : "Welcome back"}
        </p>
        <h1 className="font-display text-5xl md:text-6xl
          uppercase tracking-tight text-foreground leading-[0.9]">
          Your Anime &<br />
          <span className="text-primary">Manga Feed</span>
        </h1>
        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20
          opacity-20 border-l-2 border-b-2 border-primary" />
      </div>

      {/* Trending carousel */}
      <SeriesCarousel
        title="Trending Now"
        items={trendingSeries.map((s) => ({
          id: s.id,
          externalId: s.externalId,
          title: s.titleEn ?? s.titleRomaji,
          coverImage: s.coverImage,
          type: s.type,
          status: s.status,
          averageScore: s.averageScore,
          genres: s.genres,
          seasonYear: s.seasonYear,
        }))}
      />

      {/* Airing Now carousel — only if we have data */}
      {airingSeries.length > 0 && (
        <SeriesCarousel
          title="Airing Now"
          items={airingSeries.map((s) => ({
            id: s.id,
            externalId: s.externalId,
            title: s.titleEn ?? s.titleRomaji,
            coverImage: s.coverImage,
            type: s.type,
            status: s.status,
            averageScore: s.averageScore,
            genres: s.genres,
            seasonYear: s.seasonYear,
          }))}
        />
      )}

      {/* News Feed */}
      {feedArticles.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2
            className="font-display text-xl uppercase
              tracking-widest text-foreground"
            style={{
              borderLeft: "3px solid hsl(var(--primary))",
              paddingLeft: "0.625rem",
            }}
          >
            Latest News
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2
            lg:grid-cols-3 gap-3">
            {feedArticles.map((a) => (
              <NewsCard
                key={a.id}
                id={a.id}
                title={a.title}
                summary={a.summary}
                source={a.source}
                sentiment={a.sentiment}
                sentimentScore={a.sentimentScore}
                publishedAt={a.publishedAt ? a.publishedAt.toISOString() : null}
                imageUrl={a.imageUrl}
                url={a.url}
              />
            ))}
          </div>
        </section>
      )}

      {/* Coming Soon */}
      <section className="flex flex-col gap-4">
        <h2
          className="font-display text-xl uppercase
            tracking-widest text-foreground"
          style={{
            borderLeft: "3px solid hsl(var(--primary))",
            paddingLeft: "0.625rem",
          }}
        >
          Coming Soon
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { t: "Sentiment Pulse", d: "Episode mood tracking" },
            { t: "Hakken AI",       d: "Ask anything"          },
            { t: "Friend Match",    d: "Co-watch finder"       },
          ].map((c) => (
            <div
              key={c.t}
              className="p-4 flex flex-col gap-1"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1.5px solid var(--glass-border)",
              }}
            >
              <p className="font-display text-xs uppercase
                tracking-widest text-foreground">
                {c.t}
              </p>
              <p className="text-xs text-muted-foreground">
                {c.d}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}