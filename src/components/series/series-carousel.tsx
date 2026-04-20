"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SeriesCard } from "./series-card";
import { cn } from "@/lib/utils";

interface CarouselItem {
  id: string;
  externalId: number | null;
  title: string | null;
  coverImage: string | null;
  type: string;
  status: string | null;
  averageScore: number | null;
  genres: string[] | null;
  seasonYear: number | null;
}

interface SeriesCarouselProps {
  items: CarouselItem[];
  title: string;
}

export function SeriesCarousel({ items, title }: SeriesCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      dragFree: true,
      loop: false,
      skipSnaps: false,
    },
    [Autoplay({ delay: 4000, stopOnInteraction: true })]
  );

  const [prevDisabled, setPrevDisabled] = useState(true);
  const [nextDisabled, setNextDisabled] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevDisabled(!emblaApi.canScrollPrev());
    setNextDisabled(!emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(
    () => emblaApi?.scrollPrev(), [emblaApi]
  );
  const scrollNext = useCallback(
    () => emblaApi?.scrollNext(), [emblaApi]
  );

  return (
    <section className="flex flex-col gap-6 md:gap-7">
      <div className="flex items-center justify-between gap-4 px-0">
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "20px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "hsl(var(--foreground))",
          borderLeft: "3px solid hsl(var(--primary))",
          paddingLeft: "10px",
          margin: 0,
        }}>
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={scrollPrev}
            disabled={prevDisabled}
            className={cn(
              "group relative overflow-hidden flex items-center justify-center",
              "w-8 h-8 border-2 border-foreground bg-background transition-transform",
              "disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none",
              !prevDisabled && "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            )}
            style={prevDisabled ? {} : { boxShadow: "2px 2px 0px hsl(var(--foreground))" }}
            aria-label="Scroll left"
          >
            {!prevDisabled && <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity halftone" />}
            <ChevronLeft className="relative z-10 w-4 h-4 text-foreground transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
          </button>
          <button
            onClick={scrollNext}
            disabled={nextDisabled}
            className={cn(
              "group relative overflow-hidden flex items-center justify-center",
              "w-8 h-8 border-2 border-foreground bg-background transition-transform",
              "disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none",
              !nextDisabled && "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            )}
            style={nextDisabled ? {} : { boxShadow: "2px 2px 0px hsl(var(--foreground))" }}
            aria-label="Scroll right"
          >
            {!nextDisabled && <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity halftone" />}
            <ChevronRight className="relative z-10 w-4 h-4 text-foreground transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div
        ref={emblaRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div
          className="flex items-start gap-4 md:gap-5"
          style={{ touchAction: "pan-y pinch-zoom" }}
        >
          {items.map((item, i) => (
            <div
              key={item.id}
              className="flex w-full min-w-0 shrink-0 flex-none flex-col"
              style={{
                width: "clamp(150px, 18vw, 220px)",
              }}
            >
              <SeriesCard
                id={item.id}
                externalId={item.externalId}
                title={item.title}
                coverImage={item.coverImage}
                type={item.type}
                status={item.status}
                score={item.averageScore}
                genres={item.genres ?? []}
                year={item.seasonYear}
                index={i}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}