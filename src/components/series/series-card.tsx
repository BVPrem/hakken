"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

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
  year,
  index = 0,
}: SeriesCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Link href={`/series/${id}`}>
        <div className="group panel-lift glass manga-panel
          overflow-hidden w-[140px] sm:w-[150px] md:w-[160px]">

          {/* Cover — tall portrait, manga volume ratio */}
          <div className="relative w-full h-[205px] sm:h-[220px] md:h-[235px]
            overflow-hidden bg-muted">
            {coverImage ? (
              <Image
                src={coverImage}
                alt={title ?? "Series"}
                fill
                className="object-cover transition-transform
                  duration-500 group-hover:scale-105"
                sizes="160px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center
                justify-center halftone">
                <span className="font-display text-xs
                  text-muted-foreground tracking-widest uppercase">
                  {type}
                </span>
              </div>
            )}

            {/* Airing stamp */}
            {status === "RELEASING" && (
              <div className="absolute top-0 left-0
                bg-primary text-primary-foreground
                font-display text-[8px] tracking-widest
                uppercase px-1.5 py-0.5">
                Airing
              </div>
            )}

            {/* Score */}
            {score && (
              <div className="absolute bottom-0 right-0
                bg-background/85 backdrop-blur-sm
                flex items-center gap-0.5 px-1.5 py-0.5
                border-t border-l border-border/50">
                <Star className="w-2.5 h-2.5 text-primary
                  fill-primary" />
                <span className="font-display text-[10px]
                  text-foreground">
                  {score.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="px-2 py-1.5 border-t border-border/50">
            <p className="font-display text-[10px] tracking-wide
              uppercase text-foreground line-clamp-2
              leading-tight group-hover:text-primary
              transition-colors">
              {title ?? "Unknown"}
            </p>
            {year && (
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {year}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}