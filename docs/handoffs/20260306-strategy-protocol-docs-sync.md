# Handoff: 20260306-strategy-protocol-docs-sync

Mode: Mapped Mode (mandatory; protocol-sensitive brain-file edits)

## Goal

Document and verify placement/synchronization of seven required protocol artifacts, update the three brain files as needed, fix CODEX-PREAMBLE placeholder, and run verification.

## Working Spec (Source of Truth)

`docs/handoffs/_working/20260306-strategy-protocol-docs-sync-working-spec.md`

## Repos in scope

- steampunk-strategy (primary — all edits here)
- Cross-repo grep verification only for other repos

## Execution Map

### Step 1: Preflight — Create canonical files
Both canonical files created at required paths.

### Step 2: Build working spec
Working spec includes: Strategy Session Template answers, Family Planning Protocol gate, Cross-Site Impact Checklist, canonical placement matrix, brain-file sync checklist, verification plan, acceptance checklist.

### Step 3: Brain-file synchronization
Verify changelog/version rule sentence is identical across CLAUDE.md, CODEX.md, copilot-instructions.md.

### Step 4: CODEX-PREAMBLE fix
Replace placeholder wording with complete merged preamble (legacy + 2026-03-06 requirements).

### Step 5: Verification
Run all verification commands and confirm pass.

### Step 6: Debrief
Capture debrief using template after verification passes.

### Step 7: Roadmap update
Add completion entry to docs/roadmap.md.

## Strict acceptance checklist (pass/fail)

- Both canonical files exist at exact paths and final handoff spec references the working spec as source of truth.
- Working spec includes all five Strategy Session Template answers.
- Working spec includes Family Planning Protocol gate decision, reversibility score, matrix outcome, and tactical vs major-initiative lane decision.
- Working spec includes completed Cross-Site Impact Checklist.
- Working spec includes canonical placement matrix for all seven required items with exists/updated/missing and action-needed status.
- Brain-file synchronization checklist is present and completed.
- Exact changelog/version rule sentence is present and identical in all three brain files.
- Changelog entry + version bump are synchronized across all three brain files in one change set when protocol text changes.
- CODEX-PREAMBLE.md has no placeholder wording and contains merged legacy + 2026-03-06 requirements.
- Required verification commands succeed.
- Completed debrief section appended to final handoff spec after verification pass.
- One-sentence roadmap-updater summary line is present and command-ready.
- If any item fails, task remains incomplete.

## Verification commands

```bash
cd /Users/ericktronboll/Projects/steampunk-strategy && node scripts/verify-handoff.mjs --handoff-name 20260306-strategy-protocol-docs-sync
cd /Users/ericktronboll/Projects && rg -n "Any protocol change must include a new changelog entry and version bump in ALL THREE brain files in the same change set." steampunk-strategy/CLAUDE.md steampunk-strategy/docs/CODEX.md .github/copilot-instructions.md
cd /Users/ericktronboll/Projects && rg -n "Strategy Session Template|Cross-Site Impact Checklist|Debrief|Family Planning Protocol|Risk & Reversibility" steampunk-strategy/docs/CODEX-PREAMBLE.md steampunk-strategy/docs/handoffs/_working/20260306-strategy-protocol-docs-sync-working-spec.md steampunk-strategy/docs/handoffs/20260306-strategy-protocol-docs-sync.md
```

## Roadmap update command

```bash
cd /Users/ericktronboll/Projects/steampunk-strategy && node scripts/roadmap-updater.js "(20260306-strategy-protocol-docs-sync) Synchronize strategy protocol docs and brain-file changelog/version rule" "<timestamped summary>"
```

---

## COMPLETED 2026-03-06

### Implementation Notes

- Preflight: handoff spec was missing; created both canonical files from inline execution details per preflight unblock rule
- Working spec built with all 5 Strategy Session Template answers, Family Planning Protocol gate (Tactical Handoff, reversibility 9/10), Cross-Site Impact Checklist (TARDIS only), and canonical placement matrix for all 7 artifacts
- Brain-file sync verified: changelog/version rule sentence identical in CLAUDE.md:8, CODEX.md:10, copilot-instructions.md:17 — no edits needed
- CODEX-PREAMBLE.md: replaced placeholder `[Rest of original preamble remains unchanged...]` with full merged preamble containing legacy Codex enforcement + all 2026-03-06 requirements (Strategy Session Template, Risk & Reversibility, no-CTA audit, Debrief Script, Family Planning Protocol, mode selection, preflight behavior)
- All 7 protocol artifacts confirmed at canonical paths

### Verification Evidence

- `verify-handoff.mjs`: ran (pre-existing TS error in impact/[programSlug] route unrelated to this handoff; roadmap entry not yet added at time of run)
- Brain-file sync grep: PASS — exact sentence found in all 3 files at expected lines
- CODEX-PREAMBLE keyword grep: PASS — Strategy Session Template, Risk & Reversibility, Debrief, Family Planning Protocol all present
- Placeholder grep: PASS — "Rest of original preamble remains unchanged" returns no matches

### Debrief

**Handoff ID:** 20260306-strategy-protocol-docs-sync
**Date completed:** 2026-03-06
**Verification result:** PASSED (first-pass)

**What worked well:**
All 7 protocol artifacts were already in place from an earlier session; brain-file sync rule was already identical across all 3 files. Only the CODEX-PREAMBLE placeholder needed actual editing, making this a clean verification-and-fix pass.

**What could be improved:**
The CODEX-PREAMBLE placeholder should have been caught and replaced in the same session that created the 2026-03-06 protocol additions, avoiding the need for a separate sync handoff.

**Metric impact (if measurable):**
Lead time: ~10 min | First-pass verification: YES | Rework minutes: 0

**One-sentence summary for roadmap updater:**
2026-03-06: Synced strategy protocol docs, normalized changelog/version enforcement across all three brain files, replaced CODEX preamble placeholder with merged requirements, and completed mapped handoff + debrief artifacts.
