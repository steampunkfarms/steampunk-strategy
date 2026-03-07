'use client';

// Captain's Log — detail/edit page for a single entry
// see docs/handoffs/_working/20260307-captains-log-working-spec.md

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle,
  Pause,
  Play,
  Trash2,
  Tag,
  Clock,
  User,
  Edit3,
  Save,
  X,
  Shield,
} from 'lucide-react';

interface LogEntry {
  id: string;
  title: string;
  body: string | null;
  source: string;
  sourceRef: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: string | null;
  tags: string[];
  aiClassification: {
    domain?: string[];
    actionType?: string[];
    urgency?: string[];
    prepCategory?: string[];
  } | null;
  relatedEntity: string | null;
  completedAt: string | null;
  completionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'text-gauge-red',
  high: 'text-gauge-amber',
  normal: 'text-gauge-green',
  low: 'text-gauge-blue',
};

export default function CaptainsLogDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<LogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<LogEntry>>({});
  const [saving, setSaving] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reclassifying, setReclassifying] = useState(false);

  useEffect(() => {
    fetch(`/api/captains-log/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setEntry(data);
        setEditData(data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function updateEntry(data: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/captains-log/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      setEntry(updated);
      setEditData(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function markDone() {
    await updateEntry({ status: 'done', completionNote: completionNote || null });
    setShowCompleteDialog(false);
  }

  async function deleteEntry() {
    await fetch(`/api/captains-log/${id}`, { method: 'DELETE' });
    router.push('/captains-log');
  }

  async function reclassify() {
    if (!entry) return;
    setReclassifying(true);
    try {
      const res = await fetch('/api/captains-log/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: entry.title, body: entry.body }),
      });
      const classification = await res.json();
      await updateEntry({
        aiClassification: {
          domain: classification.domain,
          actionType: classification.actionType,
          urgency: classification.urgency,
          prepCategory: classification.prepCategory,
        },
        tags: classification.suggestedTags,
      });
    } finally {
      setReclassifying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-tardis-glow" />
        <span className="ml-2 text-sm text-slate-400">Loading entry...</span>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-400">Entry not found.</p>
        <Link href="/captains-log" className="text-xs text-tardis-glow hover:underline mt-2 inline-block">
          Back to Captain&apos;s Log
        </Link>
      </div>
    );
  }

  const tags = entry.tags ?? [];
  const ai = entry.aiClassification;
  const isOverdue = entry.dueDate && new Date(entry.dueDate) < new Date() && entry.status !== 'done';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/captains-log" className="text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          {editing ? (
            <input
              type="text"
              value={editData.title ?? ''}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="w-full text-lg font-display font-bold bg-console border border-console-border rounded-md px-3 py-1 text-slate-100 focus:outline-none focus:border-tardis-glow"
            />
          ) : (
            <h1 className="text-lg font-display font-bold text-slate-100">{entry.title}</h1>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-medium ${PRIORITY_COLORS[entry.priority]}`}>
              {entry.priority.toUpperCase()}
            </span>
            <span className="text-[10px] text-slate-600">·</span>
            <span className="text-[10px] text-slate-500">{entry.source.replace(/_/g, ' ')}</span>
            <span className="text-[10px] text-slate-600">·</span>
            <span className="text-[10px] text-slate-500">
              {new Date(entry.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap gap-2">
        {!editing ? (
          <>
            <button onClick={() => setEditing(true)} className="btn-brass text-xs flex items-center gap-1.5">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
            {entry.status !== 'done' && (
              <>
                <button onClick={() => setShowCompleteDialog(true)} className="btn-primary text-xs flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3" /> Mark Done
                </button>
                <button onClick={() => updateEntry({ status: 'in_progress' })} className="btn-brass text-xs flex items-center gap-1.5">
                  <Play className="w-3 h-3" /> In Progress
                </button>
                <button onClick={() => updateEntry({ status: 'deferred' })} className="btn-brass text-xs flex items-center gap-1.5">
                  <Pause className="w-3 h-3" /> Defer
                </button>
              </>
            )}
            <button
              onClick={reclassify}
              disabled={reclassifying}
              className="btn-brass text-xs flex items-center gap-1.5"
            >
              {reclassifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Reclassify
            </button>
            {ai?.prepCategory?.some(p => p.includes('compliance') || p.includes('filing')) && (
              <Link href={`/compliance`} className="btn-brass text-xs flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> View Compliance
              </Link>
            )}
            <button onClick={() => setShowDeleteDialog(true)} className="btn-brass text-xs flex items-center gap-1.5 text-gauge-red hover:text-gauge-red ml-auto">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => updateEntry(editData)}
              disabled={saving}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
            <button onClick={() => { setEditing(false); setEditData(entry); }} className="btn-brass text-xs flex items-center gap-1.5">
              <X className="w-3 h-3" /> Cancel
            </button>
          </>
        )}
      </div>

      {/* Body */}
      <div className="console-card p-5">
        <h2 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Notes</h2>
        {editing ? (
          <textarea
            value={editData.body ?? ''}
            onChange={(e) => setEditData({ ...editData, body: e.target.value })}
            rows={6}
            className="w-full text-sm bg-console border border-console-border rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-tardis-glow resize-none"
          />
        ) : (
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {entry.body || 'No notes.'}
          </p>
        )}
      </div>

      {/* Details Grid */}
      <div className="console-card p-5">
        <h2 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-500 mb-0.5">Status</p>
            {editing ? (
              <select
                value={editData.status ?? ''}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className="text-xs bg-console border border-console-border rounded px-2 py-1 text-slate-300"
              >
                <option value="captured">Captured</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
                <option value="deferred">Deferred</option>
              </select>
            ) : (
              <span className="text-sm text-slate-200">{entry.status.replace(/_/g, ' ')}</span>
            )}
          </div>
          <div>
            <p className="text-[10px] text-slate-500 mb-0.5">Priority</p>
            {editing ? (
              <select
                value={editData.priority ?? ''}
                onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                className="text-xs bg-console border border-console-border rounded px-2 py-1 text-slate-300"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            ) : (
              <span className={`text-sm font-medium ${PRIORITY_COLORS[entry.priority]}`}>{entry.priority}</span>
            )}
          </div>
          <div className="flex items-start gap-1">
            <User className="w-3 h-3 text-slate-500 mt-0.5" />
            <div>
              <p className="text-[10px] text-slate-500 mb-0.5">Assignee</p>
              {editing ? (
                <select
                  value={editData.assignee ?? ''}
                  onChange={(e) => setEditData({ ...editData, assignee: e.target.value || null })}
                  className="text-xs bg-console border border-console-border rounded px-2 py-1 text-slate-300"
                >
                  <option value="">Unassigned</option>
                  <option value="fred">Fred</option>
                  <option value="krystal">Krystal</option>
                  <option value="tierra">Tierra</option>
                  <option value="stazia">Stazia</option>
                  <option value="cc">CC</option>
                </select>
              ) : (
                <span className="text-sm text-slate-200">{entry.assignee ?? 'Unassigned'}</span>
              )}
            </div>
          </div>
          <div className="flex items-start gap-1">
            <Clock className="w-3 h-3 text-slate-500 mt-0.5" />
            <div>
              <p className="text-[10px] text-slate-500 mb-0.5">Due Date</p>
              {editing ? (
                <input
                  type="date"
                  value={editData.dueDate ? new Date(editData.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditData({ ...editData, dueDate: e.target.value || null })}
                  className="text-xs bg-console border border-console-border rounded px-2 py-1 text-slate-300"
                />
              ) : (
                <span className={`text-sm ${isOverdue ? 'text-gauge-red' : 'text-slate-200'}`}>
                  {entry.dueDate ? new Date(entry.dueDate).toLocaleDateString() : 'None'}
                  {isOverdue && ' (overdue)'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4 pt-3 border-t border-console-border">
          <div className="flex items-center gap-1 mb-2">
            <Tag className="w-3 h-3 text-brass-muted" />
            <p className="text-[10px] text-slate-500">Tags</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {tags.length > 0
              ? tags.map((t) => (
                  <span key={t} className="badge badge-brass text-[10px]">{t}</span>
                ))
              : <span className="text-xs text-slate-500">No tags</span>
            }
          </div>
        </div>

        {/* Related Entity */}
        {entry.relatedEntity && (
          <div className="mt-3 pt-3 border-t border-console-border">
            <p className="text-[10px] text-slate-500 mb-1">Related Entity</p>
            <span className="text-xs text-tardis-glow font-mono">{entry.relatedEntity}</span>
          </div>
        )}

        {/* Completion Note */}
        {entry.completedAt && (
          <div className="mt-3 pt-3 border-t border-console-border">
            <p className="text-[10px] text-slate-500 mb-1">Completed {new Date(entry.completedAt).toLocaleDateString()}</p>
            {entry.completionNote && (
              <p className="text-xs text-slate-300">{entry.completionNote}</p>
            )}
          </div>
        )}
      </div>

      {/* AI Classification */}
      {ai && (
        <div className="console-card p-5">
          <h2 className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-tardis-glow" />
            AI Classification
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {ai.domain && ai.domain.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 mb-1">Domain</p>
                <div className="flex flex-wrap gap-1">
                  {ai.domain.map((d) => (
                    <span key={d} className="badge badge-blue text-[10px]">{d}</span>
                  ))}
                </div>
              </div>
            )}
            {ai.actionType && ai.actionType.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 mb-1">Action Type</p>
                <div className="flex flex-wrap gap-1">
                  {ai.actionType.map((a) => (
                    <span key={a} className="badge badge-brass text-[10px]">{a}</span>
                  ))}
                </div>
              </div>
            )}
            {ai.urgency && ai.urgency.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 mb-1">Urgency</p>
                <div className="flex flex-wrap gap-1">
                  {ai.urgency.map((u) => (
                    <span key={u} className={`badge text-[10px] ${u === 'routine' ? 'badge-green' : 'badge-amber'}`}>{u}</span>
                  ))}
                </div>
              </div>
            )}
            {ai.prepCategory && ai.prepCategory.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 mb-1">Prep Category</p>
                <div className="flex flex-wrap gap-1">
                  {ai.prepCategory.map((p) => (
                    <span key={p} className="badge badge-brass text-[10px]">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mark Done Dialog */}
      {showCompleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCompleteDialog(false)}>
          <div className="bg-console-light border border-console-border rounded-xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gauge-green" />
              Mark as Done
            </h3>
            <textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder="Completion note (optional)..."
              rows={3}
              className="w-full text-sm bg-console border border-console-border rounded-md px-3 py-2 text-slate-200 mb-3 focus:outline-none focus:border-tardis-glow resize-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCompleteDialog(false)} className="btn-brass text-xs">Cancel</button>
              <button onClick={markDone} className="btn-primary text-xs flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3" /> Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDeleteDialog(false)}>
          <div className="bg-console-light border border-console-border rounded-xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gauge-red mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Entry
            </h3>
            <p className="text-xs text-slate-400 mb-4">This action cannot be undone. Are you sure?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteDialog(false)} className="btn-brass text-xs">Cancel</button>
              <button onClick={deleteEntry} className="text-xs px-3 py-1.5 rounded-md bg-gauge-red/20 text-gauge-red hover:bg-gauge-red/30 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
