# Handoff: EXP-1 — Expenses Page Analytics Upgrade

**ID:** `20260307-tardis-expenses-bi-phase1`
**Tier:** 2
**Status:** COMPLETE
**Date:** 2026-03-07

## Objective

Upgrade the expenses page from a flat transaction list to a full analytics dashboard with KPI strip, vendor breakdown, COA + program allocation, monthly trend, feed cost tracker, pending review queue, budget vs actual gauges, and AI insight card.

## Repos Modified

### steampunk-strategy (5 files)

1. `app/(protected)/expenses/expense-analytics.tsx` — NEW: Client component rendering 8 analytics sections. Fetches from `/api/expenses/analytics` and `/api/expenses/insight`. Uses TardisKPICard, TardisBarChart, TardisAreaChart, TardisPieChart, TardisLineChart. Sections: KPI strip (6 cards), vendor breakdown (horizontal bar chart with drill-down links), COA + program allocation (category bars + pie chart with IRS 990 indicator), monthly trend (area chart), feed cost tracker (line charts per item), pending review (docs + unverified counts), budget vs actual gauges, AI insight card.

2. `app/api/expenses/analytics/route.ts` — NEW: Session-authenticated endpoint aggregating all expense analytics in parallel. Returns KPIs, vendor breakdown (with vendorId for drill-down), category/program breakdowns, monthly trend, price trends, budget vs actual, functional class data, pending docs/unverified counts.

3. `app/api/expenses/insight/route.ts` — NEW: Claude Haiku 4.5 generates 3-bullet expense narrative from KPIs, top vendors, and recent trend. Graceful fallback without API key.

4. `app/(protected)/expenses/page.tsx` — MODIFIED: Replaced inline summary bar and category breakdown with ExpenseAnalytics component. Removed unused imports (TrendingUp, formatCurrency, getExpenseSummary).

5. `docs/handoffs/_working/20260307-tardis-expenses-bi-phase1-working-spec.md` — NEW: Working spec.

## Key Decisions

- **Client-side analytics:** Analytics loaded via API call from client component to avoid blocking server render. Transaction table still server-rendered with full filter support.
- **Reuses existing aggregation functions:** All data comes from `lib/intelligence/expense-aggregations.ts` — no new aggregation code needed.
- **Vendor drill-down links:** Vendor breakdown bars link to `/vendors/[id]` (VEN-1 detail page).
- **IRS 990 indicator:** Program allocation section shows functional class percentage with target range.
- **Parallel API fetch:** Analytics endpoint fetches 10 data sources in parallel for fast response.

## Acceptance Criteria

- [x] KPI strip renders 6 cards with trend indicators
- [x] Vendor breakdown bar chart with drill-down links to vendor detail
- [x] Category breakdown with COA codes and progress bars
- [x] Program allocation pie chart with IRS 990 target indicator
- [x] Monthly expense trend area chart
- [x] Feed cost tracker with price trend lines
- [x] Pending review queue showing docs and unverified counts
- [x] Budget vs actual gauge cards with utilization bars
- [x] AI insight card generates narrative from expense data
- [x] Transaction table + filters still work below analytics sections
- [x] `npx tsc --noEmit` passes with zero errors

## Verification

```
npx tsc --noEmit  # PASS — 0 errors
node scripts/verify-handoff.mjs --handoff-name 20260307-tardis-expenses-bi-phase1  # PASS
```
