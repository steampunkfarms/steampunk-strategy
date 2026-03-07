# Erick's Plan: AI Workflow Revamp

> Proposed: 2026-03-06
> Status: DRAFT — awaiting operator approval before implementation
> Author: Claude Code 4.6 (Opus), based on operator direction

---

## Summary

Remove GitHub Copilot from the AI workflow. Restructure from a four-actor system (Copilot + Codex + Claude Code + Human) to a leaner pipeline using only **Claude Code 4.6** (CC) and **OpenAI Codex 5.3-extended** (Codex), with the human doing planning directly in Claude Chat or Claude Code's conversational mode.

The open question: whether Claude Chat (CChat) in VS Code returns as a usable planning interface after Copilot is uninstalled. If it does, we get a three-actor model (CChat + Codex + CC). If not, we collapse to a two-actor model (Codex + CC) where the human does planning conversations directly in CC before switching to execution mode.

---

## What Exists Today (Before Revamp)

### Four-Actor System

| Step | Actor | Role |
|------|-------|------|
| 1 | Human | Identifies work, sets intent |
| 2 | Copilot | Discovery, risk assessment, working-spec drafting, handoff structuring |
| 3 | Codex | Converts handoff spec into deterministic CC execution prompt |
| 4 | Claude Code | Executes implementation, verification, roadmap update, debrief |

### Three Brain Files (synced at every protocol change)

1. `CLAUDE.md` — Claude Code execution rules + protocol
2. `docs/CODEX.md` — Codex operating brain (prompt generation contract)
3. `../.github/copilot-instructions.md` — Copilot governance gate + duplicate protocol

### Pain Points

- **Triple-sync tax:** Every protocol tweak requires identical edits to three files. The 2026-03-06 changelog shows seven protocol revisions in one day — most of the work was syncing files, not building features.
- **Copilot's role is duplicative:** It does discovery and handoff structuring, but CLAUDE.md already contains the same rules. Copilot adds a translation layer without adding unique capability.
- **Too many handoff translations:** Human intent -> Copilot working spec -> Copilot handoff spec -> Codex prompt -> CC execution = four translations of the same intent, each an opportunity for drift and token waste.
- **Codex as "formatter" underuses it:** Converting a handoff spec into a CC prompt is mostly mechanical text reshuffling. Codex's strength is systematic checking, not creative assembly.

---

## Proposed: Two-Actor Model (Codex + CC)

This is the baseline plan regardless of whether CChat comes back.

### Workflow

| Step | Actor | Output |
|------|-------|--------|
| 1. Plan & Scope | Human (in CC conversational mode or CChat) | Working spec + handoff spec |
| 2. Pre-flight Audit | Codex | Pass/fail on handoff spec completeness, protocol compliance, risk flags |
| 3. Execute | CC | Implementation + verification + debrief |
| 4. Post-flight Verify | Codex (high-risk) or Human (low-risk) | Audit CC debrief against acceptance criteria |

### If CChat Returns (Three-Actor Variant)

| Step | Actor | Output |
|------|-------|--------|
| 1. Plan & Scope | CChat | Working spec + handoff spec + CC execution prompt |
| 2. Pre-flight Audit | Codex | Pass/fail on completeness + corrections |
| 3. Execute | CC | Implementation + verification + debrief |
| 4. Post-flight Verify | Codex or Human | Audit against acceptance criteria |

The difference: CChat handles the conversational planning in a separate context window, keeping CC's context clean for execution. If CChat isn't available, CC does double duty (plan first, then execute).

---

## Brain File Changes

### Before (3 files, all synced)

| File | Purpose | Sync Required |
|------|---------|---------------|
| `CLAUDE.md` | CC execution + protocol | Yes — must match other two |
| `docs/CODEX.md` | Codex prompt generation contract | Yes — must match other two |
| `../.github/copilot-instructions.md` | Copilot governance + duplicate protocol | Yes — must match other two |

### After (2 files, minimal overlap)

| File | Purpose | Sync Required |
|------|---------|---------------|
| `CLAUDE.md` | Unified brain: CC execution + planning protocol + family context | Only with CODEX.md if QA rules change |
| `docs/CODEX.md` | Codex QA audit contract (pre-flight + post-flight checklists) | Only with CLAUDE.md if shared rules change |
| `../.github/copilot-instructions.md` | ARCHIVED to `docs/archive/` | No — retired |

### What Changes in CLAUDE.md

- Absorbs Copilot's planning/discovery role descriptions
- Removes all references to Copilot as an actor
- Updates "Protocol Change Sync Rule" from three files to two
- Updates "Agent Workflow Contract" to reflect new two/three-actor model
- Keeps all execution rules, verification layers, environment constraints, handoff modes unchanged

### What Changes in CODEX.md

- Strips out prompt-generation contract (Codex no longer generates CC prompts by default)
- Replaces with QA audit contract:
  - Pre-flight checklist: Does the handoff spec have all required sections? Are file anchors concrete? Are acceptance criteria testable? Any protocol conflicts?
  - Post-flight checklist: Does the CC debrief match the acceptance criteria? Are file counts accurate? Was verification actually run? Any scope creep?
- Keeps environment constraints, completion integrity rules
- Adds explicit "escalation to prompt generation" path for high-risk work where Codex should produce the CC prompt

### What Changes in CODEX-PREAMBLE.md

- Reworked from "prompt generation preamble" to "QA audit preamble"
- Tells Codex: read the handoff spec, run the checklist, report pass/fail with evidence

---

## Files to Edit (Implementation Checklist)

When operator approves:

- [ ] **Edit:** `CLAUDE.md` — merge planning role, remove Copilot refs, update sync rule to two files
- [ ] **Edit:** `docs/CODEX.md` — slim to QA audit contract
- [ ] **Edit:** `docs/CODEX-PREAMBLE.md` — rework as QA audit preamble
- [ ] **Edit:** `docs/operator-ai-orchestration-flow.md` — new two/three-actor diagram
- [ ] **Edit:** `docs/operator-stoppage-cheat-card.md` — replace Copilot references with CC/CChat
- [ ] **Edit:** `docs/HANDOFF_TEMPLATE.md` — update workflow section
- [ ] **Move:** `../.github/copilot-instructions.md` to `docs/archive/copilot-instructions-retired-20260306.md`
- [ ] **No change:** verify-handoff.mjs, roadmap-updater.js, check-guardrail-drift.mjs, debrief template, family-of-sites files, reference cards, CI workflow

---

## What Does NOT Change

All of these remain exactly as they are:

- Handoff spec format and conventions
- Working spec path convention (`docs/handoffs/_working/<id>-working-spec.md`)
- Verification script and CI workflow
- Roadmap automation
- Debrief template
- Mapped Mode vs Lean Mode selection
- Spec Sanity Pass (now always run by CC, optionally also by Codex in pre-flight)
- Bounded Deviation Rule
- Completion Integrity requirements
- Environment Constraints (Next.js 16, tsc --noEmit, auth stack map, etc.)
- Family-of-sites thin/full split
- Reference cards per site
- Guardrail drift checker

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Losing Copilot's live filesystem grep during planning | CC can grep the codebase in conversational mode; CChat (if available) can use project knowledge |
| Codex as QA gate might be skipped for convenience | Make pre-flight mandatory for Mapped Mode; optional only for Lean Mode |
| Two-file sync is still a sync tax | Minimal overlap by design — CODEX.md only contains QA-specific rules, not duplicated protocol |
| CChat may not be available in VS Code after Copilot removal | Baseline plan works without it (CC does planning + execution) |

---

## Decision Points for Operator

1. After Copilot uninstall: does Claude Chat return in VS Code?
   - If yes: adopt three-actor model (CChat + Codex + CC)
   - If no: adopt two-actor model (Codex + CC), CC does planning in conversation before execution
2. Is Codex pre-flight mandatory for all work, or only Mapped Mode?
   - Recommendation: mandatory for Mapped, optional for Lean
3. Archive copilot-instructions.md or delete entirely?
   - Recommendation: archive (preserves history, zero maintenance cost)
