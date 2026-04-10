export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextResponse } from 'next/server';
import { safeCompare } from '@/lib/safe-compare';
import { prisma } from '@/lib/prisma';
import { allocateTransaction } from '@/lib/allocation-engine';
import { checkDonorArrangement } from '@/lib/arrangements';

/**
 * POST /api/cron/backfill-allocations
 *
 * Retroactively processes existing transactions through the allocation engine.
 * Runs in two modes controlled by ?mode=A (default) or ?mode=B:
 *
 * Mode A — Allocation-only: Assigns programId + functionalClass to unallocated
 *   transactions that have vendor/category data. Also creates DonorPaidBill +
 *   TransparencyItem for transactions from vendors with active donor arrangements.
 *   Batch size: 100 per run.
 *
 * Mode B — Full re-parse: Triggers full pipeline re-parse for email-sourced
 *   documents stuck at parseStatus='pending'. Batch size: 10 per run (each
 *   triggers a Claude API call).
 */

function authorize(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const validTokens = [
    process.env.CRON_SECRET?.trim(),
    process.env.INTERNAL_SECRET?.trim(),
  ].filter(Boolean) as string[];

  if (validTokens.length === 0 || !authHeader) return false;
  return validTokens.some(t => safeCompare(authHeader, `Bearer ${t}`));
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') ?? 'A';

  if (mode === 'B') {
    return runModeB(request);
  }

  return runModeA();
}

// Also accept GET for Vercel cron compatibility (defaults to Mode A)
export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runModeA();
}

/**
 * Mode A — Allocation-only backfill.
 * Finds transactions without programId that have vendor or category data,
 * runs allocateTransaction, and creates DonorPaidBill + TransparencyItem
 * for qualifying vendor arrangements.
 */
async function runModeA() {
  try {
    const unallocated = await prisma.transaction.findMany({
      where: {
        programId: null,
        functionalClass: null, // Skip already-attempted transactions
        type: 'expense',
        OR: [
          { vendorId: { not: null } },
          { categoryId: { not: null } },
        ],
      },
      include: {
        vendor: true,
        category: true,
        documents: { include: { document: true } },
      },
      take: 100,
      orderBy: { date: 'desc' },
    });

    let allocated = 0;
    let donorBillsCreated = 0;

    for (const tx of unallocated) {
      // Extract line items from linked document's extractedData if available
      let lineItems: Array<{ description: string; total: number }> = [];
      const linkedDoc = tx.documents[0]?.document;
      if (linkedDoc?.extractedData) {
        try {
          const data = JSON.parse(linkedDoc.extractedData);
          lineItems = (data.lineItems ?? []).map((li: { description?: string; total?: number; amount?: number }) => ({
            description: li.description ?? '',
            total: li.total ?? li.amount ?? 0,
          }));
        } catch { /* ignore parse errors */ }
      }

      const allocation = await allocateTransaction({
        vendorId: tx.vendorId,
        categoryId: tx.categoryId,
        lineItems,
        extractedReceipt: { total: Number(tx.amount) },
      });

      // Always update functionalClass (even when programId is null) so the
      // transaction doesn't re-appear in the next batch. The allocation engine
      // always returns a functionalClass ('management_general' as fallback).
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          ...(allocation.programId ? { programId: allocation.programId } : {}),
          functionalClass: allocation.functionalClass,
        },
      });

      if (allocation.programId) {
        allocated++;
      }

      // Donor arrangement check — create DonorPaidBill + TransparencyItem if needed
      if (tx.vendorId) {
        try {
          const check = await checkDonorArrangement(
            tx.vendorId,
            tx.date,
            Number(tx.amount),
          );

          if (check.hasArrangement && check.appliesThisInvoice && check.arrangement && check.split) {
            // Check for existing DonorPaidBill on this transaction
            const existingBill = await prisma.donorPaidBill.findFirst({
              where: { transactionId: tx.id },
            });

            if (!existingBill) {
              await prisma.donorPaidBill.create({
                data: {
                  transactionId: tx.id,
                  vendorId: tx.vendorId,
                  donorName: check.arrangement.donorName,
                  donorEmail: check.arrangement.donorEmail,
                  amount: check.split.donorPortion,
                  paidDate: tx.date,
                  coverageType: check.split.donorPortion >= Number(tx.amount) ? 'full' : 'partial',
                },
              });

              // Create TransparencyItem (draft — operator reviews before publishing)
              const period = `${tx.fiscalYear}-Q${Math.floor(tx.date.getMonth() / 3) + 1}`;
              const vendorName = tx.vendor?.name ?? 'Unknown Vendor';
              await prisma.transparencyItem.create({
                data: {
                  transactionId: tx.id,
                  period,
                  category: tx.vendor?.type === 'feed_supplier' ? 'feed_grain' : 'other',
                  displayLabel: `${vendorName} — ${tx.description?.slice(0, 60) ?? 'expense'}`,
                  amount: Number(tx.amount),
                  donorCovered: check.split.donorPortion,
                  isPublished: false,
                },
              });

              donorBillsCreated++;
            }
          }
        } catch (err) {
          console.error(`[Backfill] Donor arrangement check failed for tx ${tx.id}:`, err);
        }
      }
    }

    const remaining = await prisma.transaction.count({
      where: {
        programId: null,
        functionalClass: null,
        type: 'expense',
        OR: [{ vendorId: { not: null } }, { categoryId: { not: null } }],
      },
    });

    console.log(`[Backfill Mode A] Processed ${unallocated.length}, allocated ${allocated}, donor bills ${donorBillsCreated}, remaining ${remaining}`);

    return NextResponse.json({
      mode: 'A',
      processed: unallocated.length,
      allocated,
      donorBillsCreated,
      remaining,
    });
  } catch (error) {
    console.error('[Backfill Mode A] Error:', error);
    return NextResponse.json(
      { error: 'Backfill failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

/**
 * Mode B — Full re-parse backfill.
 * Finds email-sourced documents stuck at parseStatus='pending',
 * unlinks their lightweight transactions, and triggers full pipeline re-parse.
 * Batch size: 10 (each triggers a Claude API call).
 */
async function runModeB(request: Request) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const internalSecret = process.env.INTERNAL_SECRET?.trim();

    if (!internalSecret) {
      return NextResponse.json({ error: 'INTERNAL_SECRET required for Mode B' }, { status: 500 });
    }

    const unparsed = await prisma.document.findMany({
      where: {
        parseStatus: 'pending',
        uploadedBy: { in: ['email-inbound', 'gmail-scanner'] },
      },
      include: {
        transactions: true,
      },
      take: 10,
      orderBy: { uploadedAt: 'desc' },
    });

    let unlinked = 0;
    let triggered = 0;

    for (const doc of unparsed) {
      // Unlink existing lightweight transaction so createTransactionFromDocument can run
      for (const link of doc.transactions) {
        await prisma.transactionDocument.delete({
          where: {
            transactionId_documentId: {
              transactionId: link.transactionId,
              documentId: doc.id,
            },
          },
        });
        // Mark the old transaction as superseded
        await prisma.transaction.update({
          where: { id: link.transactionId },
          data: {
            status: 'flagged',
            flagReason: 'Superseded by full pipeline re-parse',
          },
        });
        unlinked++;
      }

      // Trigger full parse + auto-create transaction
      try {
        const res = await fetch(`${baseUrl}/api/documents/parse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${internalSecret}`,
          },
          body: JSON.stringify({ documentId: doc.id, autoCreateTransaction: true }),
        });

        if (res.ok) {
          triggered++;
        } else {
          console.error(`[Backfill Mode B] Parse trigger failed for ${doc.id}: ${res.status}`);
        }
      } catch (err) {
        console.error(`[Backfill Mode B] Parse trigger error for ${doc.id}:`, err);
      }
    }

    const remaining = await prisma.document.count({
      where: {
        parseStatus: 'pending',
        uploadedBy: { in: ['email-inbound', 'gmail-scanner'] },
      },
    });

    console.log(`[Backfill Mode B] Processed ${unparsed.length}, unlinked ${unlinked}, triggered ${triggered}, remaining ${remaining}`);

    return NextResponse.json({
      mode: 'B',
      processed: unparsed.length,
      unlinked,
      triggered,
      remaining,
    });
  } catch (error) {
    console.error('[Backfill Mode B] Error:', error);
    return NextResponse.json(
      { error: 'Backfill failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
