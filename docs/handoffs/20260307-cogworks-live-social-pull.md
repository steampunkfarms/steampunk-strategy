# Handoff: Cogworks Live Social Post Pull

**ID:** `20260307-cogworks-live-social-pull`
**Date:** 2026-03-07
**Tier:** 2
**Status:** COMPLETE
**Repos:** steampunk-rescuebarn, steampunk-orchestrator

## Summary

Built a daily cron endpoint in Rescue Barn that pulls recent Facebook Page posts and Instagram media via Graph API v24.0, classifies species, converts to Tiptap JSON, uploads media to Vercel Blob, and inserts into Cogworks sanctuary_posts as drafts. Registered in Orchestrator job registry for 3 PM UTC daily execution. Reuses existing import infrastructure from the export parser handoff.

## Acceptance Criteria

1. [x] Cron endpoint exists at `src/app/api/cron/pull-social-posts/route.ts` in steampunk-rescuebarn
2. [x] Auth uses CRON_SECRET/INTERNAL_SECRET dual-token check
3. [x] FB posts pulled via `GET /{PAGE_ID}/feed` with attachments
4. [x] IG media pulled via `GET /{IG_ACCOUNT_ID}/media` with carousel children
5. [x] IG Business Account resolved from Page ID
6. [x] 48-hour lookback window for reliability overlap
7. [x] Dedup by external_id (`fb-live-{id}`, `ig-live-{id}`)
8. [x] Species classification via keyword match + Claude Haiku fallback
9. [x] Tiptap JSON conversion for post body
10. [x] Media downloaded and uploaded to Vercel Blob
11. [x] All posts created as `status: 'draft'`
12. [x] TypeScript import utilities at `src/lib/cogworks-import.ts`
13. [x] Orchestrator job registered as `rescuebarn/pull-social-posts` at `0 15 * * *`
14. [x] `npx tsc --noEmit` passes in steampunk-rescuebarn
15. [x] `npx tsc --noEmit` passes in steampunk-orchestrator

## Verification

```
npx tsc --noEmit (rescuebarn) -> 0 errors
npx tsc --noEmit (orchestrator) -> 0 errors
```

## Deferred Items

- FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID env vars need to be added to Rescue Barn's Vercel env
- Personal profile post import (Graph API restrictions)
- Engagement metrics pull (reaction/comment counts for existing Cogworks posts)
