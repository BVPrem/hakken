// ============================================
// HAKKEN - TypeScript Type Definitions
// ============================================

// --------------------------------------------
// User Types
// --------------------------------------------

export interface User {
  id: string;
  clerkId: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: "dark" | "light";
  notifications: boolean;
  emailDigest: "daily" | "weekly" | "none";
}

export interface TasteProfile {
  userId: string;
  favoriteGenres: string[];
  dislikedGenres: string[];
  preferredMediaTypes: ("anime" | "manga")[];
  ratingDistribution: {
    averageRating: number;
    countByScore: Record<number, number>;
  };
  tags: string[];
  updatedAt: Date;
}

// --------------------------------------------
// Series Types (Anime/Manga)
// --------------------------------------------

export type MediaType = "anime" | "manga";

export type MediaStatus = 
  | "airing"
  | "finished"
  | "upcoming"
  | "cancelled";

export type MediaFormat = 
  | "tv"
  | "tv_short"
  | "movie"
  | "special"
  | "ova"
  | "ona"
  | "music"
  | "manga"
  | "novel"
  | "one_shot";

export interface Series {
  id: string;
  malId: number;
  anilistId?: number;
  mangadexId?: string;
  title: string;
  titleEnglish?: string;
  titleJapanese?: string;
  description: string;
  type: MediaType;
  format: MediaFormat;
  status: MediaStatus;
  coverImage: string;
  bannerImage?: string;
  trailerUrl?: string;
  startDate: string;
  endDate?: string;
  season?: "winter" | "spring" | "summer" | "fall";
  seasonYear?: number;
  episodes?: number;
  duration?: number;
  chapters?: number;
  volumes?: number;
  score?: number;
  popularity?: number;
  studios: string[];
  producers: string[];
  genres: string[];
  themes: string[];
  demographics: string[];
  source?: string;
  rating?: string;
  synonyms: string[];
  updatedAt: Date;
  createdAt: Date;
}

export interface SeriesRelation {
  id: string;
  seriesId: string;
  relatedSeriesId: string;
  relationType: "prequel" | "sequel" | "spin_off" | "alternative" | "side_story" | "adaptation";
}

// --------------------------------------------
// User Series Tracking
// --------------------------------------------

export type TrackingStatus = 
  | "watching"
  | "reading"
  | "completed"
  | "on_hold"
  | "dropped"
  | "plan_to_watch"
  | "plan_to_read";

export interface UserSeries {
  id: string;
  userId: string;
  seriesId: string;
  series: Series;
  status: TrackingStatus;
  progress: number;
  maxProgress: number;
  score?: number;
  startedAt?: Date;
  finishedAt?: Date;
  notes?: string;
  isPrivate: boolean;
  updatedAt: Date;
  createdAt: Date;
}

export interface UserSeriesUpdate {
  status?: TrackingStatus;
  progress?: number;
  score?: number;
  notes?: string;
  isPrivate?: boolean;
}

// --------------------------------------------
// Review Types
// --------------------------------------------

export interface Review {
  id: string;
  userId: string;
  seriesId: string;
  series: Series;
  user: User;
  score: number;
  title?: string;
  body: string;
  tags: string[];
  likes: number;
  isSpoiler: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewComment {
  id: string;
  reviewId: string;
  userId: string;
  user: User;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

// --------------------------------------------
// Feed & News Types
// --------------------------------------------

export interface NewsArticle {
  id: string;
  source: string;
  sourceUrl: string;
  title: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  author?: string;
  publishedAt: Date;
  fetchedAt: Date;
  tags: string[];
  series?: Series;
  embedding?: number[];
}

export interface FeedItem {
  id: string;
  type: "news" | "review" | "user_update" | "list_update";
  actor: User;
  series?: Series;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface UserActivity {
  id: string;
  userId: string;
  type: "started" | "completed" | "dropped" | "updated" | "reviewed" | "listed";
  seriesId: string;
  series: Series;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// --------------------------------------------
// Friend System Types
// --------------------------------------------

export interface Friendship {
  id: string;
  requesterId: string;
  requester: User;
  addresseeId: string;
  addressee: User;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendMatch {
  userId: string;
  user: User;
  matchScore: number;
  commonSeries: Series[];
  compatibleGenres: string[];
  incompatibleGenres: string[];
}

// --------------------------------------------
// AI & Recommendation Types
// --------------------------------------------

export interface Recommendation {
  id: string;
  userId: string;
  series: Series;
  score: number;
  reason: string;
  sourceSeries?: Series[];
  generatedAt: Date;
}

export interface AIRecommendationRequest {
  userId: string;
  preferences?: {
    genres?: string[];
    excludeGenres?: string[];
    formats?: MediaFormat[];
    yearRange?: { start: number; end: number };
  };
  context?: string;
}

export interface TasteAnalysis {
  userId: string;
  strengths: string[];
  weaknesses: string[];
  patterns: string[];
  recommendations: string[];
  generatedAt: Date;
}

// --------------------------------------------
// Search Types
// --------------------------------------------

export interface SearchFilters {
  type?: MediaType;
  format?: MediaFormat;
  status?: MediaStatus;
  genres?: string[];
  excludeGenres?: string[];
  yearStart?: number;
  yearEnd?: number;
  scoreMin?: number;
  scoreMax?: number;
  sortBy?: "score" | "popularity" | "start_date" | "updated_at" | "title";
  sortOrder?: "asc" | "desc";
}

export interface SearchResult {
  series: Series;
  relevanceScore: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// --------------------------------------------
// Chart & Analytics Types
// --------------------------------------------

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface GenreDistribution {
  genre: string;
  count: number;
  percentage: number;
}

export interface SentimentData {
  positive: number;
  negative: number;
  neutral: number;
}

// --------------------------------------------
// API Response Types
// --------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

// --------------------------------------------
// Webhook Types
// --------------------------------------------

export interface ClerkWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

// --------------------------------------------
// Utility Types
// --------------------------------------------

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = {
  [K in Keys]: Required<Pick<T, K>> & Partial<Omit<T, K>>;
}[Keys];
