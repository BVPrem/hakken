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
  console.log("Starting series seed...");

  const [trending, currentSeason, topAnime] = await Promise.all([
    getTrendingAnime(1, 25),
    getCurrentSeasonAnime(1, 25),
    getTopAnime(1, 50),
  ]);

  const seen = new Set<number>();
  const all: AniListMedia[] = [];

  for (const item of [...trending, ...currentSeason, ...topAnime]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      all.push(item);
    }
  }

  console.log(`   Fetched ${all.length} unique series from AniList`);

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
      console.log(
        `   Batch ${Math.floor(i / 10) + 1}: inserted ${batch.length}`
      );
    } catch (err) {
      console.error(`   Batch error:`, err);
      skipped += batch.length;
    }
  }

  console.log(`\nSeed complete!`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Skipped/errors: ${skipped}`);
  process.exit(0);
}

seedSeries().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
