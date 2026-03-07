# Working Spec: 20260306-cogworks-facebook-page-backfill

## Objective

Create shared Cogworks import utilities and an automated Facebook Page backfill script to seed the Rescue Barn Cogworks (Barn Feed CMS) with historical @SteampunkFarms Facebook Page posts ahead of soft launch.

## Strategy Session Template Answers

- **Protocol Fit:** Tier 3 — CChat-planned, CC-executed. Extends existing Cogworks seed infrastructure with shared utilities and automated backfill.
- **Failure Mode Impact:** Low — all posts inserted as drafts requiring operator review. Script is idempotent (dedup by external_id). Media re-hosting failure falls back to Facebook CDN URL.
- **Operator Burden:** Minimal — operator provides Facebook Page Access Token, runs script with CLI flags, reviews drafts in Cogworks admin.
- **Measurable Gain:** Cogworks launches with a rich content library instead of empty state. Shared utils enable future import scripts (Facebook export parser, Instagram ingest).

## Cross-Site Impact Checklist

**Repos touched:**
- [x] steampunk-rescuebarn (scripts, migration, .env.example)
- [x] steampunk-strategy (handoff specs, roadmap)
- [ ] Studiolo
- [ ] Postmaster
- [ ] Cleanpunk Shop
- [ ] Orchestrator

**Authentication implications:** None — script uses service role key (already in env)
**Data-flow consequences:** New rows in sanctuary_posts table with source='facebook'
**Orchestrator / Cron impact:** None — one-time backfill script

**Verification commands required:**
- `node --check scripts/backfill-facebook-page.mjs`
- `node --check scripts/lib/cogworks-import-utils.mjs`
- `node --check scripts/seed-cogworks-posts.mjs`
- `npx tsc --noEmit`

## Family Planning Protocol Gate

**Major Initiative Criteria check:** Does NOT meet Major Initiative threshold — single repo data seeding, no cross-site data flow changes, no auth changes, no donor experience impact, estimated effort < 8 handoffs.

**Reversibility Score:** 5/5 — all imported posts are drafts, can be bulk-deleted by source='facebook'. Migration adds columns with IF NOT EXISTS. Fully reversible.

## Implementation Plan

1. Add source/external_id/external_url columns to sanctuary_posts (migration 007)
2. Install @anthropic-ai/sdk for species classification
3. Create shared import utilities module (scripts/lib/cogworks-import-utils.mjs)
4. Create Facebook Page backfill script (scripts/backfill-facebook-page.mjs)
5. Update .env.example with Facebook/Anthropic vars
6. Refactor existing seed script to use shared utils
7. Create handoff artifacts, verify, update roadmap

## Execution Mode

Lean Mode — single repo, additive changes only, no cross-site impact.
