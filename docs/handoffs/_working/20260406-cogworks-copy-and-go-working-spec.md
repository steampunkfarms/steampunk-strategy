# Working Spec: Cogworks Copy-and-Go + Social Image Variants

**ID:** 20260406-cogworks-copy-and-go
**Repo:** steampunk-rescuebarn
**Tier:** 2
**Date:** 2026-04-06

## Scope

Add Copy-and-Go social propagation buttons + in-situ social image variant generation to the Cogworks post editor. Additive — mini-Storm automated dispatch stays as-is.

## Sanity Deltas (Approved)

1. **Slug over ID:** Use `post.slug || post.id` in barn-feed links (public route resolves by slug)
2. **PlatformCopy interface:** Add `socialImageVariant` and `downloadFilename` to return type
3. **Drop shared tracking:** No per-platform shared booleans — rescuebarn uses `storm_origin_platforms`
4. **Env var:** Use `NEXT_PUBLIC_SITE_URL` with hardcoded fallback per existing mini-Storm pattern

## Deferred

- Mini-Storm barn-feed link uses `post.id` instead of `post.slug` — pre-existing potential bug, logged to roadmap for separate investigation

## Files

| File | Action |
|------|--------|
| `supabase/migrations/028_social_variants.sql` | NEW |
| `src/lib/cogworks/types.ts` | MODIFY |
| `src/lib/cogworks/platform-copy.ts` | NEW |
| `src/lib/cogworks/share-capabilities.ts` | NEW |
| `src/lib/cogworks/image-share.ts` | NEW |
| `src/app/api/cogworks/social-variants/route.ts` | NEW |
| `src/components/cogworks/CopyAndGoButtons.tsx` | NEW |
| `src/components/cogworks/SharePanel.tsx` | NEW |
| `src/app/admin/cogworks/[id]/edit/edit-client.tsx` | MODIFY |

## Acceptance Criteria

1. Published posts with hero images show SharePanel below editor
2. SharePanel triggers variant generation on first view (5 variants: fb, ig, tt, x, sq)
3. Variants stored in `social_variants` JSONB column on sanctuary_posts
4. Copy-and-Go buttons copy platform-specific text and open platform URL
5. Image sharing: clipboard copy (FB, X desktop), download (IG, others), native share (mobile)
6. Posts without hero images show text-only Copy-and-Go
7. Mini-Storm status displayed as read-only indicator
8. Existing PostEditor.tsx NOT modified
9. tsc --noEmit passes clean
