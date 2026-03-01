# Postmaster Voice Architecture

> How AI-generated content is shaped and constrained across all content series.
> Source code: `steampunk-postmaster/lib/claude/` and `lib/voice-engine/`
> Last updated: 2026-02-28

---

## Prompt Layer Architecture

All content generation uses a layered system prompt assembled by `buildSystemPrompt()` in `lib/claude/promptLayers.ts`:

**Layer 1 — Universal Guardrails** (`lib/voice-engine/guardrails.ts`)
Identical across Postmaster and Studiolo. Establishes sanctuary identity (NOT a production farm), prohibits farm/breeding/livestock language, bans mass-mailer phrases, bans urgency/guilt language, bans stacked adjectives, requires specific behavioral closings with real animals. See `voice-studiolo.md` for the full guardrail inventory — it's the same `UNIVERSAL_VOICE_GUARDRAILS` constant.

**Layer 2 — Postmaster Platform Context** (`lib/voice-engine/platform-context.ts`)
Sets the content engine identity: posts are generated from human anchor text, split into fragments by role, rendered per-platform. Enforces content discipline: one action per cycle (Shop/Donate/Subscribe), never all three. Requires current Chronicle data for animal references.

**Layer 2b — Series Voice** (DB-backed via `VoiceConfig` model, fallback to hardcoded `VOICE_REGISTRY`)
Each content series has a full character profile: personality, tone rules, voice arc, signature phrases, and what the character never does. Loaded from the `VoiceConfig` Prisma table first; falls back to constants in `lib/claude/prompts/[series].ts` during migration.

**Dynamic Context Injection:**
- Animal roster, caretaker roster, and chronicle entries via `getAnimalContext()`, `getCaretakerContext()`, `getChronicleContext()` from `lib/residentContext.ts`
- Sign-off patterns from `VoiceConfig.signOffPattern`
- Ambassador-specific voices for rotating series (Wishlist Wednesday)

---

## Content Series Voice Inventory

Each series has a dedicated prompt file in `lib/claude/prompts/`:

| Series | File | Character | Pattern |
|--------|------|-----------|---------|
| Moostik Monday | (hardcoded in promptLayers) | Pearl the dairy cow | Weekly zodiac advocacy: 1 anchor + 12 signs + storm closer |
| Dear Humans | `dear-humans.ts` | k'Roo the goat | Weekly avoidance letters: anchor + 11 angles + k'Roo's Gate |
| Chance's Ante | (in generate route) | Chance the pig | Campaign: 13 poker-narrative beats over 5-7 days |
| Wishlist Wednesday | `wishlist-wednesday.ts` | Rotating ambassadors (14) | Weekly: anchor + item narrations + directory + gratitude |
| Wisdom in the Margins | `wisdom-margins.ts` | Prof. Harold von Wisdom | Variable: punctuation mark → life lesson |
| Collection Drop | `collection-drop.ts` | Per-ambassador | Product storm: feature posts + collection closer |
| Soap Drop | `soap-drop.ts` | Per-ambassador | Product storm: story angles + soap closer |
| One-Off Storm | `one-off-storm.ts` | Configurable | Generic product storm |

**Voice arc pattern** (consistent across series): Each character follows a defined emotional trajectory. Example for k'Roo: Playful Opening → Detailed Observation → The Turn → Avoidance Critique → The Imagine → The Ask → Warm Close.

---

## HUG Compliance Validation

`validateHugCompliance()` in `client.ts` post-processes all generated content:

**Banned phrases** (exact match): "we desperately need", "without your help", "time is running out", "only you can", "every dollar counts", "make a difference today", "they're counting on you"

**Urgency patterns** (regex): urgently need, last chance, act now, don't wait, hurry

**Sanctuary violations** (regex): baby goats, newborn, kidding season, calving, farrowing, lambing, livestock, head of cattle, egg production, milking schedule, breeding program, born here/at the barn

**Exclamation limit:** Max 1 per post.

---

## Platform Formatting Pipeline

All output passes through `cleanForPlatform()`:
- **Facebook:** `markdownToUnicode()` converts **bold** and *italic* to Unicode math chars (𝗯𝗼𝗹𝗱/𝘪𝘵𝘢𝘭𝘪𝘤)
- **Patreon / Bray Blog:** Markdown preserved as-is
- **All other platforms:** Stripped to plain text (emoji + line breaks only)

---

## UTM Attribution

`tagClosingUrls()` auto-appends 5 UTM params to all outbound Steampunk Farms URLs. CTAs are hardcoded per platform/series in `ctaUtils.ts` — never AI-generated.

---

## Key Conventions for Development

1. **Never let AI generate CTAs or URLs.** These are always hardcoded per series/platform.
2. **VoiceConfig DB takes priority** over hardcoded constants. The registry is a migration fallback.
3. **One support pathway per cycle** — if the anchor text mentions the shop, all fragments in that storm use shop CTAs.
4. **Fragment roles are fixed per series.** The role enum (66 values) determines which piece of the storm each fragment serves.
5. **Two-phase generation** prevents timeout: Phase 1 generates fragments, Phase 2 renders per-platform. Never combine.
6. **Bracket notation** (`[meta-instructions]`) in anchor text is parsed out and injected as AI context, never surfaced in output.
