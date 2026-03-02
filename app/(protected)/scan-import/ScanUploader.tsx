'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  HandCoins,
  Landmark,
  ScrollText,
  FileSpreadsheet,
  Mail,
} from 'lucide-react';

const SCAN_TYPES = [
  { value: 'pledge_check', label: 'Pledge Check', icon: HandCoins, desc: 'Personal check from a donor' },
  { value: 'grant_check', label: 'Grant Check', icon: Landmark, desc: 'DAF or foundation check' },
  { value: 'grant_award_letter', label: 'Grant Letter', icon: ScrollText, desc: 'Award letter on letterhead' },
  { value: 'tax_document_1099', label: 'Tax Document', icon: FileSpreadsheet, desc: '1099, W-9, etc.' },
  { value: 'envelope_return_address', label: 'Envelope', icon: Mail, desc: 'Return address only' },
] as const;

interface FileProgress {
  name: string;
  status: 'queued' | 'uploading' | 'parsing' | 'done' | 'error';
  error?: string;
  confidence?: number;
  payerName?: string;
  documentsFound?: number;
}

export default function ScanUploader() {
  const router = useRouter();
  const [scanType, setScanType] = useState('pledge_check');
  const [files, setFiles] = useState<FileProgress[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File): Promise<FileProgress> => {
    try {
      // Upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('scanType', scanType);

      const uploadRes = await fetch('/api/scan-import/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

      // Parse
      const parseRes = await fetch('/api/scan-import/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanImportId: uploadData.scanImportId }),
      });
      const parseData = await parseRes.json();

      if (!parseRes.ok) throw new Error(parseData.error || 'Parse failed');

      const docsFound = parseData.documentsFound || 1;
      const firstName = parseData.extracted?.payer?.fullName;
      const summary = docsFound > 1
        ? `${docsFound} documents found`
        : firstName;

      return {
        name: file.name,
        status: 'done',
        confidence: parseData.confidence,
        payerName: summary,
        documentsFound: docsFound,
      };
    } catch (err) {
      return {
        name: file.name,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  };

  const handleFiles = useCallback(async (fileList: FileList) => {
    if (processing) return;
    setProcessing(true);

    const entries: FileProgress[] = Array.from(fileList).map(f => ({
      name: f.name,
      status: 'queued' as const,
    }));
    setFiles(entries);

    for (let i = 0; i < fileList.length; i++) {
      // Mark current as uploading
      entries[i] = { ...entries[i], status: 'uploading' };
      setFiles([...entries]);

      // Mark as parsing after a moment (optimistic)
      const uploadTimeout = setTimeout(() => {
        entries[i] = { ...entries[i], status: 'parsing' };
        setFiles([...entries]);
      }, 2000);

      const result = await processFile(fileList[i]);
      clearTimeout(uploadTimeout);
      entries[i] = result;
      setFiles([...entries]);
    }

    setProcessing(false);
    router.refresh();
  }, [processing, scanType, router]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const reset = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const doneCount = files.filter(f => f.status === 'done').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const allDone = files.length > 0 && !processing;

  return (
    <div className="console-card">
      <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Upload className="w-4 h-4 text-brass-gold" />
          Upload Scans
        </h2>
        {files.length > 0 && (
          <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Scan type selector */}
        <div>
          <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-2">
            Document Type
          </label>
          <div className="grid grid-cols-5 gap-2">
            {SCAN_TYPES.map(st => {
              const Icon = st.icon;
              const active = scanType === st.value;
              return (
                <button
                  key={st.value}
                  onClick={() => setScanType(st.value)}
                  disabled={processing}
                  className={`
                    flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all
                    ${active
                      ? 'border-tardis-glow/40 bg-tardis/20 text-tardis-glow'
                      : 'border-console-border bg-console hover:bg-console-hover text-slate-400 hover:text-slate-300'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-tardis-glow' : 'text-slate-500'}`} />
                  <span className="text-[11px] font-medium leading-tight">{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drop zone (only when not processing) */}
        {!processing && files.length === 0 && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors
              ${dragActive
                ? 'border-tardis-glow bg-tardis/10'
                : 'border-console-border hover:border-tardis/50 hover:bg-console-hover'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-tardis/10 border border-tardis/30 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-tardis-glow" />
            </div>
            <p className="text-sm text-slate-300">
              Drop scanned documents here, or <span className="text-tardis-glow underline">browse</span>
            </p>
            <p className="text-[11px] text-slate-600 mt-2">
              PDF, JPEG, PNG, HEIC &middot; Max 10MB each &middot; Multiple files OK
            </p>
          </div>
        )}

        {/* File progress list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded bg-gray-900/30 border border-gray-700/30">
                {f.status === 'queued' && (
                  <div className="w-4 h-4 rounded-full border border-gray-600" />
                )}
                {f.status === 'uploading' && (
                  <Loader2 className="w-4 h-4 text-tardis-glow animate-spin" />
                )}
                {f.status === 'parsing' && (
                  <Loader2 className="w-4 h-4 text-brass-gold animate-spin" />
                )}
                {f.status === 'done' && (
                  <CheckCircle2 className="w-4 h-4 text-gauge-green" />
                )}
                {f.status === 'error' && (
                  <AlertTriangle className="w-4 h-4 text-gauge-red" />
                )}

                <span className="text-sm text-slate-300 flex-1 truncate">{f.name}</span>

                {f.status === 'uploading' && (
                  <span className="text-[11px] text-tardis-glow">Uploading...</span>
                )}
                {f.status === 'parsing' && (
                  <span className="text-[11px] text-brass-gold">Claude is reading...</span>
                )}
                {f.status === 'done' && f.payerName && (
                  <span className="text-[11px] text-slate-400">{f.payerName}</span>
                )}
                {f.status === 'done' && f.confidence != null && (
                  <span className={`text-[11px] font-mono ${
                    f.confidence >= 0.85 ? 'text-gauge-green' : f.confidence >= 0.6 ? 'text-gauge-amber' : 'text-gauge-red'
                  }`}>
                    {(f.confidence * 100).toFixed(0)}%
                  </span>
                )}
                {f.status === 'error' && (
                  <span className="text-[11px] text-gauge-red truncate max-w-48">{f.error}</span>
                )}
              </div>
            ))}

            {/* Summary when done */}
            {allDone && (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-sm text-slate-300">
                  {doneCount} processed{errorCount > 0 ? `, ${errorCount} failed` : ''}
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="ml-auto text-sm text-tardis-glow hover:underline"
                >
                  Upload more
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
