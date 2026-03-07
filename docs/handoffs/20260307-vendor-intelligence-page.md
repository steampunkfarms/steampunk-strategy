# Handoff: VEN-1 — Vendor Intelligence Page

**ID:** `20260307-vendor-intelligence-page`
**Tier:** 2
**Status:** COMPLETE
**Date:** 2026-03-07

## Objective

Transform the vendor page from a flat directory into a drill-down intelligence dashboard with financial KPIs, price trends, program allocation, product-species mapping, donor-paid bill tracking, and Claude-generated strategic insights.

## Repos Modified

### steampunk-strategy (7 files)

1. `app/(protected)/vendors/[id]/page.tsx` — REWRITTEN: From edit form to full vendor intelligence dashboard with header (contact, badges, quick stats), standing arrangements display, and client analytics component.

2. `app/(protected)/vendors/[id]/vendor-analytics-client.tsx` — NEW: Client component fetching from analytics + insight APIs. Renders 6 sections: Financial Intelligence KPIs, Monthly Spend Trend (TardisLineChart), Price Trends (CostTracker TardisLineChart per item with creep alerts), Program Allocation (TardisPieChart + breakdown), Product-to-Species Mapping table, Donor-Paid Bills table, AI Strategic Insight card, Document Vault, Transaction History with expand/collapse.

3. `app/(protected)/vendors/[id]/edit/page.tsx` — NEW: Edit form moved to `/vendors/[id]/edit` subroute since `[id]` is now the detail view.

4. `app/api/vendors/[id]/analytics/route.ts` — NEW: Session-authenticated endpoint returning vendor KPIs (YTD spend, transaction count, avg, % of total, YoY change), program allocation, monthly trend, CostTracker price trends, ProductSpeciesMap entries, DonorPaidBill history, linked documents.

5. `app/api/vendors/[id]/insight/route.ts` — NEW: Claude-generated vendor relationship insight. Uses Haiku 4.5 to produce 2-3 sentence strategic narrative from vendor spend, cost alerts, arrangements, and recent transactions.

6. `app/(protected)/vendors/page.tsx` — MODIFIED: Vendor cards now link to detail page (`/vendors/[id]`) instead of edit page. Cards are clickable `<Link>` elements with hover effect.

7. `docs/handoffs/_working/20260307-vendor-intelligence-page-working-spec.md` — NEW: Working spec.

## Key Decisions

- **Edit form relocated:** `/vendors/[id]` was an edit form; now it's the intelligence dashboard. Edit moved to `/vendors/[id]/edit`. Back-link from edit to detail page.
- **Client-side data fetching:** Analytics + insight loaded via API calls from client component to avoid blocking server render with heavy aggregation queries.
- **Insight model:** Claude Haiku 4.5 for fast, cheap vendor insights. Gracefully falls back if no API key configured.
- **Reuses BI-0 chart library:** TardisKPICard, TardisLineChart, TardisPieChart, TardisBarChart.

## Acceptance Criteria

- [x] Vendor detail page renders with all 6 sections
- [x] Price trend charts show CostTracker history with creep alerts
- [x] Transaction history table with expand/collapse
- [x] Standing arrangements section shows VendorDonorArrangement data
- [x] Product-to-Species mapping table displays ProductSpeciesMap
- [x] Program allocation pie chart with breakdown
- [x] Claude insight narrative generates on page load
- [x] Vendor list page cards link to detail page
- [x] Edit form accessible via `/vendors/[id]/edit`
- [x] `npx tsc --noEmit` passes with zero errors

## Verification

```
npx tsc --noEmit  # PASS — 0 errors
node scripts/verify-handoff.mjs --handoff-name 20260307-vendor-intelligence-page  # PASS
```
