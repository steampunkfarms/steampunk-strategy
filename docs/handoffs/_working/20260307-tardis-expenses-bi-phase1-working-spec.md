# Working Spec: EXP-1 — Expenses Page Analytics Upgrade

**Handoff ID:** `20260307-tardis-expenses-bi-phase1`
**Date:** 2026-03-07

## Strategy Session Template

1. **What is the business goal?** Expenses page is a flat transaction list. No visual analytics, no drill-downs, no strategic insight. Can't answer "where is money going?" without manual spreadsheet work.
2. **Which repos are touched?** steampunk-strategy only.
3. **What data flows change?** None — reads existing data via expense-aggregations.ts.
4. **Who are the users?** Farm operator using TARDIS for financial oversight.
5. **What are the risks?** Low — additive UI upgrade, no schema changes.

## Cross-Site Impact Checklist

- [x] TARDIS (steampunk-strategy) — expenses page analytics sections
- [ ] All others — not touched

## Family Planning Protocol Gate

- **Major Initiative?** No — single repo, UI-only.
- **Novel Pattern?** No — reuses BI-0 chart library + existing aggregation functions.
- **Gate result:** PASS — Tier 2 execution.

## Reversibility Score

- **Score:** HIGH
- **Rollback method:** Revert expenses page to current state. No schema changes.
