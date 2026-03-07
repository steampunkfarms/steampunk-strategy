'use client';

// Intelligence Center tab layout — see CLAUDE.md route structure
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Operational', href: '/intelligence' },
  { name: 'Analytical', href: '/intelligence/analytical' },
  { name: 'Strategic', href: '/intelligence/strategic' },
];

export default function IntelligenceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-brass-warm" />
          <h1 className="text-2xl font-display font-bold text-slate-100">Intelligence Center</h1>
        </div>
        <div className="flex gap-1 border-b border-console-border">
          {tabs.map((tab) => {
            const isActive = tab.href === '/intelligence'
              ? pathname === '/intelligence'
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors -mb-px',
                  isActive
                    ? 'text-brass-warm border-b-2 border-brass-default'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
