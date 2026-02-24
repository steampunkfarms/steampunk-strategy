'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle2, PartyPopper, Loader2, RefreshCcw } from 'lucide-react';

interface ReminderData {
  success: boolean;
  daysSinceImport: number | null;
  alerts: string[];
  actions: string[];
  participants: {
    active: number;
    dormant: number;
    newThisWeek: number;
  };
}

export function RaiserightReminders() {
  const [data, setData] = useState<ReminderData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cron/raiseright-reminders');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Silent fail — reminders are non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  if (loading) {
    return (
      <div className="p-5 flex items-center justify-center text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-xs">Checking alerts...</span>
      </div>
    );
  }

  if (!data || (data.alerts.length === 0 && data.actions.length === 0)) {
    return (
      <div className="p-5 text-center">
        <CheckCircle2 className="w-8 h-8 text-gauge-green/50 mx-auto mb-2" />
        <p className="text-sm text-slate-400">All clear — no alerts this week.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-console-border">
      {data.actions.map((action, i) => (
        <div key={`a-${i}`} className="px-5 py-3 flex items-start gap-3">
          <PartyPopper className="w-4 h-4 text-brass-gold flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-300">{action}</p>
        </div>
      ))}
      {data.alerts.map((alert, i) => (
        <div key={`r-${i}`} className="px-5 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-gauge-amber flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-300">{alert}</p>
        </div>
      ))}
      <div className="px-5 py-2 flex justify-end">
        <button
          onClick={fetchReminders}
          className="text-[10px] text-tardis-glow/60 hover:text-tardis-glow flex items-center gap-1 transition-colors"
        >
          <RefreshCcw className="w-2.5 h-2.5" /> Refresh
        </button>
      </div>
    </div>
  );
}
