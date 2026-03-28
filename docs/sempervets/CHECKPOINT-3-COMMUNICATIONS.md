# Checkpoint 3 — Communications Suite

> **Goal:** Full email + SMS + forms + VoIP (if API ready)
> **Timeline:** Week 7-9
> **Depends on:** Checkpoint 2 (Portals generate communication needs)
> **Blocks:** Checkpoint 4 (Intelligence uses communication data)
> **Status:** Not started

---

## Deliverables

1. Full email system: compose, templates, drip campaigns, analytics
2. SMS notification flows via Twilio
3. Push notifications via PWA service worker
4. AI email triage and auto-reply drafts
5. In-app messaging and activity feeds
6. VoIP click-to-call UI (live if Twilio Voice ready, mock if not)
7. Call transcription + AI summarization pipeline

---

## Technical Tasks

### T3.1 — Email System (Full Build)
- **Inbox** (`/admin/email`)
  - All inbound email (from Resend MX handler in Checkpoint 0)
  - Thread view: group by threadId
  - AI triage badges: lead_inquiry (🟢), showing_request (🔵), offer (🟡), maintenance (🟠), spam (🔴)
  - Quick actions: reply, forward, archive, link to contact
  - Search across all emails (full-text on subject + body)
- **Compose** (`/admin/email/compose`)
  - Rich text editor (same TipTap as doc editor)
  - To/CC/BCC with contact autocomplete from CRM
  - Template insertion: pick template → variables auto-fill from selected contact
  - Attachment upload (links to Document Vault)
  - Schedule send (pick date/time)
  - AI draft button: "Write this for me" → Claude drafts based on context

- **Email templates** (`/admin/email/templates`)
  - Pre-built: showing confirmation, offer received, listing update, PM maintenance notice, welcome new client, CMA delivery, market report, renewal reminder
  - Variable system: `{first_name}`, `{property_address}`, `{showing_date}`, `{offer_price}`, etc.
  - Template editor with preview
- **Drip campaigns** (`/admin/email/campaigns`)
  - Create sequence: trigger + steps (each step = delay + email template)
  - Triggers: form_submission, stage_change (e.g., lead → qualified), manual enrollment, date-based, inactivity (no contact in X days)
  - Step editor: set delay (1 day, 3 days, 1 week, etc.), pick template, add conditions
  - Campaign dashboard: enrolled count, current step distribution, conversion rate
  - Pause/resume/stop controls
  - A/B testing: split test subject lines or content variations
- **Campaign analytics** (`/admin/email/analytics`)
  - Per-campaign: sent, delivered, opened, clicked, unsubscribed, bounced
  - Per-template: open rate, click rate across all campaigns
  - Time-series charts (Recharts)
- **AI email triage** (automatic on inbound)
  - Claude categorizes: type, priority, suggested action, draft reply
  - High-priority items surface to top of inbox with badge
  - "Auto-reply" toggle per category (e.g., auto-reply to showing requests with available times)
- **Compliance:** CAN-SPAM unsubscribe link in every outbound, opt-out tracking

### T3.2 — SMS Notifications (Twilio)
- **Notification triggers** (configurable per event type):
  - New property match (buyer)
  - Showing reminder (buyer, 1hr before)
  - New offer received (seller)
  - Maintenance update (PM client)
  - Market alert (investor)
  - Payment reminder (PM client)
  - Custom: admin sends one-off SMS to any contact
- **SMS templates** with variable injection (same system as email templates)
- **Opt-in/opt-out management:** contacts must consent to SMS, easy unsubscribe
- **Two-way SMS:** inbound texts auto-log to contact activity timeline
- **Click-to-text** from any contact card in CRM

### T3.3 — Push Notifications (PWA)
- Service worker handles push events
- In-app notification center: bell icon in header with unread badge
- Notification types: new_match, showing_reminder, offer_received, maintenance_update, message, ai_suggestion
- Click notification → deep link to relevant page
- User preferences: toggle each notification type on/off

### T3.4 — In-App Messaging
- **Activity feed** (`/admin/command` sidebar or dedicated page)
  - Real-time feed of all system activity
  - Filter by: my activities, team, specific contact, type
- **@mentions:** tag Starlene or Ashlyn in notes/comments → triggers notification
- **Internal notes on contacts:** team-only notes (not visible to clients)

### T3.5 — VoIP Click-to-Call (⚠️ Needs Twilio Voice API)
**Build the full UI regardless — mock if API not ready:**
- **Click-to-Call buttons** on every phone number in CRM, portal, everywhere
- **Softphone UI:** floating dialer panel
  - Dialing state, ringing, connected, on-hold
  - Mute, hold, end call buttons
  - Live transcription pane (scrolling text during call)
  - Timer showing call duration
  - Contact card sidebar (who you're talking to + their history)
- **Twilio Client SDK integration:**
  - Browser-based WebRTC calling via Twilio
  - Starlene's branded number as caller ID
  - Recording consent toggle (California two-party consent — MUST prompt before recording)
  - Inbound call routing to browser
- **Post-call pipeline:**
  1. Call ends → recording URL stored
  2. Twilio Real-Time Transcription delivers transcript
  3. Claude Sonnet processes transcript:
     - Full summary (2-3 sentences)
     - Speaker identification
     - Sentiment analysis (positive / neutral / hesitant / urgent)
     - Key phrases extracted ("VA loan", "fenced yard", "3 bedrooms")
     - Suggested next actions ("Schedule showing", "Send CMA", "Counter at $X")
  4. All stored in `calls` table, linked to contact
  5. Activity created on contact timeline
  6. If AI detects action items → auto-creates tasks
- **Voicemail transcription:** missed calls → voicemail recording → AI transcribes + summarizes
- **Call analytics** (`/admin/voip`)
  - Call volume by day/week/month
  - Average duration by contact type
  - Outcome tracking (connected, voicemail, missed)
  - Sentiment distribution across all calls

**Mock mode (until Twilio Voice active):**
- All UI renders normally
- Click-to-Call opens native phone dialer as fallback (`tel:` link)
- Manual call logging: "Log a Call" button → enter duration, notes → AI summarizes notes
- Banner: "VoIP coming soon — calls currently use your phone"

---

## Verification Checklist

- [ ] Inbound email → AI triages → correct category badge
- [ ] Compose email → template fills variables from contact → sends via Resend
- [ ] Drip campaign: enroll contact → delay fires → email sends on schedule
- [ ] Campaign analytics show real open/click data
- [ ] SMS: showing reminder fires 1hr before → contact receives text
- [ ] Two-way SMS: contact replies → logged to timeline
- [ ] Push notification fires on new match → clicking opens buyer portal
- [ ] In-app notification center shows unread count, marks as read
- [ ] VoIP UI renders (mock or live depending on Twilio status)
- [ ] Post-call AI summary generates with sentiment + key phrases + next actions
- [ ] Activity feed shows real-time updates across all channels
