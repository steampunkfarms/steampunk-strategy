# Working Spec: 20260306-guardrail-drift-ci

## Objective

Create a CI guardrail that fails when `lib/voice-engine/guardrails.ts` diverges between Postmaster and Studiolo. This file is the bedrock voice layer shared across both sites and must remain byte-identical.

## Discovery

- Both files exist and are currently identical.
- SHA-256: `24ccb0074f2d2b0de4deed0dacb64096507d158430acdf8418b80d524d2bb829`
- 84 lines each, exporting `UNIVERSAL_VOICE_GUARDRAILS`.

## Plan

1. Create `scripts/check-guardrail-drift.mjs` in steampunk-strategy.
2. Create `.github/workflows/guardrail-drift.yml` in steampunk-strategy.
3. Verify locally before handoff.

## Files Created

| File | Repo | Purpose |
|------|------|---------|
| `scripts/check-guardrail-drift.mjs` | steampunk-strategy | SHA-256 comparison script |
| `.github/workflows/guardrail-drift.yml` | steampunk-strategy | GitHub Actions workflow |

## Status

COMPLETE -- verified locally 2026-03-06.
