import { Pinecone } from "@pinecone-database/pinecone";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "pcsk_MJVsP_Dr8scrWoBRf1nFffjwqhviavW2jLyqbRqfkvZJ79AMrpontukGEnQpkGGN8y8CX";
const INDEX_NAME = process.env.PINECONE_INDEX_NAME ?? "hakken-articles";

const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

// Use type assertion for older API compatibility
export const index = pinecone.index(INDEX_NAME) as unknown as { describeIndexStats: () => Promise<{ dimension: number; totalRecordCount: number }>; query: (opts: unknown) => Promise<{ matches: unknown[] }>; upsert: (records: unknown[]) => Promise<void>; deleteOne: (id: string) => Promise<void> };

// ─── Helper: Upsert article vector ───────────────────────
export async function upsertVector(
  id: string,
  values: number[],
  metadata: {
    title: string;
    source: string;
    url: string;
    publishedAt: string;
    sentiment?: string;
    tags?: string[];
    seriesIds?: string[];
  }
) {
  await index.upsert([{ id, values, metadata }]);
}

// ─── Helper: Semantic search ─────────────────────────────
export async function semanticSearch(
  queryVector: number[],
  topK: number = 10,
  filter?: Record<string, string>
) {
  const results = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
    filter,
  });
  return results.matches;
}

// ─── Helper: Delete vector ───────────────────────────────
export async function deleteVector(id: string) {
  await index.deleteOne(id);
}
