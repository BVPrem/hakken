import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  real,
  jsonb,
  pgEnum,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────

export const seriesTypeEnum = pgEnum("series_type", ["anime", "manga", "both"]);
export const watchStatusEnum = pgEnum("watch_status", [
  "watching",
  "completed",
  "plan_to_watch",
  "dropped",
  "on_hold",
]);
export const sentimentEnum = pgEnum("sentiment", [
  "positive",
  "negative",
  "neutral",
  "mixed",
]);
export const alertTypeEnum = pgEnum("alert_type", [
  "episode_release",
  "chapter_release",
  "sentiment_spike",
  "news_mention",
]);

// ─── Users ───────────────────────────────────────────────
// Synced from Clerk via webhook on signup

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  username: text("username").unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  tasteProfile: jsonb("taste_profile"), // AI-generated taste DNA object
  onboarded: boolean("onboarded").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Series ──────────────────────────────────────────────
// Anime and manga titles — sourced from AniList/Jikan/MangaDex

export const series = pgTable(
  "series",
  {
    id: text("id").primaryKey(), // e.g. "anilist-123" or "mangadex-456"
    externalId: integer("external_id"), // AniList ID or MangaDex UUID
    source: text("source").notNull(), // "anilist" | "mangadex" | "jikan"
    type: seriesTypeEnum("type").notNull(),
    titleEn: text("title_en"),
    titleJa: text("title_ja"),
    titleRomaji: text("title_romaji"),
    synopsis: text("synopsis"),
    coverImage: text("cover_image"),
    bannerImage: text("banner_image"),
    genres: text("genres").array(),
    tags: text("tags").array(), // Deep tags from AniList
    studios: text("studios").array(),
    status: text("status"), // "RELEASING" | "FINISHED" | "NOT_YET_RELEASED"
    episodeCount: integer("episode_count"),
    chapterCount: integer("chapter_count"),
    averageScore: real("average_score"),
    popularity: integer("popularity"),
    season: text("season"), // "WINTER" | "SPRING" | "SUMMER" | "FALL"
    seasonYear: integer("season_year"),
    nextEpisodeAt: timestamp("next_episode_at"),
    nextChapterAt: timestamp("next_chapter_at"),
    isAdult: boolean("is_adult").default(false),
    aiSummary: text("ai_summary"), // Claude-generated series brief
    embeddingUpdatedAt: timestamp("embedding_updated_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index("series_type_idx").on(table.type),
    statusIdx: index("series_status_idx").on(table.status),
    popularityIdx: index("series_popularity_idx").on(table.popularity),
  })
);

// ─── User Series (watchlist/readlist) ────────────────────

export const userSeries = pgTable(
  "user_series",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    seriesId: text("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    status: watchStatusEnum("status").notNull(),
    score: real("score"), // User's personal score 0-10
    progress: integer("progress").default(0), // Episodes watched or chapters read
    notes: text("notes"),
    isFavorite: boolean("is_favorite").default(false),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.seriesId] }),
    userIdx: index("user_series_user_idx").on(table.userId),
    statusIdx: index("user_series_status_idx").on(table.status),
  })
);

// ─── Articles ────────────────────────────────────────────
// Crawled from RSS feeds — the heart of the news pipeline

export const articles = pgTable(
  "articles",
  {
    id: text("id").primaryKey(), // MD5 hash of URL for dedup
    url: text("url").notNull().unique(),
    title: text("title").notNull(),
    content: text("content"),
    summary: text("summary"), // AI-generated 3-bullet summary
    source: text("source").notNull(), // "animenewsnetwork" | "reddit" | etc.
    sourceUrl: text("source_url"),
    author: text("author"),
    publishedAt: timestamp("published_at"),
    crawledAt: timestamp("crawled_at").defaultNow().notNull(),
    sentiment: sentimentEnum("sentiment"),
    sentimentScore: real("sentiment_score"), // -1.0 to 1.0
    tags: text("tags").array(), // AI-generated topic tags
    relatedSeriesIds: text("related_series_ids").array(),
    pineconeIndexed: boolean("pinecone_indexed").default(false),
    imageUrl: text("image_url"),
  },
  (table) => ({
    publishedIdx: index("articles_published_idx").on(table.publishedAt),
    sourceIdx: index("articles_source_idx").on(table.source),
    sentimentIdx: index("articles_sentiment_idx").on(table.sentiment),
  })
);

// ─── Series Sentiment Snapshots ──────────────────────────
// Episode/chapter-level sentiment — powers the pulse chart

export const sentimentSnapshots = pgTable(
  "sentiment_snapshots",
  {
    id: text("id").primaryKey(),
    seriesId: text("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    episodeNumber: integer("episode_number"),
    chapterNumber: integer("chapter_number"),
    snapshotDate: timestamp("snapshot_date").defaultNow().notNull(),
    positiveCount: integer("positive_count").default(0),
    negativeCount: integer("negative_count").default(0),
    neutralCount: integer("neutral_count").default(0),
    averageSentiment: real("average_sentiment"), // -1.0 to 1.0
    articleCount: integer("article_count").default(0),
    topKeywords: text("top_keywords").array(),
  },
  (table) => ({
    seriesIdx: index("sentiment_series_idx").on(table.seriesId),
    dateIdx: index("sentiment_date_idx").on(table.snapshotDate),
  })
);

// ─── Friendships ─────────────────────────────────────────

export const friendships = pgTable(
  "friendships",
  {
    requesterId: text("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // "pending" | "accepted" | "blocked"
    compatibilityScore: real("compatibility_score"), // 0-100
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.requesterId, table.addresseeId] }),
    requesterIdx: index("friendships_requester_idx").on(table.requesterId),
    addresseeIdx: index("friendships_addressee_idx").on(table.addresseeId),
  })
);

// ─── Alerts ──────────────────────────────────────────────

export const alerts = pgTable(
  "alerts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    seriesId: text("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    type: alertTypeEnum("type").notNull(),
    threshold: real("threshold"), // For sentiment_spike: trigger if score drops below this
    isActive: boolean("is_active").default(true),
    lastTriggeredAt: timestamp("last_triggered_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("alerts_user_idx").on(table.userId),
  })
);

// ─── Crawler Runs ────────────────────────────────────────
// Audit log of every crawler execution

export const crawlerRuns = pgTable("crawler_runs", {
  id: text("id").primaryKey(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  feedsProcessed: integer("feeds_processed").default(0),
  articlesFound: integer("articles_found").default(0),
  articlesNew: integer("articles_new").default(0),
  articlesDuplicate: integer("articles_duplicate").default(0),
  errors: jsonb("errors"), // Array of error objects
  status: text("status").notNull().default("running"), // "running" | "completed" | "failed"
});

// ─── Type exports ────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Series = typeof series.$inferSelect;
export type NewSeries = typeof series.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type UserSeries = typeof userSeries.$inferSelect;
export type NewUserSeries = typeof userSeries.$inferInsert;
export type SentimentSnapshot = typeof sentimentSnapshots.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type CrawlerRun = typeof crawlerRuns.$inferSelect;
