# Handoff: Cleanpunk Commerce Integration for BI-2

**ID:** `20260307-cleanpunk-bi-integration`
**Tier:** 2
**Status:** COMPLETE
**Date:** 2026-03-07

## Objective

Add Cleanpunk Shop commerce data (orders, revenue, customers, products) to the TARDIS Analytical BI tab, completing the third cross-site data source for the unified P&L view.

## Repos Modified

### cleanpunk-shop (3 files)
1. `apps/storefront/src/lib/safe-compare.ts` — NEW: Timing-safe string comparison utility for INTERNAL_SECRET auth validation
2. `apps/storefront/src/app/api/internal/bi-metrics/route.ts` — NEW: Internal BI metrics endpoint aggregating Medusa order/revenue/customer/product data with Bearer auth
3. `apps/storefront/.env.example` — MODIFIED: Added INTERNAL_SECRET under Cron/Internal Auth section

### steampunk-strategy (4 files)
1. `lib/cross-site.ts` — MODIFIED: Added CleanpunkBIMetrics interface and fetchCleanpunkBIMetrics() function
2. `lib/intelligence/analytical-aggregations.ts` — MODIFIED: Added fetchCleanpunkSafe() helper, commerceRevenue field to UnifiedPnLData, commerce fields to AnalyticalKPIs, updated getUnifiedPnL() and getAnalyticalKPIs() to include commerce data
3. `app/(protected)/intelligence/analytical/components/unified-pnl-chart.tsx` — MODIFIED: Added Commerce bar (amber) to multi-bar P&L chart
4. `app/(protected)/intelligence/analytical/components/analytical-kpis.tsx` — MODIFIED: Added Cleanpunk to cross-site status list in Revenue Sources card
5. `app/(protected)/intelligence/analytical/page.tsx` — MODIFIED: Changed Cleanpunk status indicator from amber "deferred" to dynamic green/red based on connection status

## Key Decisions

- **Auth pattern:** Same INTERNAL_SECRET Bearer pattern as Studiolo/Postmaster endpoints
- **Cents-to-dollars:** Medusa v2 stores `total` in cents; `/100` conversion applied throughout
- **Import paths:** Cleanpunk uses `@lib/` not `@/lib/` (tsconfig baseUrl is `./src` with `@lib/*` path alias)
- **Map iterators:** Used `Array.from()` instead of spread for Map iterators since Cleanpunk tsconfig targets `es5`
- **Chart color:** Commerce bar uses `CHART_COLORS.warning` (amber #f0ad4e), distinct from green (TARDIS income), blue (donor giving), red (expenses)
- **Graceful degradation:** Same pattern as Studiolo/Postmaster — null return on fetch failure, components show fallback

## Acceptance Criteria

- [x] Cleanpunk internal API endpoint returns order/revenue/customer/product metrics
- [x] TARDIS cross-site.ts has CleanpunkBIMetrics type and fetch function
- [x] Unified P&L chart shows Commerce as 4th bar
- [x] Analytical KPIs include commerce revenue and order count
- [x] Cross-site status indicator shows dynamic Cleanpunk connection status
- [x] tsc --noEmit passes in both repos (no new errors introduced)

## Verification

- **steampunk-strategy:** `npx tsc --noEmit` — PASS (0 errors)
- **cleanpunk-shop/apps/storefront:** `npx tsc --noEmit` — PASS (0 new errors; 24 pre-existing errors in unrelated files)
