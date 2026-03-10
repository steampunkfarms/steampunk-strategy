/**
 * AI-powered line item extraction from parsed invoice documents.
 * Takes a Document with extractedData and returns structured line items
 * suitable for CostTracker promotion.
 *
 * see HANDOFF-tardis-invoice-costtracker-pipeline.md#step-2
 */

import { createMessage } from '@/lib/claude';
import type Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-20250514';

export interface ExtractedLineItem {
  description: string;
  category: string;       // 'veterinary', 'feed', 'farrier', 'supplies'
  subcategory: string;    // 'wellness-exam', 'vaccination', 'grain-pellets', etc.
  quantity: number;
  unit: string;           // 'each', 'lb', 'dose', 'visit', 'bale'
  unitPrice: number;
  totalPrice: number;
  animalName: string | null;
  animalSpecies: string | null;
  confidence: 'high' | 'medium' | 'low';
}

const EXTRACTION_PROMPT = `You are extracting structured line items from a veterinary or agricultural supply invoice for an animal sanctuary (Steampunk Farms Rescue Barn).

Extract every billable line item with its quantity, unit, unit price, and total.

For veterinary invoices:
- Identify the procedure type (wellness exam, vaccination, dental float, radiograph, emergency visit, deworming, fecal test, blood panel, surgery, euthanasia, farm call/visit fee, etc.)
- If the invoice lists procedures per animal, include the animal name and species
- Call-out fees and farm visit charges are their own line items
- If a line item is a package/bundle, try to identify the component procedures
- "Professional Services" hourly rates are their own line item (subcategory: "professional-services")

For feed/supply invoices:
- Extract per-unit pricing (per pound, per bag, per bale, per dose)
- If pricing is bulk (e.g., 9,700 LB @ $0.2097/LB), extract the per-unit rate
- Delivery/freight charges are their own line item (subcategory: "delivery")

SUBCATEGORY SLUGS (use these exact values when they match):
- Veterinary: wellness-exam, emergency-visit, vaccination, deworming, dental-float, fecal-test, radiograph, blood-panel, surgery, euthanasia, farm-visit-fee, professional-services, medication, diagnostics
- Feed: hay-bale, grain-pellets, grain-bulk, supplement, scratch-grain
- Farrier: farrier-trim, farrier-shoe
- Supplies: bedding, medical-supplies, equipment
- If none match, create a descriptive slug (lowercase, hyphenated)

Return ONLY a valid JSON array. No markdown, no explanation.
Each item: { "description": string, "category": string, "subcategory": string, "quantity": number, "unit": string, "unitPrice": number, "totalPrice": number, "animalName": string|null, "animalSpecies": string|null, "confidence": "high"|"medium"|"low" }`;

/**
 * Extract structured line items from a parsed invoice document.
 * Uses the extractedData JSON (from receipt-parser.ts) as the source.
 */
export async function extractLineItems(
  extractedData: string,
  vendorHint?: string,
): Promise<ExtractedLineItem[]> {
  const context = vendorHint
    ? `Vendor: ${vendorHint}\n\nInvoice data:\n${extractedData}`
    : `Invoice data:\n${extractedData}`;

  const response = await createMessage({
    model: MODEL,
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `${EXTRACTION_PROMPT}\n\n${context}`,
    }],
  }, 'invoice-line-extract');

  const responseText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const items = JSON.parse(cleaned) as ExtractedLineItem[];
    // Validate and sanitize
    return items.filter(item =>
      item.description &&
      item.category &&
      item.subcategory &&
      typeof item.quantity === 'number' &&
      typeof item.unitPrice === 'number' &&
      typeof item.totalPrice === 'number'
    );
  } catch {
    console.error('[InvoiceLineExtractor] Failed to parse AI response:', cleaned.slice(0, 200));
    return [];
  }
}
// postest
