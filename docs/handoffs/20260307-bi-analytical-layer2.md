# Handoff Spec: BI-2 Analytical BI (Cross-Site Intelligence)

**Handoff ID:** `20260307-bi-analytical-layer2`
**Date:** 2026-03-07
**Tier:** 3 (Strategic — cross-site, CChat-planned)
**Status:** COMPLETE

## Summary

First cross-site data integration for the TARDIS BI Intelligence Platform. The Analytical tab combines local TARDIS expense data with Studiolo donor/giving metrics and Postmaster social temperature/engagement metrics to provide unified cross-organization analytics.

## Repos Modified

| Repo | Files | Changes |
|------|-------|---------|
| steampunk-strategy | 8 | cross-site.ts update, analytical aggregations lib, 5 chart components, analytical page rewrite |
| steampunk-studiolo | 1 | New /api/internal/bi-metrics endpoint |
| steampunk-postmaster | 1 | New /api/internal/bi-metrics endpoint |
| **Total** | **10** | |

## Files Created/Modified

### steampunk-strategy (TARDIS)

1. **`lib/cross-site.ts`** — MODIFIED: Fixed auth header from `x-internal-secret` to `Authorization: Bearer`. Added `StudioloBIMetrics` and `PostmasterBIMetrics` type interfaces. Added `fetchStudioloBIMetrics()` and `fetchPostmasterBIMetrics()` fetch functions.

2. **`lib/intelligence/analytical-aggregations.ts`** — NEW: 5 aggregation functions combining local + cross-site data:
   - `getUnifiedPnL(months)` — TARDIS expenses/income + Studiolo donor giving by month
   - `getProgramROI(fiscalYear)` — Program expenses vs proportionally allocated donor revenue
   - `getDonorHealthDashboard()` — Studiolo donor retention, segments, giving trends
   - `getTemperatureCorrelation()` — Postmaster social temperature + engagement metrics
   - `getAnalyticalKPIs(fiscalYear)` — Cross-site summary KPIs with connection status

3. **`app/(protected)/intelligence/analytical/components/analytical-kpis.tsx`** — NEW: 6 KPI cards (revenue, net position, donor retention, avg temperature, monthly recurring, revenue sources)

4. **`app/(protected)/intelligence/analytical/components/unified-pnl-chart.tsx`** — NEW: Multi-bar chart showing TARDIS income, donor giving, and expenses by month

5. **`app/(protected)/intelligence/analytical/components/program-roi-chart.tsx`** — NEW: Dual-bar chart comparing program costs vs allocated revenue

6. **`app/(protected)/intelligence/analytical/components/donor-health-panel.tsx`** — NEW: Panel with donor summary stats, segment pie chart, giving trend bar chart, active/lapsed indicator

7. **`app/(protected)/intelligence/analytical/components/temperature-correlation-chart.tsx`** — NEW: Panel with temperature distribution donut, platform engagement bars, donor-linked summary

8. **`app/(protected)/intelligence/analytical/page.tsx`** — REWRITTEN: Server component with `Promise.all()` parallel data fetching, cross-site status indicators, 5 chart sections. Replaces BI-2 placeholder.

### steampunk-studiolo

9. **`app/api/internal/bi-metrics/route.ts`** — NEW: INTERNAL_SECRET Bearer auth, returns donor summary (total/active/lapsed/retention/segments), giving metrics (lifetime/last12mo/recurring/avg), monthly trend, channel breakdown.

### steampunk-postmaster

10. **`app/api/internal/bi-metrics/route.ts`** — NEW: INTERNAL_SECRET Bearer auth, returns temperature overview (distribution/avg), engagement metrics (last30d/byPlatform/bySignalTier), donor-linked contacts for correlation.

## Acceptance Criteria

- [x] Studiolo /api/internal/bi-metrics returns donor + giving metrics with Bearer auth
- [x] Postmaster /api/internal/bi-metrics returns temperature + engagement metrics with Bearer auth
- [x] TARDIS cross-site.ts uses Authorization: Bearer (not x-internal-secret)
- [x] Analytical tab shows unified P&L, program ROI, donor health, temperature correlation
- [x] Graceful degradation when cross-site connections unavailable
- [x] Cross-site status indicators (green/red dots) on analytical page
- [x] Cleanpunk marked as deferred with amber indicator
- [x] `npx tsc --noEmit` passes in all 3 repos

## Sanity Deltas Applied

1. **Auth header correction:** Changed from `x-internal-secret` to `Authorization: Bearer` to match Orchestrator's established pattern (confirmed in Postmaster's existing `internal/medical-records` route).
2. **TemperatureScore not standalone:** Temperature data queried from `SocialContact` model fields, not a separate model.
3. **Studiolo Prisma import:** Uses `@/lib/prisma` in API routes (matching existing kpis route pattern), not `@/lib/db`.
4. **Graceful degradation:** Cross-site fetch failures return null, components show "connection unavailable" message. No hard failures if Studiolo or Postmaster are down.

## Deferred

- Cleanpunk commerce integration (no INTERNAL_SECRET or internal API yet)
- Acquisition channel heatmap (needs more channel attribution data)
- Temperature-to-giving correlation scatter plot (needs matched donor data)
- BI-3 Strategic Intelligence Engine (next layer)
