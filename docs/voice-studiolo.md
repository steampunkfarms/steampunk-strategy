# Studiolo Voice Architecture

> How AI-composed donor communications are shaped and constrained.
> Source code: `steampunk-studiolo/lib/voice-engine/` and `lib/compose-voice.ts`
> Last updated: 2026-02-28

---

## 5-Layer Prompt Stack

All AI composition calls use `buildPromptStack()` from `lib/voice-engine/index.ts`:

**Layer 1 — Universal Voice Guardrails** (`guardrails.ts`, shared with Postmaster)
The bedrock. Establishes sanctuary-not-farm identity. Full prohibition list:

*Never do:*
- Recite giving statistics mid-paragraph (fold into a lived moment instead)
- Mass-mailer phrases: "supporters like you", "your generous support", "make a difference", "we couldn't do it without you", "on behalf of all of us", "your journey"
- Urgency/guilt: "we desperately need", "without your help", "time is running out", "act now", "they're counting on you"
- Stack gratitude adjectives ("your generous, incredible, amazing support")
- Narrate the donor's story back to them as a case study
- Reference cumulative impact in sweeping unfalsifiable terms
- Close with "Thank you from me, the team, and all the animals"
- Use the word "journey" in any context
- Use "please donate" unless explicitly an ASK-type template
- Surface bracket-notation content in output
- Fabricate caretaker names or animal health conditions
- Farm/breeding/livestock/production language of any kind

*Always do:*
- **Closing Line Protocol:** End with real people + real animals from roster. Vary structure. Never repeat patterns.
- **Gift Reference Protocol:** Embed gifts in moments, not facts ("when your gift came through, I was doing hay math")
- **Animal Currency Protocol:** Lead with the animal's CURRENT moment from Chronicle, not backstory
- **Frontier Correspondence Voice:** Hand-written letter cadence. Unhurried, specific, warm without performing warmth. Short sentences OK. Start with "And" or "But." Coffee gone cold.
- **Specificity Over Sentiment:** One concrete sensory detail > three lines of sentiment
- **Sprezzatura:** Effortless grace. If it feels like it's trying too hard, simplify.

---

**Layer 2 — Studiolo Platform Context** (`platform-context.ts`)
Sets the voice as Krystal (Padrona / Curatrice Prima). Key rules:
- Subject lines: short, personal, under 50 chars, never use "Donation"/"Gift"/"Tax"
- Sign-off always as Krystal, never "The Steampunk Farms Team"
- Intelligence usage: memory cues (`[ANIMAL_BOND:...]`, `[SPECIES_AFFINITY:...]`, `[DESIGNATION_HINT:...]`, `[RELATIONSHIP:...]`) woven naturally
- PayPal fees: never draw attention to fee differences between platforms
- Zeffy savings: one sentence max, never name Zeffy
- Social comments: one natural reference max per message, never quote verbatim

**Layer 3 — Template/Series Instructions** (from `compose-voice.ts`)
Five dispatch types, each with length, structure, tone, and purpose constraints:

| Type | Label | Length | Purpose |
|------|-------|--------|---------|
| BOLLETTINO | Quick Update | 100-200w | Daily barn life, keep donor connected |
| NOTIZIARIO | Announcement | 200-350w | Milestones, new residents, events |
| INFORMATIVA | Educational | 200-350w | Care insights, sanctuary operations |
| EPISTOLA | Personal Letter | 250-400w | Gratitude, relationship deepening |
| DISPACCIO_PRIVATO | Private Note | 100-250w | Sensitive: payment issues, lapse, check-ins |

Eight moods available: warm, joyful, grateful, reflective, celebratory, tender, urgent, lighthearted.

**Layer 4 — Donor Context** (`context-assembler.ts`)
`buildDonorContextBlock()` assembles: donor identity, giving history (lifetime, trend, unthanked gifts), recent touches, reply history, animal connections, survey intelligence, Cleanpunk shop behavior, Patreon tier, recovery context, and sanctuary events. Injected as user message, not system prompt.

**Layer 5 — User Intent** (bracket-parsed via `bracket-parser.ts`)
Krystal's freeform notes. Bracket notation `[like this]` is extracted as meta-instructions for the AI (context about relationships, corrections, private details) and never surfaced in output. The parser also handles spatial/temporal logic: if an animal is described as "taken home," the AI must not place it at the barn.

---

## Closing Line System

`closing-lines.ts` + `closing-patterns.json` (32 pattern variants):

1. Selects a random pattern, avoiding recently used ones for this donor
2. Picks 1-2 animals (prioritizing donor's known animal interests)
3. Picks 1-2 caretakers
4. Injects pattern + animal Chronicle data + caretaker names as AI instruction
5. AI composes the actual closing using current behavioral details

Animals are selected from the Postmaster public API roster (cached 1hr via `fetchPostmasterContext()`).

---

## Cross-System Voice Inheritance

The `UNIVERSAL_VOICE_GUARDRAILS` constant is **identical** in both Studiolo and Postmaster `voice-engine/guardrails.ts`. Postmaster also has a copy in its own `lib/voice-engine/`. Any change to the guardrails must be synchronized across both codebases.

The `POSTMASTER_PLATFORM_CONTEXT` also exists in both codebases (Studiolo's `platform-context.ts` exports both Studiolo and Postmaster contexts). This is used when Studiolo's voice engine is called with `platform: 'postmaster'` — which allows Studiolo to generate Postmaster-style content if needed.

---

## Compose Entry Points

Three composition surfaces feed through the voice engine:

| Surface | Route | Notes |
|---------|-------|-------|
| **Personal Compose** | `/api/compose/draft` | Single donor, free-form with dispatch type + mood |
| **Scriptorium** | `/api/scriptorium/ai-assist` | Template-driven, reusable dispatch templates |
| **Bulk Compose** | `/api/bulk-compose/schedule` | Campaign-level, audience-filtered, per-donor personalization |

All three auto-inherit guardrails. Opus-lane donors never receive automated messages — they trigger `AttentionQueueItem` alerts instead.

---

## Key Conventions for Development

1. **Guardrail changes require sync.** Both repos have their own `voice-engine/guardrails.ts`. Keep them identical.
2. **Opus donors are sacred.** Never automate communications to Lane B donors. Always route to attention queue.
3. **Bracket notation is stage direction.** Never surface `[...]` content in generated output.
4. **Recovery touches require extreme care.** Never use "failed", "overdue", "delinquent", or "past due". Frame as "snag" or "hiccup" at most.
5. **Context assembler is the single source** for animal/caretaker data injection. Don't fetch Postmaster data elsewhere.
6. **Closing patterns rotate per donor.** Track `previousClosings` to avoid repetition.
