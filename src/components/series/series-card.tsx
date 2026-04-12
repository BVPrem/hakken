"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeriesCardProps {
  id: string;
  externalId: number | null;
  title: string | null;
  coverImage: string | null;
  type: string;
  status: string | null;
  score: number | null;
  genres: string[];
  year: number | null;
  index?: number;
}

export function SeriesCard({
  id,
  title,
  coverImage,
  type,
  status,
  score,
  genres,
  year,
  index = 0,
}: SeriesCardProps) {
  const displayTitle = title ?? "Unknown";
  const isAiring = status === "RELEASING";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Link href={`/series/${id}`}>
        <div className={cn(
          "group relative overflow-hidden bg-card cursor-pointer",
          "manga-panel panel-hover"
        )}>
          {/* Cover — manga volume proportions */}
          <div className="relative aspect-[2/3] w-full
            overflow-hidden bg-muted">
            {coverImage ? (
              <Image
                src={coverImage}
                alt={displayTitle}
                fill
                className="object-cover transition-transform
                  duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw,
                       (max-width: 1024px) 33vw, 20vw"
              />
            ) : (
              <div className="w-full h-full flex items-center
                justify-center">
                <span className="ink-text text-xs
                  text-muted-foreground">
                  {type}
                </span>
              </div>
            )}

            {/* Airing indicator — red corner stamp */}
            {isAiring && (
              <div className="absolute top-0 right-0 bg-primary
                text-primary-foreground text-[9px] font-display
                uppercase tracking-wider px-1.5 py-0.5">
                Airing
              </div>
            )}

            {/* Score — bottom left */}
            {score && (
              <div className="absolute bottom-0 left-0
                bg-background/90 border-t border-r border-border
                flex items-center gap-1 px-2 py-0.5">
                <Star className="w-2.5 h-2.5 text-primary
                  fill-primary" />
                <span className="text-[11px] font-display
                  text-foreground">
                  {score.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Title bar */}
          <div className="p-2 border-t-2
            border-foreground/10 bg-card">
            <p className="text-xs font-display uppercase
              tracking-wide text-foreground line-clamp-2
              leading-tight group-hover:text-primary
              transition-colors">
              {displayTitle}
            </p>
            {year && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {year}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
