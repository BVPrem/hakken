"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp,
         Newspaper, Star, Zap } from "lucide-react";

interface DigestData {
  greeting: string;
  trending_pick: { title: string; reason: string };
  news_summary: string;
  recommendation: { title: string; reason: string };
  fun_fact: string;
}

export function WeeklyDigest() {
  const [digest, setDigest] =
    useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/digest")
      .then(r => r.json())
      .then(d => {
        setDigest(d.digest ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !digest) return null;

  const items = [
    {
      icon: TrendingUp,
      label: "This Week's Pick",
      title: digest.trending_pick?.title,
      body: digest.trending_pick?.reason,
      color: "#22c55e",
    },
    {
      icon: Newspaper,
      label: "News Summary",
      title: null,
      body: digest.news_summary,
      color: "#3b82f6",
    },
    {
      icon: Star,
      label: "Recommended For You",
      title: digest.recommendation?.title,
      body: digest.recommendation?.reason,
      color: "hsl(var(--primary))",
    },
    {
      icon: Zap,
      label: "Did You Know?",
      title: null,
      body: digest.fun_fact,
      color: "#f59e0b",
    },
  ];

  return (
    <section style={{ display: "flex",
      flexDirection: "column", gap: "12px" }}>

      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        borderLeft: "3px solid hsl(var(--primary))",
        paddingLeft: "10px",
      }}>
        <Sparkles style={{
          width: "16px", height: "16px",
          color: "hsl(var(--primary))",
        }} />
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "18px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "hsl(var(--foreground))",
          margin: 0,
        }}>
          Weekly Digest
        </h2>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "8px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "hsl(var(--primary))",
          background: "hsl(var(--primary) / 0.1)",
          padding: "2px 6px",
          marginLeft: "4px",
        }}>
          AI
        </span>
      </div>

      {/* Greeting */}
      {digest.greeting && (
        <p style={{
          margin: 0,
          fontSize: "13px",
          color: "hsl(var(--muted-foreground))",
          fontStyle: "italic",
        }}>
          {digest.greeting}
        </p>
      )}

      {/* Items grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "10px",
      }}>
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              style={{
                padding: "14px",
                background: "var(--glass-bg)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1.5px solid var(--glass-border)",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <Icon style={{
                  width: "12px", height: "12px",
                  color: item.color, flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "9px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "hsl(var(--muted-foreground))",
                }}>
                  {item.label}
                </span>
              </div>
              {item.title && (
                <p style={{
                  margin: 0,
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "13px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "hsl(var(--foreground))",
                }}>
                  {item.title}
                </p>
              )}
              {item.body && (
                <p style={{
                  margin: 0,
                  fontSize: "11px",
                  color: "hsl(var(--muted-foreground))",
                  lineHeight: 1.5,
                }}>
                  {item.body}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}