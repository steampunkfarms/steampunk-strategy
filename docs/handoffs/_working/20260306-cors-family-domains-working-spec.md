# Working Spec: 20260306-cors-family-domains

## Status: COMPLETE

## Objective

Replace wildcard CORS (`Access-Control-Allow-Origin: *`) on Postmaster public resident routes with a family-domain allowlist restricted to `*.steampunkfarms.org`, with localhost permitted in development only.

## Discovery

- Two route files use wildcard CORS:
  - `app/api/public/residents/route.ts` (line 162)
  - `app/api/public/residents/[name]/route.ts` (line 59)
- Both set `Access-Control-Allow-Origin: *` and `Access-Control-Allow-Methods: GET` inline.
- No shared CORS utility existed.
- No `Vary: Origin` header was set, which could cause cache poisoning at CDN layer.

## Plan

1. Create `lib/cors.ts` with `isAllowedOrigin()` and `applyCorsHeaders()`.
2. Update both route files to import and use the shared helper.
3. Verify with `tsc --noEmit` and grep checks.

## Implementation Notes

- `FAMILY_DOMAIN_PATTERN`: `/^https?:\/\/([a-z0-9-]+\.)*steampunkfarms\.org$/` matches any subdomain of steampunkfarms.org.
- `LOCALHOST_PATTERN`: `/^https?:\/\/localhost(:\d+)?$/` matches localhost with optional port.
- Localhost is only allowed when `NODE_ENV !== 'production'`.
- `Vary: Origin` is always set to prevent CDN cache poisoning.
- If origin is not on the allowlist, no `Access-Control-Allow-Origin` header is set (browser will block the request).
