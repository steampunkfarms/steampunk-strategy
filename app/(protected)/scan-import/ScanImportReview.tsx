'use client';

import { useState } from 'react';
import {
  Search,
  Check,
  X,
  Loader2,
  Send,
  ArrowRight,
  ScanLine,
  Mail,
  UserPlus,
  MapPin,
  AlertTriangle,
} from 'lucide-react';

interface PendingScanImport {
  id: string;
  documentId: string;
  scanType: string;
  payerName: string | null;
  payerFirstName: string | null;
  payerLastName: string | null;
  payerStreet1: string | null;
  payerStreet2: string | null;
  payerCity: string | null;
  payerState: string | null;
  payerZip: string | null;
  amount: number | null;
  checkNumber: string | null;
  checkDate: string | null;
  bankName: string | null;
  memo: string | null;
  payee: string | null;
  grantorName: string | null;
  grantAmount: number | null;
  grantPurpose: string | null;
  taxYear: number | null;
  taxFormType: string | null;
  confidence: number | null;
  parseNotes: string | null;
  externalId: string;
  blobUrl: string | null;
}

interface DonorResult {
  id: string;
  donorId: string;
  firstName: string;
  lastName: string;
  email: string;
  totalGiftCount: number;
  totalLifetimeGiving: number;
  street1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  uspsOk?: boolean;
  mailerOnly?: boolean;
  mailAffinity?: string;
  matchType?: 'name_and_address' | 'name_only' | 'address_only';
}

const SCAN_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  pledge_check: { label: 'Pledge Check', color: 'bg-green-900/30 text-green-300' },
  grant_check: { label: 'Grant Check', color: 'bg-blue-900/30 text-blue-300' },
  grant_award_letter: { label: 'Grant Letter', color: 'bg-purple-900/30 text-purple-300' },
  tax_document_1099: { label: 'Tax Doc', color: 'bg-gray-700/50 text-gray-300' },
  envelope_return_address: { label: 'Envelope', color: 'bg-amber-900/30 text-amber-300' },
};

export default function ScanImportReview({
  initialPending,
  readyToPush,
}: {
  initialPending: PendingScanImport[];
  readyToPush: number;
}) {
  const [pending, setPending] = useState(initialPending);
  const [searchQuery, setSearchQuery] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<Record<string, DonorResult[]>>({});
  const [searching, setSearching] = useState<Record<string, boolean>>({});
  const [acting, setActing] = useState<Record<string, boolean>>({});
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<string | null>(null);
  const [pushReady, setPushReady] = useState(readyToPush);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const handleSearch = async (importId: string, si: PendingScanImport) => {
    const q = searchQuery[importId]?.trim() || si.payerName || '';
    if (q.length < 2) return;

    setSearching(prev => ({ ...prev, [importId]: true }));
    try {
      const params = new URLSearchParams({ q });
      if (si.payerStreet1) params.set('street', si.payerStreet1);
      if (si.payerZip) params.set('zip', si.payerZip);

      const res = await fetch(`/api/scan-import/donor-search?${params}`);
      const data = await res.json();
      setSearchResults(prev => ({ ...prev, [importId]: data.donors || [] }));
    } catch {
      // silent fail
    }
    setSearching(prev => ({ ...prev, [importId]: false }));
  };

  const handleMatch = async (importId: string, donor: DonorResult) => {
    setActing(prev => ({ ...prev, [importId]: true }));
    try {
      const res = await fetch(`/api/scan-import/${importId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'match',
          donorId: donor.id,
          donorName: `${donor.firstName} ${donor.lastName}`.trim(),
        }),
      });
      if (res.ok) {
        setPending(prev => prev.filter(si => si.id !== importId));
        setPushReady(prev => prev + 1);
      }
    } catch {
      // silent fail
    }
    setActing(prev => ({ ...prev, [importId]: false }));
  };

  const handleCreateMailer = async (importId: string) => {
    setActing(prev => ({ ...prev, [importId]: true }));
    try {
      const res = await fetch(`/api/scan-import/${importId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_mailer' }),
      });
      if (res.ok) {
        setPending(prev => prev.filter(si => si.id !== importId));
        setPushReady(prev => prev + 1);
      }
    } catch {
      // silent fail
    }
    setActing(prev => ({ ...prev, [importId]: false }));
  };

  const handleSkip = async (importId: string) => {
    setActing(prev => ({ ...prev, [importId]: true }));
    try {
      const res = await fetch(`/api/scan-import/${importId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip' }),
      });
      if (res.ok) {
        setPending(prev => prev.filter(si => si.id !== importId));
      }
    } catch {
      // silent fail
    }
    setActing(prev => ({ ...prev, [importId]: false }));
  };

  const handlePushAll = async () => {
    setPushing(true);
    setPushResult(null);
    try {
      const res = await fetch('/api/scan-import/push', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        const stats = data.studiolo || {};
        setPushResult(
          `Pushed ${data.pushed} scan imports to Studiolo. ` +
          `${stats.giftsCreated || 0} gifts, ${stats.donorsCreated || 0} donors created, ` +
          `${stats.donorsEnriched || 0} enriched.`
        );
        setPushReady(0);
      } else {
        setPushResult(`Error: ${data.error}`);
      }
    } catch (e: unknown) {
      setPushResult(`Push failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
    setPushing(false);
  };

  const formatAddress = (si: PendingScanImport) => {
    const parts = [si.payerStreet1, si.payerStreet2, si.payerCity, si.payerState, si.payerZip].filter(Boolean);
    if (parts.length === 0) return null;
    const line1 = [si.payerStreet1, si.payerStreet2].filter(Boolean).join(', ');
    const line2 = [si.payerCity, si.payerState].filter(Boolean).join(', ');
    const line3 = si.payerZip || '';
    return [line1, `${line2} ${line3}`.trim()].filter(Boolean).join(', ');
  };

  return (
    <div className="space-y-4">
      {/* Push bar */}
      {pushReady > 0 && (
        <div className="flex items-center gap-3 p-3 rounded bg-tardis-dark/50 border border-tardis-dim">
          <Send className="w-4 h-4 text-tardis-glow" />
          <span className="text-sm text-white">
            {pushReady} scan import{pushReady !== 1 ? 's' : ''} ready to push to Studiolo
          </span>
          <button
            onClick={handlePushAll}
            disabled={pushing}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-tardis-default hover:bg-tardis-light text-white text-sm rounded font-medium disabled:opacity-50"
          >
            {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Push to Studiolo
          </button>
        </div>
      )}

      {pushResult && (
        <div className={`p-3 rounded text-sm ${pushResult.startsWith('Error') || pushResult.startsWith('Push failed') ? 'bg-red-900/20 text-red-300' : 'bg-green-900/20 text-green-300'}`}>
          {pushResult}
        </div>
      )}

      {/* Empty state */}
      {pending.length === 0 && (
        <div className="p-8 text-center text-gray-400 rounded border border-dashed border-gray-700">
          <ScanLine className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No pending scans to review.</p>
          <p className="text-xs mt-1">Upload scanned documents above to get started.</p>
        </div>
      )}

      {/* Image lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-3 -right-3 p-1 bg-gray-800 rounded-full text-white hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={expandedImage}
              alt="Scanned document"
              className="max-w-full max-h-[85vh] object-contain rounded"
            />
          </div>
        </div>
      )}

      {/* Scan import cards */}
      {pending.map(si => {
        const typeInfo = SCAN_TYPE_LABELS[si.scanType] || { label: si.scanType, color: 'bg-gray-700/50 text-gray-300' };
        const address = formatAddress(si);
        const hasAddress = Boolean(si.payerStreet1 && si.payerZip);

        return (
          <div key={si.id} className="p-4 space-y-3 rounded border border-gray-700/50 bg-gray-900/30">
            {/* Top row: thumbnail + parsed data */}
            <div className="flex gap-4">
              {/* Image thumbnail */}
              {si.blobUrl && (
                <button
                  onClick={() => setExpandedImage(si.blobUrl)}
                  className="flex-shrink-0 w-24 h-32 rounded border border-gray-700 overflow-hidden bg-gray-800 hover:border-tardis-glow/50 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={si.blobUrl}
                    alt={`Scan: ${si.payerName || 'document'}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              )}

              {/* Parsed data */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  <span className="font-medium text-white">{si.payerName || 'Unknown payer'}</span>
                  {si.amount != null && (
                    <span className="text-green-400 font-mono">${si.amount.toFixed(2)}</span>
                  )}
                </div>

                {/* Check fields */}
                {(si.scanType === 'pledge_check' || si.scanType === 'grant_check') && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    {si.checkNumber && <span>Check #{si.checkNumber}</span>}
                    {si.checkDate && (
                      <span>{new Date(si.checkDate).toLocaleDateString()}</span>
                    )}
                    {si.bankName && <span>{si.bankName}</span>}
                    {si.payee && <span>Payee: {si.payee}</span>}
                  </div>
                )}

                {/* Memo line */}
                {si.memo && (
                  <div className="text-xs text-brass-gold">
                    Memo: &ldquo;{si.memo}&rdquo;
                  </div>
                )}

                {/* Grant fields */}
                {si.scanType === 'grant_award_letter' && si.grantorName && (
                  <div className="text-xs text-slate-400">
                    From: {si.grantorName}
                    {si.grantAmount != null && <span> &middot; ${si.grantAmount.toFixed(2)}</span>}
                    {si.grantPurpose && <span> &middot; {si.grantPurpose}</span>}
                  </div>
                )}

                {/* Tax fields */}
                {si.scanType === 'tax_document_1099' && (
                  <div className="text-xs text-slate-400">
                    {si.taxFormType && <span>{si.taxFormType}</span>}
                    {si.taxYear && <span> &middot; {si.taxYear}</span>}
                  </div>
                )}

                {/* Address */}
                {address && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span>{address}</span>
                  </div>
                )}

                {/* Confidence + notes */}
                <div className="flex items-center gap-3">
                  {si.confidence != null && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            si.confidence >= 0.85 ? 'bg-gauge-green' : si.confidence >= 0.6 ? 'bg-gauge-amber' : 'bg-gauge-red'
                          }`}
                          style={{ width: `${si.confidence * 100}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-mono ${
                        si.confidence >= 0.85 ? 'text-gauge-green' : si.confidence >= 0.6 ? 'text-gauge-amber' : 'text-gauge-red'
                      }`}>
                        {(si.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  {si.parseNotes && si.confidence != null && si.confidence < 0.85 && (
                    <div className="flex items-center gap-1 text-[10px] text-gauge-amber">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="truncate max-w-64">{si.parseNotes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Search + actions row */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search Studiolo donors..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  value={searchQuery[si.id] ?? si.payerName ?? ''}
                  onChange={e => setSearchQuery(prev => ({ ...prev, [si.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleSearch(si.id, si)}
                />
                <button
                  onClick={() => handleSearch(si.id, si)}
                  disabled={searching[si.id]}
                  className="px-3 py-1.5 bg-blue-900/50 hover:bg-blue-900/70 text-blue-300 text-sm rounded disabled:opacity-50"
                >
                  {searching[si.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
              {hasAddress && (
                <button
                  onClick={() => handleCreateMailer(si.id)}
                  disabled={acting[si.id]}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-yellow-800/50 hover:border-yellow-700 text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
                  title="Create mailer-only donor"
                >
                  <UserPlus className="w-4 h-4" />
                  <Mail className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => handleSkip(si.id)}
                disabled={acting[si.id]}
                className="px-3 py-1.5 text-gray-500 hover:text-red-400 text-sm rounded border border-gray-700 hover:border-red-800"
                title="Skip (remove from staging)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search results */}
            {searchResults[si.id] && searchResults[si.id].length > 0 && (
              <div className="ml-4 space-y-1">
                {searchResults[si.id].map(donor => (
                  <div key={donor.id} className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{donor.firstName} {donor.lastName}</span>
                        <span className="text-gray-500">{donor.email}</span>
                        <span className="text-gray-600 text-xs">({donor.donorId})</span>
                        {donor.matchType === 'name_and_address' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/40 text-green-400">
                            name + address
                          </span>
                        )}
                        {donor.matchType === 'address_only' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-400">
                            address match
                          </span>
                        )}
                        {donor.mailerOnly && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-400">
                            mailer
                          </span>
                        )}
                      </div>
                      {donor.street1 && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {donor.street1}, {donor.city} {donor.state} {donor.zipCode}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-gray-500 text-xs">
                        {donor.totalGiftCount} gifts &middot; ${donor.totalLifetimeGiving.toFixed(0)}
                      </span>
                      <button
                        onClick={() => handleMatch(si.id, donor)}
                        disabled={acting[si.id]}
                        className="flex items-center gap-1 px-2 py-1 bg-green-900/40 hover:bg-green-900/60 text-green-400 rounded text-xs"
                      >
                        <Check className="w-3 h-3" /> Match
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchResults[si.id] && searchResults[si.id].length === 0 && (
              <div className="ml-4 flex items-center gap-2 text-xs py-1">
                <span className="text-gray-500">No donors found.</span>
                {hasAddress && (
                  <button
                    onClick={() => handleCreateMailer(si.id)}
                    disabled={acting[si.id]}
                    className="text-yellow-400 hover:text-yellow-300 hover:underline"
                  >
                    Create mailer-only donor?
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
