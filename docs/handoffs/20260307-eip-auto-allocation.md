# Handoff: EIP-B Auto-Allocation Engine

**ID:** `20260307-eip-auto-allocation`
**Tier:** 2
**Status:** COMPLETE
**Date:** 2026-03-07

## Objective

Create an allocation engine that auto-assigns programId and functionalClass to transactions using a waterfall strategy (species map, category default, vendor history, fallback). Add receipt math validation. Wire both into the create-transaction flow and document review UI.

## Repos Modified

### steampunk-strategy (5 files)

1. `lib/allocation-engine.ts` — NEW: Waterfall allocation engine with 4-step strategy (species_map -> category_default -> vendor_history -> manual fallback). Returns programId, functionalClass, confidence level, method, species tags, and allocable cost components.
2. `lib/receipt-validator.ts` — NEW: Math reconciliation engine. Validates line items sum vs subtotal, subtotal + tax + shipping - discount vs total, total vs amountPaid. Returns errors (hard failures) and warnings (quantity/price sanity).
3. `lib/receipt-validator-client.ts` — NEW: Browser-safe re-export of validateReceipt and ValidationResult type for client components.
4. `app/api/transactions/[id]/allocate/route.ts` — NEW: PATCH endpoint for manual allocation override. Updates programId/functionalClass with audit log.
5. `app/api/documents/create-transaction/route.ts` — MODIFIED: Added allocateTransaction() and validateReceipt() calls between category inference and Transaction creation. Validation errors/warnings added to flags. Allocation sets programId + functionalClass on Transaction. Both logged in audit trail and returned in API response.
6. `app/(protected)/documents/document-uploader.tsx` — MODIFIED: Added client-side receipt validation display in review panel (red for errors, amber for warnings). Added allocation program/method display in done phase. Updated CreateResult interface.

## Key Decisions

- **Waterfall order:** species_map (highest confidence) -> category_default -> vendor_history -> manual (fallback). Species map gets 'high' confidence when all items match one program, 'medium' when multiple programs found.
- **Validation tolerances:** Line items sum: $0.02, tax reconcile: $0.05, total match: $0.01. Quantity >100 or unitPrice >$10,000 triggers warning, not error.
- **Expenses only:** Allocation engine only runs for expense transactions, not income.
- **Client-side preview:** Receipt validation runs in the review panel via useMemo before transaction creation, giving immediate feedback.
- **Audit trail:** Both allocation details and validation results are logged in the audit log entry for every transaction.
- **No schema changes:** Uses existing Transaction.programId and Transaction.functionalClass fields.

## Acceptance Criteria

- [x] Allocation engine implements 4-step waterfall (species_map, category_default, vendor_history, manual)
- [x] Receipt validator checks line items sum, tax reconcile, total match, and quantity/price sanity
- [x] Browser-safe client re-export exists for receipt-validator
- [x] PATCH /api/transactions/[id]/allocate endpoint works with audit logging
- [x] create-transaction route calls validateReceipt() and allocateTransaction() before Transaction creation
- [x] Validation errors/warnings surface as transaction flags
- [x] Allocation sets programId + functionalClass on created Transaction
- [x] Document uploader shows validation warnings/errors in review panel
- [x] Document uploader shows allocation result in done phase
- [x] tsc --noEmit passes (0 errors)

## Verification

- **steampunk-strategy:** `npx tsc --noEmit` — PASS (0 errors)
