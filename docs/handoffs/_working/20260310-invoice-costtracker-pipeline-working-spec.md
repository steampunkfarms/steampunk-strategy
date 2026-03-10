# Working Spec: Invoice → CostTracker Promotion Pipeline

**Handoff ID:** 20260310-invoice-costtracker-pipeline
**Tier:** 3 (CChat-designed, CC-executed)
**Source:** `/Users/ericktronboll/Projects/HANDOFF-tardis-invoice-costtracker-pipeline.md`
**Target repos:** steampunk-strategy (primary), steampunk-studiolo (sync consumer)

## Discovery

Examined existing Elston's pipeline:
- `scripts/import-elstons-2025.ts` imports historical invoices as Transactions + CostTracker entries
- `app/api/cost-tracker/record/route.ts` auto-calculates sequential + YoY + seasonal comparisons
- `lib/vendor-match.ts` and `lib/item-match.ts` handle normalization
- Document parse at `app/api/documents/parse/route.ts` extracts structured JSON but does NOT auto-promote to CostTracker
- Vet vendors (herd-health-management, dairy-health-services, irvine-valley-vet) not in vendor-match.ts yet
- Studiolo reads costs via `lib/costs/get-cost-of-care.ts` → CostOfCareItem table (separate DB)

## Sanity Delta

- Handoff suggests `InvoiceLineItem.documentId` as a plain string. Changed to a proper Prisma relation (`Document @relation`).
- Handoff suggests creating CostTracker entries directly. Instead, reuse existing `POST /api/cost-tracker/record` endpoint which already handles sequential/YoY/seasonal — call it internally to avoid duplicating logic.
- Studiolo sync: separate databases confirmed. Using Option B (sync cron).

## Status: IN PROGRESS
