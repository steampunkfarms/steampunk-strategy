# TARDIS Protocol Health Dashboard — Spec

**Page:** `/monitoring/protocol-health` (protected route)

This dashboard lives in TARDIS because it is the single pane of glass for the entire family.

---

## Phase A — File-Based Metrics (Current)

Phase A instruments the existing verification script to emit structured metric events, enabling protocol health tracking without any database or UI changes.

### Data Source

- `docs/protocol-metrics.jsonl` — append-only JSONL file, one line per verification run
- Each line emitted by `scripts/verify-handoff.mjs` at the end of every run

### Metric Schema (per event)

```json
{
  "handoffId": "20260306-governance-charter",
  "timestamp": "2026-03-06T18:30:00.000Z",
  "passed": true,
  "reposChecked": 1,
  "filesListed": 5,
  "mode": "mapped",
  "checksRun": 18,
  "checksPassed": 14,
  "checksWarned": 4,
  "checksFailed": 0,
  "tscErrorCount": 0,
  "satelliteStale": 0
}
```

### Artifacts

| File | Purpose |
|------|---------|
| `docs/protocol-metrics.jsonl` | Append-only structured metric log (git-tracked) |
| `docs/protocol-health-log.md` | Monthly health brief template for operator review |
| `scripts/protocol-health-summary.mjs` | CLI helper: reads JSONL, prints aggregate stats. Supports `--month YYYY-MM` filter |

### Usage

```bash
# Run verification (emits metric automatically)
node scripts/verify-handoff.mjs --handoff-name <ID>

# View aggregate summary
node scripts/protocol-health-summary.mjs

# View summary for a specific month
node scripts/protocol-health-summary.mjs --month 2026-03
```

### Derived Metrics (from JSONL aggregation)

- **Handoff pass rate:** `passed=true` count / total count
- **Average checks per run:** mean of `checksRun`
- **Warning ratio:** `checksWarned` / `checksRun` (high ratio = protocol drift)
- **TSC error trend:** `tscErrorCount` over time (should trend toward zero)
- **Satellite drift frequency:** `satelliteStale` count (non-zero = sync needed)
- **Mode distribution:** mapped vs lean percentage

---

## Phase B — TARDIS Dashboard UI (Future)

Phase B builds a visual dashboard in TARDIS that reads the JSONL data and renders interactive charts. This phase requires TARDIS to be deployed and operational.

### Metrics Tracked (real-time + 30-day trend)

- Handoff pass rate (first-pass verification %)
- Average lead time (request to verified completion)
- Defect escape rate (post-completion issues)
- % tasks using Mapped vs Lean mode
- Protocol compliance score (brain-file sync status + checklist adherence)
- TSC error trend over time
- Satellite doc freshness status
- Rework minutes per handoff (from debriefs)

### Visuals

- Recharts line charts for trends
- Gauge indicators (green/amber/red) for current health
- Mode distribution pie chart
- Satellite freshness status grid

### Data Pipeline

1. `docs/protocol-metrics.jsonl` is the source of truth
2. API route reads and parses JSONL on demand (no database needed initially)
3. Optional: periodic import into Neon PostgreSQL for query performance at scale

### Prerequisites for Phase B

- TARDIS deployed with auth working
- Sufficient JSONL data accumulated (recommend 10+ handoffs)
- Recharts already in TARDIS dependencies
