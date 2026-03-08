# FAQ-1: FAQ Knowledge Base + Admin UI + Seed Content + Public AI FAQ Agent

**Ticket:** FAQ-1
**Tier:** 2 (CC-led)
**Repo:** steampunk-rescuebarn
**Branch:** faq-1-knowledge-base
**Date:** 2026-03-08

## Discovery

- Existing FAQ page at `src/app/faq/page.tsx` has 10 hardcoded Q&A items (static array)
- No FAQ tables in Supabase — need full schema creation
- `@anthropic-ai/sdk` already installed and used in moderation + cogworks
- Anthropic pattern: `new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })` + `messages.create()`
- Admin layout has top nav bar with links — need to add "FAQ" link
- Root layout at `src/app/layout.tsx` wraps all pages including admin — FAQ agent should only render on public pages
- Admin uses `AccessGate` with `tier="vetted"` + `requiredRoles={["admin"]}`
- `is_admin(auth.uid())` function exists for RLS policies
- pgvector NOT enabled — will use keyword matching + Anthropic API for semantic matching
- No accordion component — will use custom collapsible with Tailwind
- TipTap is available but overkill for FAQ answer editing — textarea with markdown is sufficient

## Scope

### Files to Create/Modify

```
supabase/migrations/014_faq_knowledge_base.sql          — NEW
scripts/seed-faqs.ts                                      — NEW
src/lib/faq/types.ts                                      — NEW
src/lib/faq/queries.ts                                    — NEW
src/app/admin/faq/page.tsx                                — NEW
src/app/admin/faq/[id]/page.tsx                           — NEW
src/app/admin/faq/categories/page.tsx                     — NEW
src/app/admin/faq/analytics/page.tsx                      — NEW
src/app/faq/page.tsx                                      — REPLACE
src/app/api/faq/chat/route.ts                             — NEW
src/components/faq/faq-agent.tsx                           — NEW
src/components/faq/faq-agent-button.tsx                    — NEW
src/components/faq/faq-chat-panel.tsx                      — NEW
src/app/layout.tsx                                        — MODIFY (add FaqAgent)
src/app/admin/layout.tsx                                  — MODIFY (add FAQ nav link)
```

## Acceptance Criteria

1. Migration runs clean, 3 tables + RLS + indexes created
2. Seed script populates ≥25 FAQ entries across 7 categories
3. Admin CRUD for FAQ entries and categories
4. Admin conversation analytics with escalation filter
5. Public FAQ page renders database-driven accordion with search
6. AI FAQ chat widget on all public pages as floating bubble
7. Chat answers from FAQ knowledge base, refuses off-topic
8. Graceful escalation with email link when no match
9. Conversation logging with helpful/not-helpful feedback
10. Rate limiting (10 messages per session per 5-minute window)
11. `tsc --noEmit` passes

## Completion Status: DONE

**Date:** 2026-03-08
**Branch:** `faq-1-knowledge-base` (steampunk-rescuebarn)
**tsc --noEmit:** PASS (zero errors)

### Sanity Deltas Applied

1. **Migration number**: Changed from 013 to 014 — COMMONS-1 already used migration 013_rescue_commons.sql. File-anchored, minimal, risk-reducing.
2. **pgvector omitted**: Spec noted pgvector may not be available — confirmed not enabled. Used keyword matching + Anthropic API for semantic matching instead. No embedding column.
3. **`is_admin()` RLS**: Existing `is_admin(auth.uid())` helper confirmed in migration 001. Used same pattern for FAQ tables. Admin conversation policy also includes service_role for API route logging.

### Files Created/Modified (15 total in steampunk-rescuebarn)

| # | File | Action |
|---|------|--------|
| 1 | `supabase/migrations/014_faq_knowledge_base.sql` | NEW |
| 2 | `scripts/seed-faqs.ts` | NEW |
| 3 | `src/lib/faq/types.ts` | NEW |
| 4 | `src/lib/faq/queries.ts` | NEW |
| 5 | `src/app/admin/faq/page.tsx` | NEW |
| 6 | `src/app/admin/faq/faq-admin.tsx` | NEW |
| 7 | `src/app/admin/faq/[id]/page.tsx` | NEW |
| 8 | `src/app/admin/faq/[id]/faq-entry-editor.tsx` | NEW |
| 9 | `src/app/admin/faq/categories/page.tsx` | NEW |
| 10 | `src/app/admin/faq/categories/faq-categories-admin.tsx` | NEW |
| 11 | `src/app/admin/faq/analytics/page.tsx` | NEW |
| 12 | `src/app/admin/faq/analytics/faq-analytics.tsx` | NEW |
| 13 | `src/app/faq/page.tsx` | REPLACED |
| 14 | `src/app/faq/faq-accordion.tsx` | NEW |
| 15 | `src/app/api/faq/chat/route.ts` | NEW |
| 16 | `src/components/faq/faq-agent.tsx` | NEW |
| 17 | `src/components/faq/faq-agent-button.tsx` | NEW |
| 18 | `src/components/faq/faq-chat-panel.tsx` | NEW |
| 19 | `src/app/layout.tsx` | MODIFIED |
| 20 | `src/app/admin/layout.tsx` | MODIFIED |

Plus in steampunk-strategy:
| 21 | `docs/handoffs/_working/20260308-faq-knowledge-base-working-spec.md` | NEW |
| 22 | `docs/roadmap-archive.md` | MODIFIED |

### Acceptance Criteria Evidence

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Migration runs clean | PASS | 3 tables, RLS on all 3, 4 indexes |
| 2 | Seed ≥25 entries | PASS | 30 entries across 7 categories |
| 3 | Admin CRUD | PASS | List, edit, create, delete, bulk publish/unpublish |
| 4 | Analytics | PASS | Conversation list with escalation filter, stats cards |
| 5 | Public accordion | PASS | Database-driven, grouped by category, client-side search |
| 6 | Chat widget | PASS | Floating bubble bottom-right, slides up to 380x500 panel |
| 7 | FAQ-grounded answers | PASS | System prompt restricts to FAQ KB, Claude Haiku |
| 8 | Graceful escalation | PASS | "don't have that info" + email link |
| 9 | Conversation logging | PASS | faq_conversations table, thumbs up/down feedback |
| 10 | Rate limiting | PASS | 10 msg/5 min per session_id |
| 11 | tsc --noEmit | PASS | Zero errors |
