# Handoff Spec: Credential Registry — Dashboard + Cron Integration

**Handoff ID:** 20260312-credential-registry-dashboard-cron
**Tier:** 2 (Standard)
**Repo:** steampunk-strategy
**Date:** 2026-03-12

---

## Context — What Already Exists

CChat built the foundation in the prior session:

1. **Prisma model** `CredentialRegistry` in `prisma/schema.prisma` — tracks name, slug, provider, category, envMappings (JSON), issuedAt, expiresAt, reminderDays, verification fields (lastVerifiedAt, lastVerifyOk, verifyEndpoint), rotationGuide, rotationUrl, riskLevel (critical/high/medium/low), failureImpact, status, autoRotatable.

2. **Seed script** `scripts/seed-credential-registry.ts` — 18 credentials inventoried across all 6 repos. Run with `npx tsx scripts/seed-credential-registry.ts`. Idempotent (skips existing slugs).

3. **API route** `app/api/credentials/route.ts` — GET endpoint returns all credentials with computed fields: `computedStatus` (derives expiring_soon/expired from dates), `daysUntilExpiry`, `verifyStale` (>7 days since last check), `repoCount`, `envVarCount`, plus a `summary` object with totals by risk/status.

**Schema has been pushed but NOT yet applied to the database.** Operator action #1 below.

---

## Deliverables

### 1. Dashboard Page: `app/(protected)/credentials/page.tsx`

A server component page at `/credentials` showing credential health at a glance.

**Layout:**

**KPI Strip (top row, 4-6 gauge cards):**
- Total credentials (count)
- Critical credentials (count, always show)
- Expiring soon (count, gauge-amber if >0)
- Expired (count, gauge-red if >0)
- Verify failed (count, gauge-red if >0)
- Unverified (count, gauge-blue if >0)

Use the existing gauge pattern from `/bridge` page (status dots: `gauge-green`, `gauge-amber`, `gauge-red`, `gauge-blue`).

**Credential Table:**
Fetch from `GET /api/credentials`. Columns:
- Status dot (green = active + verified, amber = expiring_soon or verifyStale, red = expired or verify failed, blue = unverified)
- Name (linked to rotation URL if present)
- Provider (badge)
- Risk level (badge: critical=red, high=amber, medium=blue, low=gray)
- Category (api_key, oauth_token, webhook_secret, generated_secret, service_account)
- Repos (count with tooltip showing repo names)
- Env vars (count)
- Expires (relative date or "Never")
- Days left (number or "—")
- Last verified (relative date or "Never")
- Failure impact (truncated, expand on hover or row click)

**Sorting:** Default sort by risk level (critical first), then by days until expiry (soonest first). Consider a client-side sort toggle.

**Row expansion or detail panel:** When clicking a credential row, show:
- Full failure impact text
- Rotation guide (rendered as markdown or formatted text)
- Link to rotation URL (opens in new tab)
- List of env var mappings (repo + env var name)
- Last verified date + status
- Notes field

**Styling:** Follow existing TARDIS theme — `tardis-*` blues, `console-*` panels, `brass-*` accents. Reference `app/(protected)/compliance/page.tsx` or `app/(protected)/vendors/page.tsx` for table patterns.

### 2. Sidebar Navigation Entry

In `app/(protected)/layout.tsx`, add to the **Command** group (after Monitoring):

```typescript
{ name: 'Credentials', href: '/credentials', icon: KeyRound },
```

Import `KeyRound` from `lucide-react`.

### 3. Bridge Dashboard Widget

On `app/(protected)/bridge/page.tsx`, add a small credential health summary widget alongside the existing gauge strip. Show:
- Count of expiring/expired credentials (if any)
- Link to `/credentials`
- Only show if there are issues (expiring_soon > 0 or expired > 0 or verifyFailed > 0)

Use a compact card similar to the Captain's Log widget already on the Bridge.

### 4. Health-Check Cron Extension

Modify `app/api/cron/health-check/route.ts` to add a credential expiry sweep:

**New function `checkCredentialHealth()`:**

```typescript
async function checkCredentialHealth(): Promise<{
  expiringSoon: Array<{ name: string; daysLeft: number; riskLevel: string }>;
  expired: Array<{ name: string; riskLevel: string }>;
  verifyFailed: Array<{ name: string; riskLevel: string }>;
  alerts: string[];
}>;
```

Logic:
1. Query all active credentials from `prisma.credentialRegistry`
2. For each with `expiresAt`: compute days left, flag if within `reminderDays`
3. For each with `verifyEndpoint`: run a lightweight API test:
   - `anthropic-api`: POST to `https://api.anthropic.com/v1/messages` with `max_tokens: 1`, model `claude-haiku-4-5-20251001`, message "ping" — check for 200 (or 401 = key invalid)
   - `stripe-api`: GET `https://api.stripe.com/v1/balance` with Bearer token — check for 200
   - Other providers: skip verification for now (just check expiry dates)
4. Update `lastVerifiedAt` and `lastVerifyOk` on each tested credential
5. Update `status` field: if expired → 'expired', if expiring soon → 'expiring_soon', if verify failed → 'revoked'
6. Return alerts array for the main health check response

**Important:** The verification calls must be lightweight and non-destructive. Use `AbortSignal.timeout(5000)` on each. If a verify call fails due to timeout/network (not auth), don't mark as failed — mark as `verifyStale`.

**Integration:** Add `checkCredentialHealth()` to the existing `Promise.all` in the main handler. Merge its alerts into the main alerts array. Include credential summary in the audit log details JSON.

### 5. Credential Update API

Add a PATCH handler to `app/api/credentials/route.ts` (or create `app/api/credentials/[id]/route.ts`):

```typescript
// PATCH /api/credentials/[id]
// Body: { expiresAt?, issuedAt?, notes?, status? }
// Used by the dashboard to record when a credential was rotated
```

This lets the operator update expiration dates after rotating a credential (e.g., "I just renewed the Azure AD secret, it expires in 2 years").

### 6. PATCH for Recording Rotation

Add a POST route `app/api/credentials/[id]/rotate/route.ts`:

```typescript
// POST /api/credentials/[id]/rotate
// Body: { issuedAt: ISO string, expiresAt?: ISO string, notes?: string }
// Records a rotation event: updates issuedAt, expiresAt, resets status to 'active',
// clears lastVerifyOk (will be re-verified on next cron run).
// Logs to AuditLog.
```

---

## Operator Actions (before/after deploy)

```
┌─────────────────────────────────────────────────────┐
│ 🔴 OPERATOR ACTION REQUIRED                        │
│                                                     │
│ 1. □ Push schema to TARDIS Neon database:           │
│    cd steampunk-strategy && npx prisma db push      │
│                                                     │
│ 2. □ Seed the credential registry:                  │
│    npx tsx scripts/seed-credential-registry.ts      │
│                                                     │
│ 3. □ After deploy: visit /credentials to verify     │
│    the dashboard renders with 18 credentials        │
│                                                     │
│ Estimated time: 5 minutes                           │
└─────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

1. `/credentials` page renders with KPI strip showing summary stats and a table of all seeded credentials
2. Credentials table shows status dots, risk badges, provider badges, repo counts, expiry countdown
3. Row expansion (or detail panel) shows full rotation guide, failure impact, env var mappings, rotation URL
4. Sidebar nav includes "Credentials" entry under Command group with KeyRound icon
5. Bridge dashboard shows credential health widget when issues exist (expiring/expired/failed)
6. Health-check cron includes `checkCredentialHealth()` in its sweep
7. Anthropic and Stripe API keys are actively verified on each health-check run
8. Credentials with failed verification get status updated to reflect failure
9. Expiring credentials generate alerts in the health-check response
10. Credential update/rotation API routes work and log to AuditLog
11. `npx tsc --noEmit` passes with zero errors
12. All existing health-check functionality unchanged

## Files to Create

- `app/(protected)/credentials/page.tsx` — Dashboard page
- `app/api/credentials/[id]/route.ts` — PATCH for updating credential metadata
- `app/api/credentials/[id]/rotate/route.ts` — POST for recording rotation events

## Files to Modify

- `app/(protected)/layout.tsx` — Add sidebar nav entry
- `app/(protected)/bridge/page.tsx` — Add credential health widget
- `app/api/cron/health-check/route.ts` — Add credential sweep function
- `app/api/credentials/route.ts` — Already exists (GET), may need minor adjustments

## Deferred (Not in Scope)

- Vercel API integration for pushing env vars across projects (Phase 2)
- Facebook long-lived token auto-renewal via Graph API (Phase 3)
- Azure AD secret rotation via Microsoft Graph (Phase 3)
- Email alert for credential expiry (can use existing Fred alert pattern — Phase 2)
- Credential rotation history table (future — for now, rotation events go to AuditLog)

## Reference

- Existing gauge/badge patterns: `app/(protected)/bridge/page.tsx`, `app/(protected)/compliance/page.tsx`
- Existing table patterns: `app/(protected)/vendors/page.tsx`, `app/(protected)/expenses/page.tsx`
- Health-check cron: `app/api/cron/health-check/route.ts`
- TARDIS theme: `tailwind.config.js` — `tardis-*`, `console-*`, `brass-*`, `gauge-*` color classes
- Schema: `prisma/schema.prisma` — `CredentialRegistry` model (bottom of file)
- Seed data: `scripts/seed-credential-registry.ts` — 18 credentials with full metadata
