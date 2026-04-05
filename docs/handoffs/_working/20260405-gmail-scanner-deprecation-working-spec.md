# Working Spec: Gmail Scanner Deprecation — Event-Driven Email Routing

**Handoff ID:** 20260405-gmail-scanner-deprecation
**Source:** bts-governance/strategist/handoffs/2026-04-05-gmail-scanner-deprecation.md
**Tier:** 2 (Standard) — Cross-repo (rescuebarn, strategy, studiolo, postmaster)
**Status:** DEPLOYED — parallel run started 2026-04-05
**Executor:** CC (Claude Code)

---

## Executive Summary

Replaced 7 Gmail API scanner crons (4 scheduled + 3 on-demand) across 3 repos with
event-driven email routing through rescuebarn's Resend inbound handler. The new system
classifies inbound emails into 8 categories and dispatches to TARDIS, Studiolo, and
Postmaster via internal webhooks in real time. Gmail scanners continue running in
parallel for a 2-week validation period.

## Sanity Deltas Applied

1. **Phase 3 already existed:** Rescuebarn's `extractEmailFromForwardedContent()` (route.ts:73-115)
   already handles forwarded-from-Gmail detection with 4 pattern tiers. CChat proposed a new
   `forwarded-gmail-parser.ts` — we reused the existing function instead of creating a new file.

2. **Vendor domain gaps fixed:** Pirate Ship, Ironwood Pigs, Zelle, Venmo, GoFundMe,
   CashApp added to the new classifier (were missing from rescuebarn's original sender list).

3. **Machine route address forwarding:** Initially added expenses-g72e@, donations-5xay@,
   compliance-vo5x@ to the forwarding map skip list. Reversed this so Gmail verification
   emails (and any unclassified emails) fall through to the catch-all and reach
   steampunkfarms@gmail.com. Classified emails are dispatched before reaching the
   forwarding map anyway.

4. **Studiolo schema alignment:** CChat's handoff assumed array-type `secondaryEmails`,
   `address` field, `status` field, and `emailMessageId` on DonorInboxMessage. Actual
   Prisma schema uses `String?` secondaryEmails (contains query), `street1/city/state/zipCode`,
   no status field on Donor, and `gmailMessageId` on DonorInboxMessage. All corrected.

5. **Postmaster DonationEmailCache:** Table was already in sync when `prisma db push` ran —
   Prisma auto-created it during `prisma generate` on Vercel deploy.

## What Was Deployed

### Rescuebarn (hub — classifies and dispatches)

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/email/email-classifier.ts` | NEW (183 lines) | Multi-category classifier: expense, income, compliance, donation_gift, donor_comms, enrichment, engagement, personal |
| `src/lib/email/amazon-filter.ts` | NEW (24 lines) | Amazon personal vs farm card filtering (ported from TARDIS lib/gmail.ts) |
| `src/app/api/email/inbound/route.ts` | MODIFIED (+200 lines) | Hub-and-spoke dispatch replacing single TARDIS-only routing. Parallel fetch to downstream webhooks. Legacy TARDIS fallback preserved. |
| `src/lib/email/forwarding-map.ts` | MODIFIED (+7 lines) | Machine-to-machine address documentation. Unclassified emails fall through to catch-all. |

**Commits:** `3f18ca0` (main feature) + `6f93b7d` (forwarding fix)

### TARDIS / steampunk-strategy (compliance intake)

| File | Action | Purpose |
|------|--------|---------|
| `app/api/webhooks/compliance-inbound/route.ts` | NEW (103 lines) | Receives government/regulatory emails, classifies via existing compliance-scanner.ts, creates ComplianceAlert records |
| `docs/handoffs/_working/20260405-gmail-scanner-deprecation-working-spec.md` | NEW | This file |

**Commit:** `c06301d`

### Studiolo (donations, enrichment, donor correspondence)

| File | Action | Purpose |
|------|--------|---------|
| `app/api/webhooks/donation-email/route.ts` | NEW (218 lines) | Zelle/Venmo/PayPal/GoFundMe/CashApp gift creation. 5-tier donor matching. Auto-confirms exact/learned matches. Stages fuzzy/unknown for review. |
| `app/api/webhooks/enrichment-email/route.ts` | NEW (252 lines) | PayPal fee/address enrichment, Zeffy survey/address enrichment, Patreon event logging |
| `app/api/webhooks/donor-inbox/route.ts` | NEW (172 lines) | Checks sender against donor DB, creates Touch + DonorInboxMessage records, generates AI memory cues via Claude Haiku |

**Commit:** `efad763`

### Postmaster (engagement matching cache)

| File | Action | Purpose |
|------|--------|---------|
| `app/api/webhooks/donation-email/route.ts` | NEW (131 lines) | Caches payment notification emails in DonationEmailCache for social-comment-to-donation correlation by scan-engagement |
| `prisma/schema.prisma` | MODIFIED (+26 lines) | DonationEmailCache model with indexes on receivedAt, paymentMethod, matchedEventId |

**Commit:** `b56a67ea`

## Operator Actions Completed

| # | Action | Status | Notes |
|---|--------|--------|-------|
| 1 | Add `POSTMASTER_URL` env var to rescuebarn Vercel | ✅ Done | `https://postmaster.steampunkstudiolo.org` |
| 2 | Resend inbound address setup | ✅ Not needed | MX records already catch all @steampunkfarms.org. Addresses are routing labels in the classifier. |
| 3a | Gmail filter: vendor expenses → `expenses-g72e@steampunkfarms.org` | ✅ Done | Pirate Ship and other Google-SSO-locked vendors |
| 3b | Gmail filter: donation notifications → `donations-5xay@steampunkfarms.org` | ✅ Done | Zelle, Venmo, GoFundMe, CashApp |
| 3c | Gmail filter: compliance → `compliance-vo5x@steampunkfarms.org` | ✅ Done | IRS, CA FTB, CA SOS, CA AG, Candid, Charity Navigator, etc. |
| 4 | Prisma db push for DonationEmailCache | ✅ Done | Already in sync |
| 5 | Update vendor billing emails to @steampunkfarms.org | ◻️ Ongoing | Non-urgent. Do as vendor accounts are accessed. |

## Architecture: Email Flow (Live)

```
Email arrives at @steampunkfarms.org (via Resend MX)
    OR
Gmail forwards to @steampunkfarms.org (via Gmail filter rules)
        │
        ▼
  rescuebarn /api/email/inbound
        │
        ├─ Webhook verify (svix) → always return 200
        ├─ Domain guard (@steampunkfarms.org only)
        ├─ Fetch full body via Resend API
        ├─ Spam check (blacklist)
        ├─ email-false@ handler (opt-out)
        │
        ├─ Forwarded-from-Gmail? Extract original sender
        ├─ classifyInboundEmail(sender, subject, toAddress)
        │
        ├─ 'expense'      → TARDIS /api/webhooks/email-inbound         [EXISTS]
        ├─ 'income'        → TARDIS /api/webhooks/email-inbound         [EXISTS]
        │                  + Studiolo /api/webhooks/enrichment-email     [NEW]
        │                  + Studiolo /api/webhooks/donation-email       [NEW, PayPal only]
        │                  + Postmaster /api/webhooks/donation-email     [NEW]
        ├─ 'compliance'    → TARDIS /api/webhooks/compliance-inbound    [NEW]
        ├─ 'donation_gift' → Studiolo /api/webhooks/donation-email      [NEW]
        │                  + Postmaster /api/webhooks/donation-email     [NEW]
        ├─ 'enrichment'    → Studiolo /api/webhooks/enrichment-email    [NEW]
        ├─ 'donor_comms'   → Studiolo /api/webhooks/donor-inbox         [NEW]
        ├─ 'engagement'    → Postmaster /api/webhooks/donation-email    [NEW]
        └─ 'personal'      → Legacy TARDIS fallback (if financial sender)
                           → Forwarding map → Gmail
                           → AI triage (thebarn@ only)
```

All dispatches fire in parallel via `Promise.allSettled`. Each downstream webhook
authenticates via `Authorization: Bearer ${INTERNAL_SECRET}` with timing-safe comparison.
A backup copy of every dispatched email is forwarded to steampunkfarms@gmail.com with
a `[CATEGORY]` prefix tag during the parallel run period.

## Email Addresses Created

| Address | Purpose | Gmail Filter Routes To | Downstream |
|---------|---------|----------------------|------------|
| `expenses-g72e@steampunkfarms.org` | Vendor receipts, SaaS billing | Google-SSO-locked vendors | TARDIS |
| `donations-5xay@steampunkfarms.org` | Donation payment notifications | Zelle, Venmo, GoFundMe, CashApp | Studiolo + Postmaster |
| `compliance-vo5x@steampunkfarms.org` | Government/nonprofit regulatory | IRS, FTB, SOS, AG, Candid, etc. | TARDIS compliance |

Addresses are obfuscated with random suffixes to prevent mailbox enumeration. If compromised,
rotate the suffix in: (1) Gmail filter, (2) email-classifier.ts ADDRESS_CATEGORY_MAP,
(3) forwarding-map.ts MACHINE_ROUTE_ADDRESSES documentation. No downstream code changes needed.

## Parallel Run Period

**Started:** 2026-04-05
**Duration:** 2 weeks (until ~2026-04-19)
**What runs simultaneously:**
- Gmail scanner crons (unchanged schedules)
- New email-driven webhooks (real-time)
- Both systems dedup independently by emailId/messageId

**How to verify parity:**
1. Compare TARDIS transaction counts: `source = 'email_inbound'` (webhook) vs `source = 'gmail_scan'` (cron)
2. Compare Studiolo gift counts: `source = 'email-inbound'` (webhook) vs `source = 'gmail-import'` (cron)
3. Check Postmaster DonationEmailCache row count vs Gmail scanner match attempts

**After parity confirmed (separate handoff):**
1. Remove cron entries from vercel.json (3 repos)
2. Remove Gmail OAuth tokens from Vercel env vars (3 repos)
3. Archive scanner code to `_archived/`
4. Update scan-engagement to query DonationEmailCache instead of Gmail API
5. Remove `[CATEGORY]` Gmail backup forwarding from rescuebarn inbound handler

## Acceptance Criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Classifier categorizes emails from all 25+ sender domains | ✅ PASS |
| 2 | All new webhook endpoints accept InboundEmailPayload and return 200 | ✅ PASS |
| 3 | TARDIS compliance-inbound creates ComplianceAlert records | ✅ PASS (deployed) |
| 4 | Studiolo donation-email creates Gift records with 5-tier matching | ✅ PASS (deployed) |
| 5 | Studiolo enrichment-email applies PayPal/Zeffy/Patreon data | ✅ PASS (deployed) |
| 6 | Studiolo donor-inbox creates Touch records + AI memory cues | ✅ PASS (deployed) |
| 7 | Postmaster donation-email stores in DonationEmailCache | ✅ PASS (deployed) |
| 8 | Dual-path routing sends PayPal/Stripe/Zeffy to both TARDIS and Studiolo | ✅ PASS |
| 9 | Amazon personal filtering preserved exactly | ✅ PASS |
| 10 | All endpoints use INTERNAL_SECRET bearer token auth | ✅ PASS |
| 11 | tsc --noEmit passes in all 4 repos | ✅ PASS |

## QA Summary

2026-04-05 QA: PASS | Files: 11 created, 3 modified across 4 repos | tsc: clean
