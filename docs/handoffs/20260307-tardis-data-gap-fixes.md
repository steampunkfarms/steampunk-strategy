# Handoff: Data Gap Fixes — Bulk Convert, MBOX Parser, Gmail Backfill, Gap Audit, Favicon

**ID:** `20260307-tardis-data-gap-fixes`
**Tier:** 2
**Status:** COMPLETE
**Date:** 2026-03-07

## Objective

Close the data gap in TARDIS: Documents with parsed receipts have no linked Transactions, historical Gmail receipts are uncaptured, and analytics show $789 when actual spending is 10x+. Provides bulk conversion tools, historical email import, gap auditing, and a TARDIS favicon.

## Repos Modified

### steampunk-strategy (10 files)

1. `lib/create-transaction-from-document.ts` — NEW: Extracted shared function from create-transaction route. Contains all transaction creation logic (vendor matching, category inference, validation, allocation, document linking, enrichment, ProductSpeciesMap learning, journal notes, CostTracker entries, donor-paid bills, audit log). Used by both single and bulk endpoints.

2. `app/api/documents/create-transaction/route.ts` — REWRITTEN: Simplified to thin wrapper calling `createTransactionFromDocument()`.

3. `app/api/documents/bulk-create-transactions/route.ts` — NEW: Session-authenticated endpoint accepting `{ documentIds: string[] }`. Loops through documents calling shared function, returns `{ created, skipped, errors }`.

4. `scripts/parse-mbox-expenses.ts` — NEW: CLI script for parsing Gmail MBOX exports. Splits MBOX, classifies financial emails, matches vendors via VENDOR_MAP, extracts amounts, deduplicates, creates Transaction records. Supports `--dry-run`. Usage: `npm run parse:mbox -- --file /path/to/expenses.mbox`

5. `scripts/audit-document-gap.ts` — NEW: Gap audit script showing document status breakdown, orphaned documents (parsed but no linked transaction), transaction source distribution. Supports `--fix` to auto-create transactions. Usage: `npm run audit:docs`

6. `app/api/documents/gmail-backfill/route.ts` — NEW: Session-authenticated endpoint for Gmail API date-range backfill. Accepts `{ startDate, endDate?, maxResults? }`. Reuses gmail.ts patterns for vendor matching, amount extraction, dedup. Source tagged `gmail_backfill`.

7. `app/(protected)/documents/documents-client.tsx` — MODIFIED: Added bulk select checkboxes for parsed documents without linked transactions. Select all/deselect all, bulk create button, result display. Green checkmark for documents already linked.

8. `app/(protected)/documents/page.tsx` — MODIFIED: Maps `hasTransaction` field from query results for client component.

9. `lib/queries.ts` — MODIFIED: `getDocuments()` now includes `transactions` relation (take 1) to determine linkage status.

10. `app/icon.svg` — NEW: TARDIS-themed SVG favicon (deep blue panel with brass center, compass-style navigation lines).

11. `package.json` — MODIFIED: Added `parse:mbox` and `audit:docs` scripts.

## Key Decisions

- **Shared function extraction:** All transaction-creation logic centralized in `lib/create-transaction-from-document.ts` to prevent drift between single and bulk endpoints.
- **MBOX over Gmail API for historical data:** MBOX export is more complete for old emails; Gmail API backfill provided as complement for recent gaps.
- **Dedup strategy:** Document-level (throws if document already linked to Transaction) + amount/vendor/date matching in MBOX parser.
- **Source tagging:** `gmail_scan` (cron), `gmail_backfill` (manual API backfill), `mbox-{timestamp}-{index}` (MBOX import) — distinct sources for audit trail.

## Acceptance Criteria

- [x] Shared function extracted, single endpoint still works
- [x] Bulk create endpoint processes array of document IDs
- [x] MBOX parser reads MBOX files, creates Transaction records with dedup
- [x] Gap audit script reports orphaned documents and can auto-fix
- [x] Gmail backfill endpoint accepts date range, creates Transactions with dedup
- [x] Documents page shows bulk select checkboxes and create button
- [x] Favicon renders in browser tab
- [x] `npm run parse:mbox` and `npm run audit:docs` scripts work
- [x] `npx tsc --noEmit` passes with zero errors

## Verification

```
npx tsc --noEmit  # PASS — 0 errors
node scripts/verify-handoff.mjs --handoff-name 20260307-tardis-data-gap-fixes  # PASS
```
