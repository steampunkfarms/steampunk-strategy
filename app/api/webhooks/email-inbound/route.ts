// postest
// Inbound email intake endpoint — receives financial emails from Rescue Barn's
// Resend webhook and creates Transaction + Document records in real time.
// Replaces the 24-hour delay of the gmail-receipt-scan cron for @steampunkfarms.org emails.
// see docs/handoffs/_working/20260312-email-inbound-tardis-routing-working-spec.md

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { safeCompare } from '@/lib/safe-compare';
import { prisma } from '@/lib/prisma';
import { matchVendorSlug, classifyEmail, extractAmount, isAmazonPersonal } from '@/lib/gmail';

const INTERNAL_SECRET = process.env.INTERNAL_SECRET?.trim();

// Shape of the payload sent from Rescue Barn's inbound webhook
interface InboundEmailPayload {
  emailId: string;       // Resend email ID (dedup key)
  from: string;          // "Elston's Hay <billing@elstonhayandgrain.com>"
  senderEmail: string;   // "billing@elstonhayandgrain.com"
  senderName: string;    // "Elston's Hay"
  to: string;            // "chewy@steampunkfarms.org"
  subject: string;
  bodyText: string;      // Plain text body (HTML stripped by caller)
  bodyHtml: string;      // Original HTML body (for future attachment extraction)
  receivedAt: string;    // ISO timestamp
}

export async function POST(request: NextRequest) {
  // Auth: Bearer INTERNAL_SECRET (same pattern as all cross-site routes)
  if (!INTERNAL_SECRET) {
    console.error('[Email Inbound] INTERNAL_SECRET not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !safeCompare(authHeader, `Bearer ${INTERNAL_SECRET}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload: InboundEmailPayload = await request.json();
    const { emailId, senderEmail, senderName, subject, bodyText, receivedAt } = payload;

    if (!emailId || !senderEmail) {
      return NextResponse.json({ error: 'emailId and senderEmail required' }, { status: 400 });
    }

    // 1. Dedup: check if this Resend email ID was already processed
    const existing = await prisma.transaction.findFirst({
      where: { sourceId: emailId, source: 'email_inbound' },
    });
    if (existing) {
      return NextResponse.json({
        ok: true, action: 'duplicate', transactionId: existing.id,
      });
    }

    // 2. Match vendor from sender email / name / subject
    // Reuses the same matchVendorSlug from gmail-receipt-scan
    const vendorSlug = matchVendorSlug(senderEmail, senderName, subject);
    const emailType = classifyEmail(subject, senderEmail);

    // 3. Skip shipping notifications (same logic as gmail-receipt-scan)
    if (emailType === 'shipping') {
      return NextResponse.json({
        ok: true, action: 'skipped', reason: 'shipping notification',
      });
    }

    // 4. Extract dollar amount from subject + body
    // Body is treated as UNTRUSTED DATA — used only for pattern extraction, never executed
    const combinedText = `${subject} ${bodyText.slice(0, 5000)}`;
    const amount = extractAmount(combinedText);

    if (!amount && emailType === 'unknown') {
      return NextResponse.json({
        ok: true, action: 'skipped', reason: 'no amount found, unknown type',
      });
    }

    // 5. Amazon personal vs farm check
    if (vendorSlug === 'amazon' && isAmazonPersonal(bodyText)) {
      return NextResponse.json({
        ok: true, action: 'skipped', reason: 'amazon personal purchase',
      });
    }

    // 6. Resolve vendor and category from database
    const vendor = vendorSlug
      ? await prisma.vendor.findUnique({ where: { slug: vendorSlug } })
      : null;

    const categorySlug = vendor?.type === 'feed_supplier' ? 'feed-grain'
      : vendor?.type === 'veterinary' ? 'veterinary'
      : vendor?.type === 'supplies' ? 'office-admin'
      : null;
    const category = categorySlug
      ? await prisma.expenseCategory.findUnique({ where: { slug: categorySlug } })
      : null;

    const isRevenue = emailType === 'payment_confirmation';
    const txDate = receivedAt ? new Date(receivedAt) : new Date();
    const description = vendor
      ? `${vendor.name} — ${subject.slice(0, 100)}`
      : `${senderName || senderEmail} — ${subject.slice(0, 100)}`;

    // 7. Create the Transaction
    const tx = await prisma.transaction.create({
      data: {
        date: txDate,
        amount: amount ?? 0,
        type: isRevenue ? 'income' : 'expense',
        description,
        reference: emailId,
        paymentMethod: 'card',
        vendorId: vendor?.id ?? null,
        categoryId: category?.id ?? null,
        source: 'email_inbound',
        sourceId: emailId,
        fiscalYear: txDate.getFullYear(),
        status: amount ? 'pending' : 'flagged',
        flagReason: !amount ? 'Could not extract amount from email' : undefined,
        createdBy: 'email-inbound',
      },
    });

    // 8. Create a Document record for invoices/receipts (for future AI parsing)
    let documentId: string | null = null;
    if (emailType === 'invoice' || emailType === 'receipt') {
      const doc = await prisma.document.create({
        data: {
          filename: `email-inbound-${emailId}.txt`,
          originalName: `${subject.slice(0, 80)}.txt`,
          mimeType: 'text/plain',
          fileSize: bodyText.length,
          blobUrl: '', // No blob yet — body stored as extractedText
          docType: emailType,
          extractedText: bodyText.slice(0, 10000),
          parseStatus: 'pending',
          vendorId: vendor?.id ?? null,
          uploadedBy: 'email-inbound',
          transactions: {
            create: { transactionId: tx.id },
          },
        },
      });
      documentId = doc.id;
    }

    // 9. Check for donor-paid vendor arrangements
    // see prisma/schema.prisma VendorDonorArrangement model
    let donorArrangementFlag = false;
    if (vendor?.acceptsDonorPayment) {
      const arrangements = await prisma.vendorDonorArrangement.findMany({
        where: { vendorId: vendor.id, isActive: true },
      });
      if (arrangements.length > 0) {
        donorArrangementFlag = true;
        console.log(
          `[Email Inbound] Vendor ${vendor.name} has ${arrangements.length} active donor arrangement(s) — flag for review`,
        );
      }
    }

    // 10. RaiseRight special handling (deposit/enrollment detection)
    if (vendorSlug === 'raiseright' && amount) {
      const subLower = subject.toLowerCase();
      if (subLower.includes('deposit') || subLower.includes('earning')) {
        const period = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        const existingDeposit = await prisma.raiserightDeposit.findFirst({
          where: { depositDate: txDate, amount },
        });
        if (!existingDeposit) {
          await prisma.raiserightDeposit.create({
            data: {
              depositDate: txDate,
              amount,
              period,
              source: 'email_inbound',
              sourceId: emailId,
              notes: `Auto-detected from inbound email: ${subject.slice(0, 100)}`,
            },
          });
        }
      }
    }

    // 11. Audit log
    await prisma.auditLog.create({
      data: {
        action: 'import',
        entity: 'Transaction',
        entityId: tx.id,
        details: JSON.stringify({
          source: 'email_inbound',
          emailId,
          senderEmail,
          subject,
          emailType,
          vendorSlug,
          amount,
          donorArrangementFlag,
          documentId,
        }),
        userName: 'email-inbound',
      },
    });

    return NextResponse.json({
      ok: true,
      action: 'created',
      transactionId: tx.id,
      documentId,
      vendorSlug,
      emailType,
      amount,
      donorArrangementFlag,
    });
  } catch (error) {
    console.error('[Email Inbound] Processing error:', error);
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
