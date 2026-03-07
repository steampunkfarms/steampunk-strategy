'use client';

// Fiscal year dropdown selector — reloads page with ?fiscalYear= param
import { useRouter, usePathname } from 'next/navigation';
import { Calendar } from 'lucide-react';

export function FiscalYearSelector({ years, selected }: { years: number[]; selected: number }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-slate-500" />
      <select
        value={selected}
        onChange={(e) => {
          const fy = e.target.value;
          router.push(`${pathname}?fiscalYear=${fy}`);
        }}
        className="bg-console border border-console-border rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-brass-default"
      >
        {years.map(y => (
          <option key={y} value={y}>FY {y}</option>
        ))}
      </select>
    </div>
  );
}
