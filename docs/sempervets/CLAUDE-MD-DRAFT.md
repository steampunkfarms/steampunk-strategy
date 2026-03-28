# CLAUDE.md — SemperVets Command Center

> **Site #7** in the Steampunk Farms family of sites
> Last updated: 2026-03-14

## Project Overview

**SemperVets Command Center** is an enterprise real estate platform for Starlene Bennin (Broker Associate, DRE #01730188) and Ashlyn Windsor (Licensed Salesperson, DRE #02224221) operating under Red Hawk Realty (Broker Donn Bree, DRE #01078868). It replaces 25+ tools with one AI-supercharged system — CRM, client portals, document management, email, calendar, forms, financial tracking, VoIP, marketing automation, and MLS integration.

- **Domain:** sempervets.com (staging: semper.tronboll.us)
- **Vercel Team:** steampunk-studiolo
- **Database:** Neon PostgreSQL (dedicated instance, `sempervets-db`)
- **Auth:** NextAuth v5 — magic-link primary + Google SSO secondary
- **AI:** Anthropic Claude Sonnet 4.6 (deep analysis) + Haiku 4.5 (fast triage)
- **Email:** Resend MX routing + Enterprise Email Handler
- **Theme:** Military-inspired, veteran-focused, direct/no-nonsense tone

## Architecture

### Stack
- Next.js 16 (App Router + Turbopack) + React 19 + TypeScript 5.7
- Drizzle ORM + Neon PostgreSQL
- NextAuth v5 (magic-link + Google OAuth)
- Tailwind v4 + shadcn/ui + Radix primitives
- Claude AI (Anthropic SDK) for all AI features
- Resend (email MX + transactional + campaigns)
- Twilio (SMS + Voice/VoIP when enabled)
- Vercel Blob (document storage)
- Daily.co (video rooms for virtual showings)
- Recharts (financial visualizations)
- Lucide icons + Sonner toasts

### Route Structure
```
app/
├── (public)/          # Unauthenticated: landing, login, listings, VA guide, blog
├── (portal)/          # Authenticated clients: buyer, seller, pm, investor
│   ├── buyer/         # "Mission Match" — AI property matching
│   ├── seller/        # "Offer Command Center" — offer analysis + negotiation
│   ├── pm/            # "Asset Guardian" — property management dashboard
│   ├── investor/      # "Capital Command" — investment analysis + simulator
│   └── shared/        # Calendar, messages, notifications, settings
├── (admin)/           # Starlene, Ashlyn, Erick
│   ├── command/       # Unified dashboard
│   ├── crm/           # Contacts, pipeline, guest cards, activities
│   ├── commissions/   # Tracker, 50/50 ledger, calculator
│   ├── finance/       # Budget, expenses, bills, forecast
│   ├── documents/     # Vault, templates
│   ├── calendar/      # Master calendar
│   ├── email/         # Inbox, compose, campaigns, drip
│   ├── marketing/     # Content, social, calendar, assets
│   ├── forms/         # Builder, submissions
│   ├── listings/      # Listing management
│   ├── pm-admin/      # PM overview (feature-flagged)
│   ├── compliance/    # DRE calendar, brokerage bridges
│   ├── ai/            # Roleplay, scripts, market reports
│   ├── voip/          # Call dashboard, transcripts
│   └── settings/      # System, integrations, profile
└── api/               # All API routes (auth, email, ai, crm, calendar, forms, etc.)
```

## Critical Business Rules

### Corporate Structure (MUST understand)
- **Red Hawk Realty** (DRE #01078868, Broker Donn Bree) provides general supervision for ALL licensed activity
- **RHRPM** (Property Management) is 100% owned by Red Hawk, NOT by Starlene. Brand as "CHAMELEON DBA Red Hawk Realty Property Management" always.
- **Sales:** Starlene + Ashlyn are under Red Hawk. Their S-Corp "Grapevine Canyon Ranch Inc." (GCR) receives commissions.
- **Commission math:** Sales = 25-50% GCI to Red Hawk, remainder to GCR. PM = 100% pass-through to Starlene/Ashlyn.
- **PM/Sales decoupling:** These divisions MUST be architecturally separable. Feature flags control PM visibility. If Red Hawk closes PM, one config change removes it.

### DRE Compliance (NEVER omit)
Every page showing licensed activity MUST display:
```
Starlene Bennin | Broker Associate | DRE #01730188
Ashlyn Windsor | Licensed Salesperson | DRE #02224221
Red Hawk Realty | Broker Donn Bree | DRE #01078868
```
Admin-editable via `settings` table key `branding.dre_footer_text`.

### 50/50 Ledger Immutability
The `commission_splits` table is APPEND-ONLY. No updates, no deletes. Corrections are new rows with `adjustmentType = 'correction'`. This replaces a handwritten ledger and must be legally defensible.

### Integration Mock Pattern
Every external integration uses a provider pattern:
```
lib/integrations/[name]/provider.ts       ← real API
lib/integrations/[name]/mock-provider.ts  ← mock data
lib/integrations/[name]/index.ts          ← selects based on feature flag
```
Feature flags live in the `settings` table. Flipping a flag activates real API with zero code changes.

## AI Voice Guidelines

All AI-generated content uses "Starlene's veteran voice":
- Warm but direct — no fluff, no fake luxury vibes
- Military metaphors where natural (mission briefing, command center, etc.)
- Empathetic to veteran experience (PCS stress, VA loan complexity, service dog needs)
- Professional and competent — veterans respect work ethic
- Family-oriented (mother-daughter team, long-term relationships)
- Example: "As a fellow Marine spouse, here's what I'd recommend..."

System prompts for the AI Advisor chatbot are stored in `settings` key `ai.starlene_voice_prompt`.

## User Roles

| Role | Portal | Capabilities |
|------|--------|-------------|
| buyer | /buyer/* | View matches, schedule showings, track offers, access docs |
| seller | /seller/* | View listing health, receive/compare offers, negotiation tools |
| pm_client | /pm/* | View property status, approve repairs, see financials, renewals |
| investor | /investor/* | Investment doctrine, opportunity radar, simulator, calculators |
| vendor | (limited) | Receive maintenance dispatch, submit invoices |
| lender | (limited) | View referred buyer pipeline, provide rate updates |
| agent | /admin/* (lite) | Ashlyn: CRM, calendar, own contacts (admin-lite permissions) |
| admin | /admin/* | Starlene: full access to everything |
| superadmin | /admin/* + settings | Erick: system config, integrations, feature flags |

## Development Conventions

### File Structure
```
app/                    # Next.js App Router pages
components/
├── ui/                 # shadcn/ui primitives
├── shared/             # Cross-cutting components (DRE footer, AI advisor, notifications)
├── crm/                # CRM-specific components
├── portal/             # Client portal components
├── admin/              # Admin dashboard components
└── marketing/          # Marketing suite components
lib/
├── db/
│   ├── schema/         # Drizzle schema files (modular — core, sales, pm, financial, etc.)
│   ├── migrations/     # Drizzle migrations
│   └── queries/        # Reusable query functions
├── ai/                 # Claude API wrappers (advisor, analyzer, scorer, generator)
├── integrations/       # External API providers (mock + real per integration)
├── email/              # Resend helpers (send, templates, campaign engine)
├── auth/               # NextAuth config + helpers
├── utils/              # General utilities
└── constants/          # Enums, defaults, config
types/                  # TypeScript type definitions
public/                 # Static assets, PWA manifest, icons
```

### Naming Conventions
- Files: `kebab-case.ts` for modules, `PascalCase.tsx` for React components
- DB tables: `snake_case` (Drizzle generates from camelCase schema definitions)
- API routes: `/api/[module]/[action]` (e.g., `/api/crm/contacts`, `/api/ai/analyze-offer`)
- Components: `PascalCase` (e.g., `ContactTimeline`, `CommissionCalculator`)
- Feature flags: `integrations.[name].enabled` or `feature_flags.[name]`

### Commit Convention
```
[module] action: brief description

Examples:
[crm] feat: add guest card to contact conversion flow
[pm] fix: correct Red Hawk branding on Asset Guardian
[ai] feat: implement offer PDF extraction pipeline
[email] fix: resend webhook retry on timeout
```

### Testing
- Unit tests for commission calculations (financial accuracy is critical)
- Unit tests for Investment Fit Score™ algorithm
- Integration tests for auth flows (magic-link + Google SSO)
- E2E tests for critical paths: onboarding → match → offer → close
- Mock provider tests verify feature flag switching

### Environment Variables
```env
# Core
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Email
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=

# AI
ANTHROPIC_API_KEY=

# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Communications (activate when ready)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Payments (activate when ready)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SQUARE_ACCESS_TOKEN=

# Integrations (activate when ready)
DOCUSIGN_INTEGRATION_KEY=
DOCUSIGN_SECRET_KEY=
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
APPFOLIO_API_KEY=
CRMLS_API_KEY=
```

## Checkpoint Tracking

| Phase | Name | Status | Spec |
|-------|------|--------|------|
| 0 | Foundation | Not started | `docs/sempervets/CHECKPOINT-0-FOUNDATION.md` |
| 1 | Command Center | Not started | `docs/sempervets/CHECKPOINT-1-COMMAND-CENTER.md` |
| 2 | Client Portals | Not started | `docs/sempervets/CHECKPOINT-2-CLIENT-PORTALS.md` |
| 3 | Communications | Not started | `docs/sempervets/CHECKPOINT-3-COMMUNICATIONS.md` |
| 4 | Intelligence | Not started | `docs/sempervets/CHECKPOINT-4-INTELLIGENCE.md` |
| 5 | Integrations | Not started | `docs/sempervets/CHECKPOINT-5-INTEGRATIONS.md` |
| 6 | Marketing | Not started | `docs/sempervets/CHECKPOINT-6-MARKETING.md` |

## Key References

- Master Plan: `/Users/ericktronboll/Projects/steampunk-strategy/docs/sempervets/MASTER-PLAN.md`
- Schema Design: `/Users/ericktronboll/Projects/steampunk-strategy/docs/sempervets/SCHEMA-DESIGN.md`
- Client Requirements (raw): `/Users/ericktronboll/Projects/SemperVets Enterprise Site - RD MP.md`
- Client Requirements (reference): `/Users/ericktronboll/Projects/SemperVets Enterprise Site - RD Ref.md`
- Starlene's reference docs: `/Users/ericktronboll/Projects/semper-vets-ref-docs-from-starlene/`
- LeBlanc branding assets: `/Users/ericktronboll/Projects/LeBlanc/`
- Family of Sites: `/Users/ericktronboll/Projects/steampunk-strategy/docs/FAMILY_OF_SITES_UPDATED.md`

## Trusted Lender Directory (Starlene's Referrals)

- **Dan Chapman** — All loan types + VA specialist
- **John Medin** — All loan types + VA specialist
- **Alisha Sirois** — All loan types, especially great for 1st time home buyers
