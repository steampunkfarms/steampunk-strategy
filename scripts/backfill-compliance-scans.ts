/**
 * One-time backfill: Upload Desktop/scans compliance docs to Vercel Blob,
 * create Document records, and create ComplianceCompletion records.
 *
 * Run: npx tsx scripts/backfill-compliance-scans.ts
 */

import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';
import { readFileSync } from 'fs';
import { basename } from 'path';

const prisma = new PrismaClient();
const SCANS_DIR = '/Users/ericktronboll/Desktop/scans';

// Task IDs from the database
const TASKS = {
  irs990: 'a33d7e31-a46b-4461-8697-34c7fb38f00d',
  caFtb199: '80eff739-1d7b-4740-aa62-44673bf389b9',
  caAgRrf1: '93d40dad-09f8-4ed9-9c3f-2672144405ec',
  caSosSi100: '8db560ac-5176-40cb-82d5-27dae51ec678',
};

// Due date helpers
function irs990DueDate(fy: number): Date {
  return new Date(fy + 1, 4, 15); // May 15 of the following year
}
function caFtb199DueDate(fy: number): Date {
  return new Date(fy + 1, 4, 15); // May 15 of the following year
}
function caAgRrf1DueDate(fy: number): Date {
  return new Date(fy + 1, 10, 15); // Nov 15 of the following year
}

interface FileMapping {
  file: string;
  taskId: string;
  taskSlug: string;
  fiscalYear: number;
  note?: string;
}

// Map files to tasks and fiscal years
const FILE_MAP: FileMapping[] = [
  // === IRS 990-EZ ===
  { file: '990EZ 2021.pdf', taskId: TASKS.irs990, taskSlug: 'irs-990', fiscalYear: 2021 },
  { file: '990EZ 2022.pdf', taskId: TASKS.irs990, taskSlug: 'irs-990', fiscalYear: 2022 },
  { file: '990-EZ 2023.pdf', taskId: TASKS.irs990, taskSlug: 'irs-990', fiscalYear: 2023 },
  { file: '990-EZ 2024.pdf', taskId: TASKS.irs990, taskSlug: 'irs-990', fiscalYear: 2024 },
  { file: 'FORM 990-EZ IRS ACCEPTANCE LETTER FOR TAX YEAR 2023.pdf', taskId: TASKS.irs990, taskSlug: 'irs-990', fiscalYear: 2023, note: 'IRS acceptance letter' },
  { file: 'FORM 990-EZ IRS ACCEPTANCE LETTER FOR TAX YEAR 2024.pdf', taskId: TASKS.irs990, taskSlug: 'irs-990', fiscalYear: 2024, note: 'IRS acceptance letter' },
  { file: '8453-TE 2023.pdf', taskId: TASKS.irs990, taskSlug: 'irs-990', fiscalYear: 2023, note: 'E-file authorization (8453-TE)' },
  { file: '8453-TE 2024.pdf', taskId: TASKS.irs990, taskSlug: 'irs-990', fiscalYear: 2024, note: 'E-file authorization (8453-TE)' },
  { file: 'Receipt from Tax990 tax-year 2023 990.pdf', taskId: TASKS.irs990, taskSlug: 'irs-990', fiscalYear: 2023, note: 'Tax990.org filing receipt' },
  { file: 'Receipt from Tax990 tax-year 2024 990.pdf', taskId: TASKS.irs990, taskSlug: 'irs-990', fiscalYear: 2024, note: 'Tax990.org filing receipt' },
  { file: 'STEAMPUNK FARMS RESCUE BARN INC_Form990-Ez_2024_short.pdf', taskId: TASKS.irs990, taskSlug: 'irs-990', fiscalYear: 2024, note: 'Short form copy' },

  // === CA FTB Form 199 ===
  { file: 'FTB e-file Tax Return Image - 2019.pdf', taskId: TASKS.caFtb199, taskSlug: 'ca-ftb-199', fiscalYear: 2019 },
  { file: 'FTB e-file Tax Return Image - 2020.pdf', taskId: TASKS.caFtb199, taskSlug: 'ca-ftb-199', fiscalYear: 2020 },
  { file: 'FTB e-file Tax Return Image - 2021.pdf', taskId: TASKS.caFtb199, taskSlug: 'ca-ftb-199', fiscalYear: 2021 },
  { file: 'FTB e-file Tax Return Image - 2022.pdf', taskId: TASKS.caFtb199, taskSlug: 'ca-ftb-199', fiscalYear: 2022 },
  { file: 'FTB e-file Tax Return Image - 2023.pdf', taskId: TASKS.caFtb199, taskSlug: 'ca-ftb-199', fiscalYear: 2023 },
  { file: 'FTB e-file Tax Return Image - 2024.pdf', taskId: TASKS.caFtb199, taskSlug: 'ca-ftb-199', fiscalYear: 2024 },
  { file: '2023 California Exempt Organization 199.pdf', taskId: TASKS.caFtb199, taskSlug: 'ca-ftb-199', fiscalYear: 2023, note: 'Completed 199 form' },
  { file: '2024 California Exempt Organization Annual Information Return 199.pdf', taskId: TASKS.caFtb199, taskSlug: 'ca-ftb-199', fiscalYear: 2024, note: 'Completed 199 form' },
  { file: 'FORM CA-199 ACCEPTANCE LETTER FOR TAX YEAR 2023.pdf', taskId: TASKS.caFtb199, taskSlug: 'ca-ftb-199', fiscalYear: 2023, note: 'FTB acceptance letter' },
  { file: 'FORM CA-199 ACCEPTANCE LETTER FOR TAX YEAR 2024.pdf', taskId: TASKS.caFtb199, taskSlug: 'ca-ftb-199', fiscalYear: 2024, note: 'FTB acceptance letter' },
  { file: 'Receipt from Tax990 tax-year 2023 199.pdf', taskId: TASKS.caFtb199, taskSlug: 'ca-ftb-199', fiscalYear: 2023, note: 'Tax990.org filing receipt' },
  { file: 'Receipt from Tax990 tax-year 2024 199.pdf', taskId: TASKS.caFtb199, taskSlug: 'ca-ftb-199', fiscalYear: 2024, note: 'Tax990.org filing receipt' },

  // === CA AG RRF-1 ===
  { file: 'CA-AG-Status and history.pdf', taskId: TASKS.caAgRrf1, taskSlug: 'ca-ag-rrf1', fiscalYear: 2024, note: 'AG registry status and history snapshot' },
  { file: 'OnlineFiling_CT0266250.pdf', taskId: TASKS.caAgRrf1, taskSlug: 'ca-ag-rrf1', fiscalYear: 2022, note: 'Online filing confirmation (CT0266250)' },
  { file: 'CT0266250 051023 2020_STEAMPUNKFARMSRESCUEBARN_990EZ.pdf', taskId: TASKS.caAgRrf1, taskSlug: 'ca-ag-rrf1', fiscalYear: 2020, note: '990-EZ copy submitted to AG' },
  { file: 'CT0266250 051023 2021_STEAMPUNKFARMSRESCUEBARN_990EZ.pdf', taskId: TASKS.caAgRrf1, taskSlug: 'ca-ag-rrf1', fiscalYear: 2021, note: '990-EZ copy submitted to AG' },
  { file: 'CT0266250 051023 2022_990EZ_STEAMPUNKFARMSRESCUEBARN.pdf', taskId: TASKS.caAgRrf1, taskSlug: 'ca-ag-rrf1', fiscalYear: 2022, note: '990-EZ copy submitted to AG' },
  { file: 'ct-tr1-form_2024 (1).pdf', taskId: TASKS.caAgRrf1, taskSlug: 'ca-ag-rrf1', fiscalYear: 2024, note: 'CT-TR-1 annual renewal form' },

  // === FTB portal snapshots (attach to FTB 199 as reference) ===
  { file: 'MyFTB _ Account Summary _ California Franchise Tax Board.pdf', taskId: TASKS.caFtb199, taskSlug: 'ca-ftb-199', fiscalYear: 2024, note: 'FTB portal account summary snapshot' },
  { file: 'MyFTB _ Entity Overview _ California Franchise Tax Board.pdf', taskId: TASKS.caFtb199, taskSlug: 'ca-ftb-199', fiscalYear: 2024, note: 'FTB portal entity overview snapshot' },
  { file: 'MyFTB _ Tax Returns _ California Franchise Tax Board.pdf', taskId: TASKS.caFtb199, taskSlug: 'ca-ftb-199', fiscalYear: 2024, note: 'FTB portal tax returns snapshot' },

  // === IRS determination letter (attach to 990 as foundational doc) ===
  { file: 'FinalLetter_82-4897930_STEAMPUNKFARMSRESCUEBARNINC_04282018.tif', taskId: TASKS.irs990, taskSlug: 'irs-990', fiscalYear: 2018, note: 'IRS determination letter (501c3 approval)' },

  // === Tax990 summary (reference) ===
  { file: 'tax990 summary of record.pdf', taskId: TASKS.irs990, taskSlug: 'irs-990', fiscalYear: 2024, note: 'Tax990.org summary of filing record' },
];

// Files to skip (HTML saves, screenshots, unknown reference PDFs)
const SKIP_FILES = [
  '2019 199n image ftb.html', '2020 199n image ftb.html', '2021 199 image ftb.html',
  '2022 199 image ftb.html', '2023 199 image ftb.html', '2024 199 image ftb.html',
  'Screenshot 2026-03-02 at 5.21.58 PM.png',
  // Unknown reference number PDFs — can be manually reviewed later
  '26675436-1.pdf', '575022.pdf', '632952.pdf', '20221025 (25).pdf',
  'B2628-8677.pdf', 'B4418-4598.pdf', 'STEAMPUNK_191113Z10485240.pdf',
  'Y1701-1602821-1033863.pdf', 'Y1701-1602821-1033864.pdf',
  'Y1705-1602821-1125095.pdf', 'Y1705-1602821-1125097.pdf',
  'Y9950-1602821-1121533.pdf', 'Y9950-1602821-1125096.pdf',
  'Y9950-1602821-1447919.pdf', 'Y9952-1602821-1125094.pdf',
];

function getMimeType(filename: string): string {
  if (filename.endsWith('.pdf')) return 'application/pdf';
  if (filename.endsWith('.tif') || filename.endsWith('.tiff')) return 'image/tiff';
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

function getDueDate(taskId: string, fiscalYear: number): Date {
  if (taskId === TASKS.irs990) return irs990DueDate(fiscalYear);
  if (taskId === TASKS.caFtb199) return caFtb199DueDate(fiscalYear);
  if (taskId === TASKS.caAgRrf1) return caAgRrf1DueDate(fiscalYear);
  // Default: May 15 of following year
  return new Date(fiscalYear + 1, 4, 15);
}

async function main() {
  console.log(`\n=== Compliance Scans Backfill ===\n`);
  console.log(`Processing ${FILE_MAP.length} files, skipping ${SKIP_FILES.length}\n`);

  // Group by task+year for completion creation
  const completionGroups = new Map<string, { taskId: string; taskSlug: string; fiscalYear: number; docIds: string[]; notes: string[] }>();

  let uploaded = 0;
  let errors = 0;

  for (const mapping of FILE_MAP) {
    const filePath = `${SCANS_DIR}/${mapping.file}`;
    const groupKey = `${mapping.taskId}:${mapping.fiscalYear}`;

    try {
      // Read the file
      const buffer = readFileSync(filePath);
      const mimeType = getMimeType(mapping.file);

      // Upload to Vercel Blob
      const blob = await put(
        `compliance/${mapping.taskSlug}/${mapping.fiscalYear}/${mapping.file}`,
        buffer,
        { access: 'public', contentType: mimeType }
      );

      // Create Document record
      const doc = await prisma.document.create({
        data: {
          filename: mapping.file.replace(/[^a-zA-Z0-9._-]/g, '_'),
          originalName: mapping.file,
          mimeType,
          fileSize: buffer.length,
          blobUrl: blob.url,
          docType: 'filing',
          parseStatus: 'complete',
        },
      });

      // Add to completion group
      if (!completionGroups.has(groupKey)) {
        completionGroups.set(groupKey, {
          taskId: mapping.taskId,
          taskSlug: mapping.taskSlug,
          fiscalYear: mapping.fiscalYear,
          docIds: [],
          notes: [],
        });
      }
      const group = completionGroups.get(groupKey)!;
      group.docIds.push(doc.id);
      if (mapping.note) group.notes.push(mapping.note);

      uploaded++;
      console.log(`  [OK] ${mapping.file} → ${mapping.taskSlug}/FY${mapping.fiscalYear}`);
    } catch (err: any) {
      errors++;
      console.error(`  [ERR] ${mapping.file}: ${err.message}`);
    }
  }

  console.log(`\nUploaded ${uploaded} documents (${errors} errors)`);
  console.log(`Creating ${completionGroups.size} completion records...\n`);

  // Create ComplianceCompletion records
  let completionsCreated = 0;
  let completionsSkipped = 0;

  for (const [, group] of completionGroups) {
    const dueDate = getDueDate(group.taskId, group.fiscalYear);

    try {
      // Check if completion already exists
      const existing = await prisma.complianceCompletion.findFirst({
        where: {
          taskId: group.taskId,
          fiscalYear: group.fiscalYear,
        },
      });

      if (existing) {
        // Append document IDs to existing completion
        const existingDocIds: string[] = existing.documentIds
          ? JSON.parse(existing.documentIds)
          : [];
        const mergedIds = [...new Set([...existingDocIds, ...group.docIds])];

        await prisma.complianceCompletion.update({
          where: { id: existing.id },
          data: {
            documentIds: JSON.stringify(mergedIds),
            notes: existing.notes
              ? `${existing.notes}\n[Backfill] ${group.notes.join('; ')}`
              : `[Backfill] ${group.notes.join('; ')}`,
          },
        });

        console.log(`  [MERGE] ${group.taskSlug}/FY${group.fiscalYear}: added ${group.docIds.length} docs to existing completion`);
        completionsSkipped++;
        continue;
      }

      await prisma.complianceCompletion.create({
        data: {
          taskId: group.taskId,
          fiscalYear: group.fiscalYear,
          period: String(group.fiscalYear),
          dueDate,
          status: 'completed',
          completedDate: dueDate, // Best estimate — filed by due date
          notes: `[Backfill from Desktop/scans] ${group.notes.join('; ')}`,
          documentIds: JSON.stringify(group.docIds),
        },
      });

      completionsCreated++;
      console.log(`  [NEW] ${group.taskSlug}/FY${group.fiscalYear}: ${group.docIds.length} docs, due ${dueDate.toISOString().split('T')[0]}`);
    } catch (err: any) {
      console.error(`  [ERR] ${group.taskSlug}/FY${group.fiscalYear}: ${err.message}`);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Documents uploaded: ${uploaded}`);
  console.log(`Completions created: ${completionsCreated}`);
  console.log(`Completions merged: ${completionsSkipped}`);
  console.log(`Errors: ${errors}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
