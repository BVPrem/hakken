"use client";

import React from "react";

interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  sentiment: string | null;
}

interface LatestNewsProps {
  seriesId: string;
}

export function LatestNews({ seriesId }: LatestNewsProps) {
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/feed?seriesId=${encodeURIComponent(seriesId)}&limit=5`)
      .then(r => r.json())
      .then(d => setArticles(d.articles ?? []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [seriesId]);

  if (loading) {
    return (
      <div style={{
        padding: "40px",
        textAlign: "center",
        background: "var(--glass-bg)",
        border: "1.5px solid var(--glass-border)",
      }}>
        <div style={{
          width: "20px", height: "20px",
          border: "2px solid hsl(var(--primary))",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto",
        }} />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div style={{
        padding: "40px",
        textAlign: "center",
        background: "var(--glass-bg)",
        border: "1.5px solid var(--glass-border)",
      }}>
        <p style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "13px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "hsl(var(--muted-foreground))",
        }}>
          No news articles yet for this series
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {articles.map((article) => (
        <a
          key={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            padding: "12px 14px",
            background: "var(--glass-bg)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1.5px solid var(--glass-border)",
            textDecoration: "none",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement)
              .style.borderColor = "hsl(var(--primary) / 0.4)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement)
              .style.borderColor = "var(--glass-border)";
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "9px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "hsl(var(--muted-foreground))",
            }}>
              {article.source?.replace("_", "/")}
            </span>
            {article.sentiment && (
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "9px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: article.sentiment === "positive"
                  ? "#22c55e"
                  : article.sentiment === "negative"
                  ? "#ef4444" : "#6b7280",
              }}>
                {article.sentiment}
              </span>
            )}
          </div>
          <p style={{
            margin: 0,
            fontSize: "13px",
            fontWeight: 600,
            color: "hsl(var(--foreground))",
            lineHeight: 1.4,
          }}>
            {article.title}
          </p>
        </a>
      ))}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}