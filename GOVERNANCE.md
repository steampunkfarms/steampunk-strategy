# GOVERNANCE.md — Steampunk Farms AI Governance Charter

> Single source of truth for decision authority, risk appetite, exception handling,
> and protocol amendment rules across the Steampunk Farms AI orchestration system.
>
> This document centralizes governance principles that are implemented in detail
> across CLAUDE.md (execution protocol), CODEX.md (QA contract), and satellite
> protocol docs. If this document conflicts with a brain file, escalate to Fred
> for reconciliation — do not silently pick one.
>
> Last updated: 2026-03-06 (v2026.03j)

---

## Principles

1. **Human judgment is sovereign.** AI executes, humans decide. No AI agent may override an explicit human instruction, even if it conflicts with protocol. The human accepts the risk.
2. **Verification is mandatory.** Completion without evidence is not completion. Every non-trivial change must pass `npx tsc --noEmit` and `verify-handoff.mjs` at minimum.
3. **Protocol changes require synchronized brain files.** CLAUDE.md and CODEX.md are updated together, always. Satellite docs follow per the sync rule.
4. **Operator effort minimization.** AI must not create work for the human. Outputs must be zero-edit runnable. No placeholders, no assembly required.
5. **Reversibility by default.** Prefer changes that can be rolled back in <15 minutes with no data loss. Irreversible changes require explicit human approval.
6. **Transparency over opacity.** Debriefs must be honest about what changed, what broke, and what was deferred. No "looks done" reporting.

---

## Decision Authority

| Decision Type | Authority | Override Requires |
|---|---|---|
| Tier 0 (hotfix) | Fred + CC | Backfill within 24h |
| Tier 1 (quick fix) | Fred or CC | None |
| Tier 2 (standard work) | Fred + CC | None |
| Tier 3 (strategic) | Fred + CChat + Codex QA | None |
| Protocol/brain file changes | Fred (author) + CC/CChat (draft) | Brain file sync rule |
| Security/auth changes | Fred | Codex post-flight mandatory |
| Schema/data model changes | Fred | Codex pre-flight mandatory |
| Brand/voice changes | Fred + Krystal (brand authority) | CChat consultation recommended |
| Financial/compliance decisions | Fred + Krystal (CFO/Treasurer) | TARDIS audit trail |
| Kill/defer decisions on roadmap items | Fred | Reasoned justification logged in roadmap |
| External idea evaluation | Fred (using family-planning-protocol) | Reasoned response to contributor |
| Production deployment | Fred | Verification gate must pass first |

### Family Roles

| Person | Role | Governance Input |
|---|---|---|
| **Fred** (CEO/President) | Sole protocol authority, primary operator | All final decisions |
| **Krystal** (CFO/Treasurer) | Brand authority, financial/compliance authority, primary sanctuary caretaker | Brand/voice sign-off, financial decisions, compliance review |
| **Tierra** (Operations) | Sanctuary operations, logistics, physical plant | Operational feasibility input, sanctuary workflow requirements |
| **Stazia** (External Advisor) | Sr AI Dev Engineer, Fortune 500 SaaS — sends architecture and systems ideas | Ideas always evaluated via family-planning-protocol. Receives reasoned response: adopted, deferred (with "revisit when" trigger), or declined (with justification). |

---

## Risk Appetite

### We Accept (move fast)
- Rapid iteration on UI/UX, content, and non-auth features
- Lean Mode handoffs for low-risk, single-file changes
- AI-generated content with HUG compliance validation
- Experimental features behind feature flags or unpublished routes

### We Require Extra Ceremony (Tier 2+ with Codex QA)
- Authentication or authorization changes (any repo)
- Data flow changes between sites (API contracts, webhook schemas)
- Prisma schema changes or Supabase migrations
- Compliance-facing features (990 reporting, donor PII handling, CAN-SPAM)
- Changes affecting donor experience or trust signals
- Financial data processing (TARDIS expense pipeline, cost tracking)

### We Never Accept
- Untested auth changes deployed to production
- Unverified schema migrations against production databases
- Silent failures in cron jobs that touch donor or financial data
- AI agents auto-sending donor communications without human review
- Bypassing `npx tsc --noEmit` verification for any modified repo
- Storing secrets in client-side code or git-tracked files

### Security Finding Priority
- **Critical findings** must be fixed before any feature work proceeds
- **High findings** are addressed within the current work sprint
- **Medium findings** are batched (see roadmap Priority One security section)

---

## Exception Process

1. **Any gate can be bypassed** by Fred with explicit justification logged in the working spec or inline with the request.
2. **Bypassed gates** must be noted in the handoff debrief and flagged for Codex post-flight review (even if the handoff otherwise bypasses Codex).
3. **Repeated bypasses** of the same gate (3+ times in 30 days) trigger a protocol review: is the gate wrong, or is the operator taking shortcuts? CC should flag this pattern proactively.
4. **AI agents may not bypass gates** on their own. The Bounded Deviation Rule (CLAUDE.md) allows minimal, evidence-based deviations during execution — but gate bypass requires human authorization.

---

## Amendment Process

1. **Anyone can propose** a protocol change: Fred, Krystal, Tierra, Stazia, or any AI agent (CC, CChat, Codex).
2. **Changes are drafted** by CC (Tier 2) or CChat (Tier 3), reviewed by Fred.
3. **Brain files** (CLAUDE.md + CODEX.md) are updated in the same change set.
4. **Satellite docs** are updated if affected (per v2026.03i sync rule).
5. **Changelog entry + version bump** required in both brain files.
6. **No committee approval needed** — Fred is the sole protocol authority.
7. **External contributor ideas** (especially Stazia's) always receive a reasoned response: adopted, adopted-with-modifications, deferred (with "revisit when" trigger), or declined (with justification for why it won't work for us or won't work for us right now).

---

## Governance Review Cadence

- **Per-handoff:** Verification gate + optional Codex audit (mandatory for Tier 2+)
- **Monthly (1st of month):** Protocol Health Brief generated from metrics data (see `docs/tardis-protocol-health-dashboard-spec.md`). Appended to `docs/protocol-health-log.md`. Reviewed by Fred; shared with Stazia on request.
- **Quarterly:** Roadmap priority review. Fred + Krystal assess Priority One/Two alignment with sanctuary operational needs and grant/funding calendar.
- **Annual:** Full protocol review. Evaluate whether tier model, actor roles, and gate structure still match operational reality. Incorporate lessons from protocol-health-log trends.

---

## Document Hierarchy

If documents conflict, this is the resolution order:

1. **GOVERNANCE.md** (this file) — principles and authority
2. **CLAUDE.md** — execution protocol and detailed rules
3. **CODEX.md** — QA contract
4. **Satellite protocol docs** — authoritative extractions from brain files
5. **Reference cards** (per-site) — technical details, not governance

When in doubt, escalate to Fred. Do not silently resolve conflicts between governance documents.
