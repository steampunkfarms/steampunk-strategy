# Protocol Changelog

This file tracks changes to the CLAUDE.md protocol. It was moved here from the top of CLAUDE.md to reclaim context window space — the AI agent doesn't need change history to execute the rules correctly. Git history provides the same information with more detail.

## v2026.03m

- 2026-03-10m: Moved changelog out of CLAUDE.md into this file. Protocol change procedure updated to reference this file instead.

- 2026-03-08m-patch2: Added Deploy Gate (step 8) — mandatory push to origin after QA pass. No more unpushed commits.

- 2026-03-08m-patch: Added ENV VAR SAFETY rule — .trim() on all secret reads, operator paste warnings.

- 2026-03-08l-patch: Added Operator Action Block (step 7) to CC Post-Execution QA Protocol. Ensures manual operator steps are surfaced at the top of every debrief, not buried in summary.

- 2026-03-08l: Two-Actor Model — retired Codex mandatory QA role. QA responsibilities absorbed into CC post-execution checklist. CChat remains strategic architect, CC is executor + QA gate. Codex available as optional ad-hoc tool. Added CC Post-Execution QA Protocol, External Review Exception Table, Optional Tools section. Deprecated docs/CODEX.md. Protocol change procedure no longer requires CODEX.md sync.

- 2026-03-06k: Protocol Metrics Instrumentation Phase A. Instrumented verify-handoff.mjs with inline counters (checksPassed, checksWarned, checksFailed, tscErrorCount, satelliteStale) and append-only JSONL metric emission to docs/protocol-metrics.jsonl. Created protocol-health-log.md template, protocol-health-summary.mjs CLI helper. Rewrote tardis-protocol-health-dashboard-spec.md with Phase A (file-based) / Phase B (UI) structure.

- 2026-03-06j: Created GOVERNANCE.md — centralized governance charter with decision authority matrix, risk appetite statement, exception process, amendment rules, family roles, governance review cadence, and document hierarchy. Added cross-references from CLAUDE.md and CODEX.md. Added GOVERNANCE.md to satellite sync list.

- 2026-03-06i: CChat protocol hardening audit. Fixed stale Copilot ref in strategy-session-template. Widened protocol sync rule to list satellite docs. Added Tier 0 Hotfix path with mandatory backfill. Added Novel Pattern trigger for Tier 3. Hardened tsc error reporting in verifier (error count + combined stdout/stderr). Added satellite doc freshness Check 9 to verifier. Split roadmap into 3 files (roadmap.md, roadmap-deferred.md, roadmap-archive.md) and updated verifier + updater script.

- 2026-03-06h: Restructured to three-actor model with tiered workflows (later superseded by v2026.03l two-actor model). CC self-enforces protocol compliance for all non-trivial work. CChat reserved for strategic/complex work only. Copilot retired and archived.

- 2026-03-06g: Added mandatory change-history-first investigation protocol for fix-propagation requests (start with git/changelogs/handoffs before targeted code sweep).
- 2026-03-06f: Added Environment Constraints block to all three brain files + CODEX-PREAMBLE (Next.js 16 lint fix, mandatory tsc --noEmit in verification, auth stack map, ESLint config map, cross-repo CI checkout flag).
- 2026-03-06e: Added completion-integrity rules (accurate file counts in debriefs, scope evidence, verifier multi-repo support). Hardened auth override to require NODE_ENV !== production.
- 2026-03-06d: Added mandatory Operator Effort Minimization rules (no placeholders in paste-ready packages, single-artifact completeness check, fail-and-regenerate if user assembly would be required).
- 2026-03-06c: Added mandatory handoff-to-prompt pairing rule: every delivered handoff must include one matching single paste-ready Codex prompt in the same response unless the human opts out.
- 2026-03-06b: Added Claude pre-edit Spec Sanity Pass and bounded-deviation protocol; clarified default model policy (Codex default, escalate to Opus for high-ambiguity architecture/brand-planning decisions).
- 2026-03-06a: Hardened core protocol — resolved stop-vs-preflight contradiction in CODEX.md, updated verifier for heading-based specs + 2026-03-06 artifact enforcement, added root verify-handoff.mjs wrapper.
- 2026-03-06: Added Strategy Session Template, Cross-Site Checklist, Debrief Script, Family Planning Protocol, and Protocol Health Dashboard seed (per operator request).
- Previous versions tracked in git history only.
