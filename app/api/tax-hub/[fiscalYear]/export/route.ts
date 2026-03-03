export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { getTaxRollup } from '@/lib/queries';
import { generateExportZip } from '@/lib/tax-export';

/**
 * POST /api/tax-hub/[fiscalYear]/export — generate ZIP export and upload to Blob
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ fiscalYear: string }> }) {
  const { fiscalYear: fyStr } = await params;
  const fiscalYear = parseInt(fyStr);

  if (!fiscalYear || fiscalYear < 2020 || fiscalYear > 2030) {
    return NextResponse.json({ error: 'Invalid fiscal year' }, { status: 400 });
  }

  const rollup = await getTaxRollup(fiscalYear);

  // Get existing TaxPrep for narrative data
  let prep = await prisma.taxPrep.findUnique({
    where: { fiscalYear_formType: { fiscalYear, formType: '990-EZ' } },
  });

  if (!prep) {
    prep = await prisma.taxPrep.create({
      data: { fiscalYear, formType: '990-EZ', status: 'gathering' },
    });
  }

  // Freeze snapshots
  const revenueSnapshot = JSON.stringify(rollup.revenue);
  const expenseSnapshot = JSON.stringify(rollup.expenses);

  const zipBuffer = await generateExportZip(
    fiscalYear,
    rollup,
    prep.partIIINarrative,
    prep.scheduleONotes,
  );

  const dateStr = new Date().toISOString().split('T')[0];
  const blob = await put(
    `tax-hub/${fiscalYear}/990-ez-export-${dateStr}.zip`,
    zipBuffer,
    { access: 'public', contentType: 'application/zip', addRandomSuffix: true },
  );

  const updated = await prisma.taxPrep.update({
    where: { id: prep.id },
    data: {
      status: 'export_ready',
      exportBlobUrl: blob.url,
      exportGeneratedAt: new Date(),
      revenueSnapshot,
      expenseSnapshot,
      totalTransactions: rollup.completeness.total,
      categorizedCount: rollup.completeness.categorized,
      uncategorizedCount: rollup.completeness.uncategorized,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'generate_export',
      entity: 'tax_prep',
      entityId: prep.id,
      details: JSON.stringify({
        fiscalYear,
        exportUrl: blob.url,
        sizeBytes: zipBuffer.length,
        revenue: rollup.revenue.total,
        expenses: rollup.expenses.total,
      }),
    },
  });

  return NextResponse.json({ exportUrl: blob.url, prep: updated });
}
