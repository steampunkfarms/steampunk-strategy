# CLAUDE.md — Steampunk Strategy: The Bridge

## Project Overview

**The Bridge** is the 5th Vercel project in the Steampunk Farms family of sites. It serves as the central financial management, compliance tracking, and cross-site operations dashboard for Steampunk Farms Rescue Barn Inc., a 501(c)(3) nonprofit animal sanctuary.

- **URL:** https://tardis.steampunkstudiolo.org
- **Vercel Team:** steampunk-studiolo (team_lZqpvvTB4AXWLrFU8QxFi6if)
- **Auth:** Azure AD via NextAuth (shared app registration with Studiolo + Postmaster)
- **Database:** Neon PostgreSQL (dedicated instance, separate from Studiolo and Postmaster)
- **Theme:** TARDIS control room — deep blues, brass instruments, temporal glows

## Architecture

### Stack
- Next.js 15 (App Router, Turbopack dev) + React 19 + TypeScript 5.7
- Prisma 6.3 + Neon PostgreSQL
- NextAuth 4.24 + Azure AD (Entra ID)
- Tailwind 3.4 + shadcn/ui + Radix primitives
- Claude AI (Anthropic SDK) for document parsing & categorization
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
| sales-tax-calc | Monthly (1st) | Calculate sales tax from Cleanpunk/Square |

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
