"use client";

import { ExternalLink, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

const SENTIMENT_CONFIG = {
  positive: {
    label: "Positive",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  negative: {
    label: "Negative",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  neutral: {
    label: "Neutral",
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
  mixed: {
    label: "Mixed",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
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
  const sentimentCfg = sentiment
    ? SENTIMENT_CONFIG[sentiment as keyof typeof SENTIMENT_CONFIG]
    : null;

  const timeAgo = publishedAt
    ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true })
    : null;

  const bullets = summary
    ? summary
        .split("\n")
        .filter((l) => l.trim().startsWith("•"))
        .map((l) => l.replace("•", "").trim())
    : [];

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-border
        bg-card hover:border-primary/30 transition-all
        duration-200 hover:shadow-lg hover:shadow-primary/5 p-4"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs shrink-0">
              {sourceLabel}
            </Badge>
            {sentimentCfg && (
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ${sentimentCfg.className}`}
              >
                {sentimentCfg.label}
              </Badge>
            )}
          </div>
          <ExternalLink
            className="w-3.5 h-3.5 text-muted-foreground
              opacity-0 group-hover:opacity-100 transition-opacity
              shrink-0 mt-0.5"
          />
        </div>

        <h3
          className="text-sm font-semibold text-foreground
            line-clamp-2 group-hover:text-primary transition-colors
            leading-snug"
        >
          {title}
        </h3>

        {bullets.length > 0 && (
          <ul className="flex flex-col gap-1">
            {bullets.slice(0, 3).map((b, i) => (
              <li
                key={i}
                className="flex gap-2 text-xs
                  text-muted-foreground leading-relaxed"
              >
                <span className="text-primary mt-0.5 shrink-0">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {timeAgo && (
          <div
            className="flex items-center gap-1
              text-xs text-muted-foreground pt-1
              border-t border-border"
          >
            <Clock className="w-3 h-3" />
            <span>{timeAgo}</span>
          </div>
        )}
      </div>
    </a>
  );
}
