export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for large backfills

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getGmailClient,
  matchVendorSlug,
  classifyEmail,
  extractAmount,
  parseEmailHeaders,
  getTextFromParts,
  decodeBody,
  isDuplicate,
  isAmazonPersonal,
  buildIncrementalQuery,
} from '@/lib/gmail';

/**
 * POST /api/documents/gmail-backfill
 *
 * Backfill historical Gmail receipts into Transactions.
 * Body: { startDate: string (YYYY-MM-DD), endDate?: string (YYYY-MM-DD), maxResults?: number }
 *
 * Requires authenticated session. Reuses gmail.ts vendor matching, amount extraction, dedup.
 * see docs/handoffs/_working/20260307-tardis-data-gap-fixes-working-spec.md
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { startDate, endDate, maxResults = 200 } = await request.json();

    if (!startDate) {
      return NextResponse.json({ error: 'startDate is required (YYYY-MM-DD)' }, { status: 400 });
    }

    const gmail = getGmailClient();

    // Build query for the date range
    const afterStr = startDate.replace(/-/g, '/');
    let query = buildIncrementalQuery(afterStr);
    if (endDate) {
      const beforeStr = endDate.replace(/-/g, '/');
      query += ` before:${beforeStr}`;
    }

    // Collect message IDs
    const messageIds = new Set<string>();
    let pageToken: string | undefined;

    do {
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: Math.min(maxResults - messageIds.size, 100),
        pageToken,
      });

      if (listRes.data.messages) {
        for (const msg of listRes.data.messages) {
          if (msg.id) messageIds.add(msg.id);
        }
      }

      pageToken = listRes.data.nextPageToken ?? undefined;
    } while (pageToken && messageIds.size < maxResults);

    const result = {
      scanned: messageIds.size,
      imported: 0,
      skipped: 0,
      duplicates: 0,
      errors: [] as Array<{ messageId: string; error: string }>,
      imported_details: [] as Array<{ date: string; vendor: string; amount: number; description: string }>,
    };

    for (const messageId of messageIds) {
      try {
        const msgRes = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full',
        });

        const msg = msgRes.data;
        if (!msg.payload?.headers) {
          result.skipped++;
          continue;
        }

        const headers = parseEmailHeaders(msg.payload.headers as Array<{ name: string; value: string }>);
        const emailType = classifyEmail(headers.subject, headers.senderEmail);

        if (emailType === 'shipping') {
          result.skipped++;
          continue;
        }

        let bodyText = '';
        if (msg.payload.parts) {
          bodyText = getTextFromParts(msg.payload.parts as Parameters<typeof getTextFromParts>[0]);
        } else if (msg.payload.body?.data) {
          bodyText = decodeBody(msg.payload.body as { data?: string });
        }

        const amount = extractAmount(`${headers.subject} ${bodyText}`);
        if (!amount && emailType === 'unknown') {
          result.skipped++;
          continue;
        }

        const vendorSlug = matchVendorSlug(headers.senderEmail, headers.senderName, headers.subject);

        if (vendorSlug === 'amazon' && isAmazonPersonal(bodyText)) {
          result.skipped++;
          continue;
        }

        const duplicate = await isDuplicate(messageId, vendorSlug, headers.date, amount);
        if (duplicate) {
          result.duplicates++;
          continue;
        }

        // Resolve vendor and category
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
        const txDate = new Date(headers.date);

        const description = vendor
          ? `${vendor.name} — ${headers.subject.slice(0, 100)}`
          : headers.subject.slice(0, 200);

        const tx = await prisma.transaction.create({
          data: {
            date: txDate,
            amount: amount ?? 0,
            type: isRevenue ? 'income' : 'expense',
            description,
            reference: messageId,
            paymentMethod: 'card',
            vendorId: vendor?.id ?? null,
            categoryId: category?.id ?? null,
            source: 'gmail_backfill',
            sourceId: messageId,
            fiscalYear: txDate.getFullYear(),
            status: amount ? 'pending' : 'flagged',
            flagReason: !amount ? 'Could not extract amount from email' : undefined,
            createdBy: session.user?.name ?? 'gmail-backfill',
          },
        });

        await prisma.auditLog.create({
          data: {
            action: 'import',
            entity: 'Transaction',
            entityId: tx.id,
            details: JSON.stringify({
              source: 'gmail_backfill',
              messageId,
              senderEmail: headers.senderEmail,
              subject: headers.subject,
              emailType,
              vendorSlug,
              startDate,
              endDate: endDate ?? null,
            }),
            userName: session.user?.name ?? 'gmail-backfill',
          },
        });

        result.imported++;
        result.imported_details.push({
          date: txDate.toISOString().split('T')[0],
          vendor: vendor?.name ?? `Unknown (${headers.senderEmail})`,
          amount: amount ?? 0,
          description: description.slice(0, 80),
        });
      } catch (e) {
        result.errors.push({
          messageId,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    console.log(`[Gmail Backfill] Complete — scanned=${result.scanned}, imported=${result.imported}, duplicates=${result.duplicates}, skipped=${result.skipped}, errors=${result.errors.length}`);

    return NextResponse.json(result);
  } catch (e) {
    console.error('[Gmail Backfill] Fatal error:', e);
    return NextResponse.json(
      { error: 'Gmail backfill failed', details: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
