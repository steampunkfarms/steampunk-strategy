// postest
// Programs admin page — EIP Phase 1
// see docs/handoffs/_working/20260312-eip-phase1-allocation-enrichment-working-spec.md
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import ProgramCard from './program-card';

export const dynamic = 'force-dynamic';

export default async function ProgramsPage() {
  const programs = await prisma.program.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          transactions: true,
          productMaps: true,
        },
      },
    },
  });

  // Aggregate spend per program
  const spendByProgram = await prisma.transaction.groupBy({
    by: ['programId'],
    where: { programId: { not: null }, type: 'expense' },
    _sum: { amount: true },
    _count: true,
  });

  const spendMap = new Map(
    spendByProgram.map(s => [s.programId!, {
      total: Number(s._sum.amount ?? 0),
      count: s._count,
    }])
  );

  // Total transactions and allocated count
  const totalTx = await prisma.transaction.count();
  const allocatedTx = await prisma.transaction.count({ where: { programId: { not: null } } });
  const totalSpend = spendByProgram.reduce((sum, s) => sum + Number(s._sum.amount ?? 0), 0);

  const programData = programs.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    species: p.species ? JSON.parse(p.species) as string[] : [],
    icon: p.icon,
    color: p.color,
    functionalClass: p.functionalClass,
    transactionCount: p._count.transactions,
    productMapCount: p._count.productMaps,
    totalSpend: spendMap.get(p.id)?.total ?? 0,
    expenseCount: spendMap.get(p.id)?.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-display font-bold text-slate-100">Programs</h1>
        <p className="text-sm text-brass-muted mt-1">
          Donor-facing program buckets for expense allocation and impact attribution
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className="console-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-brass-muted">Active Programs</p>
          <p className="text-2xl font-mono font-bold text-tardis-glow mt-1">{programs.length}</p>
        </div>
        <div className="console-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-brass-muted">Allocated Transactions</p>
          <p className="text-2xl font-mono font-bold text-tardis-glow mt-1">
            {allocatedTx} <span className="text-sm text-brass-muted">/ {totalTx}</span>
          </p>
        </div>
        <div className="console-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-brass-muted">Allocation Rate</p>
          <p className="text-2xl font-mono font-bold text-tardis-glow mt-1">
            {totalTx > 0 ? Math.round((allocatedTx / totalTx) * 100) : 0}%
          </p>
        </div>
        <div className="console-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-brass-muted">Total Program Spend</p>
          <p className="text-2xl font-mono font-bold text-tardis-glow mt-1">
            ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Program cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programData.map(p => (
          <ProgramCard key={p.id} program={p} />
        ))}
      </div>

      {/* Unallocated note */}
      {allocatedTx < totalTx && (
        <div className="console-card p-4 border-l-2 border-brass-warm">
          <p className="text-sm text-brass-warm font-medium">
            {totalTx - allocatedTx} transactions unallocated
          </p>
          <p className="text-xs text-brass-muted mt-1">
            Most unallocated transactions lack a category. Categorize them on the Expenses page
            to enable automatic program allocation via the allocation engine.
          </p>
        </div>
      )}
    </div>
  );
}
