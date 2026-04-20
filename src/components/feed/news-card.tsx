"use client";

import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";

const SOURCE_LABELS: Record<string, string> = {
  ann: "ANN", reddit_anime: "r/anime",
  reddit_manga: "r/manga", reddit_animenews: "r/animenews",
  mal_news: "MAL News", anime_corner: "Anime Corner",
  anime_feminist: "Anime Feminist", anitrendz: "AniTrendz",
  anime_senpai: "Anime Senpai", kotaku_anime: "Kotaku",
  livechart: "Livechart",
  reddit_onepiece: "r/OnePiece",
  reddit_bleach: "r/Bleach",
  reddit_naruto: "r/Naruto",
  reddit_aot: "r/SNK",
  reddit_jjk: "r/JJK",
  reddit_demonslayer: "r/DemonSlayer",
  reddit_hxh: "r/HxH",
  reddit_dbs: "r/DBS",
  crunchyroll_news: "Crunchyroll",
};

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "hsl(142, 71%, 45%)",
  negative: "hsl(var(--primary))",
  neutral:  "hsl(var(--muted-foreground))",
  mixed:    "hsl(38, 92%, 50%)",
};

const SENTIMENT_BG: Record<string, string> = {
  positive: "hsl(142, 71%, 45% / 0.08)",
  negative: "hsl(var(--primary) / 0.08)",
  neutral:  "hsl(var(--foreground) / 0.04)",
  mixed:    "hsl(38, 92%, 50% / 0.08)",
};

const SENTIMENT_LABEL: Record<string, string> = {
  positive: "Positive",
  negative: "Negative",
  neutral:  "Neutral",
  mixed:    "Mixed",
};

interface NewsCardProps {
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

export function NewsCard({
  title, summary, source, sentiment, publishedAt, url,
}: NewsCardProps) {
  const bullets = summary
    ? summary.split("\n")
        .filter(l => l.trim().startsWith("•"))
        .map(l => l.replace(/^•\s*/, "").trim())
        .filter(Boolean)
    : [];

  const timeAgo = publishedAt
    ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true })
    : null;

  const accentColor = sentiment
    ? SENTIMENT_COLOR[sentiment] ?? "hsl(var(--border))"
    : "hsl(var(--border))";

  const accentBg = sentiment
    ? SENTIMENT_BG[sentiment] ?? "transparent"
    : "transparent";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        background: "hsl(var(--background))",
        border: "2px solid hsl(var(--foreground) / 0.15)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.12s ease, box-shadow 0.12s ease",
        height: "100%",
        boxShadow: "4px 4px 0 hsl(var(--foreground) / 0.06)",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translate(-2px,-2px)";
        el.style.boxShadow = `4px 4px 0 ${accentColor}`;
        el.style.borderColor = `${accentColor}`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translate(0,0)";
        el.style.boxShadow = "4px 4px 0 hsl(var(--foreground) / 0.06)";
        el.style.borderColor = "hsl(var(--foreground) / 0.15)";
      }}
    >
      {/* Sentiment accent bar — top */}
      <div style={{
        height: "3px",
        background: accentColor,
        flexShrink: 0,
      }} />

      {/* Card body */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "18px 20px",
        flex: 1,
      }}>

        {/* Meta row: source + sentiment + link */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Source badge */}
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "hsl(var(--muted-foreground))",
              background: "hsl(var(--foreground) / 0.07)",
              padding: "2px 7px",
              border: "1px solid hsl(var(--foreground) / 0.1)",
            }}>
              {SOURCE_LABELS[source] ?? source}
            </span>

            {/* Sentiment pill */}
            {sentiment && (
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "9px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: accentColor,
                background: accentBg,
                padding: "2px 7px",
                border: `1px solid ${accentColor}`,
              }}>
                {SENTIMENT_LABEL[sentiment]}
              </span>
            )}
          </div>

          <ExternalLink style={{
            width: "11px",
            height: "11px",
            color: "hsl(var(--muted-foreground))",
            opacity: 0.4,
            flexShrink: 0,
          }} />
        </div>

        {/* Title */}
        <h3 style={{
          margin: 0,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "14px",
          fontWeight: 700,
          lineHeight: 1.45,
          color: "hsl(var(--foreground))",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {title}
        </h3>

        {/* AI Summary bullets */}
        {bullets.length > 0 && (
          <div style={{
            borderLeft: `2px solid ${accentColor}`,
            paddingLeft: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            opacity: 0.85,
          }}>
            {bullets.slice(0, 2).map((b, i) => (
              <p key={i} style={{
                margin: 0,
                fontSize: "11.5px",
                lineHeight: 1.55,
                color: "hsl(var(--muted-foreground))",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontWeight: 500,
              }}>
                {b}
              </p>
            ))}
          </div>
        )}

        {/* Footer — timestamp */}
        <div style={{
          marginTop: "auto",
          paddingTop: "12px",
          borderTop: "1px solid hsl(var(--foreground) / 0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "10px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "hsl(var(--muted-foreground))",
          }}>
            {timeAgo ?? "—"}
          </span>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "9px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "hsl(var(--muted-foreground) / 0.5)",
          }}>
            ↗
          </span>
        </div>
      </div>
    </a>
  );
}