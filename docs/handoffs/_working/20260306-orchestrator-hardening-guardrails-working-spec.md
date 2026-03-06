# Working Spec: 20260306-orchestrator-hardening-guardrails

## Strategy Session Template Answers

**What is the problem?**
Central scheduler is correct direction, but has fail-open and config-drift exposure. Admin APIs allow unauthenticated access when INTERNAL_SECRET is unset. Cron runner executes without auth when CRON_SECRET is missing. Lock DB errors fail-open allowing duplicate concurrent execution. vercel.json schedule can drift from registry source-of-truth.

**What is the desired outcome?**
Secure-by-default auth, deterministic lock/execute behavior, single-source schedule consistency, clearer operator signals.

**What are the constraints?**
Keep thin scheduler model; no app-owned logic migration; preserve runtime admin overrides.

**What is the success signal?**
CI catches schedule drift, admin/cron auth fails closed in prod, lock/DB errors do not trigger uncontrolled runs, dashboard clearly flags effective state.

## Reversibility Score

**Score:** High — all changes are scoped to orchestrator-only edits and env toggles. Fully reversible via git revert. No schema changes.

## Cross-Site Impact Checklist

- [x] No target app endpoint contracts changed
- [x] All app URLs in env map remain unchanged
- [x] Forwarded auth header (INTERNAL_SECRET) behavior preserved
- [x] Vercel cron paths remain stable for all registered jobs
- [x] Internal cross-site-report remains orchestrator-only

## Family Planning Protocol Gate

- **Gate result:** PASS
- **Reason:** This is scoped hardening, not a Major Initiative architecture pivot. No cross-repo protocol redesign. If scope expands, pause and request human approval.

## Discovery Notes

### Pre-existing schedule drift found
- `studiolo/social-harvest`: registry = `"0 6 * * *"` (daily), vercel.json = `"0 6 * * 1"` (weekly Monday)
- Resolution: registry is source-of-truth, vercel.json will be updated to match

### Security gaps identified
1. Admin APIs: `if (!secret) return true` — open when INTERNAL_SECRET unset
2. Cron runner: `if (cronSecret && ...)` — unauthenticated execution when CRON_SECRET unset
3. Lock: unexpected DB errors return `true` (fail-open) — concurrent execution risk
