# COG-4: Engagement-Driven Storm Automation

**Handoff ID:** `20260307-engagement-driven-storms`
**Date:** 2026-03-07
**Tier:** 3
**Status:** COMPLETE
**Repos:** steampunk-rescuebarn (primary), steampunk-postmaster (secondary)

## Summary

Added automated engagement-driven Storm triggering to the Cogworks system. A cron job monitors comment activity on Cogworks posts, detects spikes against configurable thresholds (set in COG-2's engagement controls), selects the best matching engagement anchor (AI framing idea), and triggers a mini-Storm via the existing pipeline. Postmaster's mini-Storm receiver now handles engagement context — generating social media content that celebrates the community conversation rather than just re-posting the original content.

## Changes

### steampunk-rescuebarn (9 files created/modified)

**Schema:**
- `supabase/migrations/011_engagement_anchors.sql` — Creates `engagement_anchors` table with 6 seed anchors, adds `processed_for_engagement` column to `post_comments` with partial index

**New API routes:**
- `src/app/api/admin/engagement-anchors/route.ts` — GET (list, optional active filter) + POST (create)
- `src/app/api/admin/engagement-anchors/[id]/route.ts` — PATCH (update) + DELETE
- `src/app/api/cron/engagement-monitor/route.ts` — Core engine: scans comments, groups by post, checks cooldown + daily cap, detects spikes against both threshold types, selects best anchor, triggers mini-Storm with enriched context, marks comments as processed

**New UI:**
- `src/app/admin/cogworks/engagement/anchors/page.tsx` — Server component, fetches anchors
- `src/app/admin/cogworks/engagement/anchors/anchors-client.tsx` — CRUD management page: list with expand/collapse, weight adjustment, active toggle, delete, add form with category/weight/prompt instruction

**Modified files:**
- `src/app/admin/cogworks/engagement/page.tsx` — Fetches anchor count + top anchors, passes to client
- `src/app/admin/cogworks/engagement/engagement-client.tsx` — Added anchors section with "Manage Anchors (N active)" link and anchor name pills
- `src/app/api/cogworks/mini-storm/route.ts` — Parses `triggerRef` for engagement spikes and includes `engagementContext` in Postmaster payload
- `vercel.json` — Added `/api/cron/engagement-monitor` cron (every 5 minutes)

### steampunk-postmaster (1 file modified)

- `app/api/storm/mini/route.ts` — Added `engagementContext` to `MiniStormPayload` interface. Builds engagement amplification prompt when trigger is engagement_spike: includes comment count, commenter count, anchor instruction, and community voices (first names only, paraphrased). Appended to Claude user message alongside existing context hints.

## Sanity Deltas Applied

1. **`createServiceClient` doesn't exist** — Spec used `createServiceClient`. Actual export is `getServiceClient()` from `@/lib/admin/service-client`. Fixed.
2. **Cron auth pattern** — Matched the existing `publish-scheduled` multi-token pattern (CRON_SECRET + INTERNAL_SECRET) instead of spec's Vercel cron header check.
3. **Admin API auth pattern** — Spec used explicit `is_admin` RPC calls. Existing admin routes rely on Supabase RLS policies (which enforce `is_admin(auth.uid())`). Matched existing pattern.
4. **Supabase untyped client** — Service client methods need `as any` casts for type compatibility with untyped tables. Matched existing patterns in mini-storm and publish-scheduled routes.

## Verification

- `npx tsc --noEmit` in steampunk-rescuebarn: 0 errors
- `npx tsc --noEmit` in steampunk-postmaster: 0 errors
- `npx eslint` on all modified files in both repos: 0 errors, 0 warnings

## Deferred / Manual Steps Required

1. **Migration 011** needs to be run in Rescue Barn Supabase dashboard
2. Sentiment analysis on comments (currently uses simple heuristics)
3. Learning loop: tracking which anchors produce the most engagement and auto-adjusting weights
4. Multi-post engagement patterns (detecting when several posts spike simultaneously)
5. Engagement reports/dashboard
