# Working Spec: Reference Docs Full Refresh

**Handoff ID:** 20260313-reference-docs-full-refresh
**Date:** 2026-03-13

---

## Discovery

Codebase archaeology across all 6 repos revealed:

1. **TARDIS (steampunk-strategy):** 41 Prisma models, 37 pages, 89 API routes, 3 cron jobs. No reference doc existed.
2. **Orchestrator (steampunk-orchestrator):** 6 Prisma models, 25 managed cron jobs across 5 target apps. No reference doc existed.
3. **Postmaster:** 12 models missing from reference (Medical, Resident Media, Social Intelligence, Newsletter, Chronicle). ~20 API routes undocumented. Newsletter system, social intelligence, chronicle, vet records features undocumented.
4. **Rescue Barn:** No cron section. Cogworks CMS and newsletter integration undocumented.
5. **Studiolo:** TARDIS section said "no dedicated TARDIS exists" — stale since TARDIS was deployed.
6. **Cleanpunk Shop:** Missing TARDIS and Orchestrator from cross-site dependencies.
7. **CLAUDE.md:** Route structure abbreviated, cron section speculative, Orchestrator listed as "(planned)".

## Approach

- Full codebase archaeology via parallel agents (Prisma schemas, page routes, API routes, vercel.json, package.json, lib modules)
- Create 2 new reference docs from scratch
- Update 4 existing reference docs with missing sections
- Update CLAUDE.md to reflect deployed reality
- Documentation-only — no code changes required
