import { getCached, setCached } from "@/lib/redis";

const JIKAN = "https://api.jikan.moe/v4";

async function jikan<T>(
  path: string,
  ttl = 86400
): Promise<T | null> {
  const key = `jikan-enrich:${path}`;
  const cached = await getCached<T>(key);
  if (cached) return cached;

  try {
    await new Promise(r => setTimeout(r, 400));
    const res = await fetch(`${JIKAN}${path}`, {
      next: { revalidate: ttl },
    });
    if (res.status === 429) return null;
    if (!res.ok) return null;
    const json = await res.json();
    const data = json.data ?? json;
    await setCached(key, data, ttl);
    return data as T;
  } catch {
    return null;
  }
}

export interface JikanEpisode {
  mal_id: number;
  title: string;
  title_japanese: string | null;
  aired: string | null;
  filler: boolean;
  recap: boolean;
  score: number | null;
}

export interface JikanCharacter {
  character: {
    mal_id: number;
    name: string;
    images: { jpg: { image_url: string } };
  };
  role: string;
  favorites: number;
  voice_actors: Array<{
    person: { name: string };
    language: string;
  }>;
}

export async function getEpisodes(
  malId: number,
  page = 1
): Promise<JikanEpisode[]> {
  const data = await jikan<JikanEpisode[]>(
    `/anime/${malId}/episodes?page=${page}`,
    604800
  );
  return data ?? [];
}

export async function getCharacters(
  malId: number
): Promise<JikanCharacter[]> {
  const data = await jikan<JikanCharacter[]>(
    `/anime/${malId}/characters`,
    604800
  );
  return data ?? [];
}

export async function getAnimeStats(malId: number) {
  return jikan<{
    watching: number;
    completed: number;
    dropped: number;
    total: number;
    scores: Array<{ score: number; votes: number; percentage: number }>;
  }>(`/anime/${malId}/statistics`, 3600);
}

export async function getAnimeRelations(malId: number) {
  return jikan<Array<{
    relation: string;
    entry: Array<{
      mal_id: number;
      type: string;
      name: string;
      url: string;
    }>;
  }>>(`/anime/${malId}/relations`, 604800);
}

export async function getFullEnrichment(malId: number) {
  const [episodes, characters, stats, relations] =
    await Promise.all([
      getEpisodes(malId),
      getCharacters(malId),
      getAnimeStats(malId),
      getAnimeRelations(malId),
    ]);

  const fillerEpisodes = episodes
    .filter(e => e.filler)
    .map(e => e.mal_id);

  const recapEpisodes = episodes
    .filter(e => e.recap)
    .map(e => e.mal_id);

  const topCharacters = characters
    .sort((a, b) => b.favorites - a.favorites)
    .slice(0, 5)
    .map(c => ({
      name: c.character.name,
      role: c.role,
      favorites: c.favorites,
    }));

  return {
    fillerEpisodes,
    recapEpisodes,
    totalEpisodesFetched: episodes.length,
    topCharacters,
    stats,
    relations,
  };
}