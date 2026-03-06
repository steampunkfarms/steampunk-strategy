# Working Spec: 20260306-postmaster-engagement-hmac

## Status: COMPLETE

## Discovery

### Outbound Webhook Call Sites (Postmaster -> Studiolo)

| File | Function | Method | Purpose |
|------|----------|--------|---------|
| `lib/engagementScanner.ts` | `pushToStudiolo()` | POST | Push SHARE_INTENT / DONATION_CLAIM engagement signals |
| `lib/donorSync.ts` | `fetchDonorProfiles()` | GET | Fetch donor profiles for local CTA generation |
| `lib/wishlistEnrichment.ts` | `pushWishlistGiftToStudiolo()` | POST | Push WISHLIST_GIFT events |
| `app/api/command-center/wishlist-receipts/donor-search/route.ts` | GET handler proxy | GET | Search Studiolo donors on behalf of UI |

### Pre-Existing Auth Pattern

All four call sites used a plain `X-Webhook-Secret` header containing `SHARED_WEBHOOK_SECRET`. This is a shared-secret bearer approach -- no payload binding, no replay protection.

### Inbound Webhooks (third-party)

- Patreon: uses `X-Patreon-Signature` (HMAC-MD5, Patreon's own scheme)
- PayPal: uses PayPal's cert-based RSA verification

These are third-party contracts and were NOT modified.

## Design Decisions

1. **HMAC-SHA256 over `${timestamp}.${body}`** -- industry-standard Stripe-like pattern.
2. **Replay protection**: 300-second (5 min) timestamp drift window.
3. **Backward compatibility**: `buildSignedHeaders()` emits BOTH the new `X-Webhook-Signature` + `X-Webhook-Timestamp` headers AND the legacy `X-Webhook-Secret` header. Receivers that haven't upgraded yet continue to work.
4. **Secret resolution**: `WEBHOOK_SIGNING_SECRET` env var preferred; falls back to `SHARED_WEBHOOK_SECRET`.
5. **Verification utility exported**: `verifySignature()` and `verifyWebhookRequest()` are ready for Studiolo's receiver to import or replicate.

## Files Modified

### steampunk-postmaster (5 files)

| File | Change |
|------|--------|
| `lib/webhook-hmac.ts` | **NEW** -- HMAC signing/verification utility |
| `lib/engagementScanner.ts` | Import `buildSignedHeaders`, replace plain header auth in `pushToStudiolo()` |
| `lib/donorSync.ts` | Import `buildSignedHeaders`, replace plain header auth in `fetchDonorProfiles()` |
| `lib/wishlistEnrichment.ts` | Import `buildSignedHeaders`, replace plain header auth in `pushWishlistGiftToStudiolo()` |
| `app/api/command-center/wishlist-receipts/donor-search/route.ts` | Import `buildSignedHeaders`, replace plain header auth in Studiolo proxy |
| `.env.example` | Add `WEBHOOK_SIGNING_SECRET` documentation |

### steampunk-strategy (2 files, docs only)

| File | Change |
|------|--------|
| `docs/handoffs/_working/20260306-postmaster-engagement-hmac-working-spec.md` | This file |
| `docs/handoffs/20260306-postmaster-engagement-hmac.md` | Final handoff spec |
