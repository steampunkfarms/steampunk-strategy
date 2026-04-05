# Working Spec: Gmail Scanner Deprecation — Event-Driven Email Routing

**Handoff ID:** 20260405-gmail-scanner-deprecation
**Source:** bts-governance/strategist/handoffs/2026-04-05-gmail-scanner-deprecation.md
**Tier:** 2 (Standard) — Cross-repo (rescuebarn, strategy, studiolo, postmaster)

## Sanity Delta

1. **Phase 3 already exists:** Rescuebarn's `extractEmailFromForwardedContent()` (route.ts:73-115)
   already handles forwarded-from-Gmail detection with 4 pattern tiers. CChat proposed a new
   `forwarded-gmail-parser.ts` — we reuse the existing function instead.

2. **Vendor domain gaps:** CChat identified Pirate Ship, Ironwood Pigs, Zelle, Venmo, GoFundMe,
   CashApp missing from rescuebarn. These are added in the new classifier.

3. **Postmaster DonationEmailCache:** Requires a Prisma migration in postmaster. Will add model
   and generate migration.

## Execution Plan

### Phase 1: Rescuebarn Classifier + Dispatch
- [x] `src/lib/email/email-classifier.ts` — multi-category classifier
- [x] `src/lib/email/amazon-filter.ts` — ported from TARDIS lib/gmail.ts
- [x] Update `src/app/api/email/inbound/route.ts` — new dispatch logic

### Phase 2: Downstream Webhook Endpoints
- [x] TARDIS `app/api/webhooks/compliance-inbound/route.ts`
- [x] Studiolo `app/api/webhooks/donation-email/route.ts`
- [x] Studiolo `app/api/webhooks/enrichment-email/route.ts`
- [x] Studiolo `app/api/webhooks/donor-inbox/route.ts`
- [x] Postmaster `app/api/webhooks/donation-email/route.ts` + DonationEmailCache model

### Phase 4: Dual-Path Routing
- [x] Integrated into Phase 1 dispatch logic (parallel fetch calls for dual-destination senders)

### Phase 5: Cutover Prep (Operator Actions)
- [ ] Create email addresses in Resend (expenses-g72e@, donations-5xay@, compliance-vo5x@)
- [ ] Set up Gmail forwarding rules for Google-SSO-locked vendors
- [ ] Update vendor accounts to new @steampunkfarms.org addresses
- [ ] 2-week parallel run monitoring
- [ ] Decommission Gmail scanners (separate handoff after parallel run)

## Acceptance Criteria

1. Rescuebarn classifier correctly categorizes emails from all 25+ sender domains
2. All new webhook endpoints accept InboundEmailPayload and return 200
3. TARDIS compliance-inbound creates ComplianceAlert records
4. Studiolo donation-email creates Gift records with 5-tier donor matching
5. Studiolo enrichment-email applies PayPal/Zeffy/Patreon data
6. Studiolo donor-inbox creates Touch records + AI memory cues
7. Postmaster donation-email stores in DonationEmailCache
8. Dual-path routing sends PayPal/Stripe/Zeffy to both TARDIS and Studiolo
9. Amazon personal filtering preserved exactly
10. All endpoints use INTERNAL_SECRET bearer token auth with timing-safe comparison
11. `tsc --noEmit` passes in all 4 repos
