# Working Spec: Resident Multi-Image Gallery (RIG-1)

**Status:** Draft
**Tier:** 2 (Standard — Human + CC)
**Sites affected:** Postmaster (primary), Rescue Barn, Cleanpunk Shop
**Date:** 2026-03-09

---

## Problem

AnimalResident has a single `imageUrl` field. This causes:
1. **Stale social content** — Storms always use the same photo per animal, making posts feel repetitive
2. **Flat resident profiles** — Rescue Barn and Cleanpunk show one image per animal, no gallery
3. **No seasonal variety** — summer photos in winter posts, indoor shots for outdoor stories
4. **Caretaker friction** — no easy way to add photos from the field; images require manual URL entry

## Discovery Summary

### What exists
- `AnimalResident.imageUrl` — single string field (Postmaster Prisma schema, line ~914)
- `MediaPreset` / `MediaPresetImage` — per-series image set model, built but **never wired** into generation routes (schema lines 699-727, API at `/api/media-presets/`)
- Vercel Blob upload — working at `/api/media/upload/route.ts`, supports images + video, 100MB max
- Public residents API — `/api/public/residents` returns `imageUrl` in field whitelist, consumed by Rescue Barn + Cleanpunk with 1hr cache
- Storm routes (`/api/post/{x,instagram,facebook}/storm/`) — all grab `input.imageUrl` or `mediaUrls[0]` directly

### What doesn't exist
- No `ResidentImage` model (per-animal image gallery)
- No image rotation or freshness logic anywhere in Storm pipeline
- No tag/season/context metadata on images
- No multi-image display on consumer sites
- No caretaker-friendly upload flow (admin UI requires URL paste)

---

## Proposed Architecture

### New Prisma Model: `ResidentImage`

```prisma
model ResidentImage {
  id           String         @id @default(cuid())
  residentId   String
  resident     AnimalResident @relation(fields: [residentId], references: [id], onDelete: Cascade)
  url          String         // Vercel Blob URL
  caption      String?        // Alt text + Storm narration context
  tags         String[]       // ["close-up", "outdoor", "with-friend", "eating", "portrait", "action"]
  season       String?        // "spring", "summer", "fall", "winter" — nullable = all-season
  takenAt      DateTime?      // Approximate date photo was taken
  isPrimary    Boolean        @default(false) // Hero shot for profiles
  sortOrder    Int            @default(0)     // Gallery display order
  lastUsedAt   DateTime?      // Last time Storm selected this image
  useCount     Int            @default(0)     // Total times used in posts
  source       String         @default("upload") // "upload", "chronicle", "cogworks-import"
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  @@index([residentId])
  @@index([residentId, isPrimary])
  @@index([lastUsedAt])
  @@index([season])
}
```

**Relation on AnimalResident:**
```prisma
model AnimalResident {
  // ... existing fields ...
  imageUrl     String?           // KEEP — becomes computed from primary ResidentImage, backward compat
  images       ResidentImage[]   // NEW
}
```

### Why not reuse MediaPreset?

`MediaPreset` is series-scoped (Moostik Monday, Dear Humans) with fragment roles (ANCHOR, ARIES, etc.). It's the wrong abstraction for per-animal galleries. `ResidentImage` is animal-scoped with tags/seasons for contextual selection. They serve different purposes and can coexist — a Storm could pick a `ResidentImage` for the animal-specific content, while `MediaPreset` handles series branding/zodiac imagery.

---

## Implementation Plan

### Part 1: Data Model + Upload UI (Postmaster)

**Schema changes:**
- Add `ResidentImage` model to Prisma schema
- Add `images` relation to `AnimalResident`
- Migration: for each existing `AnimalResident` with non-null `imageUrl`, create a `ResidentImage` with `isPrimary: true`
- Keep `imageUrl` field for backward compatibility (computed from primary image in API responses)

**API routes (Postmaster):**
- `GET /api/residents/[id]/images` — list all images for a resident
- `POST /api/residents/[id]/images` — upload new image(s) via Vercel Blob client upload
- `PATCH /api/residents/[id]/images/[imageId]` — update caption, tags, season, isPrimary, sortOrder
- `DELETE /api/residents/[id]/images/[imageId]` — remove image + delete from Blob

**Admin UI (Postmaster):**
- Add image gallery section to resident detail/edit page
- Drag-and-drop multi-upload (reuse existing Blob upload pattern from Cogworks)
- Tag picker (predefined + custom), season selector, caption field
- Drag-to-reorder for sortOrder
- Star icon to set primary
- Usage stats badge (useCount, lastUsedAt) per image

### Part 2: API Extension + Consumer Sites

**Public API changes (`/api/public/residents`):**
- Add `images` to allowed fields whitelist
- When `fields` includes `images`: return full `ResidentImage[]` array (minus internal fields like useCount/lastUsedAt)
- `imageUrl` continues to return the primary image URL (backward compat — no breaking change)
- New query param: `?imageLimit=5` — cap images per resident for list views

**Rescue Barn changes:**
- Update `AnimalResident` interface in `src/lib/residents.ts` to include `images[]`
- Resident profile page (`/residents/[slug]`): replace single image with gallery carousel/grid
- Resident grid page (`/residents`): keep primary image for card, maybe show image count badge
- Lightbox or modal for full-size viewing

**Cleanpunk changes:**
- Update `AnimalResident` interface in `src/types/residents.ts`
- Animal resident card: keep primary image, optionally show gallery on hover/click
- Product ambassador card: keep single primary (small avatar context)

### Part 3: Storm Image Selection

**New utility: `lib/resident-image-selector.ts`**

```typescript
interface ImageSelectionContext {
  residentId: string
  preferredTags?: string[]    // e.g., ["outdoor", "action"] for an adventure post
  season?: string             // current season or override
  excludeRecentDays?: number  // don't reuse images used in last N days (default: 14)
  platform?: Platform         // platform-specific preferences (IG prefers portrait, X prefers landscape)
}

async function selectResidentImage(ctx: ImageSelectionContext): Promise<ResidentImage | null>
```

**Selection algorithm (weighted scoring):**
1. Fetch all images for resident
2. Filter by season (if provided) — include null-season images as universal
3. Score each image:
   - Tag match bonus: +10 per matching preferred tag
   - Freshness bonus: +20 if never used, +10 if lastUsedAt > 14 days ago, 0 if recent
   - Use count penalty: -2 per use (encourages rotation)
   - Primary penalty: -5 (prefer non-primary for variety; primary is the "safe" fallback)
4. Pick highest score, break ties randomly
5. After selection: update `lastUsedAt` and increment `useCount`

**Integration points in Storm routes:**
- When a Storm input references an animal (via content/series), call `selectResidentImage()` instead of using `input.imageUrl` directly
- Mini-Storm (`/api/storm/mini/`): if `heroImageUrl` is not provided but content mentions a resident, auto-select
- Cogworks dispatch: include selected image URL in payload to Rescue Barn

---

## Migration Strategy

1. Run Prisma migration to add `ResidentImage` table
2. Migration script: for each `AnimalResident` where `imageUrl IS NOT NULL`, insert a `ResidentImage` with `isPrimary: true, source: "migration"`
3. API keeps returning `imageUrl` as before (primary image URL) — zero breaking changes for consumers
4. Consumer sites can adopt `images[]` field at their own pace

## Deferred (Out of Scope)

- [ ] Auto-generate thumbnails/compressed versions (Vercel Image Optimization handles this at CDN level via `next/image`)
- [ ] Chronicle-to-image pipeline ("just took photos of Gizmo" → prompt to upload)
- [ ] Engagement-weighted scoring (track which images get more social reactions)
- [ ] AI-powered image tagging (Claude vision to auto-tag uploaded photos)
- [ ] Video gallery support (focus on still images first)
- [ ] Bulk import from phone camera roll / Google Photos integration

## Acceptance Criteria

### Part 1
- [ ] `ResidentImage` model exists in Prisma schema with all fields
- [ ] Migration script converts existing `imageUrl` values to `ResidentImage` rows
- [ ] CRUD API routes work for resident images
- [ ] Admin UI shows image gallery on resident detail page with upload, tag, reorder, set-primary
- [ ] `npx tsc --noEmit` passes in Postmaster

### Part 2
- [ ] `/api/public/residents` returns `images[]` when requested via `?fields=images`
- [ ] `imageUrl` backward compat maintained (returns primary image URL)
- [ ] Rescue Barn resident profile shows image gallery
- [ ] Cleanpunk animal card unchanged (uses primary image)
- [ ] `npx tsc --noEmit` passes in Rescue Barn and Cleanpunk

### Part 3
- [ ] `selectResidentImage()` utility exists with weighted scoring
- [ ] At least one Storm route uses the selector instead of raw `input.imageUrl`
- [ ] `lastUsedAt` and `useCount` update after selection
- [ ] Same image is not reused within 14-day window (when alternatives exist)
- [ ] `npx tsc --noEmit` passes in Postmaster

## Open Questions

1. **Tag taxonomy:** Should we predefine a fixed set of tags or allow freeform? Recommendation: predefined set with freeform option (like Chronicle tags).
2. **Storage limits:** Cap images per resident? Recommendation: soft limit of 20, warn in UI above that.
3. **Which Storm routes first?** Recommendation: Dear Humans (most animal-centric) as the pilot, then expand.
