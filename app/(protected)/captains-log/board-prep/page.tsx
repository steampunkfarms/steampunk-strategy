export const dynamic = 'force-dynamic';

// Board Meeting Prep — filtered view of Captain's Log entries tagged for board prep
// see docs/handoffs/_working/20260307-captains-log-working-spec.md

import Link from 'next/link';
import {
  BookOpen,
  ArrowLeft,
  Clock,
  User,
  Tag,
  Landmark,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';

const PRIORITY_DOTS: Record<string, string> = {
  critical: 'gauge-dot-red',
  high: 'gauge-dot-amber',
  normal: 'gauge-dot-green',
  low: 'gauge-dot-blue',
};

interface AiClassification {
  domain?: string[];
  actionType?: string[];
  urgency?: string[];
  prepCategory?: string[];
}

export default async function BoardPrepPage() {
  // Fetch all entries where aiClassification.prepCategory contains 'board-meeting-prep'
  // Prisma JSON filtering on PostgreSQL
  const entries = await prisma.captainsLog.findMany({
    where: {
      status: { notIn: ['done', 'deferred'] },
      aiClassification: {
        path: ['prepCategory'],
        array_contains: ['board-meeting-prep'],
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  // Group by domain
  const grouped: Record<string, typeof entries> = {};
  for (const entry of entries) {
    const ai = entry.aiClassification as AiClassification | null;
    const domains = ai?.domain ?? ['uncategorized'];
    for (const domain of domains) {
      if (!grouped[domain]) grouped[domain] = [];
      grouped[domain].push(entry);
    }
  }

  // Find next board meeting for context
  const nextMeeting = await prisma.boardMeeting.findFirst({
    where: { date: { gte: new Date() } },
    orderBy: { date: 'asc' },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/captains-log" className="text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-display font-bold text-slate-100 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-tardis-glow" />
            Board Meeting Prep
          </h1>
          <p className="text-xs text-brass-muted mt-0.5">
            Action items classified as board-meeting-prep
            {nextMeeting && (
              <span className="ml-2 text-tardis-glow">
                — Next meeting: {new Date(nextMeeting.date).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <Link href="/captains-log/new" className="btn-primary text-xs">
          + New Entry
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="console-card p-8 text-center">
          <Landmark className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">
            No board-meeting-prep items found. Items are auto-tagged when AI classification detects board relevance.
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="console-card p-4 flex items-center gap-4">
            <div className="text-center px-4">
              <p className="text-2xl font-mono font-bold text-slate-100">{entries.length}</p>
              <p className="text-[10px] text-slate-500">Items for Board</p>
            </div>
            <div className="text-center px-4 border-l border-console-border">
              <p className="text-2xl font-mono font-bold text-slate-100">{Object.keys(grouped).length}</p>
              <p className="text-[10px] text-slate-500">Domains</p>
            </div>
            <div className="text-center px-4 border-l border-console-border">
              <p className="text-2xl font-mono font-bold text-gauge-red">
                {entries.filter(e => e.priority === 'critical' || e.priority === 'high').length}
              </p>
              <p className="text-[10px] text-slate-500">High Priority</p>
            </div>
          </div>

          {/* Grouped by domain */}
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([domain, domainEntries]) => (
            <div key={domain} className="console-card">
              <div className="px-5 py-3 border-b border-console-border">
                <h2 className="text-sm font-semibold text-slate-200 capitalize flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brass-gold" />
                  {domain.replace(/-/g, ' ')}
                  <span className="text-[10px] text-slate-500 font-normal ml-1">({domainEntries.length})</span>
                </h2>
              </div>
              <div className="divide-y divide-console-border">
                {domainEntries.map((entry) => {
                  const tags = (entry.tags as string[]) ?? [];
                  const isOverdue = entry.dueDate && new Date(entry.dueDate) < new Date();

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
                        </div>
                      </div>
                      {entry.assignee && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          {entry.assignee}
                        </span>
                      )}
                      {entry.dueDate && (
                        <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? 'text-gauge-red' : 'text-slate-500'}`}>
                          <Clock className="w-3 h-3" />
                          {new Date(entry.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
