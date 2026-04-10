// Inbound email intake endpoint — receives financial emails from Rescue Barn's
// Resend webhook and creates Document records for the full parse pipeline.
// Replaces direct Transaction creation with document-first flow:
//   Email → Document → Claude parse → createTransactionFromDocument (full pipeline)
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

    // 1. Dedup: check if this Resend email ID was already processed (Document-based)
    const existingDoc = await prisma.document.findFirst({
      where: { sourceId: emailId, source: 'email_inbound' },
    });
    if (existingDoc) {
      return NextResponse.json({
        ok: true, action: 'duplicate', documentId: existingDoc.id,
      });
    }

    // Also check legacy Transaction-based dedup (pre-pipeline records)
    const existingTx = await prisma.transaction.findFirst({
      where: { sourceId: emailId, source: 'email_inbound' },
    });
    if (existingTx) {
      return NextResponse.json({
        ok: true, action: 'duplicate', transactionId: existingTx.id, legacy: true,
      });
    }

    // 2. Match vendor from sender email / name / subject
    const vendorSlug = matchVendorSlug(senderEmail, senderName, subject);
    const emailType = classifyEmail(subject, senderEmail);

    // 3. Skip shipping notifications
    if (emailType === 'shipping') {
      return NextResponse.json({
        ok: true, action: 'skipped', reason: 'shipping notification',
      });
    }

    // 4. Extract dollar amount from subject + body
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

    // 6. Resolve vendor from database (needed for Document record)
    const vendor = vendorSlug
      ? await prisma.vendor.findUnique({ where: { slug: vendorSlug } })
      : null;

    // 7. Create Document ONLY — no Transaction
    const doc = await prisma.document.create({
      data: {
        filename: `email-inbound-${emailId}.txt`,
        originalName: `${subject.slice(0, 80)}.txt`,
        mimeType: 'text/plain',
        fileSize: bodyText.length,
        blobUrl: '',              // No blob — body stored as extractedText
        extractedText: bodyText.slice(0, 10000),
        docType: emailType === 'invoice'
          ? 'invoice'
          : emailType === 'receipt'
            ? 'receipt'
            : 'other',
        parseStatus: 'pending',
        vendorId: vendor?.id ?? null,
        uploadedBy: 'email-inbound',
        source: 'email_inbound',
        sourceId: emailId,
      },
    });

    // 8. Fire-and-forget: trigger Claude parse → createTransactionFromDocument pipeline
    const baseUrl = process.env.NEXTAUTH_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    fetch(`${baseUrl}/api/documents/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INTERNAL_SECRET}`,
      },
      body: JSON.stringify({ documentId: doc.id, autoCreateTransaction: true }),
    }).catch(err => console.error('[Email Inbound] Parse trigger failed:', err));

    // 9. RaiseRight special handling (side-channel — no conflict with pipeline)
    if (vendorSlug === 'raiseright' && amount) {
      const txDate = receivedAt ? new Date(receivedAt) : new Date();
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

    // 10. Audit log
    await prisma.auditLog.create({
      data: {
        action: 'email_inbound_document_created',
        entity: 'Document',
        entityId: doc.id,
        details: JSON.stringify({
          emailId,
          senderEmail,
          subject,
          emailType,
          vendorSlug,
          amount,
        }),
        userName: 'email-inbound',
      },
    });

    return NextResponse.json({
      ok: true,
      action: 'created',
      documentId: doc.id,
      parseStatus: 'pending',
      vendorSlug,
      emailType,
      amount,
    });
  } catch (error) {
    console.error('[Email Inbound] Processing error:', error);
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
