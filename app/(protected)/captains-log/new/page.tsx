'use client';

// Captain's Log — new entry capture form with AI classification preview
// see docs/handoffs/_working/20260307-captains-log-working-spec.md

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Sparkles,
  Loader2,
  ArrowLeft,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

interface Classification {
  domain: string[];
  actionType: string[];
  urgency: string[];
  prepCategory: string[];
  suggestedPriority: string;
  suggestedTags: string[];
}

export default function NewCaptainsLogEntry() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [source, setSource] = useState('manual');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [relatedEntity, setRelatedEntity] = useState('');

  const [classification, setClassification] = useState<Classification | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [saving, setSaving] = useState(false);

  async function classify() {
    if (!title.trim()) return;
    setClassifying(true);
    try {
      const res = await fetch('/api/captains-log/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json();
      setClassification(data);
      if (!priority && data.suggestedPriority) {
        setPriority(data.suggestedPriority);
      }
    } catch {
      // Classification failed silently — user can still save without it
    } finally {
      setClassifying(false);
    }
  }

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/captains-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body: body || null,
          source,
          assignee: assignee || null,
          priority: priority || classification?.suggestedPriority || 'normal',
          dueDate: dueDate || null,
          relatedEntity: relatedEntity || null,
          suggestedTags: classification?.suggestedTags ?? [],
          aiClassification: classification
            ? {
                domain: classification.domain,
                actionType: classification.actionType,
                urgency: classification.urgency,
                prepCategory: classification.prepCategory,
              }
            : null,
        }),
      });
      if (res.ok) {
        router.push('/captains-log');
      }
    } catch {
      // keep form open on error
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/captains-log" className="text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-display font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-tardis-glow" />
            New Log Entry
          </h1>
          <p className="text-xs text-brass-muted mt-0.5">Capture an action item with AI classification</p>
        </div>
      </div>

      {/* Form */}
      <div className="console-card p-5 space-y-4">
        {/* Title */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full text-sm bg-console border border-console-border rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-tardis-glow"
          />
        </div>

        {/* Body */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">Notes (optional, markdown supported)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Additional context, links, details..."
            className="w-full text-sm bg-console border border-console-border rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-tardis-glow resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Source */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full text-sm bg-console border border-console-border rounded-md px-3 py-2 text-slate-300 focus:outline-none focus:border-tardis-glow"
            >
              <option value="manual">Manual</option>
              <option value="strategy_session">Strategy Session</option>
              <option value="board_meeting">Board Meeting</option>
              <option value="advisor">Advisor</option>
              <option value="audit">Audit</option>
              <option value="ai_suggestion">AI Suggestion</option>
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Assignee</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full text-sm bg-console border border-console-border rounded-md px-3 py-2 text-slate-300 focus:outline-none focus:border-tardis-glow"
            >
              <option value="">Unassigned</option>
              <option value="fred">Fred</option>
              <option value="krystal">Krystal</option>
              <option value="tierra">Tierra</option>
              <option value="stazia">Stazia</option>
              <option value="cc">CC</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full text-sm bg-console border border-console-border rounded-md px-3 py-2 text-slate-300 focus:outline-none focus:border-tardis-glow"
            >
              <option value="">Let AI decide</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-sm bg-console border border-console-border rounded-md px-3 py-2 text-slate-300 focus:outline-none focus:border-tardis-glow"
            />
          </div>
        </div>

        {/* Related Entity */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">Related Entity (optional)</label>
          <input
            type="text"
            value={relatedEntity}
            onChange={(e) => setRelatedEntity(e.target.value)}
            placeholder="e.g., compliance:uuid or vendor:slug"
            className="w-full text-sm bg-console border border-console-border rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-tardis-glow"
          />
        </div>
      </div>

      {/* AI Classification */}
      <div className="console-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-tardis-glow" />
            AI Classification
          </h2>
          <button
            onClick={classify}
            disabled={classifying || !title.trim()}
            className="btn-brass text-xs flex items-center gap-1.5"
          >
            {classifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {classifying ? 'Classifying...' : classification ? 'Reclassify' : 'Classify'}
          </button>
        </div>

        {classification ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Domain</p>
                <div className="flex flex-wrap gap-1">
                  {classification.domain.map((d) => (
                    <span key={d} className="badge badge-blue text-[10px]">{d}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Action Type</p>
                <div className="flex flex-wrap gap-1">
                  {classification.actionType.map((a) => (
                    <span key={a} className="badge badge-brass text-[10px]">{a}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Urgency</p>
                <div className="flex flex-wrap gap-1">
                  {classification.urgency.map((u) => (
                    <span key={u} className={`badge text-[10px] ${u === 'routine' ? 'badge-green' : 'badge-amber'}`}>{u}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Prep Category</p>
                <div className="flex flex-wrap gap-1">
                  {classification.prepCategory.map((p) => (
                    <span key={p} className="badge badge-brass text-[10px]">{p}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2 border-t border-console-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-brass-muted" />
                <span className="text-[10px] text-slate-500">Suggested Priority:</span>
                <span className="text-xs text-slate-300 font-medium">{classification.suggestedPriority}</span>
              </div>
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-brass-muted" />
                {classification.suggestedTags.map((t) => (
                  <span key={t} className="badge badge-brass text-[10px]">{t}</span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Enter a title and click Classify to get AI-powered domain tagging, urgency assessment, and tag suggestions.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/captains-log" className="btn-brass text-sm">Cancel</Link>
        <button
          onClick={save}
          disabled={saving || !title.trim()}
          className="btn-primary text-sm flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>
    </div>
  );
}
