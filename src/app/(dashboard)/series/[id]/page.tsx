import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { series } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAniListById, getStudio } from "@/lib/api/anilist";
import { WatchlistButton } from "@/components/series/watchlist-button";
import { SeriesInsight } from "@/components/series/series-insight";
import { SentimentChart } from "@/components/charts/sentiment-chart";
import { LatestNews } from "@/components/series/latest-news";
import {
  Star,
  Tv,
  Calendar,
  BookOpen,
  TrendingUp,
  Layers,
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
            .slice(0, 10)
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

  const isAiring = seriesData.status === "RELEASING";
  const statusLabel = isAiring
    ? "Airing"
    : seriesData.status === "FINISHED"
    ? "Finished"
    : seriesData.status || "Unknown";

  const countLabel =
    seriesData.type === "anime"
      ? seriesData.episodeCount?.toString() ?? "TBA"
      : seriesData.chapterCount?.toString() ?? "TBA";

  const seasonLabel = seriesData.season
    ? `${seriesData.season} ${seriesData.seasonYear}`
    : seriesData.seasonYear?.toString() ?? "TBA";

  return (
    /*
     * The dashboard layout applies paddingTop: 96px and px-5/10/12.
     * marginTop: -96px on article cancels the top padding so the banner
     * can bleed directly under the fixed navbar.
     */
    <article
      className="min-h-screen bg-background pb-24"
      style={{ marginTop: "-96px" }}
    >
      {/* ════════════════════════════════════════════════════════
          CINEMATIC BANNER
          Full-bleed using the 100vw / -50vw centering trick.
          body { overflow-x: hidden } prevents any scrollbar.
          Image is faded heavily so the cover art feels "in front".
      ════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          width: "100vw",
          position: "relative",
          left: "50%",
          right: "50%",
          marginLeft: "-50vw",
          marginRight: "-50vw",
          height: "360px",
        }}
      >
        {/* Faded banner image — acts as atmospheric backdrop */}
        {seriesData.bannerImage ? (
          <Image
            src={seriesData.bannerImage}
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
            style={{ opacity: 0.45 }}
          />
        ) : (
          <div className="absolute inset-0 halftone bg-muted" />
        )}

        {/* Halftone texture layer */}
        <div className="absolute inset-0 halftone opacity-20 pointer-events-none" />

        {/* Gradient: bottom fade to page bg (strong), sides (subtle) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.75) 70%, hsl(var(--background)) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, hsl(var(--background)/0.7) 0%, transparent 30%, transparent 70%, hsl(var(--background)/0.5) 100%)",
          }}
        />

        {/* Primary accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary" />

        {/* Spacer so banner content clears the fixed navbar */}
        <div style={{ height: "96px" }} />
      </div>

      {/* ════════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ════════════════════════════════════════════════════════ */}
      <div className="max-w-screen-xl mx-auto px-5 md:px-10 lg:px-12">

        {/* ── HERO ROW: cover rail + info column ── */}
        <div
          style={{
            display: "flex",
            gap: "2.5rem",
            alignItems: "flex-start",
            marginTop: "-200px", /* Pull up so cover overlaps banner bottom */
            position: "relative",
            zIndex: 10,
          }}
        >

          {/* ════════════════
              LEFT RAIL
          ════════════════ */}
          <div
            style={{
              flexShrink: 0,
              width: "220px",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* Cover art — the prominent "in front" element */}
            <div
              style={{
                width: "220px",
                aspectRatio: "2 / 3",
                position: "relative",
                overflow: "hidden",
                border: "4px solid hsl(var(--foreground))",
                boxShadow: "10px 10px 0 hsl(var(--foreground))",
                background: "hsl(var(--muted))",
                flexShrink: 0,
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
                <div className="w-full h-full halftone flex items-center justify-center">
                  <Tv className="w-10 h-10 text-muted-foreground opacity-30" />
                </div>
              )}
            </div>

            {/* Studio */}
            {seriesData.studios && seriesData.studios.length > 0 && (
              <div>
                <p
                  className="font-display uppercase text-muted-foreground"
                  style={{ fontSize: "10px", letterSpacing: "0.2em", marginBottom: "4px" }}
                >
                  Studio
                </p>
                <p
                  className="font-sans font-bold text-foreground uppercase"
                  style={{ fontSize: "13px", letterSpacing: "0.08em" }}
                >
                  {seriesData.studios.join(", ")}
                </p>
              </div>
            )}

            {/* Watchlist */}
            <div style={{ width: "100%" }}>
              <WatchlistButton seriesId={id} />
            </div>
            
            {/* AI Insight */}
            <div style={{ width: "100%", marginTop: "16px" }}>
              <SeriesInsight seriesId={id} />
            </div>
          </div>

          {/* ════════════════
              RIGHT COLUMN
          ════════════════ */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
              paddingTop: "220px", /* Align title below the banner line */
            }}
          >
            {/* Title block */}
            <div>
              <h1
                className="font-display uppercase text-foreground"
                style={{
                  fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
                  lineHeight: 1,
                  letterSpacing: "0.03em",
                }}
              >
                {displayTitle}
              </h1>
              {seriesData.titleRomaji &&
                seriesData.titleRomaji !== displayTitle && (
                  <p
                    className="font-display uppercase text-muted-foreground"
                    style={{
                      fontSize: "13px",
                      letterSpacing: "0.18em",
                      marginTop: "6px",
                    }}
                  >
                    {seriesData.titleRomaji}
                  </p>
                )}
              {/* Accent rule */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "4px",
                    background: "hsl(var(--primary))",
                    boxShadow: "2px 2px 0 hsl(var(--primary)/0.3)",
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "hsl(var(--foreground)/0.1)",
                  }}
                />
              </div>
            </div>

            {/* ── STATS GRID — each stat is its own card ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "12px",
              }}
            >
              {/* Score */}
              <div
                className="bg-background"
                style={{
                  border: "2px solid hsl(var(--foreground)/0.2)",
                  boxShadow: "4px 4px 0 hsl(var(--foreground)/0.08)",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <span
                  className="font-display uppercase text-muted-foreground"
                  style={{ fontSize: "10px", letterSpacing: "0.2em" }}
                >
                  Score
                </span>
                <div
                  className="font-display text-foreground"
                  style={{
                    fontSize: "24px",
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Star
                    style={{
                      width: "16px",
                      height: "16px",
                      color: "hsl(var(--primary))",
                      fill: "hsl(var(--primary))",
                      flexShrink: 0,
                    }}
                  />
                  {seriesData.averageScore
                    ? seriesData.averageScore.toFixed(1)
                    : "N/A"}
                </div>
              </div>

              {/* Status */}
              <div
                className="bg-background"
                style={{
                  border: "2px solid hsl(var(--foreground)/0.2)",
                  boxShadow: "4px 4px 0 hsl(var(--foreground)/0.08)",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <span
                  className="font-display uppercase text-muted-foreground"
                  style={{ fontSize: "10px", letterSpacing: "0.2em" }}
                >
                  Status
                </span>
                <span
                  className="font-display uppercase"
                  style={{
                    fontSize: "20px",
                    lineHeight: 1,
                    letterSpacing: "0.05em",
                    color: isAiring
                      ? "hsl(var(--primary))"
                      : "hsl(var(--foreground))",
                  }}
                >
                  {statusLabel}
                </span>
              </div>

              {/* Episodes / Chapters */}
              <div
                className="bg-background"
                style={{
                  border: "2px solid hsl(var(--foreground)/0.2)",
                  boxShadow: "4px 4px 0 hsl(var(--foreground)/0.08)",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <span
                  className="font-display uppercase text-muted-foreground"
                  style={{ fontSize: "10px", letterSpacing: "0.2em" }}
                >
                  {seriesData.type === "anime" ? "Episodes" : "Chapters"}
                </span>
                <div
                  className="font-display text-foreground uppercase"
                  style={{
                    fontSize: "20px",
                    lineHeight: 1,
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {seriesData.type === "anime" ? (
                    <Tv
                      style={{
                        width: "15px",
                        height: "15px",
                        color: "hsl(var(--primary))",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <BookOpen
                      style={{
                        width: "15px",
                        height: "15px",
                        color: "hsl(var(--primary))",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {countLabel}
                </div>
              </div>

              {/* Season */}
              <div
                className="bg-background"
                style={{
                  border: "2px solid hsl(var(--foreground)/0.2)",
                  boxShadow: "4px 4px 0 hsl(var(--foreground)/0.08)",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <span
                  className="font-display uppercase text-muted-foreground"
                  style={{ fontSize: "10px", letterSpacing: "0.2em" }}
                >
                  Season
                </span>
                <div
                  className="font-display text-foreground uppercase"
                  style={{
                    fontSize: "20px",
                    lineHeight: 1,
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Calendar
                    style={{
                      width: "15px",
                      height: "15px",
                      color: "hsl(var(--primary))",
                      flexShrink: 0,
                    }}
                  />
                  {seasonLabel}
                </div>
              </div>

              {/* Fans / Popularity */}
              {seriesData.popularity && (
                <div
                  className="bg-background"
                  style={{
                    border: "2px solid hsl(var(--foreground)/0.2)",
                    boxShadow: "4px 4px 0 hsl(var(--foreground)/0.08)",
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <span
                    className="font-display uppercase text-muted-foreground"
                    style={{ fontSize: "10px", letterSpacing: "0.2em" }}
                  >
                    Fans
                  </span>
                  <div
                    className="font-display text-foreground uppercase"
                    style={{
                      fontSize: "20px",
                      lineHeight: 1,
                      letterSpacing: "0.05em",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <TrendingUp
                      style={{
                        width: "15px",
                        height: "15px",
                        color: "hsl(var(--primary))",
                        flexShrink: 0,
                      }}
                    />
                    {seriesData.popularity.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* ── Genres ── */}
            {seriesData.genres && seriesData.genres.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {seriesData.genres.map((g, i) => (
                  <span
                    key={g}
                    className={cn(
                      "font-display uppercase transition-transform hover:-translate-y-0.5 cursor-default",
                      i === 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-foreground/80 hover:text-foreground"
                    )}
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.15em",
                      padding: "6px 14px",
                      border: i === 0
                        ? "2px solid hsl(var(--primary))"
                        : "2px solid hsl(var(--foreground)/0.25)",
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* ── Synopsis ── */}
            {seriesData.synopsis && (
              <section>
                <h2 className="section-heading">Synopsis</h2>
                <div
                  className="bg-background relative overflow-hidden"
                  style={{
                    border: "2px solid hsl(var(--foreground)/0.18)",
                    boxShadow: "5px 5px 0 hsl(var(--foreground)/0.07)",
                    padding: "28px 32px",
                  }}
                >
                  <div
                    className="absolute top-0 right-0 halftone opacity-40 pointer-events-none"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderLeft: "2px solid hsl(var(--foreground)/0.12)",
                      borderBottom: "2px solid hsl(var(--foreground)/0.12)",
                    }}
                  />
                  <p
                    className="text-foreground/80 font-medium relative z-10"
                    style={{
                      lineHeight: "1.9",
                      fontSize: "clamp(13px, 1.4vw, 15px)",
                    }}
                  >
                    {seriesData.synopsis}
                  </p>
                </div>
              </section>
            )}

            {/* ── Tags ── */}
            {seriesData.tags && seriesData.tags.length > 0 && (
              <section>
                <h2 className="section-heading">Tags</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {seriesData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-display uppercase text-foreground/75 bg-muted transition-transform hover:-translate-y-0.5 cursor-default"
                      style={{
                        fontSize: "11px",
                        letterSpacing: "0.13em",
                        padding: "7px 16px",
                        border: "2px solid hsl(var(--foreground)/0.22)",
                        boxShadow: "3px 3px 0 hsl(var(--foreground)/0.07)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* ── Sentiment Pulse ── */}
            <section>
              <h2 className="section-heading">Sentiment Pulse</h2>
              <p
                className="text-muted-foreground font-medium uppercase"
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  marginTop: "-12px",
                  marginBottom: "20px",
                }}
              >
                Community mood based on news and discussion articles
              </p>
              <SentimentChart seriesId={seriesData.id} />
            </section>
          </div>
        </div>

        {/* ── Latest News ── */}
        <div style={{ marginTop: "80px" }}>
          <h2 className="section-heading">Latest News</h2>
          <LatestNews seriesId={id} />
        </div>

      </div>
    </article>
  );
}
