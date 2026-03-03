'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────

interface ExtractedVetData {
  clinic?: { name?: string; phone?: string; address?: string; veterinarian?: string };
  patient?: { name?: string; species?: string; breed?: string; weight?: string; age?: string; patientId?: string };
  owner?: string;
  date?: string;
  recordType?: string;
  procedures?: string[];
  diagnoses?: string[];
  medications?: { name: string; dose?: string; frequency?: string }[];
  lineItems?: { description: string; quantity?: number; unitPrice?: number; total: number }[];
  total?: number;
  subtotal?: number;
  tax?: number;
  amountPaid?: number;
  referenceNumber?: string;
  confidence?: number;
  notes?: string;
  tags?: string[];
}

interface EnrichmentData {
  animalName?: string;
  animalSpecies?: string;
  animalBreed?: string;
  vetProviderName?: string;
  recordDate?: string;
  recordType?: string;
  title?: string;
  totalAmount?: number;
  amountPaid?: number;
  subsidyType?: string;
  subsidyNote?: string;
  tags?: string[];
  procedures?: string[];
  notes?: string;
}

interface StagedRecord {
  id: string;
  filename: string;
  blobUrl: string;
  docType: string;
  parseStatus: string;
  confidence: number | null;
  extractedData: ExtractedVetData | null;
  enrichmentData: EnrichmentData | null;
  uploadedAt: string;
}

type StatusFilter = 'ALL' | 'complete' | 'approved' | 'rejected' | 'failed' | 'pending';

const STATUS_BADGES: Record<string, string> = {
  pending: 'bg-slate-700 text-slate-300',
  processing: 'bg-blue-900 text-blue-300',
  complete: 'bg-amber-900 text-amber-200',
  approved: 'bg-emerald-900 text-emerald-200',
  rejected: 'bg-red-900/50 text-red-300',
  failed: 'bg-red-900 text-red-200',
};

const RECORD_TYPES = ['invoice', 'estimate', 'lab_results', 'imaging', 'surgical_report', 'medical_history', 'vaccination', 'wellness_exam', 'adoption_contract', 'other'];
const SUBSIDY_TYPES = ['', 'steampunk_funded', 'donor_funded', 'partner_sanctuary'];

// ── Component ─────────────────────────────────────────────

export default function VetStagingPage() {
  const [records, setRecords] = useState<StagedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('complete');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EnrichmentData>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/vet-staging?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const startEditing = (rec: StagedRecord) => {
    const ext = rec.extractedData;
    const enr = rec.enrichmentData || {};
    setEditForm({
      animalName: enr.animalName ?? ext?.patient?.name ?? '',
      animalSpecies: enr.animalSpecies ?? ext?.patient?.species ?? '',
      animalBreed: enr.animalBreed ?? ext?.patient?.breed ?? '',
      vetProviderName: enr.vetProviderName ?? ext?.clinic?.name ?? '',
      recordDate: enr.recordDate ?? ext?.date ?? '',
      recordType: enr.recordType ?? ext?.recordType ?? '',
      totalAmount: enr.totalAmount ?? ext?.total ?? undefined,
      amountPaid: enr.amountPaid ?? ext?.amountPaid ?? undefined,
      subsidyType: enr.subsidyType ?? '',
      subsidyNote: enr.subsidyNote ?? '',
      notes: enr.notes ?? ext?.notes ?? '',
      tags: enr.tags ?? ext?.tags ?? [],
      procedures: enr.procedures ?? ext?.procedures ?? [],
    });
    setEditingId(rec.id);
  };

  const saveEdits = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/vet-staging/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrichmentData: editForm }),
      });
      setEditingId(null);
      fetchRecords();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const approveRecord = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/vet-staging/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        fetchRecords();
      } else {
        const data = await res.json();
        alert(`Approve failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const rejectRecord = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/vet-staging/${id}/reject`, { method: 'POST' });
      fetchRecords();
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const counts = {
    total: records.length,
    pending: records.filter(r => r.parseStatus === 'complete').length,
    approved: records.filter(r => r.parseStatus === 'approved').length,
    rejected: records.filter(r => r.parseStatus === 'rejected').length,
    failed: records.filter(r => r.parseStatus === 'failed').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="w-7 h-7 text-brass-warm" />
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-100">Vet Record Staging</h1>
            <p className="text-sm text-slate-400">Review AI-parsed vet documents before pushing to Postmaster</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Awaiting Review', count: counts.pending, color: 'text-amber-300' },
          { label: 'Approved', count: counts.approved, color: 'text-emerald-300' },
          { label: 'Rejected', count: counts.rejected, color: 'text-red-300' },
          { label: 'Failed Parse', count: counts.failed, color: 'text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-console p-3 rounded-lg border border-console-border">
            <p className={`text-xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search filename, animal, clinic..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded bg-console border border-console-border text-slate-200 placeholder:text-slate-600 text-sm focus:outline-none focus:border-brass-warm/40"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 rounded bg-console border border-console-border text-slate-300 text-sm"
        >
          <option value="ALL">All Statuses</option>
          <option value="complete">Awaiting Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending Parse</option>
        </select>
      </div>

      {/* Records */}
      {loading ? (
        <div className="text-slate-500 text-center py-16">Loading staged records...</div>
      ) : records.length === 0 ? (
        <div className="text-slate-500 text-center py-16">
          No records found. Run the ingestion script to import vet files.
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(rec => {
            const ext = rec.extractedData;
            const enr = rec.enrichmentData;
            const patientName = enr?.animalName || ext?.patient?.name || 'Unknown';
            const species = enr?.animalSpecies || ext?.patient?.species || '';
            const clinic = enr?.vetProviderName || ext?.clinic?.name || '';
            const isExpanded = expandedId === rec.id;
            const isEditing = editingId === rec.id;
            const isLoading = actionLoading === rec.id;

            return (
              <div key={rec.id} className="bg-console border border-console-border rounded-lg overflow-hidden">
                {/* Summary row */}
                <button
                  onClick={() => { setExpandedId(isExpanded ? null : rec.id); if (isEditing && !isExpanded) setEditingId(null); }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-console-hover transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-100 font-medium truncate">{patientName}</span>
                      {species && <span className="text-xs text-slate-500">({species})</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGES[rec.parseStatus] || STATUS_BADGES.pending}`}>
                        {rec.parseStatus === 'complete' ? 'awaiting review' : rec.parseStatus}
                      </span>
                      {enr && Object.keys(enr).length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brass-dark/30 text-brass-warm">edited</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>{rec.filename}</span>
                      {clinic && <span>{clinic}</span>}
                      {ext?.date && <span>{ext.date}</span>}
                      {ext?.total && <span className="text-emerald-400">${ext.total.toFixed(2)}</span>}
                      {rec.confidence !== null && (
                        <span className={rec.confidence >= 0.85 ? 'text-emerald-400' : rec.confidence >= 0.6 ? 'text-amber-400' : 'text-red-400'}>
                          {(rec.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-console-border space-y-4">
                    {/* Confidence bar */}
                    {rec.confidence !== null && (
                      <div className="pt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500 uppercase tracking-wider">AI Confidence</span>
                          <span className={rec.confidence >= 0.85 ? 'text-emerald-400' : rec.confidence >= 0.6 ? 'text-amber-400' : 'text-red-400'}>
                            {(rec.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${rec.confidence >= 0.85 ? 'bg-emerald-500' : rec.confidence >= 0.6 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${(rec.confidence * 100).toFixed(0)}%` }}
                          />
                        </div>
                        {rec.confidence < 0.85 && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-amber-400 bg-amber-900/20 px-3 py-2 rounded">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Low confidence — please verify extracted fields before approving.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Edit form or read-only display */}
                    {isEditing ? (
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-slate-500 uppercase tracking-wider">Animal Name</label>
                            <input
                              type="text"
                              value={editForm.animalName || ''}
                              onChange={e => setEditForm({ ...editForm, animalName: e.target.value })}
                              className="w-full mt-1 px-3 py-1.5 rounded bg-tardis-dark border border-console-border text-slate-200 text-sm focus:outline-none focus:border-brass-warm/40"
                              placeholder="e.g., Beau"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 uppercase tracking-wider">Species</label>
                            <input
                              type="text"
                              value={editForm.animalSpecies || ''}
                              onChange={e => setEditForm({ ...editForm, animalSpecies: e.target.value })}
                              className="w-full mt-1 px-3 py-1.5 rounded bg-tardis-dark border border-console-border text-slate-200 text-sm focus:outline-none focus:border-brass-warm/40"
                              placeholder="e.g., dog"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 uppercase tracking-wider">Breed</label>
                            <input
                              type="text"
                              value={editForm.animalBreed || ''}
                              onChange={e => setEditForm({ ...editForm, animalBreed: e.target.value })}
                              className="w-full mt-1 px-3 py-1.5 rounded bg-tardis-dark border border-console-border text-slate-200 text-sm focus:outline-none focus:border-brass-warm/40"
                              placeholder="e.g., English Bulldog"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-slate-500 uppercase tracking-wider">Clinic/Provider</label>
                            <input
                              type="text"
                              value={editForm.vetProviderName || ''}
                              onChange={e => setEditForm({ ...editForm, vetProviderName: e.target.value })}
                              className="w-full mt-1 px-3 py-1.5 rounded bg-tardis-dark border border-console-border text-slate-200 text-sm focus:outline-none focus:border-brass-warm/40"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 uppercase tracking-wider">Date</label>
                            <input
                              type="date"
                              value={editForm.recordDate || ''}
                              onChange={e => setEditForm({ ...editForm, recordDate: e.target.value })}
                              className="w-full mt-1 px-3 py-1.5 rounded bg-tardis-dark border border-console-border text-slate-200 text-sm focus:outline-none focus:border-brass-warm/40"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 uppercase tracking-wider">Record Type</label>
                            <select
                              value={editForm.recordType || ''}
                              onChange={e => setEditForm({ ...editForm, recordType: e.target.value })}
                              className="w-full mt-1 px-3 py-1.5 rounded bg-tardis-dark border border-console-border text-slate-200 text-sm"
                            >
                              {RECORD_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-slate-500 uppercase tracking-wider">Total Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.totalAmount ?? ''}
                              onChange={e => setEditForm({ ...editForm, totalAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-full mt-1 px-3 py-1.5 rounded bg-tardis-dark border border-console-border text-slate-200 text-sm focus:outline-none focus:border-brass-warm/40"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 uppercase tracking-wider">Subsidy Type</label>
                            <select
                              value={editForm.subsidyType || ''}
                              onChange={e => setEditForm({ ...editForm, subsidyType: e.target.value })}
                              className="w-full mt-1 px-3 py-1.5 rounded bg-tardis-dark border border-console-border text-slate-200 text-sm"
                            >
                              <option value="">None</option>
                              {SUBSIDY_TYPES.filter(Boolean).map(t => (
                                <option key={t} value={t}>{t.replace('_', ' ')}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 uppercase tracking-wider">Subsidy Note</label>
                            <input
                              type="text"
                              value={editForm.subsidyNote || ''}
                              onChange={e => setEditForm({ ...editForm, subsidyNote: e.target.value })}
                              className="w-full mt-1 px-3 py-1.5 rounded bg-tardis-dark border border-console-border text-slate-200 text-sm focus:outline-none focus:border-brass-warm/40"
                              placeholder="e.g., Alpine 168 pigs at partner sanctuary"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 uppercase tracking-wider">Notes</label>
                          <textarea
                            rows={2}
                            value={editForm.notes || ''}
                            onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 rounded bg-tardis-dark border border-console-border text-slate-200 text-sm resize-none focus:outline-none focus:border-brass-warm/40"
                            placeholder="Additional context..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdits(rec.id)}
                            disabled={isLoading}
                            className="px-4 py-1.5 text-sm rounded bg-brass-dark text-brass-warm hover:bg-brass-dark/80 transition-colors disabled:opacity-50"
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-1.5 text-sm rounded text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Read-only extracted data display */
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {ext?.patient?.name && (
                            <div>
                              <span className="text-xs text-slate-500 uppercase tracking-wider">Patient (AI)</span>
                              <p className="text-slate-200 mt-0.5">{ext.patient.name}</p>
                              {ext.patient.patientId && <p className="text-xs text-slate-500 font-mono">#{ext.patient.patientId}</p>}
                            </div>
                          )}
                          {ext?.clinic?.name && (
                            <div>
                              <span className="text-xs text-slate-500 uppercase tracking-wider">Clinic (AI)</span>
                              <p className="text-slate-200 mt-0.5">{ext.clinic.name}</p>
                              {ext.clinic.veterinarian && <p className="text-xs text-slate-500">{ext.clinic.veterinarian}</p>}
                            </div>
                          )}
                          {ext?.owner && (
                            <div>
                              <span className="text-xs text-slate-500 uppercase tracking-wider">Owner (AI)</span>
                              <p className="text-slate-200 mt-0.5">{ext.owner}</p>
                            </div>
                          )}
                          {ext?.referenceNumber && (
                            <div>
                              <span className="text-xs text-slate-500 uppercase tracking-wider">Reference</span>
                              <p className="text-slate-200 font-mono text-xs mt-0.5">{ext.referenceNumber}</p>
                            </div>
                          )}
                        </div>

                        {/* Procedures */}
                        {ext?.procedures && ext.procedures.length > 0 && (
                          <div>
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Procedures</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {ext.procedures.map((p, i) => (
                                <span key={i} className="px-2 py-0.5 text-xs rounded bg-tardis-dark text-slate-300">{p}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Diagnoses */}
                        {ext?.diagnoses && ext.diagnoses.length > 0 && (
                          <div>
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Diagnoses</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {ext.diagnoses.map((d, i) => (
                                <span key={i} className="px-2 py-0.5 text-xs rounded bg-red-900/30 text-red-300">{d}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Line items */}
                        {ext?.lineItems && ext.lineItems.length > 0 && (
                          <details className="text-sm">
                            <summary className="text-slate-400 cursor-pointer hover:text-slate-200 text-xs">
                              {ext.lineItems.length} line item{ext.lineItems.length !== 1 ? 's' : ''}
                            </summary>
                            <table className="w-full mt-2 text-xs">
                              <thead>
                                <tr className="text-slate-500 uppercase tracking-wider">
                                  <th className="text-left py-1">Item</th>
                                  <th className="text-right py-1">Qty</th>
                                  <th className="text-right py-1">Unit</th>
                                  <th className="text-right py-1">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-console-border">
                                {ext.lineItems.map((item, i) => (
                                  <tr key={i}>
                                    <td className="text-slate-300 py-1">{item.description}</td>
                                    <td className="text-right text-slate-400 py-1">{item.quantity ?? '-'}</td>
                                    <td className="text-right text-slate-400 py-1">{item.unitPrice != null ? `$${item.unitPrice.toFixed(2)}` : '-'}</td>
                                    <td className="text-right text-slate-200 py-1">${item.total.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </details>
                        )}

                        {/* Notes */}
                        {ext?.notes && (
                          <div>
                            <span className="text-xs text-slate-500 uppercase tracking-wider">AI Notes</span>
                            <p className="text-slate-400 text-sm mt-1">{ext.notes}</p>
                          </div>
                        )}

                        {/* Tags */}
                        {ext?.tags && ext.tags.length > 0 && (
                          <div>
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Tags</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {ext.tags.map((t, i) => (
                                <span key={i} className="px-2 py-0.5 text-xs rounded bg-blue-900/40 text-blue-300">{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-console-border">
                      <a
                        href={rec.blobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-tardis text-slate-200 hover:bg-tardis-light transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Document
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {rec.parseStatus === 'complete' && !isEditing && (
                        <>
                          <button
                            onClick={() => startEditing(rec)}
                            className="px-3 py-1.5 text-xs rounded bg-brass-dark text-brass-warm hover:bg-brass-dark/80 transition-colors"
                          >
                            Edit Fields
                          </button>
                          <button
                            onClick={() => approveRecord(rec.id)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-emerald-900 text-emerald-200 hover:bg-emerald-800 transition-colors disabled:opacity-50"
                          >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Approve & Push
                          </button>
                          <button
                            onClick={() => rejectRecord(rec.id)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </>
                      )}

                      {rec.parseStatus === 'approved' && (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Pushed to Postmaster
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
