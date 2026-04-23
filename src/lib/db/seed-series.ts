import { db } from "./index";
import { series } from "./schema";
import { getTrendingAnime, getCurrentSeasonAnime, getTopAnime, getStudio, getBestCoverUrl } from "@/lib/api/anilist";
import type { AniListMedia } from "@/lib/api/anilist";

function mapAniListToSeries(media: AniListMedia) {
  const studio = getStudio(media);
  const nextEp = media.nextAiringEpisode;

  return {
    id: `anilist-${media.id}`,
    externalId: media.id,
    source: "anilist",
    type: (media.type === "ANIME" ? "anime" : "manga") as "anime" | "manga",
    titleEn: media.title.english,
    titleJa: media.title.native,
    titleRomaji: media.title.romaji,
    synopsis: media.description
      ?.replace(/<[^>]*>/g, "")
      .slice(0, 2000) ?? null,
    coverImage: getBestCoverUrl(media),
    bannerImage: media.bannerImage,
    genres: media.genres,
    tags: media.tags
      .filter((t) => !t.isMediaSpoiler)
      .slice(0, 10)
      .map((t) => t.name),
    studios: studio ? [studio] : [],
    status: media.status,
    episodeCount: media.episodes,
    chapterCount: media.chapters,
    averageScore: media.averageScore
      ? media.averageScore / 10
      : null,
    popularity: media.popularity,
    season: media.season,
    seasonYear: media.seasonYear,
    nextEpisodeAt: nextEp
      ? new Date(nextEp.airingAt * 1000)
      : null,
    isAdult: media.isAdult,
  };
}

async function seedSeries() {
  console.log("🌱 Starting expanded series seed...");

  // Fetch from multiple AniList sources in parallel
  // Page 1 + 2 of each category for more coverage
  const [
    trending1, trending2,
    season1,
    topAnime1, topAnime2, topAnime3,
    topManga1,
  ] = await Promise.all([
    getTrendingAnime(1, 50),
    getTrendingAnime(2, 50),
    getCurrentSeasonAnime(1, 50),
    getTopAnime(1, 50),
    getTopAnime(2, 50),
    getTopAnime(3, 50),
    // Manga top rated
    (async () => {
      const { searchAniList } = await import("./../../lib/api/anilist");
      // Get top manga separately via GraphQL
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            Page(page: 1, perPage: 50) {
              media(sort: SCORE_DESC, type: MANGA, isAdult: false) {
                id idMal type
                title { english romaji native }
                status description
                coverImage { extraLarge large }
                genres tags { name rank isMediaSpoiler }
                studios { nodes { id name isAnimationStudio } }
                averageScore popularity seasonYear
                chapters volumes isAdult
              }
            }
          }`,
        }),
      });
      const json = await res.json();
      return json.data?.Page?.media ?? [];
    })(),
  ]);

  // Deduplicate by AniList ID
  const seen = new Set<number>();
  const all: any[] = [];

  for (const item of [
    ...trending1, ...trending2,
    ...season1,
    ...topAnime1, ...topAnime2, ...topAnime3,
    ...topManga1,
  ]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      all.push(item);
    }
  }

  console.log(`   Fetched ${all.length} unique series`);

  // Insert in batches — use onConflictDoNothing
  // so existing series are preserved
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < all.length; i += 10) {
    const batch = all.slice(i, i + 10).map(mapAniListToSeries);
    try {
      await db
        .insert(series)
        .values(batch)
        .onConflictDoNothing();
      inserted += batch.length;
      console.log(`   Batch ${Math.floor(i/10)+1}: done`);
    } catch (err) {
      console.error(`   Batch error:`, err);
      skipped += batch.length;
    }
  }

  console.log(`\n✅ Seed complete!`);
  console.log(`   Total processed: ${all.length}`);
  console.log(`   Skipped/errors: ${skipped}`);

  // Verification summary
  try {
    const { sql } = await import("drizzle-orm");
    const count = await db.select({ count: sql<number>`COUNT(*)` }).from(series);
    console.log(`\n📊 Series in DB: ${count[0].count}`);

    const major = await db
      .select({ titleEn: series.titleEn, titleRomaji: series.titleRomaji })
      .from(series)
      .where(
        sql`LOWER(title_en) LIKE '%dragon ball%' 
            OR LOWER(title_en) LIKE '%naruto%'
            OR LOWER(title_en) LIKE '%bleach%'
            OR LOWER(title_en) LIKE '%one piece%'`
      );
    console.log("\n🔍 Major franchises found:");
    for (const s of major) {
      console.log(`   • ${s.titleEn ?? s.titleRomaji}`);
    }
  } catch (e) {
    console.warn("   (could not verify count — run manually if needed)");
  }

  process.exit(0);
}

seedSeries().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
