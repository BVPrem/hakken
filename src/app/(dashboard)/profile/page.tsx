import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { userSeries } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { UserButton } from "@clerk/nextjs";

const STATUS_LABELS: Record<string, string> = {
  watching: "Watching",
  completed: "Completed",
  plan_to_watch: "Plan to Watch",
  on_hold: "On Hold",
  dropped: "Dropped",
};

const STATUS_COLORS: Record<string, string> = {
  watching: "text-green-400",
  completed: "text-blue-400",
  plan_to_watch: "text-yellow-400",
  on_hold: "text-orange-400",
  dropped: "text-red-400",
};

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();

  const stats = await db
    .select({
      status: userSeries.status,
      count: sql<number>`count(*)`,
    })
    .from(userSeries)
    .where(eq(userSeries.userId, userId))
    .groupBy(userSeries.status);

  const totalTracked = stats.reduce((sum, s) => sum + Number(s.count), 0);

  const recent = await db
    .select()
    .from(userSeries)
    .where(eq(userSeries.userId, userId))
    .orderBy(userSeries.updatedAt)
    .limit(5);

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName ?? user?.username ?? "Anime Fan";

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-center gap-5">
        <UserButton
          appearance={{
            elements: { avatarBox: "w-16 h-16" },
          }}
        />
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {displayName}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {totalTracked} series tracked
          </p>
        </div>
      </div>

      {stats.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(STATUS_LABELS).map(([key, label]) => {
            const stat = stats.find((s) => s.status === key);
            const count = stat ? Number(stat.count) : 0;
            return (
              <div
                key={key}
                className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1 text-center"
              >
                <span className={`text-2xl font-heading font-bold ${STATUS_COLORS[key]}`}>
                  {count}
                </span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No series tracked yet.{" "}
            <a href="/search" className="text-primary hover:underline">
              Start exploring
            </a>
          </p>
        </div>
      )}

      {recent.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-heading font-semibold text-foreground">
            Recent Activity
          </h2>
          <div className="flex flex-col gap-2">
            {recent.map((entry) => (
              <div
                key={entry.seriesId}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <span className="text-sm text-foreground font-medium truncate max-w-xs">
                  {entry.seriesId.replace("anilist-", "Series ")}
                </span>
                <span className={`text-xs font-medium ${STATUS_COLORS[entry.status]}`}>
                  {STATUS_LABELS[entry.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}