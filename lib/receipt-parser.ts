/**
 * Receipt/invoice parsing via Claude Vision.
 * Extraction prompt and response handling.
 */

export const RECEIPT_EXTRACTION_PROMPT = `You are a receipt and invoice parser for a nonprofit animal sanctuary (Steampunk Farms Rescue Barn Inc.).

Extract the following fields from this document. Return ONLY valid JSON, no markdown fences.

{
  "vendor": {
    "name": "string — business name as printed",
    "phone": "string | null",
    "address": "string | null"
  },
  "date": "string — ISO date YYYY-MM-DD",
  "total": number,
  "subtotal": number | null,
  "tax": number | null,
  "paymentMethod": "card" | "cash" | "check" | "ach" | null,
  "cardLast4": "string | null — last 4 digits if visible",
  "referenceNumber": "string | null — invoice #, receipt #, order #, confirmation #",
  "lineItems": [
    {
      "description": "string",
      "quantity": number | null,
      "unit": "string | null — bale, lb, bag, each, etc.",
      "unitPrice": number | null,
      "total": number
    }
  ],
  "documentType": "receipt" | "invoice" | "shipping_manifest" | "bank_statement" | "other",
  "confidence": number between 0 and 1,
  "notes": "string | null — anything unusual, partially obscured, or ambiguous"
}

CONTEXT: Common vendors include:
- Elston's Hay & Grain (hay, straw — sold by bale)
- Star Milling (grain, pelleted feed — sold by ton or bag)
- Tractor Supply (bagged feed, supplements, supplies — diverse items)
- Amazon (supplies, equipment — wide range)
- Chewy (pet food, supplements)
- Various veterinary offices

For hay/grain invoices, always extract unit price per bale or per ton when visible.
For Tractor Supply, itemize each product separately.
If the image is blurry or partially cut off, set confidence lower and note what's unclear.`;

export interface ExtractedReceipt {
  vendor: {
    name: string;
    phone: string | null;
    address: string | null;
  };
  date: string;
  total: number;
  subtotal: number | null;
  tax: number | null;
  paymentMethod: string | null;
  cardLast4: string | null;
  referenceNumber: string | null;
  lineItems: {
    description: string;
    quantity: number | null;
    unit: string | null;
    unitPrice: number | null;
    total: number;
  }[];
  documentType: string;
  confidence: number;
  notes: string | null;
}

export function parseExtractionResponse(text: string): ExtractedReceipt | null {
  try {
    // Strip markdown fences if Claude includes them despite instructions
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as ExtractedReceipt;
  } catch {
    return null;
  }
}
