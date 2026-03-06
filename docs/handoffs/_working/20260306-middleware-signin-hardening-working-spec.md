# Working Spec: 20260306-middleware-signin-hardening

## Status: IMPLEMENTED

## Objective

Tighten auth middleware and sign-in domain validation across Postmaster, Studiolo, and Rescue Barn per cross-site-audit M2/M3/M4.

## Discovery Findings

### Auth Stacks (confirmed)
- **Postmaster**: NextAuth + Azure AD (`lib/auth.ts`), proxy middleware (`proxy.ts`)
- **Studiolo**: NextAuth + Azure AD (`lib/auth.ts`), middleware (`middleware.ts`)
- **Rescue Barn**: Supabase Auth with OAuth providers (`src/app/auth/callback/route.ts`, `src/proxy.ts`)

### Key Insight: Rescue Barn is Community-Facing
Rescue Barn uses Supabase auth with multiple OAuth providers (Google, GitHub, etc.) for community members (volunteers, fosters, transport drivers). Restricting sign-in to steampunkfarms.org domain would break community auth entirely. The correct approach is admin-role hardening, not sign-in blocking.

### Existing Protections (pre-change)
- Postmaster `proxy.ts`: PUBLIC_PREFIXES already minimal and explicit (/_next, /favicon.ico, /login, /privacy, /terms, /api/auth, /api/public, /api/webhooks, /api/cron)
- Studiolo `middleware.ts`: Already uses `getToken()` for JWT verification on all non-public routes
- Rescue Barn `src/proxy.ts`: Already uses Supabase session refresh + route protection table
- Rescue Barn `src/lib/routes.ts`: Admin routes require "admin" role + "vetted" tier

### Gaps Fixed
1. Postmaster `lib/auth.ts`: No signIn callback at all -- any Azure AD user could sign in
2. Studiolo `lib/auth.ts`: signIn callback returned `true` unconditionally
3. Rescue Barn `src/app/auth/callback/route.ts`: No email validation, no admin role guard

## Allowed Domains
- `@steampunkfarms.org` (Azure AD tenant domain)
- `steampunkfarms@gmail.com` (legacy account, exact match)
- Non-production: all emails allowed (NODE_ENV !== 'production')

## Changes Made

### Postmaster (1 file)
- `lib/auth.ts`: Added signIn callback with domain allowlist

### Studiolo (1 file)
- `lib/auth.ts`: Replaced permissive `return true` with domain allowlist validation

### Rescue Barn (1 file)
- `src/app/auth/callback/route.ts`: Added email-present check, admin-role domain guard with `isAdminEligible()` helper

## Verification
- `npx tsc --noEmit` passed with zero errors in all 3 repos
