# The Cogworks — Master Implementation Plan
## Steampunk Farms Rescue Barn First-Party Content & Campaign Platform

**Created:** February 27, 2026
**Document Owner:** Padrona + Opus Planning Sessions
**Repo:** steampunk-rescuebarn
**Status:** Planning Complete → Phase 1 Sprint 1 Ready to Build

---

## Vision Statement

The Cogworks is Steampunk Farms' first-party social platform — a place where every donor, volunteer, and barn friend lives, engages, and gives. One canonical post in Supabase radiates everywhere: species feeds, campaign landing pages, email digests, donor enrichment in Studiolo, and Content Storm fragments in Postmaster. No platform can throttle, shadow-ban, or algorithm-murder our animals' stories ever again.

We own the relationship. We own the data. We own the revenue loop.

---

## Naming & Branding

**The Cogworks** — the content engine. Named in the steampunk tradition alongside Studiolo, Postmaster, and Cleanpunk.

**Species Feeds** — each species group has a feed identity:
- The Cluck Crew (chickens + ducks + geese — the poultry collective)
- The Goats That Stare at Hay (goats, including CL herds)
- Clouder 9 (cats — barn cats only, not Feral-to-Barn-Cat placements)
- The Wallows (pigs + hogs — distinguished internally for budget/care but unified for donors)
- The Pasture Crew (donkeys, horses, cows, sheep — the grazers)
- The Underdogs (dogs — reactive dog specialists, not currently taking new intakes)
- General / The Barn (cross-species, sanctuary-wide stories)

**Future specialty campaigns** (not at launch):
- CL Herd Fund (caseous lymphadenitis goats — specialized care)
- Wheels of Fortune (wheelchair-bound residents)
- Other niche medical segments TBD via team brain-camp

---

## Species Group Registry

| Key | Display Name | Campaign Name | Animals Included | Campaign Status |
|---|---|---|---|---|
| `poultry` | Poultry | The Cluck Crew | Chickens, ducks, geese, roosters | **Launch** |
| `goats` | Goats | The Goats That Stare at Hay | All goats including CL herds | **Launch** |
| `cats` | Cats | Clouder 9 | Barn cats (resident, not FtBC program) | **Launch** |
| `swine` | Pigs & Hogs | The Wallows | Pigs, hogs (up to 1300 lbs) | Phase 2 |
| `grazers` | Pasture Animals | The Pasture Crew | Donkeys, horses, cows, sheep | Phase 2 |
| `dogs` | Dogs | The Underdogs | Reactive dogs (no current intake) | Phase 3+ |
| `general` | The Barn | — | Cross-species, sanctuary-wide | **Launch** |
| `cl_herd` | CL Herd | CL Herd Fund | CL-positive goats (specialty) | Future |
| `medical` | Special Needs | Wheels of Fortune | Wheelchair/medical residents | Future |

---

## Architecture Overview

### Data Flow (the cascade)

```
Author creates post in /admin/cogworks (Tiptap editor)
    ↓
Stored in Supabase: sanctuary_posts table
    ↓ appears on
/barn-feed (main feed, all species, reverse chron)
    ↓ appears on
/barn-feed/[species] (species-specific feed)
    ↓ featured posts appear on
/campaigns/[slug] (below donation form)
    ↓ webhook to
Postmaster → auto-fragments into Content Storm
    ↓ weekly digest to
Campaign subscribers (Resend, only when new posts exist)
    ↓ donation on any surface →
Stripe webhook → Studiolo donor record enrichment
    ↓ mini-cards on
/donate page (cross-sell to specific campaigns)
```

### Tech Stack (all existing — no new vendors)

- **Supabase** — posts, reactions, comments, campaign subscribers (same project)
- **Tiptap** — rich text editor with custom extensions (resident cards, donate buttons, video embeds, "Barn Note" callouts)
- **Vercel Blob** — media storage (photos, video poster frames)
- **Stripe** — campaign donation forms (reuse Sprint 1 DonationForm pattern)
- **Resend** — weekly campaign digests (free tier, watch Rubicon)
- **shadcn/ui + Tailwind** — UI components, barn palette
- **Next.js App Router** — ISR + revalidate on publish
- **TanStack Query** — infinite scroll (future phase)
- **Postmaster API** — resident profile cards, Content Storm webhook

---

## Database Schema

### Core Tables (Phase 1)

```sql
-- The atomic content unit
CREATE TABLE sanctuary_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  
  -- Authorship
  author_id UUID REFERENCES auth.users(id),
  
  -- Content
  title TEXT, -- optional for quick updates
  body JSONB NOT NULL, -- Tiptap JSON document
  body_plain TEXT, -- plain text extraction for search/digests
  excerpt TEXT, -- manual or auto-generated summary
  slug TEXT UNIQUE, -- auto-generated from title or date
  
  -- Classification
  species_group TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  
  -- Media
  media_urls TEXT[] DEFAULT '{}', -- Vercel Blob URLs
  hero_image_url TEXT, -- primary display image
  video_url TEXT, -- YouTube/Vimeo/direct link
  video_poster_url TEXT, -- poster frame for video
  
  -- Connections
  resident_slugs TEXT[] DEFAULT '{}', -- links to Postmaster resident profiles
  campaign_slugs TEXT[] DEFAULT '{}', -- which campaigns feature this post
  
  -- Display controls
  featured BOOLEAN NOT NULL DEFAULT false, -- shows on campaign landing pages
  pinned BOOLEAN NOT NULL DEFAULT false, -- stays at top of species feed
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- AI fields (populated async, Phase 3)
  ai_caption TEXT, -- short caption for Storms
  ai_donor_hook TEXT, -- paragraph for thank-you emails
  ai_seo_description TEXT, -- meta description
  
  -- Metrics (denormalized for performance)
  reaction_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0
);

-- Campaign definitions
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  slug TEXT UNIQUE NOT NULL, -- 'cluck-crew', 'goats-that-stare-at-hay', 'clouder-9'
  name TEXT NOT NULL, -- display name
  tagline TEXT, -- one-liner
  description TEXT, -- rich text or markdown for landing page hero
  
  species_group TEXT NOT NULL, -- which feed it pulls from
  
  -- Branding
  hero_image_url TEXT,
  hero_video_url TEXT,
  accent_color TEXT, -- hex, for campaign ribbon on feed posts
  icon_emoji TEXT, -- 🐔, 🐐, 🐱
  
  -- Stripe
  stripe_product_id TEXT, -- for the donation form
  
  -- Donation tiers (JSONB array of {amount, name, description})
  donation_tiers JSONB DEFAULT '[]',
  
  -- Display
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  
  -- Metrics (denormalized)
  total_raised DECIMAL(12,2) NOT NULL DEFAULT 0,
  subscriber_count INT NOT NULL DEFAULT 0,
  animals_supported INT NOT NULL DEFAULT 0 -- editorial, not computed
);

-- Donors who gave to a specific campaign
CREATE TABLE campaign_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  donor_name TEXT,
  
  -- Giving history within this campaign
  first_gift_date TIMESTAMPTZ,
  last_gift_date TIMESTAMPTZ,
  total_given DECIMAL(12,2) NOT NULL DEFAULT 0,
  gift_count INT NOT NULL DEFAULT 0,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  
  -- Preferences
  email_digest_opted_in BOOLEAN NOT NULL DEFAULT true,
  public_recognition BOOLEAN NOT NULL DEFAULT false,
  display_name TEXT, -- for donor wall
  
  UNIQUE(campaign_id, email)
);

-- RLS policies
ALTER TABLE sanctuary_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_subscribers ENABLE ROW LEVEL SECURITY;

-- Public read for published posts
CREATE POLICY "Published posts are public" ON sanctuary_posts
  FOR SELECT USING (status = 'published');

-- Admin write for posts
CREATE POLICY "Admins can manage posts" ON sanctuary_posts
  FOR ALL USING (is_admin());

-- Public read for active campaigns  
CREATE POLICY "Active campaigns are public" ON campaigns
  FOR SELECT USING (active = true);

-- Admin write for campaigns
CREATE POLICY "Admins can manage campaigns" ON campaigns
  FOR ALL USING (is_admin());

-- Subscribers visible to admins only
CREATE POLICY "Admins can manage subscribers" ON campaign_subscribers
  FOR ALL USING (is_admin());

-- Indexes
CREATE INDEX idx_posts_species_published ON sanctuary_posts(species_group, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_posts_featured ON sanctuary_posts(species_group, featured) WHERE status = 'published' AND featured = true;
CREATE INDEX idx_posts_slug ON sanctuary_posts(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_campaign_subscribers_campaign ON campaign_subscribers(campaign_id);
CREATE INDEX idx_campaign_subscribers_email ON campaign_subscribers(email);
```

### Phase 2 Tables (reactions, comments)

```sql
-- Reactions on posts
CREATE TABLE post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  post_id UUID NOT NULL REFERENCES sanctuary_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  reaction_type TEXT NOT NULL, -- 'heart', 'oink', 'hay_yeah', 'barn_burner'
  UNIQUE(post_id, user_id, reaction_type)
);

-- Comments on posts
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  post_id UUID NOT NULL REFERENCES sanctuary_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES post_comments(id),
  author_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),
  edited BOOLEAN NOT NULL DEFAULT false
);
```

### Phase 3 Tables (personalization, engagement tracking)

```sql
-- User feed preferences
CREATE TABLE feed_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  subscribed_species TEXT[] DEFAULT '{}',
  subscribed_campaigns TEXT[] DEFAULT '{}',
  email_frequency TEXT DEFAULT 'weekly' CHECK (email_frequency IN ('weekly', 'biweekly', 'monthly', 'none'))
);

-- Engagement events (for Studiolo heatmap)
CREATE TABLE post_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  post_id UUID NOT NULL REFERENCES sanctuary_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL, -- 'view', 'reaction', 'comment', 'share', 'donate_click'
  metadata JSONB DEFAULT '{}'
);
```

---

## Phased Rollout

### PHASE 1: Foundation (3 sprints)
**Goal:** Ship the content platform and three campaign landing pages. Donors can find campaigns, give, and see content. Authors can publish rich posts.

#### Sprint 1: Schema + Admin CMS + Basic Feed Display
- [ ] Supabase migration: sanctuary_posts, campaigns, campaign_subscribers tables
- [ ] Seed 3 campaigns: Cluck Crew, The Goats That Stare at Hay, Clouder 9
- [ ] /admin/cogworks — post list view (draft/published filter, species filter)
- [ ] /admin/cogworks/new — Tiptap editor (basic: headings, lists, bold/italic, images, links, video embed)
- [ ] /admin/cogworks/[id]/edit — edit existing post
- [ ] /barn-feed — main feed page (server-rendered, paginated, no infinite scroll yet)
- [ ] /barn-feed/[species] — species feed (filtered view)
- [ ] Post card component: hero image, title, excerpt, species badge, date, read more
- [ ] Media upload to Vercel Blob from admin editor
- [ ] ISR with revalidate-on-publish

#### Sprint 2: Campaign Landing Pages + Donation Forms
- [ ] /campaigns/[slug] — dynamic campaign landing page
- [ ] Campaign hero section (image/video, name, tagline, description)
- [ ] Campaign donation form (reuse DonationForm pattern from Sprint 1 /donate)
  - Campaign-specific Stripe products (create in Dashboard)
  - Donation tiers from campaign.donation_tiers JSONB
  - Monthly toggle, resident dedication
  - Campaign metadata in PaymentIntent (campaign_slug, campaign_name)
- [ ] Featured posts section below donation form (featured === true for that species)
- [ ] Webhook extension: payment_intent.succeeded with campaign metadata → campaign_subscribers upsert
- [ ] Campaign mini-cards on /donate page below main form
- [ ] Rewrite campaign copy: Cluck Crew, Goats That Stare at Hay, Clouder 9 (fresh voice)
- [ ] Campaign navigation in site header or sub-nav

#### Sprint 3: Full Post View + Resident Cards + Polish
- [ ] /barn-feed/[slug] — full post page (Tiptap rendered body)
- [ ] Resident profile card component (fetch from Postmaster API, photo + name + species + "Sponsor" micro-button)
- [ ] Custom Tiptap extensions: resident card embed, "Barn Note" callout block
- [ ] Video embed (YouTube/Vimeo URL detection + poster frame)
- [ ] Photo gallery carousel component (multi-image posts)
- [ ] "Donate to this story" inline button (pre-fills campaign form)
- [ ] SEO: meta tags, OG images, JSON-LD for posts and campaigns
- [ ] Mobile optimization: full-bleed cards, responsive grid

### PHASE 2: Engagement + Email (2 sprints)
**Goal:** Donors interact with content and receive periodic updates. Campaign subscriber relationships deepen.

#### Sprint 4: Reactions + Comments
- [ ] Supabase migration: post_reactions, post_comments tables
- [ ] Reaction bar component: ❤️ "Saved a life", 🐷 "Oink of approval", 🐐 "Hay yeah!", 🔥 "Barn Burner"
- [ ] Comment thread component (authenticated users only, threaded replies)
- [ ] Comment moderation in /admin/cogworks (hide/flag)
- [ ] Reaction + comment count denormalization (trigger or app-level)
- [ ] Donor wall component on campaign pages (anonymized or named with permission)
- [ ] "Recent donors" live ticker on campaign pages

#### Sprint 5: Email Digests + Studiolo Integration
- [ ] Weekly digest cron: per-campaign, only fires if new posts that week
- [ ] Resend digest template (campaign-branded, 3-5 post summaries, CTA to full post)
- [ ] campaign_subscribers.email_digest_opted_in controls delivery
- [ ] Unsubscribe link → updates opt-in flag
- [ ] Studiolo webhook: new post → forward to Studiolo for donor record enrichment
- [ ] Studiolo webhook: campaign donation → create/merge donor record, log touch
- [ ] Stripe Workflow extension: campaign-specific hot-touch alerts

### PHASE 3: Intelligence + Personalization (2 sprints)
**Goal:** AI-assisted content creation, personalized feeds for logged-in users, deeper Postmaster integration.

#### Sprint 6: AI Content Layer
- [ ] Post-publish webhook → Postmaster: auto-fragment into Content Storm
- [ ] Claude API route: auto-generate caption, donor hook, SEO meta on publish
- [ ] Auto-suggest resident tags from uploaded photos (vision model against Postmaster catalog)
- [ ] OG image auto-generation on publish (post title + hero image composited)

#### Sprint 7: Personalized Feed + Dashboard
- [ ] feed_preferences table migration
- [ ] Logged-in home feed: "Good morning, [Name]" + personalized content mix
- [ ] Campaign subscription management in user dashboard
- [ ] "My giving impact" section: cumulative totals across campaigns
- [ ] Engagement heatmap in Studiolo admin (which stories convert)

### PHASE 4: Platform Evolution (future sprints)
**Goal:** Transform from content platform to community platform to movement infrastructure.

#### Sprint 8+: Community & Mobile
- [ ] Supabase Realtime for live comments
- [ ] "Share to my feed" (internal re-shares with attribution)
- [ ] @mentions in comments → Studiolo notification
- [ ] Barn Cam embed (existing cameras)
- [ ] "Drop a Hay Bale" micro-donation buttons inside posts
- [ ] PWA manifest + "Add to Home Screen" prompt
- [ ] Push notifications for new posts in subscribed campaigns
- [ ] Scheduled live streams with chat

#### Sprint 9+: User-Generated Content
- [ ] Volunteer/foster post submission with approval queue
- [ ] Photo upload from mobile (visitor stories)
- [ ] Community badges and engagement rewards

#### Sprint 10+: Sanctuary Hub (Piggie Smalls Integration)
- [ ] Multi-tenant Cogworks: other sanctuaries can plug in
- [ ] Shared campaign infrastructure
- [ ] Cross-sanctuary donor network

---

## Campaign Copy Direction

### The Cluck Crew
**Species:** Poultry (chickens, ducks, geese)
**Tone:** Playful, irreverent, the ducks are freeloaders and we lean into it
**Key stories:** Cockfighting rooster rescues finding peace, retired egg-laying hens, the duck situation
**Donation tiers:**
- $3/mo — "One Happy Hen" (sponsor one chicken)
- $9/mo — "Flock Friend" (three birds)
- $15/mo — "Cluck Commander" (five birds)
- $30/mo — "The Flock Hero" (ten birds)
**Copy to rewrite:** Remove all Zeffy references. Update to reflect Stripe integration. Maintain the irreverent voice but tighten — the existing copy repeats itself 3x. Single pass, punchy, personality-forward.

### The Goats That Stare at Hay
**Species:** Goats (all herds including CL)
**Tone:** Absurdist humor, the goats are weirdly sentient and we respect it
**Key stories:** CL herd care (Krystal's specialized vet expertise, 20 acres accommodating what others can't), goat personalities, the hay obsession
**Donation tiers:**
- $5/mo — "One goat, one day, two meals"
- $10/mo — "15 goats fed for a day"
- $20/mo — "30 ferocious goats, two meals"
- $40/mo — "60 hug-therapists fed"
- $80/mo — "Entire herd, one full day"
- $560/mo — "One full week of hay"
- $2,427/mo — "Full month of hay, Goat-God status"
**Note:** "Goats That Stare at Hay" generated 8x more donations than "Haystackers" — keep this name.
**Copy to rewrite:** The existing copy is formal/corporate ("gallinaceous species and lagomorphs"). Total rewrite in the irreverent Steampunk voice. Match Cluck Crew energy.

### Clouder 9
**Species:** Cats (barn cats in residence)
**Tone:** TBD — mysterious, independent, cat energy. The cats tolerate our presence.
**Key stories:** Barn cat colony life, the ones who chose to stay, nighttime barn patrol
**Donation tiers:** To be developed (no existing copy — Cattersville was deleted)
**Copy:** Write from scratch. Cat personality. They're not grateful and that's the point.
**Note:** Clouder 9 replaces the deleted Cattersville campaign. Fresh start.

---

## Integration Points

### Stripe
- One product per campaign in Dashboard (like STRIPE_DONATION_PRODUCT_ID for general)
- Campaign donation form reuses DonationForm component with campaign-specific metadata
- payment_intent.succeeded webhook detects campaign_slug → upserts campaign_subscribers
- Recurring handled same as Sprint 1: PaymentIntent + webhook-created Subscription

### Studiolo
- New donation with campaign metadata → Studiolo webhook → donor record creation/merge
- campaign_slug stored in donor gift record for segment analysis
- Touch auto-logged: "Gave $X to Cluck Crew"
- Future: engagement events (reactions, comments) forwarded as soft touches

### Postmaster
- Resident profile cards in posts pull from existing /api/public/residents endpoint
- Post-publish webhook sends post content → Postmaster fragments into Content Storm
- Resident slugs in posts create bidirectional links (post → resident, resident page → related posts)

### Cleanpunk Shop
- Campaign landing pages include "Shop for the Crew" section
- Ambassador Animal products linked to species (Chance's Lavish bar → goats, etc.)
- Pull product data via Cleanpunk/Medusa API or static config initially

### Resend
- Weekly digest per campaign (only when new posts exist that week)
- Template: campaign-branded header, 3-5 post cards with hero image + excerpt, CTA to full post
- Unsubscribe link manages campaign_subscribers.email_digest_opted_in
- Monitor volume against free tier limits

---

## Admin Interface

### /admin/cogworks (Post Management)
- Post list: filterable by status (draft/published/archived), species group, featured flag
- Quick actions: publish, archive, feature/unfeature, pin/unpin
- Inline preview of post card as it appears in feed

### /admin/cogworks/new and /admin/cogworks/[id]/edit
- Tiptap editor with toolbar: headings, bold/italic, lists, blockquote, code, link, image upload, video embed
- Custom blocks: Resident Card (search Postmaster residents, embed inline), Barn Note callout, Donate CTA button
- Species group selector (required)
- Tags (free-form text array)
- Featured toggle + campaign association
- Media manager: drag-and-drop upload to Vercel Blob, reorder, set hero image
- Publish/schedule/save draft controls
- Preview mode (renders as feed card + full post)

### /admin/cogworks/campaigns
- Campaign list with metrics (total raised, subscribers, post count)
- Edit campaign details, tiers, branding
- View subscriber list with giving history
- Digest send history and open rates (when email tracking added)

---

## Key Design Decisions

1. **Content lives in Rescue Barn Supabase, not Postmaster.** These are donor-experience posts, not animal medical records. Postmaster remains source-of-truth for resident data; Cogworks is source-of-truth for narrative content.

2. **Tiptap JSON stored in JSONB.** Not markdown. Tiptap's JSON document format preserves structure for custom rendering, while body_plain extracts searchable text. This future-proofs for custom node types.

3. **Species groups, not barn areas.** Donors think in animals, not physical locations. "I support chickens" not "I support The Catwalk area." Barn areas remain for the site's sanctuary tour content.

4. **Campaign subscribers are email-first, not auth-first.** Most campaign donors won't create accounts. Track by email + stripe_customer_id. If they later create an account, merge via email match.

5. **Featured flag is editorial, not algorithmic.** Staff manually star posts for campaign landing pages. No engagement-based promotion — this isn't social media, it's curated storytelling.

6. **Weekly digests only when content exists.** Scarcity is a feature. Breaks routine-blindness. Also respects Resend free tier limits.

7. **Reactions before comments.** Reactions are low-friction engagement (Phase 2 Sprint 4). Comments add moderation burden. Ship reactions first, prove engagement, then add comments.

8. **No infinite scroll in Phase 1.** Server-rendered pagination is simpler, more accessible, better for SEO. TanStack Query infinite scroll comes in Phase 2 or 3.

---

## File Structure (Rescue Barn repo)

```
src/
  app/
    barn-feed/
      page.tsx                    -- main feed
      [species]/
        page.tsx                  -- species feed
      [slug]/
        page.tsx                  -- full post view
    campaigns/
      page.tsx                    -- campaign index (optional)
      [slug]/
        page.tsx                  -- campaign landing page
    admin/
      cogworks/
        page.tsx                  -- post management list
        new/
          page.tsx                -- new post editor
        [id]/
          edit/
            page.tsx              -- edit post
        campaigns/
          page.tsx                -- campaign management
    api/
      cogworks/
        posts/
          route.ts                -- CRUD for posts
        campaigns/
          route.ts                -- campaign data
        upload/
          route.ts                -- Vercel Blob upload
        publish/
          route.ts                -- publish + revalidate + webhooks
        digest/
          route.ts                -- cron: weekly digest sender
  components/
    cogworks/
      PostCard.tsx                -- feed card component
      PostBody.tsx                -- Tiptap renderer for full posts
      PostEditor.tsx              -- Tiptap editor (admin)
      MediaCarousel.tsx           -- photo gallery
      ResidentCard.tsx            -- inline resident profile
      SpeciesBadge.tsx            -- species group badge/ribbon
      CampaignHero.tsx            -- campaign landing page hero
      CampaignDonationForm.tsx    -- campaign-specific donation form
      CampaignMiniCard.tsx        -- cross-sell card for /donate
      DonorWall.tsx               -- recent/top donors display
      FeaturedPosts.tsx           -- featured posts section
      BarnNoteCallout.tsx         -- custom Tiptap block
  lib/
    cogworks/
      queries.ts                  -- Supabase queries for posts, campaigns
      types.ts                    -- TypeScript types
      tiptap-extensions.ts        -- custom Tiptap node definitions
      digest.ts                   -- email digest builder
```

---

## Sprint 1 Readiness Checklist

Before starting Sprint 1 code:
- [x] Species groups defined
- [x] Launch campaigns identified (Cluck Crew, Goats That Stare at Hay, Clouder 9)
- [x] Database schema designed
- [x] File structure planned
- [x] Phase boundaries defined
- [ ] Stripe products created for each campaign (manual step during sprint)
- [ ] Campaign copy written (can be done in parallel with code)
- [ ] Hero images/media gathered (can use placeholders initially)

---

## Session Handoff Protocol

This document lives at:
`/Users/ericktronboll/Desktop/Future Dev - do not move or delete/THE-COGWORKS-MASTER-PLAN.md`

Each sprint will have its own checkpoint at `/home/claude/cogworks-sprint-N/CHECKPOINT.md`

For Claude Code grunt work delegation:
1. Opus writes task files to Desktop/Future Dev
2. Claude Code reads task file and executes
3. Opus reviews results in next planning session

For new thread handoff, use the prompt template in the companion file:
`/Users/ericktronboll/Desktop/Future Dev - do not move or delete/COGWORKS-THREAD-PROMPT.md`
