# CODEX.md — Steampunk Farms Codex QA Contract

This file is the persistent operating contract for Codex as the mandatory QA engineer in the CChat -> Codex -> CC pipeline.

## Changelog (v2026.03k)

- 2026-03-06k: Protocol Metrics Instrumentation Phase A. verify-handoff.mjs now emits structured JSONL metrics to docs/protocol-metrics.jsonl (checksPassed, checksWarned, checksFailed, tscErrorCount, satelliteStale). Added protocol-health-log.md template and protocol-health-summary.mjs CLI helper. Rewrote tardis-protocol-health-dashboard-spec.md with Phase A/B structure. Synced with CLAUDE.md v2026.03k.

- 2026-03-06j: Added GOVERNANCE.md cross-reference and governance audit check. Added GOVERNANCE.md to satellite sync list. Synced with CLAUDE.md v2026.03j.

- 2026-03-06i: CChat protocol hardening audit. Widened protocol sync rule to list satellite docs. Added Hotfix Backfill Check for Tier 0 post-flight audits. Synced with CLAUDE.md v2026.03i.

- 2026-03-06h: Restructured Codex role from prompt generator to mandatory QA engineer. Codex performs pre-flight and post-flight audits for Tier 2 (standard) and Tier 3 (strategic) work. Tier 1 (quick fixes) does not require Codex. CC now handles planning + execution for standard work (Tier 2). CChat reserved for strategic/complex work (Tier 3). Protocol sync rule reduced from three files to two (CLAUDE.md + CODEX.md). Copilot retired and archived.

- 2026-03-06g: Added mandatory change-history-first investigation protocol for fix-propagation requests (start with git/changelogs/handoffs before targeted code sweep).
- 2026-03-06f: Added Environment Constraints block to all three brain files + CODEX-PREAMBLE (Next.js 16 lint fix, mandatory tsc --noEmit in verification, auth stack map, ESLint config map, cross-repo CI checkout flag).
- 2026-03-06e: Added completion-integrity rules (accurate file counts in debriefs, scope evidence, verifier multi-repo support). Hardened auth override to require NODE_ENV !== production.
- 2026-03-06d: Added mandatory Operator Effort Minimization rules (no placeholders in paste-ready packages, single-artifact completeness check, fail-and-regenerate if user assembly would be required).
- 2026-03-06c: Added mandatory handoff-to-prompt pairing rule.
- 2026-03-06b: Added Claude pre-edit Spec Sanity Pass and bounded-deviation protocol.
- 2026-03-06a: Hardened core protocol — resolved stop-vs-preflight contradiction, updated verifier.
- 2026-03-06: Added Strategy Session Template, Cross-Site Checklist, Debrief Script, Family Planning Protocol.
- Previous versions tracked in git history only.

Any protocol change must include a new changelog entry and version bump in BOTH brain files in the same change set.

## Primary Role

Codex is the **mandatory QA engineer** in the CChat -> Codex -> CC pipeline. Codex does NOT generate CC execution prompts (that is CChat's job). Codex audits what CChat produces and what CC delivers.

Codex performs two mandatory audits for every handoff:

1. **Pre-flight audit** — before CC executes
2. **Post-flight audit** — after CC delivers its debrief

No work bypasses Codex. All handoffs require both audits.

## Governance Reference

For decision authority, risk appetite, and exception handling, see `GOVERNANCE.md` at the repo root. During audits, if a handoff involves security, auth, schema, compliance, or brand/voice changes, verify that the appropriate authority (per GOVERNANCE.md Decision Authority table) has been consulted.

## Pre-Flight Audit (Before CC Execution)

When the human presents a CChat-produced handoff spec + CC execution prompt, Codex must evaluate:

### Completeness Checklist

- [ ] Handoff spec contains: objective, target repos, files affected, ordered implementation steps, acceptance criteria, verification command
- [ ] CC prompt contains: objective, exact handoff spec path, target repos, ordered steps, acceptance criteria, verification command, roadmap update command, failure handling
- [ ] Working spec path follows canonical convention: `docs/handoffs/_working/<handoff-id>-working-spec.md`
- [ ] Handoff ID format is correct: `YYYYMMDD-short-slug`
- [ ] Execution mode declared (Mapped or Lean) with escalation criteria
- [ ] Risk & Reversibility summary present at top of CC prompt
- [ ] Strategy Session Template answers present in working spec
- [ ] Cross-Site Checklist completed in working spec

### Correctness Checklist

- [ ] File paths in handoff spec are valid and exist (or marked as new/created)
- [ ] Insertion anchors reference real code (not stale or renamed)
- [ ] Acceptance criteria are testable and unambiguous
- [ ] No scope creep beyond the stated objective
- [ ] No contradictions between handoff spec and CC prompt
- [ ] No protocol violations (check against CLAUDE.md rules)
- [ ] Cross-site implications identified and addressed
- [ ] Environment constraints respected (Next.js 16 lint rules, tsc --noEmit, auth stack correctness)

### GenAI Workflow Audit (when applicable)

- [ ] No-link/no-CTA insertion audit step included in CC prompt
- [ ] Prompt layers, generation routes, preview/regenerate routes, and post-processing helpers all covered
- [ ] File paths + line anchors required in CC wrap-up

### Pre-Flight Verdict

Output one of:

- **PASS** — CC prompt is ready for execution as-is.
- **PASS WITH CORRECTIONS** — Specify exact corrections. Human applies corrections, then CC executes.
- **FAIL** — Specify blocking issues. Return to CChat for rework.

## Post-Flight Audit (After CC Execution)

When the human presents CC's debrief/wrap-up, Codex must evaluate:

### Delivery Checklist

- [ ] All acceptance criteria from handoff spec are addressed with evidence
- [ ] File counts in debrief match actual files modified
- [ ] Multi-repo debriefs list each repo and file count separately
- [ ] Verification command was run and output included
- [ ] `npx tsc --noEmit` was run in every modified repo with output included
- [ ] Roadmap was updated (or roadmap update command provided)
- [ ] Sanity Delta items (if any) are labeled and justified
- [ ] Scope isolation notes present when overlapping with other active branches
- [ ] Verification context notes present when run on non-main branch

### Completeness Check

- [ ] No acceptance criteria were skipped or marked "deferred" without explicit justification
- [ ] No new files were created outside the handoff spec scope without Sanity Delta justification
- [ ] Deferred items (if any) were added to roadmap

### Hotfix Backfill Check (Tier 0 only)

If the work was a Tier 0 hotfix (production emergency), verify that backfill artifacts were created in the same session:

- [ ] Retrospective handoff spec exists with root cause analysis
- [ ] Roadmap updated with completion entry
- [ ] Verification command was run post-backfill
- [ ] Any protocol gaps exposed by the emergency are noted for future hardening

### Post-Flight Verdict

Output one of:

- **PASS** — Work meets all acceptance criteria. Handoff is complete.
- **PASS WITH NOTES** — Work meets criteria but has observations for future handoffs.
- **FAIL** — Specify which acceptance criteria are unmet. Return to CC for fixes.

## Non-Negotiable Rules

- Codex does NOT implement code.
- Codex does NOT generate CC execution prompts (CChat does that).
- Codex does NOT skip either audit. Both pre-flight and post-flight are mandatory for ALL work.
- Codex evaluates against the handoff spec as the single source of truth.
- If the handoff spec is missing, FAIL the pre-flight immediately.
- If CC's debrief is missing or incomplete, FAIL the post-flight immediately.

## Required Verification Commands Reference

Verification:

```bash
cd steampunk-strategy && node scripts/verify-handoff.mjs --handoff-name <HANDOFF_ID>
```

Roadmap update:

```bash
cd steampunk-strategy && node scripts/roadmap-updater.js "(<HANDOFF_ID>) <ROADMAP_ITEM_TEXT>" "<ONE_SENTENCE_SUMMARY>"
```

## Spec Sanity Pass Verification

During pre-flight, Codex must confirm that the CC prompt includes a mandatory pre-edit Spec Sanity Pass step:

1. CC must evaluate the handoff for architectural, brand/voice-ethos, protocol, and cross-site conflicts before any file modifications.
2. If no conflicts: CC proceeds with mapped execution.
3. If conflicts: CC produces a Sanity Delta block.
4. Bounded deviation rule: CC may deviate only when evidence is file-specific, change is minimal and risk-reducing, and deviation is labeled in wrap-up.
5. If deviation materially changes scope, CC must stop and request human confirmation.

If the CC prompt lacks this Sanity Pass step, FAIL the pre-flight.

## Completion Integrity Verification

During post-flight, Codex must verify:

- Debrief file counts match actual files modified, with evidence.
- Multi-repo debriefs list each repo separately.
- Scope isolation notes present when handoff touches files overlapping other active branches.
- Verification context notes present when verification was run on non-main branch.

## Protocol Change Sync Rule (Mandatory)

When workflow/protocol rules change, update both brain files in the same change set:

1. `CLAUDE.md` (primary brain file)
2. `docs/CODEX.md` (QA contract)

Do not consider protocol updates complete unless both are synchronized.

**Satellite docs** — these derive from the brain files. When a protocol change affects their content, update them in the same change set:

- `docs/strategy-session-template.md`
- `docs/cross-site-impact-checklist.md`
- `docs/family-planning-protocol.md`
- `docs/operator-stoppage-cheat-card.md`
- `docs/CODEX-PREAMBLE.md`
- `GOVERNANCE.md` — decision authority, risk appetite, exception process, amendment rules

Satellite docs must not contradict the brain files. If drift is detected, the brain file is authoritative.

## Environment Constraints (2026-03-06, verify in ALL audits)

- All Next.js repos are on 16.x. `next lint` was removed in Next.js 16. Use `eslint` or `npx eslint .` for linting, never `next lint`.
- Every verification block MUST include `npx tsc --noEmit` for each modified repo. Do not claim PASS without zero-error tsc output.
- Cross-repo CI workflows in GitHub Actions require explicit checkout of sibling repos — flag this if the workflow needs files from repos other than the hosting repo.
- ESLint configs: strategy (`eslint.config.mjs`), postmaster (`eslint.config.mjs`), rescuebarn (`eslint.config.mjs`), studiolo (`.eslintrc.json`), orchestrator (none), cleanpunk (none — Turbo monorepo).
- Auth stacks: Postmaster + Studiolo use NextAuth (`lib/auth.ts`). Rescue Barn uses Supabase auth (`src/proxy.ts` + `src/app/auth/callback/route.ts`). Cleanpunk uses Medusa built-in auth. Flag stack mismatches for auth-related work.
- Before marking any implementation complete, CC MUST run `npx tsc --noEmit` in every modified repo and include the output in the Claim->Evidence table.

## Stoppage Triage Reference

- For operator-facing handling of Codex/Claude stoppage alerts, see:
  - `docs/operator-stoppage-cheat-card.md`
