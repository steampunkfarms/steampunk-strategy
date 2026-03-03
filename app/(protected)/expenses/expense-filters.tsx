'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { Filter } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  children: { id: string; name: string }[];
}

interface ExpenseFiltersProps {
  categories: Category[];
  currentStatus: string;
  currentCategory: string;
  currentSearch: string;
}

export default function ExpenseFilters({
  categories,
  currentStatus,
  currentCategory,
  currentSearch,
}: ExpenseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/expenses?${params.toString()}`);
  }, [router, searchParams]);

  const handleSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam('q', value), 300);
  }, [updateParam]);

  return (
    <div className="console-card p-4 flex flex-wrap items-center gap-4">
      <Filter className="w-4 h-4 text-brass-muted" />
      <input
        type="text"
        placeholder="Search transactions..."
        defaultValue={currentSearch}
        onChange={(e) => handleSearch(e.target.value)}
        className="flex-1 min-w-[200px] text-sm"
      />
      <select
        className="text-sm"
        value={currentCategory}
        onChange={(e) => updateParam('category', e.target.value)}
        aria-label="Filter by category"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <optgroup key={cat.id} label={cat.name}>
            <option value={cat.id}>{cat.name} (all)</option>
            {cat.children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <select
        className="text-sm"
        value={currentStatus}
        onChange={(e) => updateParam('status', e.target.value)}
        aria-label="Filter by status"
      >
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="verified">Verified</option>
        <option value="reconciled">Reconciled</option>
        <option value="flagged">Flagged</option>
      </select>
    </div>
  );
}
