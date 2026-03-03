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
  "shipping": number | null,
  "discount": number | null,
  "giftCardAmount": number | null,
  "amountPaid": number | null,
  "autoshipDiscount": number | null,
  "earnedGiftCard": number | null,
  "promoCode": "string | null — e.g. 'HAVEFUN' or 'Spend $100 Get $30 eGift Card'",
  "paymentMethod": "card" | "cash" | "check" | "ach" | "bank_deposit" | "paypal" | "gift_card" | null,
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
      "shipDate": "string | null — ISO date YYYY-MM-DD if item shipped on a specific date (Chewy multi-shipment)",
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
- Chewy (pet food, supplements, treats, enrichment toys — EXPENSE)
- Various veterinary offices (EXPENSE)

For hay/grain invoices, always extract unit price per bale or per ton when visible.
For Tractor Supply, itemize each product separately.
For orders with delivery/shipping fees, extract the shipping amount.
For orders with discounts, coupons, or promotions, extract the discount as a POSITIVE number (e.g., -$114.49 discount → 114.49).
If the image is blurry or partially cut off, set confidence lower and note what's unclear.

CHEWY INVOICES — SPECIAL HANDLING:
Chewy invoices are complex. Follow these rules carefully:

1. PAYMENT SPLIT (upper-left header area):
   - "Order Total" = the full order price before gift card application → use as "total"
   - "Gift Card" = amount paid from earned gift card balance → use as "giftCardAmount" (positive number, e.g., -$158.13 → 158.13)
   - "Amount Paid" = actual out-of-pocket cash charged → use as "amountPaid"
   - If Amount Paid is $0.00, the entire order was covered by gift card balance

2. MULTIPLE SHIPMENTS:
   - One order may have 2-4 shipments with different ship dates
   - Create a lineItem for EVERY product across ALL shipments
   - For each line item, include the shipment date in "shipDate" field
   - Aggregate totals across all shipments for the order-level fields

3. DISCOUNTS — "Adjustment Applied":
   - The "Adjustment Applied" amount under each shipment's subtotal is the Autoship & Save 5% discount distributed to that shipment
   - Sum all "Adjustment Applied" amounts across shipments and report as "autoshipDiscount" (positive number)
   - This is separate from "discount" which covers promo codes or coupons

4. FREE PROMOTIONAL eGIFT CARDS:
   - Chewy often includes a free promotional eGift Card as a line item (e.g., "Chewy Promotional $30 eGift Card")
   - These appear as a shipment with $0 total (the eGift card value equals the adjustment)
   - Report the earned eGift card value in "earnedGiftCard" (e.g., 30.00)
   - Include it as a line item with total: 0 and note the promo in "notes"
   - The promo code triggering it (e.g., "Spend $100, Get $30 eGift Card with code HAVEFUN") should go in "promoCode"

5. FREE SHIPPING:
   - Chewy+ members get free shipping on all orders
   - If shipping is $0.00 or "FREE", set shipping: 0 and note "Chewy+ free shipping" in notes

6. PAYMENT METHOD:
   - Look at the "Payment Information" section for the actual payment method (PayPal, credit card, etc.)
   - If paid via Gift Card Balance only (Amount Paid = $0), paymentMethod: "gift_card"
   - If paid via PayPal + Gift Card, paymentMethod: "paypal"
   - cardLast4 applies if a credit/debit card is shown

7. REFERENCE NUMBER:
   - Use the Order # as referenceNumber (e.g., "1639023059")

8. DATE:
   - Use the "Order Placed" date as the primary date
   - Individual shipment dates go in each line item's "shipDate" field`;

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
  shipping: number | null;
  discount: number | null;
  giftCardAmount: number | null;
  amountPaid: number | null;
  autoshipDiscount: number | null;
  earnedGiftCard: number | null;
  promoCode: string | null;
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
    shipDate: string | null;
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
