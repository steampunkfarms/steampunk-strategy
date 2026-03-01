# Social Enrichment Pipeline — Donor Record Population from Social Interactions

> Reference spec for Meta Comment Harvester (#19-20), Living Studiolo Veil Piercer, and Cogworks Social Ingest.
> Source: Planning notes 2026-03-01

## Overview

Populate Studiolo donor records from Instagram Graph API (business accounts) and Facebook Graph API (Pages). Requires permissions: `instagram_manage_comments`, `pages_manage_metadata`, plus access tokens (already configured in Postmaster).

All methods provide at least a username/handle for cross-referencing with existing donor records.

---

## 6 Interaction Channels

### 1. Comments on Our Posts (Highest Signal)

**Data:** Username (@handle), user ID, comment text, timestamp, profile pic URL (if public). FB also returns commenter's name.

**API:**
- IG: `GET /{media-id}/comments` — Fields: `from {id, username}`, `text`, `timestamp`
- FB: `GET /{post-id}/comments` — Fields: `from {id, name}`, `message`, `created_time`

**Donor record population:**
- Match username to known donor (automated via name similarity + CRM search)
- Add: "Last engaged: [date] with comment '[text]' on post about [topic]"
- Personalization: Reference in outreach ("Loved your thoughts on our latest post — thanks for the shoutout, @donorhandle!")

**Enhancements:** Webhooks for new comments → auto-update records. Business/creator accounts → use Business Discovery for more info.

### 2. Direct Messages (DMs)

**Data:** Username, user ID (IGSID for IG), full name (if shared), message content, timestamp, profile pic.

**API:**
- IG: Instagram Messaging API (Messenger Platform). `GET /{igsid}` — Fields: `name`, `username`
- FB: Messenger API for Page inboxes. `GET /{psid}` — Fields: `first_name`, `last_name`, `profile_pic`

**Donor record population:**
- DMs often include self-disclosed info (name, email, donation intent)
- Auto-log conversations in CRM for context
- If email provided in DM, link directly to donor profile

**Enhancements:** Webhooks for new messages → real-time CRM sync.

### 3. Mentions or Tags in User Content

**Data:** Username, user ID, mention/tagged media details, timestamp.

**API:**
- IG: `GET /{ig-user-id}/mentions` — Includes `from {id, username}`, `media_type`
- FB: Limited — `/{page-id}/tagged` for posts tagging our Page

**Donor record population:**
- Flag as "Advocacy level: High — mentioned us in their story on [date]"
- Cross-check username against donor records

### 4. Likes, Reactions, Shares (Aggregated Only)

**Data:** Aggregated counts only — no individual usernames via API (privacy).

**API:** Insights endpoints (`/{media-id}/insights` for reach, likes).

**Donor record population:** Not directly tieable to individuals. Use for engagement trends — flag high-engagement posts, scan comments for donor matches.

### 5. Donor-Provided Handles — Public Profile Data (Business/Creator Only)

If a donor shares their handle during donation/signup and it's a business/creator account:

**Data:** Biography, followers count, follows count, media count, name, profile pic URL, username, website.

**API:**
- IG Business Discovery: `GET /{our-ig-user-id}?fields=business_discovery.username({donor_username}){biography,followers_count,...}`
- FB: For Pages — `GET /{page-username}` for public fields (about, website)

**Donor record population:**
- Enrich with bio/website for context ("Bio indicates interest in [topic] — tailor outreach")
- Track changes over time (growing followers = potential influencer donor)

**Limitation:** Only works for professional accounts, not personal.

### 6. Indirect Methods via Promotions/Integrations

- **Lead Forms/Ads:** FB/IG ads with lead forms → `/{ad-id}/leads` to retrieve submissions → directly add to records
- **OAuth/Login Integration:** FB/IG login on Rescue Barn → authorized data (email, name) with user permissions
- **Analytics/Aggregates:** `/{ig-user-id}/insights` for audience demographics — segment donors by inferred groups
- **Third-Party Automation:** Zapier/Make.com connectors (new comment → update donor note)

---

## Implementation Plan for Studiolo

### Automation Workflow
1. Poll APIs periodically (daily cron in Postmaster) for new interactions
2. Match usernames to donor handles/emails/names in Studiolo
3. Update Memory Ledger, Relationship Notes, Animals Connected To fields
4. Use scheduling APIs to tie into posting cadence

### Matching Logic
- If donors provide handles upfront → store in donor profile
- Otherwise → fuzzy-match names from interactions ("John Doe" in comment ≈ donor "John D.")
- Page-scoped user ID matching for Facebook (existing SocialIdentityQueue)

### Compliance
- Always get consent for data use (privacy policy)
- Avoid storing sensitive data from DMs without opt-in
- All inferences surfaced to human Curator for approval, never auto-acted

### Priority Order
1. **Comments** — low-hanging fruit, directly shows engagement intent
2. **DMs** — rich self-disclosed data, but lower volume
3. **Mentions** — identifies advocates
4. **Business Discovery** — enrichment for known handles
5. **Lead Forms** — requires ad spend
6. **Likes/Shares** — aggregate only, lowest signal

### Testing
- Use @SteampunkFarms handle to simulate donor interactions
- Build proof-of-concept with comment harvesting first (already partially built in Postmaster `engagementScanner.ts`)
