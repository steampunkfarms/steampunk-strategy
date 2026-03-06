# TARDIS Protocol Health Dashboard — High-Level Spec (Future Phase)

**Page:** `/monitoring/protocol-health` (protected route)

**Metrics tracked (real-time + 30-day trend):**
- Handoff pass rate (first-pass verification %)
- Average lead time (request → verified completion)
- Defect escape rate (post-completion issues)
- % tasks using Mapped vs Lean mode
- Protocol compliance score (brain-file sync status + checklist adherence)
- Rework minutes per handoff (from debriefs)

**Visuals:** Recharts line charts + gauge indicators (green/amber/red).

**Data source:** Parse `verify-handoff.mjs` output + roadmap updater logs + debrief templates stored in Supabase.

This dashboard lives in TARDIS because it is the single pane of glass for the entire family.