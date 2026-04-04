# Handoff: 20260306-cleanpunk-csrf

## Status: COMPLETE

## Objective
Add CSRF protection to browser-facing mutation endpoints in the Cleanpunk Shop storefront via Origin/Referer header validation.

## Target Repos
- **cleanpunk-shop** (`/Users/ericktronboll/Projects/cleanpunk-shop`) -- code changes
- **steampunk-strategy** (`/Users/ericktronboll/Projects/steampunk-strategy`) -- docs only

## Approach
Origin/Referer validation -- the standard CSRF mitigation for same-origin requests. No token generation needed because all protected endpoints are called by browser JS from the same origin. The `validateCsrf()` function checks the Origin header (preferred) or Referer header (fallback) against an allowlist of production domains, steampunkfarms.org subdomains, Vercel preview URLs, and localhost (dev only).

## Files Changed

### cleanpunk-shop (9 files: 1 created, 8 modified)

| File | Change |
|------|--------|
| `apps/storefront/src/lib/security/csrf.ts` | **CREATED** -- shared CSRF utility with `validateCsrf(request)` |
| `apps/storefront/src/app/api/admin/auth/route.ts` | Added CSRF guard to POST |
| `apps/storefront/src/app/api/cart-email-capture/route.ts` | Added CSRF guard to POST |
| `apps/storefront/src/app/api/b2b/add-to-cart/route.ts` | Added CSRF guard to POST |
| `apps/storefront/src/app/api/b2b/update-cart-item/route.ts` | Added CSRF guard to POST |
| `apps/storefront/src/app/api/b2b/remove-cart-item/route.ts` | Added CSRF guard to POST |
| `apps/storefront/src/app/api/b2b/update-checkout/route.ts` | Added CSRF guard to POST |
| `apps/storefront/src/app/api/b2b/place-order/route.ts` | Added CSRF guard to POST; changed signature from `POST()` to `POST(request: NextRequest)` |
| `apps/storefront/src/app/api/email-subscribe/route.ts` | Added CSRF guard to POST |

### steampunk-strategy (2 files created)

| File | Change |
|------|--------|
| `docs/handoffs/_working/20260306-cleanpunk-csrf-working-spec.md` | Working spec |
| `docs/handoffs/20260306-cleanpunk-csrf.md` | This handoff spec |

## Endpoints Skipped (by design)
- `/api/email-unsubscribe` -- GET-only, no mutation handler
- `/api/cron/*` -- Vercel cron auth, not browser-session
- `/api/webhooks/*` -- signature-verified, not browser-session
- `/api/analytics/*` -- fire-and-forget beacons
- `/api/storms/*` -- admin content management (future pass)
- All other `/api/admin/*` routes -- protected by admin cookie; CSRF for the broader admin surface is a separate future item

## Sanity Deltas Applied
1. **email-unsubscribe skipped**: Spec listed it as a target, but the route only exports GET. No mutation to protect.
2. **place-order signature change**: `POST()` changed to `POST(request: NextRequest)` to access headers for CSRF validation. Safe -- Next.js passes the request argument regardless.

## Allowed Origins (csrf.ts)
- Production: `cleanpunk.com`, `www.cleanpunk.com`, `cleanpunkshop.com`, `www.cleanpunkshop.com`
- Suffix match: `*.steampunkfarms.org`, `*.vercel.app`
- Dev only: `localhost:3000`, `localhost:8000`, `127.0.0.1:3000`, `127.0.0.1:8000`

## Acceptance Criteria
- [x] `validateCsrf()` utility created at `src/lib/security/csrf.ts`
- [x] 8 browser-facing mutation endpoints guard with CSRF check before processing
- [x] CSRF failure returns 403 with descriptive error message
- [x] Cron and webhook routes untouched
- [x] No new TypeScript errors introduced
- [x] No feature/business logic changes

## Verification Commands
```bash
# Confirm CSRF is applied to all target endpoints
cd /Users/ericktronboll/Projects/cleanpunk-shop && rg -n "validateCsrf" apps/storefront/src/

# TypeScript check (pre-existing errors expected; no new ones)
cd /Users/ericktronboll/Projects/steampunk-farms/cleanpunk-shop/apps/storefront && npx tsc --noEmit
```

## Deferred Items
- CSRF for broader admin surface (all `/api/admin/*` routes beyond auth)
- Rate limiting on public mutation endpoints (email-subscribe, cart-email-capture)
- CSRF token approach if any endpoint needs cross-origin POST support
