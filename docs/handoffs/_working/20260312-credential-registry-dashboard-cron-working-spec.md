# Working Spec: Credential Registry — Dashboard + Cron Integration

**Handoff ID:** 20260312-credential-registry-dashboard-cron
**Status:** In Progress
**Date:** 2026-03-12

## Discovery

- CredentialRegistry Prisma model exists in schema (confirmed in seed script)
- GET /api/credentials route exists with computed fields (computedStatus, daysUntilExpiry, verifyStale, repoCount, envVarCount) + summary stats
- Seed script has 18 credentials covering all 6 repos
- Bridge page uses gauge-dot + console-card + bridge-table patterns
- Health-check cron runs 6 parallel checks, logs to AuditLog
- Schema pushed but NOT yet applied to database (operator action)

## Implementation Plan

1. Dashboard page at /credentials — server component, fetches from API
2. Sidebar nav entry — KeyRound icon in Command group
3. Bridge widget — conditional credential alert card
4. Health-check cron extension — checkCredentialHealth() with Anthropic + Stripe verify
5. PATCH /api/credentials/[id] — update metadata
6. POST /api/credentials/[id]/rotate — record rotation event

## Files to Create
- app/(protected)/credentials/page.tsx
- app/api/credentials/[id]/route.ts
- app/api/credentials/[id]/rotate/route.ts

## Files to Modify
- app/(protected)/layout.tsx
- app/(protected)/bridge/page.tsx
- app/api/cron/health-check/route.ts
