# Handoff: Graph Task Sync Registration

**ID:** 20260306-graph-task-sync-registration
**Date:** 2026-03-06
**Status:** Complete
**Repos touched:** steampunk-orchestrator (code), steampunk-strategy (docs only)

## Summary

Registered the Studiolo `graph-task-sync` cron job in the Orchestrator's static job registry and vercel.json. This job pushes stewardship action items to Outlook To Do via Microsoft Graph, running daily at 8 AM UTC.

## Files Modified

### steampunk-orchestrator (2 files)

1. **`src/lib/job-registry.ts`**
   - Added `studiolo/graph-task-sync` entry to JOBS record (after `csr-deadlines`)
   - Updated Studiolo section comment: 11 -> 12 jobs
   - Updated total count comment: 23 -> 24 existing jobs

2. **`vercel.json`**
   - Added cron entry: `{ "path": "/api/cron/studiolo/graph-task-sync", "schedule": "0 8 * * *" }`

### steampunk-strategy (2 files, docs only)

1. `docs/handoffs/_working/20260306-graph-task-sync-registration-working-spec.md` (created)
2. `docs/handoffs/20260306-graph-task-sync-registration.md` (this file, created)

## Job Parameters

| Field | Value |
|-------|-------|
| jobName | `studiolo/graph-task-sync` |
| app | `studiolo` |
| targetUrl | `${STUDIOLO()}/api/graph/task-sync/cron` |
| method | GET |
| schedule | `0 8 * * *` (daily 8 AM UTC) |
| retries | 1 |
| timeoutMs | 55000 |
| criticality | standard |

## Verification Results

- `rg "graph-task-sync" src/lib/job-registry.ts vercel.json` -- 4 matches (3 in registry, 1 in vercel.json)
- `npx tsc --noEmit` -- passed, zero errors

## Scope Isolation

- No changes to Studiolo route logic
- No changes to any other job definitions
- No database migrations required (static registry only)

## Deferred

- None. The Studiolo route already exists and handles auth for both CRON_SECRET and INTERNAL_SECRET.
