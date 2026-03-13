# Working Spec: Email Inbound → TARDIS Routing

**Handoff ID:** 20260312-email-inbound-tardis-routing
**Tier:** 2 (Standard)
**Repos:** steampunk-rescuebarn (primary), steampunk-strategy (TARDIS endpoint)
**Date:** 2026-03-12
**Status:** ✅ IMPLEMENTED

---

## Problem

Rescue Barn's Resend inbound webhook (`src/app/api/email/inbound/route.ts`) handles all @steampunkfarms.org email. Financial emails (invoices, receipts, order confirmations) were forwarded to Gmail, then picked up by TARDIS on a daily cron. This created a 24-hour delay and Gmail dependency.

## Solution

Added two new routing branches to the Rescue Barn inbound webhook, inserted BEFORE existing forwarding/triage logic:

1. **Spam blacklist check** — drops silently if sender is blacklisted (3+ strikes)
2. **Financial sender match** — POSTs to TARDIS `/api/webhooks/email-inbound` for real-time Transaction + Document creation

All existing routing (AI triage for thebarn@, personal forwards, functional forwards) is unchanged.

## Files Created

### steampunk-strategy
- `app/api/webhooks/email-inbound/route.ts` — TARDIS intake endpoint (auth, vendor match, classify, extract amount, create Transaction/Document, dedup, DonorArrangement flag, RaiseRight handling, audit log)

### steampunk-rescuebarn
- `src/lib/email/financial-sender-match.ts` — ~30 known vendor/financial sender domains + subject keyword fallback
- `src/lib/email/spam-filter.ts` — Three-strike blacklist (checkSpamSender + recordSpamStrike)
- `supabase/migrations/018_spam_senders.sql` — Table with RLS, indexes, computed domain column

## Files Modified

### steampunk-rescuebarn
- `src/app/api/email/inbound/route.ts` — Added imports, TARDIS_URL env var, spam check + TARDIS routing branches

## Acceptance Criteria

- [x] Financial emails from known vendor senders are POSTed to TARDIS in real time
- [x] TARDIS creates Transaction + Document records from the email payload
- [x] Existing AI triage for thebarn@ is unaffected
- [x] Existing personal/functional forwarding is unaffected
- [x] Spam filter checks before any routing; blacklisted senders are dropped
- [x] Unknown senders still forward to Gmail (catch-all unchanged)
- [x] Duplicate emails (same Resend email_id) don't create duplicate transactions
- [x] Email bodies sandboxed as untrusted data in processing
- [x] gmail-receipt-scan cron continues to work as safety net

## Operator Actions Completed

- [x] Run Supabase migration 018_spam_senders.sql
- [x] Set TARDIS_URL env var in Rescue Barn Vercel
- [x] Verify INTERNAL_SECRET matching in TARDIS Vercel
