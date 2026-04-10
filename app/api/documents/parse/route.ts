export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createMessage } from '@/lib/claude';
import { prisma } from '@/lib/prisma';
import { safeCompare } from '@/lib/safe-compare';
import { RECEIPT_EXTRACTION_PROMPT, parseExtractionResponse } from '@/lib/receipt-parser';
import { matchVendorByName } from '@/lib/vendor-match';
import { runInvoicePipeline } from '@/lib/invoice-pipeline';
import { createTransactionFromDocument } from '@/lib/create-transaction-from-document';
import { checkDonorArrangement } from '@/lib/arrangements';

const MODEL = 'claude-sonnet-4-20250514';

/**
 * POST /api/documents/parse
 *
 * Sends a Document's blob (or text) to Claude for structured extraction.
 * Body: { documentId: string, autoCreateTransaction?: boolean }
 *
 * Auth: NextAuth session (UI) or Bearer INTERNAL_SECRET (internal pipelines).
 * The middleware handles session auth. For internal callers (email webhook,
 * gmail cron), INTERNAL_SECRET is checked here as middleware whitelists /api/cron
 * but not this route.
 */
export async function POST(request: Request) {
  try {
    // Clone request for potential error-path re-read
    const clonedRequest = request.clone();
    const body = await request.json();
    const { documentId, autoCreateTransaction } = body;

    // Internal auth check — if called with INTERNAL_SECRET, skip session requirement
    // (session auth is handled by middleware for browser requests)
    if (autoCreateTransaction) {
      const authHeader = request.headers.get('authorization');
      const secret = process.env.INTERNAL_SECRET?.trim();
      if (!secret || !authHeader || !safeCompare(authHeader, `Bearer ${secret}`)) {
        return NextResponse.json({ error: 'autoCreateTransaction requires INTERNAL_SECRET' }, { status: 401 });
      }
    }

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    const doc = await prisma.document.findUnique({ where: { id: documentId }, include: { vendor: true } });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.parseStatus === 'complete') {
      // Resolve vendorSlug for cached responses
      let cachedVendorSlug: string | null = doc.vendor?.slug ?? null;
      if (!cachedVendorSlug && doc.extractedData) {
        try {
          const cached = JSON.parse(doc.extractedData);
          if (cached.vendor?.name) {
            cachedVendorSlug = matchVendorByName(cached.vendor.name);
          }
        } catch { /* ignore parse errors */ }
      }

      // Check for existing linked transaction
      const txDoc = await prisma.transactionDocument.findFirst({
        where: { documentId: doc.id },
        include: {
          transaction: {
            select: { id: true, date: true, amount: true, description: true, status: true },
          },
        },
      });

      // Fetch existing user notes (not period breakdowns) if transaction exists
      const existingNote = txDoc
        ? await prisma.journalNote.findFirst({
            where: { transactionId: txDoc.transactionId, type: 'note' },
            orderBy: { createdAt: 'desc' },
          })
        : null;

      // If already parsed but no transaction, and autoCreateTransaction is requested, create one
      if (autoCreateTransaction && !txDoc) {
        try {
          const overrides = await buildDonorOverrides(doc.vendorId, doc.extractedData);
          const result = await createTransactionFromDocument(doc.id, overrides);
          console.log(`[Parse] Auto-created transaction ${result.transactionId} from already-parsed document ${doc.id}`);
        } catch (err) {
          console.error(`[Parse] Auto-create transaction failed for already-parsed ${doc.id}:`, err);
        }
      }

      return NextResponse.json({
        documentId: doc.id,
        extractedData: doc.extractedData ? JSON.parse(doc.extractedData) : null,
        confidence: doc.confidence ? Number(doc.confidence) : null,
        vendorMatched: !!doc.vendorId,
        vendorSlug: cachedVendorSlug,
        existingTransaction: txDoc ? {
          id: txDoc.transaction.id,
          date: txDoc.transaction.date,
          amount: Number(txDoc.transaction.amount),
          status: txDoc.transaction.status,
        } : null,
        enrichmentData: doc.enrichmentData ? JSON.parse(doc.enrichmentData) : null,
        existingNotes: existingNote?.content ?? null,
        message: 'Already parsed',
      });
    }

    // Mark as processing
    await prisma.document.update({
      where: { id: documentId },
      data: { parseStatus: 'processing' },
    });

    // Determine parse path: blob (image/PDF) or text-only (email body)
    const isTextOnly = !doc.blobUrl && doc.extractedText;

    let responseText: string;

    if (isTextOnly) {
      // ── Text-only parse path (email-sourced documents) ──
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 55_000);

      try {
        const response = await createMessage({
          model: MODEL,
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: `${RECEIPT_EXTRACTION_PROMPT}\n\n--- DOCUMENT TEXT ---\n${doc.extractedText!.slice(0, 8000)}`,
            },
          ],
        }, 'document-parse-text', { signal: abortController.signal });

        clearTimeout(timeoutId);

        responseText = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('');
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('timeout'))) {
          await prisma.document.update({
            where: { id: documentId },
            data: {
              parseStatus: 'failed',
              parseModel: MODEL,
              extractedText: doc.extractedText, // Preserve original text
            },
          });
          return NextResponse.json(
            { error: 'Parse timeout — Claude text extraction exceeded 55s limit', recoverable: true },
            { status: 504 },
          );
        }
        throw error;
      }
    } else {
      // ── Blob parse path (image/PDF documents — existing behavior) ──
      const blobResponse = await fetch(doc.blobUrl);
      if (!blobResponse.ok) {
        await prisma.document.update({
          where: { id: documentId },
          data: { parseStatus: 'failed' },
        });
        return NextResponse.json({ error: 'Failed to fetch blob content' }, { status: 502 });
      }

      const blobBuffer = await blobResponse.arrayBuffer();
      const base64 = Buffer.from(blobBuffer).toString('base64');

      const mediaType = doc.mimeType === 'application/pdf'
        ? 'application/pdf' as const
        : doc.mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

      const contentBlock = doc.mimeType === 'application/pdf'
        ? {
            type: 'document' as const,
            source: {
              type: 'base64' as const,
              media_type: 'application/pdf' as const,
              data: base64,
            },
          }
        : {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
              data: base64,
            },
          };

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 55_000);

      let response;
      try {
        response = await createMessage({
          model: MODEL,
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: [
                contentBlock,
                {
                  type: 'text',
                  text: RECEIPT_EXTRACTION_PROMPT,
                },
              ],
            },
          ],
        }, 'document-parse', { signal: abortController.signal });
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('timeout'))) {
          await prisma.document.update({
            where: { id: documentId },
            data: {
              parseStatus: 'failed',
              parseModel: MODEL,
              extractedText: 'Parse timeout after 55s — Claude Vision call did not complete in time',
            },
          });
          return NextResponse.json(
            { error: 'Parse timeout — Claude Vision exceeded 55 second limit', recoverable: true },
            { status: 504 },
          );
        }
        throw error;
      }
      clearTimeout(timeoutId);

      responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');
    }

    // ── Common post-parse logic (both paths converge here) ──

    const extracted = parseExtractionResponse(responseText);

    if (!extracted) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          parseStatus: 'failed',
          parseModel: MODEL,
          extractedText: responseText,
        },
      });
      return NextResponse.json(
        { error: 'Failed to parse Claude response as JSON', rawResponse: responseText },
        { status: 422 },
      );
    }

    // Try to match vendor and link
    let vendorId: string | null = doc.vendorId;
    let vendorSlug: string | null = null;
    if (!vendorId && extracted.vendor?.name) {
      vendorSlug = matchVendorByName(extracted.vendor.name);
      if (vendorSlug) {
        const vendor = await prisma.vendor.findUnique({ where: { slug: vendorSlug } });
        if (vendor) vendorId = vendor.id;
      }
    } else if (vendorId && doc.vendor) {
      vendorSlug = doc.vendor.slug;
    }

    // Update the document
    await prisma.document.update({
      where: { id: documentId },
      data: {
        extractedText: responseText,
        extractedData: JSON.stringify(extracted),
        parseStatus: 'complete',
        parseModel: MODEL,
        confidence: extracted.confidence,
        docType: extracted.documentType || doc.docType,
        vendorId,
      },
    });

    // Extract line items and promote to CostTracker (non-blocking)
    let pipelineResult = null;
    if (extracted.lineItems?.length || doc.docType === 'invoice' || extracted.documentType === 'invoice') {
      const invoiceDate = extracted.date ? new Date(extracted.date) : null;
      pipelineResult = await runInvoicePipeline(
        documentId,
        JSON.stringify(extracted),
        extracted.vendor?.name,
        invoiceDate,
      );
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'parse',
        entity: 'document',
        entityId: documentId,
        details: JSON.stringify({
          model: MODEL,
          confidence: extracted.confidence,
          vendor: extracted.vendor?.name,
          total: extracted.total,
          lineItems: extracted.lineItems?.length ?? 0,
          textOnly: !!isTextOnly,
          pipeline: pipelineResult ? {
            extracted: pipelineResult.extracted,
            promoted: pipelineResult.promoted,
            unmapped: pipelineResult.unmapped,
          } : null,
        }),
      },
    });

    // ── Auto-create transaction from parsed document ──
    let autoCreatedTransactionId: string | null = null;
    if (autoCreateTransaction) {
      try {
        const overrides = await buildDonorOverrides(vendorId, JSON.stringify(extracted));
        const result = await createTransactionFromDocument(documentId, overrides);
        autoCreatedTransactionId = result.transactionId;
        console.log(`[Parse] Auto-created transaction ${result.transactionId} from document ${documentId}`);
      } catch (err) {
        // Don't fail the parse — log and allow manual recovery
        console.error(`[Parse] Auto-create transaction failed for ${documentId}:`, err);
      }
    }

    return NextResponse.json({
      documentId: doc.id,
      extractedData: extracted,
      confidence: extracted.confidence,
      vendorMatched: !!vendorId,
      vendorSlug,
      parseStatus: 'complete',
      ...(autoCreatedTransactionId ? { transactionId: autoCreatedTransactionId } : {}),
    });
  } catch (error) {
    console.error('[Document Parse] Error:', error);

    // Try to mark as failed if we have the document ID
    try {
      const body = await request.clone().json().catch(() => null);
      if (body?.documentId) {
        await prisma.document.update({
          where: { id: body.documentId },
          data: { parseStatus: 'failed' },
        });
      }
    } catch { /* best effort */ }

    return NextResponse.json(
      { error: 'Parse failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

/**
 * Build CreateTransactionOverrides with donor arrangement detection.
 * Uses checkDonorArrangement from lib/arrangements.ts for period gating.
 */
async function buildDonorOverrides(
  vendorId: string | null,
  extractedDataJson: string | null,
): Promise<Record<string, unknown>> {
  if (!vendorId) return {};

  try {
    const check = await checkDonorArrangement(
      vendorId,
      new Date(),
      extractedDataJson ? (JSON.parse(extractedDataJson).total ?? 0) : 0,
    );

    if (check.hasArrangement && check.appliesThisInvoice && check.arrangement && check.split) {
      return {
        donorPaid: {
          donorName: check.arrangement.donorName,
          amount: check.split.donorPortion,
          donorEmail: check.arrangement.donorEmail ?? undefined,
        },
      };
    }
  } catch (err) {
    console.error(`[Parse] Donor arrangement check failed for vendor ${vendorId}:`, err);
  }

  return {};
}
