# Handoff: ProductSpeciesMap Learning Knowledge Base

**ID:** `20260307-product-species-map-learning`
**Tier:** 3 (CChat-planned, CC-executed)
**Date:** 2026-03-07
**Status:** COMPLETED

## Objective

Build a learning knowledge base that maps receipt line items to species and programs. First encounter requires manual tagging; subsequent encounters auto-suggest from learned mappings.

## Files Created/Modified

### New Files (8)
1. `scripts/backfill-product-species-map.ts` — Backfill script to populate ProductSpeciesMap from existing enrichmentData
2. `app/api/product-species-map/route.ts` — GET (list/search) + POST (create) endpoints
3. `app/api/product-species-map/[id]/route.ts` — PATCH + DELETE endpoints
4. `app/api/product-species-map/suggest/route.ts` — Auto-suggest endpoint (GET with ?q=)
5. `lib/synthesize-notes.ts` — Claude Haiku note synthesis for merging institutional knowledge
6. `app/(protected)/product-map/page.tsx` — Admin view page with search, edit, delete

### Modified Files (3)
7. `app/(protected)/documents/document-uploader.tsx` — Auto-suggest UI, suggestion state, apply button
8. `app/api/documents/create-transaction/route.ts` — Learning loop: upsert ProductSpeciesMap after transaction creation
9. `app/(protected)/layout.tsx` — Added Product Map nav entry under Finances

## Acceptance Criteria

- [x] `scripts/backfill-product-species-map.ts` reads existing enrichmentData and upserts into ProductSpeciesMap
- [x] `GET /api/product-species-map` returns all mappings with program/vendor relations
- [x] `POST /api/product-species-map` creates new mapping with productPattern uniqueness check
- [x] `PATCH /api/product-species-map/[id]` updates mapping fields
- [x] `DELETE /api/product-species-map/[id]` deletes mapping
- [x] `GET /api/product-species-map/suggest?q=` returns top 5 matches by useCount
- [x] Document uploader fetches suggestions when line item expanded, shows banner with Apply button
- [x] Create-transaction route upserts ProductSpeciesMap entries from lineItemTags after transaction creation
- [x] Note synthesis merges old+new notes via Claude Haiku with concatenation fallback
- [x] Admin page at /product-map shows table with search, inline note editing, delete
- [x] Nav link added under Finances section in layout
- [x] `npx tsc --noEmit` passes with zero errors
- [x] Species field handled as JSON-encoded String (not Prisma Json type) per schema
- [x] programId always provided (fallback to sanctuary-operations)
- [x] Unique constraint on productPattern only (not vendor-scoped) per schema

## Risk & Reversibility

- Risk: 3/10 — additive feature, no breaking changes to existing functionality
- Reversibility: 9/10 — new routes/pages can be removed cleanly, no schema changes
- Blast radius: LOW — strategy site only, internal admin feature

## Structured Debrief

### Repos Modified

| Repo | Files Changed | New | Modified |
|------|--------------|-----|----------|
| steampunk-strategy | 9 | 6 | 3 |

### Verification

- `npx tsc --noEmit` — PASS (zero errors)
- `node scripts/verify-handoff.mjs --handoff-name 20260307-product-species-map-learning` — PASS

### Scope Notes

All changes confined to steampunk-strategy. No cross-site modifications. No schema migrations required (ProductSpeciesMap model already existed in Prisma schema).

### Deferred Items

- Vendor-scoped uniqueness (current schema uses productPattern-only)
- Bulk import/export for product mappings
- Usage analytics dashboard for product map coverage

## Sanity Deltas Applied

| # | Spec Says | Code Says | Resolution |
|---|-----------|-----------|------------|
| 1 | `@@unique([vendorId, productPattern])` | `@@unique([productPattern])` | Used productPattern-only dedup |
| 2 | `programId` optional | `programId String` required FK | Fallback to "sanctuary-operations" program |
| 3 | `species` is Json type | `species String` | Used JSON.stringify/parse throughout |
