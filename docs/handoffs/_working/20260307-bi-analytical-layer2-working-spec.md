# Working Spec: BI-2 Analytical BI (Cross-Site Intelligence)

**Handoff ID:** `20260307-bi-analytical-layer2`
**Date:** 2026-03-07

## Strategy Session Template

1. **What is the business goal?** First cross-site data integration — unified P&L, program ROI, donor health, social temperature correlation across TARDIS + Studiolo + Postmaster.
2. **Which repos are touched?** steampunk-strategy, steampunk-studiolo, steampunk-postmaster.
3. **What data flows change?** New internal API endpoints on Studiolo and Postmaster, consumed by TARDIS cross-site fetch.
4. **Who are the users?** Farm operator (single user), reviewing cross-site analytics.
5. **What are the risks?** Medium — cross-site fetch failures degrade gracefully; no schema changes; Cleanpunk deferred.

## Cross-Site Impact Checklist

- [x] TARDIS (steampunk-strategy) — consumer, analytical tab
- [x] Studiolo — new /api/internal/bi-metrics endpoint
- [x] Postmaster — new /api/internal/bi-metrics endpoint
- [ ] Rescue Barn — not touched
- [ ] Cleanpunk — deferred (no INTERNAL_SECRET or internal API yet)
- [ ] Orchestrator — not touched

Cross-site data flows: TARDIS fetches from Studiolo + Postmaster via INTERNAL_SECRET auth.

## Family Planning Protocol Gate

- **Major Initiative?** Yes — affects 3 sites, adds cross-site data flows.
- **Novel Pattern?** No — follows established INTERNAL_SECRET + cross-site fetch pattern from BI-0.
- **Gate result:** PASS — Tier 3 execution with CChat planning.

## Reversibility Score

- **Score:** HIGH
- **Rollback method:** Git revert commits in all 3 repos. TARDIS analytical tab reverts to placeholder. Internal API routes deleted.
- **Data risk:** None — all read-only aggregation, no schema changes.

## Sanity Pass Findings

1. **Auth header correction:** `lib/cross-site.ts` uses `x-internal-secret` header (line 59) but Orchestrator established `Authorization: Bearer` pattern. Correcting to `Authorization: Bearer` for consistency. Both Studiolo and Postmaster endpoints will validate this header.
2. **TemperatureScore is NOT a standalone model:** Temperature data is embedded as fields on Postmaster's `SocialContact` model (`temperatureScore`, `temperatureLabel`, `lastScoreUpdate`). `SocialTemperatureLog` tracks history. Queries must join through SocialContact, not a separate model.
3. **Studiolo Prisma import:** Uses `import { prisma } from '@/lib/db'` (not `@/lib/prisma` like TARDIS).
4. **Studiolo Donor.totalLifetimeGiving is Float** (not Decimal like TARDIS Transaction.amount). No Number() conversion needed.
5. **Both Studiolo and Postmaster already have INTERNAL_SECRET in .env.example.** No env file modifications needed.
6. **Postmaster EngagementEvent uses Platform enum** (FACEBOOK, INSTAGRAM, TIKTOK, etc.) — `signalTier` enum: DONATION_CLAIM, SHARE_INTENT, POSITIVE_ENGAGE, QUESTION.
7. **Postmaster DonorProfile links via `studioloId` (unique)** — enables donor-to-social correlation.
8. **Studiolo Donor fields available:** `totalLifetimeGiving` (Float), `totalGiftCount` (Int), `primarySegment` (String), `firstGiftDate`/`lastGiftDate` (DateTime?), `givingTrend` (String?), `recurringMonthlyAmount` (Decimal?), `recurringStatus` (String?), `givingLast12Mo` (Float), `giftsLast12Mo` (Int), `avgGift` (Float).

No architecture or protocol conflicts detected.

## Implementation Plan

1. Create Studiolo `/api/internal/bi-metrics/route.ts` with INTERNAL_SECRET Bearer auth
2. Create Postmaster `/api/internal/bi-metrics/route.ts` with INTERNAL_SECRET Bearer auth
3. Update TARDIS `lib/cross-site.ts` — fix header to `Authorization: Bearer`, add StudioloBIMetrics/PostmasterBIMetrics types, add fetch functions
4. Create `lib/intelligence/analytical-aggregations.ts` with 6 aggregation functions
5. Create 5 client chart components in `app/(protected)/intelligence/analytical/components/`
6. Rewrite `app/(protected)/intelligence/analytical/page.tsx` to use real data
