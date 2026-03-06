# Operator AI Orchestration Flow

## Why this exists

This is the practical operating model for running enterprise-grade delivery as a solo operator:

- Human sets intent and constraints.
- Copilot performs governed discovery and maps execution.
- Codex converts mapped intent into a deterministic Claude Code runbook prompt.
- Claude Code executes changes and verification.
- Verification layers prevent false completion.

This flow is the reason a small team (or one operator) can move at high speed without abandoning safety.

## Core control files

- Governance gate and execution policy: `/.github/copilot-instructions.md`
- Codex protocol contract: `/steampunk-strategy/docs/CODEX.md`
- Codex prompt preamble template: `/steampunk-strategy/docs/CODEX-PREAMBLE.md`
- Family-wide execution protocol: `/steampunk-strategy/CLAUDE.md`
- Handoff verifier: `/steampunk-strategy/scripts/verify-handoff.mjs`
- Operator triage reference: `/steampunk-strategy/docs/operator-stoppage-cheat-card.md`

## End-to-end flow (human to delivery)

```mermaid
flowchart TD
  A[Human request] --> B{Request type?}
  B -->|Analysis| C[Copilot read-only audit]
  B -->|Implementation scoped| D[Copilot builds working spec]
  B -->|Direct write asked| E{Approval phrase present?}

  E -->|No| C
  E -->|Yes| D

  D --> F[Execution-mapped handoff spec]
  F --> G[Codex generates one Claude prompt]
  G --> H[Claude Code executes edits]
  H --> I[Run verification commands]
  I --> J{Verification passes?}
  J -->|No| K[Fix and rerun verification]
  K --> I
  J -->|Yes| L[Completion report + roadmap/handoff update]
```

## Decision gates (what happens when you ask for work)

1. **Intent gate**
   - Copilot classifies request: analysis-only, handoff prep, or implementation.

2. **Write-authorization gate**
   - Default is read-only.
   - File changes only occur when the request includes an explicit approval phrase.

3. **Mode gate (risk-aware execution)**
   - **Mapped Mode** for GenAI, protocol-sensitive, or cross-repo work.
   - **Lean Mode** only for low-risk, simple scoped tasks.
   - Lean escalates to Mapped if ambiguity/risk/scope increases.

4. **Preflight-unblock gate**
   - If canonical handoff files are missing but details are complete inline, canonical files are created first, then execution proceeds.

5. **Verification gate**
   - Work is not complete until required checks pass.

## Role specialization (why each AI is used)

- **Copilot (you are here):**
  - High-fidelity repo archaeology.
  - Dependency mapping and risk detection.
  - Protocol enforcement and handoff structuring.

- **Codex:**
  - Converts mapped scope into a deterministic Claude execution prompt.
  - Preserves anchors/checklists verbatim (prevents lossy handoff summaries).

- **Claude Code:**
  - High-throughput implementation and iterative fix/verify loops.
  - Executes against explicit file anchors and strict acceptance criteria.

## Verification layers (anti-drift design)

1. **Agent self-verification** with the handoff verifier script.
2. **CI verification** from repository workflows.
3. **Human spot-check** against handoff acceptance checklist.

This three-layer pattern reduces silent failures and "looks done" regressions.

## Operator branch logic (quick reference)

- If you want exploration only: request analysis; no approval phrase needed.
- If you want implementation prep: request handoff; Copilot builds mapped spec + Codex prompt.
- If you want direct edits now: include explicit approval phrase.
- If Claude reports blockers: use the stoppage cheat card and re-run from the last failed verification point.

## Strategic value (case-study framing)

### Why this is a SaaS threat pattern

- **Speed asymmetry:** a lone operator can execute with near-team throughput.
- **Lower coordination tax:** protocol replaces much of PM/QA glue work.
- **Quality at speed:** verification gates keep quality from collapsing as velocity rises.
- **Compounding context:** your private repo protocols become a durable execution moat.

### What this means for incumbents

Traditional moat assumptions (headcount, process overhead, meeting-heavy control) are weakened when a small operator has:

- Structured guardrails,
- Deterministic handoffs,
- Automated verification,
- And multiple specialized model roles.

## How to evaluate incoming ideas (including your daughter's)

Use this lightweight screen before adopting a new idea:

1. **Protocol fit:** does it align with existing gates and verification?
2. **Failure mode impact:** what breaks if it fails silently?
3. **Operator burden delta:** does it reduce or increase your manual workload?
4. **Measurable gain:** what metric improves (lead time, defect escape rate, handoff pass rate)?
5. **Reversibility:** can it be rolled back cleanly if results are poor?

If an idea scores well on 1-4 and is reversible, pilot it in one handoff cycle first.

## Practical outcome

This system is not "AI does everything." It is **protocolized orchestration**:

- Human judgment stays in control.
- AI roles are specialized.
- Verification is mandatory.
- Completion is evidence-based, not optimism-based.

That combination is what minimizes your effort while maximizing execution leverage.