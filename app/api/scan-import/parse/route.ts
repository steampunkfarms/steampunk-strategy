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
  let step = 'init';
  let docId: string | null = null;
  try {
    step = 'parse-body';
    const { scanImportId } = await request.json();

    if (!scanImportId) {
      return NextResponse.json({ error: 'scanImportId is required' }, { status: 400 });
    }

    step = 'fetch-scanImport';
    const scanImport = await prisma.scanImport.findUnique({ where: { id: scanImportId } });
    if (!scanImport) {
      return NextResponse.json({ error: 'ScanImport not found' }, { status: 404 });
    }

    step = 'fetch-document';
    const doc = await prisma.document.findUnique({ where: { id: scanImport.documentId } });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    docId = doc.id;

    if (doc.parseStatus === 'complete') {
      return NextResponse.json({
        scanImportId: scanImport.id,
        message: 'Already parsed',
        confidence: scanImport.confidence ? Number(scanImport.confidence) : null,
      });
    }

    // Mark as processing
    step = 'mark-processing';
    await prisma.document.update({
      where: { id: doc.id },
      data: { parseStatus: 'processing' },
    });

    // Fetch the blob content
    step = 'fetch-blob';
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
    step = 'claude-vision';
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

    step = 'parse-json';
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
      step = `process-item-${i}`;
      const extracted = extractedItems[i];

      // Null-safe access helpers (Claude may return null for irrelevant sub-objects)
      const payer = extracted.payer || {};
      const check = extracted.check || {};
      const grant = extracted.grant || {};
      const tax = extracted.tax || {};

      // Build proper externalId based on scan type
      let externalId: string;
      if (extracted.scanType === 'pledge_check' || extracted.scanType === 'grant_check') {
        const checkNum = check.checkNumber || 'unknown';
        const amount = check.amount?.toFixed(2) || '0.00';
        const date = check.date || 'unknown';
        externalId = `check-${checkNum}-${amount}-${date}`;
      } else if (extracted.scanType === 'grant_award_letter') {
        const grantor = slugify(grant.grantorName || 'unknown');
        const amount = grant.amount?.toFixed(2) || '0.00';
        const date = grant.date || 'unknown';
        externalId = `grant-${grantor}-${amount}-${date}`;
      } else if (extracted.scanType === 'tax_document_1099') {
        const form = tax.formType || 'unknown';
        const year = tax.taxYear || 'unknown';
        const issuer = slugify(tax.issuerName || 'unknown');
        externalId = `tax-${form}-${year}-${issuer}`;
      } else if (extracted.scanType === 'envelope_return_address') {
        const name = slugify(payer.fullName || 'unknown');
        const zip = payer.zip || 'unknown';
        externalId = `envelope-${name}-${zip}-${Date.now()}`;
      } else {
        externalId = `${scanImport.externalId}-${i}`;
      }

      step = `build-data-${i}`;
      const scanData = {
        scanType: extracted.scanType,
        payerName: payer.fullName ?? null,
        payerFirstName: payer.firstName ?? null,
        payerLastName: payer.lastName ?? null,
        payerStreet1: payer.street1 ?? null,
        payerStreet2: payer.street2 ?? null,
        payerCity: payer.city ?? null,
        payerState: payer.state ?? null,
        payerZip: payer.zip ?? null,
        amount: check.amount ?? grant.amount ?? tax.amount ?? null,
        checkNumber: check.checkNumber ?? null,
        checkDate: check.date ? new Date(check.date) : null,
        bankName: check.bankName ?? null,
        routingLast4: check.routingLast4 ?? null,
        accountLast4: check.accountLast4 ?? null,
        memo: check.memo ?? null,
        payee: check.payee ?? null,
        grantorName: grant.grantorName ?? null,
        grantAmount: grant.amount ?? null,
        grantPurpose: grant.purpose ?? null,
        taxYear: tax.taxYear ?? null,
        taxFormType: tax.formType ?? null,
        confidence: extracted.confidence,
        rawExtracted: i === 0 ? responseText : null, // Store raw only on first
        parseNotes: extracted.notes,
        externalId,
      };

      // Check for duplicate externalId (excluding the current record for i=0)
      step = `dedup-check-${i}`;
      const existing = await prisma.scanImport.findUnique({
        where: { externalId },
        select: { id: true },
      });
      if (existing && existing.id !== scanImportId) {
        // Collision with a different record — make unique
        scanData.externalId = `${externalId}-doc-${doc.id.slice(-6)}-${i}`;
        scanData.parseNotes = [scanData.parseNotes, 'Possible duplicate of existing record'].filter(Boolean).join('; ');
      }

      step = `save-${i}`;
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
        payerName: payer.fullName ?? null,
        confidence: extracted.confidence,
      });
    }

    // Update Document
    step = 'update-document';
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
    step = 'audit-log';
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
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error(`[Scan Import Parse] FAILED at step="${step}": ${msg}`);
    if (stack) console.error(stack);

    // Try to mark document as failed
    if (docId) {
      try {
        await prisma.document.update({
          where: { id: docId },
          data: { parseStatus: 'failed' },
        });
      } catch { /* ignore cleanup errors */ }
    }

    return NextResponse.json(
      { error: 'Parse failed', step, details: msg },
      { status: 500 },
    );
  }
}
