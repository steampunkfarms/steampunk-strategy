# Working Spec: VEN-1 — Vendor Intelligence Page

**Handoff ID:** `20260307-vendor-intelligence-page`
**Date:** 2026-03-07

## Strategy Session Template

1. **What is the business goal?** Vendors page is a flat list with no analytics. Can't see price trends, delivery reliability, standing arrangements, or program allocation per vendor.
2. **Which repos are touched?** steampunk-strategy only.
3. **What data flows change?** None — reads existing Transaction, CostTracker, VendorDonorArrangement, DonorPaidBill, ProductSpeciesMap data.
4. **Who are the users?** Farm operator using TARDIS for vendor management and negotiations.
5. **What are the risks?** Low — additive UI, no schema changes.

## Cross-Site Impact Checklist

- [x] TARDIS (steampunk-strategy) — vendor detail page, analytics API, vendor list enhancements
- [ ] All others — not touched

## Family Planning Protocol Gate

- **Major Initiative?** No — single repo, UI-only.
- **Novel Pattern?** No — extends existing vendor + BI patterns.
- **Gate result:** PASS — Tier 2 execution.

## Reversibility Score

- **Score:** HIGH
- **Rollback method:** Revert vendor page changes. No schema changes.
