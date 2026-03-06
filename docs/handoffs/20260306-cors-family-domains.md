# Handoff: 20260306-cors-family-domains

## Status: COMPLETE

## Objective

Replace wildcard CORS on Postmaster public resident API routes with a family-domain allowlist for `*.steampunkfarms.org`. Allow localhost in development. Add `Vary: Origin` header for correct CDN caching.

## Target Repos

- **steampunk-postmaster** (code changes)
- **steampunk-strategy** (docs only)

## Files Modified

### steampunk-postmaster (3 files)

| File | Action |
|------|--------|
| `lib/cors.ts` | Created — shared CORS helper with `isAllowedOrigin()` and `applyCorsHeaders()` |
| `app/api/public/residents/route.ts` | Updated — replaced inline wildcard CORS with `applyCorsHeaders()` call |
| `app/api/public/residents/[name]/route.ts` | Updated — replaced inline wildcard CORS with `applyCorsHeaders()` call |

### steampunk-strategy (2 files, docs only)

| File | Action |
|------|--------|
| `docs/handoffs/_working/20260306-cors-family-domains-working-spec.md` | Created |
| `docs/handoffs/20260306-cors-family-domains.md` | Created (this file) |

## Acceptance Criteria

- [x] No wildcard `Access-Control-Allow-Origin: *` remains on public resident routes
- [x] `*.steampunkfarms.org` origins are allowed in all environments
- [x] `localhost` origins are allowed only when `NODE_ENV !== 'production'`
- [x] `Vary: Origin` header is set on all responses from public resident routes
- [x] `npx tsc --noEmit` passes with zero errors
- [x] Shared CORS helper at `lib/cors.ts` is used by both route files

## Verification Results

- `npx tsc --noEmit`: passed (zero errors)
- Grep for wildcard CORS in route files: no matches (confirmed removed)
- Grep for `applyCorsHeaders` in route files: present in both
- Grep for `Vary`, `steampunkfarms.org`, `localhost` in `lib/cors.ts`: all present

## Deferred Items

- None. Scope was intentionally narrow.

## Notes

- The CORS helper does not set `Access-Control-Allow-Origin` at all when the origin is not on the allowlist. This means browsers will block cross-origin requests from unauthorized domains (the default-deny behavior we want).
- `Vary: Origin` is always set regardless of whether the origin matched, ensuring CDN caches never serve a response with one origin's CORS header to a different origin.
