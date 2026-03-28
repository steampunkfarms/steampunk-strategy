# Checkpoint 0 — Foundation

> **Goal:** Bootable site with auth, email, and family registration
> **Timeline:** Week 1-2
> **Depends on:** Nothing — this is ground zero
> **Blocks:** Everything else
> **Status:** Not started

---

## Deliverables

1. GitHub repo `steampunkfarms/sempervets` created (private)
2. Vercel project linked to steampunk-studiolo team
3. Site loads at semper.tronboll.us (staging)
4. NextAuth v5 working: magic-link + Google SSO
5. Resend MX receiving email for sempervets.com
6. Enterprise Email Handler ingesting inbound mail
7. Landing page with DRE compliance footer
8. PWA manifest + service worker registered
9. Site #7 registered in `FAMILY_OF_SITES_UPDATED.md`
10. CLAUDE.md brain file in repo root

---

## Technical Tasks

### T0.1 — Repository Setup
```bash
# Create repo
gh repo create steampunkfarms/sempervets --private
# Clone and init
npx create-next-app@latest sempervets --ts --tailwind --app --turbo
cd sempervets
# Install core deps
npm i drizzle-orm @neondatabase/serverless next-auth@5 resend @anthropic-ai/sdk
npm i lucide-react sonner recharts
npm i -D drizzle-kit @types/node
```

### T0.2 — Vercel Project
- Create project in steampunk-studiolo team
- Link to GitHub repo
- Set staging domain: semper.tronboll.us
- Environment variables:
  ```
  DATABASE_URL=           # Neon Postgres connection string
  NEXTAUTH_SECRET=        # Generated secret
  NEXTAUTH_URL=           # https://semper.tronboll.us
  RESEND_API_KEY=         # Resend key
  ANTHROPIC_API_KEY=      # Claude API key (Erick's)
  GOOGLE_CLIENT_ID=       # Google OAuth for SSO
  GOOGLE_CLIENT_SECRET=   # Google OAuth secret
  TWILIO_ACCOUNT_SID=     # Placeholder until active
  TWILIO_AUTH_TOKEN=      # Placeholder until active
  ```

### T0.3 — Database Setup
- Create dedicated Neon PostgreSQL instance
- Name: `sempervets-db`
- Run initial Drizzle migration with `users`, `sessions`, `accounts`, `verification_tokens`, `settings` tables
- Seed `settings` table with default feature flags (all integrations OFF)

### T0.4 — Auth System
- NextAuth v5 configuration:
  - **Email provider** (magic-link via Resend) — PRIMARY
  - **Google provider** (OAuth) — SECONDARY for partners/agents
- Role-based middleware:
  ```typescript
  // middleware.ts
  // (public) routes: no auth required
  // (portal) routes: auth required, role check, redirect to correct portal
  // (admin) routes: auth required, admin/superadmin role required
  ```
- Magic-link email template (Starlene's branding — Semper Vets logo, military-inspired, clean)
- Session includes: userId, role, secondaryRoles, name, email

### T0.5 — Resend MX + Email Handler
- Configure Resend MX records for sempervets.com
- SPF, DKIM, DMARC records
- Enterprise Email Handler route: `/api/email/inbound`
  - Receives webhook from Resend
  - Parses sender, recipients, subject, body, attachments
  - Stores in `emails` table (create minimal version — full table in Phase 3)
  - Logs activity
  - Returns 200 to Resend
- Test: Send email to any@sempervets.com → appears in admin inbox view

### T0.6 — Landing Page
- Hero section: Starlene + Ashlyn photo (from LeBlanc assets), tagline, CTA
- Veteran-focused messaging (direct, no-nonsense, trust-building)
- Services overview cards (Sales, PM, Investor)
- Trusted lender links (Dan Chapman, John Medin, Alisha Sirois)
- Contact form (basic — name, email, phone, message → stored in DB + email notification)
- Footer with full DRE compliance:
  ```
  Starlene Bennin | Broker Associate | DRE #01730188
  Ashlyn Windsor | Licensed Salesperson | DRE #02224221
  Red Hawk Realty | Broker Donn Bree | DRE #01078868
  ```
- Footer editable via `settings` table (admin can update without deploy)

### T0.7 — PWA Setup
- `manifest.json` with Semper Vets branding
- Service worker for offline support + push notification readiness
- Icons at all required sizes
- Theme color matching site design
- `apple-touch-icon` for iOS home screen

### T0.8 — Family Registration
- Add to `FAMILY_OF_SITES_UPDATED.md`:
  ```
  | 7 | **Semper Vets** | prj_XXXXXX | sempervets.com / semper.tronboll.us | sempervets |
  ```
- Add to domain table
- Create `sempervets-reference.md` in strategy docs

### T0.9 — CLAUDE.md Brain File
- Full brain file (see `CLAUDE-MD-DRAFT.md` in this directory)
- Project overview, architecture, conventions, route structure
- References to MASTER-PLAN.md and SCHEMA-DESIGN.md
- Checkpoint tracking section

---

## Verification Checklist

- [ ] `https://semper.tronboll.us` loads landing page
- [ ] Magic-link login sends email, creates session
- [ ] Google SSO login creates session with correct role
- [ ] Admin route (`/admin/command`) shows for admin user, 403 for others
- [ ] Email to `test@sempervets.com` arrives in inbound handler, stored in DB
- [ ] PWA installable on mobile (Add to Home Screen)
- [ ] DRE footer displays correctly on all pages
- [ ] Lighthouse PWA score ≥ 90
- [ ] Family of sites doc updated
- [ ] CLAUDE.md committed and accurate
