# Handoff Spec: Newsletter Composer — Admin Compose + Send UI

**Handoff ID:** 20260313-newsletter-composer
**Tier:** 2 (Standard)
**Repo:** steampunk-rescuebarn
**Date:** 2026-03-13
**Status:** COMPLETED 2026-03-13 — 5 files created, 2 modified. Ready for deploy.

---

## Context

The Rescue Barn newsletter infrastructure was ~80% complete: tables, API routes, Resend integration, warmup schedule, and subscriber management all existed. The gap was purely UI — the admin had no way to compose, approve, or send newsletters. All issue creation came from Postmaster's AI pipeline, with no manual compose or test-send capability.

## What Was Built

### New Files (5)

1. **`src/app/admin/newsletter/compose-tab.tsx`** — TipTap-based rich text editor for composing newsletter issues. Subject, preview text, cadence selector (weekly/monthly/seasonal/one-off), toolbar with formatting (bold, italic, underline, headings, alignment, lists, blockquote, images, links), personalization token hints (`{{first_name}}`, `{{unsubscribe_url}}`). Saves as draft via POST to `/api/newsletter/issues`.

2. **`src/app/admin/newsletter/issue-detail.tsx`** — Full issue detail view with status workflow buttons (Approve for drafts, Send for approved), content preview, test-send to any email address, recipient selector integration, send stats display for sent issues, warmup budget indicator, and delete capability.

3. **`src/app/admin/newsletter/recipient-selector.tsx`** — Two-mode recipient picker: "cadence mode" (sends to all subscribers matching cadence preference) or "custom mode" (search/select individual subscribers + add arbitrary email addresses). Used for one-off sends and testing.

4. **`src/app/api/newsletter/send-test/route.ts`** — Single-recipient test send API. Bypasses cadence filtering and warmup limits. Prefixes subject with `[TEST]`. Auth: logged-in user only (no INTERNAL_SECRET).

5. **`src/app/api/newsletter/budget/route.ts`** — Returns current warmup budget info (remaining sends today, total sent, daily limit, unlimited flag). Used by issue-detail to show budget indicator.

### Modified Files (2)

6. **`src/app/admin/newsletter/newsletter-admin.tsx`** — Added Compose tab (third tab alongside Issues and Subscribers), made issue rows clickable to open detail view, integrated ComposeTab and IssueDetailView components, added issues list refresh on return from detail view.

7. **`src/app/api/newsletter/send/route.ts`** — Extended to accept optional `recipients` array for custom sends. When provided, matches emails against subscriber records and creates synthetic subscriber objects for ad-hoc emails. Added `one-off` cadence support (sends to all active subscribers). Handles null subscriber_id in send log for ad-hoc recipients. Gracefully handles missing unsubscribe_token for non-subscriber recipients.

### Not Modified (no changes needed)

- `src/app/api/newsletter/issues/route.ts` — POST already accepts any cadence string, so `one-off` works without modification.
- `src/app/admin/newsletter/page.tsx` — Server component unchanged; already passes all needed data.

---

## Acceptance Criteria

1. ✅ Compose tab visible in newsletter admin with TipTap rich text editor
2. ✅ Can create draft issues with subject, preview text, cadence, and HTML content
3. ✅ Issue rows are clickable → opens detail view
4. ✅ Detail view shows content preview, status badges, and creation metadata
5. ✅ Draft issues can be approved (draft → approved transition)
6. ✅ Approved issues can be sent to all cadence-matching subscribers
7. ✅ Test send works to any email address (bypasses warmup + cadence)
8. ✅ Custom recipient mode allows selecting specific subscribers + adding arbitrary emails
9. ✅ One-off cadence sends to all active subscribers regardless of preferences
10. ✅ Warmup budget displayed on issue detail view
11. ✅ Issues can be deleted (draft and approved only)
12. ✅ `npx tsc --noEmit` passes with zero errors
13. ✅ No secrets, no debugging console.log, no stray file changes

---

## Operator Actions

🟢 NO OPERATOR ACTION REQUIRED

No database migrations, no new env vars, no external service setup. All new functionality uses existing tables (`newsletter_issues`, `newsletter_subscribers`, `newsletter_send_log`, `email_send_log`) and existing API infrastructure (Resend, Supabase, warmup config).
