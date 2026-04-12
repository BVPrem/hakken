"use client";
import { ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

const SOURCE_LABELS: Record<string, string> = {
  ann: "Anime News Network",
  reddit_anime: "r/anime",
  reddit_manga: "r/manga",
  reddit_animenews: "r/animenews",
  mal_news: "MyAnimeList",
  anime_corner: "Anime Corner",
  anime_feminist: "Anime Feminist",
  anitrendz: "AniTrendz",
  anime_senpai: "Anime Senpai",
  kotaku_anime: "Kotaku",
  livechart: "Livechart",
};

const SENTIMENT_BAR: Record<string, string> = {
  positive: "bg-primary",
  negative: "bg-foreground",
  neutral:  "bg-muted-foreground",
  mixed:    "bg-primary/50",
};

const SENTIMENT_LABEL: Record<string, string> = {
  positive: "POSITIVE",
  negative: "NEGATIVE",
  neutral:  "NEUTRAL",
  mixed:    "MIXED",
};

export function NewsCard({
  title,
  summary,
  source,
  sentiment,
  publishedAt,
  url,
}: NewsCardProps) {
  const sourceLabel = SOURCE_LABELS[source] ?? source;
  const timeAgo = publishedAt
    ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true })
    : null;

  const bullets = summary
    ? summary.split("\n")
        .filter((l) => l.trim().startsWith("•"))
        .map((l) => l.replace("•", "").trim())
    : [];

  const barClass = sentiment
    ? SENTIMENT_BAR[sentiment] ?? "bg-muted-foreground"
    : "bg-border";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block manga-panel-thin panel-hover
        bg-card overflow-hidden"
    >
      <div className={`h-1 w-full ${barClass}`} />

      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="ink-text text-[10px]
            text-muted-foreground">
            {sourceLabel}
          </span>
          <div className="flex items-center gap-2">
            {sentiment && (
              <span className="ink-text text-[9px]
                text-primary tracking-widest">
                {SENTIMENT_LABEL[sentiment]}
              </span>
            )}
            <ExternalLink className="w-3 h-3
              text-muted-foreground opacity-0
              group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-foreground
          line-clamp-2 leading-snug
          group-hover:text-primary transition-colors">
          {title}
        </h3>

        {bullets.length > 0 && (
          <ul className="flex flex-col gap-1 border-l-2
            border-border pl-3">
            {bullets.slice(0, 3).map((b, i) => (
              <li key={i} className="text-xs
                text-muted-foreground leading-relaxed">
                {b}
              </li>
            ))}
          </ul>
        )}

        {timeAgo && (
          <div className="flex items-center gap-1
            text-[10px] text-muted-foreground
            ink-text border-t border-border pt-2 mt-1">
            <Clock className="w-2.5 h-2.5" />
            {timeAgo}
          </div>
        )}
      </div>
    </a>
  );
}