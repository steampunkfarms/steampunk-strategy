# TIER 3 HANDOFF: EIP Phase 3 — Donor Experience Integration (Cross-Site Impact Consumers)

**Handoff ID:** `20260312-eip-phase3-donor-experience-integration`
**Tier:** 3 — Strategic (cross-site, 4 repos)
**Author:** CChat (Strategist)
**Date:** 2026-03-12
**Depends on:** EIP Phase 1 (20260312-eip-phase1-allocation-enrichment) must be complete — programs deduped, transactions allocated, enrichment UI live.

---

## Strategic Context

The Impact API is live. 314 transactions are allocated across 8 programs. 20 ProductSpeciesMap entries provide species-level enrichment. The API serves both authenticated (internal TARDIS users) and public-scope consumers. Now it's time to wire this data into the three consumer sites that will actually surface impact to donors, content creators, and the public.

This is the handoff that turns internal financial data into external transparency and donor experience.

---

## Data Flow Map

```
                          ┌──────────────────┐
                          │      TARDIS       │
                          │   Impact API      │
                          │ /api/impact/{slug} │
                          └───────┬──────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │    Studiolo      │ │   Postmaster    │ │   Rescue Barn   │
    │ Donor Dashboard  │ │ Impact Digest   │ │ Public Programs │
    │ "Your $ at work" │ │ Content Engine  │ │ Transparency    │
    │                  │ │                 │ │                  │
    │ Bearer auth      │ │ Bearer auth     │ │ scope=public    │
    │ (internal)       │ │ (internal)      │ │ (no auth)       │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Auth Pattern Summary

| Consumer | Auth Method | Scope | What It Gets |
|----------|-----------|-------|-------------|
| Studiolo | `Authorization: Bearer ${INTERNAL_SECRET}` | Full (default) | Everything including recent transactions, vendor slugs, notes, donor attribution |
| Postmaster | `Authorization: Bearer ${INTERNAL_SECRET}` | Full (default) | Same — needs transaction-level detail for content generation grounding |
| Rescue Barn | No auth header | `?scope=public` | Stripped response — no transaction IDs, no vendor slugs, no notes. Public-safe. |

The `INTERNAL_SECRET` env var is already shared across TARDIS, Studiolo, and Postmaster (same Azure AD app registration family). Rescue Barn uses the public scope and doesn't need the secret.

---

## Per-Repo Handoff Specs

---

### Repo 1: steampunk-studiolo (Donor Dashboard Integration)

**Tier:** 2 (within this repo)
**Anchor:** Donor detail page — "How Your Giving Helps" section

#### What Exists
- Donor detail pages at `/donors/[id]`
- Gift history, touch log, narrative snapshot, affinity data already rendered
- `lib/` has cross-site patterns for Postmaster, Cleanpunk, Meta — but NO `tardis.ts` yet
- `app/api/internal/` has authenticated endpoints consumed by TARDIS and Postmaster

#### What to Build

**1. `lib/tardis.ts` — Cross-site TARDIS fetcher**

Follow the same pattern as Rescue Barn's `src/lib/tardis.ts` but with Bearer auth:

```typescript
const TARDIS_API_URL = process.env.TARDIS_API_URL ?? 'https://tardis.steampunkstudiolo.org'

export interface ProgramImpact {
  program: { id: string; name: string; slug: string; description: string | null; species: string[] }
  period: { label: string; start: string; end: string }
  summary: { totalSpend: number; transactionCount: number }
  breakdown: {
    byCategory: Array<{ name: string; amount: number; count: number }>
    byVendor: Array<{ name: string; amount: number; count: number }>
  }
  species: {
    list: string[]
    productMappings: Array<{ product: string; species: string[]; notes: string | null }>
  }
  costTracker: Array<{
    item: string; itemGroup: string | null; vendorName: string
    avgUnitCost: number; totalQuantity: number; unit: string; entries: number
  }>
  recentTransactions?: Array<{
    id: string; date: string; description: string; amount: number
    vendor: string | null; category: string | null
  }>
  donorAttribution?: {
    donorId: string; poolTotal: number; donorGiving: number; attributedAmount: number
  } | null
}

export async function fetchProgramImpact(
  programSlug: string,
  options?: { period?: string; donorId?: string }
): Promise<ProgramImpact | null> {
  const secret = process.env.INTERNAL_SECRET
  if (!secret) { console.error('[tardis] INTERNAL_SECRET not configured'); return null }

  const params = new URLSearchParams()
  if (options?.period) params.set('period', options.period)
  if (options?.donorId) params.set('donorId', options.donorId)

  try {
    const res = await fetch(
      `${TARDIS_API_URL}/api/impact/${programSlug}?${params}`,
      {
        headers: { 'Authorization': `Bearer ${secret}` },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) return null
    return (await res.json()) as ProgramImpact
  } catch { return null }
}

export async function fetchAllProgramImpacts(
  period?: string
): Promise<ProgramImpact[]> {
  const slugs = [
    'swine', 'cats-dogs', 'cluck-crew',
    'sanctuary-operations', 'soap-mercantile',
    'fundraising', 'barn-cats', 'general-herd'
  ]
  const results = await Promise.allSettled(
    slugs.map(s => fetchProgramImpact(s, { period }))
  )
  return results
    .filter((r): r is PromiseFulfilledResult<ProgramImpact | null> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter((r): r is ProgramImpact => r !== null)
}
```

**2. `components/donors/impact-summary.tsx` — Donor Impact Card**

A server component rendered on the donor detail page. Shows:

- For each program the donor has given to (via gift allocation data): program name, the donor's attributed spend, species helped, top expense categories
- Period selector: current quarter, last quarter, YTD, full year
- If the donor has given to the general fund (undesignated), show a proportional attribution across all programs based on general fund allocation percentages

**Design:** Follow existing Studiolo card patterns (`console-card` class). Blue/brass TARDIS aesthetic where it crosses into financial data territory.

**3. Wire into donor detail page**

Add the ImpactSummary component to the donor detail page layout. Place it after the gift history section and before the touch log. It should gracefully degrade to hidden if TARDIS is unreachable or the donor has no allocated gifts.

#### Env Vars Needed

- `TARDIS_API_URL` — already should be set (check). If not: `https://tardis.steampunkstudiolo.org`
- `INTERNAL_SECRET` — already shared across the family

#### Files to Create/Modify

| Action | File |
|--------|------|
| CREATE | `lib/tardis.ts` |
| CREATE | `components/donors/impact-summary.tsx` |
| MODIFY | Donor detail page (wire in ImpactSummary) |

#### Acceptance Criteria

1. `lib/tardis.ts` fetches from TARDIS Impact API with Bearer auth
2. Donor detail page shows program impact data for the current period
3. Species enrichment displayed per program
4. Graceful fallback if TARDIS is down (card hidden, no error visible to user)
5. `npx tsc --noEmit` passes clean

---

### Repo 2: steampunk-postmaster (Impact Digest Content Generation)

**Tier:** 2 (within this repo)
**Anchor:** Content generation pipeline — new "Impact Digest" generation type

#### What Exists
- Content generation routes at `/api/generate/*` (dear-humans, wishlist-wednesday, moostik, etc.)
- Each generator pulls context (resident data, voice rules, etc.) and produces Claude-authored content
- `app/api/internal/bi-metrics` exists for TARDIS consumption (Postmaster → TARDIS direction)
- No `lib/tardis.ts` exists — Postmaster has never consumed TARDIS data, only served it

#### What to Build

**1. `lib/tardis.ts` — Cross-site TARDIS fetcher**

Same pattern as Studiolo's but scoped to what Postmaster needs (program summaries for content grounding, not donor-level attribution):

```typescript
export async function fetchProgramImpact(
  programSlug: string,
  period?: string
): Promise<ProgramImpact | null> { /* Bearer auth, full scope */ }

export async function fetchImpactDigestContext(
  period?: string
): Promise<ImpactDigestContext> {
  // Fetch all programs, aggregate into content-ready summary:
  // - Total sanctuary spend for period
  // - Per-program highlights (top expense, species helped, notable purchases)
  // - Cost tracker items suitable for storytelling ("We bought 450 lbs of feed this quarter")
}
```

**2. `app/api/generate/impact-digest/route.ts` — Impact Digest Generator**

A new content generation route that produces donor-facing impact narrative content. This is the "how your donations are being spent" story, written in Padrona Voice, grounded in real financial data from TARDIS.

**Input:** Period (quarter or month), optional program focus
**Output:** Newsletter-ready narrative content with specific numbers, species mentions, and purchase highlights

**Claude prompt structure:**
- System: Padrona Voice guidelines + HUG compliance rules
- Context: Full ImpactDigestContext from TARDIS (spend by program, species, notable purchases)
- Instruction: "Write a warm, transparent update for our supporters about how their donations were used this quarter. Ground every claim in the data provided. Mention specific animals by species. Include real dollar amounts and purchase details. Tone: grateful, specific, honest."

**3. Wire into newsletter/content pipeline**

Add "Impact Digest" as a generation type available from the Postmaster content dashboard. The generated content can be:
- Inserted into the monthly narrative newsletter (the Atelier Lane cadence)
- Posted as a standalone Cogworks blog entry
- Used as grounding material for social media storms

#### Env Vars Needed

- `TARDIS_API_URL` — add to Postmaster Vercel env: `https://tardis.steampunkstudiolo.org`
- `INTERNAL_SECRET` — should already exist (verify)

#### Files to Create/Modify

| Action | File |
|--------|------|
| CREATE | `lib/tardis.ts` |
| CREATE | `app/api/generate/impact-digest/route.ts` |
| MODIFY | Content generation UI (add Impact Digest option) |

#### Acceptance Criteria

1. `lib/tardis.ts` fetches from TARDIS Impact API with Bearer auth
2. Impact Digest generator produces narrative content grounded in real TARDIS data
3. Generated content includes specific dollar amounts, species, and purchase details
4. Content passes HUG compliance (warm, non-transactional, no hard asks)
5. Available as a generation type from the Postmaster dashboard
6. Graceful fallback if TARDIS is down (generator returns error message, doesn't crash)
7. `npx tsc --noEmit` passes clean

---

### Repo 3: steampunk-rescuebarn (Public Programs + Transparency)

**Tier:** 2 (within this repo)
**Anchor:** Programs page — public-facing impact display

#### What Exists
- `src/lib/tardis.ts` — **ALREADY BUILT** with `fetchProgramImpact()` and full `ProgramImpact` type definition. Uses `scope=public`, no auth, 1-hour revalidation.
- `src/lib/postmaster.ts` — cross-site pattern for resident data (established pattern)
- Programs page structure TBD — may or may not exist yet

#### What to Build

**1. `src/components/programs/impact-display.tsx` — Public Impact Component**

Server component that renders a program's impact data in a public-friendly format:

- Program name and description
- Total spend for the period (formatted as "This quarter, $X,XXX went directly to [program name]")
- Category breakdown as a simple visual (bar chart or proportional blocks)
- Species helped (rendered as animal icons or badges)
- Product highlights from CostTracker ("450 lbs of pig feed, 200 lbs of chicken scratch")
- **No transaction IDs, vendor slugs, or internal notes** — the public scope already strips these

**Design:** Match Rescue Barn's existing aesthetic (if established), or follow the steampunkfarms.org visual language.

**2. Program detail pages**

If program detail pages don't exist yet, create them at `/programs/[slug]`. Each page:
- Fetches impact data from TARDIS via the existing `fetchProgramImpact()`
- Fetches relevant residents from Postmaster via `fetchResidentsByBarnArea()` or species filter
- Renders the ImpactDisplay component
- Shows a grid of residents in that program (e.g., pig program → shows all pigs)
- Links to the sanctuary's donation page with the program pre-selected

If program pages already exist, add the ImpactDisplay component to them.

**3. "The Fine Print" Transparency Section**

A dedicated transparency page (or section on an existing page) that aggregates all programs:
- Total sanctuary operating cost for the current period
- Per-program spend as a percentage of total
- Simple pie or bar chart visualization
- Link to each program's detail page
- Footer note: "Financial data updated quarterly from our internal management system."

#### Env Vars Needed

- `TARDIS_API_URL` — verify it's set in Rescue Barn's Vercel env

#### Files to Create/Modify

| Action | File |
|--------|------|
| VERIFY | `src/lib/tardis.ts` (already exists) |
| CREATE | `src/components/programs/impact-display.tsx` |
| CREATE or MODIFY | `src/app/programs/[slug]/page.tsx` |
| CREATE or MODIFY | Transparency page/section |

#### Acceptance Criteria

1. Program detail pages render impact data from TARDIS
2. Species badges/icons shown per program
3. Cost tracker highlights rendered in human-friendly format
4. Resident grid pulls from Postmaster for the relevant program
5. No sensitive data visible (transaction IDs, vendor slugs, notes stripped by public scope)
6. Graceful fallback if TARDIS is down (show program info without financial data)
7. `npx tsc --noEmit` passes clean

---

### Repo 4: steampunk-strategy (TARDIS — Minor Enhancements)

**Tier:** 1 (minor API additions)
**Anchor:** Impact API route

#### What to Build

**1. Multi-program summary endpoint**

The current API only serves one program at a time. Studiolo and Postmaster both need all-programs-at-once data. Rather than making 8 sequential requests, add a batch endpoint:

`GET /api/impact?period=2026-Q1&scope=public`

(No `[programSlug]` in the path = return all programs.)

Returns an array of program impact summaries in a single response. This dramatically reduces cross-site latency (1 request vs 8).

**2. Donor attribution hydration**

The `donorAttribution` field in the response is currently a placeholder returning zeros. For the Studiolo integration to work, this needs to be hydrated:

- Accept `donorId` query param
- Look up the donor's gifts in Studiolo (via cross-site fetch or local allocation data)
- Calculate: `attributedAmount = (donorGiving / poolTotal) * programSpend`
- Return the attribution in the response

This may require a cross-site call back to Studiolo to get the donor's gift totals, OR it may be calculable from local allocation data if gifts are synced. **Check what allocation data exists locally before adding a cross-site dependency.** If gifts aren't synced to TARDIS, this becomes a Studiolo-side calculation instead.

**3. Cache layer (optional, recommended)**

The impact API does multiple Prisma queries per request. With 3 consumers potentially hitting it frequently, consider adding a simple in-memory cache or ISR-style revalidation:

```typescript
// Cache impact data for 15 minutes per program+period combo
const cache = new Map<string, { data: unknown; expiry: number }>()
```

#### Files to Create/Modify

| Action | File |
|--------|------|
| CREATE | `app/api/impact/route.ts` (batch endpoint, no `[programSlug]`) |
| MODIFY | `app/api/impact/[programSlug]/route.ts` (donor attribution hydration) |

---

## Execution Order

This is Tier 3, so CChat designs (done — this document) and CC executes. Recommended order:

```
Phase 3a: TARDIS batch endpoint + donor attribution
    ↓
Phase 3b: Rescue Barn ImpactDisplay + program pages
    (can start in parallel — uses existing tardis.ts + public scope)
    ↓
Phase 3c: Studiolo lib/tardis.ts + donor impact card
    (depends on 3a for donor attribution)
    ↓
Phase 3d: Postmaster lib/tardis.ts + Impact Digest generator
    (depends on 3a for batch endpoint)
```

Phases 3a and 3b can run in parallel. 3c and 3d depend on 3a.

---

## Cross-Site Verification Checklist

Before marking Phase 3 complete:

- [ ] TARDIS batch endpoint returns all programs in one request
- [ ] TARDIS donor attribution returns non-zero values for donors with allocated gifts
- [ ] Rescue Barn renders public impact data on program pages
- [ ] Studiolo donor detail page shows impact summary for donors with gifts
- [ ] Postmaster Impact Digest generator produces grounded narrative content
- [ ] All 4 repos pass `npx tsc --noEmit`
- [ ] CORS headers allow cross-site requests from all family domains
- [ ] Public scope endpoints return no sensitive data (spot-check response payloads)
- [ ] Graceful degradation: each consumer works normally when TARDIS is unreachable

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| TARDIS downtime breaks consumer sites | Low | Medium | All consumers use graceful fallback (hidden card / error message) |
| Stale data in cached responses | Low | Low | 1-hour revalidation for public, 15-min cache for internal |
| Donor attribution math is wrong | Medium | High | Unit test the attribution calculation; compare to manual spot-check |
| Species data is incomplete | Low | Low | ProductSpeciesMap is additive; missing maps just show fewer species |
| Rate limiting from multiple consumers | Low | Low | Batch endpoint reduces request count from 24/consumer to 3/consumer |

---

## Notes for CC

- Rescue Barn is the easiest win — `tardis.ts` already exists, just needs the component and page. Start here for a quick confidence-builder.
- Studiolo's `lib/tardis.ts` should follow the same type definitions as Rescue Barn's but add the `recentTransactions` and `donorAttribution` fields (which are stripped in public scope but present in authenticated scope).
- The Postmaster Impact Digest is the most creative piece — the content generation prompt needs careful crafting to produce warm, HUG-compliant copy that reads like Padrona wrote it, not a financial report. Reference the voice engine patterns in `lib/voice-engine/` and the existing generators in `app/api/generate/`.
- The 8 canonical program slugs are: `swine`, `cats-dogs`, `cluck-crew`, `sanctuary-operations`, `soap-mercantile`, `fundraising`, `barn-cats`, `general-herd`. Confirmed after Phase 1 dedup (2026-03-12).
- TARDIS CORS already allows `steampunkfarms.org`, `steampunkrescuebarn`, and `localhost`. Verify Studiolo and Postmaster origins are also allowed, or add them to the `setCorsHeaders` function.
