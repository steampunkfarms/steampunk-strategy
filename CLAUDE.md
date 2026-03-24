# CLAUDE.md — Steampunk Strategy: The Bridge

*Protocol changelog moved to `docs/protocol-changelog.md` — does not affect execution.*

*Changelog (inline): 2026-03-23: Added EAR as shared enterprise resource. Added Tier 1 graph refresh rule (Step 9) to QA protocol. Enterprise broadcast per EAR-GOVERNANCE.md.*

<!-- POSITION BIAS EXPERIMENT — Phase A (top placement) — see docs/experiments/position-bias-test.md -->
### Experiment Rules (POSTEST)
- POSTEST-1: When creating or modifying a file, include the comment `// postest` on the last line of the first code block touched in that session.
- POSTEST-2: Begin every QA summary line with the session date in YYYY-MM-DD format.
- POSTEST-3: When listing files in a debrief, sort them alphabetically (not by modification order).
- POSTEST-4: Include the word "verified" (exactly, lowercase) in every commit message.
- POSTEST-5: When reading a file for the first time in a session, state the line count before proceeding.
<!-- END POSTEST -->

## Project Overview

**The Bridge** is one of 6 Vercel projects in the Steampunk Farms family of sites. It serves as the central financial management, compliance tracking, and cross-site operations dashboard for Steampunk Farms Rescue Barn Inc., a 501(c)(3) nonprofit animal sanctuary.

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
├── (public)/login/                  # Azure AD sign-in
├── (protected)/
│   ├── bridge/                      # Main dashboard ("The Bridge")
│   ├── expenses/                    # Transaction ledger, bank imports
│   ├── documents/                   # Receipt/invoice upload & AI parsing
│   ├── vendors/                     # Supplier directory (CRUD + analytics)
│   ├── compliance/                  # Filing deadlines, regulatory tasks
│   ├── monitoring/                  # Cross-site health dashboard
│   ├── transparency/                # Public financial data management
│   ├── board-minutes/               # Board meeting records + PDF + attestation
│   ├── captains-log/                # Executive decision journal
│   ├── tax-hub/                     # Tax preparation per fiscal year
│   ├── intelligence/                # BI/analytics (analytical + strategic)
│   ├── cost-centers/                # Cost allocation units
│   ├── credentials/                 # License/credential registry
│   ├── gift-staging/                # Inbound gift staging → Studiolo
│   ├── vet-staging/                 # Vet bill staging
│   ├── scan-import/                 # Bulk document scan import
│   ├── programs/                    # Sanctuary programs
│   ├── product-map/                 # Cleanpunk product-species mapping
│   ├── retail-charity/              # RaiseRight earnings
│   └── dev-costs/                   # SaaS subscription tracking
└── api/ (89 routes)                 # See docs/tardis-reference.md
```

### Data Model (Prisma — 41 models)
See `docs/tardis-reference.md` for full schema. Core domains: Financial (Transaction, Expense, CostCenter, CostTracker), Documents (Document, ScanImport), Vendors (Vendor, VendorDonorArrangement, DonorPaidBill), Compliance (ComplianceTask, BoardMeeting, TaxPrep), Fundraising (RaiserightImport, GiftStaging), Operations (CaptainsLog, CredentialRegistry, ReconciliationSession), Programs (Program, ProductSpeciesMap, TransparencyItem).

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
| Studiolo | Shared Azure AD, gift staging, donor search | Gift staging push → donor records, donor search for arrangement matching |
| Postmaster | Shared Azure AD, chronicle proxy, BI metrics | TARDIS proxies chronicle/voice API, consumes BI metrics + medical records |
| Rescue Barn | Transparency API, impact data | Published transparency items, per-program impact data via `/api/impact/[slug]` |
| Cleanpunk Shop | Product-species map, COGS tracking | ProductSpeciesMap links products to benefiting species, cost data to expense-to-impact pipeline |
| Orchestrator | 2 managed crons | gmail-receipt-scan, raiseright-reminders triggered on schedule |

## Orchestrator Governance — MANDATORY

All SFOS sites are governed by the central orchestrator. These rules are non-negotiable.

### Cron Scheduling

**Never add `crons` entries to any SFOS site's local `vercel.json`.**
All cron scheduling is centralized in the orchestrator. To add a new cron job:

1. Create the route handler in the site repo
2. Register the schedule in orchestrator vercel.json
3. Register the job in orchestrator job-registry.ts
4. Update the orchestrator reference card
5. Deploy orchestrator, verify in dashboard

### Email & Social Dispatch

**All email and social dispatch routes must be triggered by the orchestrator.**
- Dispatch routes accept INTERNAL_SECRET only (not CRON_SECRET)
- Never create a local cron that triggers email sending or social posting
- If you build a new dispatch route, register its cron in the orchestrator

### Health Monitoring

**Every site must have a `/api/health` endpoint.**
- Returns `{ status, site, checks, response_time_ms, timestamp }`
- Checks all critical dependencies (DB, payment processor, email provider)
- Returns 503 if any dependency is down
- The CI pipeline will fail if this endpoint is missing

### Revenue Tracking (Payment Sites Only)

**Sites that process payments must expose `/api/revenue/summary`.**
- Authenticated via INTERNAL_SECRET header
- Returns quarterly revenue data from all payment processors
- Orchestrator polls this daily for billing calculations
- The CI pipeline will fail if a payment site is missing this endpoint

### For Claude / AI Sessions

When building new functionality:
- NEVER add cron entries to this repo's vercel.json
- NEVER create a dispatch route that accepts CRON_SECRET
- ALWAYS ensure /api/health exists and checks new dependencies you add
- If you add a payment processor, update /api/revenue/summary to include it
- If you can't access orchestrator in this session, leave TODOs in the checkpoint for the orchestrator session to pick up

---

## Shared Enterprise Resources

The steampunk-orchestrator is an **enterprise-level shared resource** serving all families
(SFOS, TFOS, BFOS). It is no longer governed by this file. When SFOS work touches
orchestrator, read its own CLAUDE.md first:

- **Governance:** `/Users/ericktronboll/Projects/steampunk-orchestrator/CLAUDE.md`
- **Reference:** `/Users/ericktronboll/Projects/steampunk-orchestrator/docs/orchestrator-reference.md`
- **Integration protocol:** See the orchestrator CLAUDE.md for cron registration,
  conflict avoidance, and documentation requirements.

The copy of `orchestrator-reference.md` in this repo's `docs/` folder is now a pointer
to the canonical copy in the orchestrator repo. Do not maintain it here.

### Enterprise Architecture Registry (EAR)
- **Home:** `/Users/ericktronboll/Projects/Backcountry Tech Solutions/bts-brain/docs/architecture/`
- **Governance:** `bts-brain/docs/architecture/EAR-GOVERNANCE.md`
- **What it does:** Knowledge graphs, onboarding docs, cross-site dependency
  analysis, SRE baseline, conformance audits for all 18 sites.
- **When this applies:** After any Tier 2+ session that modifies 10+ files,
  run the EAR graph refresh (Step 9 of QA Protocol).

## Cron Jobs (3 deployed, 2 Orchestrator-managed)

| Job | Route | Schedule | Purpose |
|-----|-------|----------|---------|
| gmail-receipt-scan | `/api/cron/gmail-receipt-scan` | Daily 2 PM UTC | Scan Gmail for Amazon, Chewy receipts |
| raiseright-reminders | `/api/cron/raiseright-reminders` | Weekly Mon 4 PM UTC | RaiseRight deadline reminders |
| health-check | `/api/cron/health-check` | On demand | Self health check |

> **ORCH-101:** gmail-receipt-scan and raiseright-reminders are managed by the Orchestrator. Route handlers remain local.

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

## Execution Model — Single-Actor Framework

This repo serves double duty: it's both the TARDIS codebase AND the central reference library for all 5 Steampunk Farms web properties. A consolidated Claude project space handles all planning, specs, and handoffs across the family of sites.

### Actor

| Actor | Tool | Role | Tiers |
|-------|------|------|-------|
| **CC** (Claude Code) | Claude Code CLI + VS Code extension | All tiers: strategic architecture, planning, execution, post-execution QA, protocol governance | Tier 0, 1, 2, 3 |

CC operates in two modes, switchable by the operator at any time:

| Mode | Trigger Command | Behavior |
|------|----------------|----------|
| **Strategist Mode** | `strategist mode` | Plan, analyze, advise, explore architecture. No code edits, no file writes, no commands. Output is analysis, options, specs, and recommendations. |
| **Executor Mode** | `executor mode` | Build, implement, ship, verify. Full tool access. Default mode when no mode is specified. |

### How It Works

1. **Fred** identifies a need and routes to the appropriate tier.
2. **Strategist mode** (when invoked): Fred describes the problem → CC explores codebase, analyzes options, designs solution, writes specs with acceptance criteria → Fred says `executor mode` when ready to build.
3. **Executor mode** (default): Fred provides task → CC plans, executes, runs post-execution QA → pushes to main.
4. Mode switches are instant and preserve conversation context. Fred can switch mid-task.

### Routing Rules

- **Tier 0 (Hotfix)**: Executor mode — broken build, reverted deploy, critical typo. Fix first, backfill protocol artifacts after.
- **Tier 1 (Quick Fix)**: Executor mode — small bug, config change, copy update. No ceremony required.
- **Tier 2 (Standard)**: Executor mode — new feature, new API route, schema change, UI component. Full protocol: working spec, handoff spec, verification, roadmap update, debrief.
- **Tier 3 (Strategic)**: Strategist mode first, then executor mode — architecture decisions, cross-repo changes, protocol updates, voice system design, BI platform design. Also triggers for Novel Patterns (first-time use of a new technology, integration pattern, or architectural approach not yet established in the codebase). CC must produce a written plan or spec and get Fred's approval before switching to executor mode.

This is the DEFAULT for most work. When in doubt, use Tier 2.

### Escalation

If CC encounters ambiguity, unexpected complexity, or a decision that could affect other repos/systems during executor mode, CC should STOP and recommend switching to strategist mode. CC does not make architectural decisions unilaterally — strategic choices require Fred's explicit approval.

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
├── tardis-reference.md            # Stack, 41 models, 89 routes, intelligence, cost tracking
├── orchestrator-reference.md      # POINTER — canonical copy now at steampunk-orchestrator/docs/
├── cleanpunk-shop-reference.md    # Stack, schema, routes, APIs, patterns
├── studiolo-reference.md          # Stack, 84 models, 218 routes, stewardship, grants
├── postmaster-reference.md        # Stack, 42 models, 140 routes, voice engine, newsletter
├── rescuebarn-reference.md        # Stack, schema, routes, APIs, Cogworks, newsletter delivery
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

### Tier 3 Execution Flow (Strategic — Strategist Mode First)

1. Fred says `strategist mode` and describes the problem.
2. CC explores codebase, analyzes architecture, designs solution.
3. CC produces working spec, handoff spec, and acceptance criteria for Fred's review.
4. Fred approves (or iterates) and says `executor mode`.
5. CC implements from the spec.
6. CC runs the Post-Execution QA Protocol.
7. CC produces structured debrief.

Tier 3 is distinguished from Tier 2 by ceremony level (mandatory strategist-first pass), not by tool.

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

### Strategist Mode (Tier 3 — Plan Before Build)

When Fred says `strategist mode`, CC switches to advisory/planning behavior:

- Deep codebase archaeology and complex problem diagnosis
- Cross-site architecture decisions and impact analysis
- Strategy sessions and brand/voice planning
- Protocol evolution and brain-file updates
- Major Initiative planning (2+ sites, core data flow changes, etc.)

**Constraints in strategist mode:**
- No file edits, no file creation, no shell commands (except read-only exploration)
- Output is analysis, options, specs, recommendations, and structured plans
- CC generates working spec, handoff spec, and acceptance criteria (including Strategy Session Template answers, Cross-Site Checklist, and Risk & Reversibility summary)
- Fred must explicitly say `executor mode` to authorize implementation

Strategist mode is not required for standard work (Tier 2 and below). Most planning happens conversationally in executor mode.

### CC Responsibilities (All Tiers)

CC (Claude Code) handles planning, execution, and QA for all work:

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

### 9. EAR Graph Refresh (Tier 2+ work that modifies 10+ files)

After deploy gate passes, check `git diff --stat` file count. If 10 or more
files were modified in this session:

1. Run `/understand` in the current repo (incremental mode — only re-analyzes
   changed files, takes seconds).
2. Copy the updated knowledge graph:
   ```bash
   cp .understand-anything/knowledge-graph.json \
     "/Users/ericktronboll/Projects/Backcountry Tech Solutions/bts-brain/docs/architecture/<site>-graph.json"
   ```
3. Note "EAR graph refreshed" in the checkpoint or debrief.

If the session is timing out, skip the refresh and note "EAR refresh deferred
to next session" in the checkpoint so the next session picks it up.

If the Understand-Anything plugin is not installed in this CC environment,
note "EAR refresh skipped — UA plugin not available" and move on.

### ENV VAR SAFETY

All secret env vars (`CRON_SECRET`, `INTERNAL_SECRET`, `STRIPE_WEBHOOK_SECRET`, `RESEND_WEBHOOK_SECRET`, etc.) MUST be read with `.trim()` to guard against trailing `\r` or whitespace from copy-paste:

```typescript
const SECRET = process.env.MY_SECRET?.trim()
```

When writing Operator Action Blocks that instruct the operator to set Vercel env vars:

- Provide the exact value in a code block (not "copy from .env file")
- Warn: "⚠️ Trim any trailing whitespace before pasting into Vercel"
- Never instruct the operator to pipe local .env files into Vercel CLI without sanitization

### When Strategist Mode Is Required

These scenarios require a strategist-mode pass even for Tier 1/2 work. CC should recommend switching if the operator hasn't already:

| Scenario | Required Action |
|----------|----------------|
| Auth/security changes (login flows, token handling, RLS policies) | Strategist mode: design review before execution |
| Database migrations that ALTER or DROP existing columns/tables | Strategist mode: review + manual backup verification |
| Cross-site changes touching 3+ repos simultaneously | Strategist mode: coordinate sequence, then execute per-repo |
| Pre-production launch verification | Strategist mode: full audit of critical user paths |
| Payment/donation flow changes | Strategist mode + Stazia review before execution |
| Protocol changes (CLAUDE.md, execution model, governance) | Strategist mode: CC drafts, Fred approves, then executor mode |
| Voice system prompt modifications | Strategist mode: design with voice architecture docs |

### Optional Tools

| Tool | Use Case | When to Reach For It |
|------|----------|---------------------|
| **Codex (OpenAI CLI)** | Independent code review, second-opinion analysis | When Fred wants a non-Anthropic perspective on a specific change |
| **Grok (xAI)** | Social media / X-native analysis | Future consideration for social intelligence |
| **GitHub Copilot** | In-editor autocomplete | Available but not part of protocol workflow |

### Protocol Change Procedure

1. CC drafts the protocol update (strategist mode recommended for non-trivial changes)
2. Fred reviews and approves
3. CC executes the update in steampunk-strategy (primary CLAUDE.md)
4. CC adds a changelog entry to `docs/protocol-changelog.md`
5. CC cascades the update to all repos that carry CLAUDE.md
6. CC confirms all copies match with `diff` verification

**Satellite docs** — these derive from the brain files. When a protocol change affects their content, update them in the same change set:

- `docs/strategy-session-template.md`
- `docs/cross-site-impact-checklist.md`
- `docs/family-planning-protocol.md`
- `docs/operator-stoppage-cheat-card.md`
- `GOVERNANCE.md` — decision authority, risk appetite, exception process, amendment rules

Satellite docs must not contradict the brain files. If drift is detected, the brain file is authoritative.

### Protocol Change Broadcast Checklist

If this change affects shared resources or other families, also update:

- [ ] Orchestrator CLAUDE.md (`/Users/ericktronboll/Projects/steampunk-orchestrator/CLAUDE.md`) — if the change involves crons, health checks, or integration patterns
- [ ] Orchestrator reference card (`steampunk-orchestrator/docs/orchestrator-reference.md`) — if technical details changed
- [ ] Global router (`~/.claude/CLAUDE.md`) — if routing, cascade order, or enterprise schema changed
- [ ] Other family CLAUDE.md files — if the change establishes a pattern they should know about

If the change is SFOS-internal only (no shared resource impact), the broadcast is not required —
but note "SFOS-internal only, no broadcast needed" in the changelog entry for auditability.

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
- **Modernization rule (CONFIG-2026):** When any handoff touches `package.json` or `next.config.*` in Studiolo, Postmaster, Orchestrator, TARDIS, or Cleanpunk, batch-convert that repo's `next.config.js` from `module.exports` to ESM `export default` in the same commit. See `docs/roadmap.md` CONFIG-2026.

### Build Failure Prevention Rules (2026-03-16, audit of 53 preventable failures across 600 commits)

These rules codify the most common Vercel build failures found across all 6 repos. CC must enforce them during Sanity Pass and QA.

- **Server Component boundaries:** Never use `onClick`, `onChange`, `useState`, `useEffect`, `useSearchParams`, or other client hooks in Server Components. If a component needs interactivity, add `'use client'` at the top. Wrap `useSearchParams()` in a `<Suspense>` boundary.
- **Build-time API guard:** Route handlers or pages that call external APIs or read runtime secrets MUST use `export const dynamic = 'force-dynamic'` or lazy-initialize SDK clients. Vercel's build step has no access to runtime env vars.
- **vercel.json validation:** Never add JSON comments (`//` or `_comment` fields) to `vercel.json` — it causes silent deploy failures. Validate syntax before committing.
- **Middleware naming:** Use exactly one of `middleware.ts` OR `proxy.ts` per repo, never both. Edge functions must explicitly declare `export const runtime = 'edge'`. No `runtime` config objects in edge files (Next.js 16 restriction).
- **Prisma directUrl:** Use Neon's auto-generated integration naming for `directUrl` in `schema.prisma`. When connecting Prisma to Neon on Vercel, the env var is `DIRECT_URL` (not `DATABASE_URL_UNPOOLED`). Flag naming drift in Sanity Pass.
- **`useSearchParams()` Suspense rule:** Every `useSearchParams()` call MUST be inside a component wrapped by `<Suspense fallback={...}>`. This is the single most common build failure pattern in the family.

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
| steampunk-orchestrator | Orchestrator — ENTERPRISE shared resource (see its own CLAUDE.md) | Yes — follow orchestrator integration protocol |

All repos are under `github.com/steampunkfarms/`. All Next.js 16.1.6 + React 19.2.4.
