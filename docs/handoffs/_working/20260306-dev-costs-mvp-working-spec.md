# Working Spec: 20260306-dev-costs-mvp

## Objective

Rewrite the /dev-costs page to remove SaaSSubscription model dependency and drive the UI entirely from expense transactions filtered by SaaS vendor slugs. Add Recharts LineChart for monthly spend visualization.

## Discovery Findings

1. `lib/gmail.ts` VENDOR_MAP and FINANCIAL_QUERIES already contain all 6 SaaS vendors (vercel, neon, supabase, github, anthropic, microsoft-365) with billing sender addresses.
2. `prisma/seed.ts` already seeds all 6 SaaS vendors with type 'saas' and correct metadata.
3. `app/(protected)/dev-costs/page.tsx` had a direct dependency on `prisma.saaSSubscription.findMany()` which references a model that exists in the schema but is not the intended data source for this page.
4. The expenses page (`app/(protected)/expenses/page.tsx`) uses `getTransactions()` from `lib/queries` with category filtering — consistent with the approach of querying Transaction records filtered by vendor.
5. Technology category in seed uses slug 'technology' with children: tech-saas, tech-hardware, tech-hosting.
6. Recharts is already installed and used in `retail-charity/earnings-chart.tsx` (BarChart pattern).

## Plan

1. Keep gmail.ts as-is (already has SaaS vendor coverage).
2. Keep seed.ts as-is (already has SaaS vendors).
3. Create `app/(protected)/dev-costs/spend-chart.tsx` — client component with Recharts LineChart.
4. Rewrite `app/(protected)/dev-costs/page.tsx` — remove SaaSSubscription queries, use Transaction records filtered by SaaS vendor slugs, render LineChart, YTD total, vendor breakdown, and recent invoices table.

## Files Changed

- `app/(protected)/dev-costs/page.tsx` — full rewrite (removed SaaSSubscription dependency)
- `app/(protected)/dev-costs/spend-chart.tsx` — new client component (Recharts LineChart)

## Verification

- prisma validate: PASS
- tsc --noEmit: PASS
- No SaaSSubscription references in dev-costs/page.tsx: PASS
- LineChart/ResponsiveContainer/Line present: PASS
