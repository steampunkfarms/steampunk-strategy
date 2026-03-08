# COMMONS-1: Rescue Commons Foundation — Authenticated Community Platform

**Handoff ID:** 20260307-commons1-rescue-commons
**Completed:** 2026-03-07
**Tier:** 3
**Repos:** steampunk-rescuebarn (24 new, 2 modified), steampunk-strategy (docs only)

## Summary

Authenticated community platform with three zones: The Bray (blog post discussions), The Corral (general forum), and The Punkyard (fun/memes/photos). Every comment moderated by Claude Haiku (toxicity scoring 0-1), strike system (3 strikes = 7-day suspension, 5 = permanent ban), threaded replies (max depth 3), real-time updates via Supabase Realtime, admin moderation queue.

## What Was Built

### Database Schema (Migration 013)
- `commons_zones` — Zone definitions (bray, corral, punkyard)
- `commons_threads` — Threads with entity binding (polymorphic for Bray blog posts)
- `commons_comments` — Threaded comments with AI moderation fields
- `commons_upvotes` — Comment upvotes (one per user)
- `commons_flags` — User reports with reason categories
- `commons_user_standing` — Strike tracking, suspensions, bans
- Triggers: thread stats update, flag count update, upvote count update
- RLS: authenticated create, public read approved, admin-only flags/standing
- Supabase Realtime enabled on `commons_comments`

### AI Moderation Engine
- Claude Haiku (`claude-haiku-4-5-20251001`) scores every comment 0-1 toxicity
- Auto-approved (< 0.3), pending review (0.3-0.7), rejected (> 0.7)
- Full Code of Conduct in system prompt (10 rules + agricultural context)
- Fail-safe: moderation API failure → queued for human review
- Strike system with escalating consequences

### API Routes (7 endpoints)
- `POST/GET /api/commons/comments` — Submit + retrieve threaded comments
- `POST/GET /api/commons/threads` — Create + list threads
- `POST /api/commons/upvote` — Toggle upvote
- `POST /api/commons/flag` — Report comment
- `POST /api/commons/moderate` — Admin approve/hide/remove/lock
- `GET /api/commons/moderate/queue` — Admin pending/flagged queue
- `GET /api/commons/bray-thread` — Auto-create Bray thread for blog post

### UI Components (6 components)
- `CommentTree` — Recursive threaded display with Realtime subscription
- `NewComment` — Input with moderation feedback (approved/pending/rejected)
- `ThreadList` — Zone thread listing with pagination
- `NewThread` — Thread creation with title + body + image (Punkyard)
- `CommunitySidebar` — Zone navigation with active state
- `BrayDiscussion` — Expandable discussion section on blog posts

### Pages (7 pages)
- `/community` — Landing (defaults to Corral)
- `/community/corral` — The Corral thread list
- `/community/corral/new` — New Corral thread
- `/community/punkyard` — The Punkyard thread list
- `/community/punkyard/new` — New Punkyard thread
- `/community/thread/[slug]` — Thread detail with CommentTree
- `/admin/moderation` — Admin queue with approve/hide/remove/lock actions

### Integrations
- Blog post detail (`/barn-feed/[param]`) now shows expandable Bray discussion
- Admin nav updated with Moderation link

## Sanity Deltas Applied
1. `createServiceClient()` → `getServiceClient()` from `@/lib/admin/service-client`
2. Blog posts at `/barn-feed/[param]/` not `/cogworks/[slug]/`
3. Haiku model updated to `claude-haiku-4-5-20251001`
4. Supabase typed client → `as any` cast pattern for untyped tables
5. Migration 013 (latest was 012)

## Verification
- `npx tsc --noEmit` — PASS (steampunk-rescuebarn, 0 errors)

## Deferred (COMMONS-2 and COMMONS-3)
- COMMONS-2: AI Intelligence Layer — thread summaries, knowledge harvest, Barn Sage RAG, social amplification
- COMMONS-3: Gamification — karma/flair, vetted zone, live rooms, premium lounge
- Supabase Storage bucket for Punkyard image uploads (image_url field ready, upload UI deferred)
