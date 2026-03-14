# Handoff Spec: Cross-Site Type Drift Detection

**Handoff ID:** 20260313-cross-site-type-drift
**Tier:** 3 (Strategic)
**Repo:** steampunk-strategy (primary) + 4 satellite repos
**Date:** 2026-03-13
**Status:** COMPLETED 2026-03-13 — 8 files created, 0 modified.

---

## Objective

Establish a canonical source of truth for all cross-site API contract types and a drift-detection mechanism to catch structural divergence between repos.

## Architecture (Option B — Copy-on-Write)

```
steampunk-strategy/
├── docs/contracts/cross-site-types.ts   ← canonical source (all 22 interfaces)
├── scripts/check-type-drift.ts          ← structural comparison script
└── lib/internal-contracts.ts            ← strategy's own contract copy

steampunk-studiolo/lib/internal-contracts.ts    ← 11 interfaces (served endpoints)
steampunk-postmaster/lib/internal-contracts.ts  ← 6 interfaces (served + consumed)
steampunk-rescuebarn/lib/internal-contracts.ts  ← 2 interfaces (served endpoint)
cleanpunk-shop/apps/storefront/lib/internal-contracts.ts ← 1 interface (served endpoint)
```

## Files Created (8)

1. `steampunk-strategy/docs/contracts/cross-site-types.ts` — 22 canonical interfaces covering 11 endpoints
2. `steampunk-strategy/scripts/check-type-drift.ts` — drift checker (regex-based structural parser, per-repo config)
3. `steampunk-strategy/lib/internal-contracts.ts` — 5 interfaces (ProgramImpact, AllProgramsResponse, StudioloBIMetrics, CleanpunkBIMetrics, PostmasterBIMetrics)
4. `steampunk-studiolo/lib/internal-contracts.ts` — 11 interfaces (all Studiolo-served endpoints)
5. `steampunk-postmaster/lib/internal-contracts.ts` — 6 interfaces (TARDIS impact consumed + Postmaster-served)
6. `steampunk-rescuebarn/lib/internal-contracts.ts` — 2 interfaces (subscriber-sync)
7. `cleanpunk-shop/apps/storefront/lib/internal-contracts.ts` — 1 interface (CleanpunkBIMetrics)
8. `steampunk-strategy/docs/handoffs/_working/20260313-cross-site-type-drift-working-spec.md` — working spec

## Acceptance Criteria

| # | Criterion | Pass Condition |
|---|-----------|----------------|
| AC-1 | Canonical types file exists | `docs/contracts/cross-site-types.ts` contains all 22 interfaces |
| AC-2 | Drift check script exists and runs | `npx tsx scripts/check-type-drift.ts` exits 0 |
| AC-3 | All 5 per-repo contract files exist | Each at its documented path |
| AC-4 | Drift check reports all aligned | 5/5 repos show "aligned" |
| AC-5 | tsc clean in steampunk-strategy | `npx tsc --noEmit` exits 0 |
| AC-6 | tsc clean in steampunk-studiolo | `npx tsc --noEmit` exits 0 |
| AC-7 | tsc clean in steampunk-postmaster | `npx tsc --noEmit` exits 0 |
| AC-8 | tsc clean in steampunk-rescuebarn | `npx tsc --noEmit` exits 0 |
| AC-9 | tsc clean in cleanpunk-shop/apps/storefront | `npx tsc --noEmit` exits 0 |
| AC-10 | No existing imports broken | Contract files are standalone; no import changes to existing code |
| AC-11 | POSTEST markers present | `// postest` on first code block of each new file |

## Deferred Items

- Import migration: existing code continues using its current type sources (e.g., `lib/tardis.ts`, `lib/cross-site.ts`)
- `patreon-posts` endpoint typing (response shape is opaque)
- CI integration: add `check-type-drift.ts` to GitHub Actions or precheck script
- Option A shared npm package: revisit when endpoint count exceeds ~20
