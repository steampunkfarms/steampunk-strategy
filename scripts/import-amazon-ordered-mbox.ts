#!/usr/bin/env npx tsx
// Amazon-Ordered MBOX Import — 2025 & 2026 orders only
// Usage: npx tsx scripts/import-amazon-ordered-mbox.ts --preview
//        npx tsx scripts/import-amazon-ordered-mbox.ts --import
// postest

import { readFileSync } from 'fs';
import { simpleParser, type ParsedMail } from 'mailparser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Subject classification ───────────────────────────────────────────────────

function isOrderConfirmation(subject: string): boolean {
  const s = subject.toLowerCase();
  if (s.includes('has shipped') || s.includes('shipped!')) return false;
  if (s.includes('now arriving') || s.includes('delivery attempt') || s.includes('arriving today')) return false;
  if (s.includes('will you rate') || s.includes('did \'') || s.includes('feedback')) return false;
  if (s.includes('account registration') || s.includes('verify your') || s.includes('welcome to your first')) return false;
  if (s.includes('join amazon') || s.includes('amazonsmile') || s.includes('amazon business needs')) return false;
  if (s.includes('revision to your amazon')) return false;
  return s.includes('ordered:') || s.includes('your amazon.com order');
}

function getYear(dateStr: string): number | null {
  const m = dateStr.match(/20(\d{2})/);
  return m ? parseInt('20' + m[1]) : null;
}

// ─── Category + personal flag detection ──────────────────────────────────────

type CategoryResult = {
  categorySlug: string;
  flag: string | null;
  likelyPersonal: boolean;
};

function detectCategory(subject: string, bodyText: string): CategoryResult {
  const text = (subject + ' ' + bodyText.slice(0, 3000)).toLowerCase();

  // ── Likely personal — always flag ──
  const personalKeywords = [
    'esomeprazole', 'omeprazole', 'caffeine pills', 'nutricost', 'gas relief',
    'sauna', "men's ring", 'king will', 'denim iron', 'jean patch',
    'cold brew coffee', 'kirkland signature cold', 'wood lock oil', 'wong to yick',
    'chimes ginger', 'ginger chew', 'mio vitamins', 'mio hydrate', 'mio orange',
    'edible pearl', 'orange sprinkle', 'sprinkles for cake', 'cake decorat',
    'photo album', 'vibes earbuds', 'wired earbuds', 'ipad mini case', 'ipad air case',
    'infrared sauna', 'itherau', 'timecity case', 'moko case',
    'swollen of knee', 'joints supplement', 'blender replacement',
    'ovente countertop', 'happy belly', 'louAna', 'ventura foods',
    'looper tool bead', 'beadsmith',
  ];
  if (personalKeywords.some(k => text.includes(k))) {
    return { categorySlug: 'admin-supplies', flag: 'Likely personal purchase — verify before approving', likelyPersonal: true };
  }

  // ── Soap materials ──
  if (
    text.includes('essential depot') || text.includes('sodium hydroxide') || text.includes(' lye') ||
    text.includes('shea butter') || text.includes('smellgood') || text.includes('cocoa butter') ||
    text.includes('castor oil') || text.includes('fragrance oil') || text.includes('essential oil') ||
    text.includes('methylene blue') || text.includes('earth harmony') ||
    text.includes('transfer pipette') || text.includes('plastic transfer') || text.includes('3ml plastic') ||
    text.includes('pressed flower') || text.includes('dried pressed') ||
    text.includes('waxed cord') || text.includes('polyester waxed') ||
    text.includes('soap') || text.includes('nitrile') || text.includes('sofplate') ||
    text.includes('food grade') && (text.includes('hydrogen peroxide') || text.includes('vinegar') || text.includes('citric')) ||
    text.includes('royal palillos') || text.includes('uv treated') && text.includes('stick') ||
    text.includes('nudge 10%')
  ) {
    return { categorySlug: 'soap-materials', flag: null, likelyPersonal: false };
  }

  // ── Soap labels / packaging ──
  if (
    text.includes('tsukineko') || text.includes('versafine') || text.includes('ink pad') ||
    text.includes('smudge ink') || text.includes('craftymanor') ||
    text.includes('wrinkle-free glue') || text.includes('scotch glue') ||
    text.includes('wax seal') || text.includes('stamp pad') ||
    text.includes('nicpro') || text.includes('mechanical pencil') ||
    text.includes('1.3 mm') || text.includes('fpgfiivo')  // drawing/art supplies for label design
  ) {
    return { categorySlug: 'soap-labels', flag: 'Verify: label/stamp supplies for Cleanpunk', likelyPersonal: false };
  }

  // ── Soap shipping ──
  if (
    text.includes('corrugated box') || text.includes('shipping box') || text.includes('boxery') ||
    text.includes('secure seal') || text.includes('poly mailer') || text.includes('bubble mailer') ||
    text.includes('bubblefast') || text.includes('packing tape') || text.includes('jarlink') ||
    text.includes('kraft paper') || text.includes('shipping label') || text.includes('forc shipping')
  ) {
    return { categorySlug: 'soap-shipping', flag: null, likelyPersonal: false };
  }

  // ── Animal care ──
  if (
    text.includes('fox light') || text.includes('night predator') ||
    text.includes('country vet') || text.includes('farmgard') ||
    text.includes('advantus dog') || text.includes('flea') || text.includes('tick') ||
    text.includes('dynarex') || text.includes('mckesson') || text.includes('cotton ball') ||
    text.includes('insect trap') || text.includes('predator deterrent') ||
    text.includes('shade cloth') || text.includes('black shade') || text.includes('winemana') ||
    text.includes('barkless') || text.includes('educator bp') || text.includes('bark collar') ||
    text.includes('baby gate') || text.includes('pet gate') || text.includes('puppy gate') ||
    text.includes('amibud') || text.includes('theyfirst') || text.includes('fairy baby') ||
    text.includes('chicken') || text.includes('poultry') || text.includes('rabbit') ||
    text.includes('pig') || text.includes('goat') || text.includes('livestock') ||
    text.includes('air filter') && (text.includes('mower') || text.includes('593260')) ||
    text.includes('air purifier filter') ||
    text.includes('hydrogen peroxide') && !text.includes('food grade') ||
    text.includes('chromex hydrogen')
  ) {
    return { categorySlug: 'animal-care', flag: null, likelyPersonal: false };
  }

  // ── Farm tools / infrastructure ──
  if (
    text.includes('planer') || text.includes('powertec') ||
    text.includes('sanding disc') || text.includes('single edge razor') || text.includes('rexbeti') ||
    text.includes('weed puller') || text.includes('ultac') ||
    text.includes('garden hose') || text.includes('giraffe tools') || text.includes('flexon') ||
    text.includes('air hose') || text.includes('yotoo') ||
    text.includes('air compressor') || text.includes('tooluxe') ||
    text.includes('undermount') || text.includes('vevor') ||
    text.includes('soft close') || text.includes('yenuo') ||
    text.includes('rutland') || text.includes('dry mix') ||
    text.includes('garden rake') || text.includes('poly scoop') || text.includes('ames 268') ||
    text.includes('smart switch') || text.includes('duplex wall') || text.includes('topeler') ||
    text.includes('treatlife') || text.includes('triumilynn') ||
    text.includes('led light') || text.includes('ensenior') ||
    text.includes('infrared thermometer') || text.includes('klein tools') ||
    text.includes('clorox pool') || text.includes('pool & spa') || text.includes('pool&spa') ||
    text.includes('window privacy') || text.includes('countewol') ||
    text.includes('anti fatigue mat') || text.includes('kitchen mat') ||
    text.includes('pool shock') || text.includes('amibbon') || text.includes('spa filter') ||
    text.includes('yotoo') || text.includes('air hose')
  ) {
    return { categorySlug: 'admin-supplies', flag: 'Farm infrastructure/tools — verify category', likelyPersonal: false };
  }

  // ── Admin tech / business supplies ──
  if (
    text.includes('webcam') || text.includes('emeet') || text.includes('piko') ||
    text.includes('canon imageclass') || text.includes('printer') ||
    text.includes('microphone') || text.includes('recording mic') ||
    text.includes('video camera') || text.includes('ordro') ||
    text.includes('ssd') || text.includes('m.2') || text.includes('ssk aluminum') ||
    text.includes('ugreen') || text.includes('10 gbps') ||
    text.includes('infrared sauna') && !text.includes('itherau') ||
    text.includes('notebook') || text.includes('kraft notebook') || text.includes('eusoar') ||
    text.includes('office supplies') || text.includes('scissors') ||
    text.includes('charger cable') || text.includes('short power') ||
    text.includes('audio cable') || text.includes('dukabel') ||
    text.includes('carbide cutter') || text.includes('gerber gear') ||
    text.includes('picatinny') || text.includes('bengor') ||
    text.includes('power strip') || text.includes('extension cord')
  ) {
    return { categorySlug: 'admin-supplies', flag: 'Verify: business tech/admin — confirm business use', likelyPersonal: false };
  }

  // ── Cleaning supplies (vinegar, CLR, etc.) ──
  if (
    text.includes('clr pro') || text.includes('calcium, lime') ||
    text.includes('vinegar') || text.includes('urnuos') || text.includes('toilet') ||
    text.includes('cleaning') || text.includes('ziploc') || text.includes('storage container') ||
    text.includes('food storage')
  ) {
    return { categorySlug: 'admin-supplies', flag: 'Cleaning/storage supplies — verify farm vs personal', likelyPersonal: false };
  }

  // ── Default: flag for review ──
  return {
    categorySlug: 'admin-supplies',
    flag: 'Category unverified — review against Amazon order history',
    likelyPersonal: false,
  };
}

// ─── Amount extraction (new 2025 "Ordered:" email format) ────────────────────

type AmountResult = {
  amount: number;
  uncertain: boolean;
};

function extractAmount(bodyText: string): AmountResult {
  // Grand Total pattern: "Grand Total:\n28.0 USD" or "Grand Total: $28.00"
  const grandTotalMatch = bodyText.match(/Grand Total:\s*\r?\n?\s*\$?([\d,]+\.?\d{0,2})\s*USD/i)
    ?? bodyText.match(/Order Total:\s*\$?([\d,]+\.?\d{0,2})/i);

  const grandTotal = grandTotalMatch ? parseFloat(grandTotalMatch[1].replace(/,/g, '')) : 0;

  if (grandTotal > 0) {
    return { amount: grandTotal, uncertain: false };
  }

  // Fall back: sum all "XX.XX USD" item price lines
  const usdMatches = [...bodyText.matchAll(/([\d]+\.[\d]{2})\s*USD/g)];
  const prices = usdMatches
    .map(m => parseFloat(m[1]))
    .filter(p => p > 0 && p < 10000);

  if (prices.length > 0) {
    // Use the last price if only one item (often equals total including tax)
    // For multi-item, sum all (pre-tax estimate)
    const total = prices.length === 1 ? prices[0] : prices.reduce((a, b) => a + b, 0);
    return { amount: parseFloat(total.toFixed(2)), uncertain: true };
  }

  return { amount: 0, uncertain: true };
}

// ─── Extract order number from new format ────────────────────────────────────

function extractOrderNum(bodyText: string): string | null {
  // New format: "Order #\n113-XXXXXXX-XXXXXXX"
  const splitMatch = bodyText.match(/Order #\s*\r?\n\s*(\d{3}-\d{7}-\d{7})/);
  if (splitMatch) return splitMatch[1];
  // Old format: inline "Order #113-..."
  const inlineMatch = bodyText.match(/Order #(\d{3}-\d{7}-\d{7})/);
  return inlineMatch ? inlineMatch[1] : null;
}

// ─── Split MBOX ──────────────────────────────────────────────────────────────

function splitMbox(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  const emails: string[] = [];
  const lines = content.split('\n');
  let current = '';

  for (const line of lines) {
    if (line.startsWith('From ') && current.trim()) {
      emails.push(current);
      current = '';
    }
    current += line + '\n';
  }
  if (current.trim()) emails.push(current);
  return emails;
}

// ─── Dedup ───────────────────────────────────────────────────────────────────

async function isDuplicate(sourceId: string): Promise<boolean> {
  const existing = await prisma.transaction.findFirst({ where: { sourceId } });
  return !!existing;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const preview = args.includes('--preview');
  const importMode = args.includes('--import');

  if (!preview && !importMode) {
    console.error('Usage: npx tsx scripts/import-amazon-ordered-mbox.ts --preview|--import');
    process.exit(1);
  }

  const filePath = '/Users/ericktronboll/Projects/Takeout 2/Mail/Amazon-Ordered.mbox';
  console.log(`\nAmazon-Ordered MBOX Import (2025–2026 only) — ${preview ? 'PREVIEW' : 'IMPORT'}`);
  console.log(`File: ${filePath}\n`);

  const rawEmails = splitMbox(filePath);
  console.log(`Found ${rawEmails.length} raw emails\n`);

  const vendor = importMode
    ? await prisma.vendor.upsert({ where: { slug: 'amazon' }, update: {}, create: { slug: 'amazon', name: 'Amazon', type: 'supplies' } })
    : { id: 'preview' };

  let processed = 0;
  let skippedYear = 0;
  let skippedNoise = 0;
  let created = 0;
  let wouldCreate = 0;
  let duplicates = 0;
  let errors = 0;
  const personalFlagged: string[] = [];

  for (const rawEmail of rawEmails) {
    try {
      const parsed: ParsedMail = await simpleParser(rawEmail);
      const subject = parsed.subject ?? '';
      const date = parsed.date ?? new Date();
      const bodyText = parsed.text ?? '';

      // Year filter
      const year = date.getFullYear();
      if (year < 2025 || year > 2026) {
        skippedYear++;
        continue;
      }

      // Subject filter
      if (!isOrderConfirmation(subject)) {
        skippedNoise++;
        continue;
      }

      processed++;

      const orderNum = extractOrderNum(bodyText);
      const sourceId = orderNum ? `amazon-ordered-${orderNum}` : `amazon-ordered-${date.getTime()}-${processed}`;

      const { amount, uncertain } = extractAmount(bodyText);
      const { categorySlug, flag, likelyPersonal } = detectCategory(subject, bodyText);

      const resolvedCategory = importMode
        ? await prisma.expenseCategory.findUnique({ where: { slug: categorySlug } })
        : { id: 'preview', slug: categorySlug };

      const flags: string[] = [];
      if (flag) flags.push(flag);
      if (uncertain) flags.push('Amount estimated from item prices — verify in Amazon order history');
      if (!resolvedCategory) flags.push(`Category "${categorySlug}" not found — needs manual assignment`);
      if (!orderNum) flags.push('Order number not extracted — verify sourceId uniqueness');

      const description = `Amazon — ${subject.slice(0, 80)}`;

      if (preview) {
        const tag = likelyPersonal ? ' [PERSONAL?]' : '';
        console.log(`  WOULD CREATE${tag}: $${amount.toFixed(2)} | ${date.toISOString().slice(0, 10)} | ${categorySlug}${uncertain ? ' (est)' : ''} | ${subject.slice(0, 60)}`);
        if (likelyPersonal) personalFlagged.push(subject.slice(0, 70));
        wouldCreate++;
        continue;
      }

      // Dedup
      const dup = await isDuplicate(sourceId);
      if (dup) {
        duplicates++;
        continue;
      }

      const tx = await prisma.transaction.create({
        data: {
          date,
          amount,
          type: 'expense',
          description,
          vendorId: vendor.id,
          categoryId: resolvedCategory?.id ?? null,
          source: 'mbox_import',
          sourceId,
          fiscalYear: year,
          status: 'flagged',
          flagReason: flags.join('; '),
          taxDeductible: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: 'create',
          entity: 'transaction',
          entityId: tx.id,
          details: JSON.stringify({
            source: 'amazon_ordered_mbox_import',
            orderNum,
            subject: subject.slice(0, 200),
            categorySlug,
            likelyPersonal,
            flags,
          }),
        },
      });

      if (likelyPersonal) personalFlagged.push(subject.slice(0, 70));
      created++;
      const tag = likelyPersonal ? ' [PERSONAL?]' : '';
      console.log(`  CREATED${tag}: ${tx.id.slice(0, 8)} — $${amount.toFixed(2)} | ${categorySlug} | ${subject.slice(0, 55)}`);
    } catch (err) {
      errors++;
      console.error(`  ERROR: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Raw emails:     ${rawEmails.length}`);
  console.log(`Skipped (year): ${skippedYear}`);
  console.log(`Skipped (noise): ${skippedNoise}`);
  console.log(`Processed:      ${processed}`);
  if (preview) {
    console.log(`Would create:   ${wouldCreate}`);
  } else {
    console.log(`Created:        ${created}`);
    console.log(`Duplicates:     ${duplicates}`);
    console.log(`Errors:         ${errors}`);
  }
  if (personalFlagged.length > 0) {
    console.log(`\n--- Likely personal (flagged for review) ---`);
    for (const s of personalFlagged) console.log(`  [PERSONAL?] ${s}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
