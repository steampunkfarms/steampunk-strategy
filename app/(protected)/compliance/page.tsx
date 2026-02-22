export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  Shield,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import { getComplianceTasks } from '@/lib/queries';
import { formatDate, formatCurrency } from '@/lib/utils';

export default async function CompliancePage() {
  const tasks = await getComplianceTasks();

  const overdue = tasks.filter((t) => t.urgency === 'red');
  const upcoming = tasks.filter((t) => t.urgency === 'amber');
  const onTrack = tasks.filter((t) => t.urgency === 'green');
  const unconfigured = tasks.filter((t) => t.urgency === 'blue');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Compliance</h1>
          <p className="text-sm text-brass-muted mt-1">Filing deadlines, regulatory tasks &amp; audit trail</p>
        </div>
        <Link href="/compliance/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Task
        </Link>
      </div>

      {/* Summary gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="console-card p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-4 h-4 text-gauge-red" />
            <div className="gauge-dot gauge-dot-red" />
          </div>
          <p className="text-xl font-mono font-bold text-gauge-red">{overdue.length}</p>
          <p className="text-xs text-slate-500 mt-1">Overdue</p>
        </div>
        <div className="console-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-4 h-4 text-gauge-amber" />
            <div className="gauge-dot gauge-dot-amber" />
          </div>
          <p className="text-xl font-mono font-bold text-gauge-amber">{upcoming.length}</p>
          <p className="text-xs text-slate-500 mt-1">Due Soon</p>
        </div>
        <div className="console-card p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-4 h-4 text-gauge-green" />
            <div className="gauge-dot gauge-dot-green" />
          </div>
          <p className="text-xl font-mono font-bold text-gauge-green">{onTrack.length}</p>
          <p className="text-xs text-slate-500 mt-1">On Track</p>
        </div>
        <div className="console-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-4 h-4 text-gauge-blue" />
            <div className="gauge-dot gauge-dot-blue" />
          </div>
          <p className="text-xl font-mono font-bold text-slate-200">{tasks.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Tasks</p>
        </div>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="console-card p-4 border-l-4 border-gauge-red">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-gauge-red flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-200">
                {overdue.length} filing{overdue.length !== 1 ? 's' : ''} overdue
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {overdue.map((t) => t.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Task list — sorted by urgency then date */}
      <div className="space-y-3">
        {tasks
          .sort((a, b) => {
            const urgencyOrder = { red: 0, amber: 1, green: 2, blue: 3 };
            const diff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
            if (diff !== 0) return diff;
            return (a.daysUntilDue ?? 999) - (b.daysUntilDue ?? 999);
          })
          .map((task) => (
            <div key={task.id} className="console-card p-5 panel-hover">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                    task.urgency === 'red' ? 'bg-gauge-red/10 border-gauge-red/30' :
                    task.urgency === 'amber' ? 'bg-gauge-amber/10 border-gauge-amber/30' :
                    task.urgency === 'green' ? 'bg-gauge-green/10 border-gauge-green/30' :
                    'bg-console border-console-border'
                  }`}>
                    <Shield className={`w-5 h-5 ${
                      task.urgency === 'red' ? 'text-gauge-red' :
                      task.urgency === 'amber' ? 'text-gauge-amber' :
                      task.urgency === 'green' ? 'text-gauge-green' :
                      'text-brass-gold'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-200">{task.name}</h3>
                    {task.description && (
                      <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="badge badge-blue">{task.authority}</span>
                      <span className="text-xs text-brass-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {task.frequency}
                      </span>
                      {task.nextDue && (
                        <span className={`text-xs flex items-center gap-1 ${
                          task.urgency === 'red' ? 'text-gauge-red font-medium' :
                          task.urgency === 'amber' ? 'text-gauge-amber' :
                          'text-slate-500'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {task.daysUntilDue !== null && task.daysUntilDue < 0
                            ? `${Math.abs(task.daysUntilDue)} days overdue`
                            : `Due ${formatDate(task.nextDue, 'long')}`
                          }
                          {task.daysUntilDue !== null && task.daysUntilDue >= 0 && (
                            <span className="text-slate-600 ml-1">({task.daysUntilDue}d)</span>
                          )}
                        </span>
                      )}
                      {task.requiresPayment && task.estimatedCost && (
                        <span className="text-xs text-slate-500">
                          Est. {formatCurrency(task.estimatedCost.toString())}
                        </span>
                      )}
                    </div>

                    {task.penalty && (
                      <p className="text-[11px] text-gauge-red/80 mt-2">
                        ⚠ Late penalty: {task.penalty}
                      </p>
                    )}

                    {/* Completion history */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{task.totalCompletions} completion{task.totalCompletions !== 1 ? 's' : ''} logged</span>
                      {task.lastCompletion && (
                        <span>
                          Last: {formatDate(task.lastCompletion.dueDate, 'long')} —{' '}
                          <span className={
                            task.lastCompletion.status === 'completed' ? 'text-gauge-green' :
                            task.lastCompletion.status === 'overdue' ? 'text-gauge-red' :
                            'text-gauge-amber'
                          }>
                            {task.lastCompletion.status}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Link href={`/compliance/${task.id}`} className="text-xs text-slate-500 hover:text-brass-gold flex items-center gap-1 transition-colors">
                    <Pencil className="w-3 h-3" /> Edit
                  </Link>
                  {task.filingUrl && (
                    <a
                      href={task.filingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-tardis-glow hover:underline flex items-center gap-1"
                    >
                      Filing portal <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button className="text-xs text-brass-gold hover:underline">
                    Log completion →
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
