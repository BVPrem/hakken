import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { db } from "@/lib/db";
import { series } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { SeriesCard } from "@/components/series/series-card";
import { NewsCard } from "@/components/feed/news-card";
import { ArrowRight } from "lucide-react";

interface FeedArticle {
  id: string;
  title: string;
  summary: string | null;
  source: string;
  sentiment: string | null;
  sentimentScore: number | null;
  publishedAt: string | null;
  imageUrl: string | null;
  url: string;
}

export default async function HomePage() {
  const user = await currentUser();

  const trendingSeries = await db
    .select()
    .from(series)
    .orderBy(desc(series.popularity))
    .limit(12);

  const feedRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/feed?limit=6`,
    { 
      cache: "no-store",
      redirect: "manual",
    }
  ).catch(() => null);
  
  let feedArticles: FeedArticle[] = [];
  if (feedRes?.ok) {
    const feedData = await feedRes.json().catch(() => null);
    feedArticles = (feedData?.articles ?? []) as FeedArticle[];
  }

  return (
    <div className="flex flex-col gap-12">

      {/* Hero header */}
      <div className="relative overflow-hidden border-b-2
        border-foreground/10 pb-8 -mx-4 md:-mx-8 px-4
        md:px-8 halftone">
        <div className="relative z-10">
          <p className="font-display text-xs uppercase
            tracking-[0.4em] text-primary mb-2">
            Welcome back
            {user?.firstName ? `, ${user.firstName}` : ""}
          </p>
          <h1 className="font-display text-4xl md:text-6xl
            uppercase tracking-tight text-foreground
            leading-none">
            Your Anime<br />
            <span className="text-primary">Intelligence</span>
            <br />Hub
          </h1>
        </div>
      </div>

      {/* Trending */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between
          chapter-marker">
          <h2 className="font-display text-xl uppercase
            tracking-widest text-foreground">
            Trending Now
          </h2>
          <Link href="/discover"
            className="flex items-center gap-1 text-xs
              font-display uppercase tracking-wider
              text-primary hover:text-primary/70
              transition-colors">
            All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {trendingSeries.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3
            md:grid-cols-4 lg:grid-cols-6 gap-3">
            {trendingSeries.map((s, i) => (
              <SeriesCard
                key={s.id}
                id={s.id}
                externalId={s.externalId}
                title={s.titleEn ?? s.titleRomaji}
                coverImage={s.coverImage}
                type={s.type}
                status={s.status}
                score={s.averageScore}
                genres={s.genres ?? []}
                year={s.seasonYear}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div className="manga-panel p-8 text-center">
            <p className="text-muted-foreground text-sm">
              No series yet.{" "}
              <Link href="/search"
                className="text-primary hover:underline">
                Search to explore
              </Link>
            </p>
          </div>
        )}
      </section>

      {/* News Feed */}
      {feedArticles.length > 0 && (
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between
            chapter-marker">
            <h2 className="font-display text-xl uppercase
              tracking-widest text-foreground">
              Latest News
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2
            lg:grid-cols-3 gap-3">
            {feedArticles.map((article: FeedArticle) => (
              <NewsCard
                key={article.id}
                id={article.id}
                title={article.title}
                summary={article.summary}
                source={article.source}
                sentiment={article.sentiment}
                sentimentScore={article.sentimentScore}
                publishedAt={article.publishedAt}
                imageUrl={article.imageUrl}
                url={article.url}
              />
            ))}
          </div>
        </section>
      )}

      {/* Coming soon */}
      <section className="flex flex-col gap-5">
        <div className="chapter-marker">
          <h2 className="font-display text-xl uppercase
            tracking-widest text-foreground">
            Coming Soon
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: "Sentiment Pulse",
              desc: "Community mood tracking per episode" },
            { title: "Hakken AI",
              desc: "Ask anything about anime & manga" },
            { title: "Friend Matching",
              desc: "Find what to watch together" },
          ].map((card) => (
            <div key={card.title}
              className="manga-panel-thin p-5 bg-card">
              <h3 className="font-display text-sm uppercase
                tracking-wider text-foreground mb-1">
                {card.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}