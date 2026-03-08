# CHRON-1: Caretaker Chronicle System — Working Spec

**Handoff ID:** 20260307-caretaker-chronicle
**Status:** In Progress
**Target Repos:** steampunk-postmaster (primary), steampunk-rescuebarn, steampunk-studiolo, steampunk-strategy

## Scope

Voice + SMS + omnipresent button chronicle system across all 4 admin sites. JournalEntry model in Postmaster, Twilio SMS gateway, OpenAI Whisper transcription, Claude auto-tagging, ChronicleButton on every admin page with local auth proxies.

## Sanity Deltas

1. **No JournalEntry model exists** — codebase has CaretakerJournal + AnimalChronicle. Creating NEW JournalEntry model to avoid breaking existing relations used by NEWS-1 content ingestion.
2. **Prisma named export** — spec uses `import prisma from '@/lib/prisma'`, actual is `import { prisma } from '@/lib/prisma'`. Correcting all imports.
3. **Rescue Barn admin layout is server component** — ChronicleButton is client component. Adding via client wrapper.
4. **TARDIS/Studiolo/RescueBarn all need proxy pattern** — INTERNAL_SECRET is server-only. Each site gets /api/chronicle/proxy.
5. **Postmaster layout is client component** — can embed ChronicleButton directly, uses session auth (no secret needed).
6. **Rescue Barn .env.example already has POSTMASTER_URL** — no NEXT_PUBLIC_ prefix needed since proxy handles it server-side.
7. **AnimalResident relation** — spec wants residentId -> AnimalResident. This relation exists in codebase, just needs adding to new model.
8. **Json vs String[] for tags** — existing models use String[] for tags. Spec uses Json. Using Json to match spec (allows richer AI tag data).
9. **Studiolo Sidebar** — lives in components/ui/sidebar.tsx, imported by protected layout. Button goes in layout directly.
10. **TARDIS layout** — client component with inline sidebar. Button goes directly in layout.
