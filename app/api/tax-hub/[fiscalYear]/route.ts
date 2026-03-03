export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTaxRollup } from '@/lib/queries';

/**
 * GET /api/tax-hub/[fiscalYear] — get rollup data + TaxPrep record
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ fiscalYear: string }> }) {
  const { fiscalYear: fyStr } = await params;
  const fiscalYear = parseInt(fyStr);

  if (!fiscalYear || fiscalYear < 2020 || fiscalYear > 2030) {
    return NextResponse.json({ error: 'Invalid fiscal year' }, { status: 400 });
  }

  const [rollup, prep] = await Promise.all([
    getTaxRollup(fiscalYear),
    prisma.taxPrep.findUnique({
      where: { fiscalYear_formType: { fiscalYear, formType: '990-EZ' } },
    }),
  ]);

  return NextResponse.json({ rollup, prep });
}

/**
 * PATCH /api/tax-hub/[fiscalYear] — update TaxPrep record
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ fiscalYear: string }> }) {
  const { fiscalYear: fyStr } = await params;
  const fiscalYear = parseInt(fyStr);
  const body = await req.json();

  let prep = await prisma.taxPrep.findUnique({
    where: { fiscalYear_formType: { fiscalYear, formType: '990-EZ' } },
  });

  if (!prep) {
    prep = await prisma.taxPrep.create({
      data: { fiscalYear, formType: '990-EZ', status: 'gathering' },
    });
  }

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.partIIINarrative !== undefined) data.partIIINarrative = body.partIIINarrative;
  if (body.narrativeModel !== undefined) data.narrativeModel = body.narrativeModel;
  if (body.scheduleONotes !== undefined) data.scheduleONotes = body.scheduleONotes;
  if (body.revenueSnapshot !== undefined) data.revenueSnapshot = body.revenueSnapshot;
  if (body.expenseSnapshot !== undefined) data.expenseSnapshot = body.expenseSnapshot;
  if (body.totalTransactions !== undefined) data.totalTransactions = body.totalTransactions;
  if (body.categorizedCount !== undefined) data.categorizedCount = body.categorizedCount;
  if (body.uncategorizedCount !== undefined) data.uncategorizedCount = body.uncategorizedCount;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.lastReviewedBy !== undefined) data.lastReviewedBy = body.lastReviewedBy;

  const updated = await prisma.taxPrep.update({
    where: { id: prep.id },
    data,
  });

  return NextResponse.json({ prep: updated });
}
