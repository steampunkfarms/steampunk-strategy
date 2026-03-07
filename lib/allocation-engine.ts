// Auto-allocation engine for transaction program + functional class assignment
// Waterfall: species map → category default → vendor history → fallback
// see docs/handoffs/_working/20260307-eip-auto-allocation-working-spec.md
import { prisma } from '@/lib/prisma';

export interface AllocationResult {
  programId: string | null;
  programName: string | null;
  functionalClass: 'program_services' | 'management_general' | 'fundraising';
  confidence: 'high' | 'medium' | 'low';
  method: 'species_map' | 'category_default' | 'vendor_history' | 'manual';
  species: string[];
  notes: string[];
  allocableComponents: {
    goods: number;
    tax: number;
    shipping: number;
    discount: number;
  };
}

interface LineItem {
  description: string;
  total: number;
}

interface AllocateParams {
  vendorId: string | null;
  categoryId: string | null;
  lineItems: LineItem[];
  extractedReceipt: {
    tax?: number | null;
    shipping?: number | null;
    discount?: number | null;
    subtotal?: number | null;
    total: number;
  };
}

type FunctionalClass = 'program_services' | 'management_general' | 'fundraising';

function isFunctionalClass(v: string | null | undefined): v is FunctionalClass {
  return v === 'program_services' || v === 'management_general' || v === 'fundraising';
}

export async function allocateTransaction(params: AllocateParams): Promise<AllocationResult> {
  const { vendorId, categoryId, lineItems, extractedReceipt } = params;
  const notes: string[] = [];

  // Build allocable components
  const tax = extractedReceipt.tax ?? 0;
  const shipping = extractedReceipt.shipping ?? 0;
  const discount = extractedReceipt.discount ?? 0;
  const goods = extractedReceipt.subtotal
    ?? (extractedReceipt.total - tax - shipping + discount);

  const allocableComponents = { goods, tax, shipping, discount };

  // --- Step 1: Species Map Match ---
  if (lineItems.length > 0) {
    const programTotals = new Map<string, { total: number; name: string; species: string[] }>();

    for (const item of lineItems) {
      if (!item.description) continue;

      const matches = await prisma.productSpeciesMap.findMany({
        where: {
          productPattern: { contains: item.description.trim(), mode: 'insensitive' },
        },
        include: {
          program: { select: { id: true, name: true } },
        },
        orderBy: { useCount: 'desc' },
        take: 1,
      });

      if (matches.length > 0 && matches[0].programId) {
        const match = matches[0];
        const existing = programTotals.get(match.programId) ?? {
          total: 0,
          name: match.program?.name ?? 'Unknown',
          species: [],
        };
        existing.total += item.total;
        const matchSpecies: string[] = JSON.parse(match.species);
        existing.species = [...new Set([...existing.species, ...matchSpecies])];
        programTotals.set(match.programId, existing);
      }
    }

    if (programTotals.size === 1) {
      const [programId, data] = [...programTotals.entries()][0];
      return {
        programId,
        programName: data.name,
        functionalClass: 'program_services',
        confidence: 'high',
        method: 'species_map',
        species: data.species,
        notes,
        allocableComponents,
      };
    }

    if (programTotals.size > 1) {
      // Assign to program with highest $ amount
      let maxId = '';
      let maxTotal = 0;
      let maxName = '';
      let allSpecies: string[] = [];

      for (const [id, data] of programTotals.entries()) {
        allSpecies = [...new Set([...allSpecies, ...data.species])];
        if (data.total > maxTotal) {
          maxId = id;
          maxTotal = data.total;
          maxName = data.name;
        }
      }

      const programNames = [...programTotals.values()].map(p => p.name).join(', ');
      notes.push(`Mixed-program allocation: ${programNames}. Assigned to ${maxName} (highest $ amount).`);

      return {
        programId: maxId,
        programName: maxName,
        functionalClass: 'program_services',
        confidence: 'medium',
        method: 'species_map',
        species: allSpecies,
        notes,
        allocableComponents,
      };
    }
  }

  // --- Step 2: Category Default ---
  if (categoryId) {
    const category = await prisma.expenseCategory.findUnique({
      where: { id: categoryId },
      select: { functionalClass: true, name: true },
    });

    if (category?.functionalClass && isFunctionalClass(category.functionalClass)) {
      return {
        programId: null,
        programName: null,
        functionalClass: category.functionalClass,
        confidence: 'medium',
        method: 'category_default',
        species: [],
        notes: [`Functional class from category "${category.name}" default.`],
        allocableComponents,
      };
    }
  }

  // --- Step 3: Vendor History ---
  if (vendorId) {
    const recentTxs = await prisma.transaction.findMany({
      where: { vendorId, programId: { not: null } },
      select: { programId: true },
      orderBy: { date: 'desc' },
      take: 5,
    });

    if (recentTxs.length >= 3) {
      const counts = new Map<string, number>();
      for (const tx of recentTxs) {
        if (tx.programId) {
          counts.set(tx.programId, (counts.get(tx.programId) ?? 0) + 1);
        }
      }

      for (const [pid, count] of counts.entries()) {
        if (count / recentTxs.length >= 0.8) {
          const program = await prisma.program.findUnique({
            where: { id: pid },
            select: { name: true },
          });

          return {
            programId: pid,
            programName: program?.name ?? null,
            functionalClass: 'program_services',
            confidence: 'low',
            method: 'vendor_history',
            species: [],
            notes: [`Suggested from vendor history (${count}/${recentTxs.length} recent transactions).`],
            allocableComponents,
          };
        }
      }
    }
  }

  // --- Step 4: Fallback ---
  return {
    programId: null,
    programName: null,
    functionalClass: 'program_services',
    confidence: 'low',
    method: 'manual',
    species: [],
    notes: ['No automatic allocation possible. Manual assignment required.'],
    allocableComponents,
  };
}
