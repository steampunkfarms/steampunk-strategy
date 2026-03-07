# Working Spec: 20260306-governance-charter

## Strategy Session Template

**Objective:** Create a centralized governance charter (GOVERNANCE.md) consolidating decision authority, risk appetite, exception process, and amendment rules that are currently scattered across protocol docs.

**1. Protocol Fit:** Yes — directly addresses a gap identified in external review (Stazia). Centralizes governance without changing any existing rules.
**2. Failure Mode Impact:** Without centralized governance, AI agents may silently resolve conflicts between docs. Low immediate risk (rules exist, just scattered), but governance clarity prevents future drift.
**3. Operator Burden Delta:** Reduces confusion when onboarding external reviewers or checking authority for edge cases. Saves ~5 min per ambiguous decision lookup.
**4. Measurable Gain:** Single-document governance resolution instead of searching 5+ files. External reviewers (Stazia) can assess governance in one read.
**5. Reversibility:** Yes — new file only, no existing content modified (only cross-references added). Git revert or file delete in <2 min.

**Protocol Fit Score:** 9/10
**Reversibility Score:** 10/10 (new file, cross-references only)

## Family Planning Protocol Gate

**Major Initiative Criteria check:** Does NOT meet threshold (single repo, no data flow/auth changes, no donor impact, effort = 1 handoff). Standard work with Tier 3 origin (CChat-planned).

## Cross-Site Impact Checklist

- Repos touched: steampunk-strategy only
- Shared auth: not affected
- Cross-site data flow: not affected
- CI/CD: not affected
