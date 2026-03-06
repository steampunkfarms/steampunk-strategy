# Working Spec: 20260306-orchestrator-hardening-remediation-audit-fixes

## Strategy Session Template Answers

**What is the problem?**
Post-hardening audit identified four issues: (1) verifier `extractTargetRepo` only extracts a single repo and silently falls back to `process.cwd()` for multi-repo handoffs, producing false-green results; (2) orchestrator admin auth override (`ALLOW_INSECURE_LOCAL_ADMIN`) lacks `NODE_ENV` guard, meaning it could be accidentally enabled in production; (3) brain files need v2026.03e bump with completion-integrity rules; (4) hardening handoff debrief has minor count/scope inconsistencies.

**What is the desired outcome?**
Verifier correctly resolves and validates all target repos in multi-repo handoffs. Auth override is truly local-dev-only with NODE_ENV check. Brain files synced to v2026.03e with new completion-integrity section. Handoff debrief corrected for accurate reporting.

**What are the constraints?**
No business-logic changes. Verifier changes must be backward-compatible with existing handoff specs. Auth override fix must not break local dev workflows. Protocol changes must sync across all three brain files.

**What is the success signal?**
Verifier correctly identifies multi-repo handoffs and validates each repo independently. Auth override blocked in production even if env var is set. Brain files at v2026.03e with identical changelog entries. Debrief counts match actual file counts.

## Reversibility Score

**Score:** High — all changes are additive (verifier logic, env guard, version bump). Fully reversible by reverting commits.

## Cross-Site Impact Checklist

- [x] No target app endpoint contracts changed
- [x] All app URLs in env map remain unchanged
- [x] No business logic modified — verifier, auth guard, and protocol docs only
- [x] Vercel cron paths remain stable for all registered jobs
- [x] No cross-repo data flow changes

## Family Planning Protocol Gate

- **Gate result:** PASS
- **Reason:** Scoped remediation of identified issues from prior handoff audit. No cross-repo protocol redesign.

## Discovery Notes

### Issues identified in post-hardening audit

1. **Verifier false-green risk:** `extractTargetRepo()` in `verify-handoff.mjs` only extracts one repo name. For multi-repo handoffs (e.g., `20260306-multi-repo-dirty-state-remediation` targeting 6 repos), it either extracts only the first or falls back to `process.cwd()`. Verification then runs only against strategy repo, missing issues in other repos.

2. **Auth override production leak:** `ALLOW_INSECURE_LOCAL_ADMIN` has no `NODE_ENV` check. If accidentally set in production environment variables, admin APIs would be unauthenticated. Three files affected: `admin/jobs/route.ts`, `admin/jobs/[jobName]/route.ts`, `cron-stats/route.ts`.

3. **Brain-file version drift:** v2026.03d is current; need v2026.03e with completion-integrity rules that mandate accurate file counts and scope evidence in debriefs.

4. **Debrief count inconsistency:** Hardening handoff debrief says "12 files modified" but the scope list also has 12 items — needs verification that the count is accurate and includes strategy-side spec files.
