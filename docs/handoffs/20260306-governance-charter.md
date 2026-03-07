# Handoff Spec: 20260306-governance-charter

**Status:** COMPLETE

## Objective

Create GOVERNANCE.md — a centralized governance charter consolidating decision authority, risk appetite, exception handling, and protocol amendment rules. Cross-reference from both brain files.

## Target repo(s)

steampunk-strategy

## Files affected

- `GOVERNANCE.md` (new) — governance charter with 7 sections
- `CLAUDE.md` — added Governance section cross-reference, GOVERNANCE.md in satellite sync list, v2026.03j changelog
- `docs/CODEX.md` — added Governance Reference section, GOVERNANCE.md in satellite sync list, v2026.03j changelog

## Risk & Reversibility

Minimal risk. New file creation + cross-reference additions only. No existing content modified. Reversibility: 10/10 (git revert or delete).

## Acceptance Criteria

1. [x] GOVERNANCE.md exists at repo root with all 7 sections (Principles, Decision Authority, Risk Appetite, Exception Process, Amendment Process, Governance Review Cadence, Document Hierarchy)
2. [x] Family roles table includes Fred, Krystal, Tierra, Stazia with accurate role descriptions
3. [x] CLAUDE.md has Governance cross-reference section
4. [x] CODEX.md has Governance Reference section
5. [x] Both brain files have GOVERNANCE.md in their satellite sync lists
6. [x] Both brain files have v2026.03j changelog entry
7. [ ] npx tsc --noEmit passes in steampunk-strategy
8. [x] No contradictions between GOVERNANCE.md and existing brain file rules

## Verification Command

```bash
cd /Users/ericktronboll/Projects/steampunk-strategy && npx tsc --noEmit && node scripts/verify-handoff.mjs --handoff-name 20260306-governance-charter
```

## Debrief

### What worked well
- Clean new-file-only handoff — no merge conflicts or anchor drift risk
- CChat prompt was execution-ready with exact content blocks

### What could be improved
- GOVERNANCE.md references protocol-health-log.md and tardis-protocol-health-dashboard-spec.md which don't yet have full data pipelines (addressed in Prompt 2)
