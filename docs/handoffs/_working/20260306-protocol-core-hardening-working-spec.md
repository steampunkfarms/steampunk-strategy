# Working Spec: 20260306-protocol-core-hardening

Mode: Mapped Mode (mandatory; protocol/brain-file + verifier changes)

## Objective

Restore core protocol integrity by hardening canonical preamble, verifier parsing/enforcement, and synchronized brain-file rules.

## Strategy Session Template (Required)

**Objective (one sentence):**  
Harden protocol governance and verification so handoff completion cannot pass with missing/ambiguous core controls.

**1. Protocol Fit**  
Yes — this directly reinforces execution gate, handoff quality, and verification stack guarantees.

**2. Failure Mode Impact**  
Silent protocol drift can cause false “verification passed” outcomes, inconsistent Codex prompts, and unsafe/ambiguous execution.

**3. Operator Burden Delta**  
Reduces manual triage and rework by preventing ambiguous stoppages and false positives (estimated 30–60 min/week saved).

**4. Measurable Gain**  
Improves first-pass handoff verification rate.

**5. Reversibility**  
Yes — rollback is clean by reverting doc/script diffs (no schema/data mutation).

**Protocol Fit Score (0–10):**  
9

**Recommended Lane:**  
Handoff preparation (Mapped Mode)

## Family Planning Protocol Gate (Required)

### Major Initiative Criteria Check
- Affects ≥2 sites: No (core changes are in Strategy + root instructions)
- Changes core data flow or authentication: No
- Impacts donor experience or compliance: Indirectly, via process quality only
- Estimated effort > 8 handoffs: No

### Reversibility Score (0–10)
9 (doc/script-level rollback with no data loss)

### Matrix Outcome
Tactical Handoff (Mapped Mode). Not a Major Initiative.

## Cross-Site Impact Checklist (Required)

**Repos touched:**
- [ ] Rescue Barn
- [ ] Studiolo
- [ ] Postmaster
- [ ] Cleanpunk Shop
- [x] TARDIS
- [ ] Orchestrator

**Authentication implications:**  
None.

**Data-flow consequences:**  
None.

**Orchestrator / Cron impact:**  
None.

**Verification commands required:**
- `node scripts/verify-handoff.mjs --handoff-name 20260306-protocol-core-hardening`
- `rg` checks for synchronized rules/preamble keywords in required brain/protocol files.

## Canonical Placement Matrix (7 protocol assets + synced brains)

| Item | Canonical Path | Current State | Action |
|---|---|---|---|
| Strategy Session Template | `docs/strategy-session-template.md` | Present | Verify referenced/enforced by protocol/verifier |
| Cross-Site Checklist | `docs/cross-site-impact-checklist.md` | Present | Verify required in working specs/verifier |
| Debrief Template | `docs/handoffs/_templates/debrief-template.md` | Present | Verify post-verification debrief requirement enforced |
| CODEX Preamble | `docs/CODEX-PREAMBLE.md` | Present (placeholder tail) | Replace placeholder with full merged preamble |
| Family Planning Protocol | `docs/family-planning-protocol.md` | Present | Enforce gate requirement in protocol/verifier |
| TARDIS Protocol Health Dashboard Spec | `docs/tardis-protocol-health-dashboard-spec.md` | Present | Reference only; no logic changes required |
| Brain-file changelog rule | `CLAUDE.md`, `docs/CODEX.md`, `../.github/copilot-instructions.md` | Present | Ensure synchronized wording + consistent version/changelog policy behavior |

## Protocol Breakage Risks to Resolve

1. `docs/CODEX-PREAMBLE.md` contains placeholder text (`[Rest of original preamble remains unchanged...]`) instead of a complete canonical preamble.
2. `scripts/verify-handoff.mjs` currently assumes legacy handoff section patterns and may miss heading-style specs.
3. `docs/CODEX.md` includes contradictory behavior: stop on missing handoff path vs preflight-create canonical files.
4. New 2026-03-06 requirements are declared but not verifier-enforced.

## Implementation Plan (Execution-Mapped)

1. Rebuild full canonical preamble in `docs/CODEX-PREAMBLE.md` with legacy + 2026-03-06 requirements.
2. Update `scripts/verify-handoff.mjs` parser to support both:
   - legacy bold labels (`**Target repo(s):**`, `**Files affected:**`)
   - heading format (`## Repos in scope`, `## Files affected`)
3. Add verifier checks for required sections/artifacts:
   - Strategy Session answers
   - Cross-Site checklist
   - Family Planning gate + reversibility score
   - Risk & Reversibility line requirement in prompt/handoff context
   - Debrief completion requirement after verification pass
4. Resolve contradiction in `docs/CODEX.md` by retaining one unambiguous preflight policy.
5. Synchronize semantic rule language across:
   - `steampunk-strategy/CLAUDE.md`
   - `steampunk-strategy/docs/CODEX.md`
   - `.github/copilot-instructions.md`
6. If protocol semantics changed, add synchronized changelog entries/version behavior across all three brain files.

## Verification Plan

```bash
cd /Users/ericktronboll/Projects/steampunk-strategy && node scripts/verify-handoff.mjs --handoff-name 20260306-protocol-core-hardening
cd /Users/ericktronboll/Projects && rg -n "Any protocol change must include a new changelog entry and version bump in ALL THREE brain files in the same change set." steampunk-strategy/CLAUDE.md steampunk-strategy/docs/CODEX.md .github/copilot-instructions.md
cd /Users/ericktronboll/Projects && rg -n "Risk & Reversibility|Strategy Session Template|Cross-Site Impact Checklist|Debrief|Family Planning Protocol|preflight|canonical spec files" steampunk-strategy/docs/CODEX-PREAMBLE.md steampunk-strategy/docs/CODEX.md steampunk-strategy/CLAUDE.md .github/copilot-instructions.md
```

## Acceptance Checklist (Strict Pass/Fail)

- [ ] `docs/CODEX-PREAMBLE.md` is complete and contains no placeholder remainder text.
- [ ] `scripts/verify-handoff.mjs` supports both legacy and heading-style handoff specs.
- [ ] `scripts/verify-handoff.mjs` enforces 2026-03-06 required artifacts.
- [ ] `docs/CODEX.md` has no stop-vs-preflight contradiction.
- [ ] Core protocol semantics are synchronized across all three brain files.
- [ ] Changelog/version policy behavior is consistently represented in all three brain files for this change.
- [ ] Verification commands pass.
- [ ] Debrief section is completed in final handoff spec.

## Status

- [x] Working spec created
- [ ] Final handoff spec finalized
- [ ] Implementation complete
- [ ] Verification passed
- [ ] Debrief completed
