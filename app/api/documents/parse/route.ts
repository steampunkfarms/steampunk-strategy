export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { RECEIPT_EXTRACTION_PROMPT, parseExtractionResponse } from '@/lib/receipt-parser';
import { matchVendorByName } from '@/lib/vendor-match';

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

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.parseStatus === 'complete') {
      return NextResponse.json({
        documentId: doc.id,
        extractedData: doc.extractedData ? JSON.parse(doc.extractedData) : null,
        confidence: doc.confidence ? Number(doc.confidence) : null,
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

    // Call Claude Vision
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
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
    });

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
    if (!vendorId && extracted.vendor?.name) {
      const vendorSlug = matchVendorByName(extracted.vendor.name);
      if (vendorSlug) {
        const vendor = await prisma.vendor.findUnique({ where: { slug: vendorSlug } });
        if (vendor) vendorId = vendor.id;
      }
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
        }),
      },
    });

    return NextResponse.json({
      documentId: doc.id,
      extractedData: extracted,
      confidence: extracted.confidence,
      vendorMatched: !!vendorId,
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
