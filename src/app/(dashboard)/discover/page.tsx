"use client";

import { useState, useEffect, useCallback } from "react";
import { SeriesCard } from "@/components/series/series-card";
import { Loader2, SlidersHorizontal } from "lucide-react";

const TABS = [
  { key: "popular", label: "Popular"   },
  { key: "airing",  label: "Airing Now"},
  { key: "top",     label: "Top Rated" },
  { key: "newest",  label: "Newest"    },
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
  const [tab, setTab]                   = useState("popular");
  const [typeFilter, setType]           = useState<"anime"|"manga"|"">("");
  const [genre, setGenre]               = useState("");
  const [genres, setGenres]             = useState<string[]>([]);
  const [items, setItems]               = useState<SeriesItem[]>([]);
  const [page, setPage]                 = useState(1);
  const [hasNext, setHasNext]           = useState(false);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);

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
    <div className="flex flex-col" style={{ gap: "32px" }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ paddingBottom: "8px", borderBottom: "2px solid hsl(var(--foreground) / 0.08)" }}>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(32px, 5vw, 48px)",
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
          fontWeight: 500,
          color: "hsl(var(--muted-foreground))",
          marginTop: "6px",
          letterSpacing: "0.02em",
        }}>
          Explore every anime and manga in the Hakken catalogue
        </p>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* Row 1: Tab pills + Type toggle */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}>
          {/* Filter icon label */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginRight: "4px",
            color: "hsl(var(--muted-foreground))",
          }}>
            <SlidersHorizontal style={{ width: "13px", height: "13px" }} />
          </div>

          {/* Tab buttons */}
          {TABS.map(t => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "8px 18px",
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "13px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  border: "2px solid",
                  borderColor: isActive
                    ? "hsl(var(--primary))"
                    : "hsl(var(--foreground) / 0.2)",
                  background: isActive
                    ? "hsl(var(--primary))"
                    : "transparent",
                  color: isActive
                    ? "hsl(var(--primary-foreground))"
                    : "hsl(var(--muted-foreground))",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  borderRadius: 0,
                  boxShadow: isActive ? "3px 3px 0 hsl(var(--primary) / 0.25)" : "none",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--foreground) / 0.5)";
                    (e.currentTarget as HTMLElement).style.color = "hsl(var(--foreground))";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--foreground) / 0.2)";
                    (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))";
                  }
                }}
              >
                {t.label}
              </button>
            );
          })}

          {/* Type toggle — All / Anime / Manga */}
          <div style={{
            marginLeft: "auto",
            display: "flex",
            border: "2px solid hsl(var(--foreground) / 0.2)",
            overflow: "hidden",
          }}>
            {(["", "anime", "manga"] as const).map((t, i) => {
              const isActive = typeFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    padding: "8px 16px",
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "12px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    background: isActive
                      ? "hsl(var(--foreground) / 0.1)"
                      : "transparent",
                    color: isActive
                      ? "hsl(var(--foreground))"
                      : "hsl(var(--muted-foreground))",
                    border: "none",
                    borderLeft: i > 0 ? "1px solid hsl(var(--foreground) / 0.15)" : "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontWeight: isActive ? 700 : 400,
                  }}
                >
                  {t === "" ? "All" : t === "anime" ? "Anime" : "Manga"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Genre pills */}
        {genres.length > 0 && (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            paddingTop: "4px",
          }}>
            {/* All Genres */}
            <button
              onClick={() => setGenre("")}
              style={{
                padding: "5px 14px",
                fontSize: "11px",
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                border: "1.5px solid",
                borderColor: genre === ""
                  ? "hsl(var(--primary))"
                  : "hsl(var(--foreground) / 0.2)",
                background: genre === ""
                  ? "hsl(var(--primary))"
                  : "transparent",
                color: genre === ""
                  ? "hsl(var(--primary-foreground))"
                  : "hsl(var(--muted-foreground))",
                cursor: "pointer",
                borderRadius: 0,
                transition: "all 0.15s",
              }}
            >
              All Genres
            </button>

            {genres.map(g => {
              const isActive = genre === g;
              return (
                <button
                  key={g}
                  onClick={() => setGenre(g === genre ? "" : g)}
                  style={{
                    padding: "5px 14px",
                    fontSize: "11px",
                    fontFamily: "'Bebas Neue', sans-serif",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    border: "1.5px solid",
                    borderColor: isActive
                      ? "hsl(var(--primary))"
                      : "hsl(var(--foreground) / 0.18)",
                    background: isActive
                      ? "hsl(var(--primary) / 0.12)"
                      : "transparent",
                    color: isActive
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted-foreground))",
                    cursor: "pointer",
                    borderRadius: 0,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--foreground) / 0.4)";
                      (e.currentTarget as HTMLElement).style.color = "hsl(var(--foreground))";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--foreground) / 0.18)";
                      (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))";
                    }
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── RESULTS ── */}
      {loading ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 20px",
          gap: "16px",
        }}>
          <Loader2
            className="animate-spin"
            style={{ width: "28px", height: "28px", color: "hsl(var(--primary))" }}
          />
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "12px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "hsl(var(--muted-foreground))",
          }}>
            Loading...
          </span>
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "80px 20px",
          color: "hsl(var(--muted-foreground))",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "16px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          border: "2px dashed hsl(var(--foreground) / 0.12)",
        }}>
          No series found for this filter combination
        </div>
      ) : (
        <>
          {/* ── CARD GRID ── wider cards, good gap */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "20px",
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

          {/* ── LOAD MORE ── well-spaced, manga panel style */}
          {hasNext && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: "20px",
              paddingBottom: "12px",
            }}>
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  padding: "14px 48px",
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "14px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  background: "transparent",
                  border: "2px solid hsl(var(--primary))",
                  color: "hsl(var(--primary))",
                  cursor: loadingMore ? "not-allowed" : "pointer",
                  opacity: loadingMore ? 0.6 : 1,
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  borderRadius: 0,
                  boxShadow: loadingMore ? "none" : "4px 4px 0 hsl(var(--primary) / 0.2)",
                }}
                onMouseEnter={e => {
                  if (!loadingMore) {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "hsl(var(--primary))";
                    el.style.color = "hsl(var(--primary-foreground))";
                    el.style.transform = "translate(-2px, -2px)";
                    el.style.boxShadow = "6px 6px 0 hsl(var(--primary) / 0.3)";
                  }
                }}
                onMouseLeave={e => {
                  if (!loadingMore) {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "transparent";
                    el.style.color = "hsl(var(--primary))";
                    el.style.transform = "translate(0, 0)";
                    el.style.boxShadow = "4px 4px 0 hsl(var(--primary) / 0.2)";
                  }
                }}
              >
                {loadingMore ? (
                  <Loader2 style={{
                    width: "15px",
                    height: "15px",
                    animation: "spin 1s linear infinite",
                  }} />
                ) : (
                  <span style={{ fontSize: "16px", lineHeight: 1 }}>↓</span>
                )}
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}