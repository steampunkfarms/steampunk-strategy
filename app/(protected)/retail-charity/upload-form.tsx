'use client';

import { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertTriangle, FileText, Loader2 } from 'lucide-react';

interface ImportResult {
  success: boolean;
  importId?: string;
  reportType?: string;
  recordCount?: number;
  totalEarnings?: number;
  errors?: string[];
  error?: string;
  hint?: string;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  earnings_summary: 'Earnings Summary by Participant',
  order_history: 'Order History by Participant',
  deposit_slip: 'Monthly Deposit Slip',
  participant_list: 'Participant Summary',
};

export function RaiserightUpload() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/raiseright/upload', {
        method: 'POST',
        body: formData,
      });

      const data: ImportResult = await res.json();
      setResult(data);

      if (data.success) {
        // Reload the page after a short delay to show updated stats
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (e) {
      setResult({
        success: false,
        error: 'Upload failed. Check your connection and try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${dragOver
            ? 'border-tardis-glow bg-tardis/10'
            : 'border-console-border hover:border-tardis-glow/50 hover:bg-console-hover'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={onFileSelect}
          className="hidden"
        />
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-tardis-glow mx-auto mb-2 animate-spin" />
            <p className="text-sm text-slate-300">Processing CSV...</p>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-300 mb-1">
              Drop a RaiseRight CSV here, or click to browse
            </p>
            <p className="text-[10px] text-slate-500">
              Supported: Earnings Summary, Order History, Deposit Slip, Participant List
            </p>
          </>
        )}
      </div>

      {/* Result feedback */}
      {result && (
        <div
          className={`rounded-lg p-4 ${
            result.success
              ? 'bg-gauge-green/10 border border-gauge-green/20'
              : 'bg-gauge-red/10 border border-gauge-red/20'
          }`}
        >
          {result.success ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-gauge-green flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gauge-green">Import successful</p>
                <p className="text-xs text-slate-400 mt-1">
                  {REPORT_TYPE_LABELS[result.reportType ?? ''] ?? result.reportType} —{' '}
                  {result.recordCount} records
                  {result.totalEarnings ? `, ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(result.totalEarnings)} in earnings` : ''}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Refreshing dashboard...</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-gauge-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gauge-red">Import failed</p>
                <p className="text-xs text-slate-400 mt-1">{result.error}</p>
                {result.hint && (
                  <p className="text-[10px] text-slate-500 mt-1">{result.hint}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-400">How to export from RaiseRight:</p>
        <ol className="list-decimal ml-4 space-y-0.5">
          <li>Log in to your <a href="https://www.raiseright.com/coordinator" target="_blank" rel="noopener noreferrer" className="text-tardis-glow hover:underline">Coordinator Dashboard</a></li>
          <li>Go to Reports → select the report type</li>
          <li>Set the date range and click Export/Download</li>
          <li>Drop the CSV file here</li>
        </ol>
      </div>
    </div>
  );
}
