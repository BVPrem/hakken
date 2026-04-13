"use client";

import { ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const SOURCE_LABELS: Record<string, string> = {
  ann: "ANN", reddit_anime: "r/anime", reddit_manga: "r/manga",
  reddit_animenews: "r/animenews", mal_news: "MAL",
  anime_corner: "Anime Corner", anime_feminist: "Anime Feminist",
  anitrendz: "AniTrendz", anime_senpai: "Anime Senpai",
  kotaku_anime: "Kotaku", livechart: "Livechart",
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-emerald-500",
  negative: "bg-red-600",
  neutral:  "bg-muted-foreground/40",
  mixed:    "bg-amber-500",
};

interface NewsCardProps {
  id: string; title: string; summary: string | null;
  source: string; sentiment: string | null;
  sentimentScore: number | null; publishedAt: string | null;
  imageUrl: string | null; url: string;
}

export function NewsCard({
  title, summary, source, sentiment, publishedAt, url
}: NewsCardProps) {
  const bullets = summary
    ? summary.split("\n")
        .filter(l => l.trim().startsWith("•"))
        .map(l => l.replace("•", "").trim())
    : [];

  const timeAgo = publishedAt
    ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true })
    : null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="group flex flex-col glass manga-panel
        overflow-hidden panel-lift">

      {/* Sentiment bar — 3px top edge */}
      <div className={cn(
        "h-[3px] w-full shrink-0",
        sentiment ? SENTIMENT_COLORS[sentiment] : "bg-border"
      )} />

      <div className="flex flex-col gap-2 p-3.5 flex-1">
        {/* Source + time row */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-[9px] tracking-[0.2em]
            uppercase text-muted-foreground">
            {SOURCE_LABELS[source] ?? source}
          </span>
          <div className="flex items-center gap-1.5">
            {sentiment && (
              <span className={cn(
                "font-display text-[8px] tracking-widest uppercase",
                sentiment === "positive" ? "text-emerald-500" :
                sentiment === "negative" ? "text-red-500" :
                "text-muted-foreground"
              )}>
                {sentiment}
              </span>
            )}
            <ExternalLink className="w-2.5 h-2.5 text-muted-foreground
              opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground
          line-clamp-2 leading-snug
          group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Summary bullets */}
        {bullets.length > 0 && (
          <ul className="flex flex-col gap-1 pl-2
            border-l-2 border-primary/30">
            {bullets.slice(0, 2).map((b, i) => (
              <li key={i} className="text-xs
                text-muted-foreground leading-relaxed line-clamp-2">
                {b}
              </li>
            ))}
          </ul>
        )}

        {/* Timestamp — push to bottom */}
        <div className="mt-auto pt-2 border-t border-border/50
          flex items-center gap-1 text-[10px]
          text-muted-foreground font-display tracking-wide uppercase">
          <Clock className="w-2.5 h-2.5" />
          {timeAgo ?? "—"}
        </div>
      </div>
    </a>
  );
}