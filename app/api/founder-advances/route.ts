// postest
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/founder-advances
 * List all advances with optional ?fiscalYear=2026&status=outstanding filters.
 * Returns advances + summary (totalAdvanced, totalRepaid, outstandingBalance).
 *
 * POST /api/founder-advances
 * Create a new founder advance record.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fiscalYear = searchParams.get('fiscalYear');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (fiscalYear) where.fiscalYear = parseInt(fiscalYear, 10);
    if (status) where.status = status;

    const advances = await prisma.founderAdvance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const totalAdvanced = advances.reduce((sum, a) => sum + Number(a.amount), 0);
    const totalRepaid = advances.reduce((sum, a) => sum + Number(a.repaidAmount), 0);

    return NextResponse.json({
      advances,
      summary: {
        totalAdvanced,
        totalRepaid,
        outstandingBalance: totalAdvanced - totalRepaid,
        count: advances.length,
        outstandingCount: advances.filter(a => a.status !== 'repaid').length,
      },
    });
  } catch (error) {
    console.error('Founder advances list error:', error);
    return NextResponse.json({ error: 'Failed to list founder advances' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, amount, description, personalAccount, reference, memo, transactionId, vendorName, fiscalYear } = body;

    if (!date || !amount || !description || !personalAccount || !fiscalYear) {
      return NextResponse.json(
        { error: 'date, amount, description, personalAccount, and fiscalYear are required' },
        { status: 400 }
      );
    }

    const advance = await prisma.founderAdvance.create({
      data: {
        date: new Date(date),
        amount,
        description,
        personalAccount,
        reference,
        memo,
        transactionId,
        vendorName,
        fiscalYear: parseInt(fiscalYear, 10),
      },
    });

    return NextResponse.json(advance, { status: 201 });
  } catch (error) {
    console.error('Founder advance create error:', error);
    return NextResponse.json({ error: 'Failed to create founder advance' }, { status: 500 });
  }
}
