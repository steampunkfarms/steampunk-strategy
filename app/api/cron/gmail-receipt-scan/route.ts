import { NextResponse } from 'next/server';
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
  FINANCIAL_QUERIES,
} from '@/lib/gmail';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel Pro: 60s max for cron

interface ScanResult {
  imported: Array<{ date: string; vendor: string; amount: number; description: string }>;
  skipped: Array<{ messageId: string; reason: string }>;
  errors: Array<{ messageId: string; error: string }>;
  scannedCount: number;
}

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const gmail = getGmailClient();
    const result: ScanResult = { imported: [], skipped: [], errors: [], scannedCount: 0 };

    // Determine the scan window — last 7 days for daily cron, or use query param
    const url = new URL(request.url);
    const daysBack = parseInt(url.searchParams.get('days') ?? '7', 10);
    const afterDate = new Date();
    afterDate.setDate(afterDate.getDate() - daysBack);
    const afterStr = `${afterDate.getFullYear()}/${String(afterDate.getMonth() + 1).padStart(2, '0')}/${String(afterDate.getDate()).padStart(2, '0')}`;

    // Collect all message IDs from our search queries
    const messageIds = new Set<string>();

    for (const query of FINANCIAL_QUERIES) {
      const fullQuery = `${query} after:${afterStr}`;
      try {
        const listRes = await gmail.users.messages.list({
          userId: 'me',
          q: fullQuery,
          maxResults: 50,
        });

        if (listRes.data.messages) {
          for (const msg of listRes.data.messages) {
            if (msg.id) messageIds.add(msg.id);
          }
        }
      } catch (e) {
        console.error(`[Gmail Scan] Query failed: ${query}`, e);
      }
    }

    result.scannedCount = messageIds.size;

    // Process each unique message
    for (const messageId of messageIds) {
      try {
        const msgRes = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full',
        });

        const msg = msgRes.data;
        if (!msg.payload?.headers) {
          result.skipped.push({ messageId, reason: 'no headers' });
          continue;
        }

        const headers = parseEmailHeaders(msg.payload.headers as Array<{ name: string; value: string }>);
        const emailType = classifyEmail(headers.subject, headers.senderEmail);

        // Skip shipping notifications and unknowns without amounts
        if (emailType === 'shipping') {
          result.skipped.push({ messageId, reason: 'shipping notification' });
          continue;
        }

        // Get email body text
        let bodyText = '';
        if (msg.payload.parts) {
          bodyText = getTextFromParts(msg.payload.parts as Parameters<typeof getTextFromParts>[0]);
        } else if (msg.payload.body?.data) {
          bodyText = decodeBody(msg.payload.body);
        }

        // Extract amount
        const amount = extractAmount(`${headers.subject} ${bodyText}`);

        if (!amount && emailType === 'unknown') {
          result.skipped.push({ messageId, reason: 'no amount found, unknown type' });
          continue;
        }

        // Match vendor
        const vendorSlug = matchVendorSlug(headers.senderEmail, headers.senderName, headers.subject);

        // Amazon: skip personal purchases (card 9785 only, no gift card = personal)
        if (vendorSlug === 'amazon' && isAmazonPersonal(bodyText)) {
          result.skipped.push({ messageId, reason: 'amazon personal (card 9785, no gift card)' });
          continue;
        }

        // Check for duplicates
        const duplicate = await isDuplicate(messageId, vendorSlug, headers.date, amount);
        if (duplicate) {
          result.skipped.push({ messageId, reason: 'duplicate' });
          continue;
        }

        // Check for attachments
        const hasAttachment = msg.payload.parts?.some(p => p.filename && p.filename.length > 0) ?? false;
        const attachment = msg.payload.parts?.find(p => p.filename && p.filename.length > 0);

        // Resolve vendor and category from database
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

        // Create the transaction
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
            source: 'gmail_scan',
            sourceId: messageId,
            fiscalYear: txDate.getFullYear(),
            status: amount ? 'pending' : 'flagged',
            flagReason: !amount ? 'Could not extract amount from email' : undefined,
            createdBy: 'gmail-scanner',
          },
        });

        // Create document record for attachments
        if (hasAttachment && attachment?.filename) {
          await prisma.document.create({
            data: {
              filename: `gmail-${messageId}-${attachment.filename}`,
              originalName: attachment.filename,
              mimeType: attachment.mimeType ?? 'application/octet-stream',
              fileSize: parseInt(attachment.body?.size?.toString() ?? '0', 10),
              blobUrl: '', // Will be populated when attachment is downloaded
              docType: emailType === 'invoice' ? 'invoice' : 'receipt',
              parseStatus: 'pending',
              vendorId: vendor?.id ?? null,
              uploadedBy: 'gmail-scanner',
              transactions: {
                create: { transactionId: tx.id },
              },
            },
          });
        }

        // Audit log
        await prisma.auditLog.create({
          data: {
            action: 'import',
            entity: 'Transaction',
            entityId: tx.id,
            details: JSON.stringify({
              source: 'gmail_scan',
              messageId,
              senderEmail: headers.senderEmail,
              subject: headers.subject,
              emailType,
              vendorSlug,
              hasAttachment,
            }),
            userName: 'gmail-scanner',
          },
        });

        result.imported.push({
          date: txDate.toISOString().split('T')[0],
          vendor: vendor?.name ?? `Unknown (${headers.senderEmail})`,
          amount: amount ?? 0,
          description: description.slice(0, 80),
        });

        // Flag Star Milling invoices for Ironwood arrangement check
        if (vendorSlug === 'star-milling' && !isRevenue) {
          console.log(`[Gmail Scan] Star Milling invoice detected — check Ironwood arrangement for ${txDate.toISOString().split('T')[0]}, amount: $${amount}`);
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        result.errors.push({ messageId, error: errorMsg });
        console.error(`[Gmail Scan] Error processing ${messageId}:`, e);
      }
    }

    // Summary log
    console.log(`[Gmail Scan] Complete — Scanned: ${result.scannedCount}, Imported: ${result.imported.length}, Skipped: ${result.skipped.length}, Errors: ${result.errors.length}`);

    return NextResponse.json({
      success: true,
      summary: {
        scanned: result.scannedCount,
        imported: result.imported.length,
        skipped: result.skipped.length,
        errors: result.errors.length,
      },
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors,
    });
  } catch (e) {
    console.error('[Gmail Scan] Fatal error:', e);
    return NextResponse.json(
      { error: 'Gmail scan failed', details: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
