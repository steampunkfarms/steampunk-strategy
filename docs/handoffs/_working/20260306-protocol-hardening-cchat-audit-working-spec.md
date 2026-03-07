# Working Spec: 20260306-protocol-hardening-cchat-audit

## Strategy Session Template

**Objective:** Harden protocol infrastructure based on CChat audit findings — fix stale references, widen sync rules, add missing tier/trigger definitions, improve verifier robustness, and split bloated roadmap.

**1. Protocol Fit:** Yes — directly improves protocol enforcement and reduces drift risk.
**2. Failure Mode Impact:** Stale satellite docs cause actor confusion; bloated roadmap wastes tokens.
**3. Operator Burden Delta:** Reduces manual sync effort by ~10 min/session (satellite doc list, roadmap split).
**4. Measurable Gain:** Verifier coverage increases from 8 to 9 checks; roadmap.md drops from 1098 to 318 lines.
**5. Reversibility:** Yes — all changes are additive or file splits; git revert restores original state in <5 min.

**Protocol Fit Score:** 9/10
**Reversibility Score:** 9/10 (all file-level, no schema or API changes)

## Family Planning Protocol Gate

**Major Initiative Criteria check:** Does NOT meet Major Initiative threshold (single repo, no core data flow/auth changes, no donor experience impact, effort < 8 handoffs). Standard Tier 2 work.

## Cross-Site Impact Checklist

- Repos touched: steampunk-strategy only
- Shared auth: not affected
- Cross-site data flow: not affected
- CI/CD: not affected (verify-handoff.mjs is local script)

## Scope

8 ordered changes to protocol brain files, satellite docs, verifier, and roadmap infrastructure. No code changes to application source. Strategy-only repo.

## Discovery Notes

CChat (Opus 4.6 in Cline) performed a full audit of the v2026.03h protocol files and identified 6 hardening items plus 2 infrastructure improvements. All findings are internal to the protocol layer — no application code affected.
