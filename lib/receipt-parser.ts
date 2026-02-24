/**
 * Receipt/invoice parsing via Claude Vision.
 * Extraction prompt and response handling.
 */

export const RECEIPT_EXTRACTION_PROMPT = `You are a financial document parser for a nonprofit animal sanctuary (Steampunk Farms Rescue Barn Inc.).

You handle TWO categories of documents:
1. EXPENSES — receipts, invoices, bills the farm pays
2. INCOME — remittances, payouts, earnings statements the farm receives

Extract the following fields from this document. Return ONLY valid JSON, no markdown fences.

{
  "vendor": {
    "name": "string — business name as printed (payer for income, payee for expenses)",
    "phone": "string | null",
    "address": "string | null"
  },
  "date": "string — ISO date YYYY-MM-DD (payment date, not payout period)",
  "total": number,
  "subtotal": number | null,
  "tax": number | null,
  "paymentMethod": "card" | "cash" | "check" | "ach" | "bank_deposit" | null,
  "cardLast4": "string | null — last 4 digits if visible",
  "referenceNumber": "string | null — invoice #, receipt #, payment #, order #, confirmation #",
  "transactionType": "expense" | "income",
  "lineItems": [
    {
      "description": "string — product/service description or payout category",
      "quantity": number | null,
      "unit": "string | null — bale, lb, bag, each, month, etc.",
      "unitPrice": number | null,
      "total": number,
      "periodStart": "string | null — ISO date YYYY-MM-DD if line item covers a specific period",
      "periodEnd": "string | null — ISO date YYYY-MM-DD if line item covers a specific period",
      "payoutRef": "string | null — payout reference # if present per line"
    }
  ],
  "documentType": "receipt" | "invoice" | "remittance" | "payout_statement" | "shipping_manifest" | "bank_statement" | "other",
  "incomeSource": "string | null — for income docs: 'facebook_activity' | 'facebook_content' | 'instagram' | 'ad_revenue' | 'affiliate' | 'other'",
  "incomeProgram": "string | null — for income docs: the specific program or object name, e.g. 'The Cleanpunk Shop at Steampunk Farms'",
  "confidence": number between 0 and 1,
  "notes": "string | null — anything unusual, partially obscured, or ambiguous"
}

DOCUMENT TYPE DETECTION:
- "REMITTANCE" header or "payment has been remitted" → documentType: "remittance", transactionType: "income"
- Meta Platforms / Facebook payouts → vendor.name: "Meta Platforms", paymentMethod: "bank_deposit"
- For remittances with multiple payout periods, create a separate lineItem for each payout reference
- Always extract the Payout Period dates as periodStart/periodEnd on each line item
- The "Product - Object Name - Object ID" field tells you the incomeSource and incomeProgram
  - "Facebook Activity" → incomeSource: "facebook_activity"
  - "Content" → incomeSource: "facebook_content"

CONTEXT: Common vendors/payers include:
- Meta Platforms Inc. (Facebook/Instagram monetization payouts — INCOME)
- Elston's Hay & Grain (hay, straw — sold by bale — EXPENSE)
- Star Milling (grain, pelleted feed — sold by ton or bag — EXPENSE)
- Tractor Supply (bagged feed, supplements, supplies — diverse items — EXPENSE)
- Amazon (supplies, equipment — wide range — EXPENSE)
- Chewy (pet food, supplements — EXPENSE)
- Various veterinary offices (EXPENSE)

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
  transactionType: 'expense' | 'income';
  lineItems: {
    description: string;
    quantity: number | null;
    unit: string | null;
    unitPrice: number | null;
    total: number;
    periodStart: string | null;
    periodEnd: string | null;
    payoutRef: string | null;
  }[];
  documentType: string;
  incomeSource: string | null;
  incomeProgram: string | null;
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
