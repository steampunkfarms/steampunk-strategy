# Working Spec: Orchestrator Outbound Monitoring Pages

**Handoff ID:** 20260320-orchestrator-outbound-monitoring
**Date:** 2026-03-20
**Tier:** 2 (Standard — cross-repo feature)
**Repos:** steampunk-orchestrator, steampunk-postmaster, steampunk-studiolo, ft3-tronboll, stoic-preparedness
**Status:** COMPLETE — All 4 phases done 2026-03-20

---

## Problem Statement

Two categories of "approved and heading out" content flow through the Orchestrator's cron system with zero visibility:

1. **Email outbound** — Studiolo Scriptorium dispatches (jitter-queued DispatchSend records), Rescue Barn newsletters (dispatched from Postmaster → Rescue Barn issues API), and Studiolo Bulk Compose campaigns. Once approved and queued, these are invisible until they land in inboxes.

2. **Social outbound** — Postmaster Content Storm items (ScheduleItem records the `postmaster/post-scheduled` cron picks up every 5 min), PlatformComment records (first-comments and delayed comments), and TFOS publish queues on FT3 and Stoic.

The Orchestrator `/dashboard` solved "I can't see what's failing" for cron jobs. These two new pages solve "I can't see what's leaving" for emails and social content. The dashboard case study (see debrief: Orchestrator Dashboard Troubleshooting) proved that surfacing hidden state — like the 50-row execution log window that masked low-frequency jobs — directly enables rapid remediation. Same principle applies here.

---

## Architecture Pattern

Both pages follow the exact pattern established by the `/dashboard` Command Deck:

- **Server component** (`page.tsx`) fetches data via Prisma + cross-app proxy, passes to client component
- **Proxy API route** — all cross-app calls route through `POST /api/dashboard/action` with `INTERNAL_SECRET` auth, no secrets leaked to browser
- **SFOS / TFOS tab segregation** — matches the `activeTab` state and `SFOS_APPS` / `TFOS_APPS` sets already in `command-deck.tsx`
- **Per-item drill-down** — same expandable pattern as JobPanel and the execution log table
- **Error detail rendering** — red-tinted expandable rows with HTTP status, error body, timestamp (same as dashboard)

---

## Page 1: `/outbound-queue` — Email Outbound Monitor

### Route Structure

```
src/app/outbound-queue/page.tsx          — server component (data fetch)
src/components/outbound-queue-deck.tsx   — client component (interactive UI)
```

### Tabs

| Tab | Contents |
|-----|----------|
| **SFOS** | Studiolo Scriptorium dispatches, Rescue Barn newsletters, Bulk Compose campaigns |
| **TFOS** | Placeholder — "No email outbound configured for TFOS sites" (future: FT3/Stoic/Discreet email queues) |

### Data Sources (SFOS tab)

| Source | What it shows | Origin app | Prisma model | Status values to surface |
|--------|--------------|------------|-------------|------------------------|
| Scriptorium Dispatches | Jitter-queued donor emails | steampunk-studiolo | `Dispatch` + `DispatchSend` | `SCHEDULED`, `SENDING` (in-flight), `PAUSED` |
| Bulk Compose | Campaign-based batch emails | steampunk-studiolo | `BulkComposeCampaign` + `BulkComposeMessage` | Campaigns where `sentCount < totalMessages`, messages with status `APPROVED`/`PENDING` |
| Newsletters | Dispatched-but-not-sent newsletters | steampunk-postmaster (proxy to Rescue Barn) | `NewsletterDraft` (Postmaster) / Rescue Barn issues API | `dispatched` (waiting for subscriber send) |

### UI Sections

#### 1. Summary Banner
- Total items in queue across all three sources
- Next scheduled departure time
- Any paused items (amber warning badge)
- Sends completed today / failure rate (last 24h)

#### 2. Scriptorium Dispatches Section
Card per dispatch showing:
- **Header:** Title, dispatch type, lane badge (Atelier / Opus / Both), subject line
- **Metrics:** Recipient count (total / sent / remaining / failed)
- **Stagger info:** Mode + jitter window (e.g., "Jitter 24h — 412 remaining over ~18h")
- **Progress bar:** sent vs total, color-coded (green/amber/red)
- **Expandable detail:** List of individual `DispatchSend` records — donor name, email, scheduled time, status
- **Actions:**
  - ⏸ **Pause** — sets dispatch status to `PAUSED`, cron skips all child sends
  - ▶ **Resume** — sets back to `SENDING`
- **Timestamps:** Last send time, estimated completion

#### 3. Bulk Compose Campaigns Section
Card per active campaign showing:
- **Header:** Campaign name, touch type, subject template
- **Progress:** `sentCount / totalMessages` with progress bar
- **Config:** Interval minutes, jitter enabled/disabled
- **Expandable detail:** Individual messages — donor name, scheduled send time, approval status, edited flag (`wasEdited`)
- **Actions:**
  - ⏸ **Pause** (sets `pausedAt` on campaign)
  - ▶ **Resume** (clears `pausedAt`)

#### 4. Newsletter Queue Section
Card per pending newsletter showing:
- **Header:** Subject, cadence badge (weekly / monthly / seasonal), `scheduledFor` time
- **Content:** Animals featured, preview snippet (first 200 chars of plainText)
- **Status badge:** dispatched → waiting for Rescue Barn send cron
- **Link:** → Postmaster `/newsletter` page for full editing
- No pause action here (pause at Rescue Barn level)

#### 5. Analytics Sidebar (collapsible)
- Sends completed today / this week
- Average send rate (emails/hour)
- Failure rate (last 24h)
- Top error messages (grouped, with count)
- Link to related cron jobs on `/dashboard`

---

## Page 2: `/social-outbound` — Social Content Storm Monitor

### Route Structure

```
src/app/social-outbound/page.tsx          — server component (data fetch)
src/components/social-outbound-deck.tsx   — client component (interactive UI)
```

### Tabs

| Tab | Contents |
|-----|----------|
| **SFOS** | Postmaster Content Storm items (FB, IG, X, Patreon, Cogworks, etc.) |
| **TFOS** | FT3 scheduled posts (`ft3/publish` cron), Stoic scheduled dispatches (`stoic/publish` cron) |

### Data Sources (SFOS tab)

| Source | What it shows | Prisma model (Postmaster) | Status values |
|--------|--------------|--------------------------|---------------|
| Storm ScheduleItems | Approved social posts queued for dispatch | `ScheduleItem` | `APPROVED`, `QUEUED` |
| Platform Comments | First-comments and delayed comments | `PlatformComment` | `PENDING`, `SCHEDULED` |
| Renditions | Platform-specific content ready to post | `Rendition` | `SCHEDULED` |

### Data Sources (TFOS tab)

| Source | What it shows | App |
|--------|--------------|-----|
| FT3 scheduled posts | Blog posts + social queued for `ft3/publish` and `ft3/social` crons | ft3-tronboll |
| Stoic dispatches | Daily dispatches queued for `stoic/publish` and `stoic/social` crons | stoic-preparedness |

### UI Sections

#### 1. Summary Banner
- Total items queued across all sources
- Platform breakdown badges (e.g., "FB: 4 · IG: 4 · X: 3 · Patreon: 1 · Cogworks: 2")
- Next departure time
- Any paused or held items (amber warning)

#### 2. Timeline View (primary view)
Chronological list of upcoming posts, grouped by hour/day:
- **Card per item:** Series name, platform badge(s), scheduled time, content preview (first 150 chars), media thumbnail if `mediaUrls[0]` exists
- **Expandable detail:** Full rendition content, hashtags, media URLs with alt text, link URL, platform-specific metadata (e.g., Cogworks title/excerpt/speciesGroups)
- **Actions:**
  - ⏸ **Pause** — sets ScheduleItem status to `PAUSED` (new status value, or use `CANCELLED` if adding a new enum is deferred)
  - ⏱ **Hold** — delays by N hours (shifts `scheduledFor` forward)
- **Visual:** Series color coding consistent with Postmaster review queue

#### 3. Platform Comments Queue
Separate subsection for first-comments and delayed comments:
- Parent post reference (rendition ID + platform + content snippet)
- Comment text, scheduled time, delay days
- Status badge (PENDING / SCHEDULED / POSTING)

#### 4. Storm Overview (secondary view, toggle)
Grouped by storm (PostmasterInput):
- Input title, series badge, total renditions, posted vs queued count
- Completion percentage bar
- Link → Postmaster Review Queue for full storm editing

#### 5. Analytics Sidebar (collapsible)
- Posts dispatched today / this week, by platform
- Failed posts (last 48h) with expandable error details
- Platform health — connector status from Postmaster `Connector` model (CONNECTED / ERROR / PAUSED)
- Link to related cron jobs (`postmaster/post-scheduled`, `postmaster/scan-engagement`) on `/dashboard`

---

## New Action Cases — `/api/dashboard/action/route.ts`

All cross-app calls proxy through the existing dashboard action route. Add these cases:

```typescript
// ── Email Outbound ───────────────────────────────────────────────
case 'email-outbound': {
  // GET Studiolo dispatches with status SCHEDULED or SENDING
  const studioloUrl = process.env.STUDIOLO_URL ?? 'https://www.steampunkstudiolo.org';
  const res = await fetch(
    `${studioloUrl}/api/scriptorium/dispatches/outbound-summary`,
    { headers }
  );
  result = await res.json();
  break;
}

case 'email-outbound-detail': {
  // GET single dispatch with all sends
  if (!data?.dispatchId) return error('data.dispatchId required');
  const studioloUrl = process.env.STUDIOLO_URL ?? 'https://www.steampunkstudiolo.org';
  const res = await fetch(
    `${studioloUrl}/api/scriptorium/dispatches?id=${data.dispatchId}`,
    { headers }
  );
  result = await res.json();
  break;
}

case 'email-outbound-pause': {
  // PATCH dispatch status to PAUSED
  if (!data?.dispatchId) return error('data.dispatchId required');
  const studioloUrl = process.env.STUDIOLO_URL ?? 'https://www.steampunkstudiolo.org';
  const res = await fetch(
    `${studioloUrl}/api/scriptorium/dispatches`,
    { method: 'PATCH', headers, body: JSON.stringify({ id: data.dispatchId, status: 'PAUSED' }) }
  );
  result = await res.json();
  break;
}

case 'email-outbound-resume': {
  // PATCH dispatch status back to SENDING
  if (!data?.dispatchId) return error('data.dispatchId required');
  const studioloUrl = process.env.STUDIOLO_URL ?? 'https://www.steampunkstudiolo.org';
  const res = await fetch(
    `${studioloUrl}/api/scriptorium/dispatches`,
    { method: 'PATCH', headers, body: JSON.stringify({ id: data.dispatchId, status: 'SENDING' }) }
  );
  result = await res.json();
  break;
}

case 'bulk-compose-outbound': {
  // GET active bulk compose campaigns from Studiolo
  const studioloUrl = process.env.STUDIOLO_URL ?? 'https://www.steampunkstudiolo.org';
  const res = await fetch(
    `${studioloUrl}/api/bulk-compose/outbound-summary`,
    { headers }
  );
  result = await res.json();
  break;
}

case 'newsletter-outbound': {
  // GET pending newsletters (existing Postmaster endpoint)
  const postmasterUrl = process.env.POSTMASTER_URL ?? 'https://postmaster.steampunkstudiolo.org';
  const res = await fetch(
    `${postmasterUrl}/api/newsletter/outbound`,
    { headers }
  );
  result = await res.json();
  break;
}

// ── Social Outbound ──────────────────────────────────────────────
case 'social-outbound': {
  // GET queued social items from Postmaster
  const postmasterUrl = process.env.POSTMASTER_URL ?? 'https://postmaster.steampunkstudiolo.org';
  const res = await fetch(
    `${postmasterUrl}/api/outbound/social`,
    { headers }
  );
  result = await res.json();
  break;
}

case 'social-outbound-pause': {
  // Pause or hold a social schedule item
  if (!data?.scheduleItemId || !data?.action) return error('scheduleItemId and action required');
  const postmasterUrl = process.env.POSTMASTER_URL ?? 'https://postmaster.steampunkstudiolo.org';
  const res = await fetch(
    `${postmasterUrl}/api/outbound/social/pause`,
    { method: 'PATCH', headers, body: JSON.stringify(data) }
  );
  result = await res.json();
  break;
}

case 'social-comments-outbound': {
  // GET pending platform comments
  const postmasterUrl = process.env.POSTMASTER_URL ?? 'https://postmaster.steampunkstudiolo.org';
  const res = await fetch(
    `${postmasterUrl}/api/outbound/comments`,
    { headers }
  );
  result = await res.json();
  break;
}

case 'tfos-social-outbound': {
  // GET queued posts from FT3 and Stoic
  const ft3Url = process.env.FT3_URL?.trim() ?? 'https://ft3.tronboll.us';
  const stoicUrl = process.env.STOIC_URL?.trim() ?? 'https://stoic.tronboll.us';
  const [ft3Res, stoicRes] = await Promise.all([
    fetch(`${ft3Url}/api/outbound/queue`, { headers }).catch(() => null),
    fetch(`${stoicUrl}/api/outbound/queue`, { headers }).catch(() => null),
  ]);
  result = {
    ft3: ft3Res ? await ft3Res.json() : { error: 'unreachable' },
    stoic: stoicRes ? await stoicRes.json() : { error: 'unreachable' },
  };
  break;
}
```

---

## New API Endpoints on Downstream Apps

### steampunk-postmaster (3 new routes)

**`GET /api/outbound/social`**
Returns ScheduleItem records where status is `APPROVED` or `QUEUED`, joined with Rendition → Fragment → PostmasterInput for content preview. Response shape:
```json
{
  "items": [
    {
      "id": "scheduleItem.id",
      "scheduledFor": "ISO datetime",
      "status": "QUEUED",
      "platform": "FACEBOOK",
      "series": "DEAR_HUMANS",
      "inputTitle": "PostmasterInput.title",
      "contentPreview": "first 200 chars of rendition.content",
      "hashtags": ["#rescue"],
      "mediaUrl": "rendition.mediaUrls[0]",
      "mediaAltText": "rendition.mediaAltText",
      "renditionId": "rendition.id",
      "fragmentRole": "ANCHOR",
      "variantLabel": "A"
    }
  ],
  "summary": {
    "total": 14,
    "byPlatform": { "FACEBOOK": 4, "INSTAGRAM": 4, "X": 3, "PATREON": 1, "COGWORKS": 2 },
    "nextDeparture": "ISO datetime"
  }
}
```

**`PATCH /api/outbound/social/pause`**
Body: `{ scheduleItemId, action: 'pause' | 'resume' | 'delay', delayHours? }`
- `pause` → sets ScheduleItem.status to `CANCELLED` (or new `PAUSED` enum if added)
- `resume` → sets back to `QUEUED`
- `delay` → shifts `scheduledFor` forward by `delayHours`

**`GET /api/outbound/comments`**
Returns PlatformComment records with status `PENDING` or `SCHEDULED`, joined with parent Rendition for context.

### steampunk-studiolo (2 new routes)

**`GET /api/scriptorium/dispatches/outbound-summary`**
Aggregated view of in-flight dispatches. Returns:
```json
{
  "dispatches": [
    {
      "id": "dispatch.id",
      "title": "...",
      "dispatchType": "NOTIZIARIO",
      "lane": "BOTH",
      "subjectLine": "...",
      "status": "SENDING",
      "recipientCount": 614,
      "sentCount": 202,
      "failedCount": 3,
      "staggerMode": "jitter-24h",
      "jitterWindowHours": 24,
      "scheduledFor": "ISO",
      "createdAt": "ISO"
    }
  ],
  "bulkCampaigns": [
    {
      "id": "campaign.id",
      "name": "...",
      "status": "ACTIVE",
      "totalMessages": 150,
      "sentCount": 42,
      "failedCount": 0,
      "pausedAt": null,
      "intervalMinutes": 2
    }
  ],
  "stats": {
    "totalQueued": 562,
    "sentToday": 145,
    "failedToday": 3,
    "estimatedCompletion": "ISO"
  }
}
```

**`GET /api/bulk-compose/outbound-summary`**
Active bulk compose campaigns with message-level counts. (Could be folded into the above endpoint.)

### ft3-tronboll + stoic-preparedness (1 new route each)

**`GET /api/outbound/queue`**
Returns scheduled-but-not-yet-published posts. Shape varies per app but should include:
```json
{
  "items": [
    {
      "id": "post.id",
      "title": "...",
      "type": "blog_post | dispatch | social",
      "scheduledFor": "ISO",
      "status": "scheduled",
      "contentPreview": "first 200 chars"
    }
  ],
  "summary": { "total": 5, "nextDeparture": "ISO" }
}
```

---

## Pause / Hold Mechanics

### Scriptorium jitter emails
The drip-send cron queries `DispatchSend WHERE status = 'QUEUED' AND scheduledAt <= NOW()`. To support pause:
- Add check: skip sends whose parent `Dispatch.status === 'PAUSED'`
- The existing PATCH on `/api/scriptorium/dispatches` already handles status updates — just needs to accept `PAUSED` as a valid value
- Resume = set back to `SENDING`

### Bulk Compose campaigns
Already has `pausedAt` field. The send cron should skip campaigns where `pausedAt IS NOT NULL`. Resume = clear `pausedAt`.

### Postmaster social
The `postmaster/post-scheduled` cron queries `ScheduleItem WHERE status = 'QUEUED' AND scheduledFor <= NOW()`. Pause options:
- **Per-item pause:** Set item status to `CANCELLED` (existing enum) or add `PAUSED` to `PostStatus` enum
- **Hold (delay):** Shift `scheduledFor` forward by N hours
- Resume = set status back to `QUEUED`

### Newsletters
Newsletter send is controlled at the Rescue Barn level. No pause mechanism needed on this page — link to Postmaster newsletter page for full control.

---

## Troubleshooting Features

Following the dashboard pattern that proved its value in the troubleshooting debrief:

1. **Error details on failed items** — Same expandable red-tinted row pattern. Show HTTP status, error message, timestamp, retry count.

2. **Per-item execution context** — For emails: Graph API response. For social: platform API response (already captured in `ScheduleItem.error`, `Rendition.error`, `PlatformComment.error`).

3. **Copy-to-clipboard for CC remediation** — Button that copies item ID, error message, timestamps, related job name, and source app into a markdown block ready to paste into a Claude Code session.

4. **Link to related cron job** — Each queue section shows which Orchestrator cron is responsible (e.g., "Dispatched by `postmaster/post-scheduled`") with a clickable link that opens the JobPanel on `/dashboard`.

---

## Files to Create / Modify

### steampunk-orchestrator
| File | Action | Description |
|------|--------|-------------|
| `src/app/outbound-queue/page.tsx` | CREATE | Server component — fetches email outbound data |
| `src/components/outbound-queue-deck.tsx` | CREATE | Client component — interactive email queue UI |
| `src/app/social-outbound/page.tsx` | CREATE | Server component — fetches social outbound data |
| `src/components/social-outbound-deck.tsx` | CREATE | Client component — interactive social queue UI |
| `src/app/api/dashboard/action/route.ts` | MODIFY | Add ~12 new action cases for outbound proxying |
| `src/app/layout.tsx` | MODIFY | Add nav links for new pages (if nav exists) |

### steampunk-postmaster
| File | Action | Description |
|------|--------|-------------|
| `app/api/outbound/social/route.ts` | CREATE | GET queued ScheduleItems with content joins |
| `app/api/outbound/social/pause/route.ts` | CREATE | PATCH pause/resume/delay for ScheduleItems |
| `app/api/outbound/comments/route.ts` | CREATE | GET pending PlatformComment records |

### steampunk-studiolo
| File | Action | Description |
|------|--------|-------------|
| `app/api/scriptorium/dispatches/outbound-summary/route.ts` | CREATE | Aggregated outbound stats endpoint |
| `app/api/bulk-compose/outbound-summary/route.ts` | CREATE | Active bulk campaign stats |
| Drip-send cron (locate exact file) | MODIFY | Add PAUSED dispatch check |

### ft3-tronboll (deferred — Phase 2)
| File | Action | Description |
|------|--------|-------------|
| `api/outbound/queue/route.ts` | CREATE | GET scheduled posts for TFOS tab |

### stoic-preparedness (deferred — Phase 2)
| File | Action | Description |
|------|--------|-------------|
| `api/outbound/queue/route.ts` | CREATE | GET scheduled dispatches for TFOS tab |

---

## Implementation Order

Designed for session resilience — each phase produces working files and a checkpoint.

### Phase 1: Plumbing (no UI)
1. Create Postmaster social outbound API (`/api/outbound/social`, `/api/outbound/social/pause`, `/api/outbound/comments`)
2. Create Studiolo outbound summary API (`/api/scriptorium/dispatches/outbound-summary`, `/api/bulk-compose/outbound-summary`)
3. Add all new action cases to Orchestrator `/api/dashboard/action/route.ts`
4. **Checkpoint after Phase 1**

### Phase 2: Email Outbound Page
5. Create `src/app/outbound-queue/page.tsx` (server component)
6. Create `src/components/outbound-queue-deck.tsx` (client component with all sections)
7. Add nav link
8. **Checkpoint after Phase 2**

### Phase 3: Social Outbound Page
9. Create `src/app/social-outbound/page.tsx` (server component)
10. Create `src/components/social-outbound-deck.tsx` (client component with all sections)
11. Add nav link
12. **Checkpoint after Phase 3**

### Phase 4: Pause Mechanics + TFOS
13. Modify Studiolo drip-send cron to respect PAUSED status
14. Modify Postmaster post-scheduled cron if PAUSED enum is added
15. Create FT3 + Stoic `/api/outbound/queue` endpoints
16. Wire TFOS tabs with live data
17. **Checkpoint after Phase 4**

---

## Reference: Existing Patterns to Follow

- **Dashboard server component:** `steampunk-orchestrator/src/app/dashboard/page.tsx`
- **CommandDeck client component:** `steampunk-orchestrator/src/components/command-deck.tsx`
- **Action proxy route:** `steampunk-orchestrator/src/app/api/dashboard/action/route.ts`
- **JobPanel drill-down:** `steampunk-orchestrator/src/components/job-panel.tsx`
- **SFOS/TFOS tab pattern:** `SFOS_APPS` and `TFOS_APPS` sets + `activeTab` state in command-deck.tsx
- **Newsletter outbound proxy:** `steampunk-postmaster/app/api/newsletter/outbound/route.ts` (existing)
- **Scriptorium dispatch API:** `steampunk-studiolo/app/api/scriptorium/dispatches/route.ts` (existing GET/POST/PATCH/DELETE)
- **Postmaster post-scheduled cron:** `steampunk-postmaster/app/api/cron/post-scheduled/route.ts`

---

## Acceptance Criteria

- [ ] `/outbound-queue` page loads with SFOS tab showing Scriptorium dispatches, Bulk Compose campaigns, and newsletter queue
- [ ] `/social-outbound` page loads with SFOS tab showing Content Storm timeline and platform comments queue
- [ ] Both pages have SFOS / TFOS tab toggle matching dashboard pattern
- [ ] Pause/resume works for Scriptorium dispatches and Bulk Compose campaigns
- [ ] Pause/hold/delay works for Postmaster ScheduleItems
- [ ] Error details are expandable with red-tinted rows (matching dashboard pattern)
- [ ] Copy-to-clipboard produces markdown context for Claude Code remediation
- [ ] Links to related cron jobs on `/dashboard` work correctly
- [ ] `npx tsc --noEmit` clean on all modified repos
- [ ] No secrets exposed to browser — all cross-app calls proxy through action route
