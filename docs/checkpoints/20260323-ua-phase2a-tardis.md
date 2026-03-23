# Checkpoint: UA Phase 2a — TARDIS Knowledge Graph

**Date:** 2026-03-23
**Session:** mid
**Status:** COMPLETE

## Plan

1. ✅ Read SFOS family CLAUDE.md
2. ✅ Run /understand on steampunk-strategy (TARDIS)
3. ✅ Verify graph coverage (41 models, 89 routes, cross-site integrations)
4. ✅ Run /understand-onboard
5. ✅ Export graph + onboard to bts-brain/docs/architecture/
6. ✅ Write this checkpoint

## Graph Summary

- **500 nodes** (272 file, 228 function)
- **584 edges** (293 imports, 228 contains, 63 calls)
- **6 layers:** API (93), Page (82), Service (40), UI Components (16), Tooling (32), Infrastructure (9)
- **13-step guided tour** from Bridge dashboard through financial core to scripts/tooling
- Validation: PASSED (0 issues)

## Coverage Verification

- [x] 41 Prisma models — referenced through lib/prisma.ts (42 inbound imports, highest fan-in)
- [x] 89+ API routes — 93 files in API layer
- [x] Cross-site integrations:
  - Gift staging push to Studiolo (app/(protected)/gift-staging/, api/gift-staging/push)
  - Transparency API for Rescue Barn (api/impact/transparency)
  - Product-species map linking to Cleanpunk (app/(protected)/product-map/)
  - Cross-site types contract (docs/contracts/cross-site-types.ts)
- [x] Azure AD auth flow (lib/auth.ts, middleware.ts, 30 inbound imports)
- [x] Financial domains (transactions, expenses, cost centers, cost tracker, allocation engine)
- [x] Intelligence suite (6 lib/intelligence/ modules: ai-insights, board-pack, scenario-engine, forecasting, expense-aggregations, analytical-aggregations)
- [x] Document pipeline (receipt-parser, invoice-pipeline, create-transaction-from-document)

## Context for Next Session

- Phase 2a status: COMPLETE — TARDIS handled well despite being the largest SFOS site
- Graph quality: Clean merge, 0 validation issues, all 272 files covered
- Architectural finding: Service layer is clean dependency hub (186 inbound, 0 outbound cross-layer)
- The plugin handles 272 files / 44K lines successfully — rest of SFOS will be routine
- Next: Phase 2b (Studiolo), 2c (Postmaster), 2d (Rescue Barn), 2e (Cleanpunk)

## Files Created This Session

- `.understand-anything/knowledge-graph.json` — TARDIS knowledge graph (500 nodes, 584 edges)
- `.understand-anything/meta.json` — graph metadata
- `docs/checkpoints/20260323-ua-phase2a-tardis.md` — this checkpoint
- `bts-brain/docs/architecture/tardis-graph.json` — exported copy (381 KB)
- `bts-brain/docs/architecture/tardis-onboard.md` — exported onboarding guide
