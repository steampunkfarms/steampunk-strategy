# Handoff Spec: RIG-1 — Resident Multi-Image Gallery

**Date:** 2026-03-09
**Tier:** 2 (Standard)
**Status:** Complete (Part 1 + Part 3 core)
**Repos:** steampunk-postmaster (primary)
**Working Spec:** `docs/handoffs/_working/20260309-resident-multi-image-working-spec.md`

---

## Summary

Added multi-image gallery support for animal residents. Previously each `AnimalResident` had a single `imageUrl` string field — now a dedicated `ResidentImage` model supports multiple images per animal with metadata (tags, season, caption), freshness tracking (lastUsedAt, useCount), and a weighted scoring algorithm for Storm content variety.

## Files Created (8)

| # | File | Purpose |
|---|------|---------|
| 1 | `prisma/schema.prisma` (modified) | Added `ResidentImage` model + `images` relation on `AnimalResident` |
| 2 | `app/api/residents/[id]/images/route.ts` | GET (list) + POST (create) images for a resident |
| 3 | `app/api/residents/[id]/images/[imageId]/route.ts` | PATCH (update metadata/primary) + DELETE (remove + Blob cleanup) |
| 4 | `components/ResidentImageGallery.tsx` | Admin UI — drag-drop upload, tag/season editor, primary selection, use count badges |
| 5 | `lib/resident-image-selector.ts` | Weighted scoring algorithm for Storm image rotation |
| 6 | `scripts/migrate-resident-images.ts` | One-time migration: existing imageUrl → ResidentImage rows |
| 7 | `app/api/public/residents/route.ts` (modified) | Added `images` to ALLOWED_FIELDS, nested select with imageLimit |
| 8 | `app/(protected)/maintenance/residents/page.tsx` (modified) | Imported + mounted ResidentImageGallery in expanded card |
| 9 | `app/api/generate/dear-humans/route.ts` (modified) | RIG-1 auto-select: scan anchor text for animal names, pick from gallery |

## Schema: ResidentImage

```prisma
model ResidentImage {
  id, residentId, url, caption, tags[], season, takenAt,
  isPrimary, sortOrder, lastUsedAt, useCount, source,
  createdAt, updatedAt
  @@index([residentId]), @@index([residentId, isPrimary]),
  @@index([lastUsedAt]), @@index([season])
}
```

## Image Selector Algorithm

Weighted scoring per image:
- Season match: +15 (matching), +5 (all-season), -5 (wrong season)
- Tag match: +10 per matching preferred tag
- Freshness: +20 (never used), +10 (>14 days), -10 (recent)
- Use count: -2 per use
- Primary penalty: -5 (prefer variety over hero shot)
- Random jitter: 0-4 (break ties)

After selection, updates `lastUsedAt` and increments `useCount`.

## Public API Changes

- New allowed field: `images` (request via `?fields=images` or `?fields=name,species,images`)
- New query param: `?imageLimit=N` — cap images per resident in response
- `imageUrl` field unchanged — always returns primary image URL (backward compat)
- Images returned with: id, url, caption, tags, season, takenAt, isPrimary, sortOrder

## Migration

Ran successfully: 9 residents with existing `imageUrl` converted to `ResidentImage` rows with `isPrimary: true, source: "migration"`.

## Verification

- `npx prisma db push` — schema synced to Neon
- `npx tsc --noEmit` — zero errors
- Migration script — 9/9 residents converted

## Deferred (Part 2 consumer sites)

- [ ] Rescue Barn: update `AnimalResident` interface, add gallery carousel to `/residents/[slug]`
- [ ] Cleanpunk: update interface, keep single primary image on cards
- [ ] Rescue Barn: image count badge on resident grid cards

## Deferred (Future)

- [ ] Auto-generate thumbnails (rely on next/image + Vercel Image Optimization for now)
- [ ] Chronicle-to-image pipeline
- [ ] Engagement-weighted scoring (track social reactions per image)
- [ ] AI image tagging (Claude Vision auto-tag on upload)
- [ ] Video gallery support
- [ ] Expand auto-select to all 5 Storm series (currently Dear Humans only)
