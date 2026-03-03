'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen, Users, FileText, Download, ArrowLeft, CheckCircle2,
  ChevronDown, Loader2, PenLine, Sparkles,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Attendee {
  id: string;
  name: string;
  role: string;
  isBoard: boolean;
  present: boolean;
  arrivedLate: boolean;
  leftEarly: boolean;
  note: string | null;
}

interface AgendaItemData {
  id: string;
  sortOrder: number;
  title: string;
  description: string | null;
  category: string | null;
  hasMotion: boolean;
  motionText: string | null;
  motionBy: string | null;
  secondedBy: string | null;
  votesFor: number | null;
  votesAgainst: number | null;
  votesAbstain: number | null;
  motionResult: string | null;
}

interface ActionItemData {
  id: string;
  description: string;
  assignee: string | null;
  dueDate: string | null;
  status: string;
  completedDate: string | null;
  notes: string | null;
}

interface MeetingData {
  id: string;
  date: string;
  endTime: string | null;
  type: string;
  location: string;
  calledBy: string | null;
  quorumPresent: boolean;
  quorumNote: string | null;
  rawNotes: string | null;
  polishedMinutes: string | null;
  polishModel: string | null;
  status: string;
  attestedBy: string | null;
  attestedRole: string | null;
  attestedDate: string | null;
  attestationText: string | null;
  signatureBlobUrl: string | null;
  pdfBlobUrl: string | null;
  pdfGeneratedAt: string | null;
  createdAt: string;
  attendees: Attendee[];
  agendaItems: AgendaItemData[];
  actionItems: ActionItemData[];
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  draft: { label: 'Draft', color: 'text-gauge-amber', dot: 'bg-gauge-amber' },
  polished: { label: 'Polished', color: 'text-tardis-glow', dot: 'bg-tardis-glow' },
  attested: { label: 'Attested', color: 'text-brass-gold', dot: 'bg-brass-gold' },
  finalized: { label: 'Finalized', color: 'text-gauge-green', dot: 'bg-gauge-green' },
};

const typeLabels: Record<string, string> = {
  regular: 'Regular Meeting',
  special: 'Special Meeting',
  annual: 'Annual Meeting',
  emergency: 'Emergency Meeting',
};

const actionStatusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'text-gauge-amber' },
  in_progress: { label: 'In Progress', color: 'text-tardis-glow' },
  completed: { label: 'Completed', color: 'text-gauge-green' },
  cancelled: { label: 'Cancelled', color: 'text-slate-500' },
};

export default function MeetingDetail({ meeting }: { meeting: MeetingData }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(meeting.pdfBlobUrl);
  const sc = statusConfig[meeting.status] || statusConfig.draft;

  const boardPresent = meeting.attendees.filter(a => a.isBoard && a.present);
  const boardTotal = meeting.attendees.filter(a => a.isBoard);
  const guests = meeting.attendees.filter(a => !a.isBoard);
  const motions = meeting.agendaItems.filter(a => a.hasMotion);
  const openActions = meeting.actionItems.filter(a => a.status === 'open' || a.status === 'in_progress');

  const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/board-minutes/${meeting.id}/pdf`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPdfUrl(data.pdfUrl);
        router.refresh();
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/board-minutes"
            className="text-slate-500 hover:text-tardis-glow transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-100 flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-tardis-glow" />
              {typeLabels[meeting.type] || meeting.type}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {formatDate(meeting.date, 'long')} — {meeting.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
            <span className={sc.color}>{sc.label}</span>
          </span>
          {meeting.status === 'draft' && (
            <Link
              href={`/board-minutes/new?resume=${meeting.id}`}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <PenLine className="w-4 h-4" />
              Continue Editing
            </Link>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="console-card p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Board Present</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">
            {boardPresent.length}/{boardTotal.length}
          </p>
          <p className={`text-xs mt-1 ${meeting.quorumPresent ? 'text-gauge-green' : 'text-gauge-red'}`}>
            {meeting.quorumPresent ? 'Quorum met' : 'No quorum'}
          </p>
        </div>
        <div className="console-card p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Motions</p>
          <p className="text-2xl font-bold text-brass-gold mt-1">{motions.length}</p>
          <p className="text-xs text-slate-500 mt-1">
            {motions.filter(m => m.motionResult === 'passed').length} passed
          </p>
        </div>
        <div className="console-card p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Action Items</p>
          <p className={`text-2xl font-bold mt-1 ${openActions.length > 0 ? 'text-gauge-amber' : 'text-gauge-green'}`}>
            {openActions.length} open
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {meeting.actionItems.length} total
          </p>
        </div>
        <div className="console-card p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">PDF</p>
          {pdfUrl ? (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-tardis-glow hover:text-tardis-light transition-colors flex items-center gap-2 mt-2"
            >
              <Download className="w-5 h-5" />
              <span className="text-sm">Download</span>
            </a>
          ) : meeting.status === 'attested' ? (
            <button
              onClick={handleGeneratePdf}
              disabled={generating}
              className="btn-primary text-sm flex items-center gap-2 mt-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Generate PDF
            </button>
          ) : (
            <p className="text-sm text-slate-600 mt-2">Not yet available</p>
          )}
        </div>
      </div>

      {/* Attendees */}
      <div className="console-card">
        <div className="px-4 py-3 border-b border-console-border">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-tardis-glow" />
            Attendees
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {meeting.attendees.filter(a => a.isBoard).map(a => (
              <div key={a.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${a.present ? 'bg-gauge-green' : 'bg-gauge-red'}`} />
                  <span className="text-sm text-slate-200">{a.name}</span>
                  <span className="text-xs text-slate-500">({a.role})</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {a.arrivedLate && <span className="text-gauge-amber">Late</span>}
                  {a.leftEarly && <span className="text-gauge-amber">Left Early</span>}
                  {!a.present && <span className="text-gauge-red">Absent</span>}
                </div>
              </div>
            ))}
          </div>
          {guests.length > 0 && (
            <div className="mt-3 pt-3 border-t border-console-border/50">
              <p className="text-xs text-slate-500 mb-2">Guests</p>
              {guests.map(a => (
                <div key={a.id} className="flex items-center gap-2 py-1">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span className="text-sm text-slate-300">{a.name}</span>
                  {a.note && <span className="text-xs text-slate-500">— {a.note}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agenda Items & Motions */}
      {meeting.agendaItems.length > 0 && (
        <div className="console-card">
          <div className="px-4 py-3 border-b border-console-border">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-tardis-glow" />
              Agenda Items
            </h2>
          </div>
          <div className="divide-y divide-console-border/50">
            {meeting.agendaItems.map((item, i) => (
              <div key={item.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {i + 1}. {item.title}
                    </p>
                    {item.description && (
                      <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                    )}
                  </div>
                  {item.category && (
                    <span className="text-xs text-slate-500 bg-console px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  )}
                </div>
                {item.hasMotion && (
                  <div className="mt-3 ml-4 pl-3 border-l-2 border-tardis-glow/30">
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold text-brass-gold">MOTION:</span>{' '}
                      {item.motionText}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      {item.motionBy && <span>Moved by {item.motionBy}</span>}
                      {item.secondedBy && <span>Seconded by {item.secondedBy}</span>}
                    </div>
                    {item.votesFor !== null && (
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="text-gauge-green">For: {item.votesFor}</span>
                        <span className="text-gauge-red">Against: {item.votesAgainst ?? 0}</span>
                        <span className="text-slate-500">Abstain: {item.votesAbstain ?? 0}</span>
                        <span className={item.motionResult === 'passed' ? 'text-gauge-green font-semibold' : 'text-gauge-red font-semibold'}>
                          — {item.motionResult === 'passed' ? 'PASSED' : item.motionResult === 'failed' ? 'FAILED' : (item.motionResult || '').toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {meeting.actionItems.length > 0 && (
        <div className="console-card">
          <div className="px-4 py-3 border-b border-console-border">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-tardis-glow" />
              Action Items
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-console-border">
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {meeting.actionItems.map(ai => {
                const asc = actionStatusConfig[ai.status] || actionStatusConfig.open;
                return (
                  <tr key={ai.id} className="border-b border-console-border/50">
                    <td className="px-4 py-2 text-sm text-slate-200">{ai.description}</td>
                    <td className="px-4 py-2 text-sm text-slate-400">{ai.assignee || '—'}</td>
                    <td className="px-4 py-2 text-sm text-slate-400">
                      {ai.dueDate ? formatDate(ai.dueDate) : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-medium ${asc.color}`}>{asc.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Polished Minutes */}
      {meeting.polishedMinutes && (
        <div className="console-card">
          <div className="px-4 py-3 border-b border-console-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-tardis-glow" />
              Polished Minutes
            </h2>
            {meeting.polishModel && (
              <span className="text-xs text-slate-600">Model: {meeting.polishModel}</span>
            )}
          </div>
          <div className="p-4">
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap">
              {meeting.polishedMinutes}
            </div>
          </div>
        </div>
      )}

      {/* Attestation */}
      {meeting.attestedBy && (
        <div className="console-card">
          <div className="px-4 py-3 border-b border-console-border">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <PenLine className="w-4 h-4 text-brass-gold" />
              Attestation
            </h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-slate-200 font-medium">{meeting.attestedBy}</p>
                <p className="text-xs text-slate-500">{meeting.attestedRole}</p>
              </div>
              {meeting.attestedDate && (
                <p className="text-xs text-slate-500">
                  Signed: {formatDate(meeting.attestedDate, 'long')}
                </p>
              )}
            </div>
            {meeting.signatureBlobUrl && (
              <div className="bg-white/5 border border-console-border rounded-lg p-3 inline-block">
                <img
                  src={meeting.signatureBlobUrl}
                  alt="Signature"
                  className="h-12 object-contain"
                />
              </div>
            )}
            {meeting.attestationText && (
              <p className="text-xs text-slate-500 italic">{meeting.attestationText}</p>
            )}
          </div>
        </div>
      )}

      {/* Raw Notes (collapsible) */}
      {meeting.rawNotes && (
        <details className="console-card group">
          <summary className="px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-console-hover transition-colors">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Raw Notes
            </h2>
            <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="px-4 pb-4">
            <pre className="text-sm text-slate-400 whitespace-pre-wrap font-mono bg-console-hover/30 rounded-lg p-3">
              {meeting.rawNotes}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}
