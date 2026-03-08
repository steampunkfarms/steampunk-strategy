# Working Spec: COG-1 — Cogworks New Post Upgrade

**ID:** `20260307-cogworks-new-post-upgrade`
**Tier:** 3
**Status:** IN PROGRESS
**Date:** 2026-03-07

## Objective

Upgrade the Cogworks CMS post editor with Gen AI content composition, Postmaster-grade TipTap editor (24 extensions), multi-species selection, platform targeting, scheduling UI, and mini-Storm opt-in toggle.

## Target Repo

`steampunk-rescuebarn`

## Discovery Findings

- Existing TipTap: 6 packages (starter-kit, react, pm, link, image, placeholder) at ^3.20.0
- Need 18 additional TipTap extensions (underline, youtube, character-count, typography, highlight, text-align, color, text-style, dropcursor, gapcursor, table/row/cell/header, task-list/item, bubble-menu, floating-menu)
- `@anthropic-ai/sdk` already installed (^0.78.0)
- PostEditor.tsx: 642-line client component with toolbar, hero/video upload, species single-select, tags, excerpt, featured toggle
- Postmaster RichTextEditor.tsx: Full reference for TipTap extension config + toolbar
- Auth pattern: `supabase.auth.getUser()` — no `is_admin` RPC exists. Use same auth pattern as existing posts API.
- Migration convention: sequential numbered files (001_, 002_, etc.) — next is 008_
- Posts API at `src/app/api/cogworks/posts/route.ts` — POST/PATCH/DELETE handlers

## Sanity Deltas

1. **Spec says install @anthropic-ai/sdk**: Already installed. Skip.
2. **Spec says TipTap ^3.19.0**: Existing packages are ^3.20.0. Use ^3.20.0 for consistency.
3. **Spec references `is_admin` RPC**: Doesn't exist. Use same auth pattern as posts API (supabase.auth.getUser() check only).
4. **Migration naming**: Spec says YYYYMMDD format. Codebase uses sequential 00N_ format. Using 008_.
5. **Bubble-menu and floating-menu**: Not used in Postmaster's RichTextEditor. Will install but not add to editor config unless needed for toolbar.

## Phases

1. Dependencies (npm install 18 TipTap packages)
2. Supabase migration (008_cogworks_post_upgrade.sql)
3. Type definitions (species_groups, scheduling, platform targets, AI fields)
4. Gen AI API route (/api/cogworks/generate)
5. PostEditor rewrite (full TipTap, AI panel, multi-species, platforms, scheduling)
6. Edit page + API updates for new fields
7. PostCard multi-species display
8. Env configuration (.env.example)
