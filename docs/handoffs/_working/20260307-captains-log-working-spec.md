# Working Spec: CLOG-1 Captain's Log — Executive Action Log with AI Classification

**Handoff ID:** `20260307-captains-log`
**Tier:** 2 (Human + CC, protocol required)
**Date:** 2026-03-07
**Repos:** steampunk-strategy only

## Spec Sanity Pass

- [x] No ComplianceTask or ActionItem overlap — Captain's Log is general-purpose, those are domain-specific
- [x] JournalNote exists but has no status/priority/due/assignee — Captain's Log fills the gap
- [x] Anthropic SDK 0.78 installed (used by receipt parser, insights)
- [x] BoardMeeting + AgendaItem models exist for Phase 7 board-prep integration
- [x] AuditLog model exists with standard create pattern
- [x] Prisma import pattern: `import { prisma } from '@/lib/prisma'` (named export)
- [x] BookOpen icon already imported in layout.tsx
- [x] Auth pattern: `getServerSession(authOptions)` from next-auth

No protocol, architectural, or brand/voice conflicts found.

## Strategy Session Template

### Problem Statement
TARDIS has ComplianceTask (regulatory only), ActionItem (board meetings only), and JournalNote (no task tracking). No general-purpose executive action log exists for capturing tasks from strategy sessions, advisor conversations, audit notes, grant prep, etc.

### Scope
- CaptainsLog Prisma model with status, priority, due date, assignee, AI classification
- AI classification endpoint using Claude Sonnet
- Full CRUD API with filtering
- Captain's Log page with summary gauges, filters, entry list
- New entry page with AI classification preview
- Detail/edit page with reclassify and convert-to-compliance
- Bridge dashboard widget (top 5 urgent items)
- Sidebar navigation entry
- Board meeting prep filtered view

### Out of Scope
- Notification/reminder system for due dates
- Email capture (auto-creating entries from forwarded emails)
- Cross-site action items
- Mobile quick-capture
- Recurring action items

## Cross-Site Impact Checklist

- [ ] Rescue Barn
- [ ] Studiolo
- [ ] Postmaster
- [ ] Cleanpunk Shop
- [x] TARDIS (steampunk-strategy)
- [ ] Orchestrator

Authentication implications: None
Data-flow consequences: None — self-contained within TARDIS
Orchestrator / Cron impact: None (future: due date reminders)

## Family Planning Protocol Gate

- [x] Single repo (steampunk-strategy) — no cross-site impact
- [x] No auth changes
- [x] Schema addition only (no migration of existing data)
- [x] No env var additions required (ANTHROPIC_API_KEY already configured)

## Risk & Reversibility

- Risk: LOW — single repo, additive schema change, no cross-site modifications
- Reversibility: 10/10 — drop table, delete new files, revert sidebar/bridge edits

## Implementation Plan

### New Files (8):
1. `app/api/captains-log/classify/route.ts` — AI classification endpoint
2. `app/api/captains-log/route.ts` — list + create CRUD
3. `app/api/captains-log/[id]/route.ts` — single entry GET/PATCH/DELETE
4. `app/(protected)/captains-log/page.tsx` — main log page
5. `app/(protected)/captains-log/new/page.tsx` — new entry form with AI preview
6. `app/(protected)/captains-log/[id]/page.tsx` — detail/edit page
7. `app/(protected)/captains-log/board-prep/page.tsx` — board meeting prep view

### Modified Files (3):
8. `prisma/schema.prisma` — add CaptainsLog model
9. `app/(protected)/bridge/page.tsx` — add Captain's Log widget
10. `app/(protected)/layout.tsx` — add sidebar nav entry
