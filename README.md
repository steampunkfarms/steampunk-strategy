# The Bridge

Central financial management, compliance tracking, and cross-site operations dashboard for **Steampunk Farms Rescue Barn Inc.**, a 501(c)(3) nonprofit animal sanctuary.

**URL:** https://tardis.steampunkstudiolo.org

## Stack

Next.js 15 (App Router) + React 19 + TypeScript 5.7 + Prisma 6.3 + Neon PostgreSQL + NextAuth 4.24 (Azure AD) + Tailwind 3.4 + shadcn/ui + Claude AI (Anthropic SDK) + Recharts

## Features

- **Expense ledger** — Transaction tracking with AI-parsed receipts
- **Gmail receipt scanner** — Automated Amazon/Chewy/vendor invoice ingestion
- **Seasonal cost tracking** — Hay pricing baselines with cost-creep detection
- **Vendor directory** — Supplier management with donor-paid bill tracking
- **Annual reconciliation** — Personal/farm commingled purchase settlement
- **Compliance dashboard** — Filing deadlines, IRS/state reminders
- **Cross-site monitoring** — Health checks across the Steampunk family
- **Transparency API** — Public financial data for the Rescue Barn site

## Development

```bash
npm install
cp .env.example .env.local   # Fill in credentials
npx prisma db push
npm run dev                   # http://localhost:3000
```

## The Family

| Project | Domain | Role |
|---------|--------|------|
| **Rescue Barn** | rescuebarn.steampunkfarms.org | Public sanctuary website |
| **Studiolo** | steampunkstudiolo.org | Donor CRM & operations |
| **Postmaster** | postmaster.steampunkstudiolo.org | AI content & social syndication |
| **Cleanpunk Shop** | home.cleanpunk.shop | E-commerce storefront (soaps) |
| **The Bridge** | tardis.steampunkstudiolo.org | Financial management (this repo) |

See `FAMILY_OF_SITES.md` for the full cross-site inventory.
