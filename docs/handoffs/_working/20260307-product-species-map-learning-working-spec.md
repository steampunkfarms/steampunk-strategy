# Working Spec: ProductSpeciesMap Learning Knowledge Base

**Handoff ID:** `20260307-product-species-map-learning`
**Tier:** 3 (CChat-planned, CC-executed)
**Date:** 2026-03-07
**Repos:** steampunk-strategy only

## Strategy Session Template

### Problem Statement
Receipt line items (e.g., "DuMOR 14% Game Bird Crumble") need to be tagged with species and programs for cost attribution. Currently this is manual per-upload. The farm has ~50-100 recurring products — once tagged, they should auto-suggest on future encounters.

### Scope
- Backfill existing enrichmentData into ProductSpeciesMap
- CRUD API for managing mappings
- Auto-suggest endpoint for document-uploader
- Learning loop in create-transaction to upsert mappings
- Note synthesis via Claude for institutional knowledge
- Admin view page under /product-map

### Out of Scope
- Vendor-scoped unique constraints (current schema is productPattern-only unique)
- Automatic species detection without user confirmation
- Changes to Prisma schema (model already exists)

## Family Planning Protocol Gate

- [x] Single repo (steampunk-strategy) — no cross-site impact
- [x] No auth changes
- [x] No schema migration needed (model already in schema)
- [x] No env var additions required

## Risk & Reversibility

- Risk: 3/10 — additive feature, no breaking changes
- Reversibility: 9/10 — new routes/pages can be removed cleanly
- Blast radius: LOW — strategy site only, internal admin feature

## Spec Sanity Deltas

| # | Spec Says | Code Says | Resolution |
|---|-----------|-----------|------------|
| 1 | `@@unique([vendorId, productPattern])` | `@@unique([productPattern])` — vendor not in unique | Use productPattern-only dedup in all upsert logic |
| 2 | `programId` optional | `programId String` required FK | Use "sanctuary-operations" as fallback when no program match |
| 3 | `species` is Json type | `species String` (JSON-encoded string) | Use `JSON.stringify()`/`JSON.parse()` throughout |

## Implementation Plan

### Step 1: Backfill Script
- `scripts/backfill-product-species-map.ts`
- Query Documents with enrichmentData, extract lineItemTags/lineItemPrograms
- Upsert into ProductSpeciesMap with dedup on productPattern

### Step 2: CRUD API + Suggest
- `app/api/product-species-map/route.ts` — GET (list) + POST (create)
- `app/api/product-species-map/[id]/route.ts` — PATCH + DELETE
- `app/api/product-species-map/suggest/route.ts` — GET with ?q= for auto-suggest

### Step 3: Wire Auto-Suggest into Document Uploader
- Fetch suggestions on line item focus/change
- Pre-fill species tags and program from matching ProductSpeciesMap

### Step 4: Learning Loop in create-transaction
- After transaction creation, upsert ProductSpeciesMap entries from lineItemTags
- Increment useCount, update lastUsed

### Step 5: Note Synthesis Helper
- `lib/synthesize-notes.ts` — merge old + new notes via Claude Haiku
- Used by learning loop when existing mapping has different notes

### Step 6: Admin View Page
- `app/(protected)/product-map/page.tsx`
- Table view with search, edit, delete
- Add nav link under Finances section in layout.tsx

## Cross-Site Impact Checklist

- [x] Single repo (steampunk-strategy) — no sibling repos modified
- [x] No shared auth changes
- [x] No shared database/schema changes
- [x] No shared env var additions
- [x] No Orchestrator job registration needed
- [x] No Postmaster/Studiolo/RescueBarn/Cleanpunk changes

## Structured Debrief

### Claim -> Evidence Table

| # | Claim | Evidence |
|---|-------|----------|
| 1 | Backfill script reads enrichmentData | `scripts/backfill-product-species-map.ts` queries `prisma.document.findMany({ where: { enrichmentData: { not: null } } })` |
| 2 | CRUD GET lists with search | `app/api/product-species-map/route.ts` GET with optional `?q=` param, `contains` + `mode: 'insensitive'` |
| 3 | CRUD POST creates with uniqueness check | `app/api/product-species-map/route.ts` POST checks `findUnique({ where: { productPattern } })`, returns 409 on conflict |
| 4 | PATCH updates fields | `app/api/product-species-map/[id]/route.ts` PATCH builds dynamic `data` object |
| 5 | DELETE removes mapping | `app/api/product-species-map/[id]/route.ts` DELETE calls `prisma.productSpeciesMap.delete` |
| 6 | Suggest returns top 5 | `app/api/product-species-map/suggest/route.ts` `take: 5`, `orderBy: { useCount: 'desc' }` |
| 7 | Auto-suggest fires on expand | `document-uploader.tsx` useEffect on `expandedLineItem` fetches `/api/product-species-map/suggest` |
| 8 | Apply button fills species+program | `document-uploader.tsx` `applySuggestion()` sets lineItemTags, lineItemPrograms, lineItemNotes |
| 9 | Learning loop upserts after transaction | `create-transaction/route.ts` iterates `overrides.lineItemTags`, upserts ProductSpeciesMap per line item |
| 10 | Note synthesis uses Claude Haiku | `lib/synthesize-notes.ts` calls `claude-haiku-4-5-20241022` with concatenation fallback |
| 11 | Admin page at /product-map | `app/(protected)/product-map/page.tsx` with table, search, edit, delete |
| 12 | Nav link added | `app/(protected)/layout.tsx` added `{ name: 'Product Map', href: '/product-map', icon: Tags }` under Finances |
| 13 | tsc clean | `npx tsc --noEmit` passes with zero errors |
| 14 | species handled as String | All code uses `JSON.stringify()`/`JSON.parse()` for species field |
| 15 | programId always provided | Backfill + learning loop fallback to "sanctuary-operations" program |

### Repos Modified

| Repo | Files | Evidence |
|------|-------|---------|
| steampunk-strategy | 11 (8 new, 3 modified) | See handoff spec file list |

### Sanity Deltas Applied
3 deltas — unique constraint scope, required programId, String species type (see table above)

### Deferred Items
- Vendor-scoped uniqueness (current schema uses productPattern-only)
- Bulk import/export for product mappings
- Usage analytics dashboard for product map coverage
