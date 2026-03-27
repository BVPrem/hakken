# 発見 Hakken — Anime & Manga Intelligence Platform

> The intelligence layer the anime community never had.

## What is Hakken?

Hakken is a multi-user anime & manga intelligence platform
that aggregates real-time news, tracks community sentiment,
and delivers personalised recommendations powered by AI.

### Core Features
- 🔍 **Sentiment Pulse** — Episode-by-episode community
  mood tracker for airing shows
- 📰 **Personalised Feed** — News crawled from 10+ sources,
  filtered to your taste profile
- 🧠 **Taste DNA** — AI-generated visual profile of your
  genre preferences
- 👥 **Friend Matchmaker** — Find what you and friends
  should watch together
- 🤖 **Hakken AI** — Chat assistant with full context of
  your list and live news
- 📅 **Release Calendar** — Episode and chapter countdowns
  with AI recaps

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Next.js API Routes, Python crawler |
| Database | Neon (Postgres), Drizzle ORM |
| Cache | Upstash Redis |
| Vector DB | Pinecone (4096 dims, NV-Embed-v2) |
| AI | NVIDIA NIM API (Llama 3.1, Llama 3.3, DeepSeek R1) |
| Auth | Clerk (Google + Discord) |
| Infrastructure | AWS Lambda, AWS EventBridge, Vercel |

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in your keys
3. `npm install`
4. `npm run db:push` — apply schema to your Neon database
5. `npm run dev` — start development server

## Project Structure

```
src/
├── app/
│   ├── (auth)/        # Sign-in, sign-up pages
│   ├── (dashboard)/   # Protected app pages
│   └── api/           # Backend API routes
├── components/        # React UI components
├── lib/
│   ├── db/            # Neon + Drizzle ORM
│   ├── ai/            # NVIDIA API client
│   ├── api/           # AniList, Jikan, MangaDex clients
│   ├── redis.ts       # Upstash Redis client
│   └── pinecone.ts    # Pinecone vector DB client
├── crawler/           # Python RSS crawler service
└── types/             # Shared TypeScript types
```

## Status

Currently in active development — Phase 1 (Foundation)
complete. See project roadmap for upcoming phases.
