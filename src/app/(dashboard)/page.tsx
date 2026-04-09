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
    <div className="flex flex-col gap-10">
      {/* Welcome */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Welcome back
          {user?.firstName ? `, ${user.firstName}` : ""}
          <span className="gradient-text"> </span>
        </h1>
        <p className="text-muted-foreground">
          Your anime & manga intelligence hub.
        </p>
      </div>

      {/* Trending section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-semibold text-foreground">
            Trending Now
          </h2>
          <Link
            href="/discover"
            className="flex items-center gap-1 text-sm
              text-accent hover:text-primary transition-colors"
          >
            See all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {trendingSeries.length > 0 ? (
          <div
            className="grid grid-cols-2 sm:grid-cols-3
              md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
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
          <div
            className="glass rounded-xl p-8 text-center
              border border-border"
          >
            <p className="text-muted-foreground">
              No series data yet.{" "}
              <Link href="/search" className="text-accent hover:underline">
                Search to explore
              </Link>
            </p>
          </div>
        )}
      </section>

      {/* News feed section */}
      {feedArticles.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heading font-semibold text-foreground">
              Latest News
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Coming soon features */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-heading font-semibold text-foreground">
          Coming Soon
        </h2>
        <div
          className="grid grid-cols-1 md:grid-cols-2
            lg:grid-cols-3 gap-4"
        >
          {[
            { title: "Sentiment Pulse", desc: "Community mood on airing shows" },
            { title: "Your Feed", desc: "News tailored to your taste" },
            { title: "Hakken AI", desc: "Ask anything about anime" },
          ].map((card) => (
            <div
              key={card.title}
              className="glass rounded-xl p-6 border
                border-border hover:border-primary/30
                transition-colors"
            >
              <h3 className="font-heading font-semibold text-foreground mb-1">
                {card.title}
              </h3>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
