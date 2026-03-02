export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/documents/update-transaction
 *
 * Updates an existing transaction linked to a document + saves enrichment data.
 * Body: {
 *   documentId: string,
 *   overrides?: { date?, amount?, notes?, lineItemTags?, lineItemNotes?,
 *                 donorPaid?: { donorName, amount, donorEmail?, donorId? } }
 * }
 */
export async function PATCH(request: Request) {
  try {
    const { documentId, overrides } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    // Find the linked transaction
    const txDoc = await prisma.transactionDocument.findFirst({
      where: { documentId },
      include: { transaction: true },
    });

    if (!txDoc) {
      return NextResponse.json(
        { error: 'No transaction linked to this document. Use create-transaction instead.' },
        { status: 404 },
      );
    }

    const transaction = txDoc.transaction;

    // --- Update transaction fields ---
    const txUpdates: Record<string, unknown> = {};

    if (overrides?.date) {
      txUpdates.date = new Date(overrides.date);
      txUpdates.fiscalYear = new Date(overrides.date).getFullYear();
    }

    if (overrides?.amount != null) {
      txUpdates.amount = typeof overrides.amount === 'number'
        ? overrides.amount
        : parseFloat(overrides.amount);
    }

    if (Object.keys(txUpdates).length > 0) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: txUpdates,
      });
    }

    // --- Upsert journal note ---
    let journalNoteId: string | null = null;

    if (overrides?.notes != null) {
      const trimmedNotes = String(overrides.notes).trim();

      // Find existing user note
      const existingNote = await prisma.journalNote.findFirst({
        where: { transactionId: transaction.id, type: 'note' },
        orderBy: { createdAt: 'desc' },
      });

      if (trimmedNotes) {
        if (existingNote) {
          await prisma.journalNote.update({
            where: { id: existingNote.id },
            data: { content: trimmedNotes },
          });
          journalNoteId = existingNote.id;
        } else {
          const note = await prisma.journalNote.create({
            data: {
              content: trimmedNotes,
              type: 'note',
              transactionId: transaction.id,
            },
          });
          journalNoteId = note.id;
        }
      } else if (existingNote) {
        // Empty notes = delete the note
        await prisma.journalNote.delete({ where: { id: existingNote.id } });
      }
    }

    // --- Update enrichment data on document ---
    if (overrides?.lineItemTags || overrides?.lineItemNotes) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          enrichmentData: JSON.stringify({
            lineItemTags: overrides.lineItemTags ?? {},
            lineItemNotes: overrides.lineItemNotes ?? {},
          }),
        },
      });
    }

    // --- Upsert donor-paid bill ---
    let donorPaidBillId: string | null = null;

    if (overrides?.donorPaid && transaction.vendorId) {
      const dp = overrides.donorPaid;
      const dpAmount = typeof dp.amount === 'number' ? dp.amount : parseFloat(dp.amount);
      const txAmount = Number(overrides?.amount ?? transaction.amount);

      if (dpAmount > 0 && dp.donorName) {
        const coverageType = dpAmount >= txAmount ? 'full' : 'partial';

        // Check for existing donor-paid bill
        const existingDpb = await prisma.donorPaidBill.findFirst({
          where: { transactionId: transaction.id },
        });

        if (existingDpb) {
          await prisma.donorPaidBill.update({
            where: { id: existingDpb.id },
            data: {
              donorName: dp.donorName,
              donorEmail: dp.donorEmail ?? null,
              donorId: dp.donorId ?? null,
              amount: dpAmount,
              coverageType,
            },
          });
          donorPaidBillId = existingDpb.id;
        } else {
          const newDpb = await prisma.donorPaidBill.create({
            data: {
              transactionId: transaction.id,
              vendorId: transaction.vendorId,
              donorName: dp.donorName,
              donorEmail: dp.donorEmail ?? null,
              donorId: dp.donorId ?? null,
              amount: dpAmount,
              paidDate: transaction.date,
              coverageType,
            },
          });
          donorPaidBillId = newDpb.id;
        }
      }
    }

    // --- Audit log ---
    await prisma.auditLog.create({
      data: {
        action: 'update',
        entity: 'transaction',
        entityId: transaction.id,
        details: JSON.stringify({
          source: 'receipt_scan_update',
          documentId,
          updatedFields: Object.keys(txUpdates),
          journalNoteId,
          donorPaidBillId,
          hasEnrichment: !!(overrides?.lineItemTags || overrides?.lineItemNotes),
        }),
      },
    });

    return NextResponse.json({
      transactionId: transaction.id,
      documentId,
      updated: true,
      journalNoteId,
      donorPaidBillId,
    });
  } catch (error) {
    console.error('[Update Transaction] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
