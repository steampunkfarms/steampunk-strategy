# SYNC-1: Studiolo Donor → Newsletter Subscriber Sync — Working Spec

## Discovery

### Studiolo Donor Model (key fields)
- `id` (uuid), `donorId` (display ID, SF-XXXXXX), `email`, `firstName`, `lastName`
- `pipelineLane` (string, nullable) — lane assignment
- `laneBStatus` (string, nullable) — "Eligible", "Invited", "Accepted", "Declined", "Paused"
- No email opt-out flag exists currently

### Donor Creation Locations (15 total in Studiolo)
Key flows for webhook integration:
1. `app/api/webhooks/subscribers/route.ts:156` — subscriber webhook
2. `app/api/webhooks/donations/route.ts:365` — donation webhook
3. `app/api/webhooks/zapier/route.ts:357` — Zapier webhook
4. `app/api/webhooks/everyorg/route.ts:121` — EveryOrg webhook
5. `app/api/import/unified/route.ts:622,780` — unified import (2 points)
6. `app/api/import/benevity/route.ts:329` — Benevity import
7. `app/api/import/cybergrants/route.ts:312` — CyberGrants import
8. `app/api/commerce/sync/patreon/route.ts:207` — Patreon sync
9. `app/api/import/paypal/route.ts:146` — PayPal import
10. `app/api/import/anonymous/route.ts:42` — anonymous donor
11. `app/api/import/meta-fundraiser/resolve/route.ts:61` — Meta fundraiser
12. `app/api/knowledge/route.ts:268,821` — AI knowledge endpoint
13. `app/api/sync/scan-imports/route.ts:219` — import scan cron
14. `scripts/create-demo-data.ts:239` — demo data (skip)
15. `prisma/seed.ts:26` — seed script (skip)

### Approach: Shared helper + selective integration
- Create `lib/subscriber-sync.ts` utility in Studiolo
- Integrate into top webhook/import flows (skip demo/seed scripts)
- Fire-and-forget: failure never blocks donor creation

### Newsletter Subscribers Schema (Rescue Barn)
- `id`, `email` (unique), `source`, `subscribed_at`, `status`, `preferences` (jsonb), `first_name`, `unsubscribed_at`, `unsubscribe_token`, `bounce_count`
- Existing source values: 'homepage', 'godaddy-import', 'postmaster_storm'
- New source: 'studiolo_donor'

### Auth Patterns
- Studiolo: `safeCompare()` from `lib/safe-compare.ts`
- Rescue Barn: `verifyInternalAuth()` pattern from `src/app/api/cogworks/external-post/route.ts`

### Lane B Exclusion
- Filter: `pipelineLane !== 'B'` (exclude Opus donors from subscriber sync)
- For subscribable endpoint: WHERE pipelineLane != 'B' OR pipelineLane IS NULL, AND email IS NOT NULL

## Scope
- Studiolo: 1 new API endpoint, 1 new utility, ~13 integration points
- Rescue Barn: 1 new API endpoint, 1 new script

## Acceptance Criteria
- [x] Studiolo endpoint returns subscribable donors (excludes Lane B, excludes null emails)
- [x] INTERNAL_SECRET auth with timing-safe comparison on both endpoints
- [x] Backfill script runs, inserts new subscribers with source='studiolo_donor'
- [x] Backfill handles duplicates gracefully
- [x] Ongoing sync endpoint upserts correctly
- [x] Studiolo fires webhook on new donor creation (non-blocking)
- [x] tsc --noEmit passes on both repos
