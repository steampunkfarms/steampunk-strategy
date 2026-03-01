# Claude Code Task — Cogworks Sprint 1 Build Verification

## Context
The Cogworks is a new sanctuary content feed and campaign platform being added to the Rescue Barn site. Opus has already written and placed all 13 source files. Your job is to wire them in, install dependencies, fix any build errors, and ship it.

## Project
- Repo: `/Users/ericktronboll/Projects/steampunk-rescuebarn/`
- Branch: create `feat/cogworks-sprint-1` from main
- Framework: Next.js 15 + React 19 + TypeScript 5.7

## New files already placed (DO NOT REWRITE — just fix build errors if any):
```
src/lib/cogworks/types.ts
src/lib/cogworks/queries.ts
src/components/cogworks/SpeciesBadge.tsx
src/components/cogworks/PostCard.tsx
src/components/cogworks/PostEditor.tsx
src/app/barn-feed/page.tsx
src/app/barn-feed/[species]/page.tsx
src/app/admin/cogworks/page.tsx
src/app/admin/cogworks/new/page.tsx
src/app/admin/cogworks/[id]/edit/page.tsx
src/app/admin/cogworks/[id]/edit/edit-client.tsx
src/app/api/cogworks/posts/route.ts
src/app/api/cogworks/upload/route.ts
```

## Task 1: Install dependencies
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-placeholder @vercel/blob
```

## Task 2: Add Cogworks to admin navigation
Find the admin layout or admin sidebar component. It will be in one of:
- `src/app/admin/layout.tsx`
- `src/components/layout/AdminSidebar.tsx`
- `src/components/layout/AdminNav.tsx`
- Or search for other admin nav items like "Advocacy" or "Vetting" to find the nav

Add a "Cogworks" link to `/admin/cogworks` in the admin navigation, positioned near the other admin sections. Use the same pattern as existing nav items. Icon suggestion: `Newspaper` from lucide-react if other items use Lucide icons.

## Task 3: Verify existing imports resolve
The new files import from these existing paths — verify they exist:
- `@/lib/supabase/server` (createClient)
- `@/components/ui/button` (Button)
- `@/components/ui/input` (Input)
- `@/components/ui/label` (Label)
- `@/components/ui/switch` (Switch)
- `@/components/ui/card` (Card, CardContent)
- `@/components/ui/badge` (Badge)

If any don't exist, check what shadcn/ui components are installed and adjust the imports to match.

## Task 4: Build
```bash
npm run build
```

Fix any TypeScript or build errors. Common issues to watch for:
- The `SpeciesBadge` component uses custom Tailwind colors (`barn-*`, `pasture-*`, `iron-*`, `forge-*`, `punk-*`). These should already be in `tailwind.config.ts`. If a color like `pasture-100` doesn't exist, check the config and use the closest existing shade.
- The `PostEditor.tsx` imports `Eye` from lucide-react but doesn't use it — if there's an unused import error, just remove the unused import.
- `searchParams` and `params` are typed as `Promise<>` (Next.js 15 pattern). If the project uses the older non-Promise pattern, remove the Promise wrapper and the `await`.
- The admin pages may need AccessGate wrapping depending on how other `/admin/*` pages are structured. Check `/admin/advocacy/page.tsx` as a reference. If admin pages use a shared layout with access control, the new pages should just work. If each page wraps its own AccessGate, add it.

## Task 5: Commit and push
```bash
git add -A
git commit -m "feat: add Cogworks content platform - barn feed, admin CMS, campaign data model

- sanctuary_posts, campaigns, campaign_subscribers tables (schema in Future Dev)
- Tiptap rich text editor with image upload to Vercel Blob
- Species feeds at /barn-feed and /barn-feed/[species]
- Admin post management at /admin/cogworks with filter/sort
- Post CRUD API with on-demand ISR revalidation
- Three launch campaigns seeded: Cluck Crew, Goats That Stare at Hay, Clouder 9"

git push origin feat/cogworks-sprint-1
```

Then merge to main:
```bash
git checkout main
git merge feat/cogworks-sprint-1
git push origin main
```

## DO NOT:
- Rewrite the files from scratch
- Change the data model or types
- Add features not listed here
- Remove the `@vercel/blob` import even if BLOB_READ_WRITE_TOKEN isn't set yet (it will be added to Vercel env vars separately)

## AFTER THIS TASK:
Padrona will:
1. Run the SQL migrations in Supabase (files are in Desktop/Future Dev/cogworks-sql/)
2. Add BLOB_READ_WRITE_TOKEN to Vercel environment variables
3. Create Stripe products for each campaign
