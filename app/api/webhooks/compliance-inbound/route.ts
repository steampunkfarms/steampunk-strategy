// postest
// Compliance email intake endpoint — receives government/regulatory emails
// from Rescue Barn's inbound handler and creates ComplianceAlert records.
// Replaces the compliance scanning phase of gmail-receipt-scan cron.
// see bts-governance/strategist/handoffs/2026-04-05-gmail-scanner-deprecation.md

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { safeCompare } from '@/lib/safe-compare';
import {
  classifyComplianceEmail,
  matchComplianceTask,
  extractDeadline,
  createComplianceAlert,
  isComplianceDuplicate,
  type ComplianceNotice,
} from '@/lib/compliance-scanner';

const INTERNAL_SECRET = process.env.INTERNAL_SECRET?.trim();

interface InboundEmailPayload {
  emailId: string;
  from: string;
  senderEmail: string;
  senderName: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  receivedAt: string;
}

export async function POST(request: NextRequest) {
  // Auth: Bearer INTERNAL_SECRET
  if (!INTERNAL_SECRET) {
    console.error('[Compliance Inbound] INTERNAL_SECRET not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !safeCompare(authHeader, `Bearer ${INTERNAL_SECRET}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload: InboundEmailPayload = await request.json();
    const { emailId, senderEmail, subject, bodyText, receivedAt } = payload;

    if (!emailId || !senderEmail) {
      return NextResponse.json({ error: 'emailId and senderEmail required' }, { status: 400 });
    }

    // 1. Dedup: check if this email was already processed
    const isDupe = await isComplianceDuplicate(emailId);
    if (isDupe) {
      return NextResponse.json({ ok: true, action: 'duplicate' });
    }

    // 2. Classify the compliance email
    const classification = classifyComplianceEmail(subject, senderEmail, bodyText);
    if (!classification.isCompliance) {
      return NextResponse.json({
        ok: true, action: 'skipped', reason: 'not classified as compliance',
      });
    }

    // 3. Match to existing ComplianceTask
    const matchedTask = classification.authority
      ? await matchComplianceTask(classification.authority, subject)
      : null;

    // 4. Extract deadline
    const deadline = extractDeadline(subject, bodyText);

    // 5. Create ComplianceAlert
    const notice: ComplianceNotice = {
      messageId: emailId,
      authority: classification.authority || 'Unknown',
      noticeType: classification.noticeType,
      urgency: classification.urgency,
      subject,
      senderEmail,
      receivedDate: receivedAt ? new Date(receivedAt) : new Date(),
      extractedDeadline: deadline,
      bodySnippet: bodyText.slice(0, 500),
      matchedTaskSlug: matchedTask?.slug ?? null,
    };

    await createComplianceAlert(notice);

    return NextResponse.json({
      ok: true,
      action: 'created',
      authority: classification.authority,
      urgency: classification.urgency,
      noticeType: classification.noticeType,
      matchedTask: matchedTask?.slug ?? null,
      deadline: deadline?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[Compliance Inbound] Processing error:', error);
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
