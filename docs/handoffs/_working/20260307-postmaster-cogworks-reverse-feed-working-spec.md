# Working Spec: COG-3 Postmaster → Cogworks Reverse Feed

**Handoff ID:** `20260307-postmaster-cogworks-reverse-feed`
**Date:** 2026-03-07
**Tier:** 3
**Status:** IN PROGRESS
**Repos:** steampunk-postmaster, steampunk-rescuebarn

## Sanity Deltas Identified

1. **Platform enum, not String**: Spec states "Rendition.platform is a String field (not enum) — adding 'COGWORKS' is safe." In reality, `Rendition.platform` uses `Platform` enum in Prisma schema (schema.prisma:306, 342-353). Must add `COGWORKS` to the `enum Platform` block. Since Postmaster uses `prisma db push` (no migration files), this is a schema.prisma edit only.

2. **No `metadata` field on Rendition**: Spec's Phase 3 wants to store Cogworks metadata (title, excerpt, speciesGroups) in a `metadata` field on Rendition. The model has no such field. Will add `metadata Json?` to the Rendition model in schema.prisma.

3. **Generation routes are NOT at `app/api/generate/[series]/route.ts`**: They exist at paths like `app/api/generate/moostik/route.ts`, etc. Each has its own PLATFORMS constant with varying shapes.

4. **No `dear-humans` generation route found**: The spec mentions `dear-humans` but no such route exists under `app/api/generate/`.

5. **Queue page PLATFORM_LABELS**: Needs COGWORKS added for queue filtering.

6. **Service client in Rescue Barn**: Spec uses `createServiceClient` but actual export is `getServiceClient()` from `@/lib/admin/service-client`.

7. **No Prisma migration files**: Postmaster uses `prisma db push` to Neon, not migration files. Schema changes go directly in `prisma/schema.prisma`.

## Discovery Notes

### Postmaster Generation Routes Found
- `app/api/generate/moostik/route.ts` — array style: `{ id, name, maxLength }`
- `app/api/generate/moostik/preview/route.ts` — Record style
- `app/api/generate/moostik/regenerate/route.ts` — Record style
- `app/api/generate/wisdom-margins/route.ts` — array style: `{ id, name, maxLength }`
- `app/api/generate/wishlist-wednesday/route.ts` — array style: `{ id, key, name, charLimit }`
- `app/api/generate/wishlist-gratitude/route.ts` — array style: `{ id, key, name, charLimit }`
- `app/api/generate/chances-ante/shared.ts` — Record style (shared PLATFORM_CONFIG)
- `app/api/generate/chances-ante/route.ts` — imports from shared.ts
- `app/api/generate/chances-ante/preview/route.ts` — imports from shared.ts
- `app/api/generate/chances-ante/regenerate/route.ts` — imports from shared.ts
- `app/api/generate/chances-ante/victory/route.ts` — imports from shared.ts

### Cron Dispatcher Pattern
`app/api/cron/post-scheduled/route.ts`:
- Uses `switch (rendition.platform)` with cases for X, FACEBOOK, INSTAGRAM
- Default case returns `Platform not yet supported`
- Has access to `rendition.fragment.input` for the parent input data
- Updates rendition status and externalId after posting

### Input Wizard Platform Config
- `platformInfo` Record at line 374 with 7 platforms
- `PlatformId` type union at line 384
- `formData.platforms` initial state at line 276
- Platform table renders at line 2720 with checkbox + content type radio

### Rescue Barn Patterns
- TBD from agent results
