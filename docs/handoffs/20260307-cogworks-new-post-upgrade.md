# Handoff: COG-1 Cogworks New Post Upgrade

**ID:** `20260307-cogworks-new-post-upgrade`
**Date:** 2026-03-07
**Tier:** 3
**Status:** COMPLETE
**Repos:** steampunk-rescuebarn

## Summary

Upgraded the Cogworks CMS post editor with Gen AI content composition (Claude Sonnet), Postmaster-grade TipTap editor (24 extensions), multi-species selection, platform targeting, YouTube copy-paste generation, scheduling UI, and mini-Storm opt-in toggle. Rewrote PostEditor.tsx from 642 to ~970 lines. Updated PostCard, post-view, and review-queue-client for multi-species badge rendering.

## Working Spec

`docs/handoffs/_working/20260307-cogworks-new-post-upgrade-working-spec.md`

## Sanity Deltas Applied

1. **@anthropic-ai/sdk already installed** (^0.78.0). Skipped install.
2. **TipTap version**: Spec said ^3.19.0, codebase had ^3.20.0. Used ^3.20.0 for consistency.
3. **No `is_admin` RPC**: Spec referenced it but it doesn't exist in Rescue Barn. Used same auth pattern as posts API (`supabase.auth.getUser()` check only).
4. **Migration naming**: Spec said YYYYMMDD format. Codebase uses sequential 00N_ format. Used 008_.
5. **Bubble-menu and floating-menu**: Installed but not configured in editor — not used in Postmaster's reference implementation either.

## Files Modified/Created

| File | Action |
|------|--------|
| `supabase/migrations/008_cogworks_post_upgrade.sql` | Created — adds species_groups, scheduled_at, platform_targets, mini_storm_requested, ai_generation_mode, ai_seed_text, youtube_copy_text columns |
| `src/lib/cogworks/types.ts` | Modified — added PlatformTarget, PLATFORM_OPTIONS, AIGenerationMode, new fields to SanctuaryPost and CreatePostPayload |
| `src/app/api/cogworks/generate/route.ts` | Created — Gen AI content generation endpoint (body + excerpt + YouTube copy) using Claude Sonnet with sanctuary voice prompt |
| `src/components/cogworks/PostEditor.tsx` | Rewritten — full TipTap (24 extensions), AI composition panel, multi-species select, platform targeting, YouTube copy card, scheduling, mini-Storm toggle |
| `src/app/barn-feed/[param]/post-view.tsx` | Modified — multi-species badge rendering |
| `src/components/cogworks/PostCard.tsx` | Modified — multi-species badge rendering |
| `src/app/admin/cogworks/review-queue-client.tsx` | Modified — multi-species badge rendering |

**7 files** across 1 repo.

## Acceptance Criteria

1. [x] 18 TipTap extension packages installed
2. [x] Supabase migration 008 created with species_groups, scheduling, platform, AI tracking columns
3. [x] Type definitions updated (PlatformTarget, AIGenerationMode, expanded SanctuaryPost/CreatePostPayload)
4. [x] Gen AI API route at `/api/cogworks/generate` with Standard/Verbose modes
5. [x] PostEditor rewritten with full TipTap toolbar (24 extensions)
6. [x] AI Content Generator collapsible panel with seed text, mode toggle, generate button
7. [x] Multi-species pill selection (toggle on/off, auto-clear general when specific selected)
8. [x] Platform targeting checkboxes (YouTube conditional on video_url)
9. [x] YouTube copy-paste card with clipboard copy
10. [x] Mini-Storm toggle
11. [x] Schedule date/time picker
12. [x] PostCard, post-view, review-queue-client updated for multi-species badges
13. [x] `npx tsc --noEmit` passes with zero errors
14. [x] `npx eslint` passes with zero errors on modified files

## Verification

```
npx tsc --noEmit (rescuebarn) -> 0 errors
npx eslint (modified files) -> 0 errors
```

## Deferred Items

- Supabase migration 008 needs to be run (`npx supabase db push` or manual execution in Supabase dashboard)
- species_group column kept for backward compatibility; deprecation deferred until all code references species_groups
- COG-2: Content Storm cross-publishing to Cogworks (Postmaster integration)
- COG-3: Cogworks subscriber management and delivery infrastructure
- COG-4: Cogworks public commenting and RSS feed
