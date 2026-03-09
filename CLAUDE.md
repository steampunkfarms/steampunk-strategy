# CLAUDE.md — Steampunk Strategy: The Bridge

## Changelog (v2026.03m)

- 2026-03-08m-patch2: Added Deploy Gate (step 8) — mandatory push to origin after QA pass. No more unpushed commits.

- 2026-03-08m-patch: Added ENV VAR SAFETY rule — .trim() on all secret reads, operator paste warnings.

- 2026-03-08l-patch: Added Operator Action Block (step 7) to CC Post-Execution QA Protocol. Ensures manual operator steps are surfaced at the top of every debrief, not buried in summary.

- 2026-03-08l: Two-Actor Model — retired Codex mandatory QA role. QA responsibilities absorbed into CC post-execution checklist. CChat remains strategic architect, CC is executor + QA gate. Codex available as optional ad-hoc tool. Added CC Post-Execution QA Protocol, External Review Exception Table, Optional Tools section. Deprecated docs/CODEX.md. Protocol change procedure no longer requires CODEX.md sync.

- 2026-03-06k: Protocol Metrics Instrumentation Phase A. Instrumented verify-handoff.mjs with inline counters (checksPassed, checksWarned, checksFailed, tscErrorCount, satelliteStale) and append-only JSONL metric emission to docs/protocol-metrics.jsonl. Created protocol-health-log.md template, protocol-health-summary.mjs CLI helper. Rewrote tardis-protocol-health-dashboard-spec.md with Phase A (file-based) / Phase B (UI) structure.

- 2026-03-06j: Created GOVERNANCE.md — centralized governance charter with decision authority matrix, risk appetite statement, exception process, amendment rules, family roles, governance review cadence, and document hierarchy. Added cross-references from CLAUDE.md and CODEX.md. Added GOVERNANCE.md to satellite sync list.

- 2026-03-06i: CChat protocol hardening audit. Fixed stale Copilot ref in strategy-session-template. Widened protocol sync rule to list satellite docs. Added Tier 0 Hotfix path with mandatory backfill. Added Novel Pattern trigger for Tier 3. Hardened tsc error reporting in verifier (error count + combined stdout/stderr). Added satellite doc freshness Check 9 to verifier. Split roadmap into 3 files (roadmap.md, roadmap-deferred.md, roadmap-archive.md) and updated verifier + updater script.

- 2026-03-06h: Restructured to three-actor model with tiered workflows (later superseded by v2026.03l two-actor model). CC self-enforces protocol compliance for all non-trivial work. CChat reserved for strategic/complex work only. Copilot retired and archived.

- 2026-03-06g: Added mandatory change-history-first investigation protocol for fix-propagation requests (start with git/changelogs/handoffs before targeted code sweep).
- 2026-03-06f: Added Environment Constraints block to all three brain files + CODEX-PREAMBLE (Next.js 16 lint fix, mandatory tsc --noEmit in verification, auth stack map, ESLint config map, cross-repo CI checkout flag).
- 2026-03-06e: Added completion-integrity rules (accurate file counts in debriefs, scope evidence, verifier multi-repo support). Hardened auth override to require NODE_ENV !== production.
- 2026-03-06d: Added mandatory Operator Effort Minimization rules (no placeholders in paste-ready packages, single-artifact completeness check, fail-and-regenerate if user assembly would be required).
- 2026-03-06c: Added mandatory handoff-to-prompt pairing rule: every delivered handoff must include one matching single paste-ready Codex prompt in the same response unless the human opts out.
- 2026-03-06b: Added Claude pre-edit Spec Sanity Pass and bounded-deviation protocol; clarified default model policy (Codex default, escalate to Opus for high-ambiguity architecture/brand-planning decisions).
- 2026-03-06a: Hardened core protocol — resolved stop-vs-preflight contradiction in CODEX.md, updated verifier for heading-based specs + 2026-03-06 artifact enforcement, added root verify-handoff.mjs wrapper.
- 2026-03-06: Added Strategy Session Template, Cross-Site Checklist, Debrief Script, Family Planning Protocol, and Protocol Health Dashboard seed (per operator request).
- Previous versions tracked in git history only.

Any protocol change must include a new changelog entry and version bump in this file, then cascade to all repos carrying CLAUDE.md.

## Project Overview

**The Bridge** is the 5th Vercel project in the Steampunk Farms family of sites. It serves as the central financial management, compliance tracking, and cross-site operations dashboard for Steampunk Farms Rescue Barn Inc., a 501(c)(3) nonprofit animal sanctuary.

- **URL:** https://tardis.steampunkstudiolo.org
- **Vercel Team:** steampunk-studiolo (team_lZqpvvTB4AXWLrFU8QxFi6if)
- **Auth:** Azure AD via NextAuth (shared app registration with Studiolo + Postmaster)
- **Database:** Neon PostgreSQL (dedicated instance, separate from Studiolo and Postmaster)
- **Theme:** TARDIS control room — deep blues, brass instruments, temporal glows

## Governance

For decision authority, risk appetite, exception handling, and protocol amendment rules, see `GOVERNANCE.md` at the repo root. GOVERNANCE.md is the authoritative source for "who can authorize what." This file (CLAUDE.md) is the authoritative source for "how work gets done."

## Architecture

### Stack
- Next.js 16.1.6 (App Router, Turbopack dev) + React 19 + TypeScript 5.7
- Prisma 6.3 + Neon PostgreSQL
- NextAuth 4.24 + Azure AD (Entra ID)
- Tailwind 3.4 + shadcn/ui + Radix primitives
- Claude AI (Anthropic SDK 0.78) for document parsing & categorization
- Recharts for financial visualizations
- Lucide icons

### Route Structure
All routes are protected behind Azure AD except `/login` and `/api/auth/*`.

```
app/
├── (public)/
│   └── login/              # Azure AD sign-in
├── (protected)/
│   ├── bridge/             # Main dashboard ("The Bridge")
│   ├── expenses/           # Transaction ledger, bank imports
│   ├── documents/          # Receipt/invoice upload & AI parsing
│   ├── vendors/            # Supplier directory, donor-paid bills
│   ├── compliance/         # Filing deadlines, regulatory tasks
│   ├── monitoring/         # Cross-site health dashboard
│   └── transparency/       # Public financial data management
└── api/
    ├── auth/[...nextauth]/ # NextAuth handler
    ├── cron/               # Scheduled jobs
    ├── parse/              # Document AI parsing
    ├── sync/               # Cross-site data sync
    └── webhooks/           # External service webhooks
```

### Data Model (Prisma)
Core entities: Transaction, Document, Vendor, ExpenseCategory, DonorPaidBill, BankImport, BankRecord, ComplianceTask, ComplianceCompletion, JournalNote, CostTracker, TransparencyItem, AuditLog

### Key Patterns (inherited from Studiolo)
- `lib/prisma.ts` — singleton PrismaClient
- `lib/auth.ts` — NextAuth config with Azure AD + token refresh
- `middleware.ts` — auth guard on all routes
- `(protected)/layout.tsx` — sidebar navigation
- `console-card`, `panel`, `badge-*` CSS classes for UI components
- Gauge indicators: green/amber/red/blue status dots

## Family of Sites Integration

| Site | Connection | Data Flow |
|------|-----------|-----------|
| Studiolo | Shared Azure AD, donor data sync | Donor-paid bills <-> donor records |
| Postmaster | Shared Azure AD, animal data | `/api/public/residents` for transparency |
| Rescue Barn | Transparency API consumer | Published financial data -> The Fine Print |
| Cleanpunk Shop | COGS tracking, sales data | Medusa inventory/orders -> cost analysis |

## Cron Jobs (6 planned)

| Job | Schedule | Purpose |
|-----|----------|---------|
| gmail-receipt-scan | Daily 2 PM UTC | Scan Gmail for Amazon, Chewy receipts |
| compliance-reminders | Daily 3 PM UTC | Check for upcoming/overdue filings |
| expense-review-alerts | Weekly (Mon) | Flag unverified transactions |
| candid-monitor | Monthly (1st) | Check GuideStar/Candid for profile changes |
| cost-creep-scan | Monthly (1st) | Detect cost increases in soap materials |
| sales-tax-calc | Monthly (1st) | Calculate sales tax from Cleanpunk Shop |

## Development

```bash
npm install
cp .env.example .env.local   # Fill in credentials
npx prisma db push            # Create tables in Neon
npm run dev                   # http://localhost:3000
```

## Color System

- `tardis-*` — Primary blues (dark, default, light, glow, dim)
- `console-*` — Panel surfaces (default, light, border, hover)
- `brass-*` — Accent/instrument colors (default, gold, dark, muted, warm)
- `gauge-*` — Status indicators (green, amber, red, blue)
- `parchment-*` / `walnut-*` — Inherited from Studiolo for continuity

## Special Feature: Donor-Paid Vendor Bills

A key differentiator: donors sometimes call vendors (Elston's Feed, Star Milling) directly to pay all or part of the farm's bill. The `DonorPaidBill` model tracks these, linking them to both the vendor and (optionally) the donor record in Studiolo. This data feeds the transparency directive, showing the public what percentage of feed costs are covered by direct donor generosity.

## Build Phases

1. **Phase 1 (Current):** Project scaffold, data model, auth, basic UI
2. **Phase 2:** Document upload + Claude AI parsing (receipts, invoices)
3. **Phase 3:** Bank import, Gmail receipt scanning, expense categorization
4. **Phase 4:** Compliance automation, reminders, filing links
5. **Phase 5:** Cross-site monitoring, Vercel API integration
6. **Phase 6:** Transparency API -> Rescue Barn integration
7. **Phase 7:** COGS tracking for Cleanpunk, cost creep detection


---

## Execution Model — Two-Actor Framework

This repo serves double duty: it's both the TARDIS codebase AND the central reference library for all 5 Steampunk Farms web properties. A consolidated Claude project space handles all planning, specs, and handoffs across the family of sites.

### Actors

| Actor | Tool | Role | Tiers |
|-------|------|------|-------|
| **CChat** (The Strategist) | Claude Opus — Cline (VS Code) | Strategic architecture, complex decisions, protocol governance, handoff authoring, codebase archaeology, cross-system design | Tier 3 |
| **CC** (The Executor) | Claude Code CLI | Planning + execution for standard work, post-execution QA, type checking, security verification | Tier 0, 1, 2 |

### How It Works

1. **Fred** identifies a need and routes to the appropriate tier
2. **Tier 3 (CChat)**: Fred describes the problem → CChat explores codebase, designs solution, writes handoff prompt with embedded acceptance criteria → Fred shuttles handoff to CC
3. **Tier 0/1/2 (CC)**: Fred provides task directly to CC → CC plans, executes, runs post-execution QA → pushes to main
4. **Fred** is the sole shuttle between actors. No direct CChat↔CC communication.

### Routing Rules

- **Tier 0 (Hotfix)**: CC direct — broken build, reverted deploy, critical typo. Fix first, backfill protocol artifacts after.
- **Tier 1 (Quick Fix)**: CC direct — small bug, config change, copy update. No ceremony required.
- **Tier 2 (Standard)**: CC-led — new feature, new API route, schema change, UI component. Full protocol: working spec, handoff spec, verification, roadmap update, debrief.
- **Tier 3 (Strategic)**: CChat-designed, CC-executed — architecture decisions, cross-repo changes, protocol updates, voice system design, BI platform design. Also triggers for Novel Patterns (first-time use of a new technology, integration pattern, or architectural approach not yet established in the codebase).

This is the DEFAULT for most work. When in doubt, use Tier 2.

### Escalation

If CC encounters ambiguity, unexpected complexity, or a decision that could affect other repos/systems, CC should STOP and recommend escalation to CChat. CC does not make architectural decisions.

### Protocol Compliance Rule (Non-Negotiable)

**Any work beyond Tier 1 must follow protocols.** This means:
- Create a working spec at `docs/handoffs/_working/<handoff-id>-working-spec.md`
- Generate a handoff spec with acceptance criteria
- Run verification (`node scripts/verify-handoff.mjs --handoff-name <ID>`)
- Run `npx tsc --noEmit` in every modified repo
- Run the CC Post-Execution QA Protocol (see below)
- Update `docs/roadmap.md` on completion
- Update changelogs when protocol/brain files change
- Produce a structured debrief

CC must self-enforce this. Do not wait for the human to ask. If the work is non-trivial, follow the protocol automatically.

### Reference Library

```
docs/
├── family-of-sites-full.md        # Cross-site architecture, domains, data flows, shared resources
├── cleanpunk-shop-reference.md    # Stack, schema, routes, APIs, patterns
├── studiolo-reference.md          # Stack, schema, routes, APIs, patterns
├── postmaster-reference.md        # Stack, schema, routes, APIs, patterns
├── rescuebarn-reference.md        # Stack, schema, routes, APIs, patterns
├── voice-postmaster.md            # Prompt layers, series voices, HUG compliance
├── voice-studiolo.md              # 5-layer stack, dispatch types, closing system
├── roadmap.md                     # Deferred work items — CHECK BEFORE STARTING NEW WORK
└── handoffs/                      # Claude Code handoff specs from planning sessions
```

### Agent Workflow & Roadmap Automation

To keep the roadmap in sync and conserve tokens during code generation:

1. **Agent rules live in this file.** Claude Code should ingest the relevant sections as part of its context when executing a plan.  The slim family-of-sites summary may be used for high-level orientation.
2. **After completing a task**, the agent **must** update the roadmap by:
   * removing the completed bullet from `docs/roadmap.md` (or `docs/roadmap-deferred.md`),
   * appending it with a completion summary and timestamp to `docs/roadmap-archive.md`, e.g.:
     ```markdown
     - 🤖 **2026-03-05:** Added centralized job registry to Orchestrator.
     - (ORCH-101) central cron registry
     ```
   * The `scripts/roadmap-updater.js` helper automates this across all three files.
3. **Roadmap items should use a simple YAML-like prefix** for metadata that the updater script can parse:
   ```markdown
   - [ ] (ORCH-101) central cron registry
   - [ ] (STUD-204) grant-report PDF
   ```
4. A helper script (`scripts/roadmap-updater.js`) will be provided to perform the rearrangement automatically; agents may call it instead of editing by hand.
5. **Verbose commenting convention:** when generating or editing code, Claude Code should insert a comment referencing the site-specific docs, e.g.:
   ```ts
   // see docs/postmaster-reference.md#cron-jobs for schedule patterns
   ```
   or
   ```css
   /* palette defined in steampunk-rescuebarn/tailwind.config.ts */
   ```
   This allows you to locate definitions without grepping across the repo.
6. The `CLAUDE.md` documents (per-app) act as the canonical rule set: any new guideline must be added here first, then propagated into the slim summary if appropriate.

Agents should avoid re-sending entire reference files; instead, they query for a specific section using the comment links above. This keeps token usage minimal while still giving precise navigation cues.

### Tier 2 Execution Flow (Standard — Most Work)

1. Human and CC discuss the work and agree on scope.
2. CC captures discovery/findings in a working spec at `docs/handoffs/_working/<handoff-id>-working-spec.md`.
3. CC generates a fully execution-mapped handoff spec with exact insertion anchors, exact final text blocks, and a strict acceptance checklist.
4. CC implements the work.
5. CC runs the Post-Execution QA Protocol.
6. CC produces structured debrief.

CC drives planning, execution, and QA.

### Tier 3 Execution Flow (Strategic — CChat-Led)

1. Human works with CChat (Opus in Cline) for deep discovery and planning.
2. CChat generates working spec, handoff spec, and CC execution prompt.
3. Fred shuttles handoff to CC.
4. CC implements from the spec/prompt.
5. CC runs the Post-Execution QA Protocol.
6. CC produces structured debrief.

Used only when the human explicitly invokes CChat for strategic/complex work.

### Handoff Modes (Automatic Selection)

- Mapped Mode (default for all work): full file-by-file anchors, exact text blocks, strict checklist.
- Lean Mode (simple low-risk work): objective, exact files, acceptance criteria, verification command.
- If Lean Mode encounters ambiguity, scope expansion, blockers, or protocol-sensitive behavior, escalate to Mapped Mode before continuing.

### Working Spec Path Convention (Single Source of Truth)

- Use this canonical working spec path every time:
  - `docs/handoffs/_working/<handoff-id>-working-spec.md`
- Preferred `<handoff-id>` format: `YYYYMMDD-short-slug` (example: `20260306-postmaster-no-cta`).
- If `<handoff-id>` is missing, generate one automatically (date + short slug) and continue.
- Do not ask the human to choose naming or path structure.
- Keep discovery findings and plan updates in this working spec until final handoff is produced.

Rules:

- Do not mark completion before verification is run and passing.
- Keep implementation scoped to the current handoff spec acceptance criteria.
- Do not rely on human memory for working-spec naming/paths; enforce the canonical convention automatically.
- For GenAI workflow handoffs, Claude Code must execute a workflow-level insertion audit and confirm no links/CTAs are introduced by AI prompts or pipeline logic (prompt layers/templates, generation routes, preview/regenerate routes, closing/tagging helpers, and post-assembly). Include file paths and line anchors in wrap-up.
- When CC executes from handoff specs, execute file-by-file anchors and strict acceptance checklist items as written in the handoff spec; treat summarized or compressed instructions as non-compliant.
- If canonical handoff/working spec files are missing but detailed execution instructions are provided inline, do not halt on missing artifacts: create canonical files first, then execute against them.

Verification stack:

- Layer 1: `node scripts/verify-handoff.mjs --handoff-name <ID>`
- Layer 2: `.github/workflows/handoff-verify.yml` on PR
- Layer 3: periodic human spot-check
- Layer 4 (GenAI workflow handoffs only): no-link/no-CTA insertion audit with evidence. Handoff cannot pass if any insertion point remains active and unaddressed.
- Preflight verification (required when specs were initially missing): confirm canonical working spec and handoff spec were created and used as source of truth before edits.

### Pre-Edit Sanity Check (Required)

Before implementing mapped steps, Claude Code must run a Spec Sanity Pass:

- Validate architecture, protocol alignment, and Steampunk brand/voice intent.
- If no issues: execute as mapped.
- If issues: emit a "Sanity Delta" with:
  - conflict,
  - minimal correction,
  - file/anchor evidence,
  - risk if unchanged,
  - acceptance-criteria adjustment (if needed).

### Bounded Deviation Rule

Claude Code may deviate from mapped instructions only when all are true:

1. Evidence is file-anchored and reproducible.
2. Deviation is minimal and risk-reducing.
3. Scope does not expand materially.

If scope expands materially, stop and request human confirmation before edits.
All applied deviations must be logged as "Sanity Delta Applied" in completion summary.

### Completion Integrity (Mandatory)

- Debrief file counts must match the actual number of files modified, with evidence.
- Multi-repo handoff debriefs must list each repo and its file count separately.
- Scope isolation notes are required when a handoff touches files that overlap with other active branches.
- Verification context notes are required when verification was run on a branch other than main or when the verifier version differs from the canonical version.

### CChat Planning Role (Tier 3 Only — Strategist)

CChat (Claude Opus, running in Cline) is invoked by the human for:

- Deep codebase archaeology and complex problem diagnosis
- Cross-site architecture decisions and impact analysis
- Strategy sessions and brand/voice planning
- Protocol evolution and brain-file updates
- Major Initiative planning (2+ sites, core data flow changes, etc.)

CChat is NOT used for standard work. Most planning happens between the human and CC directly.

When CChat IS used, it generates the working spec, handoff spec, and CC execution prompt (including Strategy Session Template answers, Cross-Site Checklist, and Risk & Reversibility summary).

### CC Responsibilities (Tier 0/1/2 — Most Work)

For most work, CC (Claude Code) handles planning, execution, and QA:

- Discuss scope and approach with the human
- Create working spec and handoff spec with mapped anchors
- Implement the work
- Run the Post-Execution QA Protocol
- Produce structured debrief
- Update changelogs, roadmap, and any affected protocol files

CC must self-enforce protocol compliance for all Tier 2 work without being asked.

### Operator Effort Minimization (Mandatory)

- Default objective: minimize operator manual workload.
- For any "single paste-ready" request, output must be fully executable as-is.
- Do not output placeholders that require user substitution (forbidden examples: `<PASTE ...>`, `<FILL ...>`, `TODO`).
- Inline the exact task body, concrete paths, IDs, and commands directly in the artifact.
- Output exactly one artifact block unless the human explicitly requests multiple blocks.
- Run this pre-send completeness check before responding:
  1. No placeholders remain.
  2. All required protocol sections are present.
  3. All referenced paths/IDs are concrete.
  4. Artifact is zero-edit runnable by the operator.
- If any check fails, regenerate before sending.
- If one value is truly unknowable, ask exactly one targeted question instead of offloading assembly work.

### CC Post-Execution QA Protocol (Mandatory)

After completing any Tier 2+ handoff or task, CC MUST run this checklist before reporting completion:

**1. Type Safety**
```
tsc --noEmit
```
Must PASS with zero errors. No exceptions.

**2. Diff Audit**
```
git diff --stat
```
Verify ONLY intended files were created or modified. No stray changes, no accidental edits to unrelated files. If unexpected files appear in the diff, investigate and revert before pushing.

**3. Security Scan**
- No hardcoded secrets, API keys, or credentials in any committed file
- All `/api/internal/` routes use `Authorization: Bearer ${INTERNAL_SECRET}` with timing-safe comparison
- RLS enabled on all new Supabase tables with appropriate policies
- No `console.log` with sensitive data (use structured logging patterns only)
- No `.env` files committed (verify `.gitignore` coverage)

**4. Code Hygiene**
- No leftover `TODO` or `FIXME` that aren't documented in acceptance criteria
- No debugging `console.log` statements (remove before push)
- All new files have proper TypeScript types (no `any` unless justified with comment)
- Import paths are correct and consistent with existing repo patterns
- New components follow existing naming conventions and directory structure

**5. Acceptance Criteria Verification**
- Verify each criterion from the handoff prompt
- Report PASS/FAIL per criterion
- If any criterion FAILS, fix before pushing or report blocker to Fred

**6. QA Report Format**
Every completion must end with a QA summary:
```
QA: PASS | Files: N created, M modified | tsc: clean
```
Or if issues were found and fixed:
```
QA: PASS (fixed) | Issue: [description] | Fix: [what was done] | Files: N created, M modified | tsc: clean
```
Or if blocked:
```
QA: BLOCKED | Issue: [description] | Recommendation: [escalate to CChat / needs Fred input]
```

**7. Operator Action Block (Mandatory)**

If any handoff requires manual steps by the operator (Supabase migrations, env var configuration, DNS changes, external service setup, Vercel dashboard changes, seed scripts), CC MUST output a clearly delimited action block at the **TOP** of the debrief — before any summary content:

```
┌─────────────────────────────────────────────────────┐
│ 🔴 OPERATOR ACTION REQUIRED                        │
│                                                     │
│ Before this work is live, YOU must:                 │
│                                                     │
│ 1. □ [Exact command or step]                        │
│ 2. □ [Exact command or step]                        │
│ 3. □ [Exact command or step]                        │
│                                                     │
│ Estimated time: X minutes                           │
│ If blocked: [what to do / who to ask]               │
└─────────────────────────────────────────────────────┘
```

Rules:
- This block MUST appear FIRST in the debrief — before "What was built" or any other content
- If NO operator action is needed, output: `🟢 NO OPERATOR ACTION REQUIRED`
- Each action item must include the exact command or exact step (not vague descriptions)
- Group by type: Supabase migrations → env vars → DNS/external → Vercel dashboard
- Include estimated time so the operator can plan
- Include "If blocked" guidance for each non-obvious step

**8. Deploy Gate (Mandatory)**

After all changes pass QA:

- `git push origin main` for each modified repo (or open PR if branch-based workflow)
- Confirm Vercel build starts in logs or dashboard
- If push fails (e.g., diverged branch), resolve and retry — do NOT leave unpushed commits
- Include push confirmation in the QA Report: `Pushed to origin/main — Vercel build triggered`
- NEVER mark a task as complete with unpushed commits
- In Operator Action Blocks and debriefs, use the word "deploy" (not "commit") when communicating with the operator. The operator does not distinguish between commit and push — "deployed" means "live on the internet." If changes are committed but not pushed, they are NOT deployed.

### ENV VAR SAFETY

All secret env vars (`CRON_SECRET`, `INTERNAL_SECRET`, `STRIPE_WEBHOOK_SECRET`, `RESEND_WEBHOOK_SECRET`, etc.) MUST be read with `.trim()` to guard against trailing `\r` or whitespace from copy-paste:

```typescript
const SECRET = process.env.MY_SECRET?.trim()
```

When writing Operator Action Blocks that instruct the operator to set Vercel env vars:

- Provide the exact value in a code block (not "copy from .env file")
- Warn: "⚠️ Trim any trailing whitespace before pasting into Vercel"
- Never instruct the operator to pipe local .env files into Vercel CLI without sanitization

### When CChat Strategic Review Is Required

These scenarios require CChat involvement even for Tier 1/2 work:

| Scenario | Required Action |
|----------|----------------|
| Auth/security changes (login flows, token handling, RLS policies) | CChat reviews design before CC executes |
| Database migrations that ALTER or DROP existing columns/tables | CChat review + manual backup verification |
| Cross-site changes touching 3+ repos simultaneously | CChat coordinates sequence, CC executes per-repo |
| Pre-production launch verification | Full CChat audit of critical user paths |
| Payment/donation flow changes | CChat + Stazia review before execution |
| Protocol changes (CLAUDE.md, execution model, governance) | CChat authors, Fred approves, CC executes |
| Voice system prompt modifications | CChat designs, references voice architecture docs |

### Optional Tools

| Tool | Use Case | When to Reach For It |
|------|----------|---------------------|
| **Codex (OpenAI CLI)** | Independent code review, second-opinion analysis | When Fred wants a non-Anthropic perspective on a specific change |
| **Grok (xAI)** | Social media / X-native analysis | Future consideration for social intelligence |
| **GitHub Copilot** | In-editor autocomplete | Available but not part of protocol workflow |

### Protocol Change Procedure

1. CChat authors the protocol update with version bump (or CC for Tier 1 protocol tweaks)
2. Fred reviews and approves
3. CC executes the update in steampunk-strategy (primary CLAUDE.md)
4. CC cascades the update to all repos that carry CLAUDE.md
5. CC confirms all copies match with `diff` verification

**Satellite docs** — these derive from the brain files. When a protocol change affects their content, update them in the same change set:

- `docs/strategy-session-template.md`
- `docs/cross-site-impact-checklist.md`
- `docs/family-planning-protocol.md`
- `docs/operator-stoppage-cheat-card.md`
- `GOVERNANCE.md` — decision authority, risk appetite, exception process, amendment rules

Satellite docs must not contradict the brain files. If drift is detected, the brain file is authoritative.

### Fix-Propagation Investigation Order (Mandatory)

When asked to reference a fix/change in one place and determine whether it should be applied elsewhere, use this order:

1. Inspect change history first (`git log`/`git show` for the known fix and nearby commits).
2. Review change-tracking artifacts (changelogs, handoff docs, roadmap/debrief/protocol notes).
3. Check shared utilities/helpers for centralized behavior.
4. Run a targeted code sweep to find drift, gaps, or intentional divergence.

Do not start with a broad full-codebase sweep unless history artifacts are missing or inconclusive.

### Environment Constraints (2026-03-06, apply to ALL generated Claude Code prompts)

- All Next.js repos are on 16.x. `next lint` was removed in Next.js 16. Use `eslint` or `npx eslint .` for linting, never `next lint`.
- Every verification block MUST include `npx tsc --noEmit` for each modified repo. Do not claim PASS without zero-error tsc output.
- Cross-repo CI workflows in GitHub Actions require explicit checkout of sibling repos — flag this in Sanity Pass if the workflow needs files from repos other than the hosting repo.
- ESLint configs: strategy (`eslint.config.mjs`), postmaster (`eslint.config.mjs`), rescuebarn (`eslint.config.mjs`), studiolo (`.eslintrc.json`), orchestrator (none), cleanpunk (none — Turbo monorepo).
- Auth stacks: Postmaster + Studiolo use NextAuth (`lib/auth.ts`). Rescue Barn uses Supabase auth (`src/proxy.ts` + `src/app/auth/callback/route.ts`). Cleanpunk uses Medusa built-in auth. Flag stack mismatches in Sanity Pass for auth-related prompts.
- Before marking any implementation complete, Claude MUST run `npx tsc --noEmit` in every modified repo and include the output in the Claim->Evidence table.

### Stoppage Triage Reference

- For operator-facing stoppage handling, see:
  - `docs/operator-stoppage-cheat-card.md`


### Handoff Protocol

When a handoff spec exists in `docs/handoffs/`, it was written by CChat during a planning session. The spec will specify:
- **Target repo(s):** Which codebase(s) to modify (may be this repo or others under /Users/ericktronboll/Projects/)
- **Files affected:** Exact paths to create/modify
- **Database changes:** Prisma migrations or Supabase schema changes if any
- **Cross-site implications:** What other repos need to know or change
- **Acceptance criteria:** How to verify the work is complete
- **Deferred items:** Anything explicitly out of scope for this handoff

**Before starting any handoff:**
1. Read the handoff spec in full
2. Read `docs/roadmap.md` for any deferred items that intersect with the work
3. Read the relevant site reference card(s) for current architecture
4. If the work touches voice/AI composition, read the relevant voice doc

**After completing a handoff:**
1. Update the handoff spec with completion status
2. If new patterns were established, note them for the reference card update
3. If deferred items were encountered, add them to `docs/roadmap.md`

### Sibling Repos (all under /Users/ericktronboll/Projects/)

| Repo Folder | App | Can Be Modified By Handoff |
|-------------|-----|---------------------------|
| steampunk-rescuebarn | Rescue Barn (public site) | Yes |
| steampunk-studiolo | Studiolo (donor CRM) | Yes |
| steampunk-postmaster | Postmaster (content engine) | Yes |
| cleanpunk-shop | Cleanpunk Shop (e-commerce) | Yes |
| steampunk-strategy | TARDIS (this repo) + docs library | Yes |
| steampunk-orchestrator | Orchestrator (planned) | Yes |

All repos are under `github.com/steampunkfarms/`. All Next.js 16.1.6 + React 19.2.4.
