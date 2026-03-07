# Working Spec: EIP-B Auto-Allocation Engine

**Handoff ID:** `20260307-eip-auto-allocation`
**Date:** 2026-03-07

## Strategy Session Template

1. **What is the business goal?** Auto-assign programId + functionalClass to transactions based on line item species mappings, category defaults, and vendor history.
2. **Which repos are touched?** steampunk-strategy only.
3. **What data flows change?** Internal: allocation feeds program tagging for impact API. No external changes.
4. **Who are the users?** Farm operator reviewing transactions in TARDIS.
5. **What are the risks?** Low — single repo, no schema changes, additive logic only.

## Cross-Site Impact Checklist

- [ ] Studiolo — not touched
- [ ] Postmaster — not touched
- [ ] Cleanpunk Shop — not touched
- [x] TARDIS (steampunk-strategy) — allocation engine, validation, create-transaction integration
- [ ] Rescue Barn — not touched
- [ ] Orchestrator — not touched

## Family Planning Protocol Gate

- **Major Initiative?** No — single repo, additive logic, follows EIP pipeline.
- **Novel Pattern?** No — extends existing ProductSpeciesMap + create-transaction flow.
- **Gate result:** PASS — Tier 2 execution.

## Reversibility Score

- **Score:** HIGH
- **Rollback method:** Delete new lib files + revert create-transaction route changes.
- **Data risk:** None — no schema changes, allocation data stored in existing fields.

## Sanity Pass Findings

1. **EIP-A complete:** ProductSpeciesMap CRUD routes exist, suggest endpoint works, learning loop in create-transaction. CONFIRMED.
2. **lib/item-match.ts exists:** Maps line item descriptions to CostTracker slugs. Does NOT map to programs. CONFIRMED.
3. **ExtractedReceipt type:** Includes lineItems, tax, shipping, discount, subtotal, total, amountPaid. CONFIRMED.
4. **Transaction schema ready:** Has programId (FK to Program) and functionalClass fields. CONFIRMED.
5. **ExpenseCategory has functionalClass:** Default class per category. CONFIRMED.
6. **Program model exists:** With slug, name, functionalClass default. CONFIRMED.
