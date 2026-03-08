# COG-3: Postmaster -> Cogworks Reverse Feed

**Handoff ID:** `20260307-postmaster-cogworks-reverse-feed`
**Date:** 2026-03-07
**Tier:** 3
**Status:** COMPLETE
**Repos:** steampunk-postmaster (primary), steampunk-rescuebarn (secondary)

## Summary

Added COGWORKS as the 8th platform target in Postmaster's Content Storm system. When Fred enables Cogworks for a Storm, Postmaster generates a full-length HTML blog post (separate Claude call via shared helper) and dispatches it to Rescue Barn's Cogworks CMS as a draft via cross-site API. Storm origin tracking enables dedup — when Fred publishes a Postmaster-originated post with mini-Storm, platforms already covered by the originating Storm are automatically skipped.

## Changes

### steampunk-postmaster (14 files modified/created)

**Schema:**
- `prisma/schema.prisma` — Added `COGWORKS` to `enum Platform`, added `metadata Json?` field to `model Rendition`

**New files:**
- `lib/cogworks-generation.ts` — Shared helper: two Claude calls (blog post generation + metadata extraction). Returns `CogworksGenerationResult` with HTML content and `CogworksMetadata` (title, excerpt, speciesGroups)
- `lib/cogworks-dispatch.ts` — Cross-site dispatch: POSTs rendition content to Rescue Barn `/api/cogworks/external-post` with INTERNAL_SECRET Bearer auth. Queries already-posted platforms for dedup tracking

**Generation routes (7 files):**
- `app/api/generate/moostik/route.ts` — COGWORKS in PLATFORMS array, blog generation in anchor loop with `continue`
- `app/api/generate/wisdom-margins/route.ts` — Same pattern, skip in lesson angle and Harold's Margin loops
- `app/api/generate/wishlist-wednesday/route.ts` — Same pattern, skip in WISHLIST_ITEM/LIST_SPOTLIGHT/WISHLIST_IMPACT/LIST_DIRECTORY loops
- `app/api/generate/wishlist-gratitude/route.ts` — Blog generation only for GRATITUDE_ANCHOR role
- `app/api/generate/chances-ante/route.ts` — Per-platform early return for COGWORKS
- `app/api/generate/chances-ante/victory/route.ts` — Filters COGWORKS from generation prompt, generates blog from debrief content
- `app/api/generate/dear-humans/route.ts` — Per-platform early return for COGWORKS

**Supporting route updates (4 files):**
- `app/api/generate/chances-ante/shared.ts` — COGWORKS in PLATFORM_CONFIG
- `app/api/generate/moostik/preview/route.ts` — COGWORKS in PLATFORMS Record
- `app/api/generate/moostik/regenerate/route.ts` — COGWORKS in PLATFORM_CONFIG
- `lib/claude/prompts/dear-humans.ts` — COGWORKS in DEAR_HUMANS_PLATFORMS

**Cron dispatcher:**
- `app/api/cron/post-scheduled/route.ts` — `case 'COGWORKS'` dispatches via `dispatchToCogworks()`

**UI:**
- `app/(protected)/inputs/new/page.tsx` — COGWORKS toggle in platform table, shows "Full blog post (draft for review)" instead of content type radios
- `app/(protected)/queue/page.tsx` — COGWORKS in PLATFORM_LABELS

**Config:**
- `.env.example` — Added `RESCUEBARN_URL` under new "Cross-site" section

### steampunk-rescuebarn (5 files modified/created)

**New files:**
- `src/app/api/cogworks/external-post/route.ts` — POST handler for receiving blog posts from Postmaster. INTERNAL_SECRET Bearer auth with `timingSafeEqual`. Creates sanctuary_posts record with status='draft', storm_origin_id, storm_origin_platforms, source='postmaster_storm'
- `supabase/migrations/010_storm_origin_tracking.sql` — Adds `storm_origin_id text`, `storm_origin_platforms text[]`, `source text` columns + index

**Modified files:**
- `src/app/api/cogworks/mini-storm/route.ts` — Dedup: filters out platforms already in storm_origin_platforms before dispatching to Postmaster
- `src/lib/cogworks/types.ts` — Added `storm_origin_id` and `storm_origin_platforms` to SanctuaryPost interface
- `src/components/cogworks/PostEditor.tsx` — Purple banner showing storm origin + already-posted platforms for Postmaster-originated posts
- `src/app/admin/cogworks/review-queue-client.tsx` — "Storm" badge on Postmaster-originated posts in review queue

## Sanity Deltas Applied

1. **Platform is enum, not String** — Spec stated Rendition.platform was String. Actually `enum Platform` in Prisma. Added `COGWORKS` to the enum instead.
2. **No metadata field on Rendition** — Added `metadata Json?` to Rendition model for Cogworks title/excerpt/speciesGroups storage.
3. **Generation routes have varying shapes** — Each route has its own PLATFORMS constant format. Adapted COGWORKS insertion to each route's pattern rather than a uniform approach.
4. **`DH_ANCHOR` doesn't exist** — FragmentRole enum has `ANCHOR`, not `DH_ANCHOR`. Fixed to use `f.role === 'ANCHOR'`.
5. **Service client pattern** — Rescue Barn uses `getServiceClient()` not `createServiceClient`.

## Verification

- `npx tsc --noEmit` in steampunk-postmaster: 0 errors
- `npx tsc --noEmit` in steampunk-rescuebarn: 0 errors
- `npx eslint` in steampunk-postmaster: 0 errors (31 pre-existing warnings)
- `npx eslint` in steampunk-rescuebarn: 0 errors (2 pre-existing warnings)

## Deferred / Manual Steps Required

1. **`prisma db push`** needed in steampunk-postmaster to apply COGWORKS enum + metadata field to Neon
2. **Migration 010** needs to be run in Rescue Barn Supabase dashboard
3. **`RESCUEBARN_URL`** env var must be set in Postmaster's Vercel environment
4. **`INTERNAL_SECRET`** must match between Postmaster and Rescue Barn Vercel environments
