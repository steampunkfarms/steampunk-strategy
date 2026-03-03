export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

/**
 * GET /api/compliance-tasks/[id]/completions
 * Returns all completions for a task, newest first.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const completions = await prisma.complianceCompletion.findMany({
    where: { taskId: id },
    orderBy: { dueDate: 'desc' },
  });

  // Resolve document blob URLs for each completion
  const allDocIds: string[] = [];
  for (const c of completions) {
    if (c.documentIds) {
      try {
        const ids = JSON.parse(c.documentIds) as string[];
        allDocIds.push(...ids);
      } catch {}
    }
  }

  const docs = allDocIds.length > 0
    ? await prisma.document.findMany({
        where: { id: { in: allDocIds } },
        select: { id: true, originalName: true, blobUrl: true, mimeType: true },
      })
    : [];
  const docMap = new Map(docs.map(d => [d.id, d]));

  const enriched = completions.map(c => {
    let docIds: string[] = [];
    try { docIds = c.documentIds ? JSON.parse(c.documentIds) : []; } catch {}

    return {
      id: c.id,
      fiscalYear: c.fiscalYear,
      period: c.period,
      dueDate: c.dueDate,
      status: c.status,
      completedDate: c.completedDate,
      completedBy: c.completedBy,
      confirmationNum: c.confirmationNum,
      amountPaid: c.amountPaid ? Number(c.amountPaid) : null,
      certifiedCopyFee: c.certifiedCopyFee ? Number(c.certifiedCopyFee) : null,
      expeditedFee: c.expeditedFee ? Number(c.expeditedFee) : null,
      notes: c.notes,
      documents: docIds.map(did => docMap.get(did) ?? null).filter(Boolean),
    };
  });

  return NextResponse.json(enriched);
}

/**
 * POST /api/compliance-tasks/[id]/completions
 * Log a new completion. Supports multipart/form-data for file uploads.
 *
 * Form fields:
 *   fiscalYear       (required) e.g. "2025"
 *   period           (optional) e.g. "2025", "Q1"
 *   dueDate          (required) ISO date
 *   completedDate    (optional) ISO date — defaults to now
 *   confirmationNum  (optional)
 *   amountPaid       (optional) base filing fee
 *   certifiedCopyFee (optional)
 *   expeditedFee     (optional)
 *   notes            (optional)
 *   files            (optional) one or more uploaded proof documents
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;

  // Verify task exists
  const task = await prisma.complianceTask.findUnique({ where: { id: taskId } });
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const form = await request.formData();

  const fiscalYear = parseInt(form.get('fiscalYear') as string);
  const period = (form.get('period') as string) || String(fiscalYear);
  const dueDate = new Date(form.get('dueDate') as string);
  const completedDate = form.get('completedDate')
    ? new Date(form.get('completedDate') as string)
    : new Date();
  const confirmationNum = (form.get('confirmationNum') as string) || null;
  const amountPaid = form.get('amountPaid') ? parseFloat(form.get('amountPaid') as string) : null;
  const certifiedCopyFee = form.get('certifiedCopyFee') ? parseFloat(form.get('certifiedCopyFee') as string) : null;
  const expeditedFee = form.get('expeditedFee') ? parseFloat(form.get('expeditedFee') as string) : null;
  const notes = (form.get('notes') as string) || null;

  if (isNaN(fiscalYear) || isNaN(dueDate.getTime())) {
    return NextResponse.json({ error: 'fiscalYear and dueDate are required' }, { status: 400 });
  }

  // Upload any attached files to Vercel Blob → create Document records
  const documentIds: string[] = [];
  const files = form.getAll('files') as File[];

  for (const file of files) {
    if (!file.size) continue;

    const blob = await put(`compliance/${task.slug}/${fiscalYear}/${file.name}`, file, {
      access: 'public',
      contentType: file.type,
    });

    const doc = await prisma.document.create({
      data: {
        filename: file.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
        originalName: file.name,
        mimeType: file.type || 'application/pdf',
        fileSize: file.size,
        blobUrl: blob.url,
        docType: 'filing',
        parseStatus: 'complete', // compliance docs don't need AI parsing
      },
    });

    documentIds.push(doc.id);
  }

  try {
    const completion = await prisma.complianceCompletion.create({
      data: {
        taskId,
        fiscalYear,
        period,
        dueDate,
        status: 'completed',
        completedDate,
        confirmationNum,
        amountPaid,
        certifiedCopyFee,
        expeditedFee,
        notes,
        documentIds: documentIds.length > 0 ? JSON.stringify(documentIds) : null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'create',
        entity: 'compliance_completion',
        entityId: completion.id,
        details: JSON.stringify({
          taskName: task.name,
          fiscalYear,
          period,
          documentCount: documentIds.length,
        }),
      },
    });

    return NextResponse.json(completion, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: `Completion for ${period} (FY${fiscalYear}) already exists. Edit the existing record instead.` },
        { status: 409 }
      );
    }
    console.error('Create completion error:', error);
    return NextResponse.json({ error: 'Failed to create completion' }, { status: 500 });
  }
}
