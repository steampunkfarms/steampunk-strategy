# Strategy Session Template — Steampunk Farms

Use this template at the start of every new idea or initiative. Answer all five questions before moving to handoff prep.

**Objective (one sentence):**  
[Human intent here]

**1. Protocol Fit**  
Does this align with existing gates, verification layers, and voice guardrails? (Yes/No + one-sentence justification)

**2. Failure Mode Impact**  
What breaks if it fails silently? (cross-site data flow, donor trust, compliance, etc.)

**3. Operator Burden Delta**  
Does this reduce or increase manual workload? (quantify in minutes per week if possible)

**4. Measurable Gain**  
What single metric improves? (lead time, handoff pass rate, first-pass verification %, defect escape rate)

**5. Reversibility**  
Can it be rolled back cleanly in <15 minutes with no data loss? (Yes/No + method)

**Protocol Fit Score** (0–10):
[CC fills during working spec creation (Tier 2) or CChat fills during planning (Tier 3)]

**Recommended Tier:**
- Tier 1 — Quick Fix (no ceremony needed)
- Tier 2 — Standard Work (Human + CC, Codex QA) — **default**
- Tier 3 — Strategic (CChat plans, Codex audits, CC executes)

**Next Action:**  
If score ≥ 7 and reversible, proceed to working spec at `docs/handoffs/_working/YYYYMMDD-short-slug-working-spec.md`.