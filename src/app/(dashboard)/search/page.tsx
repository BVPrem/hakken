"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Frown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SeriesCard } from "@/components/series/series-card";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  id: string;
  externalId: number | null;
  titleEn: string | null;
  titleRomaji: string | null;
  titleJa: string | null;
  coverImage: string | null;
  type: string;
  status: string | null;
  averageScore: number | null;
  genres: string[] | null;
  seasonYear: number | null;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&limit=24`
      );
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 400);
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Search
        </h1>
        <p className="text-muted-foreground">
          Find anime and manga across AniList, MAL and more
        </p>
      </div>

      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for anime or manga..."
          className="pl-10 bg-card border-border focus:border-primary/50 text-foreground placeholder:text-muted-foreground h-12 text-base"
          autoFocus
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      <AnimatePresence mode="wait">
        {!searched && !query && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <Search className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Start typing to search for anime or manga
            </p>
          </motion.div>
        )}

        {searched && !loading && results.length === 0 && (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <Frown className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No results found for{" "}
              <span className="text-foreground font-medium">&quot;{query}&quot;</span>
            </p>
          </motion.div>
        )}

        {results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-sm text-muted-foreground mb-4">
              {results.length} results for{" "}
              <span className="text-foreground">&quot;{query}&quot;</span>
            </p>
            <div
              className="grid grid-cols-2 sm:grid-cols-3
                md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
                gap-4"
            >
              {results.map((r, i) => (
                <SeriesCard
                  key={r.id}
                  id={r.id}
                  externalId={r.externalId}
                  title={r.titleEn ?? r.titleRomaji ?? r.titleJa}
                  coverImage={r.coverImage}
                  type={r.type}
                  status={r.status}
                  score={r.averageScore}
                  genres={r.genres ?? []}
                  year={r.seasonYear}
                  index={i}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
