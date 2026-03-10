/**
 * Shared vendor name → slug matching.
 * Used by both the Gmail scanner and the Receipt OCR parser.
 */

const VENDOR_PATTERNS: Record<string, string[]> = {
  'elstons': ['elston', "elston's", 'elstons hay', 'elstons hay & grain', 'elstons hay and grain'],
  'star-milling': ['star milling', 'star mill', 'star milling co'],
  'tractor-supply': ['tractor supply', 'tsc', 'tractor supply co'],
  'amazon': ['amazon', 'amzn', 'amazon.com'],
  'chewy': ['chewy', 'chewy.com'],
  'zeffy': ['zeffy'],
  'stripe': ['stripe'],
  'paypal': ['paypal'],
  'patreon': ['patreon'],
  'meta-platforms': ['meta platforms', 'meta platforms inc', 'facebook payments', 'meta pay'],
  'ironwood-pigs': ['ironwood', 'ironwoodpigs', 'ironwood pig sanctuary'],
  // Veterinary clinics
  'herd-health-management': ['herd health', 'herd health management'],
  'dairy-health-services': ['dairy health', 'dairy health services'],
  'irvine-valley-vet': ['irvine valley', 'ivvh', 'irvine valley veterinary'],
};

export function matchVendorByName(vendorName: string): string | null {
  const normalized = vendorName.toLowerCase().trim();
  for (const [slug, patterns] of Object.entries(VENDOR_PATTERNS)) {
    if (patterns.some(p => normalized.includes(p))) return slug;
  }
  return null;
}
