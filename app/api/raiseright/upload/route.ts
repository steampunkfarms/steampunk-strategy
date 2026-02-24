export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  parseCSV,
  detectReportType,
  importEarningsSummary,
  importOrderHistory,
  importDepositSlip,
  importParticipantList,
} from '@/lib/raiseright';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB — CSVs are small

/**
 * POST /api/raiseright/upload
 *
 * Accepts a RaiseRight CSV export. Auto-detects the report type from
 * headers, parses the data, and imports it into the database.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are accepted. Export from your RaiseRight coordinator dashboard.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 5MB` },
        { status: 400 },
      );
    }

    const text = await file.text();
    const allRows = parseCSV(text);

    if (allRows.length < 2) {
      return NextResponse.json(
        { error: 'CSV appears empty or has no data rows.' },
        { status: 400 },
      );
    }

    const headers = allRows[0];
    const dataRows = allRows.slice(1);

    const reportType = detectReportType(headers);
    if (!reportType) {
      return NextResponse.json(
        {
          error: 'Could not detect report type from CSV headers.',
          hint: 'Supported reports: Earnings Summary by Participant, Order History by Participant, Monthly Deposit Slip, Participant Summary and Email List.',
          headers: headers.slice(0, 10),
        },
        { status: 400 },
      );
    }

    let result;
    switch (reportType) {
      case 'earnings_summary':
        result = await importEarningsSummary(dataRows, headers, file.name, 'csv-upload');
        break;
      case 'order_history':
        result = await importOrderHistory(dataRows, headers, file.name, 'csv-upload');
        break;
      case 'deposit_slip':
        result = await importDepositSlip(dataRows, headers, file.name, 'csv-upload');
        break;
      case 'participant_list':
        result = await importParticipantList(dataRows, headers, file.name, 'csv-upload');
        break;
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'import',
        entity: 'RaiserightImport',
        entityId: result.importId,
        details: JSON.stringify({
          filename: file.name,
          reportType,
          recordCount: result.recordCount,
          totalEarnings: result.totalEarnings,
        }),
        userName: 'csv-upload',
      },
    });

    return NextResponse.json({
      success: true,
      importId: result.importId,
      reportType: result.reportType,
      recordCount: result.recordCount,
      totalEarnings: result.totalEarnings,
      errors: result.errors,
    });
  } catch (e) {
    console.error('[RaiseRight Upload] Error:', e);
    return NextResponse.json(
      { error: 'Failed to process CSV', details: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
