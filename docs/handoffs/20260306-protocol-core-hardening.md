# Handoff: 20260306-protocol-core-hardening

Mode: Mapped Mode (mandatory; protocol/brain-file + verification-system changes)

## Goal

Restore and harden core protocol integrity after recent updates by:
1. Rebuilding canonical preamble (remove placeholder tail behavior).
2. Aligning verifier parsing with current handoff formats.
3. Enforcing 2026-03-06 required sections in verification.
4. Resolving internal stop-vs-preflight contradiction.
5. Normalizing changelog/version-bump policy behavior across all three brain files.

## Working Spec Source of Truth

- `docs/handoffs/_working/20260306-protocol-core-hardening-working-spec.md`

## Repos in scope

- `steampunk-strategy` (primary)
- `.github` (brain-file sync)

## Files affected

- `steampunk-strategy/docs/CODEX-PREAMBLE.md`
- `steampunk-strategy/docs/CODEX.md`
- `steampunk-strategy/CLAUDE.md`
- `.github/copilot-instructions.md`
- `steampunk-strategy/scripts/verify-handoff.mjs`
- `steampunk-strategy/docs/handoffs/_templates/debrief-template.md` (reference, update only if required)
- `steampunk-strategy/docs/strategy-session-template.md` (reference)
- `steampunk-strategy/docs/cross-site-impact-checklist.md` (reference)
- `steampunk-strategy/docs/family-planning-protocol.md` (reference)

## Ordered Implementation Steps

1. **Canonical preamble reconstruction**
   - Replace placeholder text in `docs/CODEX-PREAMBLE.md` with full merged preamble content.
   - Preserve previously required constraints while explicitly including 2026-03-06 requirements:
     - Strategy Session Template answers + Cross-Site Checklist required in working specs
     - One-line “Risk & Reversibility” summary at top of Claude prompts
     - No-link/no-CTA insertion audit for GenAI handoffs
     - Debrief requirement after verification pass
     - Family Planning Protocol gating for Major Initiatives

2. **Verifier parser compatibility**
   - Update `scripts/verify-handoff.mjs` to parse both legacy and heading-based handoff structures:
     - Legacy: `**Target repo(s):**`, `**Files affected:**`
     - Heading-based: `## Repos in scope`, `## Files affected`
   - Fail loudly if required core sections are absent (no silent pass behavior).

3. **Verifier enforcement of 2026-03-06 protocol requirements**
   - Add checks that fail verification when missing:
     - Strategy Session answers in working spec
     - Cross-Site checklist in working spec
     - Family Planning gate decision + reversibility score
     - Risk & Reversibility summary requirement in prompt/handoff context
     - Debrief section completion post-pass

4. **Resolve contradiction in CODEX rules**
   - In `docs/CODEX.md`, unify policy so missing canonical specs follow preflight-create behavior (when inline details are complete), without contradictory “stop only” wording.

5. **Brain-file synchronization + changelog/version behavior alignment**
   - Ensure consistent protocol semantics across:
     - `steampunk-strategy/docs/CODEX.md`
     - `steampunk-strategy/CLAUDE.md`
     - `.github/copilot-instructions.md`
   - If semantics changed, add synchronized changelog entry/version handling in all three files in one change set.

6. **Debrief capture after verification pass**
   - Use `docs/handoffs/_templates/debrief-template.md` and add completed debrief section at end of this handoff.

## Strict Acceptance Checklist (Pass/Fail)

- [x] `docs/CODEX-PREAMBLE.md` has no placeholder remainder text.
- [x] `scripts/verify-handoff.mjs` parses both legacy and heading-based handoff formats.
- [x] `scripts/verify-handoff.mjs` enforces 2026-03-06 required artifacts.
- [x] `docs/CODEX.md` no longer contains stop-vs-preflight contradiction.
- [x] `CLAUDE.md`, `docs/CODEX.md`, and `.github/copilot-instructions.md` are synchronized for protocol-change and preflight semantics.
- [x] Changelog/version policy behavior is consistent across all three brain files for this change.
- [x] Verification commands pass.
- [x] Debrief section is completed.

## Verification Commands

```bash
cd /Users/ericktronboll/Projects/steampunk-strategy && node scripts/verify-handoff.mjs --handoff-name 20260306-protocol-core-hardening
cd /Users/ericktronboll/Projects && rg -n "Any protocol change must include a new changelog entry and version bump in ALL THREE brain files in the same change set." steampunk-strategy/CLAUDE.md steampunk-strategy/docs/CODEX.md .github/copilot-instructions.md
cd /Users/ericktronboll/Projects && rg -n "Risk & Reversibility|Strategy Session Template|Cross-Site Impact Checklist|Debrief|Family Planning Protocol|preflight|canonical spec files" steampunk-strategy/docs/CODEX-PREAMBLE.md steampunk-strategy/docs/CODEX.md steampunk-strategy/CLAUDE.md .github/copilot-instructions.md
```

## Failure Handling

- If any check fails, do not mark complete.
- Fix only in-scope protocol/verifier issues.
- Rerun all verification commands after fixes.
- Repeat until all checklist items pass with evidence.

## Completion Status

- **Status:** COMPLETE
- **Completed:** 2026-03-06
- **Notes:** Completed in two passes (v2026.03a foundational hardening + v2026.03b Spec Sanity Pass/Bounded Deviation propagation).

---

## Completion Record (Canonical)

### Final Status

- **Handoff ID:** 20260306-protocol-core-hardening
- **Date completed:** 2026-03-06
- **Verification result:** PASSED
- **Execution mode:** Mapped

### Spec Sanity Pass Result

No conflicts found in the final v2026.03b pass. Bounded Deviation remained available but was not needed.

### Implementation Notes

- **v2026.03a foundation:**
   - `scripts/verify-handoff.mjs` updated for dual-format section parsing (legacy bold-label + heading-based)
   - 2026-03-06 artifact enforcement added (Strategy Session, Cross-Site, Family Planning, Reversibility Score, Risk & Reversibility, Debrief)
   - Root `verify-handoff.mjs` wrapper added for command compatibility (`node verify-handoff.mjs`)
   - `docs/CODEX.md` stop-vs-preflight ambiguity resolved with qualified stop condition
- **v2026.03b propagation:**
   - `docs/CODEX-PREAMBLE.md` reconstructed to include Spec Sanity Pass + Bounded Deviation requirements
   - `docs/CODEX.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` synchronized at `v2026.03b` with matching changelog and policy language

### Verification Evidence

- `node verify-handoff.mjs --handoff-name 20260306-protocol-core-hardening`: PASS
- Brain-file sync grep sentence present across all 3 brain files: PASS
- Spec Sanity Pass / Bounded Deviation / model-routing keyword grep across required files: PASS
- Required 2026-03-06 artifacts detected by verifier: PASS

### Debrief

**What worked well:**
Foundational protocol hardening and v2026.03b policy propagation landed cleanly with synchronized wording across all three brain files.

**What could be improved:**
Add an automated propagation check so `docs/CODEX-PREAMBLE.md` is validated whenever brain-file policy changes are made.

**Metric impact (if measurable):**
Lead time: ~8–15 min (two-pass completion) | First-pass verification: YES (final pass) | Rework minutes: 0

**One-sentence summary for roadmap updater:**
Hardened protocol core behavior with mandatory Spec Sanity Pass, bounded-deviation enforcement, canonical preamble reconstruction, and verifier coverage for section formats plus 2026-03-06 required artifacts.
