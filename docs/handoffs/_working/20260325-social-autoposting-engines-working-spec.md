---
handoff-id: 20260325-social-autoposting-engines
tier: 2
repos: steampunk-postmaster, steampunk-rescuebarn, steampunk-orchestrator
status: IN PROGRESS
---

# Social Auto-Posting Engines — Working Spec

**Date:** 2026-03-25
**Plan source:** steampunk-rescuebarn/docs/checkpoints/20260325-social-autoposting-engines-plan.md (753 lines)

## Scope

Three auto-posting engines + shared pseudo-rendition bridge:

1. **Seeds Compassion Cycle** (3x/day) — 7-stage lifecycle per seed variety with slant rotation
2. **Bee Pack Pollinator Track** (1x/day) — flower pollinator education, 4 themes per flower
3. **Academy Evergreen upgrade** — add First Comment + delayed comments to existing engine

All three use the existing PlatformComment infrastructure via a pseudo-rendition bridge.

## Repos Touched

- **steampunk-postmaster** (primary): Prisma models, engine libs, cron routes
- **steampunk-rescuebarn**: `/api/seeds/catalog` internal endpoint
- **steampunk-orchestrator**: 2 new cron entries (seed-social, bee-track)

## Acceptance Criteria

1. [ ] Prisma schema has SeedSocialPost, SeedSocialCursor, SeedCronLog, BeeSocialPost, BeeSocialCursor models
2. [ ] Migration runs clean
3. [ ] `lib/pseudo-rendition.ts` creates minimal Rendition records for direct-dispatch engines
4. [ ] Rescue Barn exposes `/api/seeds/catalog` with INTERNAL_SECRET auth
5. [ ] Seed social cron generates 7-stage content with slant rotation, dispatches to FB+X, creates PlatformComments
6. [ ] Bee track cron generates pollinator education posts, dispatches to FB+X, creates PlatformComments
7. [ ] Academy evergreen creates pseudo-renditions after dispatch and attaches First Comment + delayed comments
8. [ ] All cron endpoints support `?dryRun=true` for testing
9. [ ] Kill switches: SEED_SOCIAL_ENABLED, BEE_TRACK_ENABLED
10. [ ] Orchestrator has seed-social-dispatch and bee-track-dispatch cron entries
11. [ ] `tsc --noEmit` passes in all three repos
