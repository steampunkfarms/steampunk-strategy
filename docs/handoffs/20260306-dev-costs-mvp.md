# Handoff Spec: 20260306-dev-costs-mvp

## Summary

Rewrite the /dev-costs UI to remove dependency on the SaaSSubscription Prisma model. The page now drives entirely from expense Transaction records filtered by SaaS vendor slugs (vercel, neon, supabase, github, anthropic, microsoft-365). Monthly spend is visualized with a Recharts LineChart. Gmail financial queries and vendor seed data were already in place and required no changes.

## Target Repos

- `/Users/ericktronboll/Projects/steampunk-strategy` (implementation)

## Scope

- Remove all `prisma.saaSSubscription` usage from the dev-costs page
- Query Transaction records filtered by SaaS vendor slugs for YTD totals, monthly chart data, and recent invoices
- Add Recharts LineChart client component for monthly spend visualization
- Preserve existing TARDIS UI patterns (console-card, bridge-table, gauge colors)

## Files Changed

| File | Action |
|------|--------|
| `app/(protected)/dev-costs/page.tsx` | Rewritten — removed SaaSSubscription queries, uses Transaction + Vendor |
| `app/(protected)/dev-costs/spend-chart.tsx` | Created — Recharts LineChart client component |

## Files Verified (no changes needed)

| File | Status |
|------|--------|
| `lib/gmail.ts` | Already has all 6 SaaS vendors in VENDOR_MAP and FINANCIAL_QUERIES |
| `prisma/seed.ts` | Already seeds all 6 SaaS vendors with type 'saas' |

## Strict Acceptance Checklist

- [x] No `saaSSubscription` or `SaaSSubscription` references in `app/(protected)/dev-costs/page.tsx`
- [x] Page queries Transaction model filtered by SaaS vendor slugs
- [x] Recharts LineChart renders monthly spend (via client component)
- [x] YTD total card displayed
- [x] Recent invoices table with vendor, date, amount, status columns
- [x] YTD by-vendor breakdown with progress bars
- [x] `prisma validate` passes
- [x] `tsc --noEmit` passes
- [x] No new Prisma models or schema changes
- [x] No cross-repo changes

## Deferred Items

- SaaSSubscription model remains in schema (not removed — out of scope, may be used for budget tracking later)
- Cost allocation by repo (repoAllocation field on SaaSSubscription) deferred to future sprint
- Google Workspace vendor addition deferred (org uses Microsoft 365 for email/auth; Google is used only for Gmail API scanning, not as a billed SaaS vendor)

## Verification Results

```
prisma validate: PASS
tsc --noEmit: PASS
rg saaSSubscription dev-costs/page.tsx: 0 matches (PASS)
rg LineChart|ResponsiveContainer|Line dev-costs/: matches found (PASS)
```
