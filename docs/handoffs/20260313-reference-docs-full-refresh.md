# Handoff Spec: Reference Docs Full Refresh

**Handoff ID:** 20260313-reference-docs-full-refresh
**Tier:** 2 (Standard)
**Repo:** steampunk-strategy (docs only — no code changes)
**Date:** 2026-03-13
**Status:** COMPLETED 2026-03-13 — 2 files created, 5 modified. Docs-only refresh, no code changes.

---

## Context

The 6-site reference library had drifted from deployed reality. Two reference docs were missing entirely (TARDIS, Orchestrator). Existing docs lacked TOCs, had stale cross-site dependency tables, and were missing recently-deployed features (newsletter system, social intelligence, Cogworks, chronicle, vet records).

---

## Deliverables

### 1. NEW: `docs/tardis-reference.md`
Full technical reference card for TARDIS (The Bridge). 41 Prisma models, 37 pages, 89 API routes, 3 cron jobs, 31 lib modules, cross-site dependencies.

### 2. NEW: `docs/orchestrator-reference.md`
Full technical reference card for Orchestrator. 6 Prisma models, 25 managed cron jobs, dynamic proxy architecture, 5 lib modules.

### 3. UPDATED: `docs/postmaster-reference.md`
- Added TOC with 13 sections
- Added 12 missing Prisma models (Medical, Resident Media, Social Intelligence, Newsletter, Chronicle)
- Added ~20 missing API routes (newsletter, social intelligence, vet records, chronicle, internal)
- Added 3 newsletter composition crons
- Added 4 major feature sections (Newsletter System, Social Intelligence, Caretaker Chronicle, Vet Records)
- Updated cross-site dependencies

### 4. UPDATED: `docs/rescuebarn-reference.md`
- Added TOC
- Added Cron Jobs section with ORCH-101 note
- Added Cogworks Content System section (CMS, fields, API, grounding)
- Added Newsletter Integration section (delivery flow, subscriber management, content loop)
- Renumbered sections to accommodate insertions

### 5. UPDATED: `docs/studiolo-reference.md`
- Added TOC
- Replaced stale "no dedicated TARDIS exists" section with accurate TARDIS Integration section describing deployed app and data flows

### 6. UPDATED: `docs/cleanpunk-shop-reference.md`
- Added TOC
- Added TARDIS cross-site dependency (ProductSpeciesMap, COGS, TARDIS_API_SECRET)
- Added Orchestrator cross-site dependency (5 managed crons)

### 7. UPDATED: `CLAUDE.md`
- Updated Reference Library listing (added tardis-reference.md, orchestrator-reference.md)
- Updated Data Model section (41 models with domain groupings)
- Updated Route Structure (21 protected page groups)
- Updated Cron Jobs (3 deployed, 2 Orchestrator-managed)
- Updated Family of Sites Integration table (all 5 sites with accurate data flows)
- Changed "5th Vercel project" → "one of 6 Vercel projects"
- Updated Sibling Repos: Orchestrator from "(planned)" to "(central cron scheduler)"

---

## Acceptance Criteria

| # | Criterion | Pass Condition |
|---|-----------|----------------|
| AC-1 | tardis-reference.md exists | File present with TOC, stack, schema, routes, API, crons, lib modules, cross-site deps |
| AC-2 | orchestrator-reference.md exists | File present with TOC, stack, schema, managed jobs, proxy architecture, lib modules |
| AC-3 | postmaster-reference.md has TOC | Section links resolve to correct heading anchors |
| AC-4 | postmaster-reference.md has newsletter section | Newsletter System section documents pipeline, lib modules, cadences |
| AC-5 | postmaster-reference.md has social intelligence | SocialContact, temperature scoring, comment classification documented |
| AC-6 | rescuebarn-reference.md has crons section | Section 5 with ORCH-101 note |
| AC-7 | rescuebarn-reference.md has Cogworks section | Section 9 with key fields and API endpoint |
| AC-8 | rescuebarn-reference.md has newsletter section | Section 10 with delivery flow and content loop |
| AC-9 | studiolo-reference.md TARDIS section is accurate | Section 9 describes deployed TARDIS app, not "no dedicated TARDIS exists" |
| AC-10 | cleanpunk-shop-reference.md has TARDIS dep | Cross-site table includes TARDIS row |
| AC-11 | cleanpunk-shop-reference.md has Orchestrator dep | Cross-site table includes Orchestrator row |
| AC-12 | CLAUDE.md Reference Library lists all 7 docs | tardis-reference.md and orchestrator-reference.md present with descriptions |
| AC-13 | CLAUDE.md route structure is current | 21 protected page groups listed |
| AC-14 | CLAUDE.md cron section shows 3+2 | 3 deployed, 2 Orchestrator-managed |
| AC-15 | All reference docs have updated date | "Updated: 2026-03-13" in each |
| AC-16 | tsc --noEmit passes | Zero errors in steampunk-strategy |

---

## Files Affected

**Created (2):**
- `docs/tardis-reference.md`
- `docs/orchestrator-reference.md`

**Modified (5):**
- `docs/postmaster-reference.md`
- `docs/rescuebarn-reference.md`
- `docs/studiolo-reference.md`
- `docs/cleanpunk-shop-reference.md`
- `CLAUDE.md`

---

## Deferred Items

- None. This is a documentation-only refresh with no code changes.
