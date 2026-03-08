# NEWS-1: Newsletter Foundation — Working Spec

**Handoff ID:** `20260307-newsletter-foundation`
**Date:** 2026-03-07
**Tier:** 3
**Status:** IN PROGRESS
**Repos:** steampunk-rescuebarn (primary), steampunk-postmaster (secondary)

## Scope

Build the foundation for Steampunk Farms newsletter system:

### Rescue Barn (Primary)
1. Schema upgrade: subscriber preferences, unsubscribe tokens, newsletter_issues, newsletter_send_log
2. HTML email templates: weekly dispatch, monthly letter, seasonal publication + shared components
3. Send pipeline: batch send via Resend with personalization
4. Unsubscribe handling: public page + API
5. Subscriber admin page with stats and issue list
6. Newsletter issue CRUD API
7. Cogworks posts + comments APIs for Postmaster content ingestion

### Postmaster (Secondary)
1. NewsletterDraft Prisma model
2. Cross-site content ingestion library
3. Newsletter dispatch helper (creates issues on Rescue Barn)
4. Editorial review page

## Sanity Deltas

(To be filled during implementation)

## Discovery Notes

(To be filled by Sanity Pass agents)
