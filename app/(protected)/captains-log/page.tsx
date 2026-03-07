export const dynamic = 'force-dynamic';

// Captain's Log — executive action item list with summary gauges and filters
// see docs/handoffs/_working/20260307-captains-log-working-spec.md

import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Clock,
  User,
  Tag,
  CheckCircle,
  AlertTriangle,
  Circle,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

const PRIORITY_DOTS: Record<string, string> = {
  critical: 'gauge-dot-red',
  high: 'gauge-dot-amber',
  normal: 'gauge-dot-green',
  low: 'gauge-dot-blue',
};

const STATUS_BADGES: Record<string, string> = {
  captured: 'badge-amber',
  in_progress: 'badge-blue',
  blocked: 'badge-red',
  done: 'badge-green',
  deferred: 'badge-brass',
};

export default async function CaptainsLogPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; assignee?: string }>;
}) {
  const filters = await searchParams;

  const now = new Date();
  const where: Record<string, unknown> = {};
  if (filters.status && filters.status !== 'all') where.status = filters.status;
  if (filters.priority && filters.priority !== 'all') where.priority = filters.priority;
  if (filters.assignee && filters.assignee !== 'all') where.assignee = filters.assignee;

  const [entries, openCount, criticalCount, dueSoonCount, completedThisMonth] = await Promise.all([
    prisma.captainsLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
    }),
    prisma.captainsLog.count({
      where: { status: { notIn: ['done', 'deferred'] } },
    }),
    prisma.captainsLog.count({
      where: {
        priority: { in: ['critical', 'high'] },
        status: { notIn: ['done', 'deferred'] },
      },
    }),
    prisma.captainsLog.count({
      where: {
        dueDate: {
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          gte: now,
        },
        status: { notIn: ['done', 'deferred'] },
      },
    }),
    prisma.captainsLog.count({
      where: {
        status: 'done',
        completedAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
    }),
  ]);

  const gauges = [
    {
      label: 'Open Items',
      value: openCount,
      icon: Circle,
      status: openCount > 10 ? 'amber' : 'green',
    },
    {
      label: 'Critical/High',
      value: criticalCount,
      icon: AlertTriangle,
      status: criticalCount > 0 ? 'red' : 'green',
    },
    {
      label: 'Due Soon (7d)',
      value: dueSoonCount,
      icon: Clock,
      status: dueSoonCount > 0 ? 'amber' : 'green',
    },
    {
      label: 'Completed This Month',
      value: completedThisMonth,
      icon: CheckCircle,
      status: 'green' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-tardis-glow" />
            Captain&apos;s Log
          </h1>
          <p className="text-sm text-brass-muted mt-1">
            Executive action items — AI-classified and tracked
          </p>
        </div>
        <Link href="/captains-log/new" className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Entry
        </Link>
      </div>

      {/* Summary Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {gauges.map((gauge) => (
          <div key={gauge.label} className="console-card p-5">
            <div className="flex items-center justify-between mb-3">
              <gauge.icon className="w-5 h-5 text-brass-muted" />
              <div className={`gauge-dot gauge-dot-${gauge.status}`} />
            </div>
            <p className="text-2xl font-mono font-bold text-slate-100">{gauge.value}</p>
            <p className="text-xs text-slate-400 mt-1">{gauge.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="console-card p-4">
        <form className="flex flex-wrap gap-3 items-center">
          <select
            name="status"
            defaultValue={filters.status ?? 'all'}
            className="text-xs bg-console border border-console-border rounded-md px-2 py-1.5 text-slate-300 focus:outline-none focus:border-tardis-glow"
          >
            <option value="all">All Statuses</option>
            <option value="captured">Captured</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
            <option value="deferred">Deferred</option>
          </select>

          <select
            name="priority"
            defaultValue={filters.priority ?? 'all'}
            className="text-xs bg-console border border-console-border rounded-md px-2 py-1.5 text-slate-300 focus:outline-none focus:border-tardis-glow"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          <select
            name="assignee"
            defaultValue={filters.assignee ?? 'all'}
            className="text-xs bg-console border border-console-border rounded-md px-2 py-1.5 text-slate-300 focus:outline-none focus:border-tardis-glow"
          >
            <option value="all">All Assignees</option>
            <option value="fred">Fred</option>
            <option value="krystal">Krystal</option>
            <option value="tierra">Tierra</option>
            <option value="stazia">Stazia</option>
            <option value="cc">CC</option>
          </select>

          <button
            type="submit"
            className="btn-brass text-xs"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Entry List */}
      <div className="console-card">
        {entries.length > 0 ? (
          <div className="divide-y divide-console-border">
            {entries.map((entry) => {
              const tags = (entry.tags as string[]) ?? [];
              const isOverdue = entry.dueDate && new Date(entry.dueDate) < now && entry.status !== 'done';
              const daysUntil = entry.dueDate
                ? Math.ceil((new Date(entry.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <Link
                  key={entry.id}
                  href={`/captains-log/${entry.id}`}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-console-hover transition-colors"
                >
                  <div className={`gauge-dot ${PRIORITY_DOTS[entry.priority] ?? 'gauge-dot-green'} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{entry.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="badge badge-brass text-[10px] flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                      {entry.assignee && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          {entry.assignee}
                        </span>
                      )}
                    </div>
                  </div>
                  {entry.dueDate && (
                    <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? 'text-gauge-red' : daysUntil !== null && daysUntil <= 7 ? 'text-gauge-amber' : 'text-slate-500'}`}>
                      <Clock className="w-3 h-3" />
                      {isOverdue
                        ? `${Math.abs(daysUntil!)}d overdue`
                        : daysUntil !== null
                          ? `${daysUntil}d`
                          : formatDate(entry.dueDate)
                      }
                    </span>
                  )}
                  <span className={`badge ${STATUS_BADGES[entry.status] ?? 'badge-brass'} text-[10px]`}>
                    {entry.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-600">{entry.source.replace('_', ' ')}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              No entries found. Start by capturing an action item.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
