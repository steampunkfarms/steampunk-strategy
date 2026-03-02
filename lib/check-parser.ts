/**
 * Check/document scanning via Claude Vision.
 * Extraction prompt and response handling for scanned checks,
 * grant award letters, tax documents, and envelopes.
 */

export const CHECK_EXTRACTION_PROMPT = `You are a document scanner for a nonprofit animal sanctuary (Steampunk Farms Rescue Barn Inc., EIN 88-3285780).

You are scanning INBOUND documents — things the farm RECEIVES, not things it sends.

Identify the document type and extract the relevant fields. Return ONLY valid JSON, no markdown fences.

CRITICAL: The image may contain MULTIPLE documents (e.g., 4 checks scanned on a single page). If you see more than one check, letter, or document in the image, return a JSON ARRAY with one object per document. If there is only one document, still return an array with one element.

[
  {
    "scanType": "pledge_check" | "grant_check" | "grant_award_letter" | "tax_document_1099" | "envelope_return_address",

  "payer": {
    "fullName": "string — full name as printed (person or organization)",
    "firstName": "string | null — first name if a person",
    "lastName": "string | null — last name if a person",
    "street1": "string | null — street address line 1",
    "street2": "string | null — apt/suite/unit if present",
    "city": "string | null",
    "state": "string | null — 2-letter state code",
    "zip": "string | null — 5-digit or 5+4 zip"
  },

  "check": {
    "amount": number | null,
    "checkNumber": "string | null",
    "date": "string | null — ISO date YYYY-MM-DD",
    "bankName": "string | null — name of the bank printed on the check",
    "routingLast4": "string | null — last 4 digits of routing number from MICR line",
    "accountLast4": "string | null — last 4 digits of account number from MICR line",
    "memo": "string | null — memo line text",
    "payee": "string | null — who the check is made out to"
  },

  "grant": {
    "grantorName": "string | null — organization issuing the grant",
    "amount": number | null,
    "date": "string | null — ISO date",
    "purpose": "string | null — restricted purpose or 'unrestricted'",
    "grantId": "string | null — grant reference number if visible"
  },

  "tax": {
    "formType": "string | null — '1099-NEC' | '1099-MISC' | '1099-INT' | '1099-K' | 'W-9' | other",
    "taxYear": number | null,
    "amount": number | null,
    "issuerName": "string | null"
  },

  "confidence": number between 0 and 1,
  "notes": "string | null — anything unusual, partially obscured, or ambiguous"
  }
]

DOCUMENT TYPE DETECTION:
- Personal check with handwritten amount and MICR line → "pledge_check"
- Cashier's check or organizational check from a foundation/fund → "grant_check"
- Checks from donor-advised funds (Fidelity Charitable, Schwab Charitable, Vanguard Charitable, National Philanthropic Trust, etc.) → "grant_check"
- Letter on foundation/corporate letterhead with award amount → "grant_award_letter"
- IRS Form 1099 or W-9 → "tax_document_1099"
- Envelope with visible return address (no check visible) → "envelope_return_address"

SPECIAL INSTRUCTIONS:
- MULTIPLE DOCUMENTS: Scans often contain 2-4 checks OR 2-4 envelope return address labels photographed together on one page. Each check or envelope is a SEPARATE document — return one array element per item with its own payer, address, amount (if applicable), memo, etc. Look carefully at the entire image for all visible documents.
- For checks: ALWAYS try to read the MICR line at the bottom (routing number, account number, check number). Only store last 4 digits of routing and account numbers for privacy.
- For checks: The memo line is critical — it often says "for the animals", "shelter cats", a specific animal name, or a pledge reference. Extract it exactly as written.
- For addresses: Normalize state to 2-letter code. Include zip+4 if visible.
- For grant checks: The payer is the foundation/fund, not the bank. Extract the foundation name from the check face, not the bank printed on the MICR line.
- For envelopes: Extract the RETURN address (upper left corner), NOT the delivery address (center).
- If handwriting is hard to read, set confidence lower and describe what's unclear in notes.
- For partially visible or cut-off documents, extract what you can and note what's missing.
- If the amount is written both numerically and in words, use the numeric version but note any discrepancy.

CONTEXT: This nonprofit rescues farm animals (cats, pigs, goats, chickens, cows, horses, donkeys) in San Diego County, CA. Donors often include personal notes or animal names in memo lines. Address is 36013 Old Wilson Rd, Ranchita, CA 92066.`;

export interface ExtractedCheckData {
  scanType: 'pledge_check' | 'grant_check' | 'grant_award_letter' | 'tax_document_1099' | 'envelope_return_address';
  payer: {
    fullName: string;
    firstName: string | null;
    lastName: string | null;
    street1: string | null;
    street2: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  check: {
    amount: number | null;
    checkNumber: string | null;
    date: string | null;
    bankName: string | null;
    routingLast4: string | null;
    accountLast4: string | null;
    memo: string | null;
    payee: string | null;
  };
  grant: {
    grantorName: string | null;
    amount: number | null;
    date: string | null;
    purpose: string | null;
    grantId: string | null;
  };
  tax: {
    formType: string | null;
    taxYear: number | null;
    amount: number | null;
    issuerName: string | null;
  };
  confidence: number;
  notes: string | null;
}

/**
 * Parse Claude's response. Always returns an array.
 * Handles both single-object and array responses.
 */
export function parseCheckResponse(text: string): ExtractedCheckData[] | null {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      return parsed as ExtractedCheckData[];
    }
    // Single object — wrap in array
    return [parsed as ExtractedCheckData];
  } catch {
    return null;
  }
}
