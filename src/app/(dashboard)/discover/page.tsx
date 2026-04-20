import { db } from "@/lib/db";
import { series } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { SeriesCard } from "@/components/series/series-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function getSeries(sort: "popular" | "season" | "top") {
  if (sort === "popular") {
    return db
      .select()
      .from(series)
      .orderBy(desc(series.popularity))
      .limit(24);
  }
  if (sort === "season") {
    return db
      .select()
      .from(series)
      .where(eq(series.status, "RELEASING"))
      .orderBy(desc(series.popularity))
      .limit(24);
  }
  return db
    .select()
    .from(series)
    .orderBy(desc(series.averageScore))
    .limit(24);
}

export default async function DiscoverPage() {
  const [popular, airing, top] = await Promise.all([
    getSeries("popular"),
    getSeries("season"),
    getSeries("top"),
  ]);

  return (
    <div className="flex flex-col gap-8 md:gap-10 halftone min-h-screen pb-8">
      <div className="chapter-marker space-y-2">
        <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">
          Discover
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Explore anime and manga across every category
        </p>
      </div>

      <Tabs defaultValue="popular">
        <TabsList className="bg-card border border-border p-1 gap-1">
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="airing">Airing Now</TabsTrigger>
          <TabsTrigger value="top">Top Rated</TabsTrigger>
        </TabsList>

        {[
          { value: "popular", data: popular },
          { value: "airing", data: airing },
          { value: "top", data: top },
        ].map(({ value, data }) => (
          <TabsContent key={value} value={value} className="mt-8 md:mt-10">
            {data.length > 0 ? (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4
                  lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 md:gap-6"
              >
                {data.map((s, i) => (
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
            ) : (
              <p className="text-muted-foreground text-center py-12">
                No series found in this category yet.
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}