"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Newspaper,
  ExternalLink,
  Clock,
  Tag,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Article } from "@/lib/db/schema";

// ─── Types ────────────────────────────────────────────────

interface ArticleListResponse {
  articles: Article[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  sources: string[];
}

// ─── Sentiment badge ──────────────────────────────────────

function SentimentBadge({
  sentiment,
}: {
  sentiment: string | null;
}) {
  if (!sentiment) return null;

  const config: Record<string, { icon: typeof TrendingUp; color: string; label: string }> = {
    positive: { icon: TrendingUp, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", label: "Positive" },
    negative: { icon: TrendingDown, color: "text-red-400 bg-red-400/10 border-red-400/20", label: "Negative" },
    neutral: { icon: Minus, color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20", label: "Neutral" },
    mixed: { icon: AlertCircle, color: "text-amber-400 bg-amber-400/10 border-amber-400/20", label: "Mixed" },
  };

  const c = config[sentiment] ?? config.neutral;
  const Icon = c.icon;

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border", c.color)}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

// ─── Source badge colors ──────────────────────────────────

function sourceColor(source: string): string {
  const colors: Record<string, string> = {
    animenewsnetwork: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    crunchyroll: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    myanimelist: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    reddit: "bg-red-500/10 text-red-400 border-red-500/20",
    mangaupdates: "bg-green-500/10 text-green-400 border-green-500/20",
    otakuusamagazine: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };
  return colors[source] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
}

function formatSourceName(source: string): string {
  const names: Record<string, string> = {
    animenewsnetwork: "Anime News Network",
    crunchyroll: "Crunchyroll",
    myanimelist: "MyAnimeList",
    reddit: "Reddit",
    mangaupdates: "Manga Updates",
    otakuusamagazine: "Otaku USA",
  };
  return names[source] ?? source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function relativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: diffDay > 365 ? "numeric" : undefined,
  });
}

// ─── Skeleton card ────────────────────────────────────────

function ArticleSkeleton() {
  return (
    <div className="manga-panel bg-card overflow-hidden">
      <Skeleton className="h-44 w-full" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </div>
  );
}

// ─── Article card ─────────────────────────────────────────

function ArticleCard({ article }: { article: Article }) {
  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group block manga-panel bg-card
        hover:border-primary/40
        transition-all duration-300 overflow-hidden panel-lift"
    >
      {/* Cover image */}
      {article.imageUrl ? (
        <div className="relative h-44 overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500
              group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-display uppercase tracking-wide border backdrop-blur-sm",
              sourceColor(article.source)
            )}>
              {formatSourceName(article.source)}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-44 flex items-center justify-center bg-muted">
          <Newspaper className="w-10 h-10 text-muted-foreground" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Source + sentiment row */}
        <div className="flex items-center gap-2 flex-wrap">
          {!article.imageUrl && (
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-display uppercase tracking-wide border",
              sourceColor(article.source)
            )}>
              {formatSourceName(article.source)}
            </span>
          )}
          <SentimentBadge sentiment={article.sentiment} />
        </div>

        {/* Title */}
        <h3 className="font-display text-sm font-semibold leading-snug
          text-foreground line-clamp-2 group-hover:text-primary
          transition-colors uppercase tracking-wide">
          {article.title}
        </h3>

        {/* Summary / content snippet */}
        {(article.summary || article.content) && (
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {article.summary ?? article.content?.slice(0, 200)}
          </p>
        )}

        {/* Footer: time + tags */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-border">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            {article.publishedAt
              ? relativeTime(article.publishedAt)
              : relativeTime(article.crawledAt)}
          </div>

          {article.url && (
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground
              group-hover:text-primary transition-colors" />
          )}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-display uppercase tracking-wide bg-muted text-muted-foreground border border-border"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground self-center">
                +{article.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.a>
  );
}

// ─── Page content (needs to be separate for useSearchParams) ─

function ArticlesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);
  const activeSource = searchParams.get("source") ?? "";
  const searchQuery = searchParams.get("q") ?? "";

  const [localSearch, setLocalSearch] = useState(searchQuery);

  // ─── Fetch articles ───────────────────────────────────
  const fetchArticles = useCallback(
    async (page: number, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "20",
        });
        if (activeSource) params.set("source", activeSource);
        if (searchQuery) params.set("q", searchQuery);

        const res = await fetch(`/api/articles?${params}`);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);

        const data: ArticleListResponse = await res.json();

        if (append) {
          setArticles((prev) => [...prev, ...data.articles]);
        } else {
          setArticles(data.articles);
        }
        setTotal(data.total);
        setHasMore(data.hasMore);
        setSources(data.sources ?? []);
      } catch (err) {
        console.error("Failed to fetch articles:", err);
        setError("Failed to load articles. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeSource, searchQuery]
  );

  useEffect(() => {
    fetchArticles(currentPage);
  }, [currentPage, activeSource, searchQuery, fetchArticles]);

  // ─── URL state helpers ────────────────────────────────
  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    // Reset page when filters change
    if (!("page" in updates)) params.delete("page");
    router.push(`/articles?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: localSearch });
  };

  const handleSourceFilter = (source: string) => {
    updateParams({ source: source === activeSource ? "" : source });
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    updateParams({ page: String(nextPage) });
    fetchArticles(nextPage, true);
  };

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="min-h-screen halftone">
      {/* Header */}
      <div className="sticky top-0 z-30 glass border-b-2 border-foreground/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 flex items-center
                justify-center manga-panel-accent">
                <Newspaper className="w-5 h-5 text-primary" />
              </div>
              <div className="chapter-marker">
                <h1 className="font-display text-xl uppercase tracking-wider text-foreground">
                  Articles
                </h1>
                <p className="text-xs text-muted-foreground">
                  {total > 0 ? `${total.toLocaleString()} articles` : "Anime & manga news"}
                </p>
              </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 sm:max-w-md sm:ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2
                  w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-9 bg-card"
                />
              </div>
            </form>
          </div>

          {/* Source filters */}
          {sources.length > 0 && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1
              scrollbar-none">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <button
                onClick={() => handleSourceFilter("")}
                className={cn(
                  "shrink-0 px-3 py-1 text-xs font-display uppercase tracking-wide border transition-colors",
                  !activeSource
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                All Sources
              </button>
              {sources.map((source) => (
                <button
                  key={source}
                  onClick={() => handleSourceFilter(source)}
                  className={cn(
                    "shrink-0 px-3 py-1 text-xs font-display uppercase tracking-wide border transition-colors",
                    activeSource === source
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:border-primary/40"
                  )}
                >
                  {formatSourceName(source)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 p-4 manga-panel bg-destructive/10
            border-destructive/20 text-destructive mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchArticles(currentPage)}
              className="ml-auto text-destructive hover:text-destructive"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <ArticleSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-muted flex items-center
              justify-center mb-4 manga-panel">
              <Newspaper className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg uppercase tracking-wider text-foreground mb-2">
              No articles found
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {searchQuery
                ? `No results for "${searchQuery}". Try a different search term.`
                : activeSource
                  ? `No articles from ${formatSourceName(activeSource)} yet.`
                  : "No articles have been crawled yet. Check back soon!"}
            </p>
          </div>
        )}

        {/* Article grid */}
        {!loading && articles.length > 0 && (
          <>
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
            >
              <AnimatePresence mode="popLayout">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="min-w-[200px]"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>Load More</>
                  )}
                </Button>
              </div>
            )}

            {/* Article count */}
            <p className="text-center text-[10px] text-muted-foreground mt-4 font-display uppercase tracking-wide">
              Showing {articles.length} of {total.toLocaleString()} articles
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page export with Suspense boundary ───────────────────

export default function ArticlesPage() {
  return (
    <ArticlesContent />
  );
}
