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
};

// Top border color per sentiment
const SENTIMENT_COLOR: Record<string, string> = {
  positive: "#22c55e",  // green
  negative: "#ef4444",  // red
  neutral:  "#6b7280",  // gray
  mixed:    "#f59e0b",  // amber
};

const SENTIMENT_LABEL: Record<string, string> = {
  positive: "POSITIVE",
  negative: "NEGATIVE",
  neutral:  "NEUTRAL",
  mixed:    "MIXED",
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
    ? SENTIMENT_COLOR[sentiment] ?? "#6b7280"
    : "hsl(var(--border))";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        background: "var(--glass-bg, rgba(255,255,255,0.7))",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1.5px solid var(--glass-border, rgba(0,0,0,0.08))",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.12s ease, box-shadow 0.12s ease",
        height: "100%",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translate(-2px,-2px)";
        el.style.boxShadow = `3px 3px 0 ${accentColor}`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translate(0,0)";
        el.style.boxShadow = "none";
      }}
    >
      {/* Sentiment accent bar */}
      <div style={{
        height: "3px",
        background: accentColor,
        flexShrink: 0,
      }} />

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "14px",
        flex: 1,
      }}>
        {/* Source row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            {/* Source badge */}
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "9px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "hsl(var(--muted-foreground))",
              background: "hsl(var(--foreground) / 0.06)",
              padding: "2px 6px",
            }}>
              {SOURCE_LABELS[source] ?? source}
            </span>
            {/* Sentiment label */}
            {sentiment && (
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "9px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: accentColor,
              }}>
                {SENTIMENT_LABEL[sentiment]}
              </span>
            )}
          </div>
          {/* External link icon */}
          <ExternalLink style={{
            width: "12px",
            height: "12px",
            color: "hsl(var(--muted-foreground))",
            opacity: 0.5,
            flexShrink: 0,
          }} />
        </div>

        {/* Title */}
        <h3 style={{
          margin: 0,
          fontSize: "13px",
          fontWeight: 600,
          lineHeight: 1.4,
          color: "hsl(var(--foreground))",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {title}
        </h3>

        {/* AI Summary bullets */}
        {bullets.length > 0 && (
          <div style={{
            borderLeft: "2px solid hsl(var(--foreground) / 0.1)",
            paddingLeft: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}>
            {bullets.slice(0, 2).map((b, i) => (
              <p key={i} style={{
                margin: 0,
                fontSize: "11px",
                lineHeight: 1.5,
                color: "hsl(var(--muted-foreground))",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {b}
              </p>
            ))}
          </div>
        )}

        {/* Footer — timestamp */}
        <div style={{
          marginTop: "auto",
          paddingTop: "10px",
          borderTop: "1px solid hsl(var(--foreground) / 0.06)",
          fontSize: "10px",
          fontFamily: "'Bebas Neue', sans-serif",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "hsl(var(--muted-foreground))",
        }}>
          {timeAgo ?? "—"}
        </div>
      </div>
    </a>
  );
}