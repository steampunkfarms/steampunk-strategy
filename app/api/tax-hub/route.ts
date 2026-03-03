export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/tax-hub — list all TaxPrep records
 */
export async function GET() {
  const preps = await prisma.taxPrep.findMany({
    orderBy: [{ fiscalYear: 'desc' }, { formType: 'asc' }],
  });

  // Get available fiscal years from transactions
  const years = await prisma.transaction.groupBy({
    by: ['fiscalYear'],
    _count: true,
    orderBy: { fiscalYear: 'desc' },
  });

  return NextResponse.json({
    preps,
    availableYears: years.map(y => ({ year: y.fiscalYear, count: y._count })),
  });
}

/**
 * POST /api/tax-hub — create TaxPrep for a fiscal year
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const fiscalYear = parseInt(body.fiscalYear);
  const formType = body.formType || '990-EZ';

  if (!fiscalYear || fiscalYear < 2020 || fiscalYear > 2030) {
    return NextResponse.json({ error: 'Invalid fiscal year' }, { status: 400 });
  }

  const existing = await prisma.taxPrep.findUnique({
    where: { fiscalYear_formType: { fiscalYear, formType } },
  });

  if (existing) {
    return NextResponse.json({ prep: existing });
  }

  const prep = await prisma.taxPrep.create({
    data: {
      fiscalYear,
      formType,
      status: 'gathering',
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'create',
      entity: 'tax_prep',
      entityId: prep.id,
      details: JSON.stringify({ fiscalYear, formType }),
    },
  });

  return NextResponse.json({ prep }, { status: 201 });
}
