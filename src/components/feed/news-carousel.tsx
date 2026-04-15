"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NewsCard } from "./news-card";
import { cn } from "@/lib/utils";

interface CarouselItem {
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

interface NewsCarouselProps {
  items: CarouselItem[];
}

export function NewsCarousel({ items }: NewsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      dragFree: true,
      loop: false,
      skipSnaps: false,
    },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
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
          Latest News
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
          {items.map((item) => (
            <div
              key={item.id}
              className="flex-none"
              style={{ width: "clamp(280px, 40vw, 380px)" }}
            >
              <NewsCard
                id={item.id}
                title={item.title}
                summary={item.summary}
                source={item.source}
                sentiment={item.sentiment}
                sentimentScore={item.sentimentScore}
                publishedAt={item.publishedAt}
                imageUrl={item.imageUrl}
                url={item.url}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}