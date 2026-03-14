# Working Spec: Cross-Site Type Drift Detection (Option B)

**Handoff ID:** 20260313-cross-site-type-drift
**Tier:** 3 (Strategic)
**Date:** 2026-03-13

---

## Discovery

### Problem
11 internal API endpoints across 5 Steampunk Farms repos communicate via HTTP with no shared type safety. Types are duplicated independently — e.g., `ProgramImpact` and `AllProgramsResponse` are defined identically in both `steampunk-postmaster/lib/tardis.ts` and `steampunk-studiolo/lib/tardis.ts`. The TARDIS BI layer in `steampunk-strategy/lib/cross-site.ts` defines consumer-side types (`StudioloBIMetrics`, `PostmasterBIMetrics`, `CleanpunkBIMetrics`) that are structurally correct but have no formal contract with the producer endpoints.

### Options Evaluated (Strategist Mode)
- **Option A — Shared npm package:** Proper monorepo or npm workspace with `@steampunk/types`. Correct long-term but heavy for 10 endpoints across independent Vercel deployments. Deferred.
- **Option B — Copy-on-write + CI drift check (selected):** Canonical type file in strategy, per-repo contract copies, lightweight structural diff script. Right-sized for current scale.

### Endpoints Surveyed (11 total)

| Endpoint | Repo | Method | Types |
|----------|------|--------|-------|
| `/api/internal/bi-metrics` | Studiolo | GET | StudioloBIMetrics |
| `/api/internal/donors/lookup` | Studiolo | GET | DonorLookupResponse |
| `/api/internal/donors/log-touch` | Studiolo | POST | LogTouchRequest/Response |
| `/api/internal/donors/subscribable` | Studiolo | GET | SubscribableDonorsResponse |
| `/api/internal/patreon-public` | Studiolo | GET | PatreonPublicResponse |
| `/api/internal/patreon-posts` | Studiolo | GET | (opaque — deferred) |
| `/api/internal/bi-metrics` | Postmaster | GET | PostmasterBIMetrics |
| `/api/internal/medical-records` | Postmaster | POST | MedicalRecordsRequest/Response |
| `/api/internal/subscriber-sync` | Rescue Barn | POST | SubscriberSyncRequest/Response |
| `/api/internal/bi-metrics` | Cleanpunk | GET | CleanpunkBIMetrics |
| `/api/impact` + `/api/impact/[slug]` | TARDIS | GET | ProgramImpact, AllProgramsResponse |

### Existing Type Locations (pre-work)
- `steampunk-strategy/lib/cross-site.ts` — BI consumer types (lines 42-113)
- `steampunk-postmaster/lib/tardis.ts` — ProgramImpact, AllProgramsResponse (lines 7-59)
- `steampunk-studiolo/lib/tardis.ts` — ProgramImpact, AllProgramsResponse (lines 7-59, identical)
- `steampunk-postmaster/app/api/internal/medical-records/route.ts` — MedicalRecordInput (lines 7-29)

### Deferred
- `patreon-posts` endpoint: response shape is opaque (`Array<any>` from `fetchRecentPosts()`). Will be typed when Patreon API integration is formalized.
- Import migration: existing code continues using its current type sources. Future work will migrate to import from `lib/internal-contracts.ts`.
- Option A shared package: revisit when endpoint count exceeds ~20.

---

## Strategy Session Template

**What is changing?** Adding canonical cross-site API type definitions and a drift-detection script.
**Why now?** Three independent type drift instances found during SDK/version audit. Scale (11 endpoints) is manageable before it grows.
**What alternatives were considered?** Option A (shared npm package) — deferred for current scale. Option B selected.
**Who is affected?** All 5 sites with internal API endpoints. No runtime changes — types only.
**What could go wrong?** Type names collide with existing definitions in same file scope. Mitigated: contract files are standalone, no import changes.

## Cross-Site Impact Checklist

- [x] Studiolo — `lib/internal-contracts.ts` created (11 interfaces, tsc clean)
- [x] Postmaster — `lib/internal-contracts.ts` created (6 interfaces, tsc clean)
- [x] Rescue Barn — `lib/internal-contracts.ts` created (2 interfaces, tsc clean)
- [x] Cleanpunk — `apps/storefront/lib/internal-contracts.ts` created (1 interface, tsc clean)
- [x] Strategy/TARDIS — `lib/internal-contracts.ts` created (5 interfaces, tsc clean)
- [ ] Orchestrator — not affected (no internal API endpoints)

## Family Planning Protocol Gate

- **Does this change affect other repos?** Yes — 4 satellite repos receive new `lib/internal-contracts.ts` files.
- **Are any shared data flows affected?** No. Contract files are standalone type declarations. No runtime behavior changes.
- **Do any cross-site secrets/env vars change?** No.
- **Is Orchestrator affected?** No (no internal API endpoints).
- **Approved by:** Fred (said "proceed" after strategist-mode review).

## Risk & Reversibility

**Reversibility score:** 5/5 (fully reversible — delete contract files, revert canonical + script)
**Risk:** Minimal. No runtime code changes. No import rewiring. Pure type-definition files + offline script.
**Blast radius:** Zero at runtime. Contract files are not imported by any existing code.
