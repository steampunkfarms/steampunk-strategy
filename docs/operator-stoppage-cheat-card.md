# Operator Stoppage Cheat Card

Use this whenever Codex or Claude Code raises a stoppage alert.

## First Rule

- Send stoppage alerts to CChat (Claude Chat in Cline) first.
- Include:
  - full alert text,
  - the last prompt you sent,
  - one-sentence goal,
  - any known changed files.

## Fast Mode Selector

- Mapped Mode:
  - GenAI workflows,
  - protocol/brain-file edits,
  - security/compliance-sensitive work,
  - multi-route or multi-file behavior changes.
- Lean Mode:
  - narrow, low-risk work,
  - few files,
  - no protocol or cross-workflow behavior impact.
- Escalate Lean -> Mapped immediately if ambiguity, blockers, scope growth, or protocol risk appears.

## Common Alerts and What To Do

- Missing handoff spec / working spec:
  - Do not stop permanently.
  - Create canonical files first, then execute.
  - Canonical working path:
    - `docs/handoffs/_working/<handoff-id>-working-spec.md`
  - Preferred `<handoff-id>` format:
    - `YYYYMMDD-short-slug`

- Prompt too vague / not enough detail:
  - Request execution-mapped handoff from CChat (anchors + exact text blocks + strict checklist).

- Scope too broad / risk increased:
  - Switch to Mapped Mode.

- Verification failed:
  - Return full failure output to CChat for diagnosis.
  - Follow fix loop and rerun verification.

- Protocol conflict / cannot proceed safely:
  - Return alert to CChat for protocol reconciliation and explicit unblock instruction.

- Codex pre-flight FAIL:
  - Return Codex's failure notes to CChat.
  - CChat reworks the handoff spec / CC prompt.
  - Resubmit to Codex for re-audit.

- Codex post-flight FAIL:
  - Return Codex's failure notes to CC.
  - CC fixes the identified issues.
  - Resubmit CC debrief to Codex for re-audit.

## Preflight Checklist (Before Implementation)

- Confirm active handoff id.
- Confirm working spec exists at canonical path.
- If missing and inline details are complete, create working and handoff specs first.
- Confirm selected mode (Mapped or Lean) and escalation criteria.
- Confirm acceptance checklist and verification command are present.
- Confirm Codex pre-flight audit has been run and passed.

## Output Expectations for Claude Code Wrap-up

- Changed file list.
- File/line evidence for required checks.
- Verification command output summary.
- `npx tsc --noEmit` output for every modified repo.
- Any remaining blockers or deferred items.
- Sanity Delta items (if any) labeled and justified.
