# Working Spec: BI-1 Operational BI (Expense Mastery)

**Handoff ID:** `20260307-bi-operational-layer1`
**Date:** 2026-03-07

## Strategy Session Template

1. **What is the business goal?** Replace BI-0 placeholder with real expense analytics using Transaction, ExpenseCategory, Program, CostTracker, and SeasonalBaseline models.
2. **Which repos are touched?** steampunk-strategy only.
3. **What data flows change?** None — read-only aggregation of existing Prisma models.
4. **Who are the users?** Farm operator (single user), reviewing expense patterns.
5. **What are the risks?** Low — no schema changes, no auth changes, additive UI only.

## Cross-Site Impact Checklist

- [x] TARDIS (steampunk-strategy) — primary
- [ ] Studiolo — not touched
- [ ] Postmaster — not touched
- [ ] Rescue Barn — not touched
- [ ] Cleanpunk — not touched
- [ ] Orchestrator — not touched

No cross-site data flows. No authentication changes. No cron impact.

## Family Planning Protocol Gate

- **Major Initiative?** No — single repo, no cross-site data flows, no auth changes.
- **Novel Pattern?** No — follows established BI-0 chart library + server component → client component pattern.
- **Gate result:** PASS — proceed with Tier 2 execution.

## Reversibility Score

- **Score:** HIGH
- **Rollback method:** Git revert of the commit restores BI-0 placeholder. Delete `lib/intelligence/` and `components/` directories.
- **Data risk:** None — read-only aggregation, no schema changes.

## Sanity Pass Findings

1. **CostTracker field names differ from spec:** Spec says `prevUnitCost`/`sequentialChange` but schema has `previousCost`/`percentChange`. Using actual schema field names.
2. **Decimal types:** Transaction.amount, CostTracker.unitCost, ExpenseCategory.annualBudget are all `Decimal` — need `Number()` conversions in aggregation functions.
3. **Program.species is String? not Json** — spec said Json but schema has `String?`. Minor, doesn't affect aggregation.
4. No architecture or protocol conflicts detected.

## Implementation Plan

1. Create `lib/intelligence/expense-aggregations.ts` with 9 aggregation functions
2. Create 8 client chart components in `app/(protected)/intelligence/components/`
3. Rewrite `app/(protected)/intelligence/page.tsx` to use real data
4. Add fiscal year selector via URL param
