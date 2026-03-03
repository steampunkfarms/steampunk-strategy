'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  Plus,
  Loader2,
  ExternalLink,
  X,
  ChevronDown,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface CompletionDoc {
  id: string;
  originalName: string;
  blobUrl: string;
  mimeType: string;
}

interface CompletionRow {
  id: string;
  fiscalYear: number;
  period: string | null;
  dueDate: string;
  status: string;
  completedDate: string | null;
  completedBy: string | null;
  confirmationNum: string | null;
  amountPaid: number | null;
  certifiedCopyFee: number | null;
  expeditedFee: number | null;
  notes: string | null;
  documents: CompletionDoc[];
}

interface TaskSummary {
  id: string;
  name: string;
  slug: string;
  authority: string;
  category: string;
  frequency: string;
  requiresPayment: boolean;
  filingUrl: string | null;
}

const statusIcons: Record<string, typeof CheckCircle2> = {
  completed: CheckCircle2,
  in_progress: Clock,
  overdue: AlertTriangle,
  upcoming: Clock,
  extended: Clock,
};

const statusColors: Record<string, string> = {
  completed: 'text-gauge-green',
  in_progress: 'text-gauge-amber',
  overdue: 'text-gauge-red',
  upcoming: 'text-gauge-blue',
  extended: 'text-gauge-amber',
};

function totalCost(c: CompletionRow): number {
  return (c.amountPaid ?? 0) + (c.certifiedCopyFee ?? 0) + (c.expeditedFee ?? 0);
}

export default function ComplianceDetail({
  task,
  completions: initialCompletions,
}: {
  task: TaskSummary;
  completions: CompletionRow[];
}) {
  const router = useRouter();
  const [completions, setCompletions] = useState(initialCompletions);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Form state
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    fiscalYear: String(currentYear),
    period: String(currentYear),
    dueDate: '',
    completedDate: new Date().toISOString().split('T')[0],
    confirmationNum: '',
    amountPaid: '',
    certifiedCopyFee: '',
    expeditedFee: '',
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.size > 0);
    setSelectedFiles(prev => [...prev, ...files]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(prev => [...prev, ...files]);
    e.target.value = ''; // reset so same file can be re-selected
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('fiscalYear', formData.fiscalYear);
      fd.append('period', formData.period);
      fd.append('dueDate', formData.dueDate);
      if (formData.completedDate) fd.append('completedDate', formData.completedDate);
      if (formData.confirmationNum) fd.append('confirmationNum', formData.confirmationNum);
      if (formData.amountPaid) fd.append('amountPaid', formData.amountPaid);
      if (formData.certifiedCopyFee) fd.append('certifiedCopyFee', formData.certifiedCopyFee);
      if (formData.expeditedFee) fd.append('expeditedFee', formData.expeditedFee);
      if (formData.notes) fd.append('notes', formData.notes);

      for (const file of selectedFiles) {
        fd.append('files', file);
      }

      const res = await fetch(`/api/compliance-tasks/${task.id}/completions`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to log completion');
      }

      // Reset form and refresh
      setShowForm(false);
      setSelectedFiles([]);
      setFormData({
        fiscalYear: String(currentYear),
        period: String(currentYear),
        dueDate: '',
        completedDate: new Date().toISOString().split('T')[0],
        confirmationNum: '',
        amountPaid: '',
        certifiedCopyFee: '',
        expeditedFee: '',
        notes: '',
      });

      router.refresh();

      // Also fetch fresh completions for immediate display
      const freshRes = await fetch(`/api/compliance-tasks/${task.id}/completions`);
      if (freshRes.ok) {
        const fresh = await freshRes.json();
        setCompletions(fresh);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brass-gold uppercase tracking-wider">
          Filing History ({completions.length} record{completions.length !== 1 ? 's' : ''})
        </h2>
        <div className="flex items-center gap-3">
          {task.filingUrl && (
            <a
              href={task.filingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline text-xs flex items-center gap-1.5"
            >
              Filing portal <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-brass text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Log completion
          </button>
        </div>
      </div>

      {/* Completion form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="console-card p-5 space-y-4 border-l-4 border-brass-gold">
          <h3 className="text-sm font-semibold text-slate-200">Log Filing Completion</h3>

          {error && (
            <div className="rounded-lg bg-gauge-red/10 border border-gauge-red/30 p-3 text-sm text-gauge-red">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Fiscal Year *</label>
              <input
                type="number"
                required
                value={formData.fiscalYear}
                onChange={e => updateField('fiscalYear', e.target.value)}
                className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Period</label>
              <input
                type="text"
                value={formData.period}
                onChange={e => updateField('period', e.target.value)}
                placeholder="2025, Q1, 2025-01"
                className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={e => updateField('dueDate', e.target.value)}
                className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Completed Date</label>
              <input
                type="date"
                value={formData.completedDate}
                onChange={e => updateField('completedDate', e.target.value)}
                className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Confirmation #</label>
              <input
                type="text"
                value={formData.confirmationNum}
                onChange={e => updateField('confirmationNum', e.target.value)}
                placeholder="Filing confirmation"
                className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Filing Fee ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amountPaid}
                onChange={e => updateField('amountPaid', e.target.value)}
                placeholder="0.00"
                className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Certified Copy ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.certifiedCopyFee}
                onChange={e => updateField('certifiedCopyFee', e.target.value)}
                placeholder="0.00"
                className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Expedited ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.expeditedFee}
                onChange={e => updateField('expeditedFee', e.target.value)}
                placeholder="0.00"
                className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => updateField('notes', e.target.value)}
              placeholder="Any notes about this filing..."
              className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none resize-none"
            />
          </div>

          {/* File drop zone */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Proof of Filing</label>
            <div
              onDrop={handleFileDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-console-border rounded-lg p-4 text-center cursor-pointer hover:border-brass-gold/50 transition-colors"
            >
              <Upload className="w-5 h-5 text-brass-muted mx-auto mb-1" />
              <p className="text-xs text-slate-400">
                Drop PDF/image here or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-console rounded px-2 py-1">
                    <FileText className="w-3 h-3 text-brass-muted flex-shrink-0" />
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-slate-600">
                      {file.size > 1024 * 1024
                        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                        : `${Math.round(file.size / 1024)} KB`
                      }
                    </span>
                    <button type="button" onClick={() => removeFile(i)} className="text-slate-600 hover:text-gauge-red">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-brass text-xs flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : 'Save Completion'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(''); }}
              className="btn btn-outline text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filing history timeline */}
      {completions.length === 0 ? (
        <div className="console-card p-8 text-center">
          <Clock className="w-8 h-8 text-brass-muted mx-auto mb-2" />
          <p className="text-sm text-slate-400">No completions logged yet.</p>
          <p className="text-xs text-slate-600 mt-1">Click &quot;Log completion&quot; to record a filing.</p>
        </div>
      ) : (
        <div className="console-card overflow-hidden">
          <table className="w-full bridge-table">
            <thead>
              <tr>
                <th className="w-8"></th>
                <th>Period</th>
                <th>Due Date</th>
                <th>Filed</th>
                <th>Status</th>
                <th>Conf #</th>
                <th>Total Cost</th>
                <th>Docs</th>
              </tr>
            </thead>
            <tbody>
              {completions.map((c) => {
                const StatusIcon = statusIcons[c.status] ?? Clock;
                const statusColor = statusColors[c.status] ?? 'text-slate-400';
                const isExpanded = expandedId === c.id;
                const cost = totalCost(c);

                return (
                  <CompletionTableRow
                    key={c.id}
                    completion={c}
                    StatusIcon={StatusIcon}
                    statusColor={statusColor}
                    isExpanded={isExpanded}
                    cost={cost}
                    onToggle={() => setExpandedId(isExpanded ? null : c.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CompletionTableRow({
  completion: c,
  StatusIcon,
  statusColor,
  isExpanded,
  cost,
  onToggle,
}: {
  completion: CompletionRow;
  StatusIcon: typeof CheckCircle2;
  statusColor: string;
  isExpanded: boolean;
  cost: number;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer hover:bg-console-hover transition-colors"
      >
        <td>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </td>
        <td className="font-mono text-sm text-slate-200">
          FY{c.fiscalYear}{c.period && c.period !== String(c.fiscalYear) ? ` / ${c.period}` : ''}
        </td>
        <td className="font-mono text-xs text-slate-500">{formatDate(c.dueDate)}</td>
        <td className="font-mono text-xs text-slate-400">
          {c.completedDate ? formatDate(c.completedDate) : '—'}
        </td>
        <td>
          <span className={`flex items-center gap-1.5 text-xs ${statusColor}`}>
            <StatusIcon className="w-3 h-3" />
            {c.status}
          </span>
        </td>
        <td className="font-mono text-xs text-slate-400">{c.confirmationNum || '—'}</td>
        <td className="font-mono text-xs text-slate-300">
          {cost > 0 ? formatCurrency(cost) : '—'}
        </td>
        <td className="text-xs text-slate-500">
          {c.documents.length > 0 ? (
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {c.documents.length}
            </span>
          ) : '—'}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={8} className="bg-console/50 px-6 py-4">
            <div className="space-y-3">
              {/* Cost breakdown */}
              {cost > 0 && (
                <div className="flex flex-wrap gap-4 text-xs">
                  {c.amountPaid != null && c.amountPaid > 0 && (
                    <span className="text-slate-300">
                      Filing fee: <span className="font-mono text-slate-200">{formatCurrency(c.amountPaid)}</span>
                    </span>
                  )}
                  {c.certifiedCopyFee != null && c.certifiedCopyFee > 0 && (
                    <span className="text-slate-300">
                      Certified copy: <span className="font-mono text-slate-200">{formatCurrency(c.certifiedCopyFee)}</span>
                    </span>
                  )}
                  {c.expeditedFee != null && c.expeditedFee > 0 && (
                    <span className="text-slate-300">
                      Expedited: <span className="font-mono text-slate-200">{formatCurrency(c.expeditedFee)}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Notes */}
              {c.notes && (
                <p className="text-xs text-slate-400 italic">{c.notes}</p>
              )}

              {/* Completed by */}
              {c.completedBy && (
                <p className="text-xs text-slate-600">Filed by: {c.completedBy}</p>
              )}

              {/* Attached documents */}
              {c.documents.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-brass-muted font-medium">Attached Documents</p>
                  {c.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.blobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-tardis-glow hover:underline"
                    >
                      <FileText className="w-3 h-3" />
                      {doc.originalName}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
