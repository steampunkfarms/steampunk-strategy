# Working Spec: Resident-Sourced Content Storms

**Handoff ID:** 20260320-resident-sourced-storms
**Date:** 2026-03-20
**Tier:** 2 (Standard — single-repo feature with light touches to inputs pipeline)
**Repo:** steampunk-postmaster
**Status:** READY FOR IMPLEMENTATION

---

## Problem Statement

Content storms currently start from a blank `/inputs/new` wizard where the operator pastes anchor text manually. There's no way to start a storm *from* a specific animal resident — pulling their bio, personality, chronicle entries, images, and voice config as the foundation. The provenance chain is broken: you can't trace a published Facebook post back to the resident record it was about, and you can't look at a resident's profile and see what content has been created about them.

This creates three friction points:
1. **Copy-paste tax** — operator manually gathers info from the resident catalog, chronicle entries, and voice configs, then pastes it into the input form
2. **No provenance** — once a storm is created, there's no link back to which resident sourced it
3. **No reverse view** — looking at Mabel's record, you can't see the 14 storms that have featured her

---

## What Exists Today

| Component | Current State |
|-----------|--------------|
| Resident data | Rich `AnimalResident` model: name, species, breed, personality, howTheyGotHere, lifeBefore, attributes, healthNotes, publicBio, ambassadorFor, ambassadorProducts, images, chronicle entries, voice configs, medical records, barn area |
| Resident catalog page | `/maintenance/residents` — list page with `ResidentCard` components, expand/collapse, chronicle inline entry, image gallery. No `[id]` detail route. |
| Resident API | `GET /api/residents` (list), `POST /api/residents` (create), `GET/api/residents/[id]/chronicle`, `GET /api/residents/[id]/images`, `POST /api/residents/generate-bio` |
| Content storm wizard | `/inputs/new` — multi-step form. Already accepts `?series=X&campaignId=Y` via searchParams. Steps: series selection → anchor text → platform config → scheduling → submit |
| Input creation API | `POST /api/inputs` — accepts series, anchorText, theme, meta (JSON), stormConfig, plus series-specific fields |
| Resident context builder | `lib/residentContext.ts` — builds AI context strings for *all* residents at once (used by generation prompts). No single-resident version. |
| Resident image selector | `lib/resident-image-selector.ts` — weighted scoring for Storm image variety. Already selects per-resident. |
| Voice configs | `VoiceConfig` model linked to residents via `residentId`. Used by generation endpoints for character voice. |
| `PostmasterInput.meta` | JSON field already used for series-specific metadata (songs, grammatical marks, wishlist items, etc.) |

---

## Architecture

### The Flow

```
/residents/[id]                    ← NEW: Resident profile page
    ↓ "Start Content Storm"
/residents/[id]/compose            ← NEW: Story Seed page
    ↓ submits with residentId + storyContext + AI anchor
/inputs/new?residentId=X&...      ← EXISTING: wizard, now pre-seeded
    ↓ creates PostmasterInput with meta.sourceResident
Fragments → Renditions → Platforms ← EXISTING: generation + dispatch pipeline
    ↑ provenance traceable back to resident
/residents/[id]                    ← NEW: "Content History" section shows all storms for this resident
```

### Provenance Schema

The `PostmasterInput.meta` JSON field gains a standardized `sourceResident` shape:

```typescript
meta: {
  // ...existing series-specific fields (songs, grammaticalMark, items, etc.)
  sourceResident?: {
    id: string;
    name: string;
    species: string;
    barnArea: string | null;
  };
  storyContext?: string;            // operator's new context from compose step
  chronicleEntriesUsed?: string[];  // IDs of chronicle entries referenced in compose
}
```

This makes provenance queryable: any page showing a storm can check `meta.sourceResident.id` and link back to the resident profile.

---

## Phase 1: Resident Profile Page + Single-Resident API

### New route: `GET /api/residents/[id]/route.ts`

Returns a single resident with full relations. Currently only chronicle and images have dedicated sub-routes; the main `[id]` route doesn't exist.

```typescript
// Response shape
{
  id: string;
  name: string;
  species: string;
  breed: string | null;
  arrivalDate: string | null;
  approximateAge: string | null;
  howTheyGotHere: string | null;
  lifeBefore: string | null;
  attributes: string | null;
  personality: string | null;
  publicBio: string | null;
  healthNotes: string | null;
  ambassadorFor: string[];
  ambassadorProducts: { name: string; url: string; imageUrl?: string }[] | null;
  imageUrl: string | null;
  status: ResidentStatus;
  residentType: ResidentType;
  barnArea: BarnArea | null;
  currentInfo: string | null;
  passedAwayDate: string | null;
  memorialNote: string | null;
  images: ResidentImage[];          // all images with tags, season, usage stats
  chronicleEntries: ChronicleEntry[]; // last 20, newest first
  voiceConfigs: VoiceConfig[];      // linked voice definitions
  medicalRecords: MedicalRecord[];  // last 5, newest first (summary only)
  _stormCount: number;              // count of PostmasterInput where meta contains this resident ID
}
```

Include the `_stormCount` as a computed field by querying PostmasterInput where `meta::jsonb @> '{"sourceResident":{"id":"<residentId>"}}'` (Postgres JSON containment) or by doing a filter in JS if the volume is manageable.

### New route: `GET /api/residents/[id]/storms/route.ts`

Returns storms (PostmasterInput records) that feature this resident. Two query strategies:
1. `meta` JSON contains `sourceResident.id === residentId` (storms started from this resident's compose flow)
2. Input title or anchorText contains the resident's name (fuzzy catch for storms created before this feature)

```typescript
// Response shape
{
  storms: {
    id: string;
    series: string;
    title: string | null;
    status: InputStatus;
    createdAt: string;
    scheduledFor: string | null;
    storyContext: string | null;  // from meta.storyContext
    _fragmentCount: number;
    _renditionCount: number;
    _postedCount: number;
  }[];
}
```

### New page: `app/(protected)/residents/[id]/page.tsx`

The resident profile detail page. Sections:

**Header area:**
- Resident name (large), species/breed, barn area badge, status badge, resident type badge (Ambassador/General)
- Primary image (from `ResidentImage` where `isPrimary = true`, or first image, or `imageUrl` fallback)
- **"Start Content Storm" button** — prominent, routes to `/residents/[id]/compose`
- Edit button → opens edit flow (can reuse patterns from maintenance page)

**Bio & Personality section:**
- publicBio (or currentInfo for General residents)
- Personality, attributes
- How they got here / life before (collapsible)
- Health notes (collapsible, muted styling)

**Ambassador section** (only if `residentType === 'AMBASSADOR'`):
- Ambassador products grid (name, image, link)
- Ambassador wish lists (`ambassadorFor` array)
- Voice config cards (character name, title, voice prompt preview)

**Chronicle Timeline:**
- Chronological list of chronicle entries (from API, last 20)
- Each shows date, text, tags
- Quick-add chronicle entry form inline (reuse existing chronicle pattern from maintenance page)

**Image Gallery:**
- Existing `ResidentImageGallery` component (already built)

**Content History section:**
- List of storms from `/api/residents/[id]/storms`
- Each shows series badge, title, status badge, date, fragment/rendition/posted counts
- Click → navigates to `/inputs/[id]` (existing input detail page)
- If no storms: "No content storms yet — start one above"

**Medical Summary** (collapsible):
- Last 5 records, date + title + record type
- Not editable from here — link to `/maintenance/vet-records` if needed

### New lib function: `lib/residentContext.ts` addition

Add `getSingleResidentContext(residentId: string): Promise<string>` alongside existing `getAnimalContext()`.

This builds a focused context string for one resident:
- Full bio, personality, attributes, species, breed, barn area
- How they got here / life before
- Health notes (factual only)
- Last 10 chronicle entries (dated)
- Ambassador products if applicable
- Voice config prompt if one exists for this resident
- Memorial note if Spirit Guardian

This is what the compose step uses to build the AI anchor text — much more focused than the "all 40+ residents" context string.

### Modify: `/maintenance/residents/page.tsx`

Add a ⚡ icon button on each `ResidentCard` that links to `/residents/[id]`. This serves as both "view profile" and the quickest path to starting a storm.

Since the existing page uses expand/collapse for detail, the ⚡ button represents "open full profile in its own page."

---

## Phase 2: Compose Flow (Story Seed)

### New page: `app/(protected)/residents/[id]/compose/page.tsx`

The intermediary between the resident profile and the Create Input wizard.

**Layout:**

Left column (60%): **Story builder**
- Resident summary card at top (name, species, primary image, status — read-only context)
- **"What's the story?"** rich text area (TipTap editor, reuse existing `RichTextEditor` component) — operator writes the new context that makes this storm timely: "Mabel's joints are better," "Harold gave a lecture to the newcomers," etc.
- Below the text area: collapsible **"Resident context"** showing the auto-pulled bio, personality, recent chronicles — so you can see what the AI already knows without it cluttering the compose area
- **Optional: Tag other residents** — multi-select of other residents to include in this storm (for multi-animal stories). These get added to `meta.chronicleEntriesUsed` and enriched context.

Right column (40%): **Storm configuration**
- **Series selector** — filtered to series that make sense:
  - All residents: `AMBASSADOR_CONNECTIONS`, `SANCTUARY_NEWS_LAUGHS`, `MUNICIPAL_MISSION`
  - Ambassadors with products: also show `AMB_SOAP_DROP`, `AMB_COLLECTION_DROP`
  - If resident is linked to a campaign: also show `CHANCES_ANTE`, `URGENT_NEED`, `KEEP_THE_LIGHTS_ON`
  - Always available: a **"General Story"** option (maps to `AMBASSADOR_CONNECTIONS` with custom anchor)
- **Support path** selector (Shop / Donate / Subscribe / None)
- **AI Anchor Preview** button — calls the compose API (see below), shows a draft anchor text generated from the resident's data + your story context. You can edit it before submitting.
- **"Create Storm →" button** — submits and navigates to `/inputs/new` with pre-seeded data

**Submit behavior:**

The compose page POSTs to `/api/residents/[id]/compose` with:
```typescript
{
  storyContext: string;       // what the operator wrote
  series: string;             // selected series
  supportPath: string;
  additionalResidentIds?: string[];  // tagged residents
  anchorTextOverride?: string;       // if operator edited the AI preview
}
```

The API returns `{ anchorText, meta }` — the composed anchor text and the meta object with provenance. The compose page then navigates to:

```
/inputs/new?residentId=<id>&series=<series>&preSeeded=true
```

...passing the anchor text and meta via a brief server-side cache or sessionStorage (since the anchor text can be large).

### New API route: `POST /api/residents/[id]/compose/route.ts`

Generates an AI-suggested anchor text from:
1. Single-resident context (from `getSingleResidentContext`)
2. Operator's story context
3. Voice config for the selected series (if one exists for this resident)
4. Tagged additional residents' context (if any)

Uses Claude to compose a draft anchor text in the series' expected format. The system prompt varies by series:
- `AMBASSADOR_CONNECTIONS`: personality-driven profile format
- `CHANCES_ANTE`: fundraising narrative arc
- `MUNICIPAL_MISSION`: daily awareness format
- etc.

Returns:
```typescript
{
  anchorText: string;
  meta: {
    sourceResident: { id, name, species, barnArea };
    storyContext: string;
    chronicleEntriesUsed: string[];
  };
}
```

### Modify: `app/(protected)/inputs/new/page.tsx`

Accept new searchParams:
- `residentId` — if present, the wizard knows this storm was resident-sourced
- `preSeeded` — if `true`, skip step 1 (series selection) and step 2 (anchor text entry) and start at step 3 (platform config / scheduling)

The anchor text and meta are retrieved from sessionStorage (set by the compose page before navigation) or via a server-side temp cache keyed by a compose session ID passed in the URL.

### Modify: `POST /api/inputs/route.ts`

Accept `meta.sourceResident` in the POST body. No schema changes needed — `meta` is already a JSON field. Just ensure the downstream pipeline preserves it.

---

## Phase 3: Provenance Display + Quick-Storm

### Modify: Review Queue (`/queue` page)

If a PostmasterInput has `meta.sourceResident`, show a small badge/link:
```
Sourced from: 🐷 Mabel → /residents/[id]
```

### Modify: Outbound Queue / Social Outbound (Orchestrator pages)

If a ScheduleItem traces back to a PostmasterInput with `meta.sourceResident`, the expanded detail view shows the resident link. This is a light touch — just reading the meta field and rendering a link.

### Modify: `/maintenance/residents/page.tsx`

Add a small action to each `ResidentCard`:
- ⚡ button → links to `/residents/[id]` (profile page, from which they can start storms)
- Small "storms" count badge if the resident has been featured in storms

---

## Files to Create / Modify

### Phase 1: Profile Page + API

| File | Action | Description |
|------|--------|-------------|
| `app/api/residents/[id]/route.ts` | CREATE | GET single resident with full relations |
| `app/api/residents/[id]/storms/route.ts` | CREATE | GET storms featuring this resident |
| `app/(protected)/residents/[id]/page.tsx` | CREATE | Resident profile detail page |
| `lib/residentContext.ts` | MODIFY | Add `getSingleResidentContext(residentId)` |
| `app/(protected)/maintenance/residents/page.tsx` | MODIFY | Add ⚡ profile link button to ResidentCard |

### Phase 2: Compose Flow

| File | Action | Description |
|------|--------|-------------|
| `app/api/residents/[id]/compose/route.ts` | CREATE | POST: generate AI anchor from resident + story context |
| `app/(protected)/residents/[id]/compose/page.tsx` | CREATE | Story Seed / compose-from-resident page |
| `app/(protected)/inputs/new/page.tsx` | MODIFY | Accept `?residentId&preSeeded` to skip steps 1-2 |
| `app/api/inputs/route.ts` | MODIFY | Accept + preserve `meta.sourceResident` in POST |

### Phase 3: Provenance Display + Quick-Storm

| File | Action | Description |
|------|--------|-------------|
| `app/(protected)/queue/page.tsx` | MODIFY | Show "Sourced from" badge on resident-sourced inputs |
| `app/(protected)/maintenance/residents/page.tsx` | MODIFY | Add storm count badge to ResidentCard |

---

## Implementation Order

### Phase 1: Profile Page + API (~2 CC sessions)
1. Create `GET /api/residents/[id]/route.ts` with full relations
2. Create `GET /api/residents/[id]/storms/route.ts`
3. Add `getSingleResidentContext()` to `lib/residentContext.ts`
4. Create `/residents/[id]/page.tsx` — full profile page with all sections
5. Add ⚡ button to ResidentCard on maintenance page
6. **Checkpoint**

### Phase 2: Compose Flow (~2 CC sessions)
7. Create `POST /api/residents/[id]/compose/route.ts` — AI anchor generation
8. Create `/residents/[id]/compose/page.tsx` — story seed page
9. Modify `/inputs/new/page.tsx` to accept pre-seeded data and skip steps
10. Modify `POST /api/inputs` to preserve `meta.sourceResident`
11. **Checkpoint**

### Phase 3: Provenance Display (~1 CC session)
12. Add "Sourced from" badge to review queue
13. Add storm count to ResidentCard
14. **Checkpoint**

---

## Reference: Existing Patterns to Follow

- **Resident catalog page:** `app/(protected)/maintenance/residents/page.tsx` — card layout, expand/collapse, chronicle inline, Postmaster visual language (forest/sage/usps-navy palette)
- **ResidentCard component:** defined inline in the maintenance page (~line 500+)
- **ResidentImageGallery:** `components/ResidentImageGallery.tsx` — drag-and-drop, tag/season, primary selection
- **RichTextEditor:** `components/RichTextEditor.tsx` — TipTap editor used in input wizard and newsletter editing
- **Input creation wizard:** `app/(protected)/inputs/new/page.tsx` — multi-step form with searchParams-driven preselection
- **Input API:** `app/api/inputs/route.ts` — POST with series-specific metadata in `meta` JSON field
- **Resident context builder:** `lib/residentContext.ts` — `getAnimalContext()` for all-resident context
- **Resident image selector:** `lib/resident-image-selector.ts` — weighted image selection per resident
- **Generate bio API:** `app/api/residents/generate-bio/route.ts` — Claude-powered bio generation from resident fields
- **Protected layout:** `app/(protected)/layout.tsx` — sidebar + main content layout with forest-dark palette

---

## Acceptance Criteria

- [ ] `/residents/[id]` profile page renders with all sections (bio, chronicle, images, ambassador, content history)
- [ ] "Start Content Storm" button navigates to `/residents/[id]/compose`
- [ ] Compose page pulls resident context automatically and lets operator add story context
- [ ] AI anchor preview generates using resident data + operator context + voice config
- [ ] Submitting compose navigates to `/inputs/new` with pre-seeded anchor text, skipping steps 1-2
- [ ] Created PostmasterInput has `meta.sourceResident` with resident ID, name, species, barnArea
- [ ] `/residents/[id]` "Content History" section shows all storms for that resident
- [ ] Review queue shows "Sourced from: [resident]" badge on resident-sourced storms
- [ ] ⚡ button on resident catalog cards links to profile page
- [ ] `npx tsc --noEmit` clean after all phases
- [ ] Visual language matches existing Postmaster pages (forest/sage/usps-navy palette)
