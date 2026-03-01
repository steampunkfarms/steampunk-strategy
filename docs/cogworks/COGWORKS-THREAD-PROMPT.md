# Cogworks Thread Handoff Prompt

Copy everything below this line into a new conversation in the Rescue Barn project when starting a new sprint or resuming after timeout.

---

## Context

I'm building The Cogworks — a first-party content and campaign platform for Steampunk Farms Rescue Barn. The master plan is at:

`/Users/ericktronboll/Desktop/Future Dev - do not move or delete/THE-COGWORKS-MASTER-PLAN.md`

Read that file first. It contains the complete architecture, database schema, phased rollout, campaign details, and file structure.

The Rescue Barn repo is at `/Users/ericktronboll/Projects/steampunk-rescuebarn/`
The project reference is in the project files attached to this Claude Project.

### What's already shipped:

**Donation system:** Native Stripe donation form on /donate, one-time + recurring, webhooks, hot-touch alerts. Zeffy removed.

**Cogworks Sprint 1 (complete):**
- Supabase tables: `sanctuary_posts`, `campaigns`, `campaign_subscribers` with RLS, indexes, updated_at trigger
- 3 campaigns seeded: Cluck Crew, Goats That Stare at Hay, Clouder 9 — all with Stripe product IDs wired
- Tiptap rich text editor with image upload to Vercel Blob
- Public feeds: `/barn-feed` and `/barn-feed/[species]` with ISR
- Admin CMS: `/admin/cogworks` with post management, filters, create/edit
- Post CRUD API with on-demand revalidation
- BLOB_READ_WRITE_TOKEN configured in Vercel
- Build passing, deployed to production (112 routes)

**Files created in Sprint 1:**
```
src/lib/cogworks/types.ts
src/lib/cogworks/queries.ts
src/components/cogworks/SpeciesBadge.tsx
src/components/cogworks/PostCard.tsx
src/components/cogworks/PostEditor.tsx
src/app/barn-feed/page.tsx
src/app/barn-feed/[species]/page.tsx
src/app/admin/cogworks/page.tsx
src/app/admin/cogworks/new/page.tsx
src/app/admin/cogworks/[id]/edit/page.tsx
src/app/admin/cogworks/[id]/edit/edit-client.tsx
src/app/api/cogworks/posts/route.ts
src/app/api/cogworks/upload/route.ts
```

### Current sprint: Sprint 2 — Campaign Landing Pages + Donation Forms

Per the master plan, Sprint 2 covers:
- `/campaigns/[slug]` — dynamic campaign landing pages
- Campaign hero section with branding (accent_color, icon_emoji, hero_image)
- Campaign donation form (reuse DonationForm pattern, campaign-specific Stripe products)
- Donation tiers pulled from campaign.donation_tiers JSONB
- Campaign metadata in PaymentIntent
- Webhook: payment_intent.succeeded → campaign_subscribers upsert
- Campaign mini-cards on /donate page (cross-sell)
- Campaign navigation component
- Campaign copy finalization (Cluck Crew rewrite, Goats rewrite — seed copy exists but may need polish)

### Key rules:
- Write files directly to my filesystem, never dump large content in chat
- Use checkpoints for timeout recovery
- Run `npm run build` to verify after changes
- Descriptive git commits, push to main for auto-deploy
- Follow the efficient file handling instructions in the project files

Let's start Sprint 2.
