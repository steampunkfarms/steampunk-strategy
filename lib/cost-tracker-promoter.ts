// postest
/**
 * CostTracker Promotion — maps extracted invoice line items to CostTracker entries.
 *
 * Uses the existing POST /api/cost-tracker/record logic pattern (sequential comparison,
 * YoY comparison, seasonal baseline) rather than duplicating that calculation.
 *
 * see HANDOFF-tardis-invoice-costtracker-pipeline.md#step-3
 */

import { prisma } from '@/lib/prisma';
import type { InvoiceLineItem } from '@prisma/client';

// ---------------------------------------------------------------------------
// Subcategory → CostTracker item mapping
// ---------------------------------------------------------------------------

interface CostMapping {
  item: string;       // CostTracker `item` field (e.g., 'vet_wellness')
  itemGroup: string;  // CostTracker `itemGroup` (e.g., 'veterinary')
  label: string;      // Human-readable
  unit: string;       // Normalized unit for CostTracker
}

/**
 * Maps invoice line-item subcategories (from the AI extractor) to CostTracker items.
 * Keys are the subcategory slugs emitted by invoice-line-extractor.ts.
 */
const COST_MAPPINGS: Record<string, CostMapping> = {
  // Veterinary
  'wellness-exam':        { item: 'vet_wellness',        itemGroup: 'veterinary', label: 'Routine veterinary wellness check',  unit: 'visit' },
  'emergency-visit':      { item: 'vet_emergency',       itemGroup: 'veterinary', label: 'Emergency veterinary visit',         unit: 'visit' },
  'vaccination':          { item: 'vaccination',          itemGroup: 'veterinary', label: 'Vaccination (per animal)',           unit: 'dose' },
  'deworming':            { item: 'dewormer_round',       itemGroup: 'veterinary', label: 'Dewormer treatment (per animal)',    unit: 'dose' },
  'dental-float':         { item: 'dental_float',         itemGroup: 'veterinary', label: 'Dental float procedure',            unit: 'each' },
  'farm-visit-fee':       { item: 'vet_call_out',         itemGroup: 'veterinary', label: 'Veterinary farm call-out fee',       unit: 'visit' },
  'fecal-test':           { item: 'fecal_test',           itemGroup: 'veterinary', label: 'Fecal float test',                  unit: 'each' },
  'radiograph':           { item: 'radiograph',           itemGroup: 'veterinary', label: 'Radiograph / X-ray',                unit: 'each' },
  'blood-panel':          { item: 'blood_panel',          itemGroup: 'veterinary', label: 'Blood panel / CBC',                 unit: 'each' },
  'surgery':              { item: 'surgery',              itemGroup: 'veterinary', label: 'Surgical procedure',                unit: 'each' },
  'euthanasia':           { item: 'euthanasia',           itemGroup: 'veterinary', label: 'Euthanasia',                        unit: 'each' },
  'professional-services': { item: 'vet_ranch_hourly',    itemGroup: 'veterinary', label: 'Professional services (hourly)',     unit: 'hour' },
  'medication':           { item: 'medication',           itemGroup: 'veterinary', label: 'Medication',                        unit: 'each' },
  'diagnostics':          { item: 'diagnostics',          itemGroup: 'veterinary', label: 'Diagnostic procedure',              unit: 'each' },

  // Feed — grain
  'grain-pellets':        { item: 'grain_pellets',        itemGroup: 'grain',      label: 'Grain pellets',                     unit: 'bag' },
  'grain-bulk':           { item: 'grain_bulk_per_lb',    itemGroup: 'grain',      label: 'Grain (per pound, bulk)',            unit: 'lb' },
  'supplement':           { item: 'supplement',           itemGroup: 'grain',      label: 'Feed supplement',                   unit: 'each' },
  'scratch-grain':        { item: 'scratch_grain',        itemGroup: 'grain',      label: 'Scratch grain',                     unit: 'bag' },

  // Feed — hay
  'hay-bale':             { item: 'hay_bale',             itemGroup: 'hay',        label: 'Bale of hay',                       unit: 'bale' },

  // Farrier
  'farrier-trim':         { item: 'farrier_trim',         itemGroup: 'farrier',    label: 'Farrier trim',                      unit: 'each' },
  'farrier-shoe':         { item: 'farrier_shoe',         itemGroup: 'farrier',    label: 'Farrier shoe',                      unit: 'each' },

  // Supplies
  'bedding':              { item: 'bedding',              itemGroup: 'supplies',   label: 'Bedding',                           unit: 'bag' },
  'medical-supplies':     { item: 'medical_supplies',     itemGroup: 'supplies',   label: 'Medical supplies',                  unit: 'each' },
  'delivery':             { item: 'delivery_fee',         itemGroup: 'operations', label: 'Delivery / freight charge',         unit: 'each' },
};

export { COST_MAPPINGS };

// ---------------------------------------------------------------------------
// Promotion function
// ---------------------------------------------------------------------------

/**
 * Promote an InvoiceLineItem to a CostTracker entry.
 *
 * Reuses the same calculation pattern as POST /api/cost-tracker/record:
 *   1. Find or create Vendor record
 *   2. Look up previous price for sequential comparison
 *   3. Look up same-month prior year for YoY comparison
 *   4. Check seasonal baseline and flag appropriately
 *   5. Create CostTracker record
 *   6. Mark the line item as promoted
 *
 * Returns the CostTracker record ID, or null if unmapped.
 */
export async function promoteLineItem(
  lineItem: InvoiceLineItem,
): Promise<string | null> {
  const mapping = COST_MAPPINGS[lineItem.subcategory];
  if (!mapping) {
    console.log(
      `[CostTracker] Unmapped subcategory: ${lineItem.subcategory} from ${lineItem.vendor} — "${lineItem.description}" at $${lineItem.unitPrice}/${lineItem.unit}`,
    );
    return null;
  }

  // Resolve vendor → Vendor record (CostTracker requires vendorId FK)
  const vendor = await prisma.vendor.findUnique({ where: { slug: lineItem.vendor } });
  if (!vendor) {
    console.log(
      `[CostTracker] Vendor not found for slug "${lineItem.vendor}" — skipping promotion of "${lineItem.description}"`,
    );
    return null;
  }

  const unitCost = Number(lineItem.unitPrice);
  const recordDate = new Date(lineItem.invoiceDate);
  const month = recordDate.getMonth() + 1;
  const fiscalYear = recordDate.getFullYear();

  // 1. Sequential comparison — most recent prior entry for this vendor+item
  const previousEntry = await prisma.costTracker.findFirst({
    where: {
      vendorId: vendor.id,
      item: mapping.item,
      recordedDate: { lt: recordDate },
    },
    orderBy: { recordedDate: 'desc' },
  });

  const previousCost = previousEntry?.unitCost ? Number(previousEntry.unitCost) : null;
  const percentChange = previousCost
    ? parseFloat(((unitCost - previousCost) / previousCost * 100).toFixed(2))
    : null;

  // 2. YoY comparison — same month, prior year
  const priorYearEntry = await prisma.costTracker.findFirst({
    where: {
      vendorId: vendor.id,
      item: mapping.item,
      month,
      fiscalYear: fiscalYear - 1,
    },
    orderBy: { recordedDate: 'desc' },
  });

  const priorYearCost = priorYearEntry?.unitCost ? Number(priorYearEntry.unitCost) : null;
  const yoyChange = priorYearCost
    ? parseFloat(((unitCost - priorYearCost) / priorYearCost * 100).toFixed(2))
    : null;

  // 3. Seasonal baseline
  const baseline = await prisma.seasonalBaseline.findFirst({
    where: { vendorId: vendor.id, item: mapping.item, month },
    orderBy: { baselineYear: 'desc' },
  });

  let seasonalFlag: string | null = null;
  if (baseline) {
    const expectedHigh = Number(baseline.expectedHigh);
    const expectedLow = Number(baseline.expectedLow);
    const threshold = Number(baseline.creepThreshold);
    if (unitCost > expectedHigh * (1 + threshold)) {
      seasonalFlag = 'cost_creep';
    } else if (unitCost > expectedHigh) {
      seasonalFlag = 'above_expected';
    } else if (unitCost < expectedLow) {
      seasonalFlag = 'below_expected';
    } else {
      seasonalFlag = 'expected';
    }
  }

  // 4. Create CostTracker record
  // see app/api/cost-tracker/record/route.ts for the HTTP version of this logic
  const entry = await prisma.costTracker.create({
    data: {
      vendorId: vendor.id,
      item: mapping.item,
      itemGroup: mapping.itemGroup,
      unit: mapping.unit,
      quantity: Number(lineItem.quantity),
      unitCost,
      previousCost,
      percentChange,
      priorYearCost,
      yoyChange,
      seasonalFlag,
      recordedDate: recordDate,
      month,
      fiscalYear,
      invoiceRef: lineItem.documentId,
    },
  });

  // 5. Mark the InvoiceLineItem as promoted
  await prisma.invoiceLineItem.update({
    where: { id: lineItem.id },
    data: {
      promotedToCostTracker: true,
      promotedAt: new Date(),
      costTrackerItem: mapping.item,
    },
  });

  console.log(
    `[CostTracker] Promoted: ${mapping.item} @ $${unitCost}/${mapping.unit} from ${lineItem.vendor}${percentChange !== null ? ` (${percentChange > 0 ? '+' : ''}${percentChange}% vs last)` : ''}`,
  );

  return entry.id;
}
