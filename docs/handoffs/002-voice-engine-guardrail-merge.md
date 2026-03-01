# Handoff: Voice Engine Guardrail Merge + Validation Port

> **Status:** Complete (2026-02-28)
> **Target repos:** steampunk-postmaster AND steampunk-studiolo
> **Priority:** 🟠 High — bidirectional drift in shared AI safety layer
> **Created:** 2026-02-28

---

## Problem

The `UNIVERSAL_VOICE_GUARDRAILS` constant is duplicated across two repos and has diverged in both directions. Neither copy is the "correct" one — each has content the other lacks. Additionally, `POSTMASTER_PLATFORM_CONTEXT` is duplicated with drift, and Studiolo lacks the post-generation validation that Postmaster has.

### Three issues, one handoff:

**Issue A — Guardrails divergence (guardrails.ts in both repos)**
Postmaster (79 lines) has stricter prohibitions. Studiolo (71 lines) has richer behavioral guidance. See detailed diff below.

**Issue B — POSTMASTER_PLATFORM_CONTEXT divergence (platform-context.ts in both repos)**
Postmaster's copy has a "CONTENT DISCIPLINE" block that Studiolo's copy lacks.

**Issue C — No post-generation validation in Studiolo**
Postmaster has `validateHugCompliance()` in `lib/claude/client.ts` that checks generated output for banned phrases, urgency patterns, sanctuary violations, and exclamation limits. Studiolo has no equivalent — it relies solely on prompt-level guardrails. Krystal reviews all drafts manually, but defense-in-depth requires programmatic validation too.

---

## Detailed Guardrails Diff (Issue A)

### Postmaster has, Studiolo lacks:

**NEVER list additions:**
- `calving, farrowing` added to breeding language line
- `yield, livestock` added to agricultural production line
- `head of cattle` added to farm operations line
- Full new line: `Animals born at the sanctuary (no "baby goats", "newborns", "born here" — animals arrived through rescue/surrender/seizure)`
- `Humans are "caretakers" or "two-leggers", not "staff"` in INSTEAD section
- `"make a difference today"` added to mass-mailer phrase
- Full urgency/guilt section as explicit prohibition #3 with 5 sub-bullets + exclamation limit
- Prohibition #11: `Never fabricate caretaker names`
- Prohibition #12: `Never fabricate medical conditions, diagnoses, or health issues for any animal`

### Studiolo has, Postmaster lacks:

**REQUIRED BEHAVIORS enrichments:**
- Closing Line Protocol: 4 example patterns + anti-repetition instruction + donor interest prioritization
- Gift Reference Protocol: Concrete example ("When your gift came through last week, I was in the feed barn doing math on the hay order")
- Animal Currency Protocol: "memory ledger or animal interest flags" trigger, fallback to personality traits when no Chronicle data
- Frontier Correspondence Voice: "Paragraphs can be one sentence long" + "oil lamp with a cup of coffee gone cold" imagery
- Specificity Over Sentiment: Concrete example pair ("the mud was ankle-deep" vs "your support means so much")
- Sprezzatura: "If a sentence feels like it's trying too hard, simplify it"

---

## Target State

### guardrails.ts (both repos — identical)
Take the UNION: all of Postmaster's stricter prohibitions merged with all of Studiolo's richer behavioral examples. The merged file should be ~95 lines in the template literal. Write it once, copy it identically to both repos.

### platform-context.ts
Sync `POSTMASTER_PLATFORM_CONTEXT` — add the "CONTENT DISCIPLINE" block from Postmaster's copy to Studiolo's copy. The `STUDIOLO_PLATFORM_CONTEXT` in Studiolo is unique and stays as-is.

### validateHugCompliance() — port to Studiolo
Copy `validateHugCompliance()` from `steampunk-postmaster/lib/claude/client.ts` to a new file `steampunk-studiolo/lib/voice-engine/hug-validator.ts`. Then integrate it into all three compose entry points:

| Surface | File | Integration Point |
|---------|------|-------------------|
| Personal Compose | `app/api/compose/draft/route.ts` | After AI response, before returning to UI |
| Scriptorium AI Assist | `app/api/scriptorium/ai-assist/route.ts` | After AI response, before returning |
| Bulk Compose | `app/api/bulk-compose/schedule/route.ts` | After AI response, before queuing |

The validator should NOT block sending — Krystal has final review. Instead:
- Return violations as warnings in the API response
- UI should display them as amber badges on the draft
- Log violations for quality tracking

---

## Files Affected

### steampunk-postmaster
- `lib/voice-engine/guardrails.ts` — replace with merged version

### steampunk-studiolo
- `lib/voice-engine/guardrails.ts` — replace with merged version (identical to Postmaster)
- `lib/voice-engine/platform-context.ts` — sync POSTMASTER_PLATFORM_CONTEXT block
- `lib/voice-engine/hug-validator.ts` — NEW FILE: ported validateHugCompliance()
- `app/api/compose/draft/route.ts` — integrate validator
- `app/api/scriptorium/ai-assist/route.ts` — integrate validator
- `app/api/bulk-compose/schedule/route.ts` — integrate validator

### Database Changes
None.

---

## Pre-Merge Checklist (per repo)
1. `npx tsc --noEmit` — no type errors
2. `npx next build` — build succeeds
3. Spot-check: generate a test draft via Personal Compose → verify guardrails and closing line guidance both appear in system prompt
4. Spot-check: verify validator catches "we desperately need" in test output
5. Verify both guardrails.ts files are byte-identical: `diff steampunk-postmaster/lib/voice-engine/guardrails.ts steampunk-studiolo/lib/voice-engine/guardrails.ts`

## Acceptance Criteria
- [x] `guardrails.ts` identical in both repos, contains ALL prohibitions and ALL behavioral guidance
- [x] `POSTMASTER_PLATFORM_CONTEXT` identical in both repos
- [x] `validateHugCompliance()` exists in Studiolo and is wired into all 3 compose surfaces
- [x] Validator returns warnings (not blocks) — Krystal always has manual final review
- [x] Both repos build and pass type checks

## Implementation Notes
- Handoff spec referenced `bulk-compose/schedule/route.ts` but that route only calculates send times (no AI). Wired validator into `lib/bulk-compose/batch-resolver.ts` instead, which is where AI-resolved content is generated.
- Validator appends `hugWarnings` array to compose/draft variations and scriptorium responses, and merges violations into the existing `warnings` array in batch-resolver.
- Guardrails merged file is 96 lines in the template literal (12 prohibitions + 6 required behaviors with enriched examples).

## Cross-Site Implications
Both repos are modified in this handoff. Deploy order doesn't matter — changes are additive (stricter guardrails, richer examples, new validation). No breaking changes.

## Deferred
- Extracting guardrails into a shared npm package or Orchestrator-served endpoint (Orchestrator not yet operational)
- CI check for guardrail drift between repos
- Validator quality dashboard / violation tracking over time
