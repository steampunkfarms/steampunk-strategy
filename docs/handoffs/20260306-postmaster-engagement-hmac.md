# Handoff: 20260306-postmaster-engagement-hmac

## Milestone

M14 -- HMAC Signature Verification for Engagement Webhook Traffic

## Objective

Harden Postmaster's outbound webhook calls to Studiolo by replacing plain shared-secret header authentication with HMAC-SHA256 payload signing and replay protection.

## Scope

- **Repo:** steampunk-postmaster (code changes)
- **Repo:** steampunk-strategy (docs only)
- **Out of scope:** Studiolo receiver-side verification (separate handoff)

## Contract

### Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Webhook-Signature` | HMAC-SHA256 hex digest of `${timestamp}.${body}` | Payload integrity proof |
| `X-Webhook-Timestamp` | Unix epoch seconds | Replay protection anchor |
| `X-Webhook-Secret` | Raw shared secret (legacy, migration window) | Backward compatibility |

### Verification Algorithm

1. Extract `X-Webhook-Signature` and `X-Webhook-Timestamp` from request headers.
2. Reject if either header is missing.
3. Reject if timestamp is more than 300 seconds from current time.
4. Recompute: `HMAC-SHA256(secret, "${timestamp}.${body}")`.
5. Timing-safe compare recomputed digest against provided signature.
6. Accept if match; reject otherwise.

### Environment Variables

| Var | Required | Fallback |
|-----|----------|----------|
| `WEBHOOK_SIGNING_SECRET` | Recommended | Falls back to `SHARED_WEBHOOK_SECRET` |
| `SHARED_WEBHOOK_SECRET` | Yes (existing) | None |

## Files Changed

### steampunk-postmaster (6 files: 1 new, 5 modified)

| File | Type | Description |
|------|------|-------------|
| `lib/webhook-hmac.ts` | NEW | HMAC signing (`signPayload`, `buildSignedHeaders`) and verification (`verifySignature`, `verifyWebhookRequest`) |
| `lib/engagementScanner.ts` | MODIFIED | Use `buildSignedHeaders` in `pushToStudiolo()` |
| `lib/donorSync.ts` | MODIFIED | Use `buildSignedHeaders` in `fetchDonorProfiles()` |
| `lib/wishlistEnrichment.ts` | MODIFIED | Use `buildSignedHeaders` in `pushWishlistGiftToStudiolo()` |
| `app/api/command-center/wishlist-receipts/donor-search/route.ts` | MODIFIED | Use `buildSignedHeaders` in Studiolo proxy search |
| `.env.example` | MODIFIED | Document `WEBHOOK_SIGNING_SECRET` |

### steampunk-strategy (2 files, docs only)

| File | Type | Description |
|------|------|-------------|
| `docs/handoffs/_working/20260306-postmaster-engagement-hmac-working-spec.md` | NEW | Working spec with discovery notes |
| `docs/handoffs/20260306-postmaster-engagement-hmac.md` | NEW | This handoff spec |

## Scope Isolation

- These changes do NOT touch `app/api/public/residents/` routes (CORS handoff #4 territory).
- Patreon and PayPal webhook receivers were NOT modified (third-party signature contracts).

## Verification

### Claim -> Evidence

| Claim | Evidence |
|-------|----------|
| `npx tsc --noEmit` passes with zero errors | Ran 2026-03-06, zero output (clean) |
| All 4 outbound webhook call sites use `buildSignedHeaders` | `rg buildSignedHeaders` returns 4 call sites + 1 definition |
| `X-Webhook-Signature` header emitted on all outbound calls | Verified via `buildSignedHeaders` return object |
| `X-Webhook-Timestamp` header emitted on all outbound calls | Same |
| Legacy `X-Webhook-Secret` header preserved for migration | Verified in `buildSignedHeaders` return object |
| Replay protection window is 300s | Verified in `verifySignature` constant |
| No files in `app/api/public/residents/` were touched | `git diff` scope check |

## Acceptance Criteria

- [x] `lib/webhook-hmac.ts` exists with `signPayload`, `buildSignedHeaders`, `verifySignature`, `verifyWebhookRequest` exports
- [x] All 4 outbound webhook call sites in Postmaster use `buildSignedHeaders`
- [x] Outbound requests include `X-Webhook-Signature`, `X-Webhook-Timestamp`, and legacy `X-Webhook-Secret` headers
- [x] Replay protection: 300-second drift window in verification
- [x] `WEBHOOK_SIGNING_SECRET` env var documented in `.env.example` with fallback behavior noted
- [x] `npx tsc --noEmit` passes cleanly
- [x] No changes to `app/api/public/residents/` routes
- [x] Patreon and PayPal webhook receivers untouched

## Follow-Up (Deferred)

- Studiolo receiver: adopt `verifySignature` on the receiving end to complete the two-sided contract.
- Remove legacy `X-Webhook-Secret` header from `buildSignedHeaders` after Studiolo receiver is upgraded.
- Add `WEBHOOK_SIGNING_SECRET` to Vercel env vars for production deploy.

## Status: COMPLETE
