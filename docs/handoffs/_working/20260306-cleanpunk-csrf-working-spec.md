# Working Spec: 20260306-cleanpunk-csrf

## Objective
Add CSRF protection (Origin/Referer validation) to browser-facing mutation endpoints in cleanpunk-shop storefront.

## Discovery

### Mutation Endpoint Inventory
Full grep of `export async function (POST|PUT|PATCH|DELETE)` across `apps/storefront/src/app/api/` revealed 70+ mutation handlers. The scope targets only browser-session endpoints, skipping:
- **Cron routes** (`/api/cron/*`) -- use Vercel cron auth
- **Webhook routes** (`/api/webhooks/*`) -- use signature verification
- **Admin routes** (beyond `/api/admin/auth`) -- protected by admin cookie + will inherit CSRF via admin middleware in a future pass
- **Analytics routes** (`/api/analytics/*`) -- fire-and-forget beacons
- **Storm routes** (`/api/storms/*`) -- admin-only content management

### Sanity Delta: email-unsubscribe
The handoff spec listed `email-unsubscribe` as a target, but it only exports a GET handler (token-based unsubscribe via query param). No POST/mutation exists. Skipped -- no CSRF needed for GET.

### Sanity Delta: place-order signature
`/api/b2b/place-order/route.ts` originally had `POST()` with no request parameter. Changed to `POST(request: NextRequest)` to enable CSRF validation. This is a safe change -- Next.js App Router passes the request regardless; the parameter was simply unused before.

## Implementation Plan
1. Create `src/lib/security/csrf.ts` with `validateCsrf(request)` utility
2. Apply to 8 browser-facing endpoints (listed below)
3. Skip email-unsubscribe (GET only)
4. Verify with tsc --noEmit

## Files Modified

### cleanpunk-shop (8 files modified, 1 file created = 9 total)
- `apps/storefront/src/lib/security/csrf.ts` (CREATED)
- `apps/storefront/src/app/api/admin/auth/route.ts`
- `apps/storefront/src/app/api/cart-email-capture/route.ts`
- `apps/storefront/src/app/api/b2b/add-to-cart/route.ts`
- `apps/storefront/src/app/api/b2b/update-cart-item/route.ts`
- `apps/storefront/src/app/api/b2b/remove-cart-item/route.ts`
- `apps/storefront/src/app/api/b2b/update-checkout/route.ts`
- `apps/storefront/src/app/api/b2b/place-order/route.ts`
- `apps/storefront/src/app/api/email-subscribe/route.ts`

### steampunk-strategy (2 files created)
- `docs/handoffs/_working/20260306-cleanpunk-csrf-working-spec.md`
- `docs/handoffs/20260306-cleanpunk-csrf.md`

## Verification
- Grep for validateCsrf: 8 endpoint files + 1 utility = confirmed
- TypeScript: no new errors (pre-existing React/HeadlessUI type mismatches remain)
