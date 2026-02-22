export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ComplianceForm from '@/components/ComplianceForm';
import { ClipboardCheck } from 'lucide-react';

export default async function EditCompliancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await prisma.complianceTask.findUnique({ where: { id } });
  if (!task) notFound();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-console flex items-center justify-center border border-console-border">
          <ClipboardCheck className="w-5 h-5 text-brass-gold" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-200">Edit: {task.name}</h1>
          <p className="text-xs text-slate-500">{task.authority} — {task.category}</p>
        </div>
      </div>
      <ComplianceForm initial={initial} />
    </div>
  );
}
