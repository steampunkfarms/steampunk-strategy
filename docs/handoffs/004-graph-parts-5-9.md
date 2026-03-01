# Handoff: MS Graph Parts 5–9

> **Status:** Complete (2026-03-01)
> **Target repo:** steampunk-studiolo
> **Priority:** 🔴 High — mobile/field access critical for pasture work
> **Created:** 2026-03-01

---

## Problem

Fred and Krystal need donor context and Outlook tools accessible while working in the pasture — answering donor replies, scheduling follow-ups, and capturing relationship intelligence from the field without opening the full Studiolo CRM on mobile. Parts 1–4 of the Graph API integration are live (contact sync, email send/poll, friction detection). Parts 5–9 extend into letter generation polish, calendar/task sync, and AI-powered reply intelligence.

---

## What Already Exists

### Fully Built (Parts 1–4)
| Part | What | Key Files |
|------|------|-----------|
| 1 | Contact sync (Donor → Outlook Contacts) | `lib/graph-contact-sync.ts`, `app/api/graph/sync-contacts/` |
| 2 | Email send (compose → Graph API → Sent Items) | `lib/graph-client.ts`, `app/api/graph/send-mail/route.ts`, `app/api/graph/create-draft/route.ts` |
| 3 | Email poll (Sent Items → Touch records) | `lib/graph-email-poller.ts`, `app/api/graph/poll-emails/cron/route.ts` |
| 4 | Friction detection (bounces, lapsed replies) | `lib/graph-friction-scanner.ts`, `app/api/graph/friction-scan/cron/route.ts` |

### Partially Built (Part 5)
- `lib/graph-letter-generator.ts` — generates .docx via `docx` package, uploads to OneDrive
- `LetterDraft` Prisma model — tracks letter type, body, OneDrive URL, status
- `app/api/graph/letters/route.ts` — GET/POST endpoint for letter operations
- **Gap:** No USPS mailing integration, no address validation, no print queue UI

### Graph Client Config
- **Auth:** App-only daemon flow (`ClientSecretCredential`) — no user interaction needed
- **Mailbox:** `padrona@steampunkstudiolo.org` (shared mailbox)
- **Contacts folder:** `Donors`
- **OneDrive folder:** `DRM Letters/{year}/{letterType}/`
- **All cron routes accept both `CRON_SECRET` and `INTERNAL_SECRET`** (Orchestrator compatible)

### Donor Model Fields (relevant to Parts 8–9)
- `memoryCues` (String?) — freeform field for relationship intelligence
- Memory cue tag convention in voice engine: `[ANIMAL_BOND:...]`, `[SPECIES_AFFINITY:...]`, `[DESIGNATION_HINT:...]`, `[RELATIONSHIP:...]`
- Compose context already assembles `memoryCues` and passes to AI prompt layer
- `DonorInboxMessage` model — stores inbound emails matched to donors

---

## Part 5: Letter Generation Polish

### Current State
Letter generation works end-to-end: compose body → generate .docx → upload to OneDrive → save `LetterDraft` record. But it's a basic template with no address validation or print management.

### Scope
1. **Address validation** — before generating, check donor has street1 + city + state + zip. Return error with missing fields if incomplete. Add `addressVerified` Boolean to LetterDraft.
2. **Batch generation UI** — `/letters` page with filter (letter type, date range, status) and bulk generate button for thank-you letters on recent gifts
3. **Print queue view** — show all `generated` status letters with "Mark Printed" button → sets status to `printed`
4. **AI body generation** — option to use voice engine (compose/draft pattern) for letter body instead of static defaults. Pass donor context same as email compose.

### Files to Create/Modify
- `app/(protected)/letters/page.tsx` — NEW: letter management page
- `app/api/graph/letters/batch/route.ts` — NEW: batch generation endpoint
- `lib/graph-letter-generator.ts` — MODIFY: add address validation, AI body option
- Prisma migration: add `addressVerified Boolean @default(false)` to LetterDraft

---

## Part 6: Calendar Sync

### Scope
Sync stewardship dates from Studiolo → Outlook Calendar as appointments. One-way push: creating in Studiolo pushes to Outlook; won't read back from Outlook.

### Events to Sync
- **Touch follow-up dates** — when `Touch.followUpDate` is set, create calendar event
- **Gift anniversary reminders** — annual reminder for major donors (Opus lane)
- **Campaign milestones** — Giving Tuesday, year-end appeal deadlines
- **CSR deadlines** — from `CsrVerificationRequest.deadline`

### Implementation
1. **New lib:** `lib/graph-calendar-sync.ts`
   - `createCalendarEvent(mailbox, event)` — POST to `/users/{mailbox}/calendar/events`
   - `updateCalendarEvent(mailbox, eventId, event)` — PATCH
   - `deleteCalendarEvent(mailbox, eventId)` — DELETE
   - Event body includes link back to Studiolo donor page

2. **New model field:** Add to Touch:
   ```prisma
   calendarEventId  String?  @map("calendar_event_id")  // Graph event ID
   ```

3. **Hook into existing flows:**
   - `Touch.create` with `followUpDate` → auto-create calendar event
   - `Touch.update` changing followUpDate → update or create event
   - CSR deadline creation → auto-create event

4. **New API route:** `app/api/graph/calendar/route.ts` — manual push/pull for testing

5. **New cron (optional):** Weekly reconciliation scan — find Touches with followUpDate but no calendarEventId, create missing events

---

## Part 7: Task Sync

### Scope
Push stewardship action items from Studiolo → Outlook Tasks (To Do).

### Tasks to Sync
- **Unthanked gifts** — gifts where `thankYouSent = false` and age > 48 hours
- **Attention queue items** — `AttentionQueueItem` records (Opus donors flagged for personal attention)
- **Friction alerts** — unresolved `FrictionAlert` records with severity ≥ medium
- **Lapsed donor outreach** — donors with giving trend = "declining" and no Touch in 90 days

### Implementation
1. **New lib:** `lib/graph-task-sync.ts`
   - `createTask(mailbox, task)` — POST to `/users/{mailbox}/todo/lists/{listId}/tasks`
   - `completeTask(mailbox, listId, taskId)` — PATCH status to completed
   - First run: create a "Studiolo" task list via API, store list ID in AppSetting
   - Task body includes deep link to relevant Studiolo page

2. **New cron route:** `app/api/graph/task-sync/cron/route.ts`
   - Schedule: daily at 8 AM (before work starts)
   - Scans for new unthanked gifts, attention items, friction alerts
   - Creates tasks, stores Graph task ID on source record
   - Marks tasks complete when source record is resolved

3. **New fields:**
   ```prisma
   // On AttentionQueueItem:
   graphTaskId  String?  @map("graph_task_id")
   
   // On FrictionAlert:
   graphTaskId  String?  @map("graph_task_id")
   ```

4. **Register in Orchestrator:** Add to job registry as `graph-task-sync` under studiolo app

---

## Part 8: Cue Harvesting (Reply Intelligence)

### Scope
When donors reply to emails, extract relationship intelligence using Claude and store as `memoryCues` tags on the Donor record. This is the "affinity mapping" feature — turning reply content into compose-time context.

### How It Works
The email poller (`graph-email-poller.ts`) already captures inbound replies and creates `DonorInboxMessage` records linked to donors. Part 8 adds an AI analysis step after reply detection.

### Implementation
1. **New lib:** `lib/graph-cue-harvester.ts`
   - `harvestCues(donorId, messageContent, existingCues)` → returns new cue tags
   - Uses Claude API with focused extraction prompt:
     ```
     Extract relationship intelligence from this donor reply.
     Return ONLY structured tags in these formats:
     [ANIMAL_BOND:animal_name] — donor mentions specific animal by name
     [SPECIES_AFFINITY:species] — donor expresses interest in a species
     [DESIGNATION_HINT:intent] — donor hints at giving intent (e.g., "thinking about year-end")
     [RELATIONSHIP:context] — personal context (e.g., "has grandkids who love goats")
     [VISIT_INTEREST:details] — wants to visit the sanctuary
     [VOLUNTEER_INTEREST:details] — interested in volunteering
     [STORY_REQUEST:topic] — asks about specific animal or topic
     
     Return empty array if no actionable intelligence found.
     Do NOT fabricate. Only extract what's explicitly stated or clearly implied.
     ```
   - Merges new tags with existing `memoryCues` (dedup by tag type + value)
   - Returns both new tags and updated full cues string

2. **Integration point:** Hook into `pollInboxReplies()` in `graph-email-poller.ts`
   - After creating DonorInboxMessage, if donor matched, call `harvestCues()`
   - Update `Donor.memoryCues` with merged result
   - Log extraction in `GraphSyncLog` with operation = `cue-harvest`

3. **Manual trigger:** Add button on donor profile page to re-harvest cues from all their DonorInboxMessages

4. **Quality guard:** Log all extracted cues. Never overwrite existing manually-entered cues — append only. Prefix AI-extracted cues with `[AI:]` so Krystal can distinguish.

---

## Part 9: Reply Sentiment Analysis

### Scope
Score donor reply sentiment and surface mood trends on the stewardship dashboard. Feeds into pipeline lane decisions and touch frequency calibration.

### Implementation
1. **New fields on DonorInboxMessage:**
   ```prisma
   sentiment       String?   // "positive", "neutral", "negative", "mixed"
   sentimentScore  Float?    // -1.0 to 1.0
   sentimentNotes  String?   // Brief AI explanation
   ```

2. **Extend `harvestCues()` (or separate function):**
   - Same Claude call that does cue extraction also returns sentiment
   - Prompt addition:
     ```
     Also assess the overall sentiment of this reply:
     - sentiment: "positive" | "neutral" | "negative" | "mixed"
     - score: -1.0 (very negative) to 1.0 (very positive)
     - notes: One sentence explaining why (e.g., "Expressed gratitude for pig update, asked about visiting")
     ```

3. **Donor-level sentiment aggregation:**
   - New fields on Donor: `lastReplySentiment String?`, `avgReplySentiment Float?`
   - Updated after each reply analysis
   - Feeds into compose context so voice engine can calibrate tone

4. **Dashboard widget:** Add sentiment trend chart to `/command-center` or `/stewardship` page
   - Show donors with declining sentiment (potential churn signal)
   - Show donors with consistently positive sentiment (upgrade candidates)

---

## Database Changes (Single Migration)

```prisma
// LetterDraft additions
addressVerified  Boolean  @default(false) @map("address_verified")

// Touch additions  
calendarEventId  String?  @map("calendar_event_id")

// AttentionQueueItem additions
graphTaskId      String?  @map("graph_task_id")

// FrictionAlert additions
graphTaskId      String?  @map("graph_task_id")

// DonorInboxMessage additions
sentiment        String?
sentimentScore   Float?   @map("sentiment_score")
sentimentNotes   String?  @map("sentiment_notes")

// Donor additions
lastReplySentiment  String?  @map("last_reply_sentiment")
avgReplySentiment   Float?   @map("avg_reply_sentiment")
```

---

## New Files Summary

| File | Purpose |
|------|---------|
| `app/(protected)/letters/page.tsx` | Letter management + print queue UI |
| `app/api/graph/letters/batch/route.ts` | Batch letter generation |
| `app/api/graph/calendar/route.ts` | Manual calendar push endpoint |
| `app/api/graph/task-sync/cron/route.ts` | Daily task sync cron |
| `lib/graph-calendar-sync.ts` | Calendar CRUD via Graph API |
| `lib/graph-task-sync.ts` | Task list CRUD via Graph API |
| `lib/graph-cue-harvester.ts` | AI cue extraction from replies |

## Modified Files Summary

| File | Change |
|------|--------|
| `lib/graph-letter-generator.ts` | Address validation, AI body option |
| `lib/graph-email-poller.ts` | Hook cue harvester + sentiment after reply detection |
| `prisma/schema.prisma` | 8 new fields across 5 models |
| `app/(protected)/donors/[id]/page.tsx` | Re-harvest cues button, sentiment display |
| `app/(protected)/command-center/page.tsx` | Sentiment trend widget |

---

## Execution Order

Recommended build sequence (each part is independently deployable):

1. **Part 8 + 9 first** (highest value, no new UI pages needed) — cue harvesting and sentiment analysis on existing reply data. Immediate intelligence gain.
2. **Part 7** (task sync) — daily actionable items in Outlook. Register new cron in Orchestrator.
3. **Part 6** (calendar sync) — follow-up date reminders in Outlook.
4. **Part 5** (letter polish) — batch generation UI and address validation.

---

## Pre-Merge Checklist
1. `npx tsc --noEmit` — no type errors
2. `npx prisma generate` — schema compiles
3. `npx next build` — build succeeds
4. Test Graph API calls against real mailbox (calendar, tasks)
5. Test cue harvester with a sample reply email
6. Verify new cron route accepts both `CRON_SECRET` and `INTERNAL_SECRET`
7. Register task-sync cron in Orchestrator job registry

## Acceptance Criteria
- [x] Letter generation validates addresses before generating
- [x] Calendar events created for Touches with followUpDate
- [x] Task list created in Outlook with Studiolo action items
- [x] Reply cues extracted and appended to Donor.memoryCues with `[AI:]` prefix
- [x] Sentiment scored on DonorInboxMessage records
- [x] All new cron routes use dual-token auth pattern
- [ ] New cron registered in Orchestrator (deferred — Orchestrator not yet operational)

## Implementation Notes
- Parts 8+9 combined into a single Claude call (`graph-cue-harvester.ts`) that returns both cue tags and sentiment in one response. Uses `claude-haiku-4-5-20251001` for cost efficiency.
- Cue harvester hooked into `pollInboxReplies()` — creates `DonorInboxMessage` records for Graph inbox replies (using `gmailMessageId` field for the Graph message ID) to enable sentiment storage.
- `mergeCues()` utility deduplicates by tag type + value (case-insensitive) before appending.
- Part 7 task sync creates a "Studiolo" task list in Outlook To Do on first run, caches list ID in `AppSetting`.
- Part 5 letter generator dynamically imports Anthropic SDK for AI body generation (avoids top-level import in a module that's also used without AI).
- Sentiment trend widget on command center/stewardship page deferred — sentiment is displayed on individual donor profiles instead.
- All 8 new schema fields pushed to Neon via `prisma db push` (no migration files, same as existing pattern).

## Cross-Site Implications
- None — all changes are Studiolo-only
- Graph API calls go to Microsoft 365, no other Steampunk sites affected
- Cue harvester uses Anthropic API (same key as existing compose routes)

## Deferred
- Two-way calendar sync (reading Outlook events back into Studiolo)
- Task completion webhook (marking Studiolo records done when Outlook task completed)
- Bulk cue re-harvest across all historical DonorInboxMessages
- Sentiment alerting (auto-flag donors with negative trend)
- Sentiment trend dashboard widget (command center / stewardship page)
- Register task-sync cron in Orchestrator (Orchestrator not yet operational)
