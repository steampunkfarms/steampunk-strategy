export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { matchVendorByName } from '@/lib/vendor-match';
import { matchItemSlug } from '@/lib/item-match';
import type { ExtractedReceipt } from '@/lib/receipt-parser';

// Vendor type → expense category slug mapping
const VENDOR_TYPE_CATEGORY: Record<string, string> = {
  feed_supplier: 'feed-grain',
  veterinary: 'veterinary',
  supplies: 'general-supplies',
  utilities: 'utilities',
  soap_materials: 'soap-materials',
  shipping: 'shipping',
  services: 'professional-services',
};

/**
 * POST /api/documents/create-transaction
 *
 * Creates a Transaction (+ optional CostTracker entries) from a parsed Document.
 * Body: {
 *   documentId: string,
 *   overrides?: { vendorSlug?, categorySlug?, date?, amount? }
 * }
 */
export async function POST(request: Request) {
  try {
    const { documentId, overrides } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { vendor: true },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!doc.extractedData) {
      return NextResponse.json(
        { error: 'Document has not been parsed yet. Call /api/documents/parse first.' },
        { status: 400 },
      );
    }

    let extracted: ExtractedReceipt;
    try {
      extracted = JSON.parse(doc.extractedData) as ExtractedReceipt;
    } catch {
      return NextResponse.json({ error: 'Invalid extractedData JSON' }, { status: 422 });
    }

    // --- Vendor matching ---
    let vendorId: string | null = doc.vendorId;
    let vendorSlug: string | null = null;
    let vendorMatched = !!vendorId;

    if (overrides?.vendorSlug) {
      const vendor = await prisma.vendor.findUnique({ where: { slug: overrides.vendorSlug } });
      if (vendor) {
        vendorId = vendor.id;
        vendorSlug = vendor.slug;
        vendorMatched = true;
      }
    } else if (!vendorId && extracted.vendor?.name) {
      vendorSlug = matchVendorByName(extracted.vendor.name);
      if (vendorSlug) {
        const vendor = await prisma.vendor.findUnique({ where: { slug: vendorSlug } });
        if (vendor) {
          vendorId = vendor.id;
          vendorMatched = true;
        }
      }
    } else if (vendorId && doc.vendor) {
      vendorSlug = doc.vendor.slug;
    }

    // --- Category inference ---
    let categoryId: string | null = null;
    if (overrides?.categorySlug) {
      const cat = await prisma.expenseCategory.findUnique({ where: { slug: overrides.categorySlug } });
      if (cat) categoryId = cat.id;
    } else if (vendorId) {
      const vendor = vendorId === doc.vendorId && doc.vendor
        ? doc.vendor
        : await prisma.vendor.findUnique({ where: { id: vendorId } });
      if (vendor) {
        const catSlug = VENDOR_TYPE_CATEGORY[vendor.type];
        if (catSlug) {
          const cat = await prisma.expenseCategory.findUnique({ where: { slug: catSlug } });
          if (cat) categoryId = cat.id;
        }
      }
    }

    // --- Build transaction data ---
    const txDate = overrides?.date
      ? new Date(overrides.date)
      : extracted.date
        ? new Date(extracted.date)
        : new Date();

    const txAmount = overrides?.amount ?? extracted.total;
    const confidence = extracted.confidence ?? 0;
    const fiscalYear = txDate.getFullYear();

    const vendorName = extracted.vendor?.name ?? 'Unknown';
    const docTypeLabel = extracted.documentType ?? doc.docType;
    const refNum = extracted.referenceNumber ? ` #${extracted.referenceNumber}` : '';
    const description = `${vendorName} — ${docTypeLabel}${refNum}`;

    const flags: string[] = [];
    if (confidence < 0.85) {
      flags.push(`Low OCR confidence (${(confidence * 100).toFixed(0)}%)`);
    }
    if (!vendorMatched) {
      flags.push(`Vendor not matched: "${vendorName}"`);
    }

    const status = flags.length > 0 ? 'flagged' : 'pending';
    const flagReason = flags.length > 0 ? flags.join('; ') : null;

    // --- Create transaction ---
    const transaction = await prisma.transaction.create({
      data: {
        date: txDate,
        amount: txAmount,
        type: 'expense',
        description,
        reference: extracted.referenceNumber ?? null,
        paymentMethod: extracted.paymentMethod ?? null,
        categoryId,
        vendorId,
        source: 'receipt_scan',
        sourceId: documentId,
        fiscalYear,
        status,
        flagReason,
        taxDeductible: true, // Farm expenses are generally deductible
      },
    });

    // --- Link document to transaction ---
    await prisma.transactionDocument.create({
      data: {
        transactionId: transaction.id,
        documentId: doc.id,
      },
    });

    // --- CostTracker entries for hay/grain line items ---
    const costTrackerEntries: Array<{ id: string; item: string; unitCost: number; seasonalFlag: string | null }> = [];

    if (vendorSlug && extracted.lineItems?.length) {
      const vendor = await prisma.vendor.findUnique({ where: { slug: vendorSlug } });

      if (vendor && ['feed_supplier'].includes(vendor.type)) {
        for (const lineItem of extracted.lineItems) {
          const mapping = matchItemSlug(lineItem.description);
          if (!mapping || !lineItem.unitPrice) continue;

          const recordDate = txDate;
          const month = recordDate.getMonth() + 1;
          const fy = recordDate.getFullYear();

          // Look up previous price
          const previousEntry = await prisma.costTracker.findFirst({
            where: { vendorId: vendor.id, item: mapping.item, recordedDate: { lt: recordDate } },
            orderBy: { recordedDate: 'desc' },
          });

          const previousCost = previousEntry?.unitCost ? Number(previousEntry.unitCost) : null;
          const percentChange = previousCost
            ? parseFloat(((lineItem.unitPrice - previousCost) / previousCost * 100).toFixed(2))
            : null;

          // YoY comparison
          const priorYearEntry = await prisma.costTracker.findFirst({
            where: { vendorId: vendor.id, item: mapping.item, month, fiscalYear: fy - 1 },
            orderBy: { recordedDate: 'desc' },
          });

          const priorYearCost = priorYearEntry?.unitCost ? Number(priorYearEntry.unitCost) : null;
          const yoyChange = priorYearCost
            ? parseFloat(((lineItem.unitPrice - priorYearCost) / priorYearCost * 100).toFixed(2))
            : null;

          // Seasonal baseline check
          const baseline = await prisma.seasonalBaseline.findFirst({
            where: { vendorId: vendor.id, item: mapping.item, month },
            orderBy: { baselineYear: 'desc' },
          });

          let seasonalFlag: string | null = null;
          if (baseline) {
            const expectedHigh = Number(baseline.expectedHigh);
            const expectedLow = Number(baseline.expectedLow);
            const threshold = Number(baseline.creepThreshold);

            if (lineItem.unitPrice > expectedHigh * (1 + threshold)) {
              seasonalFlag = 'cost_creep';
            } else if (lineItem.unitPrice > expectedHigh) {
              seasonalFlag = 'above_expected';
            } else if (lineItem.unitPrice < expectedLow) {
              seasonalFlag = 'below_expected';
            } else {
              seasonalFlag = 'expected';
            }
          }

          const entry = await prisma.costTracker.create({
            data: {
              vendorId: vendor.id,
              item: mapping.item,
              itemGroup: mapping.itemGroup,
              unit: mapping.unit,
              quantity: lineItem.quantity,
              unitCost: lineItem.unitPrice,
              previousCost,
              percentChange,
              priorYearCost,
              yoyChange,
              seasonalFlag,
              recordedDate: recordDate,
              month,
              fiscalYear: fy,
              invoiceRef: extracted.referenceNumber ?? null,
            },
          });

          costTrackerEntries.push({
            id: entry.id,
            item: mapping.item,
            unitCost: lineItem.unitPrice,
            seasonalFlag,
          });
        }
      }
    }

    // --- Audit log ---
    await prisma.auditLog.create({
      data: {
        action: 'create',
        entity: 'transaction',
        entityId: transaction.id,
        details: JSON.stringify({
          source: 'receipt_scan',
          documentId,
          vendorMatched,
          vendorSlug,
          confidence,
          costTrackerEntries: costTrackerEntries.length,
          flags,
        }),
      },
    });

    return NextResponse.json(
      {
        transactionId: transaction.id,
        documentId,
        vendorMatched,
        vendorSlug,
        categoryId,
        status,
        flags,
        costTrackerEntries,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[Create Transaction from Document] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
