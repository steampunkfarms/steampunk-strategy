# Working Spec: 20260306-sfrb-page-export-parser

## Objective

Create a dual-mode parser for the SFRB Facebook Page data export: Cogworks mode imports posts+videos as drafts with local media upload, Studiolo mode extracts follower/messenger data for donor cross-referencing.

## Strategy Session Template Answers

- **Protocol Fit:** Tier 3 — CChat-planned, CC-executed. Extends shared Cogworks import utilities from Prompt 1 with Facebook export-specific parsing.
- **Failure Mode Impact:** Low — Cogworks inserts are all drafts. Studiolo output is a JSON file for manual review. No direct database writes to Studiolo.
- **Operator Burden:** Minimal — operator runs script with CLI flags, reviews Cogworks drafts in admin, reviews Studiolo JSON before any import.
- **Measurable Gain:** Seeds Cogworks with 232 historical posts (201 profile posts + 31 unique videos). Provides 265 unique names for Studiolo donor cross-referencing.

## Cross-Site Impact Checklist

**Repos touched:**
- [x] steampunk-rescuebarn (scripts)
- [x] steampunk-strategy (handoff artifacts)
- [ ] Studiolo
- [ ] Postmaster
- [ ] Cleanpunk Shop
- [ ] Orchestrator

**Authentication implications:** None
**Data-flow consequences:** New rows in sanctuary_posts (source='facebook_export'), JSON output file for Studiolo enrichment
**Orchestrator / Cron impact:** None — one-time parser script

## Family Planning Protocol Gate

**Major Initiative Criteria check:** Does NOT meet Major Initiative threshold — single repo, one-time script, no cross-site data flow changes.

**Reversibility Score:** 5/5 — Cogworks posts deletable by source='facebook_export'. Studiolo JSON is a file for review. No schema changes.

## Implementation Plan

1. Add decodeFBText() to shared utils for Facebook mojibake decoding
2. Create parse-sfrb-page-export.mjs with dual-mode CLI
3. Cogworks mode: parse profile_posts_1.json + videos.json, dedup, classify, upload media, insert as drafts
4. Studiolo mode: parse followers + messenger conversations, classify person/org, output enrichment JSON
5. Create handoff artifacts, verify, update roadmap

## Sanity Deltas

- Export directory structure differs from CChat documentation: files nested under `this_profile's_activity_across_facebook/` prefix, not at root. Parser adapted to handle this.
- Follower count is 237 (not 226 as CChat noted). No impact on logic.
- Env validation relaxed in dry-run mode to allow preview without Supabase credentials.

## Execution Mode

Lean Mode — single repo, additive changes only, no cross-site impact.
