// postest
'use client';

// Species emoji lookup for compact display
const SPECIES_EMOJI: Record<string, string> = {
  chickens: '🐔', ducks: '🦆', geese: '🪿', goats: '🐐', sheep: '🐑',
  cattle: '🐄', horses: '🐴', donkeys: '🫏', pigs: '🐷', cats: '🐱', dogs: '🐶',
};

const FC_LABELS: Record<string, { label: string; color: string }> = {
  program_services: { label: 'Program Services', color: 'text-gauge-green' },
  management_general: { label: 'Management & General', color: 'text-gauge-amber' },
  fundraising: { label: 'Fundraising', color: 'text-gauge-blue' },
};

interface ProgramData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  species: string[];
  icon: string | null;
  color: string | null;
  functionalClass: string;
  transactionCount: number;
  productMapCount: number;
  totalSpend: number;
  expenseCount: number;
}

export default function ProgramCard({ program }: { program: ProgramData }) {
  const fc = FC_LABELS[program.functionalClass] ?? { label: program.functionalClass, color: 'text-slate-400' };

  return (
    <div className="console-card p-4 hover:border-tardis-glow/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-display font-bold text-slate-100">{program.name}</h3>
          <p className={`text-[10px] uppercase tracking-wider ${fc.color}`}>{fc.label}</p>
        </div>
        {program.species.length > 0 && (
          <div className="flex gap-0.5 text-base" title={program.species.join(', ')}>
            {program.species.map(s => (
              <span key={s}>{SPECIES_EMOJI[s] ?? '🐾'}</span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      {program.description && (
        <p className="text-xs text-brass-muted mb-3 line-clamp-2">{program.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-console-border">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">Transactions</p>
          <p className="text-sm font-mono text-slate-200">{program.transactionCount}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">Product Maps</p>
          <p className="text-sm font-mono text-slate-200">{program.productMapCount}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">Total Spend</p>
          <p className="text-sm font-mono text-slate-200">
            ${program.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  );
}
