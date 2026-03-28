# Checkpoint 6 — Marketing & Social + Compliance Bridges

> **Goal:** Complete marketing automation + brokerage compliance bridges + final polish
> **Timeline:** Week 16-20
> **Depends on:** Checkpoint 5 (MLS data feeds content generation)
> **Blocks:** Nothing — this is the capstone
> **Status:** Not started

---

## Deliverables

1. AI content generator (listings, blogs, social posts, campaigns)
2. Social media scheduler with auto-publish
3. Campaign calendar (daily through annual planning)
4. Marketing asset generator (flyers, announcements)
5. ASANA / ZOHO / CREXI / CANVA compliance bridges
6. QR code system for all marketing materials
7. Testimonial + referral tracking
8. VA Loan Education Hub + PCS/Relocation Guide
9. Recipes section (community content)
10. Blog system with AI-generated content

---

## Technical Tasks

### T6.1 — AI Content Generator (`/admin/marketing/content`)
- **Listing description writer:**
  - Input: listing data from DB
  - Claude generates description in Starlene's voice (warm, direct, veteran-aware)
  - Multiple variants: MLS (character-limited), website (full), social (short), email (narrative)
  - Edit and approve workflow

- **Blog post generator:**
  - Topic selection or AI suggestion ("Post about VA loan myths — engagement peaks this Tuesday")
  - Claude writes draft with SEO optimization (title, meta description, headers, keywords)
  - Categories: market_update, va_education, rural_living, investment, community, recipe, pcs_relocation
  - Auto-generate featured image prompt (for external AI image gen or stock photo search)
  - Edit → approve → publish to `/blog/[slug]`
- **Social media content:**
  - Per-platform generation (IG caption + hashtags, FB post, LinkedIn professional, X thread, YouTube description)
  - Image suggestions + text overlays for visual platforms
  - Bulk generation: "Create a week of content about spring market trends"
- **Email campaign content:**
  - Claude writes campaign sequences based on audience + goal
  - Subject line A/B variants
  - Personalization at scale (each email customized to recipient's profile)
- **Market report content** (builds on Phase 4 Market Sentinel):
  - Weekly market report → auto-sliced into blog post + email + social posts
  - One generation, multiple distribution channels

### T6.2 — Social Media Scheduler (`/admin/marketing/social`)
- **Calendar view:** see all scheduled posts across all platforms
- **Create post:**
  - Select platform(s): IG, FB, LinkedIn, X, YouTube
  - Content (AI-generated or manual)
  - Media attachments (from Vault or upload)
  - Schedule date/time
  - AI suggests optimal posting time per platform
- **Auto-publish** (⚠️ needs platform API developer apps):
  - Instagram: Meta Graph API (business account required)
  - Facebook: Meta Graph API (Page access)
  - LinkedIn: LinkedIn Marketing API
  - X: Twitter API v2
  - YouTube: YouTube Data API v3
  - **Fallback until APIs ready:** generate content → "Copy to clipboard" button → manual post
- **Analytics pull:** engagement metrics from each platform → aggregate dashboard
- **Content calendar** (`/admin/marketing/calendar`):
  - Daily/weekly/monthly/quarterly/annual views
  - Drag-and-drop reschedule
  - Campaign grouping (all posts for a listing launch grouped together)
  - AI suggestions: "You haven't posted about VA loans in 2 weeks — schedule?"

### T6.3 — Marketing Asset Generator
- **Open house flyer:**
  - Template: Starlene's branding (LeBlanc design assets as reference)
  - Auto-fill: property photo, address, date/time, agent info, QR code for sign-in form
  - Export as PDF for print
- **Just-listed announcement:**
  - Auto-generate when listing status changes to 'active'
  - Email blast to matching buyer profiles
  - Social post draft created
  - Printable flyer generated
- **Just-sold announcement:**
  - Auto-generate on close
  - Social post + email template
  - "Sold in X days!" badge
- **CMA presentation packet:**
  - Professional PDF: comps, market analysis, pricing strategy, agent bio
  - AI-written narrative for each comp + conclusion
  - Starlene's branding throughout

### T6.4 — Compliance Bridges (Red Hawk Requirements)
- **ASANA bridge** (`/api/integrations/asana`):
  - When task created in our system → check if it matches Red Hawk categories
  - If yes → create corresponding task in Red Hawk's ASANA workspace via API
  - Status sync: our task status changes → ASANA updates
  - Fallback: CSV/email export of tasks in ASANA-importable format
- **ZOHO bridge** (`/api/integrations/zoho`):
  - Nightly sync of new/updated contacts to Red Hawk's ZOHO CRM
  - Email activity summary export
  - Transaction milestone notifications
  - Fallback: CSV export matching ZOHO import format
- **CREXI bridge** (`/api/integrations/crexi`):
  - When listing created/updated → push to Red Hawk's CREXI account
  - Photo sync, description sync, status sync
  - Fallback: CREXI-formatted listing export
- **CANVA bridge:**
  - Generate marketing assets using Starlene's brand kit
  - Export in formats compatible with Red Hawk's CANVA team templates
  - Fallback: our AI content generator replaces most CANVA use cases entirely

### T6.5 — QR Code System
- **Auto-generation:** every form, listing, and marketing asset gets a QR code
- **QR types:**
  - Lead capture form (homepage, specific listings)
  - Open house sign-in
  - Business card (links to Starlene's bio page)
  - Listing detail page
  - CMA request form
  - Event registration
- **Output formats:** PNG (web/print), SVG (scalable), PDF (print-ready with branding frame)
- **Tracking:** each QR code has unique UTM parameters → source tracking in CRM
- **Bulk generation:** "Generate QR codes for all active listings" → zip download

### T6.6 — Testimonial + Referral System
- **Testimonial collection:**
  - Auto-request after transaction closes (email with rating + review form)
  - Moderation queue: review before publishing
  - Display on website: testimonial carousel on homepage, dedicated page
  - Pull quotes for social media content
- **Referral tracking:**
  - Tag contacts with referral source (who referred them)
  - Track referral chains (A referred B who referred C)
  - Referral conversion rates
  - AI-generated referral thank-you messages
  - Referral leaderboard (who sends the most business — useful for lender relationships)

### T6.7 — Static Content Pages
- **VA Loan Education Hub** (`/va-loan-guide`):
  - How VA loans work / What zero down means
  - VA appraisal requirements / What homes pass VA inspection
  - What sellers need to know about VA buyers
  - Common VA myths debunked
  - VA renovation loans (SAH/SHA grants)
  - AI-powered FAQ chatbot on the page
- **PCS/Relocation Guide** (`/relocation`):
  - Moving to Southern California guide
  - Buying from out of state
  - Virtual showing process
  - Rural/acreage/unique property guide (fits Starlene's market perfectly)
  - Military-specific resources (base maps, VA hospital locations, school district info)
- **Recipes section** (`/recipes`):
  - Starlene's community content idea
  - Simple blog-style recipe posts
  - AI can help generate/format recipes
  - Community engagement + lifestyle branding
- **About page** (`/about`):
  - Starlene + Ashlyn bios with veteran background prominent
  - Mother-daughter team story
  - Military service history
  - DRE credentials
  - Proof of work: listings sold, open houses hosted, years of experience
  - Photo gallery (from LeBlanc assets)

---

## Verification Checklist

- [ ] AI generates listing description in Starlene's voice
- [ ] Blog post: draft → edit → publish → renders at /blog/[slug]
- [ ] Social content generated per-platform with correct formatting
- [ ] Social scheduler shows calendar view, posts can be created/scheduled
- [ ] Open house flyer generates as branded PDF with QR code
- [ ] Just-listed automation fires on listing status change
- [ ] ASANA bridge: create task → appears in Red Hawk's ASANA (or CSV export)
- [ ] ZOHO bridge: new contact → syncs to ZOHO (or CSV export)
- [ ] QR code generates for form → scanning opens correct form on mobile
- [ ] Testimonial request fires after transaction close
- [ ] VA Loan Education Hub renders all content pages
- [ ] PCS/Relocation Guide renders with base maps
- [ ] Recipes section functional
- [ ] About page shows bios with LeBlanc-quality presentation
