# Handoff: 20260306-cogworks-facebook-page-backfill

**Status:** COMPLETE

**Objective:** Create shared Cogworks import utilities and automated Facebook Page backfill script for Cogworks soft launch seeding.

**Target repo(s):** steampunk-rescuebarn

**Risk & Reversibility:** Low risk, fully reversible. All imported posts are drafts (deletable by source='facebook'). Migration uses IF NOT EXISTS. No auth or data flow changes.

## Files affected

- `supabase/migrations/007_cogworks_import_columns.sql` (new) — adds source, external_id, external_url columns to sanctuary_posts
- `scripts/lib/cogworks-import-utils.mjs` (new) — shared import utilities: initSupabase, textToTiptap, makeSlug, downloadMedia, uploadToBlob, classifySpecies, checkDuplicate, createCogworksPost
- `scripts/backfill-facebook-page.mjs` (new) — automated Facebook Page post backfill with --limit, --dry-run, --skip-media, --skip-ai flags
- `scripts/seed-cogworks-posts.mjs` (modified) — refactored to use shared utils from cogworks-import-utils.mjs
- `.env.example` (modified) — added FACEBOOK_PAGE_ID, FACEBOOK_ACCESS_TOKEN, ANTHROPIC_API_KEY
- `package.json` + `package-lock.json` (modified) — added @anthropic-ai/sdk dependency

## Acceptance criteria

- [x] Migration adds source, external_id, external_url columns with unique index and check constraint
- [x] Shared utils module exports: VALID_SPECIES, initSupabase, textToTiptap, makeSlug, downloadMedia, uploadToBlob, classifySpecies, checkDuplicate, createCogworksPost
- [x] Backfill script supports --limit N, --dry-run, --skip-media, --skip-ai CLI flags
- [x] Backfill script uses Facebook Graph API v24.0 with cursor-based pagination
- [x] Two-tier species classification: keyword match first, Claude Haiku fallback
- [x] Media re-hosting: download from Facebook CDN → upload to Vercel Blob under cogworks-import/ prefix
- [x] All imported posts have status='draft', source='facebook'
- [x] Dedup by external_id prevents duplicate imports on re-runs
- [x] Rate limiting: 200ms between media downloads, 500ms between page fetches
- [x] Scripts are syntactically valid (node --check exits 0)
- [x] Existing seed script refactored to use shared utils
- [x] .env.example updated with Facebook/Anthropic vars
- [x] npx tsc --noEmit passes

## Verification

```bash
cd /Users/ericktronboll/Projects/steampunk-rescuebarn && npx tsc --noEmit && node --check scripts/backfill-facebook-page.mjs && node --check scripts/lib/cogworks-import-utils.mjs && node --check scripts/seed-cogworks-posts.mjs
```

```bash
cd /Users/ericktronboll/Projects/steampunk-strategy && node scripts/verify-handoff.mjs --handoff-name 20260306-cogworks-facebook-page-backfill
```
