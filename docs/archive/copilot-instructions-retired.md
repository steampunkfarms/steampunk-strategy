# Steampunk Farms Monorepo - AI Agent Instructions

MANDATORY EXECUTION GATE (HIGHEST PRIORITY)

Default mode is read-only analysis.
Never modify files, run write/destructive commands, commit, push, or deploy unless the user explicitly includes one of these approval phrases in the current message: implement, apply patch, ship it, commit, push, deploy.
If approval phrase is missing, do not execute changes. Return analysis + proposed plan only.
If intent is ambiguous, ask one clarifying question before any write action.
Before any write action, state: “Execution check passed: explicit approval phrase detected: <phrase>”.
This gate overrides autonomy defaults and any implied “go ahead” behavior.

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

## Architecture Overview

This is a monorepo containing multiple Next.js applications for Steampunk Farms, a 501(c)(3) nonprofit animal sanctuary rescuing and caring for farmed animals. Key components:

- **steampunk-studiolo**: Internal donor CRM with grant management, AI-powered stewardship communications, and multi-channel revenue tracking
- **steampunk-postmaster**: AI content automation engine creating "content storms" (1 input → 13+ posts across platforms) with HUG guardrails
- **steampunk-strategy (TARDIS)**: Financial management, compliance dashboard, and cross-site operations hub
- **steampunk-rescuebarn**: Public sanctuary website with academy, donations, campaigns, and animal profiles
- **steampunk-orchestrator**: Central cron scheduler managing 23 jobs across all sites
- **cleanpunk-shop**: E-commerce platform (Medusa backend + Next.js storefront) selling handmade soaps to fund operations

All apps share Azure AD authentication via NextAuth, with Neon PostgreSQL databases (some shared, some dedicated). Postmaster serves as the hub-and-spoke data source for animal records consumed by Rescue Barn and Cleanpunk Shop.

## Common Patterns & Conventions

### Authentication & Security
- Routes protected via `middleware.ts` with Azure AD (NextAuth) or Supabase Auth
- Shared Azure AD app registration across Studiolo + Postmaster; Supabase auth for Rescue Barn + Cleanpunk
- Internal API calls use `INTERNAL_SECRET` header for cross-site auth
- Feature flags control functionality (e.g., `ORCHESTRATOR_ENABLED`)
- Row Level Security (RLS) enabled on all Supabase tables with role-based access

### Database & Data Flow
- Prisma ORM with singleton client from `lib/db.ts` (import as `prisma`)
- Cross-app data sync via public APIs (e.g., Postmaster's `/api/public/residents` for animal data)
- Donor IDs: UUID internally, display as `SF-XXXXXX` via `donorId` field
- ISR cache for animal data (1hr refresh)
- Use `revalidatePath()` after mutations for ISR

### UI & Styling
- Tailwind CSS with app-specific color palettes:
  - Studiolo: `walnut-*`, `brass-*`, `parchment-*`, `tuscan-yellow`
  - Strategy: `tardis-*`, `console-*`, `brass-*`, `gauge-*`
  - Rescue Barn: `barn-*`, `pasture-*`, `forge-*`, `punk-*`, `iron-*`
- shadcn/ui components with Radix primitives
- Status indicators: green/amber/red/blue gauge dots
- Cards: `bg-parchment-light dark:bg-walnut rounded-xl border border-brass shadow-sm p-6`
- Currency: `formatCurrency()` from `lib/format.ts`

### Component Architecture
- Server components for pages; client components (`'use client'`) for interactivity
- Server actions in `lib/actions.ts` (`'use server'`, accept `FormData`)
- API routes: `app/api/` with NextRequest/NextResponse pattern
- Access gates: `<AccessGate>` component for role/tier enforcement

### Cron Jobs & Orchestration
- Vercel cron routes export GET (not POST) for scheduling
- Orchestrator forwards jobs to owning apps with `INTERNAL_SECRET`
- Jobs logged to `cron_logs` table
- Cron auth via `CRON_SECRET` or `INTERNAL_SECRET`

### AI Integration
- Claude API for content generation, document parsing, and donor communications
- HUG guardrails: Humanity, Understanding, Grace (prohibits urgency, guilt, mass-mailer phrases)
- Layered prompt architecture: Universal guardrails → Platform context → Template instructions → Donor context → User intent
- Voice engines: Studiolo (5-layer stack for donor comms), Postmaster (content storms)
- Bracket notation `[meta-instructions]` parsed as AI context, never surfaced in output

## Development Workflows

### Setup
```bash
pnpm install  # Root or per-app
cp .env.example .env.local  # Fill credentials
npx prisma db push  # Apply schema (Neon)
npx supabase db push  # Apply schema (Supabase)
npm run dev  # Local dev
```

### Build & Deploy
- `npm run build` for production verification
- `npx tsc --noEmit` for type checking
- Deploy to Vercel with team-specific configs
- Orchestrator manages 23 cron jobs across sites
- Manual deploy hooks for Postmaster (no auto-deploy on git push)

### Cross-App Coordination
- Postmaster: Source of truth for animals, content hub
- Studiolo: Donor data hub, revenue reconciliation
- Strategy: Financial transparency, compliance monitoring
- Rescue Barn: Public consumption of animal/content data
- Cleanpunk: E-commerce with animal ambassador products
- Orchestrator: Centralized scheduling and job forwarding

## Key Files to Reference

- `steampunk-strategy/docs/family-of-sites-full.md`: Complete system architecture and data flows
- `steampunk-strategy/docs/studiolo-reference.md`: Donor CRM technical details
- `steampunk-strategy/docs/postmaster-reference.md`: Content automation engine specs
- `steampunk-strategy/docs/rescuebarn-reference.md`: Public site architecture
- `steampunk-strategy/docs/cleanpunk-shop-reference.md`: E-commerce platform details
- `steampunk-strategy/docs/voice-studiolo.md`: AI communication guardrails
- `steampunk-strategy/docs/voice-postmaster.md`: Content generation constraints
- `steampunk-studiolo/CLAUDE.md`: Donor management patterns
- `steampunk-strategy/CLAUDE.md`: Financial dashboard conventions
- `steampunk-orchestrator/README.md`: Cron orchestration architecture
- `cleanpunk-shop/package.json`: Monorepo scripts (Turbo)
- `lib/auth.ts`, `lib/db.ts`, `middleware.ts`: Shared utilities

## Project-Specific Notes

- **Hub-and-spoke data pattern**: Postmaster as animal/content source, consumed by Rescue Barn + Cleanpunk via public API
- **Revenue streams**: Donations (Stripe/Zeffy/PayPal/Patreon), e-commerce (Medusa/Stripe), grants (tracked in Studiolo)
- **AI voice consistency**: Universal HUG guardrails shared across Studiolo + Postmaster
- **Donor stewardship**: Two-lane pipeline (Atelier/nurture vs Opus/major), automated receipt + thank-you emails
- **Content storms**: One human input → AI fragments → platform-specific renditions → scheduled posting
- **Transparency**: Public financial data publishing from Strategy to Rescue Barn
- **Feature flags**: Control rollouts via environment variables
- **Barn cat program**: Upcoming intake/sponsorship/adoption pipeline (revenue opportunity)
- **Security**: Recent audit completed, RLS policies, webhook verification, cron auth hardening

### Agent Coordination & Comments

- Roadmap automation is supported: completed roadmap items should be moved to the bottom with a timestamped summary. See `steampunk-strategy/scripts/roadmap-updater.js` for the helper. Agents (Claude Code) can invoke this script after finishing a plan.
- Use the following comment convention when generating or modifying code to create a link back to documentation:
  ```ts
  // see docs/postmaster-reference.md#cron-jobs for schedule patterns
  ```
  Comments may also reference specific lines or sections, e.g. `/* palette defined in steampunk-rescuebarn/tailwind.config.ts */`.
- All agent rules (prompt layers, guardrails, file reference etiquette) live in the per-repo `CLAUDE.md` files. When you update guidelines there, also update the slim `family-of-sites-updated.md` as appropriate.

Agents should aim to read only the minimal section of a reference file rather than the entire document, using the comments above as anchors. This conserves tokens while keeping generated code traceable.

## Agent Workflow Contract (Codex -> Claude Code)

This workflow is mandatory for implementation handoffs across the Steampunk Farms repos.

1. Human requests the next item (from roadmap or exploratory work).
2. Human writes handoff spec in `steampunk-strategy/docs/handoffs/` and prepares customized prompts.
3. Codex is used first to generate the ready-to-use Claude Code execution prompt.
4. Claude Code executes implementation from that prompt.
5. Human returns Claude Code wrap-up for verification against handoff acceptance criteria.
6. Iterate until verification passes, then move to next item.

### Default execution method (automatic)

For scoped implementation work, the default method is always:

1. Discovery and findings capture in a temporary working spec.
2. Collaborative plan refinement with iterative updates to that working spec.
3. On human request for handoff, generation of a fully execution-mapped handoff spec containing exact insertion anchors, exact final text blocks, and a strict acceptance checklist.
4. Codex prompt generation.
5. Claude Code implementation.
6. Post-work QA from returned summary.

### Execution mode policy

- Mapped Mode is required for high-risk/GenAI/protocol-sensitive work.
- Lean Mode is allowed only for simple low-risk scoped tasks.
- Lean Mode must escalate to Mapped Mode if scope, ambiguity, blockers, or protocol risk increases.

### Working spec path convention (single source of truth)

- Canonical path:
  - `steampunk-strategy/docs/handoffs/_working/<handoff-id>-working-spec.md`
- Preferred `<handoff-id>` format: `YYYYMMDD-short-slug` (example: `20260306-postmaster-no-cta`).
- If `<handoff-id>` is not provided, generate one automatically (date + short slug) and continue.
- Do not ask the human to invent file names or path conventions for working specs.
- Keep discovery findings and plan updates in this working spec until final handoff generation.
- Preflight unblock policy: if canonical handoff files are missing but complete execution details are present inline, create canonical working/handoff spec files first, then proceed.

### Non-negotiable ordering

- Do not skip directly to implementation when the Codex->Claude Code handoff flow is requested.
- Do not treat a handoff as complete without running verification checks and reconciling failures.
- Keep changes scoped to the active handoff spec.
- Do not rely on human memory for working-spec naming/paths; enforce the canonical convention automatically.

### Verification layers (required)

- Layer 1 (Agent self-verification): run `node steampunk-strategy/scripts/verify-handoff.mjs --handoff-name <ID>` at completion.
- Layer 2 (CI safeguard): rely on GitHub Actions handoff verification in `.github/workflows/handoff-verify.yml`.
- Layer 3 (human spot-check): periodic manual audit against the handoff spec.

### Prompt generation guidance

- Codex output should produce a Claude Code prompt that includes: objective, exact files, ordered steps, acceptance criteria, verification command, and roadmap update command.
- Codex must pass execution-mapped handoff details verbatim (file-by-file insertion anchors and strict acceptance checklist items). Do not summarize or compress these details when preparing the Claude Code prompt.
- Codex must declare selected execution mode (Mapped or Lean) and include explicit Lean→Mapped escalation criteria in the Claude Code prompt.
- Claude Code should not mark work done until verification passes.
- When Codex prepares a Claude Code prompt for GenAI content workflows, it must include a mandatory no-link/no-CTA insertion audit covering prompt layers, generation routes, preview/regenerate routes, and post-generation assembly helpers (closings, URL tagging, and equivalent utilities), with file/line evidence required in Claude Code wrap-up.

### Claude Spec Sanity Pass (Mandatory)

For Codex->Claude handoffs, Claude must run a pre-edit sanity check before file changes:

- Check for architecture/protocol/brand-ethos conflicts.
- If clean: proceed with mapped steps.
- If conflicts exist: produce a "Sanity Delta" (conflict, evidence, minimal correction, risk, acceptance update).

### Bounded Deviation Policy

Claude may apply deviations only if:

- evidence is file-specific and reproducible,
- deviation is minimal and risk-reducing,
- no material scope expansion occurs.

If material scope expansion is required, Claude must pause and request human confirmation before edits.
All deviations must be explicitly reported as "Sanity Delta Applied" in wrap-up.

Default deterministic handoff planning remains Codex-first; use Opus-class planning for high-ambiguity architecture/brand-strategy decisions, then return to mapped execution.

### Codex preamble automation

- When preparing a prompt for the user to paste into Codex, always prepend the canonical preamble from `steampunk-strategy/docs/CODEX-PREAMBLE.md`.
- Treat this as default behavior for all Codex handoff requests unless the user explicitly opts out.

### Handoff-to-prompt pairing rule

- When delivering any handoff spec to the user, include one matching single paste-ready Codex prompt in the same response by default.
- Only omit the matching Codex prompt if the user explicitly opts out.

### Operator effort minimization (mandatory)

- Default objective: minimize operator manual workload.
- For any "single paste-ready" request, output must be fully executable as-is.
- Do not output placeholders that require user substitution (forbidden examples: `<PASTE ...>`, `<FILL ...>`, `TODO`).
- Inline the exact task body, concrete paths, IDs, and commands directly in the artifact.
- Output exactly one artifact block unless the operator explicitly requests multiple blocks.
- Run this pre-send completeness check before responding:
  1) No placeholders remain.
  2) All required protocol sections are present.
  3) All referenced paths/IDs are concrete.
  4) Artifact is zero-edit runnable by the operator.
- If any check fails, regenerate before sending.
- If one value is truly unknowable, ask exactly one targeted question instead of offloading assembly work.

### Completion integrity (mandatory)

- Debrief file counts must match the actual number of files modified, with evidence.
- Multi-repo handoff debriefs must list each repo and its file count separately.
- Scope isolation notes are required when a handoff touches files that overlap with other active branches.
- Verification context notes are required when verification was run on a branch other than main or when the verifier version differs from the canonical version.

### Protocol synchronization rule

- If protocol/workflow rules are updated, update all three brain files in the same workstream:
  1) `steampunk-strategy/docs/CODEX.md`
  2) `steampunk-strategy/CLAUDE.md`
  3) `.github/copilot-instructions.md`

### Fix-propagation investigation order (mandatory)

- When asked to reference a fix/change in one place and assess adoption elsewhere, start with change-history artifacts before sweeping code.
- Required order:
  1) `git log`/`git show` for the originating fix and adjacent commits
  2) changelogs, handoff docs, roadmap/debrief/protocol notes
  3) shared utilities/helpers that may already centralize behavior
  4) targeted code sweep for drift, missing adoption, or intentional divergence
- Do not begin with a broad full-codebase sweep unless history artifacts are absent or inconclusive.

### Environment Constraints (2026-03-06, apply to ALL generated Claude Code prompts)

- All Next.js repos are on 16.x. `next lint` was removed in Next.js 16. Use `eslint` or `npx eslint .` for linting, never `next lint`.
- Every verification block MUST include `npx tsc --noEmit` for each modified repo. Do not claim PASS without zero-error tsc output.
- Cross-repo CI workflows in GitHub Actions require explicit checkout of sibling repos — flag this in Sanity Pass if the workflow needs files from repos other than the hosting repo.
- ESLint configs: strategy (`eslint.config.mjs`), postmaster (`eslint.config.mjs`), rescuebarn (`eslint.config.mjs`), studiolo (`.eslintrc.json`), orchestrator (none), cleanpunk (none — Turbo monorepo).
- Auth stacks: Postmaster + Studiolo use NextAuth (`lib/auth.ts`). Rescue Barn uses Supabase auth (`src/proxy.ts` + `src/app/auth/callback/route.ts`). Cleanpunk uses Medusa built-in auth. Flag stack mismatches in Sanity Pass for auth-related prompts.
- `.github/copilot-instructions.md` is tracked in steampunk-strategy repo (not a standalone parent repo).
- Before marking any implementation complete, Claude MUST run `npx tsc --noEmit` in every modified repo and include the output in the Claim->Evidence table.

### Stoppage triage reference

- For operator-facing handling of Codex/Claude stoppage alerts, use:
  - `steampunk-strategy/docs/operator-stoppage-cheat-card.md`
</content>
<parameter name="filePath">/Users/ericktronboll/Projects/.github/copilot-instructions.md
