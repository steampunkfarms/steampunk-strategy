export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import ScanUploader from './ScanUploader';
import ScanImportReview from './ScanImportReview';

export default async function ScanImportPage() {
  const pendingImports = await prisma.scanImport.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
  });

  // Get document blobUrls
  const documentIds = pendingImports.map(si => si.documentId);
  const documents = documentIds.length > 0
    ? await prisma.document.findMany({
        where: { id: { in: documentIds } },
        select: { id: true, blobUrl: true },
      })
    : [];
  const docMap = new Map(documents.map(d => [d.id, d.blobUrl]));

  // Status counts
  const matched = await prisma.scanImport.count({ where: { status: 'matched', pushedAt: null } });
  const createMailer = await prisma.scanImport.count({ where: { status: 'create_mailer', pushedAt: null } });
  const pushed = await prisma.scanImport.count({ where: { pushedAt: { not: null } } });

  const pendingWithBlobs = pendingImports.map(si => ({
    id: si.id,
    documentId: si.documentId,
    scanType: si.scanType,
    payerName: si.payerName,
    payerFirstName: si.payerFirstName,
    payerLastName: si.payerLastName,
    payerStreet1: si.payerStreet1,
    payerStreet2: si.payerStreet2,
    payerCity: si.payerCity,
    payerState: si.payerState,
    payerZip: si.payerZip,
    amount: si.amount ? Number(si.amount) : null,
    checkNumber: si.checkNumber,
    checkDate: si.checkDate?.toISOString() || null,
    bankName: si.bankName,
    memo: si.memo,
    payee: si.payee,
    grantorName: si.grantorName,
    grantAmount: si.grantAmount ? Number(si.grantAmount) : null,
    grantPurpose: si.grantPurpose,
    taxYear: si.taxYear,
    taxFormType: si.taxFormType,
    confidence: si.confidence ? Number(si.confidence) : null,
    parseNotes: si.parseNotes,
    externalId: si.externalId,
    blobUrl: docMap.get(si.documentId) || null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Scan Import</h1>
        <p className="text-sm text-gray-400 mt-1">
          Upload scanned checks, envelopes, and award letters. Claude extracts the data, you match to donors or create mailer-only records.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="px-2 py-1 rounded bg-amber-900/30 text-amber-300">
          {pendingImports.length} pending review
        </span>
        <span className="px-2 py-1 rounded bg-green-900/30 text-green-300">
          {matched} matched
        </span>
        <span className="px-2 py-1 rounded bg-yellow-900/30 text-yellow-300">
          {createMailer} create mailer
        </span>
        <span className="text-gray-500">
          {pushed} pushed to Studiolo
        </span>
      </div>

      <ScanUploader />

      <ScanImportReview
        initialPending={pendingWithBlobs}
        readyToPush={matched + createMailer}
      />
    </div>
  );
}
