import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { series, articles } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { SeriesCarousel } from "@/components/series/series-carousel";
import { NewsCard } from "@/components/feed/news-card";
import { ComingSoonCards } from "@/components/ui/coming-soon-cards";

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
        className="relative -mx-4 md:-mx-8 px-4 md:px-8 py-10"
        style={{
          position: "relative",
          overflow: "hidden",
          backgroundImage:
            "radial-gradient(circle, hsl(var(--foreground) / 0.045) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
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
          Your Anime <br />
          <span className="text-primary">Manga Feed</span>
        </h1>
        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20
          opacity-20 border-l-2 border-b-2 border-primary" />
        {/* Decorative background kanji */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: "-20px",
            top: "-20px",
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "220px",
            lineHeight: 1,
            color: "hsl(var(--foreground) / 0.03)",
            pointerEvents: "none",
            userSelect: "none",
            letterSpacing: "-0.05em",
          }}
        >
          発見
        </div>
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
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "20px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "hsl(var(--foreground))",
              borderLeft: "3px solid hsl(var(--primary))",
              paddingLeft: "10px",
              margin: 0,
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
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "20px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "hsl(var(--foreground))",
              borderLeft: "3px solid hsl(var(--primary))",
              paddingLeft: "10px",
              margin: 0,
            }}
          >
            Coming Soon
          </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ComingSoonCards />
        </div>
      </section>
    </div>
  );
}