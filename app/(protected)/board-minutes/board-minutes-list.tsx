'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, FileText, Search, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Meeting {
  id: string;
  date: string;
  type: string;
  location: string;
  status: string;
  pdfBlobUrl: string | null;
  attendeeCount: number;
  motionCount: number;
  motionsPassed: number;
  openActionCount: number;
  attestedBy: string | null;
}

interface Props {
  meetings: Meeting[];
  stats: { total: number; drafts: number; thisYear: number; openActions: number };
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  draft: { label: 'Draft', color: 'text-gauge-amber', dot: 'bg-gauge-amber' },
  polished: { label: 'Polished', color: 'text-tardis-glow', dot: 'bg-tardis-glow' },
  attested: { label: 'Attested', color: 'text-brass-gold', dot: 'bg-brass-gold' },
  finalized: { label: 'Finalized', color: 'text-gauge-green', dot: 'bg-gauge-green' },
};

const typeLabels: Record<string, string> = {
  regular: 'Regular',
  special: 'Special',
  annual: 'Annual',
  emergency: 'Emergency',
};

export default function BoardMinutesList({ meetings, stats }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = meetings.filter(m => {
    if (statusFilter && m.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.location.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q) ||
        (m.attestedBy || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-tardis-glow" />
            Board Minutes
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Meeting documentation, AI-polished minutes, and signed PDFs
          </p>
        </div>
        <Link
          href="/board-minutes/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Meeting
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Meetings', value: stats.total, color: 'text-slate-100' },
          { label: 'Drafts Pending', value: stats.drafts, color: stats.drafts > 0 ? 'text-gauge-amber' : 'text-slate-400' },
          { label: 'This Year', value: stats.thisYear, color: 'text-tardis-glow' },
          { label: 'Open Actions', value: stats.openActions, color: stats.openActions > 0 ? 'text-gauge-amber' : 'text-gauge-green' },
        ].map(stat => (
          <div key={stat.label} className="console-card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search meetings..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-console border border-console-border rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-tardis-glow/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-console border border-console-border rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-tardis-glow/50"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="polished">Polished</option>
          <option value="attested">Attested</option>
          <option value="finalized">Finalized</option>
        </select>
      </div>

      {/* Meeting Table */}
      <div className="console-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-console-border">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendees</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Motions</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">PDF</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500">
                  {meetings.length === 0 ? 'No meetings documented yet. Click "New Meeting" to get started.' : 'No meetings match your filters.'}
                </td>
              </tr>
            ) : (
              filtered.map(m => {
                const sc = statusConfig[m.status] || statusConfig.draft;
                return (
                  <tr key={m.id} className="border-b border-console-border/50 hover:bg-console-hover transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-200">
                      {formatDate(m.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {typeLabels[m.type] || m.type}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 text-center">
                      {m.attendeeCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {m.motionCount > 0 ? (
                        <span className="text-brass-gold">{m.motionsPassed}/{m.motionCount}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {m.openActionCount > 0 ? (
                        <span className="text-gauge-amber">{m.openActionCount} open</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                        <span className={sc.color}>{sc.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.pdfBlobUrl ? (
                        <a
                          href={m.pdfBlobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-tardis-glow hover:text-tardis-light transition-colors"
                          title="Download PDF"
                        >
                          <FileText className="w-4 h-4 inline" />
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={m.status === 'draft' ? `/board-minutes/new?resume=${m.id}` : `/board-minutes/${m.id}`}
                        className="text-slate-500 hover:text-tardis-glow transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
