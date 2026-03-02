'use client';

import { useState } from 'react';
import {
  Image,
  File,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
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
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const handleRowClick = (doc: DocumentRow) => {
    if (doc.parseStatus === 'processing') return;
    setSelectedDocId(doc.id === selectedDocId ? null : doc.id);
  };

  return (
    <>
      {/* Quick Capture uploader */}
      <DocumentUploader
        loadDocumentId={selectedDocId}
        onComplete={() => setSelectedDocId(null)}
      />

      {/* Document list */}
      {documents.length > 0 && (
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
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
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
