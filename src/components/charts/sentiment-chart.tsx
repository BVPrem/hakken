"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

interface SentimentPoint {
  date: string;
  score: number;
  count: number;
}

interface SentimentChartProps {
  seriesId: string;
}

export function SentimentChart({ seriesId }: SentimentChartProps) {
  const [data, setData] = useState<SentimentPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    fetch(`/api/sentiment?seriesId=${seriesId}`)
      .then(r => r.json())
      .then(res => {
        const raw = res.data?.rawSentiment ?? [];
        setData(raw.filter((d: SentimentPoint) => d.count > 0));
        setHasData(res.data?.hasData ?? false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [seriesId]);

  if (loading) {
    return (
      <div style={{
        height: "120px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--glass-bg)",
        border: "1.5px solid var(--glass-border)",
      }}>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "11px",
          letterSpacing: "0.2em",
          color: "hsl(var(--muted-foreground))",
          textTransform: "uppercase",
        }}>
          Loading pulse...
        </span>
      </div>
    );
  }

  if (!hasData || data.length === 0) {
    return (
      <div style={{
        padding: "20px",
        background: "var(--glass-bg)",
        border: "1.5px solid var(--glass-border)",
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "11px",
          letterSpacing: "0.2em",
          color: "hsl(var(--muted-foreground))",
          textTransform: "uppercase",
          margin: 0,
        }}>
          No sentiment data yet — check back as the
          community discusses this series
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const score = payload[0].value as number;
    const color = score > 0.2 ? "#22c55e"
      : score < -0.2 ? "#ef4444" : "#6b7280";
    return (
      <div style={{
        background: "hsl(var(--card))",
        border: "1.5px solid var(--glass-border)",
        padding: "8px 12px",
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "11px",
        letterSpacing: "0.1em",
      }}>
        <p style={{ margin: 0, color: "hsl(var(--muted-foreground))" }}>
          {label}
        </p>
        <p style={{ margin: "2px 0 0", color, fontWeight: "bold" }}>
          {score > 0.2 ? "POSITIVE" : score < -0.2 ? "NEGATIVE" : "NEUTRAL"}
          {" "}({score.toFixed(2)})
        </p>
        <p style={{ margin: "2px 0 0", color: "hsl(var(--muted-foreground))", fontSize: "10px" }}>
          {payload[0]?.payload?.count} articles
        </p>
      </div>
    );
  };

  return (
    <div style={{ width: "100%", height: "160px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.4}
          />
          <XAxis
            dataKey="date"
            tick={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 9,
              fill: "hsl(var(--muted-foreground))",
              letterSpacing: "0.1em",
            }}
            tickFormatter={v => v.slice(5)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[-1, 1]}
            tick={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 9,
              fill: "hsl(var(--muted-foreground))",
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={0}
            stroke="hsl(var(--border))"
            strokeDasharray="4 2"
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{
              fill: "hsl(var(--primary))",
              strokeWidth: 0,
              r: 3,
            }}
            activeDot={{
              r: 5,
              fill: "hsl(var(--primary))",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
