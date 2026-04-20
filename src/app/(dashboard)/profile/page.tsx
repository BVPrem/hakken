import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { userSeries, series } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { UserButton } from "@clerk/nextjs";
import { WatchlistButton } from "@/components/series/watchlist-button";

const STATUS_LABELS: Record<string, string> = {
  watching:      "Watching",
  completed:     "Completed",
  plan_to_watch: "Plan to Watch",
  on_hold:       "On Hold",
  dropped:       "Dropped",
};

const STATUS_COLORS: Record<string, string> = {
  watching:      "#22c55e",
  completed:     "#3b82f6",
  plan_to_watch: "#f59e0b",
  on_hold:       "#f97316",
  dropped:       "#ef4444",
};

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();

  // Full watchlist with series data
  const watchlist = await db
    .select({
      seriesId: userSeries.seriesId,
      status: userSeries.status,
      score: userSeries.score,
      progress: userSeries.progress,
      updatedAt: userSeries.updatedAt,
      title: series.titleEn,
      titleRomaji: series.titleRomaji,
      coverImage: series.coverImage,
      type: series.type,
      episodeCount: series.episodeCount,
      genres: series.genres,
    })
    .from(userSeries)
    .leftJoin(series, eq(userSeries.seriesId, series.id))
    .where(eq(userSeries.userId, userId))
    .orderBy(desc(userSeries.updatedAt));

  // Stats by status
  const stats = Object.fromEntries(
    Object.keys(STATUS_LABELS).map(k => [
      k,
      watchlist.filter(w => w.status === k).length,
    ])
  );
  const totalTracked = watchlist.length;

  // Genre breakdown for radar
  const genreCount: Record<string, number> = {};
  watchlist.forEach(w => {
    (w.genres ?? []).forEach(g => {
      genreCount[g] = (genreCount[g] ?? 0) + 1;
    });
  });
  const topGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName ?? user?.username ?? "Anime Fan";

  const SectionHeader = ({ children }: {
    children: React.ReactNode
  }) => (
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
  );

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "36px",
      maxWidth: "900px",
    }}>

      {/* Profile header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "20px",
        padding: "24px",
        background: "var(--glass-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1.5px solid var(--glass-border)",
      }}>
        <UserButton appearance={{
          elements: { avatarBox: "w-16 h-16" },
        }} />
        <div>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "28px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "hsl(var(--foreground))",
            margin: 0, lineHeight: 1,
          }}>
            {displayName}
          </h1>
          <p style={{
            fontSize: "12px",
            color: "hsl(var(--muted-foreground))",
            margin: "4px 0 0",
          }}>
            {user?.primaryEmailAddress?.emailAddress}
          </p>
          <p style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "hsl(var(--primary))",
            margin: "6px 0 0",
          }}>
            {totalTracked} Series Tracked
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <SectionHeader>Stats</SectionHeader>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "10px",
          marginTop: "8px",
        }}>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div
              key={key}
              style={{
                padding: "16px",
                background: "var(--glass-bg)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1.5px solid var(--glass-border)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                textAlign: "center",
              }}
            >
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "28px",
                color: STATUS_COLORS[key],
                lineHeight: 1,
              }}>
                {stats[key] ?? 0}
              </span>
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "9px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "hsl(var(--muted-foreground))",
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Genre taste */}
      {topGenres.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <SectionHeader>Your Taste</SectionHeader>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "8px",
          }}>
            {topGenres.map(([genre, count]) => (
              <div
                key={genre}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  background: "hsl(var(--primary) / 0.08)",
                  border: "1px solid hsl(var(--primary) / 0.2)",
                }}
              >
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "hsl(var(--foreground))",
                }}>
                  {genre}
                </span>
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "10px",
                  color: "hsl(var(--primary))",
                }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watchlist */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <SectionHeader>
          Watchlist ({totalTracked})
        </SectionHeader>

        {totalTracked === 0 ? (
          <div style={{
            padding: "40px 20px",
            textAlign: "center",
            background: "var(--glass-bg)",
            border: "1.5px solid var(--glass-border)",
            marginTop: "8px",
          }}>
            <p style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "13px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "hsl(var(--muted-foreground))",
              margin: "0 0 8px",
            }}>
              Nothing tracked yet
            </p>
            <Link
              href="/search"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "11px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "hsl(var(--primary))",
                textDecoration: "none",
              }}
            >
              Explore Series →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", marginTop: "8px" }}>
            {watchlist.map((w) => (
              <div
                key={w.seriesId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  background: "var(--glass-bg)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid var(--glass-border)",
                  transition: "background 0.15s",
                }}
              >
                {/* Cover thumbnail */}
                <Link href={`/series/${w.seriesId}`}>
                  <div style={{
                    width: "36px", height: "54px",
                    flexShrink: 0, overflow: "hidden",
                    border: "1px solid var(--glass-border)",
                  }}>
                    {w.coverImage ? (
                      <Image
                        src={w.coverImage}
                        alt={w.title ?? ""}
                        width={36}
                        height={54}
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%",
                        background: "hsl(var(--muted))",
                      }} />
                    )}
                  </div>
                </Link>

                {/* Title + type */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link
                    href={`/series/${w.seriesId}`}
                    style={{ textDecoration: "none" }}
                  >
                    <p style={{
                      margin: 0,
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "13px",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "hsl(var(--foreground))",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {w.title ?? w.titleRomaji
                        ?? w.seriesId}
                    </p>
                  </Link>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "2px",
                  }}>
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "9px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "hsl(var(--muted-foreground))",
                    }}>
                      {w.type}
                    </span>
                    {w.episodeCount && (
                      <span style={{
                        fontSize: "9px",
                        color: "hsl(var(--muted-foreground))",
                      }}>
                        · {w.progress ?? 0}/
                        {w.episodeCount} ep
                      </span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "9px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: STATUS_COLORS[w.status],
                    background: `${STATUS_COLORS[w.status]}18`,
                    padding: "2px 8px",
                    border: `1px solid ${STATUS_COLORS[w.status]}40`,
                  }}>
                    {STATUS_LABELS[w.status]}
                  </span>
                  <WatchlistButton
                    seriesId={w.seriesId}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}