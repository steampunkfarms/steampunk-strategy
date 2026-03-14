
Handoff Spec: WARM-2 — Template System + Email Templates
Date: 2026-03-10 Tier: 2 (Standard — new library code, no live behavior change) Status: Ready for CC Repos: steampunk-studiolo Working Spec: steampunk-strategy/docs/handoffs/_working/20260310-atelier-warm-touch-escalation-working-spec.md Depends on: WARM-1 (schema fields must exist) Blocks: WARM-3, WARM-4

Summary
Build the template selection system and five email template modules for the Atelier Warm-Touch Enhancement. All new files — the existing buildThankYouEmail() function and send pipeline remain untouched. This phase can be reviewed and unit-tested in isolation before WARM-3 wires it into the live pipeline.

Target Repo
steampunk-studiolo

Context
Currently lib/atelier/thank-you-email.ts has a single fixed template with 4 merge fields. This phase creates the template-aware replacement system alongside it without disturbing the running pipeline. The escalation working spec (§3, §5) defines the gap and the selection logic.

Key design decisions (from CChat review):

Templates are code-level in lib/atelier/email-templates/, not stored in the Scriptorium DB. Simpler, no UI dependency, deploy-controlled.
No emoji in subject lines — Studiolo voice avoids emoji in formal correspondence.
No new AnimalBlurb model — use existing cleanpunkAnimalAffinities string array + enhanced hardcoded species one-liners (option c from escalation §7.3).
Both in-body IRS tax text AND PDF attachment (not one or the other).
Files Affected
#	File	Action	Details
1	lib/atelier/email-templates/types.ts	Create	TemplateKey type, AcknowledgmentVariables interface, TemplateSelectionInput interface, TemplateOutput interface
2	lib/atelier/email-templates/select-template.ts	Create	selectTemplate() function — maps donor/gift context to TemplateKey
3	lib/atelier/email-templates/build-variables.ts	Create	buildAcknowledgmentVariables() — assembles full variable set from Gift + Donor records
4	lib/atelier/email-templates/first-time.ts	Create	Welcome template (HTML + plain text) for first-time donors
5	lib/atelier/email-templates/returning.ts	Create	Returning donor template — warm, references giving history
6	lib/atelier/email-templates/recurring.ts	Create	Brief monthly update — respectful of inbox for recurring donors
7	lib/atelier/email-templates/significant.ts	Create	Elevated acknowledgment for gifts above threshold
8	lib/atelier/email-templates/backfill.ts	Create	Delay-aware template — turns lateness into a feature
9	lib/atelier/email-templates/impact-line.ts	Create	Amount-based tangible impact statement generator
10	lib/atelier/email-templates/animal-blurb.ts	Create	Species one-liners extracted from thank-you-email.ts:15-24, enhanced with additional species
11	lib/atelier/email-templates/tax-receipt-block.ts	Create	Shared IRS-compliant text block for email body
12	lib/atelier/email-templates/index.ts	Create	Barrel export — buildAcknowledgmentEmail(templateKey, variables) → {subject, htmlBody, textBody}
Risk & Reversibility
No risk. All new files — existing pipeline untouched. Reversibility: 10/10 (delete the directory).

Architecture
Template Selection Logic

// lib/atelier/email-templates/select-template.ts
type TemplateKey = 'first-time' | 'returning' | 'recurring' | 'significant' | 'backfill';

interface TemplateSelectionInput {
  donor: {
    totalGiftCount: number;
    recurringStatus: string | null;   // "Active", etc.
    firstGiftDate: Date | null;
    pipelineLane: string | null;      // 'O' = Opus
  };
  gift: {
    amount: number;
    frequency: string | null;         // 'Monthly', etc.
  };
  significantThreshold: number;       // from AppSetting, default 100
  isBackfill?: boolean;               // true when called from WARM-4 backfill route
}

function selectTemplate(input: TemplateSelectionInput): TemplateKey {
  if (input.isBackfill) return 'backfill';
  if (input.gift.amount >= input.significantThreshold) return 'significant';
  if (input.gift.frequency === 'Monthly' || input.donor.recurringStatus === 'Active') return 'recurring';
  if (input.donor.totalGiftCount <= 1) return 'first-time';
  return 'returning';
}
Subject Lines (no emoji)
Template Key	Subject Line
first-time	Thank you, {{donorFirstName}} — welcome to the barn
returning	{{donorFirstName}}, your gift just landed — here's what it's doing
recurring	Your {{month}} gift is at work — quick update from the barn
significant	{{donorFirstName}} — this means more than you know
backfill	A belated thank-you from the barn — and what your gift has been doing
Variable Set

// lib/atelier/email-templates/types.ts
interface AcknowledgmentVariables {
  // From existing buildThankYouEmail params (already available)
  donorFirstName: string;       // donor.firstName ?? donor.acknowledgmentName ?? 'Friend'
  giftAmount: string;           // formatCurrency(gift.amount)
  giftDate: string;             // formatted long date (e.g., "March 10, 2026")
  isBenevity: boolean;          // gift.channel === 'Benevity'

  // From Donor model (already in DB, just not used in emails yet)
  donorFullName: string;        // donor.firstName + ' ' + donor.lastName
  firstGiftDate: string;        // donor.firstGiftDate formatted, or empty
  totalGifts: number;           // donor.totalGiftCount
  lifetimeGiving: string;       // formatCurrency(donor.totalLifetimeGiving)
  giftChannel: string;          // gift.channel display name
  dedicationAnimal: string;     // gift.dedication or empty

  // Generated at render time
  impactLine: string;           // from impact-line.ts — amount-based tangible statement
  animalBlurb: string;          // from animal-blurb.ts — species one-liner based on cleanpunkAnimalAffinities
  taxReceiptBlock: string;      // from tax-receipt-block.ts — IRS-compliant text
  month: string;                // current month name, for recurring template subject
}
Impact Line Examples (amount-based)
The impact-line.ts module maps gift amounts to tangible sanctuary statements. These are illustrative — CC should create a reasonable set:

Amount Range	Example Impact Line
$10–24	Your gift covers a bale of hay that feeds the goat herd for a day.
$25–49	$25 covers a week of grain for Viktor and the other pigs.
$50–99	Your gift pays for a full veterinary wellness check for one of our residents.
$100–249	This covers an entire month of specialized senior-animal supplements.
$250–499	Your generosity funds emergency veterinary care when a resident needs it most.
$500+	A gift like this changes what's possible — it funds the kind of care that keeps a sanctuary running.
Tax Receipt Block (IRS-compliant text)
The tax-receipt-block.ts module returns a text block like:


--- Tax Receipt ---
Steampunk Farms Rescue Barn Inc. is a 501(c)(3) nonprofit organization (EIN: 82-4897930).
This letter serves as your official receipt for tax purposes.
Date of gift: {{giftDate}}
Amount: {{giftAmount}}
No goods or services were provided in exchange for this contribution.
Please retain this receipt for your tax records.
Note: The isQuidProQuo field on the Gift model should be checked — if true, the last line changes to: The estimated fair market value of goods/services provided was $[value]. Your tax-deductible amount is $[amount - value]. For WARM-2, implement the standard case; CC can add the quid-pro-quo variant if the field is populated.

Animal Blurb (extracted + enhanced)
Extract the species one-liners currently hardcoded in lib/atelier/thank-you-email.ts (lines 15-24) into animal-blurb.ts. Enhance with any missing species from the cleanpunkAnimalAffinities vocabulary. The function signature:


function getAnimalBlurb(affinities: string[]): string
If the donor has affinities, pick one at random and return the species-specific one-liner. If no affinities, return a general sanctuary line.

Template HTML Structure
Each template module exports:


interface TemplateOutput {
  subject: string;
  htmlBody: string;    // Must pass through inlineStylesForOutlook() from lib/outlook-html.ts before send
  textBody: string;    // Plain-text fallback
}

export function buildFirstTimeEmail(vars: AcknowledgmentVariables): TemplateOutput;
HTML requirements:

Use inline styles (or structure compatible with inlineStylesForOutlook())
Include the tax receipt block at the bottom of every template
Keep the Studiolo voice: warm, genuine, no corporate speak, no CTAs, no "click here to donate again"
The PDF receipt is attached separately by the send engine — the email body just includes the text block as a complement
Email Barrel Export

// lib/atelier/email-templates/index.ts
import { TemplateKey, AcknowledgmentVariables, TemplateOutput } from './types';

export function buildAcknowledgmentEmail(
  key: TemplateKey,
  vars: AcknowledgmentVariables
): TemplateOutput;
This is the single entry point WARM-3 will call. It routes to the correct template module by key.

Acceptance Criteria
 lib/atelier/email-templates/ directory exists with all 12 files listed above
 selectTemplate() returns correct key for: first-time donor, returning donor, recurring donor, significant gift, backfill scenario
 buildAcknowledgmentVariables() assembles all fields from Gift + Donor Prisma records
 Each of the 5 template modules exports a function returning {subject, htmlBody, textBody}
 buildAcknowledgmentEmail() barrel routes to correct template by key
 impactLine() returns amount-appropriate tangible statement
 getAnimalBlurb() handles: donor with affinities, donor without affinities
 taxReceiptBlock() returns IRS-compliant text with interpolated gift date and amount
 Subject lines match the table above (no emoji)
 HTML is structured for Outlook compatibility (inline styles or inlineStylesForOutlook() compatible)
 No modifications to existing files — all net-new
 npx tsc --noEmit passes in steampunk-studiolo
 Voice check: email copy is warm, genuine, Studiolo-voiced — no CTAs, no "donate again" language, no corporate tone
Implementation Steps
Create lib/atelier/email-templates/types.ts with all interfaces and types.
Create lib/atelier/email-templates/select-template.ts with the selection logic.
Create lib/atelier/email-templates/impact-line.ts with amount-range mapping.
Create lib/atelier/email-templates/animal-blurb.ts — extract species one-liners from lib/atelier/thank-you-email.ts:15-24, enhance with additional species.
Create lib/atelier/email-templates/tax-receipt-block.ts with IRS text block generator.
Create lib/atelier/email-templates/build-variables.ts assembling full variable set.
Create the 5 template modules: first-time.ts, returning.ts, recurring.ts, significant.ts, backfill.ts.
Create lib/atelier/email-templates/index.ts barrel export.
Run npx tsc --noEmit.
CC Execution Prompt

You are working on the steampunk-studiolo repo. Use the following files as your context:

- Unified brain: steampunk-strategy/CLAUDE.md
- Detailed handoff spec: steampunk-strategy/docs/handoffs/20260310-warm2-template-system.md
- Working spec (architectural reference): steampunk-strategy/docs/handoffs/_working/20260310-atelier-warm-touch-escalation-working-spec.md
- Existing thank-you email (extract species one-liners from here): lib/atelier/thank-you-email.ts
- Outlook HTML helper (templates must be compatible): lib/outlook-html.ts
- Voice reference: steampunk-strategy/docs/voice-studiolo.md

Risk & Reversibility: No risk. All net-new files, existing pipeline untouched. Reversibility: 10/10 (delete directory).

Objective: WARM-2 — Build the template selection system and five email template modules for Atelier Warm-Touch Enhancement. All new files in lib/atelier/email-templates/. Do not modify any existing files.

Spec Sanity Pass (mandatory pre-edit step):
Before modifying any files, evaluate this handoff for architectural, brand/voice-ethos, protocol, and cross-site conflicts. If clean, proceed. If conflicts found, produce a Sanity Delta block before continuing.

Steps:
1. Read the handoff spec completely. Read lib/atelier/thank-you-email.ts to understand current template + species one-liners. Read lib/outlook-html.ts to understand HTML requirements. Read docs/voice-studiolo.md for voice guidance.
2. Create lib/atelier/email-templates/types.ts with TemplateKey, AcknowledgmentVariables, TemplateSelectionInput, and TemplateOutput types.
3. Create lib/atelier/email-templates/select-template.ts with template selection logic per the spec.
4. Create lib/atelier/email-templates/impact-line.ts with amount-range impact statement generator.
5. Create lib/atelier/email-templates/animal-blurb.ts — extract species one-liners from thank-you-email.ts lines 15-24, add any missing species from cleanpunkAnimalAffinities vocabulary.
6. Create lib/atelier/email-templates/tax-receipt-block.ts with IRS-compliant text block.
7. Create lib/atelier/email-templates/build-variables.ts to assemble full variable set from Gift + Donor.
8. Create 5 template modules: first-time.ts, returning.ts, recurring.ts, significant.ts, backfill.ts — each exporting a build function returning {subject, htmlBody, textBody}.
9. Create lib/atelier/email-templates/index.ts barrel export with buildAcknowledgmentEmail().
10. Use verbose comments linking back to the working spec, e.g., // see steampunk-strategy/docs/handoffs/_working/20260310-atelier-warm-touch-escalation-working-spec.md §5
11. Run: npx tsc --noEmit and include output.
12. Produce a structured debrief with: created file list, file/line evidence, tsc output, voice compliance notes, any Sanity Deltas applied.

Do not modify any existing files. Do not wire these templates into the send engine — that is WARM-3.
