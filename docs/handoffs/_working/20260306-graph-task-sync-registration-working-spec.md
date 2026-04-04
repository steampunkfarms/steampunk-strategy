# Working Spec: Graph Task Sync Registration

**ID:** 20260306-graph-task-sync-registration
**Date:** 2026-03-06
**Status:** Complete

## Objective

Register the Studiolo `graph-task-sync` cron job in the Orchestrator's static job registry and maintain vercel.json parity.

## Discovery

- **Target route:** `/Users/ericktronboll/Projects/steampunk-farms/steampunk-studiolo/app/api/graph/task-sync/cron/route.ts`
- **Route behavior:** Pushes stewardship action items to Outlook To Do via Microsoft Graph
- **Schedule:** Daily at 8 AM UTC (`0 8 * * *`)
- **HTTP method:** GET
- **Auth:** Accepts both `CRON_SECRET` and `INTERNAL_SECRET` (Orchestrator compatible)

## Changes Required

1. Add `studiolo/graph-task-sync` entry to `src/lib/job-registry.ts` in the Studiolo block
2. Add matching cron path to `vercel.json`
3. Update Studiolo job count comment from 11 to 12
4. Update total job count comment from 23 to 24

## Parameters Chosen

| Field | Value | Rationale |
|-------|-------|-----------|
| schedule | `0 8 * * *` | Matches route comment |
| retries | 1 | Standard for daily non-critical jobs |
| timeoutMs | 55000 | Standard (under Vercel 60s limit) |
| criticality | standard | Task sync is not revenue/compliance critical |
| method | GET | Matches Studiolo cron convention |

## Verification

- `rg "graph-task-sync" src/lib/job-registry.ts vercel.json` -- confirms entries in both files
- `npx tsc --noEmit` -- passes with zero errors
