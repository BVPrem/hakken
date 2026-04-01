"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Tv, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const displayTitle = title ?? "Unknown Title";
  const isAnime = type === "anime";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut",
      }}
    >
      <Link href={`/series/${id}`}>
        <div
          className="group relative rounded-xl overflow-hidden
            bg-card border border-border hover:border-primary/40
            transition-all duration-300 hover:shadow-lg
            hover:shadow-primary/10 cursor-pointer"
        >
          <div
            className="relative aspect-[3/4] w-full
              overflow-hidden bg-muted"
          >
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
              <div
                className="w-full h-full flex items-center
                  justify-center bg-muted"
              >
                {isAnime ? (
                  <Tv className="w-12 h-12 text-muted-foreground" />
                ) : (
                  <BookOpen className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
            )}

            <div
              className="absolute inset-0 bg-gradient-to-t
                from-black/80 via-black/20 to-transparent
                opacity-0 group-hover:opacity-100
                transition-opacity duration-300"
            />

            {score && (
              <div
                className="absolute top-2 right-2 flex
                  items-center gap-1 bg-black/70 backdrop-blur-sm
                  rounded-full px-2 py-0.5"
              >
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-medium text-white">
                  {score.toFixed(1)}
                </span>
              </div>
            )}

            <div className="absolute top-2 left-2">
              <Badge
                variant="secondary"
                className="text-xs bg-black/70 backdrop-blur-sm text-white border-0 capitalize"
              >
                {isAnime ? "Anime" : "Manga"}
              </Badge>
            </div>
          </div>

          <div className="p-3 flex flex-col gap-1.5">
            <h3
              className="text-sm font-semibold text-foreground
                line-clamp-2 group-hover:text-accent
                transition-colors leading-snug"
            >
              {displayTitle}
            </h3>

            <div className="flex items-center gap-1.5 flex-wrap">
              {year && (
                <span className="text-xs text-muted-foreground">{year}</span>
              )}
              {status && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    status === "RELEASING"
                      ? "text-green-400"
                      : status === "FINISHED"
                      ? "text-muted-foreground"
                      : "text-yellow-400"
                  )}
                >
                  {status === "RELEASING"
                    ? "Airing"
                    : status === "FINISHED"
                    ? "Finished"
                    : status === "NOT_YET_RELEASED"
                    ? "Upcoming"
                    : status}
                </span>
              )}
            </div>

            {genres.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-0.5">
                {genres.slice(0, 2).map((g) => (
                  <span
                    key={g}
                    className="text-xs px-1.5 py-0.5 rounded-md
                      bg-primary/10 text-primary/80 border
                      border-primary/20"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
