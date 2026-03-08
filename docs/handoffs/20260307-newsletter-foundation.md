# NEWS-1: Newsletter Foundation

**Handoff ID:** `20260307-newsletter-foundation`
**Date:** 2026-03-07
**Tier:** 3
**Status:** COMPLETE
**Repos:** steampunk-rescuebarn (primary), steampunk-postmaster (secondary)

## Summary

Built the full newsletter foundation: Rescue Barn gets a Resend-powered batch send pipeline, HTML email templates for 3 cadences (weekly/monthly/seasonal), subscriber management with preference-based unsubscribe, newsletter issue CRUD, and an admin page. Postmaster gets a NewsletterDraft Prisma model, cross-site content ingestion library, dispatch helper, editorial review page, and drafts API. Two new Cogworks query APIs created for Postmaster content ingestion (posts listing + recent comments).

## Changes

### steampunk-rescuebarn (16 files created/modified)

**Schema:**
- `supabase/migrations/012_newsletter_upgrade.sql` -- Upgrades newsletter_subscribers (status, preferences, first_name, unsubscribe_token, bounce_count), creates newsletter_issues + newsletter_send_log tables with RLS

**Email templates:**
- `src/lib/email/templates/shared.ts` -- Shared email components: header, footer, impact box, chronicle excerpt, section divider, wrapper, color constants
- `src/lib/email/templates/weekly-dispatch.ts` -- Weekly Barn Dispatch template with featured moment, program spotlight, caretaker note, link item
- `src/lib/email/templates/monthly-letter.ts` -- Monthly Barn Letter with opening, main story, impact metrics, community voices, caretaker journal
- `src/lib/email/templates/seasonal-publication.ts` -- Seasonal Steam & Hay publication with hero image, long-form body, PDF download link

**Send pipeline:**
- `src/app/api/newsletter/send/route.ts` -- POST: batch sends approved issue via Resend (50/batch), personalization, List-Unsubscribe headers

**Unsubscribe:**
- `src/app/newsletter/unsubscribe/page.tsx` -- Public unsubscribe page with cadence preference toggles
- `src/app/api/newsletter/unsubscribe/route.ts` -- GET (fetch prefs by token) + POST (full/partial unsubscribe)

**Newsletter issue CRUD:**
- `src/app/api/newsletter/issues/route.ts` -- GET (list with filters) + POST (create)
- `src/app/api/newsletter/issues/[id]/route.ts` -- GET + PATCH + DELETE
- `src/app/api/newsletter/issues/[id]/approve/route.ts` -- POST: sets status to approved

**Admin UI:**
- `src/app/admin/newsletter/page.tsx` -- Server component fetching stats/subscribers/issues
- `src/app/admin/newsletter/newsletter-admin.tsx` -- Admin dashboard: stats gauges, issues table, subscribers table with search

**Cogworks query APIs (for Postmaster content ingestion):**
- `src/app/api/cogworks/comments/recent/route.ts` -- GET: recent approved comments across posts (INTERNAL_SECRET auth)

**Modified files:**
- `src/app/api/cogworks/posts/route.ts` -- Added GET handler for listing published posts (INTERNAL_SECRET auth)
- `src/app/admin/layout.tsx` -- Added "Newsletter" to ADMIN_NAV

### steampunk-postmaster (7 files created/modified)

**Schema:**
- `prisma/schema.prisma` -- Added NewsletterDraft model (cadence, subject, subjectOptions, htmlContent, sources, animalsFeatured, status tracking, dispatch state)

**Newsletter infrastructure:**
- `lib/newsletter/content-ingest.ts` -- Cross-site content ingestion: Cogworks posts, impact metrics (TARDIS), recent comments, resident profiles, caretaker journals + animal chronicles
- `lib/newsletter/dispatch.ts` -- Dispatch to Rescue Barn: creates issue via INTERNAL_SECRET, trigger send

**API routes:**
- `app/api/newsletter/drafts/route.ts` -- GET (list) + POST (create) drafts
- `app/api/newsletter/drafts/[id]/dispatch/route.ts` -- POST: approve + dispatch to Rescue Barn

**UI:**
- `app/(protected)/newsletter/page.tsx` -- Editorial review page: draft queue with expand/preview, subject line selection, approve & dispatch, sent history

**Modified files:**
- `components/Sidebar.tsx` -- Added Newsletter section with Mail icon
- `.env.example` -- Added TARDIS_URL

## Sanity Deltas Applied

1. **`createServiceClient` doesn't exist** -- Spec used `createServiceClient` from `@/lib/supabase/server`. Actual export is `getServiceClient()` from `@/lib/admin/service-client`. Fixed.
2. **Admin auth pattern** -- Spec used explicit `rpc('is_admin')` calls. Existing admin routes rely on RLS policies with `is_admin(auth.uid())`. Matched existing pattern.
3. **Email templates are plain functions, not React components** -- Spec asked for React Email-compatible templates. Existing templates use plain functions returning `{ subject, html }`. Matched existing pattern for consistency.
4. **Admin sidebar has no icons** -- Spec suggested adding icons. Existing ADMIN_NAV uses plain text links. Matched existing pattern.
5. **Cogworks posts API had no GET** -- Created GET handler with INTERNAL_SECRET auth for cross-site content ingestion.
6. **No recent comments API** -- Created at `/api/cogworks/comments/recent` with INTERNAL_SECRET auth.
7. **No `JournalEntry` model in Postmaster** -- Spec referenced `JournalEntry`. Actual models are `CaretakerJournal` and `AnimalChronicle`. Fixed content ingestion to use both.
8. **No `ContentInput` model** -- Spec referenced `ContentInput`. Actual model is `PostmasterInput`. Created standalone `NewsletterDraft` model instead of relating to PostmasterInput (newsletters have different lifecycle).
9. **Prisma `Json` type indexing** -- `subjectOptions` as `Json?` can't be indexed with `[0]`. Fixed with `Array.isArray()` guard.
10. **Migration numbering** -- Next migration is 012 (not YYYYMMDD format). Used `012_newsletter_upgrade.sql`.

## Verification

- `npx tsc --noEmit` in steampunk-rescuebarn: 0 errors
- `npx tsc --noEmit` in steampunk-postmaster: 0 errors
- `npx eslint` on all modified files in both repos: 0 errors, 0 warnings

## Deferred / Manual Steps Required

1. **Migration 012** needs to be run in Rescue Barn Supabase dashboard
2. Automated composition crons (NEWS-2)
3. Seasonal publication + PDF generation (NEWS-3)
4. Subject line A/B testing
5. Open rate / click tracking (Resend provides this)
6. Bounce handling webhook from Resend
7. Cleanpunk product stories in newsletters
8. Subscriber segmentation beyond cadence preferences
9. TARDIS impact overview API endpoint (content ingestion will gracefully degrade without it)
