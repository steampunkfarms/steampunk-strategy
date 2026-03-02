'use client';

import { useState } from 'react';
import { Search, Check, X, Gift, Loader2, Send, ArrowRight } from 'lucide-react';

interface StagedGift {
  id: string;
  displayName: string;
  amount: number;
  giftDate: string;
  campaign: string | null;
  source: string;
  rawSubject: string | null;
  rawSnippet: string | null;
}

interface DonorResult {
  id: string;
  donorId: string;
  firstName: string;
  lastName: string;
  email: string;
  totalGiftCount: number;
  totalLifetimeGiving: number;
}

export default function GiftStagingReview({
  initialPending,
  readyToPush,
}: {
  initialPending: StagedGift[];
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

  const handleSearch = async (giftId: string) => {
    const q = searchQuery[giftId]?.trim();
    if (!q || q.length < 2) return;

    setSearching(prev => ({ ...prev, [giftId]: true }));
    try {
      const res = await fetch(`/api/gift-staging/donor-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(prev => ({ ...prev, [giftId]: data.donors || [] }));
    } catch {
      // silent fail
    }
    setSearching(prev => ({ ...prev, [giftId]: false }));
  };

  const handleMatch = async (giftId: string, donor: DonorResult) => {
    setActing(prev => ({ ...prev, [giftId]: true }));
    try {
      const res = await fetch(`/api/gift-staging/${giftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'match',
          donorId: donor.id,
          donorName: `${donor.firstName} ${donor.lastName}`.trim(),
        }),
      });
      if (res.ok) {
        setPending(prev => prev.filter(g => g.id !== giftId));
        setPushReady(prev => prev + 1);
      }
    } catch {
      // silent fail
    }
    setActing(prev => ({ ...prev, [giftId]: false }));
  };

  const handleSendUnmatched = async (giftId: string) => {
    setActing(prev => ({ ...prev, [giftId]: true }));
    try {
      const res = await fetch(`/api/gift-staging/${giftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_unmatched' }),
      });
      if (res.ok) {
        setPending(prev => prev.filter(g => g.id !== giftId));
        setPushReady(prev => prev + 1);
      }
    } catch {
      // silent fail
    }
    setActing(prev => ({ ...prev, [giftId]: false }));
  };

  const handleSkip = async (giftId: string) => {
    setActing(prev => ({ ...prev, [giftId]: true }));
    try {
      const res = await fetch(`/api/gift-staging/${giftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip' }),
      });
      if (res.ok) {
        setPending(prev => prev.filter(g => g.id !== giftId));
      }
    } catch {
      // silent fail
    }
    setActing(prev => ({ ...prev, [giftId]: false }));
  };

  const handlePushAll = async () => {
    setPushing(true);
    setPushResult(null);
    try {
      const res = await fetch('/api/gift-staging/push', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setPushResult(`Pushed ${data.pushed} gifts to Studiolo. ${data.studiolo?.giftsCreated || 0} matched, ${data.studiolo?.stagedCreated || 0} staged for review.`);
        setPushReady(0);
      } else {
        setPushResult(`Error: ${data.error}`);
      }
    } catch (e: unknown) {
      setPushResult(`Push failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
    setPushing(false);
  };

  return (
    <div className="space-y-4">
      {/* Push button */}
      {pushReady > 0 && (
        <div className="flex items-center gap-3 p-3 rounded bg-tardis-dark/50 border border-tardis-dim">
          <Send className="w-4 h-4 text-tardis-glow" />
          <span className="text-sm text-white">
            {pushReady} gift{pushReady !== 1 ? 's' : ''} ready to push to Studiolo
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
        <div className={`p-3 rounded text-sm ${pushResult.startsWith('Error') ? 'bg-red-900/20 text-red-300' : 'bg-green-900/20 text-green-300'}`}>
          {pushResult}
        </div>
      )}

      {/* Empty state */}
      {pending.length === 0 && (
        <div className="p-8 text-center text-gray-400 rounded border border-dashed border-gray-700">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No pending gifts to review.</p>
          <p className="text-xs mt-1">Run the scanner script to import new donations.</p>
        </div>
      )}

      {/* Gift cards */}
      {pending.map(gift => (
        <div key={gift.id} className="p-4 space-y-3 rounded border border-gray-700/50 bg-gray-900/30">
          {/* Gift info row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-4 h-4 text-amber-400" />
              <span className="font-medium text-white">{gift.displayName}</span>
              <span className="text-green-400 font-mono">${gift.amount.toFixed(2)}</span>
              <span className="text-gray-500 text-sm">
                {new Date(gift.giftDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {gift.campaign && (
                <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded">
                  {gift.campaign}
                </span>
              )}
            </div>
          </div>

          {/* Search + actions row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                placeholder="Search Studiolo donors..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                value={searchQuery[gift.id] ?? gift.displayName}
                onChange={e => setSearchQuery(prev => ({ ...prev, [gift.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSearch(gift.id)}
              />
              <button
                onClick={() => handleSearch(gift.id)}
                disabled={searching[gift.id]}
                className="px-3 py-1.5 bg-blue-900/50 hover:bg-blue-900/70 text-blue-300 text-sm rounded disabled:opacity-50"
              >
                {searching[gift.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => handleSendUnmatched(gift.id)}
              disabled={acting[gift.id]}
              className="px-3 py-1.5 text-amber-400 hover:text-amber-300 text-sm rounded border border-amber-800/50 hover:border-amber-700"
              title="Send to Studiolo unmatched"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSkip(gift.id)}
              disabled={acting[gift.id]}
              className="px-3 py-1.5 text-gray-500 hover:text-red-400 text-sm rounded border border-gray-700 hover:border-red-800"
              title="Skip (remove from staging)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search results */}
          {searchResults[gift.id] && searchResults[gift.id].length > 0 && (
            <div className="ml-4 space-y-1">
              {searchResults[gift.id].map(donor => (
                <div key={donor.id} className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-2 text-sm">
                  <div>
                    <span className="text-white font-medium">{donor.firstName} {donor.lastName}</span>
                    <span className="text-gray-500 ml-2">{donor.email}</span>
                    <span className="text-gray-600 ml-2">({donor.donorId})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs">
                      {donor.totalGiftCount} gifts &middot; ${donor.totalLifetimeGiving.toFixed(0)}
                    </span>
                    <button
                      onClick={() => handleMatch(gift.id, donor)}
                      disabled={acting[gift.id]}
                      className="flex items-center gap-1 px-2 py-1 bg-green-900/40 hover:bg-green-900/60 text-green-400 rounded text-xs"
                    >
                      <Check className="w-3 h-3" /> Match
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchResults[gift.id] && searchResults[gift.id].length === 0 && (
            <p className="ml-4 text-gray-500 text-xs py-1">No donors found matching that search</p>
          )}
        </div>
      ))}
    </div>
  );
}
