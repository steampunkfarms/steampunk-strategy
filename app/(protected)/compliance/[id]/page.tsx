export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ComplianceForm from '@/components/ComplianceForm';
import ComplianceDetail from './compliance-detail';
import { ClipboardCheck } from 'lucide-react';

export default async function ComplianceTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const task = await prisma.complianceTask.findUnique({
    where: { id },
    include: {
      completions: {
        orderBy: { dueDate: 'desc' },
      },
    },
  });
  if (!task) notFound();

  // Resolve document blob URLs for completions
  const allDocIds: string[] = [];
  for (const c of task.completions) {
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
  const docMap = Object.fromEntries(docs.map(d => [d.id, d]));

  const completions = task.completions.map(c => {
    let docIds: string[] = [];
    try { docIds = c.documentIds ? JSON.parse(c.documentIds) : []; } catch {}

    return {
      id: c.id,
      fiscalYear: c.fiscalYear,
      period: c.period,
      dueDate: c.dueDate.toISOString(),
      status: c.status,
      completedDate: c.completedDate?.toISOString() ?? null,
      completedBy: c.completedBy,
      confirmationNum: c.confirmationNum,
      amountPaid: c.amountPaid ? Number(c.amountPaid) : null,
      certifiedCopyFee: c.certifiedCopyFee ? Number(c.certifiedCopyFee) : null,
      expeditedFee: c.expeditedFee ? Number(c.expeditedFee) : null,
      notes: c.notes,
      documents: docIds.map(did => docMap[did] ?? null).filter(Boolean),
    };
  });

  const initial = {
    id: task.id,
    name: task.name,
    slug: task.slug,
    description: task.description ?? '',
    authority: task.authority,
    category: task.category,
    frequency: task.frequency,
    dueMonth: task.dueMonth ? String(task.dueMonth) : '',
    dueDay: task.dueDay ? String(task.dueDay) : '',
    dueDayOfQuarter: task.dueDayOfQuarter ? String(task.dueDayOfQuarter) : '',
    reminderDays: String(task.reminderDays),
    filingUrl: task.filingUrl ?? '',
    requiresPayment: task.requiresPayment,
    estimatedCost: task.estimatedCost ? String(task.estimatedCost) : '',
    penalty: task.penalty ?? '',
    dependsOn: task.dependsOn ?? '',
  };

  const taskSummary = {
    id: task.id,
    name: task.name,
    slug: task.slug,
    authority: task.authority,
    category: task.category,
    frequency: task.frequency,
    requiresPayment: task.requiresPayment,
    filingUrl: task.filingUrl,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-console flex items-center justify-center border border-console-border">
          <ClipboardCheck className="w-5 h-5 text-brass-gold" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-200">{task.name}</h1>
          <p className="text-xs text-slate-500">{task.authority} — {task.category} — {task.frequency}</p>
        </div>
      </div>

      {/* Filing History + Completion Form (client component) */}
      <ComplianceDetail
        task={taskSummary}
        completions={completions}
      />

      {/* Edit Task Form */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-brass-muted hover:text-brass-gold transition-colors flex items-center gap-2">
          <span className="group-open:rotate-90 transition-transform">&#9654;</span>
          Edit task settings
        </summary>
        <div className="mt-4">
          <ComplianceForm initial={initial} />
        </div>
      </details>
    </div>
  );
}
