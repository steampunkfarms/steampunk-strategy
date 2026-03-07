# Working Spec: Cleanpunk Commerce Integration for BI-2

**Handoff ID:** `20260307-cleanpunk-bi-integration`
**Date:** 2026-03-07

## Strategy Session Template

1. **What is the business goal?** Add Cleanpunk commerce data (orders, revenue, customers, products) to TARDIS Analytical BI tab.
2. **Which repos are touched?** cleanpunk-shop (storefront) + steampunk-strategy (TARDIS).
3. **What data flows change?** New: TARDIS ← Cleanpunk (order/revenue metrics via INTERNAL_SECRET auth).
4. **Who are the users?** Farm operator reviewing cross-site analytics.
5. **What are the risks?** Low — read-only, no schema changes, no Medusa modifications.

## Cross-Site Impact Checklist

- [x] TARDIS (steampunk-strategy) — cross-site.ts update, analytical aggregation update, P&L chart update
- [x] Cleanpunk Shop — new internal API route
- [ ] Studiolo — not touched
- [ ] Postmaster — not touched
- [ ] Rescue Barn — not touched
- [ ] Orchestrator — not touched

## Family Planning Protocol Gate

- **Major Initiative?** No — two repos, additive only, follows established pattern.
- **Novel Pattern?** No — same INTERNAL_SECRET Bearer pattern as Studiolo/Postmaster.
- **Gate result:** PASS — Tier 2 execution.

## Reversibility Score

- **Score:** HIGH
- **Rollback method:** Delete Cleanpunk API route + revert TARDIS cross-site.ts/aggregations changes.
- **Data risk:** None — read-only aggregation.

## Sanity Pass Findings

1. **Cleanpunk uses `src/` prefix:** All paths under `apps/storefront/src/`. API routes at `src/app/api/`.
2. **No safe-compare utility exists in Cleanpunk.** Need to create one (same pattern as Postmaster/Studiolo).
3. **INTERNAL_SECRET not in .env.example.** CRON_SECRET exists (line 47). Add INTERNAL_SECRET alongside it.
4. **Medusa v2 order data:** `total` field is in cents (integer). Need to divide by 100 for dollar amounts.
5. **fetchAllOrdersEnriched() returns items with variant → product → collection:** This gives us collection-level revenue breakdown.
6. **No `payment_status` filter available via Medusa v2 API:** Need client-side filter for captured/paid orders.
7. **Existing Cleanpunk admin routes don't use INTERNAL_SECRET:** They use MEDUSA_ADMIN_API_KEY for Medusa Admin API access. The new internal route uses INTERNAL_SECRET for TARDIS-to-Cleanpunk auth.

## Implementation Plan

1. Create `apps/storefront/src/lib/safe-compare.ts`
2. Create `apps/storefront/src/app/api/internal/bi-metrics/route.ts`
3. Update `apps/storefront/.env.example` with INTERNAL_SECRET
4. Update TARDIS `lib/cross-site.ts` with CleanpunkBIMetrics type and fetch function
5. Update TARDIS `lib/intelligence/analytical-aggregations.ts` to include commerce data
6. Update TARDIS unified-pnl-chart component to show commerce revenue bar
7. Update analytical-kpis component to show commerce data
