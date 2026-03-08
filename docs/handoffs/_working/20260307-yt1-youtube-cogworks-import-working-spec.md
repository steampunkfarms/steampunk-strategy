# YT-1: YouTube Transcript -> Cogworks Post Importer — Working Spec

**Handoff ID:** 20260307-yt1-youtube-cogworks-import
**Status:** Complete
**Tier:** 3

## Sanity Deltas

1. **Service client pattern** — Spec used `createServiceClient()` from `@/lib/supabase/service` but codebase uses `getServiceClient()` from `@/lib/admin/service-client`. Fixed in API route.
2. **Supabase typed client** — `sanctuary_posts` columns resolve to `never` through typed client. Used `as any` cast pattern from existing codebase (cogworks-import.ts).
3. **Admin UI styling** — Spec used generic shadcn classes (bg-primary, text-muted-foreground). Replaced with Rescue Barn design system (barn-600, iron-*, etc.).
4. **TipTap node type** — TipTapNode interface missing `text` field for text nodes. Added to interface.

## File Map

### New Files (Rescue Barn: 6 files)
1. `src/lib/youtube/fetcher.ts` — YouTube Data API v3 + youtubei.js transcript
2. `src/lib/youtube/processor.ts` — Claude Sonnet transcript processor
3. `src/lib/youtube/tiptap-builder.ts` — TipTap JSON body builder
4. `scripts/youtube-import.ts` — CLI bulk import script
5. `src/app/api/youtube/import/route.ts` — On-demand import API
6. `src/app/admin/youtube-import/page.tsx` — Admin UI page

### Modified Files (Rescue Barn: 3 files)
7. `src/app/admin/layout.tsx` — Added YouTube Import nav link
8. `.env.example` — Added YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID
9. `package.json` — Added deps + script entries
