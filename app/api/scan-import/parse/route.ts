export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createMessage } from '@/lib/claude';
import { prisma } from '@/lib/prisma';
import { CHECK_EXTRACTION_PROMPT, parseCheckResponse } from '@/lib/check-parser';

const MODEL = 'claude-sonnet-4-20250514';

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

/**
 * POST /api/scan-import/parse
 *
 * Sends a ScanImport's Document blob to Claude Vision for extraction.
 * Body: { scanImportId: string }
 */
export async function POST(request: Request) {
  try {
    const { scanImportId } = await request.json();

    if (!scanImportId) {
      return NextResponse.json({ error: 'scanImportId is required' }, { status: 400 });
    }

    const scanImport = await prisma.scanImport.findUnique({ where: { id: scanImportId } });
    if (!scanImport) {
      return NextResponse.json({ error: 'ScanImport not found' }, { status: 404 });
    }

    const doc = await prisma.document.findUnique({ where: { id: scanImport.documentId } });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.parseStatus === 'complete') {
      return NextResponse.json({
        scanImportId: scanImport.id,
        message: 'Already parsed',
        confidence: scanImport.confidence ? Number(scanImport.confidence) : null,
      });
    }

    // Mark as processing
    await prisma.document.update({
      where: { id: doc.id },
      data: { parseStatus: 'processing' },
    });

    // Fetch the blob content
    const blobResponse = await fetch(doc.blobUrl);
    if (!blobResponse.ok) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { parseStatus: 'failed' },
      });
      return NextResponse.json({ error: 'Failed to fetch blob content' }, { status: 502 });
    }

    const blobBuffer = await blobResponse.arrayBuffer();
    const base64 = Buffer.from(blobBuffer).toString('base64');

    // Build content block for Claude
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
            media_type: doc.mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
            data: base64,
          },
        };

    // Call Claude Vision
    const response = await createMessage({
      model: MODEL,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            { type: 'text', text: CHECK_EXTRACTION_PROMPT },
          ],
        },
      ],
    }, 'scan-import-parse');

    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const extractedItems = parseCheckResponse(responseText);

    if (!extractedItems || extractedItems.length === 0) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { parseStatus: 'failed', parseModel: MODEL, extractedText: responseText },
      });
      return NextResponse.json(
        { error: 'Failed to parse Claude response as JSON', rawResponse: responseText },
        { status: 422 },
      );
    }

    const createdIds: string[] = [];
    const results: Array<{ scanImportId: string; scanType: string; payerName: string | null; confidence: number }> = [];

    for (let i = 0; i < extractedItems.length; i++) {
      const extracted = extractedItems[i];

      // Build proper externalId based on scan type
      let externalId: string;
      if (extracted.scanType === 'pledge_check' || extracted.scanType === 'grant_check') {
        const checkNum = extracted.check.checkNumber || 'unknown';
        const amount = extracted.check.amount?.toFixed(2) || '0.00';
        const date = extracted.check.date || 'unknown';
        externalId = `check-${checkNum}-${amount}-${date}`;
      } else if (extracted.scanType === 'grant_award_letter') {
        const grantor = slugify(extracted.grant.grantorName || 'unknown');
        const amount = extracted.grant.amount?.toFixed(2) || '0.00';
        const date = extracted.grant.date || 'unknown';
        externalId = `grant-${grantor}-${amount}-${date}`;
      } else if (extracted.scanType === 'tax_document_1099') {
        const form = extracted.tax.formType || 'unknown';
        const year = extracted.tax.taxYear || 'unknown';
        const issuer = slugify(extracted.tax.issuerName || 'unknown');
        externalId = `tax-${form}-${year}-${issuer}`;
      } else if (extracted.scanType === 'envelope_return_address') {
        const name = slugify(extracted.payer.fullName || 'unknown');
        const zip = extracted.payer.zip || 'unknown';
        externalId = `envelope-${name}-${zip}-${Date.now()}`;
      } else {
        externalId = `${scanImport.externalId}-${i}`;
      }

      const scanData = {
        scanType: extracted.scanType,
        payerName: extracted.payer.fullName,
        payerFirstName: extracted.payer.firstName,
        payerLastName: extracted.payer.lastName,
        payerStreet1: extracted.payer.street1,
        payerStreet2: extracted.payer.street2,
        payerCity: extracted.payer.city,
        payerState: extracted.payer.state,
        payerZip: extracted.payer.zip,
        amount: extracted.check.amount ?? extracted.grant.amount ?? extracted.tax.amount,
        checkNumber: extracted.check.checkNumber,
        checkDate: extracted.check.date ? new Date(extracted.check.date) : null,
        bankName: extracted.check.bankName,
        routingLast4: extracted.check.routingLast4,
        accountLast4: extracted.check.accountLast4,
        memo: extracted.check.memo,
        payee: extracted.check.payee,
        grantorName: extracted.grant.grantorName,
        grantAmount: extracted.grant.amount,
        grantPurpose: extracted.grant.purpose,
        taxYear: extracted.tax.taxYear,
        taxFormType: extracted.tax.formType,
        confidence: extracted.confidence,
        rawExtracted: i === 0 ? responseText : null, // Store raw only on first
        parseNotes: extracted.notes,
        externalId,
      };

      if (i === 0) {
        // Update the original ScanImport record
        await prisma.scanImport.update({
          where: { id: scanImportId },
          data: scanData,
        });
        createdIds.push(scanImportId);
      } else {
        // Create additional ScanImport records for extra checks in the image
        const additional = await prisma.scanImport.create({
          data: {
            documentId: doc.id,
            status: 'pending',
            ...scanData,
          },
        });
        createdIds.push(additional.id);
      }

      results.push({
        scanImportId: i === 0 ? scanImportId : createdIds[createdIds.length - 1],
        scanType: extracted.scanType,
        payerName: extracted.payer.fullName,
        confidence: extracted.confidence,
      });
    }

    // Update Document
    const firstExtracted = extractedItems[0];
    await prisma.document.update({
      where: { id: doc.id },
      data: {
        extractedText: responseText,
        extractedData: JSON.stringify(extractedItems),
        parseStatus: 'complete',
        parseModel: MODEL,
        confidence: firstExtracted.confidence,
        docType: firstExtracted.scanType,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'parse',
        entity: 'scan_import',
        entityId: scanImportId,
        details: JSON.stringify({
          model: MODEL,
          documentsFound: extractedItems.length,
          items: results.map(r => ({
            scanType: r.scanType,
            confidence: r.confidence,
            payerName: r.payerName,
          })),
        }),
      },
    });

    return NextResponse.json({
      scanImportId,
      documentsFound: extractedItems.length,
      items: results,
      // Backward-compatible fields from first item
      scanType: firstExtracted.scanType,
      extracted: firstExtracted,
      confidence: firstExtracted.confidence,
    });
  } catch (error) {
    console.error('[Scan Import Parse] Error:', error);
    return NextResponse.json(
      { error: 'Parse failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
