'use client';

import { useState, useCallback } from 'react';
import {
  Image,
  File,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import DocumentUploader from './document-uploader';

interface DocumentRow {
  id: string;
  originalName: string;
  mimeType: string;
  docType: string;
  fileSize: number;
  parseStatus: string;
  confidence: number | null;
  uploadedAt: Date | string;
  vendor: { name: string; slug: string } | null;
}

const typeLabels: Record<string, string> = {
  invoice: 'Invoices',
  receipt: 'Receipts',
  bank_statement: 'Bank Statements',
  shipping_manifest: 'Shipping Manifests',
  tax_form: 'Tax Forms',
  filing: 'Filings',
  other: 'Other',
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  complete: CheckCircle2,
  pending: Clock,
  processing: Loader2,
  failed: AlertTriangle,
};

const statusColors: Record<string, string> = {
  complete: 'text-gauge-green',
  pending: 'text-gauge-blue',
  processing: 'text-gauge-amber',
  failed: 'text-gauge-red',
};

export default function DocumentsClient({ documents }: { documents: DocumentRow[] }) {
  const [docs, setDocs] = useState(documents);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRowClick = (doc: DocumentRow) => {
    if (doc.parseStatus === 'processing') return;
    setSelectedDocId(doc.id === selectedDocId ? null : doc.id);
  };

  const handleDelete = useCallback(async (e: React.MouseEvent, doc: DocumentRow) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${doc.originalName}"? This cannot be undone.`)) return;

    setDeletingId(doc.id);
    try {
      const res = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: doc.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Delete failed');
        return;
      }
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      if (selectedDocId === doc.id) setSelectedDocId(null);
    } catch {
      alert('Network error — could not delete');
    } finally {
      setDeletingId(null);
    }
  }, [selectedDocId]);

  return (
    <>
      {/* Quick Capture uploader */}
      <DocumentUploader
        loadDocumentId={selectedDocId}
        onComplete={() => setSelectedDocId(null)}
      />

      {/* Document list */}
      {docs.length > 0 && (
        <div className="console-card overflow-hidden">
          <table className="w-full bridge-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Type</th>
                <th>Vendor</th>
                <th>Size</th>
                <th>Parse Status</th>
                <th>Uploaded</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => {
                const Icon = doc.mimeType.startsWith('image/') ? Image : File;
                const StatusIcon = statusIcons[doc.parseStatus] ?? Clock;
                const statusColor = statusColors[doc.parseStatus] ?? 'text-slate-400';
                const isClickable = doc.parseStatus !== 'processing';
                const isSelected = doc.id === selectedDocId;

                return (
                  <tr
                    key={doc.id}
                    onClick={() => handleRowClick(doc)}
                    className={`
                      ${isClickable ? 'cursor-pointer hover:bg-console-hover' : 'opacity-60'}
                      ${isSelected ? 'bg-tardis/10 border-l-2 border-l-tardis-glow' : ''}
                      transition-colors
                    `}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-brass-muted flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-200 truncate">{doc.originalName}</p>
                          <p className="text-[10px] text-slate-600 font-mono">{doc.mimeType}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue text-[10px]">
                        {typeLabels[doc.docType] ?? doc.docType}
                      </span>
                    </td>
                    <td className="text-brass-warm">{doc.vendor?.name ?? '—'}</td>
                    <td className="font-mono text-xs text-slate-500">
                      {doc.fileSize > 1024 * 1024
                        ? `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`
                        : `${Math.round(doc.fileSize / 1024)} KB`
                      }
                    </td>
                    <td>
                      <span className={`flex items-center gap-1.5 text-xs ${statusColor}`}>
                        <StatusIcon className={`w-3 h-3 ${doc.parseStatus === 'processing' ? 'animate-spin' : ''}`} />
                        {doc.parseStatus}
                        {doc.confidence != null && (
                          <span className="text-slate-600 ml-1">
                            ({Number(doc.confidence) * 100}%)
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-500">
                      {formatDate(doc.uploadedAt)}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, doc)}
                        disabled={deletingId === doc.id}
                        className="p-1 rounded text-slate-600 hover:text-gauge-red hover:bg-gauge-red/10 transition-colors disabled:opacity-50"
                        title="Delete document"
                      >
                        {deletingId === doc.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
