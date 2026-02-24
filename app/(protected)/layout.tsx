'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Shield,
  Building2,
  Activity,
  Eye,
  CreditCard,
  LogOut,
  ChevronRight,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  {
    label: 'Command',
    items: [
      { name: 'The Bridge', href: '/bridge', icon: LayoutDashboard },
      { name: 'Monitoring', href: '/monitoring', icon: Activity },
    ],
  },
  {
    label: 'Finances',
    items: [
      { name: 'Expenses', href: '/expenses', icon: Receipt },
      { name: 'Documents', href: '/documents', icon: FileText },
      { name: 'Vendors', href: '/vendors', icon: Building2 },
    ],
  },
  {
    label: 'Revenue',
    items: [
      { name: 'Retail Charity', href: '/retail-charity', icon: CreditCard },
    ],
  },
  {
    label: 'Governance',
    items: [
      { name: 'Compliance', href: '/compliance', icon: Shield },
      { name: 'Transparency', href: '/transparency', icon: Eye },
    ],
  },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-tardis-dark border-r border-console-border flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="p-5 border-b border-console-border">
          <Link href="/bridge" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-tardis to-tardis-light flex items-center justify-center shadow-md shadow-tardis/20">
              <Gauge className="w-5 h-5 text-tardis-glow" />
            </div>
            <div>
              <p className="text-sm font-display font-bold text-slate-100">The Bridge</p>
              <p className="text-[10px] text-brass-muted uppercase tracking-widest">Strategy Command</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navigation.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-brass-muted">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                          isActive
                            ? 'bg-tardis/40 text-tardis-glow border border-tardis-glow/20 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-console-hover'
                        )}
                      >
                        <item.icon className={cn('w-4 h-4', isActive ? 'text-tardis-glow' : 'text-slate-500')} />
                        {item.name}
                        {isActive && <ChevronRight className="w-3 h-3 ml-auto text-tardis-glow/50" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User / Sign out */}
        <div className="p-4 border-t border-console-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-console flex items-center justify-center border border-console-border">
              <span className="text-xs font-medium text-brass-gold">
                {session?.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200 truncate">{session?.user?.name || 'Loading...'}</p>
              <p className="text-[10px] text-slate-500 truncate">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-1.5 text-slate-500 hover:text-gauge-red transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
