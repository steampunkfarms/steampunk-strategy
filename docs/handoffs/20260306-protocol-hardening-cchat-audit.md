# Handoff Spec: 20260306-protocol-hardening-cchat-audit

**Status:** COMPLETE

## Objective

Harden protocol infrastructure based on CChat audit of v2026.03h brain files. Fix stale references, widen sync rules, add Tier 0 and Novel Pattern definitions, improve verifier error reporting and coverage, split bloated roadmap.

## Target repo(s)

steampunk-strategy

## Files affected

- `docs/strategy-session-template.md` — fixed stale Copilot reference, updated lanes to tier model
- `CLAUDE.md` — widened sync rule with satellite doc list, added Tier 0 Hotfix, added Novel Pattern trigger, updated roadmap instructions, v2026.03i changelog
- `docs/CODEX.md` — widened sync rule with satellite doc list, added Hotfix Backfill Check, v2026.03i changelog
- `scripts/verify-handoff.mjs` — hardened tsc error reporting (error count + combined output), added Check 9 satellite freshness, updated Check 4 for multi-file roadmap
- `scripts/roadmap-updater.js` — rewrote to support 3-file roadmap split (searches roadmap.md + roadmap-deferred.md, archives to roadmap-archive.md)
- `docs/roadmap.md` — split: active items only (318 lines, down from 1098)
- `docs/roadmap-deferred.md` (new) — deferred items extracted from roadmap
- `docs/roadmap-archive.md` (new) — completed + killed items extracted from roadmap

## Risk & Reversibility

Low risk. All changes are to protocol docs, scripts, and roadmap files. No application source code modified. No schema changes. Git revert restores everything cleanly.

## Acceptance Criteria

1. `docs/strategy-session-template.md` contains no "Copilot" references and uses tier model for lanes
2. Both brain files list 5 satellite docs in Protocol Change Sync Rule section
3. CLAUDE.md defines Tier 0 Hotfix path with mandatory backfill
4. CODEX.md contains Hotfix Backfill Check section in post-flight audit
5. CLAUDE.md Tier 3 includes Novel Pattern trigger with examples
6. `verify-handoff.mjs` tsc catch block shows error count and combined stdout+stderr
7. `verify-handoff.mjs` includes Check 9 for satellite doc freshness
8. `verify-handoff.mjs` Check 4 searches all 3 roadmap files and reports which file contains the match
9. `roadmap-updater.js` removes from source file and appends to `roadmap-archive.md`
10. `docs/roadmap.md` is under 400 lines; `roadmap-deferred.md` and `roadmap-archive.md` exist
11. Both brain files have v2026.03i changelog entries

## Verification Command

```bash
cd /Users/ericktronboll/Projects/steampunk-strategy && node scripts/verify-handoff.mjs --handoff-name 20260306-protocol-hardening-cchat-audit
```

## Debrief

### What worked well
- CChat audit identified concrete, actionable improvements
- All 8 steps were cleanly scoped and independent
- Roadmap split significantly reduces token load (1098 -> 318 lines in primary file)

### What could be improved
- Pre-existing markdown lint warnings in CLAUDE.md could be cleaned up in a future pass
- Roadmap-updater.js could benefit from a dry-run mode for testing
