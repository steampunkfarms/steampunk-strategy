# Working Spec: Cogworks Live Social Post Pull

**Handoff ID:** `20260307-cogworks-live-social-pull`
**Tier:** 2 (Human + CC, protocol required)
**Status:** COMPLETE
**Target repos:** steampunk-rescuebarn, steampunk-orchestrator

## Strategy Session Template

**What problem does this solve?**
No live pipeline pulls new FB/IG posts into Cogworks. Historical backfill is done (export parser), but new posts published directly on Facebook/Instagram don't appear in Cogworks without manual intervention.

**Why now?**
Historical backfill complete. The export parser built the species detection, Tiptap conversion, and draft creation infrastructure. The live pull just needs to feed the same pipeline via Graph API instead of static export files.

**What's the simplest version that delivers value?**
A daily cron endpoint in Rescue Barn that pulls recent FB Page posts and IG media via Graph API, converts them to Cogworks drafts using existing utilities, and inserts into sanctuary_posts.

**What are we explicitly NOT doing?**
- No new admin UI (existing Cogworks review queue handles drafts)
- No webhook/real-time push (daily cron is sufficient)
- No media from personal profiles (only Page and IG Business Account)

## Family Planning Protocol Gate

**Major Initiative Criteria Screen:**
- Affects 2+ sites? YES — Rescue Barn (endpoint + utilities) + Orchestrator (job registration), but minimal scope in each
- Changes core data flow or auth? NO — uses existing Graph API token pattern, existing Supabase service role key
- Impacts donor experience or compliance? NO — admin-only drafts
- Estimated effort > 8 handoffs? NO — single handoff

**Verdict:** NOT a Major Initiative. Standard Tier 2 execution.

## Risk & Reversibility

**Reversibility Score: 9/10**
- New cron endpoint and utility file only (no existing code modified beyond Orchestrator job registry addition)
- Cogworks drafts are non-public until manually published
- Rollback: delete the route + lib files, remove job registry entry

**Risk Level: LOW**
- All posts created as drafts (no public impact)
- Dedup prevents duplicate imports on re-runs
- Uses existing Graph API token (no new auth setup needed beyond env vars)
- 48-hour lookback window provides reliability overlap

## Cross-Site Impact Checklist

Repos touched:
- [x] Rescue Barn (new cron endpoint + import utility lib)
- [ ] Studiolo
- [ ] Postmaster
- [ ] Cleanpunk Shop
- [ ] TARDIS
- [x] Orchestrator (job registry entry)

Authentication implications: FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID env vars need to be added to Rescue Barn's Vercel env.
Data-flow consequences: None — writes to existing sanctuary_posts table.
Orchestrator / Cron impact: New daily job `rescuebarn/pull-social-posts` at 3 PM UTC.

## Sanity Deltas

1. **Endpoint lives in Rescue Barn, not Postmaster**: CChat's roadmap item said "steampunk-postmaster (API pull) + steampunk-rescuebarn (Cogworks ingest)". Moved entirely to Rescue Barn because it already has Supabase client, Vercel Blob, Anthropic SDK, and the import utilities. Adding these dependencies to Postmaster would have been unnecessary coupling. The Graph API token is the only new env var needed.

## Implementation Plan

### Part A: TypeScript Import Utilities
- `src/lib/cogworks-import.ts` — TypeScript port of `scripts/lib/cogworks-import-utils.mjs`
- Reuses `getServiceClient()` from `src/lib/admin/service-client.ts`
- Exports: textToTiptap, makeSlug, downloadMedia, uploadToBlob, classifySpecies, checkDuplicate, createCogworksPost

### Part B: Cron Endpoint
- `src/app/api/cron/pull-social-posts/route.ts`
- Auth: CRON_SECRET or INTERNAL_SECRET (same pattern as daily-maintenance)
- FB pull: `GET /{PAGE_ID}/feed?fields=id,message,full_picture,created_time,attachments{media,subattachments}&limit=25&since={48h_ago}`
- IG pull: resolve IG Business Account ID via `GET /{PAGE_ID}?fields=instagram_business_account`, then `GET /{IG_ACCOUNT_ID}/media?fields=id,caption,media_url,thumbnail_url,timestamp,media_type,children{media_url,media_type}&limit=25&since={48h_ago}`
- For each post: dedup check -> species classify -> Tiptap convert -> media upload to Blob -> insert as draft
- Returns JSON stats: `{ success, stats: { fb: {fetched, created, skipped}, ig: {fetched, created, skipped}, errors } }`

### Part C: Orchestrator Job Registration
- Added `rescuebarn/pull-social-posts` to `src/lib/job-registry.ts`
- Schedule: `0 15 * * *` (3 PM UTC daily)
- Criticality: standard
- Retries: 1

## Files Modified/Created

### steampunk-rescuebarn (2 new files)
1. `src/lib/cogworks-import.ts` — TypeScript import utilities (NEW)
2. `src/app/api/cron/pull-social-posts/route.ts` — Daily cron endpoint (NEW)

### steampunk-orchestrator (1 modified file)
3. `src/lib/job-registry.ts` — Added job entry

### steampunk-strategy (4 files)
4. `docs/handoffs/_working/20260307-cogworks-live-social-pull-working-spec.md` — This file
5. `docs/handoffs/20260307-cogworks-live-social-pull.md` — Handoff spec
6. `docs/roadmap.md` — Completion update
7. `docs/roadmap-archive.md` — Archive entry

## Structured Debrief

**Handoff ID:** `20260307-cogworks-live-social-pull`
**Tier:** 2
**Date:** 2026-03-07
**Status:** COMPLETE

### Claim -> Evidence Table

| Claim | Evidence |
|-------|----------|
| Cron endpoint exists | `src/app/api/cron/pull-social-posts/route.ts` in steampunk-rescuebarn |
| Auth follows existing pattern | CRON_SECRET/INTERNAL_SECRET dual-token check, same as daily-maintenance |
| FB posts pulled via Graph API | `fetchFBPosts()` calls `GET /{PAGE_ID}/feed` with attachments |
| IG media pulled via Graph API | `resolveIGAccountId()` + `fetchIGMedia()` with carousel support |
| 48-hour lookback window | `since = Math.floor((Date.now() - 48 * 60 * 60 * 1000) / 1000)` |
| Dedup by external_id | `checkDuplicate()` queries sanctuary_posts before insert |
| Species classification works | `classifySpecies()` — keyword match + Claude Haiku fallback |
| Tiptap conversion works | `textToTiptap()` — paragraph splitting, same as export parser |
| Media uploaded to Vercel Blob | `downloadMedia()` + `uploadToBlob()` in cogworks-import.ts |
| All posts created as drafts | `status: 'draft'` hardcoded in `createCogworksPost()` |
| Orchestrator job registered | `rescuebarn/pull-social-posts` in job-registry.ts, `0 15 * * *` |
| tsc --noEmit passes (rescuebarn) | Zero errors |
| tsc --noEmit passes (orchestrator) | Zero errors |

### Repos Modified

| Repo | Files Modified |
|------|---------------|
| steampunk-rescuebarn | 2 files (2 new) |
| steampunk-orchestrator | 1 file (1 modified) |
| steampunk-strategy | 4 files (3 new, 1 modified) |
| **Total** | **7 files** |

### Sanity Deltas Applied

1. Moved endpoint from Postmaster to Rescue Barn (simpler — Rescue Barn already has all dependencies)

### Deferred Items

- Env vars (FACEBOOK_ACCESS_TOKEN, FACEBOOK_PAGE_ID) need to be added to Rescue Barn's Vercel env
- Personal profile post import (Graph API restrictions — likely needs data export, not API)
- Engagement metrics pull (reaction/comment counts for existing Cogworks posts)

### Protocol Compliance

- [x] Working spec created
- [x] Handoff spec with acceptance criteria
- [x] Family Planning Protocol gate (NOT a Major Initiative)
- [x] Risk & Reversibility (9/10, LOW risk)
- [x] Cross-Site Impact Checklist
- [x] Verification script run
- [x] tsc --noEmit clean in all modified repos
- [x] Roadmap updated
- [x] Structured debrief produced
