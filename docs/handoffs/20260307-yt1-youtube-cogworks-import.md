# YT-1: YouTube Transcript -> Cogworks Post Importer

**Handoff ID:** 20260307-yt1-youtube-cogworks-import
**Completed:** 2026-03-07
**Tier:** 3
**Repos:** steampunk-rescuebarn (6 new, 3 modified), steampunk-strategy (docs only)

## Summary

YouTube channel video importer that fetches videos via Data API v3, extracts auto-generated transcripts via youtubei.js, processes transcripts through Claude Sonnet (clean prose, species classification, excerpt, social caption, donor hook, SEO description), generates TipTap JSON bodies with embedded YouTube player, and inserts as draft Cogworks posts. Two interfaces: CLI bulk import script and admin UI page.

## What Was Built

### YouTube Library (`src/lib/youtube/`)
- `fetcher.ts` — YouTube Data API v3 channel video listing (paginated, max 1000) + transcript extraction via youtubei.js with youtube-transcript fallback
- `processor.ts` — Claude Sonnet transcript processor: cleans auto-captions into readable prose, classifies species, generates excerpt/tags/resident slugs/ai_caption/ai_donor_hook/ai_seo_description
- `tiptap-builder.ts` — Generates TipTap doc JSON with embedded YouTube video node + horizontal rule + "Transcript" heading + paragraph nodes

### Import Pipeline
- `scripts/youtube-import.ts` — CLI bulk import with `--dry-run`, `--limit N`, `--since YYYY-MM-DD` flags. Deduplicates via `external_id`, rate-limits Claude calls (2s between)
- `src/app/api/youtube/import/route.ts` — API route for on-demand import. Auth via INTERNAL_SECRET or admin session. Auto-detects last import date for incremental sync

### Admin UI
- `src/app/admin/youtube-import/page.tsx` — Import trigger page with limit input, loading state, success/error display, imported video list

### Modified Files
- `src/app/admin/layout.tsx` — Added YouTube Import nav link
- `.env.example` — Added YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID
- `package.json` — Added youtubei.js + youtube-transcript deps, youtube:import and youtube:import:dry scripts

## Sanity Deltas Applied
1. `createServiceClient()` -> `getServiceClient()` from `@/lib/admin/service-client`
2. Supabase typed client -> `as any` cast pattern for untyped column access
3. Admin UI styled with Rescue Barn design system (iron/barn colors) instead of generic shadcn

## No-Link/No-CTA Audit (Layer 4)
- `src/lib/youtube/processor.ts` — Claude prompt explicitly states "No links, no CTAs, no donation language" for ai_caption and ai_donor_hook fields
- `ai_donor_hook` is text-only (a sentence connecting video to impact, never a link)
- `ai_caption` prompt says "Under 280 characters" with no URL instruction
- TipTap body contains only video embed + transcript text — no injected links

## Verification
- `npx tsc --noEmit` — PASS (steampunk-rescuebarn, 0 errors)

## Deferred
- Automatic cron-based YouTube sync (Vercel cron schedule)
- YouTube video view count sync back to Cogworks
- YouTube comment import into Cogworks comment system
- Video chapter detection and section headers
- Multi-language transcript support
- Shorts vs. long-form differentiation
