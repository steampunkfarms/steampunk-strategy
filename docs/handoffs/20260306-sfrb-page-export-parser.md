# Handoff: 20260306-sfrb-page-export-parser

**Status:** COMPLETE

**Objective:** Create dual-mode parser for SFRB Facebook Page data export — Cogworks seeding + Studiolo enrichment.

**Target repo(s):** steampunk-rescuebarn

**Risk & Reversibility:** Low risk, fully reversible. Cogworks posts deletable by source='facebook_export'. Studiolo output is a review-only JSON file. No schema changes.

## Files affected

- `scripts/parse-sfrb-page-export.mjs` (new) — dual-mode parser with --mode cogworks|studiolo|all, --dry-run, --skip-media, --skip-ai, --skip-videos flags
- `scripts/lib/cogworks-import-utils.mjs` (modified) — added decodeFBText() export for Facebook mojibake decoding

## Acceptance criteria

- [x] `scripts/parse-sfrb-page-export.mjs` exists and handles all flags (--mode, --dry-run, --skip-media, --skip-ai, --skip-videos)
- [x] Cogworks mode correctly parses `profile_posts_1.json` structure
- [x] Cogworks mode correctly parses `videos.json` structure (videos_v2[])
- [x] Video/post dedup detects overlapping content by timestamp + text similarity
- [x] Media paths resolved from export directory root
- [x] Local media files read from disk and uploaded to Vercel Blob
- [x] Facebook text mojibake decoded via `decodeFBText()`
- [x] `decodeFBText()` exported from `scripts/lib/cogworks-import-utils.mjs`
- [x] Studiolo mode parses followers and classifies person vs organization
- [x] Studiolo mode parses all messenger conversations, classifies conversation direction
- [x] Studiolo mode outputs structured JSON to `{export_dir}/studiolo-enrichment-output.json`
- [x] Studiolo mode includes `crossReferenceNames` array for donor matching
- [x] All Cogworks posts inserted as `status: 'draft'`, `source: 'facebook_export'`
- [x] `--dry-run` mode works without any database writes or media uploads
- [x] `node --check scripts/parse-sfrb-page-export.mjs` exits 0
- [x] `npx tsc --noEmit` passes in steampunk-rescuebarn

## Verification

```bash
cd /Users/ericktronboll/Projects/steampunk-rescuebarn && npx tsc --noEmit && node --check scripts/parse-sfrb-page-export.mjs && node --check scripts/lib/cogworks-import-utils.mjs
```

```bash
cd /Users/ericktronboll/Projects/steampunk-strategy && node scripts/verify-handoff.mjs --handoff-name 20260306-sfrb-page-export-parser
```
