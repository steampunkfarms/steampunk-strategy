# SemperVets — Site Reference Card

> Quick reference for Site #7 in the Steampunk Farms family.
> For full details see `docs/sempervets/MASTER-PLAN.md`
> Created: 2026-03-14

---

## Identity

| Field | Value |
|-------|-------|
| **App Name** | SemperVets Command Center |
| **Site #** | 7 |
| **Domain** | sempervets.com |
| **Staging** | semper.tronboll.us |
| **Vercel Project** | (to be created) |
| **Vercel Team** | steampunk-studiolo |
| **Repo** | steampunkfarms/sempervets (to be created) |
| **Database** | Neon PostgreSQL — `sempervets-db` (to be created) |
| **Status** | Planning / Pre-Development |

## Client

| Field | Value |
|-------|-------|
| **Primary** | Starlene Bennin — Broker Associate — DRE #01730188 |
| **Secondary** | Ashlyn Windsor — Licensed Salesperson — DRE #02224221 |
| **Brokerage** | CHAMELEON DBA Red Hawk Realty — Broker Donn Bree — DRE #01078868 |
| **S-Corp** | Grapevine Canyon Ranch Inc. (GCR) |
| **PM Division** | RHRPM (owned by Red Hawk, 100% commission pass-through) |

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Language | TypeScript 5.7 + React 19 |
| Styling | Tailwind v4 + shadcn/ui + Radix |
| ORM | Drizzle ORM |
| Database | Neon PostgreSQL |
| Auth | NextAuth v5 (magic-link + Google SSO) |
| AI | Anthropic Claude Sonnet 4.6 + Haiku 4.5 |
| Email | Resend (MX + transactional + campaigns) |
| SMS/Voice | Twilio |
| Storage | Vercel Blob |
| Video | Daily.co |
| Payments | Stripe + Square |
| E-Signatures | DocuSign / HelloSign |
| MLS | RESO Web API (CRMLS) |
| Charts | Recharts |
| Icons | Lucide React |
| Toasts | Sonner |

## Key Architectural Notes

1. **PM/Sales decoupling:** Feature-flagged. One toggle removes all PM functionality.
2. **Google Workspace elimination:** Native email, calendar, docs, forms, drive, contacts — Google SSO only for auth.
3. **Mock-first integrations:** Every external API has mock + real provider. Feature flag switches between them.
4. **Commission immutability:** 50/50 ledger is append-only, no edits, no deletes.
5. **DRE compliance:** Footer on every page, admin-editable.
6. **Multi-tenant ready:** Schema supports adding `tenantId` for future SaaS expansion.

## Planning Docs Location

```
/Users/ericktronboll/Projects/steampunk-farms/steampunk-strategy/docs/sempervets/
├── MASTER-PLAN.md
├── SCHEMA-DESIGN.md
├── CLAUDE-MD-DRAFT.md
├── CHECKPOINT-0-FOUNDATION.md
├── CHECKPOINT-1-COMMAND-CENTER.md
├── CHECKPOINT-2-CLIENT-PORTALS.md
├── CHECKPOINT-3-COMMUNICATIONS.md
├── CHECKPOINT-4-INTELLIGENCE.md
├── CHECKPOINT-5-INTEGRATIONS.md
├── CHECKPOINT-6-MARKETING.md
├── DEFERRED-WAITING-ON-API.md
└── REVENUE-MODEL.md
```

## Feature Scope Summary

- **~170 features** cataloged across 21 modules (A through U)
- **13 external integrations** tracked (7 self-serve, 6 need external approval)
- **6 build phases** with checkpoint specs
- **Replaces 25+ tools** for Starlene
- **Revenue:** $350/month (saves Starlene $100-410+ vs current tool spend)
