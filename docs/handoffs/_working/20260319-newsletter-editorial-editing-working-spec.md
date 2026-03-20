# Working Spec: Newsletter Editorial Editing

**Handoff ID:** 20260319-newsletter-editorial-editing
**Date:** 2026-03-19
**Tier:** 2 (Standard — new feature, cross-repo)
**Repos:** steampunk-postmaster, steampunk-rescuebarn

---

## Problem

The Postmaster newsletter review page (`/newsletter`) is read-only. When AI-generated content doesn't quite nail the human nuance, Fred has no way to tweak it before dispatch. He must either accept the AI output as-is or regenerate entirely.

Currently the page allows:
- Selecting one of 3 AI-generated subject lines (radio buttons)
- Viewing HTML preview of body content
- Viewing Animals Featured tags (read-only)
- Clicking "Approve & Dispatch"

## Solution

Add inline editing capabilities to the newsletter draft review cards:

1. **Subject lines** — Convert radio labels to editable text inputs. Fred can still select which one AND modify the wording.
2. **Newsletter body** — Add a TipTap rich text editor (reuse existing `RichTextEditor.tsx`) with toggle between preview and edit mode.
3. **Animals Featured** — Tag input: type a name + Enter to add, click X to remove.
4. **Scheduled release** — Date/time picker for when the newsletter should go out. Passed through to Rescue Barn on dispatch.

## Architecture

### Postmaster Changes

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `scheduledFor DateTime?` to `NewsletterDraft` |
| `app/api/newsletter/drafts/[id]/route.ts` | New PATCH route — update subject, subjectOptions, htmlContent, plainText, animalsFeatured, scheduledFor |
| `components/NewsletterBodyEditor.tsx` | New component — lightweight TipTap editor themed for newsletter editing (white bg, prose styling) |
| `app/(protected)/newsletter/page.tsx` | Add edit mode toggle, inline subject editing, animal tag input, date/time picker, save button |
| `lib/newsletter/dispatch.ts` | Add `scheduledFor` to DispatchPayload, pass through to Rescue Barn |
| `app/api/newsletter/drafts/[id]/dispatch/route.ts` | Read `scheduledFor` from draft, include in dispatch payload |

### Rescue Barn Changes

| File | Change |
|------|--------|
| `supabase/migrations/XXX_newsletter_scheduled_for.sql` | Add `scheduled_for timestamptz` to `newsletter_issues` |
| `src/app/api/newsletter/issues/route.ts` | Accept `scheduled_for` in POST body, store it |

### Data Flow

```
Fred edits draft in Postmaster UI
  → PATCH /api/newsletter/drafts/[id] saves changes
  → Fred clicks "Approve & Dispatch"
  → POST /api/newsletter/drafts/[id]/dispatch reads updated fields
  → dispatchToRescueBarn() sends to RB with scheduled_for
  → RB stores scheduled_for on newsletter_issues record
```

## Acceptance Criteria

- [ ] AC-1: Subject lines are editable text inputs (not just radio select)
- [ ] AC-2: Newsletter body can be edited via TipTap rich text editor
- [ ] AC-3: Edit mode toggles between preview and editor
- [ ] AC-4: Animals Featured tags can be added and removed
- [ ] AC-5: Date/time picker allows setting scheduled release time
- [ ] AC-6: All edits persist via PATCH API before dispatch
- [ ] AC-7: Dispatch sends updated content + scheduledFor to Rescue Barn
- [ ] AC-8: Rescue Barn stores scheduled_for on newsletter_issues
- [ ] AC-9: tsc --noEmit passes on both repos
- [ ] AC-10: No regressions to existing compose/dispatch flow

## Out of Scope (Deferred)

- Auto-dispatch cron that sends at scheduledFor time (requires new Orchestrator job)
- Preview text editing (low priority, AI-generated preview text is adequate)
- Regenerate individual sections (would require composition API changes)
