"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface Insight {
  match: string;
  community_mood: string;
  verdict: "MUST_WATCH" | "WORTH_IT"
    | "NICHE_PICK" | "SKIP_IT";
  verdict_reason: string;
}

const VERDICT_CONFIG = {
  MUST_WATCH: { color: "#22c55e", bg: "#22c55e18" },
  WORTH_IT:   { color: "#3b82f6", bg: "#3b82f618" },
  NICHE_PICK: { color: "#f59e0b", bg: "#f59e0b18" },
  SKIP_IT:    { color: "#ef4444", bg: "#ef444418" },
};

export function SeriesInsight({
  seriesId
}: { seriesId: string }) {
  const [insight, setInsight] =
    useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/series-insight?seriesId=${seriesId}`)
      .then(r => r.json())
      .then(d => {
        setInsight(d.insight ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [seriesId]);

  if (loading) {
    return (
      <div style={{
        padding: "16px",
        background: "var(--glass-bg)",
        border: "1.5px solid var(--glass-border)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}>
        <Loader2 style={{
          width: "14px", height: "14px",
          color: "hsl(var(--primary))",
          animation: "spin 1s linear infinite",
        }} />
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "10px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "hsl(var(--muted-foreground))",
        }}>
          Generating insight...
        </span>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!insight) return null;

  const verdictCfg =
    VERDICT_CONFIG[insight.verdict] ?? VERDICT_CONFIG.WORTH_IT;

  return (
    <div style={{
      background: "var(--glass-bg)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1.5px solid var(--glass-border)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--glass-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}>
          <Sparkles style={{
            width: "14px", height: "14px",
            color: "hsl(var(--primary))",
          }} />
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "hsl(var(--foreground))",
          }}>
            Hakken AI Insight
          </span>
        </div>
        {/* Verdict badge */}
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "10px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: verdictCfg.color,
          background: verdictCfg.bg,
          padding: "3px 10px",
          border: `1px solid ${verdictCfg.color}40`,
        }}>
          {insight.verdict.replace("_", " ")}
        </span>
      </div>

      <div style={{
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}>
        <div>
          <p style={{
            margin: "0 0 3px",
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "8px",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "hsl(var(--muted-foreground))",
          }}>
            For Your Taste
          </p>
          <p style={{
            margin: 0,
            fontSize: "12px",
            color: "hsl(var(--foreground))",
            lineHeight: 1.5,
          }}>
            {insight.match}
          </p>
        </div>
        <div>
          <p style={{
            margin: "0 0 3px",
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "8px",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "hsl(var(--muted-foreground))",
          }}>
            Community Mood
          </p>
          <p style={{
            margin: 0,
            fontSize: "12px",
            color: "hsl(var(--foreground))",
            lineHeight: 1.5,
          }}>
            {insight.community_mood}
          </p>
        </div>
        <div style={{
          paddingTop: "8px",
          borderTop: "1px solid var(--glass-border)",
        }}>
          <p style={{
            margin: 0,
            fontSize: "12px",
            color: verdictCfg.color,
            fontWeight: 500,
          }}>
            {insight.verdict_reason}
          </p>
        </div>
      </div>
    </div>
  );
}