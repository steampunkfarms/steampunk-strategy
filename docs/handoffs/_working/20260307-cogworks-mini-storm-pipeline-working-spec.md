# Working Spec: COG-2 — Mini-Storm Pipeline + Engagement Controls + Comment Spotlight

**ID:** `20260307-cogworks-mini-storm-pipeline`
**Tier:** 3
**Status:** IN PROGRESS
**Date:** 2026-03-07

## Objective

Wire the mini-Storm pipeline from Cogworks to Postmaster: when a post is published with `mini_storm_requested = true`, Rescue Barn calls Postmaster's `/api/storm/mini` endpoint to generate and post platform-specific content. Add admin engagement controls, comment spotlight-to-storm, and scheduled post auto-publish cron.

## Target Repos

- PRIMARY: `steampunk-rescuebarn` (Cogworks admin, engagement controls, mini-Storm trigger)
- SECONDARY: `steampunk-postmaster` (mini-Storm receiver API, platform posting)

## Dependencies

- COG-1 must be complete (platform_targets, mini_storm_requested, scheduled_at columns on sanctuary_posts)

## Discovery Findings

(To be populated during Sanity Pass)

## Sanity Deltas

(To be populated during implementation)

## Phases

1. Supabase migration (app_config, mini_storm_log, post_comments spotlight columns)
2. Mini-Storm trigger API (Rescue Barn -> Postmaster)
3. Comment Spotlight API
4. Engagement Config API
5. Admin Engagement Controls page
6. Comment Spotlight button in review queue
7. Publish flow integration in PostEditor
8. Scheduled post cron
9. Postmaster mini-Storm receiver API
10. Env configuration
