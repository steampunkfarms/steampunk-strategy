'use client';

import { useState } from 'react';
import { AlertTriangle, XCircle, Info, CheckCircle2 } from 'lucide-react';

interface AlertRecord {
  id: string;
  dedupKey: string;
  severity: 'critical' | 'warning' | 'info';
  state: 'open' | 'acknowledged' | 'resolved';
  source: string;
  title: string;
  details: Record<string, unknown> | null;
  smsNotifiedAt: string | null;
  emailNotifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'critical') return <XCircle className="w-4 h-4 text-gauge-red" />;
  if (severity === 'warning') return <AlertTriangle className="w-4 h-4 text-gauge-amber" />;
  return <Info className="w-4 h-4 text-gauge-blue" />;
}

export default function AlertFeed({ initialAlerts }: { initialAlerts: AlertRecord[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [acting, setActing] = useState<string | null>(null);

  const handleAction = async (id: string, state: 'acknowledged' | 'resolved') => {
    setActing(id);
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error('Failed to update alert:', err);
    } finally {
      setActing(null);
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="console-card p-4 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-gauge-green" />
        <span className="text-sm text-slate-400">No active alerts</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`console-card p-4 border-l-4 ${
            alert.severity === 'critical'
              ? 'border-l-gauge-red'
              : alert.severity === 'warning'
                ? 'border-l-gauge-amber'
                : 'border-l-gauge-blue'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <SeverityIcon severity={alert.severity} />
              <div className="min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">{alert.title}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                  <span className="font-mono">{alert.source}</span>
                  <span>{timeAgo(alert.createdAt)}</span>
                  {alert.state === 'acknowledged' && (
                    <span className="text-gauge-amber">ack&apos;d</span>
                  )}
                  {alert.smsNotifiedAt && (
                    <span className="text-brass-muted">SMS sent</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {alert.state === 'open' && (
                <button
                  onClick={() => handleAction(alert.id, 'acknowledged')}
                  disabled={acting === alert.id}
                  className="px-2.5 py-1 text-[11px] font-medium text-gauge-amber border border-gauge-amber/30 rounded hover:bg-gauge-amber/10 transition-colors disabled:opacity-50"
                >
                  Ack
                </button>
              )}
              <button
                onClick={() => handleAction(alert.id, 'resolved')}
                disabled={acting === alert.id}
                className="px-2.5 py-1 text-[11px] font-medium text-gauge-green border border-gauge-green/30 rounded hover:bg-gauge-green/10 transition-colors disabled:opacity-50"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
