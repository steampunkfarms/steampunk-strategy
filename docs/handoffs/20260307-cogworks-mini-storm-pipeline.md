# Handoff: COG-2 Mini-Storm Pipeline + Engagement Controls

**ID:** `20260307-cogworks-mini-storm-pipeline`
**Date:** 2026-03-07
**Tier:** 3
**Status:** COMPLETE
**Repos:** steampunk-rescuebarn, steampunk-postmaster

## Summary

Wired the Cogworks -> Postmaster mini-Storm pipeline for cross-site social media distribution. When a Cogworks post is published with `mini_storm_requested = true`, Rescue Barn calls Postmaster's `/api/storm/mini` endpoint. Postmaster generates platform-specific content via Claude Sonnet and posts directly to Facebook, Instagram, and X via their respective APIs. Added admin engagement controls page with configurable thresholds (for future COG-4 auto-triggering), comment spotlight-to-storm functionality, mini-storm activity log, and a scheduled post auto-publish cron running every 5 minutes.

## Working Spec

`docs/handoffs/_working/20260307-cogworks-mini-storm-pipeline-working-spec.md`

## Sanity Deltas Applied

1. **`is_admin` RPC parameter**: Spec used `{ uid }` but actual function signature is `is_admin(check_user_id UUID)`. API routes use user session auth instead of explicit is_admin RPC (RLS handles authorization).
2. **Service client**: Spec used `createServiceClient` but actual export is `getServiceClient()` from `@/lib/admin/service-client`.
3. **Admin nav has no icons**: Spec suggested Zap icon but nav uses simple `{ title, href }` objects. Added plain text link.
4. **Comments not in review queue**: Spec wanted spotlight buttons in review queue. Comments weren't rendered there. Built spotlight functionality in dedicated engagement page instead (Section 2: Recent Comments).
5. **Postmaster model mismatch**: Spec used `ContentInput` model but actual is `PostmasterInput` with required `series` enum. Skipped creating PM records — mini-storm receiver posts directly to platform APIs. Tracking done in Rescue Barn's `mini_storm_log` table.
6. **Posting routes have no auth**: Spec had receiver calling internal posting routes via fetch, but those are behind NextAuth middleware. Implemented direct platform API calls in the receiver instead.
7. **Instagram requires imageUrl**: Posts without `hero_image_url` skip Instagram with status `'skipped'`.
8. **Migration naming**: Used `009_` (sequential, matching codebase convention).
9. **Untyped service client**: `getServiceClient()` returns untyped Supabase client (no generated types for new tables). Used `as any` casts with eslint-disable comments for `mini_storm_log` inserts and `sanctuary_posts` updates.

## Files Modified/Created

### steampunk-rescuebarn (10 files)

| File | Action |
|------|--------|
| `supabase/migrations/009_engagement_config.sql` | Created — app_config, mini_storm_log tables, post_comments spotlight columns |
| `src/app/api/cogworks/mini-storm/route.ts` | Created — cross-site Storm trigger (Rescue Barn -> Postmaster) |
| `src/app/api/cogworks/spotlight/route.ts` | Created — comment spotlight-to-storm endpoint |
| `src/app/api/admin/config/route.ts` | Created — admin config read/write API |
| `src/app/api/cron/publish-scheduled/route.ts` | Created — scheduled post auto-publisher with Storm trigger |
| `src/app/admin/cogworks/engagement/page.tsx` | Created — server page for engagement controls |
| `src/app/admin/cogworks/engagement/engagement-client.tsx` | Created — client component with threshold config, comments, storm log |
| `src/app/admin/layout.tsx` | Modified — added Engagement link to admin nav |
| `src/app/admin/cogworks/new/page.tsx` | Modified — added mini-Storm trigger on publish |
| `src/app/admin/cogworks/[id]/edit/edit-client.tsx` | Modified — added mini-Storm trigger on publish |
| `vercel.json` | Modified — added publish-scheduled cron (every 5 min) |
| `.env.example` | Modified — added INTERNAL_SECRET, POSTMASTER_URL |

### steampunk-postmaster (1 file)

| File | Action |
|------|--------|
| `app/api/storm/mini/route.ts` | Created — mini-Storm receiver with Claude content generation and direct platform posting |

**12 files** across 2 repos.

## Acceptance Criteria

### Rescue Barn
1. [x] `app_config` table created with `engagement_thresholds` seed data
2. [x] `mini_storm_log` table created with indexes
3. [x] `post_comments` has `spotlighted` and `spotlighted_at` columns
4. [x] `POST /api/cogworks/mini-storm` sends post content to Postmaster and logs results
5. [x] `POST /api/cogworks/spotlight` sends a single comment for mini-Storm treatment
6. [x] `GET/PUT /api/admin/config` reads/writes `app_config`
7. [x] `/admin/cogworks/engagement` page shows threshold controls, saves to `app_config`
8. [x] `/admin/cogworks/engagement` page shows recent comments with spotlight buttons
9. [x] `/admin/cogworks/engagement` page shows mini-storm activity log
10. [x] Spotlight button shows confirmation dialog, fires, shows result
11. [x] Spotlighted comments show badge with date
12. [x] Publish flow fires mini-Storm when `miniStormRequested` is true (non-blocking, fire-and-forget)
13. [x] Scheduled post cron at `/api/cron/publish-scheduled` publishes due posts and fires their mini-Storms
14. [x] `vercel.json` has cron configured for every 5 minutes
15. [x] Admin sidebar nav has "Engagement" link
16. [x] `INTERNAL_SECRET` and `POSTMASTER_URL` in `.env.example`

### Postmaster
17. [x] `POST /api/storm/mini` accepts cross-site content via `INTERNAL_SECRET` Bearer auth
18. [x] Timing-safe comparison on the auth token (via `safeCompare`)
19. [x] Generates platform-specific content via Claude Sonnet for each target platform
20. [x] Posts directly to Facebook, Instagram, X via Graph API / twitter-api-v2
21. [x] Spotlight comment context woven into generated content (first name only)
22. [x] Skips Instagram when no hero image available
23. [x] Returns per-platform status to caller

### Both repos
24. [x] `npx tsc --noEmit` passes with zero errors in steampunk-rescuebarn
25. [x] `npx tsc --noEmit` passes with zero errors in steampunk-postmaster
26. [x] `npx eslint` passes on all modified files in both repos

## Verification

```
npx tsc --noEmit (rescuebarn) -> 0 errors
npx tsc --noEmit (postmaster) -> 0 errors
npx eslint (all modified files, both repos) -> 0 errors
```

## GenAI Workflow Insertion Audit

This handoff includes AI content generation in `app/api/storm/mini/route.ts` (Postmaster). Audit of prompt layers:

| Insertion Point | File | No CTA/Link? |
|----------------|------|-------------|
| Facebook prompt | `app/api/storm/mini/route.ts:44` | PASS — "NEVER include calls-to-action, donation asks, or 'click here' language" |
| Instagram prompt | `app/api/storm/mini/route.ts:45` | PASS — "NEVER include calls-to-action or donation asks" |
| X prompt | `app/api/storm/mini/route.ts:46` | PASS — "NEVER include calls-to-action or donation asks" |
| System prompt | `app/api/storm/mini/route.ts:50` | PASS — "NEVER use calls-to-action, donation asks, guilt language, urgency language" |
| Spotlight addition | `app/api/storm/mini/route.ts:48` | PASS — only weaves in commenter first name, no CTA |

All 5 insertion points explicitly prohibit CTAs/links/donation language. PASS.

## Deferred Items

- Supabase migration 009 needs to be run before new tables are available
- INTERNAL_SECRET env var must be set in both Rescue Barn and Postmaster Vercel environments (must match)
- POSTMASTER_URL env var must be set in Rescue Barn Vercel environment
- COG-3: Postmaster -> Cogworks reverse feed
- COG-4: Engagement-driven Storm automation (auto-trigger using COG-2 thresholds — thresholds stored now, detection cron is COG-4)
- YouTube video upload via Data API
- TikTok / Patreon posting
