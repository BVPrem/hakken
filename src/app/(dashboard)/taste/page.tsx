"use client";

import { useEffect, useState } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis,
  Radar, ResponsiveContainer, BarChart,
  Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";

interface TasteData {
  isEmpty: boolean;
  genreData: Array<{ genre: string; count: number }>;
  studioData: Array<{ studio: string; count: number }>;
  statusData: Array<{ status: string; count: number }>;
  aiProfile: string | null;
  recommendations: Array<{
    title: string; reason: string; genre: string;
  }>;
  totalTracked: number;
}

const STATUS_COLORS: Record<string, string> = {
  watching:      "#22c55e",
  completed:     "#3b82f6",
  plan_to_watch: "#f59e0b",
  on_hold:       "#f97316",
  dropped:       "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  watching:      "Watching",
  completed:     "Completed",
  plan_to_watch: "Plan to Watch",
  on_hold:       "On Hold",
  dropped:       "Dropped",
};

export default function TastePage() {
  const [data, setData] = useState<TasteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (bust = false) => {
    if (bust) setRefreshing(true);
    else setLoading(true);
    try {
      const url = bust
        ? "/api/taste?bust=1"
        : "/api/taste";
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const SectionHeader = ({
    children, action
  }: {
    children: React.ReactNode;
    action?: React.ReactNode;
  }) => (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "16px",
    }}>
      <h2 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "18px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "hsl(var(--foreground))",
        borderLeft: "3px solid hsl(var(--primary))",
        paddingLeft: "10px",
        margin: 0,
      }}>
        {children}
      </h2>
      {action}
    </div>
  );

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "16px",
      }}>
        <Loader2 style={{
          width: "32px", height: "32px",
          color: "hsl(var(--primary))",
          animation: "spin 1s linear infinite",
        }} />
        <p style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "14px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "hsl(var(--muted-foreground))",
        }}>
          Analysing your taste...
        </p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!data || data.isEmpty) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        gap: "16px",
        textAlign: "center",
      }}>
        <Sparkles style={{
          width: "40px", height: "40px",
          color: "hsl(var(--primary))",
        }} />
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "28px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "hsl(var(--foreground))",
          margin: 0,
        }}>
          No Taste Data Yet
        </h1>
        <p style={{
          fontSize: "14px",
          color: "hsl(var(--muted-foreground))",
          maxWidth: "360px",
          lineHeight: 1.6,
        }}>
          Track at least a few anime series on your
          watchlist to unlock your personalised
          Taste DNA analysis.
        </p>
        <Link href="/search" style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "12px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "hsl(var(--primary))",
          textDecoration: "none",
          border: "1.5px solid hsl(var(--primary))",
          padding: "8px 20px",
        }}>
          Start Exploring →
        </Link>
      </div>
    );
  }

  // Radar data — needs full/max for radar to work
  const maxCount = Math.max(
    ...data.genreData.map(g => g.count)
  );
  const radarData = data.genreData.slice(0, 8).map(g => ({
    genre: g.genre,
    value: Math.round((g.count / maxCount) * 100),
    fullMark: 100,
  }));

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "40px",
      maxWidth: "900px",
    }}>

      {/* Header */}
      <div style={{
        position: "relative",
        padding: "28px",
        overflow: "hidden",
        backgroundImage:
          "radial-gradient(circle, hsl(var(--foreground) / 0.04) 1px, transparent 1px)",
        backgroundSize: "16px 16px",
        borderBottom: "1px solid hsl(var(--foreground) / 0.08)",
      }}>
        <p style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "10px",
          letterSpacing: "0.5em",
          textTransform: "uppercase",
          color: "hsl(var(--primary))",
          margin: "0 0 6px",
        }}>
          {data.totalTracked} series tracked
        </p>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(32px, 6vw, 52px)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "hsl(var(--foreground))",
          margin: 0,
          lineHeight: 0.9,
        }}>
          Your Taste<br />
          <span style={{ color: "hsl(var(--primary))" }}>
            DNA
          </span>
        </h1>
        <div style={{
          position: "absolute",
          top: 0, right: 0,
          width: "80px", height: "80px",
          borderLeft: "2px solid hsl(var(--primary) / 0.2)",
          borderBottom: "2px solid hsl(var(--primary) / 0.2)",
        }} />
      </div>

      {/* AI Profile Card */}
      {data.aiProfile && (
        <div>
          <SectionHeader
            action={
              <button
                onClick={() => load(true)}
                disabled={refreshing}
                style={{
                  display: "flex", alignItems: "center",
                  gap: "4px", background: "none",
                  border: "none", cursor: refreshing
                    ? "not-allowed" : "pointer",
                  color: "hsl(var(--muted-foreground))",
                  fontSize: "11px",
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                <RefreshCw style={{
                  width: "12px", height: "12px",
                  animation: refreshing
                    ? "spin 1s linear infinite"
                    : "none",
                }} />
                Refresh
              </button>
            }
          >
            AI Profile
          </SectionHeader>
          <div style={{
            padding: "20px 24px",
            background: "var(--glass-bg)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1.5px solid hsl(var(--primary) / 0.2)",
            borderLeft: "4px solid hsl(var(--primary))",
            display: "flex",
            gap: "16px",
            alignItems: "flex-start",
          }}>
            <Sparkles style={{
              width: "20px", height: "20px",
              color: "hsl(var(--primary))",
              flexShrink: 0,
              marginTop: "2px",
            }} />
            <p style={{
              margin: 0,
              fontSize: "14px",
              lineHeight: 1.7,
              color: "hsl(var(--foreground))",
              fontStyle: "italic",
            }}>
              {data.aiProfile}
            </p>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "32px",
      }}>

        {/* Genre Radar */}
        {radarData.length >= 3 && (
          <div>
            <SectionHeader>Genre Radar</SectionHeader>
            <div style={{
              padding: "16px",
              background: "var(--glass-bg)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1.5px solid var(--glass-border)",
              height: "280px",
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid
                    stroke="hsl(var(--border))"
                    opacity={0.4}
                  />
                  <PolarAngleAxis
                    dataKey="genre"
                    tick={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 9,
                      fill: "hsl(var(--muted-foreground))",
                      letterSpacing: "0.08em",
                    }}
                  />
                  <Radar
                    name="Genre"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Status Pie */}
        {data.statusData.length > 0 && (
          <div>
            <SectionHeader>Watchlist Status</SectionHeader>
            <div style={{
              padding: "16px",
              background: "var(--glass-bg)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1.5px solid var(--glass-border)",
              height: "280px",
              display: "flex",
              flexDirection: "column",
            }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data.statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    strokeWidth={0}
                  >
                    {data.statusData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={
                          STATUS_COLORS[entry.status]
                          ?? "#6b7280"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, n: any) => [
                      v, STATUS_LABELS[n] ?? n
                    ]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid var(--glass-border)",
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                justifyContent: "center",
              }}>
                {data.statusData.map(s => (
                  <div key={s.status} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}>
                    <div style={{
                      width: "8px", height: "8px",
                      background:
                        STATUS_COLORS[s.status] ?? "#6b7280",
                      borderRadius: "50%",
                    }} />
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "9px",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "hsl(var(--muted-foreground))",
                    }}>
                      {STATUS_LABELS[s.status] ?? s.status}
                      {" "}({s.count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Studio breakdown */}
      {data.studioData.length > 0 && (
        <div>
          <SectionHeader>Favourite Studios</SectionHeader>
          <div style={{
            padding: "16px",
            background: "var(--glass-bg)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1.5px solid var(--glass-border)",
            height: "200px",
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.studioData}
                layout="vertical"
                margin={{ left: 80, right: 20,
                          top: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 9,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="studio"
                  tick={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 9,
                    fill: "hsl(var(--muted-foreground))",
                    letterSpacing: "0.05em",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={75}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid var(--glass-border)",
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "11px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.8}
                  radius={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {data.recommendations.length > 0 && (
        <div>
          <SectionHeader>
            Recommended For You
          </SectionHeader>
          <div style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "12px",
          }}>
            {data.recommendations.map((rec, i) => (
              <div
                key={i}
                style={{
                  padding: "16px",
                  background: "var(--glass-bg)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1.5px solid var(--glass-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  transition: "all 0.15s",
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
                    color: "hsl(var(--primary))",
                    background: "hsl(var(--primary) / 0.1)",
                    padding: "2px 6px",
                  }}>
                    {rec.genre}
                  </span>
                  <Sparkles style={{
                    width: "12px", height: "12px",
                    color: "hsl(var(--primary))",
                    opacity: 0.6,
                  }} />
                </div>
                <p style={{
                  margin: 0,
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "15px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "hsl(var(--foreground))",
                }}>
                  {rec.title}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "hsl(var(--muted-foreground))",
                  lineHeight: 1.5,
                }}>
                  {rec.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}