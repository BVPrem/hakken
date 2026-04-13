import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { db } from "@/lib/db";
import { series } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { SeriesCard } from "@/components/series/series-card";
import { NewsCard } from "@/components/feed/news-card";
import { ArrowRight } from "lucide-react";

export default async function HomePage() {
  const user = await currentUser();

  const trendingSeries = await db
    .select().from(series)
    .orderBy(desc(series.popularity))
    .limit(12);

  const feedRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/feed?limit=6`,
    { cache: "no-store" }
  ).catch(() => null);
  const feedArticles = (feedRes?.ok ? await feedRes.json() : null)?.articles ?? [];

  return (
    <div className="flex flex-col gap-10">

      {/* Page hero — tight, bold, manga chapter header */}
      <div className="relative -mx-4 md:-mx-8 px-4 md:px-8
        py-8 halftone border-b border-foreground/10 overflow-hidden">
        <p className="font-display text-[10px] tracking-[0.5em]
          uppercase text-primary mb-1">
          {user?.firstName ? `Welcome back, ${user.firstName}` : "Welcome back"}
        </p>
        <h1 className="font-display text-4xl md:text-5xl
          uppercase tracking-tight text-foreground
          leading-[0.95]">
          Your Anime &<br />
          <span className="text-primary">Manga Feed</span>
        </h1>
        {/* Decorative red corner accent */}
        <div className="absolute top-0 right-0 w-16 h-16
          bg-primary/10 border-l border-b border-primary/20" />
      </div>

      {/* Trending Now */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg uppercase
            tracking-widest text-foreground chapter-marker">
            Trending Now
          </h2>
          <Link href="/discover"
            className="flex items-center gap-1 font-display
              text-[10px] tracking-widest uppercase
              text-primary hover:opacity-70 transition-opacity">
            All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {trendingSeries.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4
            md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8
            gap-2.5">
            {trendingSeries.map((s, i) => (
              <SeriesCard
                key={s.id} id={s.id}
                externalId={s.externalId}
                title={s.titleEn ?? s.titleRomaji}
                coverImage={s.coverImage}
                type={s.type} status={s.status}
                score={s.averageScore}
                genres={s.genres ?? []}
                year={s.seasonYear} index={i}
              />
            ))}
          </div>
        ) : (
          <div className="manga-panel glass p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No series yet.{" "}
              <Link href="/search"
                className="text-primary hover:underline">
                Start searching
              </Link>
            </p>
          </div>
        )}
      </section>

      {/* Latest News */}
      {feedArticles.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-lg uppercase
            tracking-widest text-foreground chapter-marker">
            Latest News
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2
            lg:grid-cols-3 gap-3">
            {feedArticles.map((a: any) => (
              <NewsCard
                key={a.id} id={a.id} title={a.title}
                summary={a.summary} source={a.source}
                sentiment={a.sentiment}
                sentimentScore={a.sentimentScore}
                publishedAt={a.publishedAt}
                imageUrl={a.imageUrl} url={a.url}
              />
            ))}
          </div>
        </section>
      )}

      {/* Coming Soon — minimal strip */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg uppercase
          tracking-widest text-foreground chapter-marker">
          Coming Soon
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { t: "Sentiment Pulse", d: "Episode mood tracking" },
            { t: "Hakken AI",       d: "Ask anything" },
            { t: "Friend Match",    d: "Co-watch finder" },
          ].map(c => (
            <div key={c.t}
              className="glass manga-panel p-4 flex
                flex-col gap-1">
              <p className="font-display text-xs uppercase
                tracking-widest text-foreground">{c.t}</p>
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