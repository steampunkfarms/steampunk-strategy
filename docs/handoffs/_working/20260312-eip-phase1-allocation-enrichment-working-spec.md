# EIP Phase 1: Bulk Allocation + Enrichment UI

**Handoff ID:** 20260312-eip-phase1-allocation-enrichment
**Tier:** 2 (Standard)
**Repo:** steampunk-strategy

## Discovery

### What exists
- **Schema:** Program model (13 records, some duplicates), ExpenseCategory (13 parents + 58 children, COA codes 5100-8400), Transaction has programId + functionalClass fields
- **Auto-allocation engine:** `lib/allocation-engine.ts` — 4-step waterfall (species map → category default → vendor history → manual)
- **Impact API:** `GET /api/impact/[programSlug]` — aggregates by program
- **Document uploader:** `app/(protected)/documents/document-uploader.tsx` — shows allocation result after create, but no manual species/program tagging during review
- **Programs seed route:** `POST /api/programs/seed` — 7 canonical programs

### Gaps found
1. **Duplicate programs:** 13 in DB instead of 7 (duplicates: soap-production/soap-mercantile, fundraising-outreach/fundraising, pig-program/swine, companion-animals/cats-dogs, sanctuary-ops/sanctuary-operations, barn-cats standalone)
2. **0/1253 transactions allocated:** No programId or functionalClass on any transaction
3. **2 categories missing coaCode:** "Marketing & Outreach", "Social Media Revenue"
4. **No enrichment UI:** Document review doesn't let user tag line items with species/program

## Scope

### Deliverables
1. Script to dedup programs → canonical 7 + barn-cats (keep barn-cats for future Barn Cat Program)
2. Fix 2 categories with null coaCode
3. Bulk allocation script that runs allocation engine against all unallocated transactions
4. Line-item enrichment panel in document-uploader.tsx: species multi-select + program dropdown per line item
5. Programs admin page at `/programs` for viewing/editing program data

### Out of scope
- Cross-site integration (Step 7)
- Seasonal awareness (Real-Cost Impact Lines Step 7)
- Transaction-level coaCode field (can be inferred from category)

## Acceptance Criteria
- [x] Programs consolidated to 8 canonical (7 from seed + barn-cats) — DONE 2026-03-12
- [x] All ExpenseCategory records have non-null coaCode — DONE 2026-03-12
- [x] Bulk allocation assigns programId to transactions where possible (via category default at minimum) — DONE 2026-03-12 (314 allocated, 213 fc-only, 726 need categorization)
- [x] Document review UI shows species/program selectors for line items — already built (document-uploader.tsx lines 1013-1072)
- [x] Programs admin page at /programs lists all programs with edit capability — DONE 2026-03-12 (PATCH /api/programs/[id] + inline edit on ProgramCard)
- [x] `npx tsc --noEmit` passes clean — verified 2026-03-12

## Status: COMPLETE (2026-03-12)
