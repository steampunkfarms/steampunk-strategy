# Experiment: CLAUDE.md Instruction Position Bias

## Hypothesis

> H: Instructions placed in the first 20 lines of CLAUDE.md produce higher compliance rates than identical instructions placed after line 200.

## Status: PHASE A (collecting baseline)

## Design

Two phases, 10 work sessions each. Same 5 test rules, different positions in CLAUDE.md.

- **Phase A** (current): Test rules inserted at lines 5-12 (top of file, right after the title)
- **Phase B**: Same rules moved to the bottom of CLAUDE.md (after all other content)
- **Control**: Rules are identical in wording across phases. No other CLAUDE.md changes during the experiment.

### The 5 Test Rules

These are chosen because compliance is binary and observable in every session:

1. **POSTEST-1**: When creating or modifying a file, include the comment `// postest` on the last line of the first code block touched in that session.
2. **POSTEST-2**: Begin every QA summary line with the session date in YYYY-MM-DD format.
3. **POSTEST-3**: When listing files in a debrief, sort them alphabetically (not by modification order).
4. **POSTEST-4**: Include the word "verified" (exactly, lowercase) in every commit message.
5. **POSTEST-5**: When reading a file for the first time in a session, state the line count before proceeding.

### Measurement

After each session, the operator (or CC if prompted) logs compliance to `docs/experiments/position-bias-log.jsonl`:

```json
{"session": 1, "phase": "A", "date": "2026-03-10", "rules": {"1": true, "2": false, "3": null, "4": true, "5": true}, "notes": "rule 3 not applicable — no debrief this session"}
```

- `true` = complied without prompting
- `false` = failed to comply (or complied only after being reminded)
- `null` = rule was not applicable in this session (e.g., no commit happened, so rule 4 can't be measured)

### Stop Triggers

The experiment auto-stops and surfaces a review prompt when ANY of these conditions are met:

| Trigger | Condition |
|---------|-----------|
| Phase A complete | 10 sessions logged with `phase: "A"` |
| Phase B complete | 10 sessions logged with `phase: "B"` |
| Calendar deadline | 2026-04-10 (30 days from start — prevents indefinite drift) |
| Early signal | 5+ sessions in either phase AND compliance rate delta > 40% between phases |

When a trigger fires, CC must output:

```
┌──────────────────────────────────────────────────┐
│ POSITION BIAS EXPERIMENT — REVIEW TRIGGERED      │
│                                                  │
│ Trigger: [which one fired]                       │
│ Sessions logged: A=[n], B=[n]                    │
│ Action: Run analysis before continuing           │
│                                                  │
│ Command: node scripts/position-bias-analysis.mjs │
└──────────────────────────────────────────────────┘
```

### Analysis

After both phases complete (or calendar deadline hits), compare:

- Per-rule compliance rate: Phase A vs Phase B
- Overall compliance rate: Phase A vs Phase B
- Applicable-rule compliance rate (excluding nulls)
- Qualitative notes on failure patterns

### What We Learn

| Outcome | Implication |
|---------|-------------|
| A >> B (statistically significant) | Position matters. Keep critical rules near the top. |
| A ≈ B | Position doesn't matter much. Optimize CLAUDE.md for human readability instead. |
| A << B (unexpected) | Recency bias or other effect. Investigate further. |

### Limitations

- n=10 per phase is small. This detects large effects (>30% delta), not subtle ones.
- Single CLAUDE.md file, single model (Opus 4.6). Results may not generalize.
- Operator session behavior varies (some sessions are Tier 1, some Tier 2+).
- The act of having test rules may itself change behavior (Hawthorne effect).
