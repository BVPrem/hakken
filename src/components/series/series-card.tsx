"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

/** Taller cards + wider covers. */
const CARD_H =
  "h-[384px] min-h-[384px] sm:h-[400px] sm:min-h-[400px] md:h-[420px] md:min-h-[420px]" as const;
/** 3-line title + year; box includes py-2 + border (border-box). */
const FOOTER_H =
  "h-[100px] min-h-[100px] max-h-[100px] shrink-0 border-t border-border/50 bg-background px-3 py-2 box-border" as const;
/** Card height − border(4px) − footer(100px). */
const COVER_H =
  "h-[280px] min-h-[280px] shrink-0 sm:h-[296px] sm:min-h-[296px] md:h-[316px] md:min-h-[316px]" as const;

const titleClamp: React.CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  wordBreak: "break-word",
};

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
  const label = title?.trim() || "Unknown";

  return (
    <motion.div
      className="w-full min-w-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Link
        href={`/series/${id}`}
        className="block w-full no-underline outline-none text-current
          focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          focus-visible:ring-offset-background"
        style={{ color: "inherit", textDecoration: "none" }}
      >
          <div
          className={`group box-border flex w-full flex-col overflow-hidden
            cursor-pointer rounded-none border-2 border-foreground/15 ${CARD_H}
            transition-all duration-150 ease-out
            hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0px_hsl(var(--primary))]`}
          style={{
            transform: "translate(0,0)",
          }}
        >
          {/* Add a pseudo-element or separate div for the shadow effect using group-hover if needed, 
              but since we apply it to the main div, we can just use tailwind shadow. */}
          <div
            className={`relative z-0 w-full overflow-hidden bg-muted
              backdrop-blur-md ${COVER_H}`}
          >
            {coverImage ? (
              <Image
                src={coverImage}
                alt={label}
                fill
                className="object-cover transition-transform duration-500
                  group-hover:scale-105"
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center
                  halftone"
              >
                <span
                  className="font-display text-xs uppercase tracking-widest
                    text-muted-foreground"
                >
                  {type}
                </span>
              </div>
            )}

            {status === "RELEASING" && (
              <div
                className="absolute left-0 top-0 z-[1] bg-primary px-1.5 py-0.5
                  font-display text-[8px] uppercase tracking-widest
                  text-primary-foreground"
              >
                Airing
              </div>
            )}

            {score != null && score > 0 && (
              <div
                className="absolute bottom-0 right-0 z-[1] flex items-center
                  gap-0.5 border-l border-t border-border/50 bg-background/95
                  px-1.5 py-0.5 backdrop-blur-sm"
              >
                <Star className="size-2.5 fill-primary text-primary" />
                <span className="font-display text-[10px] text-foreground">
                  {score.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <div className={`relative z-[3] flex flex-col justify-between ${FOOTER_H}`}>
            <p
              className="m-0 text-[18px] uppercase tracking-wide
                leading-[1.1] transition-colors group-hover:text-primary"
              style={{
                ...titleClamp,
                fontFamily: "'Bebas Neue', sans-serif",
                color: "var(--foreground, #000)"
              }}
            >
              {label}
            </p>
            <p 
              className="m-0 text-[14px] leading-none tracking-wider"
              style={{ fontFamily: "'Bebas Neue', sans-serif", color: "var(--muted-foreground, #555)" }}
            >
              {year != null ? String(year) : "\u00a0"}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
