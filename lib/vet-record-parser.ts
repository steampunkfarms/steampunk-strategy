/**
 * Veterinary record parsing via Claude Vision.
 * Extracts structured medical/financial data from vet documents.
 */

export const VET_RECORD_EXTRACTION_PROMPT = `You are a veterinary document parser for Steampunk Farms Rescue Barn Inc., a 501(c)(3) animal sanctuary.

Extract the following fields from this document. Return ONLY valid JSON, no markdown fences.

{
  "clinic": {
    "name": "string — clinic or practice name as printed",
    "phone": "string | null",
    "address": "string | null",
    "veterinarian": "string | null — specific DVM name if present"
  },
  "patient": {
    "name": "string | null — animal's name",
    "species": "string | null — dog, cat, pig, goat, horse, donkey, cow, sheep, chicken, etc.",
    "breed": "string | null",
    "weight": "string | null — with unit",
    "age": "string | null — as stated on document",
    "patientId": "string | null — clinic patient/chart number if present"
  },
  "owner": "string | null — owner name as listed (may be 'Steampunk Farms', 'Krystal Tronboll', 'Erin Letson', etc.)",
  "date": "string — ISO date YYYY-MM-DD of primary service date",
  "recordType": "invoice | estimate | lab_results | imaging | surgical_report | medical_history | vaccination | wellness_exam | adoption_contract | other",
  "procedures": ["string — each procedure or service performed"],
  "diagnoses": ["string — each diagnosis or finding, if any"],
  "medications": [
    {
      "name": "string",
      "dose": "string | null",
      "frequency": "string | null"
    }
  ],
  "lineItems": [
    {
      "description": "string",
      "quantity": "number | null",
      "unitPrice": "number | null",
      "total": "number"
    }
  ],
  "total": "number | null — grand total",
  "subtotal": "number | null",
  "tax": "number | null",
  "amountPaid": "number | null — if payment info shown",
  "referenceNumber": "string | null — invoice #, estimate #, chart #, case #",
  "confidence": "number — 0 to 1",
  "notes": "string | null — anything unusual, partially obscured, or notable context",
  "tags": ["string — relevant tags: bloodwork, ultrasound, spay, neuter, emergency, dental, vaccination, imaging, surgery, catheter, deworming, microchip, wellness, pre-op, post-op"]
}

CONTEXT:
- This is a RESCUE SANCTUARY with dogs, cats, pigs (farm hogs and pot-belly), goats, horses, donkeys, cows, sheep, chickens, ducks, geese, roosters.
- Known clinics: ECLAP (Dr. Harlan), Affordable Veterinary Clinic (Dr. Roueche), Angelus Pet Hospital, Irvine Valley Vet (Dr. Schulze), VetImage West, Arizona Mobile Vet (Dr. Burrows), Herd Health Management.
- Owner names may appear as: "Steampunk Farms", "Steampunk Rescue", "Krystal Tronboll", "Erin Letson", "Erin & Mike Letson".
- For bulk estimates (e.g., "53 pig neutering"), note the count in notes and list as a single procedure with quantity.
- For multi-page documents, extract data from ALL pages.
- For imaging reports (ultrasound, x-ray), extract findings and clinical impressions as diagnoses.
- If the document is an adoption contract or rescue request (not a medical record), set recordType to "adoption_contract" or "other" and extract what you can.`;

export interface ExtractedVetRecord {
  clinic: {
    name: string;
    phone: string | null;
    address: string | null;
    veterinarian: string | null;
  };
  patient: {
    name: string | null;
    species: string | null;
    breed: string | null;
    weight: string | null;
    age: string | null;
    patientId: string | null;
  };
  owner: string | null;
  date: string;
  recordType: string;
  procedures: string[];
  diagnoses: string[];
  medications: { name: string; dose: string | null; frequency: string | null }[];
  lineItems: { description: string; quantity: number | null; unitPrice: number | null; total: number }[];
  total: number | null;
  subtotal: number | null;
  tax: number | null;
  amountPaid: number | null;
  referenceNumber: string | null;
  confidence: number;
  notes: string | null;
  tags: string[];
}

export function parseVetExtractionResponse(text: string): ExtractedVetRecord | null {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as ExtractedVetRecord;
  } catch {
    return null;
  }
}

/**
 * Classify a filename into a vet document type heuristic.
 */
export function classifyByFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes('estimate') || lower.includes('sample')) return 'vet_estimate';
  if (lower.includes('ultrasound') || lower.includes('imp') || lower.includes('diagnostic') || lower.includes('clinical')) return 'vet_imaging';
  if (lower.includes('invoice') || lower.includes('payment') || lower.includes('receipt')) return 'vet_invoice';
  if (lower.includes('medical history') || lower.includes('chart document') || lower.includes('bloodwork')) return 'vet_record';
  if (lower.includes('adoption') || lower.includes('rescue request') || lower.includes('newhope')) return 'other';
  return 'vet_record'; // default for unknown vet documents
}
