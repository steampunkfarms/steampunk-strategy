# Working Spec: 20260306-protocol-metrics-instrumentation

## Objective

Instrument the verification script to emit structured JSONL metric events, enabling quantitative protocol health tracking (Phase A of the Protocol Health Dashboard).

## Strategy Session Template Answers

- **Protocol Fit:** Extends existing verify-handoff.mjs with non-breaking additive counters. No architectural conflict.
- **Failure Mode Impact:** If JSONL emission fails, verification still runs and exits correctly. Metrics are append-only and non-blocking.
- **Operator Burden:** Zero — metrics emit automatically on every verification run. Summary script is opt-in CLI tool.
- **Measurable Gain:** Enables quantitative tracking of pass rates, warning ratios, TSC error trends, and satellite drift frequency.

## Cross-Site Impact Checklist

**Repos touched:**
- [x] steampunk-strategy (TARDIS + docs library)
- [ ] Rescue Barn
- [ ] Studiolo
- [ ] Postmaster
- [ ] Cleanpunk Shop
- [ ] TARDIS
- [ ] Orchestrator

**Authentication implications:** None
**Data-flow consequences:** None — file-local JSONL only
**Orchestrator / Cron impact:** None

**Verification commands required:**
- `node scripts/verify-handoff.mjs --handoff-name 20260306-protocol-metrics-instrumentation`

## Family Planning Protocol Gate

**Major Initiative Criteria check:** Does NOT meet Major Initiative threshold — single repo, no cross-site data flow changes, no auth changes, no donor experience impact, estimated effort < 8 handoffs.

**Reversibility Score:** 5/5 — all changes are additive and fully reversible via git revert. No schema changes, no external API changes, no data mutations.

## Implementation Plan

1. Add inline counters (checksPassed, checksWarned, checksFailed, tscErrorCount, satelliteStale) to verify-handoff.mjs
2. Add JSONL metric emission at end of verification run
3. Create empty docs/protocol-metrics.jsonl
4. Confirm JSONL file is not in .gitignore (should be git-tracked)
5. Create docs/protocol-health-log.md monthly health brief template
6. Create scripts/protocol-health-summary.mjs CLI helper
7. Rewrite docs/tardis-protocol-health-dashboard-spec.md with Phase A/B structure
8. Add v2026.03k changelog entries to CLAUDE.md and CODEX.md

## Execution Mode

Lean Mode — single repo, additive changes only, no cross-site impact.
