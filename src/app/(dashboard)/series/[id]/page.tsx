import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { series } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAniListById, getStudio } from "@/lib/api/anilist";
import { Badge } from "@/components/ui/badge";
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
    <div className="flex flex-col gap-8 -mt-8 -mx-4 md:-mx-8">
      {/* Hero Banner */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        {seriesData.bannerImage ? (
          <Image
            src={seriesData.bannerImage}
            alt={displayTitle}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10" />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t
            from-background via-background/60 to-transparent"
        />
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover art */}
          <div className="flex-shrink-0">
            <div
              className="relative w-40 md:w-52 aspect-[3/4]
                rounded-xl overflow-hidden shadow-2xl
                border border-border glow-purple"
            >
              {seriesData.coverImage ? (
                <Image
                  src={seriesData.coverImage}
                  alt={displayTitle}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div
                  className="w-full h-full bg-muted
                    flex items-center justify-center"
                >
                  <Tv className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4 pt-32 md:pt-0 md:mt-auto">
            {/* Title */}
            <div>
              <h1
                className="text-2xl md:text-4xl font-heading
                  font-bold text-foreground leading-tight"
              >
                {displayTitle}
              </h1>
              {seriesData.titleRomaji &&
                seriesData.titleRomaji !== displayTitle && (
                  <p className="text-muted-foreground mt-1">
                    {seriesData.titleRomaji}
                  </p>
                )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3">
              {seriesData.averageScore && (
                <div
                  className="flex items-center gap-1.5
                    bg-yellow-400/10 border border-yellow-400/20
                    rounded-full px-3 py-1"
                >
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-400">
                    {seriesData.averageScore.toFixed(1)}
                  </span>
                </div>
              )}

              {seriesData.status && (
                <Badge
                  variant="outline"
                  className={
                    seriesData.status === "RELEASING"
                      ? "border-green-500/30 text-green-400"
                      : "border-border text-muted-foreground"
                  }
                >
                  {seriesData.status === "RELEASING"
                    ? "Currently Airing"
                    : seriesData.status === "FINISHED"
                    ? "Finished"
                    : seriesData.status}
                </Badge>
              )}

              {seriesData.type === "anime" ? (
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Tv className="w-3.5 h-3.5" />
                  <span>
                    {seriesData.episodeCount
                      ? `${seriesData.episodeCount} episodes`
                      : "Anime"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    {seriesData.chapterCount
                      ? `${seriesData.chapterCount} chapters`
                      : "Manga"}
                  </span>
                </div>
              )}

              {seriesData.seasonYear && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {seriesData.season
                      ? `${seriesData.season} ${seriesData.seasonYear}`
                      : seriesData.seasonYear}
                  </span>
                </div>
              )}

              {seriesData.popularity && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    {seriesData.popularity.toLocaleString()} fans
                  </span>
                </div>
              )}
            </div>

            {/* Studios */}
            {seriesData.studios && seriesData.studios.length > 0 && (
              <p className="text-sm text-muted-foreground">
                <span className="opacity-60">Studio: </span>
                <span className="text-accent">
                  {seriesData.studios.join(", ")}
                </span>
              </p>
            )}

            {/* Genres */}
            {seriesData.genres && seriesData.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {seriesData.genres.map((g) => (
                  <span
                    key={g}
                    className="text-sm px-3 py-1 rounded-full
                      bg-primary/10 text-primary border
                      border-primary/20"
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
          <div className="mt-8 max-w-4xl">
            <h2
              className="text-lg font-heading font-semibold
                text-foreground mb-3"
            >
              Synopsis
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {seriesData.synopsis}
            </p>
          </div>
        )}

        {/* Tags */}
        {seriesData.tags && seriesData.tags.length > 0 && (
          <div className="mt-6 max-w-4xl">
            <h2
              className="text-lg font-heading font-semibold
                text-foreground mb-3"
            >
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {seriesData.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-lg
                    bg-muted text-muted-foreground border
                    border-border"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Coming soon sections */}
        <div
          className="mt-10 grid grid-cols-1 md:grid-cols-2
            gap-4 max-w-4xl"
        >
          {[
            {
              title: "Sentiment Pulse",
              desc: "Community mood tracking — coming soon",
            },
            {
              title: "Latest News",
              desc: "Articles about this series — coming soon",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="glass rounded-xl p-5 border border-border"
            >
              <h3 className="font-heading font-semibold text-foreground mb-1">
                {card.title}
              </h3>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
