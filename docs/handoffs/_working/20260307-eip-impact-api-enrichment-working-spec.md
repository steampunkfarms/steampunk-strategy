# Working Spec: EIP-C Impact API Enrichment

**Handoff ID:** `20260307-eip-impact-api-enrichment`
**Date:** 2026-03-07

## Strategy Session Template

1. **What is the business goal?** Enrich the existing impact API with species-level data from ProductSpeciesMap + CostTracker. Enable Rescue Barn to consume impact data publicly via Bearer token auth. Power donor-facing "how your gift helped" transparency.
2. **Which repos are touched?** steampunk-strategy (API enrichment + dual auth) + steampunk-rescuebarn (ImpactDisplay component).
3. **What data flows change?** New: Rescue Barn → TARDIS `/api/impact/[programSlug]` (public via Bearer token). Existing internal flow unchanged.
4. **Who are the users?** Public website visitors on Rescue Barn seeing program impact data.
5. **What are the risks?** Low-medium — cross-site, but read-only. No schema changes, additive logic.

## Cross-Site Impact Checklist

- [ ] Studiolo — not touched (donor attribution deferred)
- [ ] Postmaster — not touched
- [ ] Cleanpunk Shop — not touched
- [x] TARDIS (steampunk-strategy) — enrich impact API, add dual auth, add middleware exclusion
- [x] Rescue Barn (steampunk-rescuebarn) — new tardis.ts utility, ImpactDisplay component, wire into programs page
- [ ] Orchestrator — not touched

## Family Planning Protocol Gate

- **Major Initiative?** No — 2 repos but simple cross-site read-only pattern already established.
- **Novel Pattern?** No — follows existing Postmaster public API + TARDIS Bearer token patterns.
- **Gate result:** PASS — Tier 2 execution.

## Reversibility Score

- **Score:** HIGH
- **Rollback method:** Revert impact route to session-only auth, delete Rescue Barn component.
- **Data risk:** None — no schema changes, read-only cross-site.

## Sanity Pass Findings

1. **Existing impact API:** Already has period parsing, category/vendor breakdown, species from Program model. CONFIRMED.
2. **ProductSpeciesMap available:** Can query by programId to get all mapped products + species. CONFIRMED.
3. **CostTracker available:** Vendor-scoped, has item/itemGroup/unitCost. No direct Program FK — linking through vendorId on transactions. CONFIRMED.
4. **Rescue Barn pattern:** Uses ISR fetch for cross-site data (postmaster.ts pattern). No INTERNAL_SECRET — uses public endpoints. CONFIRMED.
5. **Middleware exclusions:** `/api/raiseright/stats` already excluded for public access. Add `/api/impact` similarly. CONFIRMED.
6. **Dual auth pattern:** `/api/costs/ingest` already uses Bearer INTERNAL_SECRET check. CONFIRMED.

## Implementation Plan

### steampunk-strategy (2 files modified)

1. `app/api/impact/[programSlug]/route.ts` — MODIFY:
   - Add dual auth: session OR Bearer INTERNAL_SECRET
   - Add `?scope=public` query param support (strips sensitive fields for public consumers)
   - Add species breakdown from ProductSpeciesMap entries for this program
   - Add CostTracker item summary (items purchased, quantities, price trends)

2. `middleware.ts` — MODIFY:
   - Add `/api/impact` to excluded paths

### steampunk-rescuebarn (3 files created/modified)

1. `src/lib/tardis.ts` — NEW: Cross-site fetch utility (following postmaster.ts pattern)
2. `src/components/programs/impact-display.tsx` — NEW: Server component showing program impact data
3. `src/app/programs/[slug]/page.tsx` — MODIFY or CREATE: Wire ImpactDisplay into program detail page
