# CODEX.md — Steampunk Farms Codex Operating Brain

This file is the persistent operating contract for Codex when preparing Claude Code execution prompts.

## Changelog (v2026.03f)

- 2026-03-06f: Added Environment Constraints block to all three brain files + CODEX-PREAMBLE (Next.js 16 lint fix, mandatory tsc --noEmit in verification, auth stack map, ESLint config map, cross-repo CI checkout flag).
- 2026-03-06e: Added completion-integrity rules (accurate file counts in debriefs, scope evidence, verifier multi-repo support). Hardened auth override to require NODE_ENV !== production.
- 2026-03-06d: Added mandatory Operator Effort Minimization rules (no placeholders in paste-ready packages, single-artifact completeness check, fail-and-regenerate if user assembly would be required).
- 2026-03-06c: Added mandatory handoff-to-prompt pairing rule: every delivered handoff must include one matching single paste-ready Codex prompt in the same response unless the human opts out.
- 2026-03-06b: Added Claude pre-edit Spec Sanity Pass and bounded-deviation protocol; clarified default model policy (Codex default, escalate to Opus for high-ambiguity architecture/brand-planning decisions).
- 2026-03-06a: Hardened core protocol — resolved stop-vs-preflight contradiction, updated verifier for heading-based specs + 2026-03-06 artifact enforcement, added root verify-handoff.mjs wrapper.
- 2026-03-06: Added Strategy Session Template, Cross-Site Checklist, Debrief Script, Family Planning Protocol, and Protocol Health Dashboard seed (per operator request).
- Previous versions tracked in git history only.

Any protocol change must include a new changelog entry and version bump in ALL THREE brain files in the same change set.

## Canonical Codex Preamble (Always Prepend)

Before every Codex request in this workflow, prepend the exact preamble in:

- `docs/CODEX-PREAMBLE.md`

If a generated Codex prompt does not reflect this preamble's constraints, treat the output as non-compliant and regenerate.

## Primary Role

Codex is used to produce **ready-to-run Claude Code prompts** from active handoff specs.

Codex should not be used to skip the handoff process when the Codex -> Claude Code workflow is requested.

## Mandatory Workflow Order

1. Human selects next item.
2. Human creates/updates handoff spec in `docs/handoffs/`.
3. Codex generates Claude Code execution prompt.
4. Claude Code performs implementation.
5. Human returns Claude Code wrap-up for verification.
6. Iterate until verification passes.

## Default Execution Method (Automatic)

For scoped implementation work, use this method by default every time:

1. Discovery and findings capture in a temporary working spec.
2. Collaborative plan refinement with iterative updates to that working spec.
3. On human request for handoff, generate a fully execution-mapped handoff spec with exact insertion anchors, exact final text blocks, and a strict acceptance checklist.
4. Codex prompt generation.
5. Claude Code implementation.
6. Post-work QA from the returned summary.

## Handoff Modes (Automatic Selection)

- Use Mapped Mode for high-risk work (default):
	- GenAI workflow changes
	- Protocol/brain-file edits
	- Multi-route/multi-file behavior changes
	- Security/compliance-sensitive work
- Use Lean Mode for low-risk/simple work:
	- Narrow scope
	- Few files
	- No protocol or cross-workflow behavior change
- Lean Mode minimum requirements:
	- Objective
	- Exact file list
	- Acceptance criteria
	- Verification command
- Automatic escalation rule:
	- If ambiguity appears, scope grows, blockers occur, or protocol-sensitive behavior is discovered, switch to Mapped Mode immediately.

### Working Spec Path Convention (Do Not Ask Human To Name It)

- Codex and Claude Code must use one canonical temporary working spec path as single source of truth:
	- `docs/handoffs/_working/<handoff-id>-working-spec.md`
- Preferred `<handoff-id>` format: `YYYYMMDD-short-slug` (example: `20260306-postmaster-no-cta`).
- If `<handoff-id>` is not provided by the human, Codex must generate one automatically (date + short slug) and continue without asking for naming/path decisions.
- All discovery findings and plan updates must be written to this working spec before generating the final execution-mapped handoff.
- The final handoff spec must explicitly reference the working spec used to derive implementation details.

## Non-Negotiable Rules

- Do not implement code when asked to generate the Claude Code prompt.
- Do not omit the verification step.
- Do not mark completion before verification passes.
- Keep scope constrained to the active handoff spec.
- If the handoff spec path is missing and no complete inline execution details are available, stop and report blocker.
- If canonical handoff/working spec files are missing but complete execution details are present inline in the prompt, instruct Claude Code to create those files first at canonical paths, then execute (preflight unblock).
- Do not offload working-spec naming or path decisions to the human; follow the path convention automatically.
- Use this explicit preflight block in Codex-generated Claude prompts:
	- "If canonical spec files are missing and inline execution details are complete, create both canonical files first, confirm paths, then execute."

## Required Claude Code Prompt Sections

Every Codex-generated Claude Code prompt must include:

1. Objective
2. Exact handoff spec path
3. Exact target repo(s)
4. Ordered implementation steps
5. Acceptance criteria (copied from handoff spec)
6. Verification command
7. Roadmap update command
8. Failure handling if verification fails
9. GenAI workflow insertion audit section (when applicable): explicit instruction that Claude Code must verify no links/CTAs are injected by prompt layers/templates, generation/preview/regenerate routes, closings, URL-tagging, or other post-processing.
10. Execution-mapped edit instructions copied verbatim from the active handoff spec: file-by-file insertion anchors and strict acceptance checklist items (no summarization).
11. Selected execution mode declaration (Mapped or Lean), including explicit Lean→Mapped escalation criteria.
12. Preflight creation step (when needed): if canonical handoff files are absent and inline execution details are complete, create canonical working/handoff specs before implementation begins.
13. Canonical spec paths + handoff id in prompt body: include both canonical file paths and the active handoff id explicitly in executable steps.
14. Direct-unblock fallback clause: if Claude still pauses on missing-spec ambiguity after preflight instruction, issue a direct unblock reply to create canonical spec files from inline details and continue.

## Claude Spec Sanity Pass (Mandatory)

Codex-generated Claude prompts must include a pre-edit sanity step before any file modifications:

1. Claude must evaluate the incoming handoff for:
	- architectural conflicts,
	- brand/voice-ethos conflicts,
	- protocol conflicts,
	- hidden cross-site side effects.

2. If no conflicts are found:
	- Claude proceeds with mapped execution as written.

3. If conflicts are found:
	- Claude must produce a concise "Sanity Delta" block containing:
	  - conflict summary,
	  - exact impacted files/anchors,
	  - proposed minimal correction,
	  - risk if unchanged,
	  - updated acceptance criteria (only where required).

4. Bounded deviation rule:
	- Claude may deviate from mapped instructions only when:
	  - evidence is file-specific and reproducible, and
	  - change is minimal and strictly risk-reducing.
	- Any deviation must be explicitly labeled "Sanity Delta Applied" in wrap-up.

5. Human authority:
	- If deviation materially changes scope, Claude must stop and request human confirmation.

## Required Commands (unless handoff says otherwise)

Verification:

```bash
cd steampunk-strategy && node scripts/verify-handoff.mjs --handoff-name <HANDOFF_ID>
```

Roadmap update:

```bash
cd steampunk-strategy && node scripts/roadmap-updater.js "(<HANDOFF_ID>) <ROADMAP_ITEM_TEXT>" "<ONE_SENTENCE_SUMMARY>"
```

## Quality Bar for Codex Output

- Output one single paste-ready Claude Code prompt.
- If a handoff spec is delivered, include one matching single paste-ready Codex prompt in the same response unless the human explicitly opts out.
- No extra explanation before/after unless explicitly requested.
- Include exact file paths from the handoff spec.
- Preserve handoff execution details verbatim: file-by-file anchors and checklist language must be passed through to Claude Code without compression.
- Explicitly instruct Claude Code to read the handoff spec first.
- Explicitly instruct Claude Code to re-run verification after fixes.
- For GenAI workflow handoffs, include a mandatory "no-link/no-CTA insertion audit" step with required evidence (file paths + line anchors).
- Include explicit canonical paths + handoff id in the prompt body (not implied references only).
- Include a direct-unblock fallback line for missing-spec pauses.
- Include a mandatory pre-edit "Spec Sanity Pass" step in every Claude prompt.
- Include bounded-deviation conditions and "Sanity Delta" reporting format.

## Operator Effort Minimization (Mandatory)

- Default objective: minimize operator manual workload.
- For any "single paste-ready" request, output must be fully executable as-is.
- Do not output placeholders that require user substitution (forbidden examples: `<PASTE ...>`, `<FILL ...>`, `TODO`).
- Inline the exact task body, concrete paths, IDs, and commands directly in the artifact.
- Output exactly one artifact block unless the human explicitly requests multiple blocks.
- Run this pre-send completeness check before responding:
	1. No placeholders remain.
	2. All required protocol sections are present.
	3. All referenced paths/IDs are concrete.
	4. Artifact is zero-edit runnable by the operator.
- If any check fails, regenerate before sending.
- If one value is truly unknowable, ask exactly one targeted question instead of offloading assembly work.

## Model Routing Policy (Planning vs Execution)

- Default for deterministic handoff mapping and protocol packaging: GPT-5.3-Codex.
- Escalate planning to Opus-class reasoning when:
	- high-ambiguity architecture choices,
	- brand-ethos tradeoffs across sites,
	- strategy-level alternatives with unclear acceptance boundaries.
- Execution prompts remain deterministic and verification-bound regardless of planner model.

## Verification Layers Reference

- Layer 1: agent self-verification (`scripts/verify-handoff.mjs`)
- Layer 2: CI safeguard (`.github/workflows/handoff-verify.yml`)
- Layer 3: human spot-check against handoff spec

## Scope Discipline

Unless a handoff explicitly says otherwise, treat out-of-scope work as deferred and leave a note for roadmap/handoff follow-up.

## Completion Integrity (Mandatory)

- Debrief file counts must match the actual number of files modified, with evidence.
- Multi-repo handoff debriefs must list each repo and its file count separately.
- Scope isolation notes are required when a handoff touches files that overlap with other active branches.
- Verification context notes are required when verification was run on a branch other than main or when the verifier version differs from the canonical version.

## Protocol Change Sync Rule (Mandatory)

When workflow/protocol rules change, update all three brain files in the same change set:

1. `docs/CODEX.md`
2. `CLAUDE.md`
3. `../.github/copilot-instructions.md`

Do not consider protocol updates complete unless all three are synchronized.
## Environment Constraints (2026-03-06, apply to ALL generated Claude Code prompts)

- All Next.js repos are on 16.x. `next lint` was removed in Next.js 16. Use `eslint` or `npx eslint .` for linting, never `next lint`.
- Every verification block MUST include `npx tsc --noEmit` for each modified repo. Do not claim PASS without zero-error tsc output.
- Cross-repo CI workflows in GitHub Actions require explicit checkout of sibling repos — flag this in Sanity Pass if the workflow needs files from repos other than the hosting repo.
- ESLint configs: strategy (`eslint.config.mjs`), postmaster (`eslint.config.mjs`), rescuebarn (`eslint.config.mjs`), studiolo (`.eslintrc.json`), orchestrator (none), cleanpunk (none — Turbo monorepo).
- Auth stacks: Postmaster + Studiolo use NextAuth (`lib/auth.ts`). Rescue Barn uses Supabase auth (`src/proxy.ts` + `src/app/auth/callback/route.ts`). Cleanpunk uses Medusa built-in auth. Flag stack mismatches in Sanity Pass for auth-related prompts.
- `.github/copilot-instructions.md` is tracked in steampunk-strategy repo (not a standalone parent repo).
- Before marking any implementation complete, Claude MUST run `npx tsc --noEmit` in every modified repo and include the output in the Claim->Evidence table.
## Stoppage Triage Reference

- For operator-facing handling of Codex/Claude stoppage alerts, see:
	- `docs/operator-stoppage-cheat-card.md`
