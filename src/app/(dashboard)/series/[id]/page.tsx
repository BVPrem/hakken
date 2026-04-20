import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { series } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAniListById, getStudio } from "@/lib/api/anilist";
import { WatchlistButton } from "@/components/series/watchlist-button";
import { Badge } from "@/components/ui/badge";
import { SentimentChart } from "@/components/charts/sentiment-chart";
import {
  Star,
  Tv,
  Calendar,
  BookOpen,
  TrendingUp,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SeriesPage({ params }: PageProps) {
  const { id } = await params;

  let seriesData: {
    id: string;
    titleEn: string | null;
    titleRomaji: string | null;
    titleJa: string | null;
    synopsis: string | null;
    coverImage: string | null;
    bannerImage: string | null;
    genres: string[] | null;
    tags: string[] | null;
    studios: string[] | null;
    averageScore: number | null;
    popularity: number | null;
    status: string | null;
    type: string;
    episodeCount: number | null;
    chapterCount: number | null;
    season: string | null;
    seasonYear: number | null;
    nextEpisodeAt: Date | null;
    isAdult: boolean | null;
  } | null = null;

  const localResult = await db
    .select()
    .from(series)
    .where(eq(series.id, id))
    .limit(1);

  if (localResult.length > 0) {
    seriesData = localResult[0];
  }

  if (!seriesData && id.startsWith("anilist-")) {
    const anilistId = parseInt(id.replace("anilist-", ""));
    if (!isNaN(anilistId)) {
      const anilistData = await getAniListById(anilistId);
      if (anilistData) {
        const studio = getStudio(anilistData);
        seriesData = {
          id,
          titleEn: anilistData.title.english,
          titleRomaji: anilistData.title.romaji,
          titleJa: anilistData.title.native,
          synopsis:
            anilistData.description
              ?.replace(/<[^>]*>/g, "")
              .slice(0, 2000) ?? null,
          coverImage:
            anilistData.coverImage.extraLarge ??
            anilistData.coverImage.large,
          bannerImage: anilistData.bannerImage,
          genres: anilistData.genres,
          tags: anilistData.tags
            .filter((t) => !t.isMediaSpoiler)
            .slice(0, 8)
            .map((t) => t.name),
          studios: studio ? [studio] : [],
          averageScore: anilistData.averageScore
            ? anilistData.averageScore / 10
            : null,
          popularity: anilistData.popularity,
          status: anilistData.status,
          type: anilistData.type === "ANIME" ? "anime" : "manga",
          episodeCount: anilistData.episodes,
          chapterCount: anilistData.chapters,
          season: anilistData.season,
          seasonYear: anilistData.seasonYear,
          nextEpisodeAt: anilistData.nextAiringEpisode
            ? new Date(anilistData.nextAiringEpisode.airingAt * 1000)
            : null,
          isAdult: anilistData.isAdult,
        };
      }
    }
  }

  if (!seriesData) notFound();

  const displayTitle =
    seriesData.titleEn ??
    seriesData.titleRomaji ??
    seriesData.titleJa ??
    "Unknown";

  return (
    <div className="flex flex-col gap-8 bg-background min-h-screen pb-16">
      {/* Hero Banner */}
      <div 
        className="relative w-full overflow-hidden border-b-[6px] border-foreground"
        style={{ height: "300px" }}
      >
        {seriesData.bannerImage ? (
          <Image
            src={seriesData.bannerImage}
            alt={displayTitle}
            fill
            className="object-cover opacity-90"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full halftone bg-muted" />
        )}
        <div className="absolute inset-0 halftone opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t
          from-background via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 max-w-screen-xl mx-auto w-full -mt-36 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover art */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div
              className="relative overflow-hidden bg-background
                border-4 border-foreground"
              style={{
                width: "220px", 
                height: "330px",
                boxShadow: "6px 6px 0px hsl(var(--foreground))"
              }}
            >
              {seriesData.coverImage ? (
                <Image
                  src={seriesData.coverImage}
                  alt={displayTitle}
                  fill
                  className="object-cover"
                  priority
                  sizes="220px"
                />
              ) : (
                <div
                  className="w-full h-full bg-muted halftone
                    flex items-center justify-center"
                >
                  <Tv className="w-12 h-12 text-muted-foreground opacity-30" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6 pt-6 md:pt-36 w-full">
            {/* Title */}
            <div>
              <h1
                className="font-display text-4xl md:text-5xl uppercase tracking-widest text-foreground leading-[1.05]"
              >
                {displayTitle}
              </h1>
              {seriesData.titleRomaji &&
                seriesData.titleRomaji !== displayTitle && (
                  <p className="font-display text-xl uppercase tracking-wide text-primary mt-1 border-b-2 border-foreground/10 pb-4">
                    {seriesData.titleRomaji}
                  </p>
                )}
            </div>

            {/* Databook Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-4 border-foreground bg-background w-full max-w-3xl"
              style={{ boxShadow: "6px 6px 0px hsl(var(--foreground))" }}>
              
              {/* Score */}
              <div className="flex flex-col p-4 border-b-4 border-r-4 border-foreground bg-background">
                <span className="font-display text-[12px] uppercase text-muted-foreground tracking-widest mb-1">Score</span>
                <div className="flex items-center gap-2 font-display text-2xl text-foreground">
                  <Star className="w-5 h-5 text-primary fill-primary" />
                  {seriesData.averageScore ? seriesData.averageScore.toFixed(1) : "N/A"}
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col p-4 border-b-4 md:border-r-4 border-foreground halftone">
                <span className="font-display text-[12px] uppercase text-muted-foreground tracking-widest mb-1">Status</span>
                <span className={cn(
                  "font-display text-xl uppercase tracking-widest",
                   seriesData.status === "RELEASING" ? "text-primary" : "text-foreground"
                )}>
                  {seriesData.status === "RELEASING" ? "Airing" : seriesData.status || "Unknown"}
                </span>
              </div>

              {/* Format/Count */}
              <div className="flex flex-col p-4 border-r-4 border-b-4 md:border-b-0 border-foreground bg-background">
                <span className="font-display text-[12px] uppercase text-muted-foreground tracking-widest mb-1">
                  {seriesData.type === "anime" ? "Episodes" : "Chapters"}
                </span>
                <div className="flex items-center gap-2 font-display text-xl text-foreground uppercase tracking-widest">
                  {seriesData.type === "anime" ? <Tv className="w-4 h-4 text-primary" /> : <BookOpen className="w-4 h-4 text-primary" />}
                  {seriesData.episodeCount || seriesData.chapterCount || "TBA"}
                </div>
              </div>

              {/* Year */}
              <div className="flex flex-col p-4 border-b-4 md:border-b-0 md:border-r-0 border-foreground halftone">
                <span className="font-display text-[12px] uppercase text-muted-foreground tracking-widest mb-1">Season</span>
                <div className="flex items-center gap-2 font-display text-xl text-foreground uppercase tracking-widest">
                  <Calendar className="w-4 h-4 text-primary" />
                  {seriesData.season ? `${seriesData.season} ${seriesData.seasonYear}` : (seriesData.seasonYear || "TBA")}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 max-w-3xl mt-2">
              {/* Studios */}
              {seriesData.studios && seriesData.studios.length > 0 && (
                <div className="flex flex-col p-3 border-l-4 border-primary pl-4 bg-muted/40">
                  <span className="font-display text-[10px] uppercase text-muted-foreground tracking-widest">Studio</span>
                  <span className="font-sans font-bold text-sm uppercase text-foreground">
                    {seriesData.studios.join(", ")}
                  </span>
                </div>
              )}
              {/* Popularity */}
              {seriesData.popularity && (
                <div className="flex flex-col p-3 border-l-4 border-primary pl-4 bg-muted/40">
                  <span className="font-display text-[10px] uppercase text-muted-foreground tracking-widest">Fans</span>
                  <span className="font-sans font-bold text-sm uppercase text-foreground flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    {seriesData.popularity.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Watchlist Button */}
            <div className="pt-2">
              <WatchlistButton seriesId={id} />
            </div>

            {/* Genres */}
            {seriesData.genres && seriesData.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {seriesData.genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs font-display uppercase tracking-wide px-2.5 py-1 bg-primary/10 text-primary border border-primary/30"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Synopsis */}
        {seriesData.synopsis && (
          <div className="mt-16 w-full relative">
            <h2
              className="font-display text-3xl uppercase tracking-widest text-foreground bg-background px-4 absolute -top-5 left-4 z-10"
            >
              Synopsis
            </h2>
            <div className="border-4 border-foreground p-6 md:p-10 bg-background relative"
              style={{ boxShadow: "6px 6px 0px hsl(var(--foreground))" }}>
              <div className="absolute top-0 right-0 w-12 h-12 border-l-4 border-b-4 border-foreground halftone border-opacity-30" />
              <p className="text-foreground leading-loose text-sm md:text-base font-medium opacity-90 text-justify relative z-10">
                {seriesData.synopsis}
              </p>
            </div>
          </div>
        )}

        {/* Tags */}
        {seriesData.tags && seriesData.tags.length > 0 && (
          <div className="mt-16 w-full">
            <h2
              className="font-display text-2xl uppercase tracking-widest text-foreground mb-6"
            >
              Tags
            </h2>
            <div className="flex flex-wrap gap-3">
              {seriesData.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-display text-[11px] md:text-[13px] uppercase tracking-wider px-4 py-2 
                    border-2 border-foreground bg-muted text-foreground transition-transform hover:-translate-y-1"
                  style={{ boxShadow: "3px 3px 0px hsl(var(--foreground))" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sentiment Pulse */}
        <div className="mt-8 max-w-4xl">
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "18px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "hsl(var(--foreground))",
            borderLeft: "3px solid hsl(var(--primary))",
            paddingLeft: "10px",
            margin: "0 0 16px 0",
          }}>
            Sentiment Pulse
          </h2>
          <p style={{
            fontSize: "12px",
            color: "hsl(var(--muted-foreground))",
            marginBottom: "12px",
          }}>
            Community mood based on news and discussion articles
          </p>
          <SentimentChart seriesId={seriesData.id} />
        </div>

        {/* Latest News — coming soon */}
        <div className="mt-16 w-full">
          <div
            className="border-4 border-foreground p-8 flex flex-col items-center justify-center text-center bg-background"
            style={{ boxShadow: "6px 6px 0px hsl(var(--primary))" }}
          >
            <div className="w-full h-2 bg-primary mb-4" />
            <h3 className="font-display text-xl uppercase tracking-widest text-foreground mb-2">
              Latest News
            </h3>
            <p className="font-sans text-xs text-muted-foreground tracking-widest uppercase font-bold">
              Articles about this series — coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
