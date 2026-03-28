# 20260316 — Stripe → Studiolo Bridge

## Status: COMPLETE

## Objective
Wire Rescue Barn's Stripe webhook to forward successful donation events to Studiolo's unified webhook handler (channel=STRIPE).

## Phase 1 Findings

### Rescue Barn Stripe Webhook
- File: `steampunk-rescuebarn/src/app/api/stripe/webhook/route.ts` (352→422 lines)
- Handles 5 Stripe events; donations filtered by `metadata.source === "rescuebarn_direct"`
- `payment_intent.succeeded`: one-time + first recurring charge. Has donor_email, donor_name, fund_name, campaign_slug, recognize_publicly, resident_name in metadata.
- `invoice.paid`: recurring monthly charges. Retrieves subscription metadata for donor_email, fund_name.
- TODO comments existed at lines 223-224 and 249 — now replaced with live code.

### Studiolo Donations Webhook
- File: `steampunk-studiolo/app/api/webhooks/donations/route.ts` (723 lines)
- Auth: `Bearer ZAPIER_WEBHOOK_SECRET` (constant-time comparison)
- Supports GenericPayload with `source: 'stripe'` → maps to `channel: 'STRIPE'`
- Required fields: `source`, `amount`. Accepts: `email`, `name`, `first_name`, `last_name`, `date`, `campaign`, `frequency`, `transaction_id`
- Dedup: `externalId` check (from `transaction_id`), then same-donor+amount+date
- Post-gift hooks: match eligibility check + receipt/thank-you queuing
- Donor recalc: totals, segment, trend, auto-recovery for recurring

### Cross-Site Pattern
- Rescue Barn → Studiolo: `STUDIOLO_URL` env var + `Bearer ZAPIER_WEBHOOK_SECRET`
- Fire-and-forget pattern established in email inbound handler: try/catch, log, don't block
- Both env vars already exist in Rescue Barn's `.env.local`

## Phase 2 Implementation

### Changes Made (steampunk-rescuebarn)

1. **`src/app/api/stripe/webhook/route.ts`** — Added `forwardToStudiolo()` helper function:
   - Fire-and-forget async POST to `STUDIOLO_URL/api/webhooks/donations`
   - Auth: `Bearer ZAPIER_WEBHOOK_SECRET` (trimmed)
   - 5-second AbortSignal timeout
   - Success: logs giftId + donorId
   - Failure: logs error, never blocks webhook response

2. **`payment_intent.succeeded`** — Replaced TODO with `void forwardToStudiolo()` call:
   - source: "stripe", email, name, amount (dollars), date (from event.created), campaign (fund_name), frequency (monthly if recurring), transaction_id (PaymentIntent ID)

3. **`invoice.paid`** — Replaced TODO with `void forwardToStudiolo()` call:
   - Same pattern, frequency always "monthly", transaction_id is invoice.id

4. **`.env.example`** — Added `ZAPIER_WEBHOOK_SECRET` with description

### No Studiolo Changes Required
The unified webhook already handles `source: 'stripe'` → `channel: 'STRIPE'` via GenericPayload.

## Secondary Task: Benevity Verification

### Status: FULLY IMPLEMENTED & PRODUCTION-READY

- **Route:** `steampunk-studiolo/app/api/import/benevity/route.ts` (600 lines)
- **Format:** Benevity Causes Portal CSV with metadata header rows + data rows
- **Dedup:** Two-level — `benevityImport.disbursementId` (unique) + `gift.benevityTransactionId` (unique)
- **Donor matching:** 4-tier hierarchy (email → learned name → exact name → fuzzy Levenshtein ≤ 2)
- **Gift creation:** Creates personal donation Gift + separate corporate match Gift (with `isMatch: true` + `matchedGiftId` linkage)
- **Employer tracking:** Auto-discovers companies, calculates match ratios, verifies email domains
- **Post-gift hooks:** `afterGiftCreated()` fires for match eligibility + receipt queuing
- **UI:** `BenevityImportPanel.tsx` with file upload, result display, memory cue suggestions
- **No gaps, stubs, or dead code found.** CSV-only interface (Benevity doesn't offer webhooks).

## Acceptance Criteria

- [x] `payment_intent.succeeded` forwards to Studiolo
- [x] `invoice.paid` (recurring) forwards to Studiolo
- [x] Supabase write preserved (both systems get the data)
- [x] Auth uses `ZAPIER_WEBHOOK_SECRET` (what Studiolo webhook expects)
- [x] Stripe PaymentIntent/Invoice ID as transaction_id for deduplication
- [x] Failure to reach Studiolo logged but doesn't break webhook 200 response
- [x] tsc --noEmit clean (exit 0)
- [x] Benevity integration verified — production-ready, no gaps
