# Handoff: EIP-C Impact API Enrichment

**ID:** `20260307-eip-impact-api-enrichment`
**Tier:** 2
**Status:** COMPLETE
**Date:** 2026-03-07

## Objective

Enrich the existing `/api/impact/[programSlug]` endpoint with species data from ProductSpeciesMap and cost item data from CostTracker. Add dual auth (session OR Bearer INTERNAL_SECRET) for cross-site consumers. Add public scope mode. Create ImpactDisplay component on Rescue Barn to consume the API.

## Repos Modified

### steampunk-strategy (3 files)

1. `app/api/impact/[programSlug]/route.ts` — MODIFIED: Added dual auth (session OR Bearer INTERNAL_SECRET), `?scope=public` query param support, species enrichment from ProductSpeciesMap (species list + product mappings), CostTracker item summary (items purchased, quantities, avg costs), CORS headers for Rescue Barn, OPTIONS preflight handler. Public scope strips sensitive fields (transaction IDs, vendor slugs, notes).
2. `middleware.ts` — MODIFIED: Added `/api/impact` to public route exclusions.
3. `docs/handoffs/_working/20260307-eip-impact-api-enrichment-working-spec.md` — NEW: Working spec with strategy session template, cross-site checklist, sanity pass findings.

### steampunk-rescuebarn (3 files)

1. `src/lib/tardis.ts` — NEW: Cross-site TARDIS fetch utility following postmaster.ts pattern. Exports `ProgramImpact` interface and `fetchProgramImpact()` with ISR (1-hour revalidation), public scope.
2. `src/components/programs/impact-display.tsx` — NEW: Server component rendering program impact data — summary stats (total spend, purchases, species count), species tags, category breakdown with progress bars, cost tracker items table.
3. `src/app/programs/feral-to-barn-cat/page.tsx` — MODIFIED: Added ImpactDisplay component in Suspense boundary between pipeline steps and sponsor portal sections.

## Key Decisions

- **Dual auth pattern:** Session OR Bearer token, not session AND token. Follows existing `/api/costs/ingest` pattern. Middleware exclusion required so Bearer requests aren't redirected to login.
- **Public scope:** `?scope=public` strips transaction IDs, vendor slugs, product mapping notes, and donor attribution. Safe for public-facing consumers.
- **No INTERNAL_SECRET on Rescue Barn:** Uses unauthenticated `?scope=public` fetch with ISR caching (1 hour). Server-side only — no CORS needed for this pattern, but CORS headers added as safety net for future client-side use.
- **ISR caching:** 1-hour revalidation matches existing raiseright impact page pattern.
- **Graceful degradation:** ImpactDisplay returns null if API fails or no data — Suspense fallback shown during loading, component simply omitted if empty.
- **Species enrichment:** Queries ProductSpeciesMap by programId, not by transaction. This gives all known product-to-species mappings for the program regardless of period.
- **CostTracker:** Aggregated by item + vendor, filtered to the same period as transactions. Shows avg unit cost, total quantity, and unit.

## Acceptance Criteria

- [x] Impact API accepts both session auth and Bearer INTERNAL_SECRET
- [x] Impact API supports `?scope=public` stripping sensitive fields
- [x] Impact API returns species data from ProductSpeciesMap
- [x] Impact API returns CostTracker item summary
- [x] Impact API has CORS headers for Rescue Barn domain
- [x] Impact API has OPTIONS preflight handler
- [x] Middleware excludes `/api/impact` from auth redirect
- [x] Rescue Barn `tardis.ts` utility fetches with ISR caching
- [x] ImpactDisplay component renders summary, species, categories, cost items
- [x] ImpactDisplay gracefully handles missing/empty data (returns null)
- [x] Feral-to-barn-cat page includes ImpactDisplay in Suspense boundary
- [x] tsc --noEmit passes in both repos (0 errors)

## Verification

- **steampunk-strategy:** `npx tsc --noEmit` — PASS (0 errors)
- **steampunk-rescuebarn:** `npx tsc --noEmit` — PASS (0 errors)
