# Handoff: 20260306-middleware-signin-hardening

## Status: COMPLETE

## Objective

Tighten auth middleware and sign-in domain validation across 3 apps (Postmaster, Studiolo, Rescue Barn) per cross-site-audit M2, M3, M4.

## Target Repos

| Repo | Files Modified | Auth Stack |
|------|---------------|------------|
| steampunk-postmaster | 1 (`lib/auth.ts`) | NextAuth + Azure AD |
| steampunk-studiolo | 1 (`lib/auth.ts`) | NextAuth + Azure AD |
| steampunk-rescuebarn | 1 (`src/app/auth/callback/route.ts`) | Supabase Auth |

**Total files modified: 3 (across 3 repos)**

## Sanity Delta Applied

Rescue Barn uses Supabase auth for community members (volunteers, fosters, transport drivers), not NextAuth. Blocking sign-in by domain would break community auth. Adapted approach: community sign-in remains open; admin role is domain-gated instead. This is a minimal, risk-reducing deviation that does not expand scope.

## Changes

### Postmaster: `lib/auth.ts`
- Added `signIn` callback to NextAuth config
- Validates email domain against `steampunkfarms.org`
- Allows exact match for `steampunkfarms@gmail.com`
- Dev bypass: `NODE_ENV !== 'production'`

### Studiolo: `lib/auth.ts`
- Replaced `return true` in signIn callback with domain allowlist
- Same validation logic: `@steampunkfarms.org`, exact `steampunkfarms@gmail.com`, dev bypass

### Rescue Barn: `src/app/auth/callback/route.ts`
- Added `isAdminEligible()` helper function
- Rejects sign-in if no email present (safety net)
- After profile/role upsert, strips admin role from non-eligible emails
- Dev bypass: `NODE_ENV !== 'production'`

## Acceptance Criteria

| Claim | Evidence |
|-------|----------|
| Postmaster signIn validates domain | `lib/auth.ts` lines 23-37 |
| Studiolo signIn validates domain | `lib/auth.ts` lines 20-35 |
| Rescue Barn admin role domain-gated | `src/app/auth/callback/route.ts` lines 10-16, 74-80 |
| Dev bypass requires NODE_ENV !== production | All 3 files use `process.env.NODE_ENV !== 'production'` |
| Postmaster tsc --noEmit passes | Zero errors |
| Studiolo tsc --noEmit passes | Zero errors |
| Rescue Barn tsc --noEmit passes | Zero errors |

## Deferred

- Proxy PUBLIC_PREFIXES in Postmaster `proxy.ts` reviewed and found already minimal -- no changes needed.
- Studiolo `middleware.ts` already uses `getToken()` for JWT verification -- no changes needed.
- Rescue Barn `src/proxy.ts` already uses Supabase session + route protection table -- no changes needed.
