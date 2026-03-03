#!/usr/bin/env npx tsx
/**
 * Batch ingest veterinary files from a local folder.
 *
 * Usage:
 *   npx tsx scripts/ingest-vet-files.ts [--dry-run] [--skip-parse] [--file <filename>]
 *
 * Steps per file:
 *   1. Upload to Vercel Blob (documents/vet/{filename})
 *   2. Create Document record in Strategy DB
 *   3. Parse with Claude Vision → extract structured vet data
 *   4. Push MedicalRecord to Postmaster via internal API
 */

import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';
import {
  VET_RECORD_EXTRACTION_PROMPT,
  parseVetExtractionResponse,
  classifyByFilename,
  type ExtractedVetRecord,
} from '../lib/vet-record-parser';

const prisma = new PrismaClient();
const anthropic = new Anthropic({ maxRetries: 3 });

const SOURCE_DIR = '/Users/ericktronboll/Desktop/Invoices_and_Records_from_Gmail';
// Records are ingested into Strategy staging only.
// Push to Postmaster happens via the /vet-staging approve workflow.

const SUPPORTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.tif', '.tiff'];
const MODEL = 'claude-sonnet-4-20250514';

// Known vet provider patterns → match to seeded VetProvider names
const PROVIDER_PATTERNS: Record<string, string[]> = {
  'ECLAP': ['eclap', 'dr. harlan', 'drharlan'],
  'Affordable Veterinary Clinic': ['affordable vet', 'affordable veterinary', 'dr. roueche', 'john roueche'],
  'Angelus Pet Hospital': ['angelus pet'],
  'Irvine Valley Veterinary Hospital': ['irvine valley'],
  'VetImage West': ['vetimage west', 'vet image west'],
  'Arizona Mobile Veterinary Practice PLLC': ['arizona mobile vet'],
  'Herd Health Management / Dairy Health Services LLC': ['herd health', 'dairy health'],
  'Veterinary Angels': ['veterinary angels'],
};

function matchProvider(clinicName: string): string | null {
  const lower = clinicName.toLowerCase();
  for (const [name, patterns] of Object.entries(PROVIDER_PATTERNS)) {
    for (const pattern of patterns) {
      if (lower.includes(pattern)) return name;
    }
  }
  return null;
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.tif': 'image/tiff',
    '.tiff': 'image/tiff',
  };
  return map[ext] || 'application/octet-stream';
}

async function parseWithClaude(filePath: string, mimeType: string): Promise<ExtractedVetRecord | null> {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');

  // Build content block based on type
  const isPdf = mimeType === 'application/pdf';
  const contentBlock = isPdf
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
          media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
          data: base64,
        },
      };

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: [
          contentBlock,
          { type: 'text', text: VET_RECORD_EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  console.log(`    [Claude] input=${response.usage.input_tokens} output=${response.usage.output_tokens}`);

  const responseText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return parseVetExtractionResponse(responseText);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipParse = args.includes('--skip-parse');
  const fileFilter = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;

  console.log(`\n=== Vet File Ingestion ===`);
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}${skipParse ? ' (skip parse)' : ''}`);
  if (fileFilter) console.log(`Filter: ${fileFilter}`);
  console.log('');

  // Read all files
  const allFiles = fs.readdirSync(SOURCE_DIR)
    .filter(f => {
      const ext = path.extname(f).toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext) && !f.startsWith('.');
    })
    .filter(f => !fileFilter || f === fileFilter);

  console.log(`Found ${allFiles.length} files to process.\n`);

  const results = { uploaded: 0, parsed: 0, skipped: 0, errors: 0 };

  for (const filename of allFiles) {
    const filePath = path.join(SOURCE_DIR, filename);
    const ext = path.extname(filename).toLowerCase();
    const mimeType = getMimeType(ext);
    const docType = classifyByFilename(filename);
    const stat = fs.statSync(filePath);

    console.log(`[${results.uploaded + results.skipped + results.errors + 1}/${allFiles.length}] ${filename}`);
    console.log(`  type=${docType} mime=${mimeType} size=${(stat.size / 1024).toFixed(0)}KB`);

    if (dryRun) {
      console.log('  [dry run] would upload + parse\n');
      results.skipped++;
      continue;
    }

    try {
      // Check for existing document (dedup by original name + uploader)
      const existing = await prisma.document.findFirst({
        where: { originalName: filename, uploadedBy: 'vet-file-ingest' },
      });
      if (existing) {
        console.log('  [skip] already ingested\n');
        results.skipped++;
        continue;
      }

      // 1. Upload to Vercel Blob
      const fileBuffer = fs.readFileSync(filePath);
      const blobPath = `documents/vet/${filename}`;
      const blob = await put(blobPath, fileBuffer, {
        access: 'public',
        contentType: mimeType,
        addRandomSuffix: true,
      });
      console.log(`  [blob] ${blob.url.slice(0, 80)}...`);

      // 2. Create Document record
      const doc = await prisma.document.create({
        data: {
          filename: blobPath,
          originalName: filename,
          mimeType,
          fileSize: stat.size,
          blobUrl: blob.url,
          docType,
          parseStatus: skipParse ? 'pending' : 'processing',
          uploadedBy: 'vet-file-ingest',
        },
      });
      results.uploaded++;
      console.log(`  [doc] id=${doc.id}`);

      if (skipParse) {
        console.log('  [skip parse]\n');
        continue;
      }

      // 3. Parse with Claude Vision
      // Skip TIFF files (Claude doesn't support them directly)
      if (ext === '.tif' || ext === '.tiff') {
        console.log('  [skip parse] TIFF not supported by Claude Vision\n');
        await prisma.document.update({
          where: { id: doc.id },
          data: { parseStatus: 'pending', extractedText: 'TIFF format — needs manual conversion' },
        });
        continue;
      }

      const extracted = await parseWithClaude(filePath, mimeType);
      if (!extracted) {
        console.log('  [parse failed] Could not extract JSON\n');
        await prisma.document.update({
          where: { id: doc.id },
          data: { parseStatus: 'failed' },
        });
        results.errors++;
        continue;
      }

      // Update document with extracted data
      await prisma.document.update({
        where: { id: doc.id },
        data: {
          extractedData: JSON.stringify(extracted),
          parseStatus: 'complete',
          parseModel: MODEL,
          confidence: extracted.confidence,
        },
      });
      results.parsed++;

      // Build title
      const patientName = extracted.patient?.name || 'Unknown';
      const recordType = extracted.recordType || docType.replace('vet_', '');
      const title = `${patientName} — ${recordType}${extracted.referenceNumber ? ` #${extracted.referenceNumber}` : ''}`;

      console.log(`  [parsed] ${title} (confidence=${extracted.confidence})`);
      if (extracted.patient?.name) console.log(`  [animal] ${extracted.patient.name} (${extracted.patient.species || '?'})`);
      if (extracted.total) console.log(`  [total] $${extracted.total}`);

      // Records stay in Strategy staging — user reviews/approves via /vet-staging before pushing to Postmaster
      console.log('  [staged] → review at /vet-staging\n');

      // Brief pause to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  [error] ${err instanceof Error ? err.message : String(err)}\n`);
      results.errors++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Uploaded: ${results.uploaded}`);
  console.log(`Parsed:   ${results.parsed}`);
  console.log(`Skipped:  ${results.skipped}`);
  console.log(`Errors:   ${results.errors}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
