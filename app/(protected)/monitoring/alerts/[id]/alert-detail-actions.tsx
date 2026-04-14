'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// postest

export default function AlertDetailActions({
  alertId,
  currentState,
}: {
  alertId: string;
  currentState: 'open' | 'acknowledged';
}) {
  const router = useRouter();
  const [acting, setActing] = useState(false);

  const handleAction = async (state: 'acknowledged' | 'resolved') => {
    setActing(true);
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to update alert:', err);
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {currentState === 'open' && (
        <button
          onClick={() => handleAction('acknowledged')}
          disabled={acting}
          className="px-4 py-2 text-sm font-medium text-gauge-amber border border-gauge-amber/30 rounded-lg hover:bg-gauge-amber/10 transition-colors disabled:opacity-50"
        >
          Acknowledge
        </button>
      )}
      <button
        onClick={() => handleAction('resolved')}
        disabled={acting}
        className="px-4 py-2 text-sm font-medium text-gauge-green border border-gauge-green/30 rounded-lg hover:bg-gauge-green/10 transition-colors disabled:opacity-50"
      >
        Resolve
      </button>
    </div>
  );
}
