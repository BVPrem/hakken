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
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-0">
        <h2 className="font-display text-xl uppercase
          tracking-widest text-foreground chapter-marker">
          {title}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={scrollPrev}
            disabled={prevDisabled}
            className={cn(
              "w-8 h-8 flex items-center justify-center",
              "border border-foreground/20 transition-all",
              "hover:border-primary hover:text-primary",
              "disabled:opacity-30 disabled:cursor-not-allowed"
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollNext}
            disabled={nextDisabled}
            className={cn(
              "w-8 h-8 flex items-center justify-center",
              "border border-foreground/20 transition-all",
              "hover:border-primary hover:text-primary",
              "disabled:opacity-30 disabled:cursor-not-allowed"
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={emblaRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div className="flex gap-2.5"
          style={{ touchAction: "pan-y pinch-zoom" }}>
          {items.map((item, i) => (
            <div
              key={item.id}
              className="flex-none"
              style={{ width: "clamp(100px, 14vw, 160px)" }}
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