# Checkpoint: UA Phase 2f — SFOS Cross-Site Synthesis

**Date:** 2026-03-23
**Status:** COMPLETE

## Deliverables

1. ✅ `sfos-cross-site-dependencies.md` — 32 data flows, 20 integration seams, 53 cron jobs classified
2. ✅ `bfos-conformance-audit.md` — 8-site conformance matrix, stack comparison, photography template analysis

## SFOS Key Findings

- **32 data flows** mapped across 6 sites (including orchestrator)
- **20 integration seams** (6 Critical, 8 High, 6 Medium)
- **53 SFOS cron jobs** classified: 8 Critical, 21 High, 24 Low silent-24h impact
- Studiolo is the central CRM hub with densest cross-site connections
- TARDIS is the financial/transparency backbone
- CRON_SECRET is the single highest-risk integration point
- Postmaster ↔ Studiolo is bidirectional (donor data + engagement data)
- Cleanpunk ↔ Studiolo is bidirectional (products/orders + customer seeds)

## BFOS Key Findings

- 100% health endpoint conformance across all 8 sites
- CWS missing `/api/revenue/summary` (critical gap — processes Square payments)
- kk-photog has stale `cron-guard.yml` alongside new `governance-checks.yml`
- 4 different auth approaches across the family
- kk-photog/chris-photog share ~90% structure, feasible `@bfos/photog-core` package
- semper-vets has zero orchestrator crons despite complex platform

## Phase 2 Complete Verification

- [x] 5 knowledge-graph.json files (TARDIS, Studiolo, Postmaster, Rescue Barn, Cleanpunk)
- [x] 5 onboard docs exported to bts-brain
- [x] 5 graph JSON files exported to bts-brain
- [x] sfos-cross-site-dependencies.md written
- [x] All 6 checkpoints written (2a through 2f)
- [ ] /understand-diff on a real PR — skipped (no active PRs; tool validates against knowledge graph which is now available for future PR reviews)
