# COMMONS-1: Rescue Commons Foundation — Working Spec

**Handoff ID:** 20260307-commons1-rescue-commons
**Status:** Complete
**Tier:** 3

## Sanity Deltas

1. **Service client pattern** — Spec used `createServiceClient()` but codebase uses `getServiceClient()` from `@/lib/admin/service-client`. Fixed all API routes.
2. **Blog post route** — Spec assumed `/cogworks/[slug]/` but actual route is `/barn-feed/[param]/post-view.tsx`. Bray integration added there.
3. **Haiku model** — Spec used `claude-haiku-3-20240307`, updated to `claude-haiku-4-5-20251001` (latest).
4. **Supabase typed client** — New commons tables not in generated types. Used `as any` cast pattern from existing `cogworks-import.ts`.
5. **Migration number** — Latest was 012, created 013 as specified.

## File Map

### New Files (Rescue Barn: 22 files)
1. `supabase/migrations/013_rescue_commons.sql` — Schema + RLS + triggers
2. `src/lib/commons/types.ts` — Type definitions
3. `src/lib/commons/moderation.ts` — AI moderation engine (Claude Haiku)
4. `src/lib/commons/bray-sync.ts` — Auto-create Bray threads
5. `src/app/api/commons/comments/route.ts` — Comment CRUD
6. `src/app/api/commons/threads/route.ts` — Thread CRUD
7. `src/app/api/commons/upvote/route.ts` — Upvote toggle
8. `src/app/api/commons/flag/route.ts` — Flag/report
9. `src/app/api/commons/moderate/route.ts` — Admin moderation actions
10. `src/app/api/commons/moderate/queue/route.ts` — Admin queue API
11. `src/app/api/commons/bray-thread/route.ts` — Bray thread auto-create
12. `src/components/commons/CommentTree.tsx` — Threaded comment display
13. `src/components/commons/NewComment.tsx` — Comment input
14. `src/components/commons/ThreadList.tsx` — Thread listing
15. `src/components/commons/NewThread.tsx` — Thread creation form
16. `src/components/commons/CommunitySidebar.tsx` — Zone navigation
17. `src/components/commons/BrayDiscussion.tsx` — Blog post integration
18. `src/app/(public)/community/page.tsx` — Community landing
19. `src/app/(public)/community/corral/page.tsx` — The Corral
20. `src/app/(public)/community/corral/new/page.tsx` — New Corral thread
21. `src/app/(public)/community/punkyard/page.tsx` — The Punkyard
22. `src/app/(public)/community/punkyard/new/page.tsx` — New Punkyard thread
23. `src/app/(public)/community/thread/[slug]/page.tsx` — Thread detail
24. `src/app/admin/moderation/page.tsx` — Admin moderation queue

### Modified Files (Rescue Barn: 2 files)
25. `src/app/admin/layout.tsx` — Added Moderation nav link
26. `src/app/barn-feed/[param]/post-view.tsx` — Added BrayDiscussion component
