"use client";

import { useState, useEffect, useCallback } from "react";
import { SeriesCard } from "@/components/series/series-card";
import { Loader2 } from "lucide-react";

const TABS = [
  { key: "popular", label: "Popular"    },
  { key: "airing",  label: "Airing Now" },
  { key: "top",     label: "Top Rated"  },
  { key: "newest",  label: "Newest"     },
];

interface SeriesItem {
  id: string;
  externalId: number | null;
  titleEn: string | null;
  titleRomaji: string | null;
  coverImage: string | null;
  type: string;
  status: string | null;
  averageScore: number | null;
  genres: string[] | null;
  seasonYear: number | null;
}

export default function DiscoverPage() {
  const [tab, setTab]           = useState("popular");
  const [typeFilter, setType]   = useState<"anime"|"manga"|"">("");
  const [genre, setGenre]       = useState("");
  const [genres, setGenres]     = useState<string[]>([]);
  const [items, setItems]       = useState<SeriesItem[]>([]);
  const [page, setPage]         = useState(1);
  const [hasNext, setHasNext]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchData = useCallback(async (
    currentTab: string,
    currentType: string,
    currentGenre: string,
    currentPage: number,
    append = false
  ) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        tab: currentTab,
        page: String(currentPage),
        ...(currentType  ? { type: currentType }   : {}),
        ...(currentGenre ? { genre: currentGenre } : {}),
      });
      const res = await fetch(`/api/discover?${params}`);
      const data = await res.json();

      setItems(prev =>
        append ? [...prev, ...(data.series ?? [])]
               : (data.series ?? [])
      );
      setGenres(data.genres ?? []);
      setHasNext(data.pagination?.hasNext ?? false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchData(tab, typeFilter, genre, 1, false);
  }, [tab, typeFilter, genre, fetchData]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchData(tab, typeFilter, genre, next, true);
  };

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(28px, 5vw, 42px)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "hsl(var(--foreground))",
          margin: 0,
          lineHeight: 1,
        }}>
          Discover
        </h1>
        <p style={{
          fontSize: "13px",
          color: "hsl(var(--muted-foreground))",
          marginTop: "6px",
        }}>
          Explore every anime and manga in the Hakken catalogue
        </p>
      </div>

      <div className="flex flex-col gap-3">

        <div className="flex items-center gap-1 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "6px 14px",
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                border: "1.5px solid",
                borderColor: tab === t.key
                  ? "hsl(var(--primary))"
                  : "hsl(var(--border))",
                background: tab === t.key
                  ? "hsl(var(--primary))"
                  : "transparent",
                color: tab === t.key
                  ? "hsl(var(--primary-foreground))"
                  : "hsl(var(--muted-foreground))",
                cursor: "pointer",
                transition: "all 0.15s",
                borderRadius: 0,
              }}
            >
              {t.label}
            </button>
          ))}

          <div style={{
            marginLeft: "auto",
            display: "flex",
            border: "1.5px solid hsl(var(--border))",
          }}>
            {(["", "anime", "manga"] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  padding: "6px 12px",
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  background: typeFilter === t
                    ? "hsl(var(--foreground) / 0.08)"
                    : "transparent",
                  color: typeFilter === t
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--muted-foreground))",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {t === "" ? "All" : t === "anime" ? "Anime" : "Manga"}
              </button>
            ))}
          </div>
        </div>

        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setGenre("")}
              style={{
                padding: "3px 10px",
                fontSize: "11px",
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                border: "1px solid",
                borderColor: genre === ""
                  ? "hsl(var(--primary))"
                  : "hsl(var(--border))",
                background: genre === ""
                  ? "hsl(var(--primary) / 0.1)"
                  : "transparent",
                color: genre === ""
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted-foreground))",
                cursor: "pointer",
                borderRadius: 0,
                transition: "all 0.15s",
              }}
            >
              All Genres
            </button>
            {genres.map(g => (
              <button
                key={g}
                onClick={() => setGenre(g === genre ? "" : g)}
                style={{
                  padding: "3px 10px",
                  fontSize: "11px",
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  border: "1px solid",
                  borderColor: genre === g
                    ? "hsl(var(--primary))"
                    : "hsl(var(--border))",
                  background: genre === g
                    ? "hsl(var(--primary) / 0.1)"
                    : "transparent",
                  color: genre === g
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted-foreground))",
                  cursor: "pointer",
                  borderRadius: 0,
                  transition: "all 0.15s",
                }}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2
            className="animate-spin"
            style={{
              width: "24px", height: "24px",
              color: "hsl(var(--primary))",
            }}
          />
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          color: "hsl(var(--muted-foreground))",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "14px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          No series found for this filter combination
        </div>
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(130px, 1fr))",
            gap: "12px",
          }}>
            {items.map((s, i) => (
              <SeriesCard
                key={s.id}
                id={s.id}
                externalId={s.externalId}
                title={s.titleEn ?? s.titleRomaji}
                coverImage={s.coverImage}
                type={s.type}
                status={s.status}
                score={s.averageScore}
                genres={s.genres ?? []}
                year={s.seasonYear}
                index={i}
              />
            ))}
          </div>

          {hasNext && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  padding: "10px 32px",
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "12px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  background: "transparent",
                  border: "1.5px solid hsl(var(--primary))",
                  color: "hsl(var(--primary))",
                  cursor: loadingMore ? "not-allowed" : "pointer",
                  opacity: loadingMore ? 0.6 : 1,
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  borderRadius: 0,
                }}
              >
                {loadingMore && (
                  <Loader2 style={{
                    width: "14px", height: "14px",
                    animation: "spin 1s linear infinite",
                  }} />
                )}
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}