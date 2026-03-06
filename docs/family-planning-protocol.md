# Family Planning Protocol — Major Initiative vs Tactical Handoff

Use this before any new idea enters the Codex pipeline.

**5-Question Screen (Strategy Session Template):**
1. Protocol Fit  
2. Failure Mode Impact  
3. Operator Burden Delta  
4. Measurable Gain  
5. Reversibility  

**Major Initiative Criteria** (all four required):
- Affects ≥2 sites
- Changes core data flow or authentication
- Impacts donor experience or compliance
- Estimated effort > 8 handoffs

**Reversibility Scoring** (0–10):
- 10 = rollback in <5 min with zero data loss
- 0 = irreversible schema change

**Decision Matrix:**
- Score ≥ 8 and reversible → Tactical Handoff (Lean or Mapped)
- Meets Major Initiative criteria → Family Planning Session + dedicated working spec + TARDIS impact review
- Score < 6 → Defer or kill

All Major Initiatives must be logged in `docs/roadmap.md` under “Priority One” with the full 5-question answers attached.