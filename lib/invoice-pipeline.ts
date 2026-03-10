// postest
/**
 * Invoice line-item extraction + CostTracker promotion pipeline.
 *
 * Shared logic used by:
 *   - app/api/documents/parse/route.ts (forward pipeline, auto on parse)
 *   - scripts/backfill-invoice-line-items.ts (backfill existing documents)
 *
 * see HANDOFF-tardis-invoice-costtracker-pipeline.md#step-5
 */

import { prisma } from '@/lib/prisma';
import { extractLineItems } from '@/lib/invoice-line-extractor';
import { promoteLineItem } from '@/lib/cost-tracker-promoter';
import { matchVendorByName } from '@/lib/vendor-match';

interface PipelineResult {
  extracted: number;
  promoted: number;
  unmapped: number;
  errors: string[];
}

/**
 * Run the full extraction + promotion pipeline on a parsed document.
 * Non-throwing — returns a result summary. Logs but does not fail the caller.
 */
export async function runInvoicePipeline(
  documentId: string,
  extractedData: string,
  vendorName?: string | null,
  invoiceDate?: Date | null,
): Promise<PipelineResult> {
  const result: PipelineResult = { extracted: 0, promoted: 0, unmapped: 0, errors: [] };

  try {
    const vendorSlug = vendorName ? matchVendorByName(vendorName) : null;
    const items = await extractLineItems(extractedData, vendorSlug ?? undefined);
    result.extracted = items.length;

    const date = invoiceDate ?? new Date();

    for (const item of items) {
      try {
        const stored = await prisma.invoiceLineItem.create({
          data: {
            documentId,
            vendor: vendorSlug ?? 'unknown',
            invoiceDate: date,
            description: item.description,
            category: item.category,
            subcategory: item.subcategory,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            animalName: item.animalName,
            animalSpecies: item.animalSpecies,
            confidence: item.confidence,
          },
        });

        const costTrackerId = await promoteLineItem(stored);
        if (costTrackerId) {
          result.promoted++;
        } else {
          result.unmapped++;
        }
      } catch (err) {
        result.errors.push(`Item "${item.description}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    console.log(
      `[InvoicePipeline] doc=${documentId} extracted=${result.extracted} promoted=${result.promoted} unmapped=${result.unmapped}`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Extraction failed: ${msg}`);
    console.error(`[InvoicePipeline] doc=${documentId} FAILED: ${msg}`);
  }

  return result;
}
