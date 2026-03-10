/**
 * Line item description → CostTracker slug mapping.
 * Used by Receipt OCR to create CostTracker entries for feed/supply invoices.
 */

interface ItemMapping {
  item: string;
  itemGroup: string;
  unit: string;
}

const ITEM_SLUG_MAP: Record<string, ItemMapping> = {
  // Hay
  'bermuda': { item: 'bermuda_hay', itemGroup: 'hay', unit: 'bale' },
  'three way': { item: 'three_way_hay', itemGroup: 'hay', unit: 'bale' },
  'three-way': { item: 'three_way_hay', itemGroup: 'hay', unit: 'bale' },
  '3-way': { item: 'three_way_hay', itemGroup: 'hay', unit: 'bale' },
  'alfalfa': { item: 'alfalfa', itemGroup: 'hay', unit: 'bale' },
  'straw': { item: 'straw', itemGroup: 'hay', unit: 'bale' },
  'orchard': { item: 'orchard_grass', itemGroup: 'hay', unit: 'bale' },
  'timothy': { item: 'timothy_hay', itemGroup: 'hay', unit: 'bale' },
  // Grain
  'lay pellet': { item: 'lay_pellets', itemGroup: 'grain', unit: 'bag' },
  'scratch': { item: 'scratch_grain', itemGroup: 'grain', unit: 'bag' },
  'goat pellet': { item: 'goat_pellets', itemGroup: 'grain', unit: 'bag' },
  'pig feed': { item: 'pig_feed', itemGroup: 'grain', unit: 'bag' },
  // Veterinary procedures
  'wellness exam': { item: 'vet_wellness', itemGroup: 'veterinary', unit: 'visit' },
  'wellness check': { item: 'vet_wellness', itemGroup: 'veterinary', unit: 'visit' },
  'emergency': { item: 'vet_emergency', itemGroup: 'veterinary', unit: 'visit' },
  'vaccin': { item: 'vaccination', itemGroup: 'veterinary', unit: 'dose' },
  'deworm': { item: 'dewormer_round', itemGroup: 'veterinary', unit: 'dose' },
  'dental float': { item: 'dental_float', itemGroup: 'veterinary', unit: 'each' },
  'farm call': { item: 'vet_call_out', itemGroup: 'veterinary', unit: 'visit' },
  'call-out': { item: 'vet_call_out', itemGroup: 'veterinary', unit: 'visit' },
  'fecal': { item: 'fecal_test', itemGroup: 'veterinary', unit: 'each' },
  'radiograph': { item: 'radiograph', itemGroup: 'veterinary', unit: 'each' },
  'x-ray': { item: 'radiograph', itemGroup: 'veterinary', unit: 'each' },
  'blood panel': { item: 'blood_panel', itemGroup: 'veterinary', unit: 'each' },
  'cbc': { item: 'blood_panel', itemGroup: 'veterinary', unit: 'each' },
  'farrier': { item: 'farrier_trim', itemGroup: 'farrier', unit: 'each' },
  // Grain — bulk
  'bulk grain': { item: 'grain_bulk_per_lb', itemGroup: 'grain', unit: 'lb' },
  'per lb': { item: 'grain_bulk_per_lb', itemGroup: 'grain', unit: 'lb' },
};

export function matchItemSlug(description: string): ItemMapping | null {
  const normalized = description.toLowerCase();
  for (const [pattern, mapping] of Object.entries(ITEM_SLUG_MAP)) {
    if (normalized.includes(pattern)) return mapping;
  }
  return null;
}
