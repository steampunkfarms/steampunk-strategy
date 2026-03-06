# Working Spec: 20260306-strategy-protocol-docs-sync

Source of truth for handoff `20260306-strategy-protocol-docs-sync`.

---

## Strategy Session Template Answers

**Objective (one sentence):**
Verify placement and synchronization of seven required protocol artifacts, fix CODEX-PREAMBLE placeholder, and confirm brain-file changelog/version rule consistency.

**1. Protocol Fit**
Yes — this directly strengthens the existing gate/verification system by ensuring all protocol docs are properly placed, non-placeholder, and synchronized.

**2. Failure Mode Impact**
If protocol docs are incomplete or out of sync, future handoffs may be generated from stale or placeholder instructions, causing missed audit steps or inconsistent behavior across Codex/Claude Code/Copilot agents.

**3. Operator Burden Delta**
Reduces manual workload by ~5 min/week — operator no longer needs to mentally verify protocol doc consistency before each handoff.

**4. Measurable Gain**
First-pass verification % improves — handoffs generated from complete, non-placeholder protocol docs will pass verification more reliably.

**5. Reversibility**
Yes — all changes are text-only edits to markdown files in steampunk-strategy. Rollback via `git checkout -- <files>` in <1 minute with no data loss.

**Protocol Fit Score:** 9/10
**Recommended Lane:** Handoff preparation (default)
**Next Action:** Proceed with working spec and execution.

---

## Family Planning Protocol Gate Decision

**Major Initiative Criteria (all four required):**
- Affects >= 2 sites: NO (steampunk-strategy only, cross-repo grep for verification only)
- Changes core data flow or authentication: NO
- Impacts donor experience or compliance: NO
- Estimated effort > 8 handoffs: NO (single handoff)

**Result:** Does NOT meet Major Initiative criteria. This is a **Tactical Handoff**.

**Reversibility Score:** 9/10 (all markdown edits, rollback via git in <1 min, zero data loss)

**Decision Matrix Outcome:** Score >= 8 and reversible -> Tactical Handoff (Mapped Mode selected due to protocol-sensitive nature of brain-file edits).

**Lane:** Tactical Handoff, Mapped Mode.

---

## Cross-Site Impact Checklist

**Repos touched:**
- [ ] Rescue Barn
- [ ] Studiolo
- [ ] Postmaster
- [ ] Cleanpunk Shop
- [x] TARDIS (steampunk-strategy — protocol docs and brain files)
- [ ] Orchestrator

**Authentication implications:**
None. No auth changes.

**Data-flow consequences:**
None. No data flow or API changes.

**Orchestrator / Cron impact:**
None. No jobs or schedules affected.

**Verification commands required:**
- `node scripts/verify-handoff.mjs --handoff-name 20260306-strategy-protocol-docs-sync`
- Cross-repo grep for sync rule sentence
- Grep for required keywords in protocol docs

Only TARDIS touched — no automatic Mapped Mode escalation from checklist (already in Mapped Mode for protocol-sensitivity reasons).

---

## Canonical Placement Matrix

| # | Artifact | Path | Status | Action Needed |
|---|----------|------|--------|---------------|
| 1 | Strategy Session Template | `docs/strategy-session-template.md` | EXISTS | None |
| 2 | Cross-Site Impact Checklist | `docs/cross-site-impact-checklist.md` | EXISTS | None |
| 3a | Brain-file changelog/version rule — CLAUDE.md | `CLAUDE.md` line 8 | EXISTS, SYNCED | None |
| 3b | Brain-file changelog/version rule — CODEX.md | `docs/CODEX.md` line 10 | EXISTS, SYNCED | None |
| 3c | Brain-file changelog/version rule — copilot-instructions.md | `../.github/copilot-instructions.md` line 17 | EXISTS, SYNCED | None |
| 4 | Debrief Template | `docs/handoffs/_templates/debrief-template.md` | EXISTS | None |
| 5 | CODEX-PREAMBLE | `docs/CODEX-PREAMBLE.md` | EXISTS, HAS PLACEHOLDER | Replace placeholder with merged text |
| 6 | Family Planning Protocol | `docs/family-planning-protocol.md` | EXISTS | None |
| 7 | Protocol Health Dashboard Spec | `docs/tardis-protocol-health-dashboard-spec.md` | EXISTS | None |

---

## Brain-File Synchronization Checklist

| Check | CLAUDE.md | CODEX.md | copilot-instructions.md | Synced? |
|-------|-----------|----------|------------------------|---------|
| Changelog header present | v2026.03 (line 3) | v2026.03 (line 5) | v2026.03 (line 13) | YES |
| 2026-03-06 entry present | line 5 | line 7 | line 14 | YES |
| Sync rule sentence exact match | line 8 | line 10 | line 17 | YES |
| Protocol Change Sync Rule section | Present | Present (line 141) | Present (line 206) | YES |

All three brain files are already synchronized. No edits needed for changelog/version rule.

---

## CODEX-PREAMBLE Fix Required

Current state: Line 10 contains `[Rest of original preamble remains unchanged...]` — this is placeholder text.

Action: Replace entire file content with the merged non-placeholder preamble specified in the handoff prompt.

---

## Verification Plan

1. Run `node scripts/verify-handoff.mjs --handoff-name 20260306-strategy-protocol-docs-sync`
2. Grep all three brain files for exact sync rule sentence
3. Grep protocol docs for required keywords (Strategy Session Template, Cross-Site Impact Checklist, Debrief, Family Planning Protocol, Risk & Reversibility)
4. Verify CODEX-PREAMBLE.md has no placeholder wording

---

## Acceptance Checklist

- [ ] Both canonical files exist at exact paths
- [ ] Working spec includes all five Strategy Session Template answers
- [ ] Working spec includes Family Planning Protocol gate decision
- [ ] Working spec includes completed Cross-Site Impact Checklist
- [ ] Working spec includes canonical placement matrix for all 7 items
- [ ] Brain-file synchronization checklist present and completed
- [ ] Exact sync rule sentence present and identical in all three brain files
- [ ] Changelog entry + version bump synchronized across all three brain files
- [ ] CODEX-PREAMBLE.md has no placeholder wording and contains merged requirements
- [ ] Required verification commands succeed
- [ ] Completed debrief section appended to final handoff spec
- [ ] One-sentence roadmap-updater summary line present and command-ready
- [ ] If any item fails, task remains incomplete
