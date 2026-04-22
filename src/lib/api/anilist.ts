import { getCached, setCached } from "@/lib/redis";

const ANILIST_URL = "https://graphql.anilist.co";
const CACHE_TTL = 3600; // 1 hour

// ─── GraphQL query executor ───────────────────────────────
async function query<T>(
  gql: string,
  variables: Record<string, unknown> = {}
): Promise<T | null> {
  try {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gql, variables }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`AniList error: ${res.status}`);
    const json = await res.json();
    if (json.errors) {
      console.error("AniList GraphQL errors:", json.errors);
      return null;
    }
    return json.data as T;
  } catch (err) {
    console.error("AniList fetch failed:", err);
    return null;
  }
}

// ─── Types ────────────────────────────────────────────────
export interface AniListMedia {
  id: number;
  title: { english: string | null; romaji: string | null; native: string | null };
  type: "ANIME" | "MANGA";
  format: string | null;
  status: string | null;
  description: string | null;
  startDate: { year: number | null; month: number | null; day: number | null };
  endDate: { year: number | null; month: number | null; day: number | null };
  season: string | null;
  seasonYear: number | null;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  coverImage: { large: string | null; extraLarge: string | null; color: string | null };
  bannerImage: string | null;
  genres: string[];
  tags: Array<{ name: string; rank: number; isMediaSpoiler: boolean }>;
  studios: { nodes: Array<{ id: number; name: string; isAnimationStudio: boolean }> };
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  trending: number | null;
  favourites: number | null;
  nextAiringEpisode: { airingAt: number; timeUntilAiring: number; episode: number } | null;
  isAdult: boolean;
  siteUrl: string | null;
  idMal: number | null;
  trailer: { id: string; site: string } | null;
}

 // ─── Shared media fragment ────────────────────────────────
 const MEDIA_FRAGMENT = `
   id
   title { english romaji native }
   type format status
   description(asHtml: false)
   startDate { year month day }
   endDate { year month day }
   season seasonYear
   episodes chapters volumes
   coverImage { large extraLarge color }
   bannerImage
   genres
   tags { name rank isMediaSpoiler }
   studios { nodes { id name isAnimationStudio } }
   averageScore meanScore popularity trending favourites
   nextAiringEpisode { airingAt timeUntilAiring episode }
   isAdult siteUrl
   idMal
   trailer { id site }
   relations {
     edges {
       relationType
       node {
         id
         title { english romaji }
         type
         format
         startDate { year }
       }
     }
   }
 `;

// ─── Get trending anime ───────────────────────────────────
export async function getTrendingAnime(
  page = 1,
  perPage = 20
): Promise<AniListMedia[]> {
  const cacheKey = `anilist:trending:${page}:${perPage}`;
  const cached = await getCached<AniListMedia[]>(cacheKey);
  if (cached) return cached;

  const data = await query<{ Page: { media: AniListMedia[] } }>(
    `query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }`,
    { page, perPage }
  );

  const result = data?.Page?.media ?? [];
  if (result.length) await setCached(cacheKey, result, CACHE_TTL);
  return result;
}

// ─── Get current season anime ─────────────────────────────
export async function getCurrentSeasonAnime(
  page = 1,
  perPage = 20
): Promise<AniListMedia[]> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const season =
    month <= 3 ? "WINTER" :
    month <= 6 ? "SPRING" :
    month <= 9 ? "SUMMER" : "FALL";

  const cacheKey = `anilist:season:${season}:${year}:${page}`;
  const cached = await getCached<AniListMedia[]>(cacheKey);
  if (cached) return cached;

  const data = await query<{ Page: { media: AniListMedia[] } }>(
    `query ($season: MediaSeason, $year: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(
          season: $season
          seasonYear: $year
          type: ANIME
          sort: POPULARITY_DESC
          isAdult: false
        ) {
          ${MEDIA_FRAGMENT}
        }
      }
    }`,
    { season, year, page, perPage }
  );

  const result = data?.Page?.media ?? [];
  if (result.length) await setCached(cacheKey, result, CACHE_TTL);
  return result;
}

// ─── Search anime + manga ─────────────────────────────────
export async function searchAniList(
  search: string,
  type?: "ANIME" | "MANGA",
  perPage = 10
): Promise<AniListMedia[]> {
  if (!search.trim()) return [];

  const cacheKey = `anilist:search:${type ?? "all"}:${search}:${perPage}`;
  const cached = await getCached<AniListMedia[]>(cacheKey);
  if (cached) return cached;

  const data = await query<{ Page: { media: AniListMedia[] } }>(
    `query ($search: String, $type: MediaType, $perPage: Int) {
      Page(perPage: $perPage) {
        media(search: $search, type: $type, isAdult: false, sort: SEARCH_MATCH) {
          ${MEDIA_FRAGMENT}
        }
      }
    }`,
    { search, type, perPage }
  );

  const result = data?.Page?.media ?? [];
  if (result.length) await setCached(cacheKey, result, 600); // 10 min for searches
  return result;
}

// ─── Get series by AniList ID ─────────────────────────────
export async function getAniListById(
  id: number
): Promise<AniListMedia | null> {
  const cacheKey = `anilist:id:${id}`;
  const cached = await getCached<AniListMedia>(cacheKey);
  if (cached) return cached;

  const data = await query<{ Media: AniListMedia }>(
    `query ($id: Int) {
      Media(id: $id, isAdult: false) {
        ${MEDIA_FRAGMENT}
        relations {
          edges {
            relationType
            node {
              id
              title { english romaji }
              type
              format
              coverImage { large }
            }
          }
        }
      }
    }`,
    { id }
  );

  const result = data?.Media ?? null;
  if (result) await setCached(cacheKey, result, CACHE_TTL);
  return result;
}

// ─── Get top all-time anime ───────────────────────────────
export async function getTopAnime(
  page = 1,
  perPage = 50
): Promise<AniListMedia[]> {
  const cacheKey = `anilist:top:${page}:${perPage}`;
  const cached = await getCached<AniListMedia[]>(cacheKey);
  if (cached) return cached;

  const data = await query<{ Page: { media: AniListMedia[] } }>(
    `query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }`,
    { page, perPage }
  );

  const result = data?.Page?.media ?? [];
  if (result.length) await setCached(cacheKey, result, CACHE_TTL);
  return result;
}

// ─── Helper: get display title ────────────────────────────
export function getTitle(media: AniListMedia): string {
  return media.title.english ?? media.title.romaji ?? media.title.native ?? "Unknown";
}

// ─── Helper: get studio name ──────────────────────────────
export function getStudio(media: AniListMedia): string | null {
  return media.studios.nodes.find((s) => s.isAnimationStudio)?.name ?? null;
}

export function getBestCoverUrl(media: AniListMedia): string | null {
  return media.coverImage.extraLarge ?? media.coverImage.large ?? null;
}
