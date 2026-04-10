export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createMessage } from '@/lib/claude';
import { prisma } from '@/lib/prisma';
import { RECEIPT_EXTRACTION_PROMPT, parseExtractionResponse } from '@/lib/receipt-parser';
import { matchVendorByName } from '@/lib/vendor-match';
import { runInvoicePipeline } from '@/lib/invoice-pipeline';

const MODEL = 'claude-sonnet-4-20250514';

/**
 * POST /api/documents/parse
 *
 * Sends a Document's blob to Claude Vision for structured extraction.
 * Body: { documentId: string }
 */
export async function POST(request: Request) {
  try {
    const { documentId } = await request.json();

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

    // Fetch the blob content
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

    // Determine media type for Claude
    const mediaType = doc.mimeType === 'application/pdf'
      ? 'application/pdf' as const
      : doc.mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

    // Build the content block
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

    // Call Claude Vision with timeout protection (55s < Vercel 60s limit on Hobby)
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
      
      // Handle timeout or abort error
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
      // Re-throw non-timeout errors to be caught by outer catch block
      throw error;
    }
    clearTimeout(timeoutId);

    // Extract text from response
    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

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

    // Extract line items and promote to CostTracker (non-blocking — logs errors but won't fail parse)
    // see HANDOFF-tardis-invoice-costtracker-pipeline.md#step-5
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
          pipeline: pipelineResult ? {
            extracted: pipelineResult.extracted,
            promoted: pipelineResult.promoted,
            unmapped: pipelineResult.unmapped,
          } : null,
        }),
      },
    });

    return NextResponse.json({
      documentId: doc.id,
      extractedData: extracted,
      confidence: extracted.confidence,
      vendorMatched: !!vendorId,
      vendorSlug,
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
