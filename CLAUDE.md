# CLAUDE.md — Steampunk Strategy: The Bridge

## Changelog (v2026.03g)

- 2026-03-06g: Added mandatory change-history-first investigation protocol for fix-propagation requests (start with git/changelogs/handoffs before targeted code sweep).

- 2026-03-06f: Added Environment Constraints block to all three brain files + CODEX-PREAMBLE (Next.js 16 lint fix, mandatory tsc --noEmit in verification, auth stack map, ESLint config map, cross-repo CI checkout flag).
- 2026-03-06e: Added completion-integrity rules (accurate file counts in debriefs, scope evidence, verifier multi-repo support). Hardened auth override to require NODE_ENV !== production.
- 2026-03-06d: Added mandatory Operator Effort Minimization rules (no placeholders in paste-ready packages, single-artifact completeness check, fail-and-regenerate if user assembly would be required).
- 2026-03-06c: Added mandatory handoff-to-prompt pairing rule: every delivered handoff must include one matching single paste-ready Codex prompt in the same response unless the human opts out.
- 2026-03-06b: Added Claude pre-edit Spec Sanity Pass and bounded-deviation protocol; clarified default model policy (Codex default, escalate to Opus for high-ambiguity architecture/brand-planning decisions).
- 2026-03-06a: Hardened core protocol — resolved stop-vs-preflight contradiction in CODEX.md, updated verifier for heading-based specs + 2026-03-06 artifact enforcement, added root verify-handoff.mjs wrapper.
- 2026-03-06: Added Strategy Session Template, Cross-Site Checklist, Debrief Script, Family Planning Protocol, and Protocol Health Dashboard seed (per operator request).
- Previous versions tracked in git history only.

Any protocol change must include a new changelog entry and version bump in ALL THREE brain files in the same change set.

## Project Overview

**The Bridge** is the 5th Vercel project in the Steampunk Farms family of sites. It serves as the central financial management, compliance tracking, and cross-site operations dashboard for Steampunk Farms Rescue Barn Inc., a 501(c)(3) nonprofit animal sanctuary.

- **URL:** https://tardis.steampunkstudiolo.org
- **Vercel Team:** steampunk-studiolo (team_lZqpvvTB4AXWLrFU8QxFi6if)
- **Auth:** Azure AD via NextAuth (shared app registration with Studiolo + Postmaster)
- **Database:** Neon PostgreSQL (dedicated instance, separate from Studiolo and Postmaster)
- **Theme:** TARDIS control room — deep blues, brass instruments, temporal glows

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
| Studiolo | Shared Azure AD, donor data sync | Donor-paid bills ↔ donor records |
| Postmaster | Shared Azure AD, animal data | `/api/public/residents` for transparency |
| Rescue Barn | Transparency API consumer | Published financial data → The Fine Print |
| Cleanpunk Shop | COGS tracking, sales data | Medusa inventory/orders → cost analysis |

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
6. **Phase 6:** Transparency API → Rescue Barn integration
7. **Phase 7:** COGS tracking for Cleanpunk, cost creep detection


---

## Cross-Site Reference Library & Handoff System

This repo serves double duty: it's both the TARDIS codebase AND the central reference library for all 5 Steampunk Farms web properties. A consolidated Claude project space handles all planning, specs, and handoffs across the family of sites.

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
2. **After completing a task**, the agent **must** update `docs/roadmap.md` by:
   * moving the completed bullet to the bottom of the file, preserving its original text,
   * appending a one‑sentence summary of what was actually implemented and a timestamp, e.g.:
     ```markdown
     - 🤖 **2026‑03‑05:** Added centralized job registry to Orchestrator. (task completed)
     ```
   * leaving only outstanding/`TODO` items at the top.
3. **Roadmap items should use a simple YAML‑like prefix** for metadata that the updater script can parse:
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
6. The `CLAUDE.md` documents (per‑app) act as the canonical rule set: any new guideline must be added here first, then propagated into the slim summary if appropriate.

Agents should avoid re‑sending entire reference files; instead, they query for a specific section using the comment links above. This keeps token usage minimal while still giving precise navigation cues.

### Codex -> Claude Code Execution Protocol (Mandatory)

For handoff-driven implementation, use this strict order:

1. Human identifies the next item.
2. Human prepares a handoff spec in `docs/handoffs/` and customized prompts.
3. Codex runs first and returns the ready-to-use Claude Code prompt.
4. Claude Code executes the implementation.
5. Human returns Claude Code wrap-up for verification against the handoff spec.
6. Iterate until verification passes, then advance to the next item.

### Default Execution Method (Always On)

For scoped implementation work, the default method is:

1. Discovery and findings capture in a temporary working spec.
2. Collaborative plan refinement with iterative updates to that working spec.
3. On human request for handoff, generation of a fully execution-mapped handoff spec containing exact insertion anchors, exact final text blocks, and a strict acceptance checklist.
4. Codex prompt generation.
5. Claude Code implementation.
6. Post-work QA from returned summary.

### Handoff Modes (Automatic Selection)

- Mapped Mode (default for high-risk work): full file-by-file anchors, exact text blocks, strict checklist.
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

- Do not skip Codex when this workflow is requested.
- Do not mark completion before verification is run and passing.
- Keep implementation scoped to the current handoff spec acceptance criteria.
- Do not rely on human memory for working-spec naming/paths; enforce the canonical convention automatically.
- For GenAI workflow handoffs, Claude Code must execute a workflow-level insertion audit and confirm no links/CTAs are introduced by AI prompts or pipeline logic (prompt layers/templates, generation routes, preview/regenerate routes, closing/tagging helpers, and post-assembly). Include file paths and line anchors in wrap-up.
- When Codex-generated prompts are used, execute file-by-file anchors and strict acceptance checklist items as written in the handoff spec; treat summarized or compressed instructions as non-compliant.
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

### Planning Model Preference

Default protocol mapping remains Codex-first.
For high-ambiguity, cross-site, brand-ethos, or architecture-planning decisions, Opus-class planning may be used before returning to deterministic mapped execution.

### Handoff-to-Prompt Pairing Rule

- When delivering any handoff spec to the human, include one matching single paste-ready Codex prompt in the same response by default.
- Only omit the matching Codex prompt if the human explicitly opts out.

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

### Protocol Change Sync Rule

When protocol/workflow rules are changed, update these files in the same change:

1. `docs/CODEX.md`
2. `CLAUDE.md`
3. `../.github/copilot-instructions.md`

Protocol changes are not complete until all three are updated together.

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
- `.github/copilot-instructions.md` is tracked in steampunk-strategy repo (not a standalone parent repo).
- Before marking any implementation complete, Claude MUST run `npx tsc --noEmit` in every modified repo and include the output in the Claim->Evidence table.

### Stoppage Triage Reference

- For operator-facing stoppage handling (Codex/Claude alerts and routing), see:
   - `docs/operator-stoppage-cheat-card.md`


### Handoff Protocol

When a handoff spec exists in `docs/handoffs/`, it was written by a planning session in the consolidated Claude project space. The spec will specify:
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
