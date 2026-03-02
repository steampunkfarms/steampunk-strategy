/**
 * sync-gofundme-to-studiolo.ts
 *
 * Scans the "Direct Donors/GoFundMe Donors" Gmail label, parses donation
 * notifications from email subjects, and stages them in TARDIS's GiftStaging
 * table for review before pushing to Studiolo.
 *
 * Usage:
 *   npx tsx scripts/sync-gofundme-to-studiolo.ts [--dry-run]
 *
 * Env (from .env.local):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 *   DATABASE_URL (TARDIS Neon)
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Gmail Setup ──────────────────────────────────────────────────────────────

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// ── Config ───────────────────────────────────────────────────────────────────

const LABEL_NAME = 'Direct Donors/GoFundMe Donors';
const DRY_RUN = process.argv.includes('--dry-run');

// ── Campaign Tracking ────────────────────────────────────────────────────────

const KNOWN_CAMPAIGNS = [
  'SOS - Save Our Sanctuary!',
  'Help Repair and Improve the Sanctuary',
  'Fill the Hay Shed (& Lots of Happy Bellies, Too!)',
  '#GiveBigForBarry',
  '12 Months of Food, Hay, and Feed',
  'Please support Steampunk Farms Rescue Barn 501c3',
  'September Hay and Winter Straw Bill',
];

// ── Parsers ──────────────────────────────────────────────────────────────────

function parseDonationSubject(subject: string): { name: string; amount: number } | null {
  const match1 = subject.match(/^(.+?)\s+donated\s+\$?([\d,.]+)\s*\$?$/i);
  if (match1) {
    const name = match1[1].trim();
    const amount = parseFloat(match1[2].replace(/,/g, ''));
    if (name && amount > 0) return { name, amount };
  }

  const match2 = subject.match(/^(.+?)\s+donated\s+([\d,.]+)\s*\$$/i);
  if (match2) {
    const name = match2[1].trim();
    const amount = parseFloat(match2[2].replace(/,/g, ''));
    if (name && amount > 0) return { name, amount };
  }

  return null;
}

function extractCampaign(subject: string, snippet: string): string | null {
  const highlightsMatch = subject.match(/daily highlights for (.+)$/i);
  if (highlightsMatch) return highlightsMatch[1].trim();

  for (const campaign of KNOWN_CAMPAIGNS) {
    if (snippet.includes(campaign)) return campaign;
  }

  return null;
}

function buildExternalId(date: string, name: string, amount: number): string {
  const dateStr = new Date(date).toISOString().slice(0, 10);
  const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  return `gfm-email-${dateStr}-${safeName}-${amount}`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🔍 Scanning Gmail label: ${LABEL_NAME}`);
  if (DRY_RUN) console.log('⚠️  DRY RUN — will not write to database\n');

  // 1. Find the label
  const labelsRes = await gmail.users.labels.list({ userId: 'me' });
  const label = labelsRes.data.labels?.find(l => l.name === LABEL_NAME);
  if (!label?.id) {
    console.error(`❌ Label "${LABEL_NAME}" not found`);
    process.exit(1);
  }

  // 2. Fetch all messages
  const allMessages: { id: string }[] = [];
  let pageToken: string | undefined;

  do {
    const res = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [label.id],
      maxResults: 100,
      pageToken,
    });
    for (const m of res.data.messages || []) {
      if (m.id) allMessages.push({ id: m.id });
    }
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);

  console.log(`📧 Found ${allMessages.length} messages in label\n`);

  // 3. Parse each message
  interface ParsedGift {
    name: string;
    amount: number;
    date: string;
    campaign: string;
    externalId: string;
    rawSubject: string;
    rawSnippet: string;
  }

  const gifts: ParsedGift[] = [];
  let skippedMarketing = 0;
  let skippedHighlights = 0;

  const messageDetails: { date: string; subject: string; snippet: string }[] = [];

  for (const msg of allMessages) {
    try {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });

      const headers = detail.data.payload?.headers || [];
      const getHeader = (name: string) => headers.find(h => h.name === name)?.value || '';

      messageDetails.push({
        date: getHeader('Date'),
        subject: getHeader('Subject'),
        snippet: detail.data.snippet || '',
      });
    } catch {
      // skip unreadable
    }
  }

  // Sort chronologically (oldest first)
  messageDetails.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let currentCampaign = 'GoFundMe';

  for (const msg of messageDetails) {
    const { date, subject, snippet } = msg;

    const campaignFromMsg = extractCampaign(subject, snippet);
    if (campaignFromMsg) {
      currentCampaign = campaignFromMsg;
    }

    const donation = parseDonationSubject(subject);
    if (donation) {
      gifts.push({
        name: donation.name,
        amount: donation.amount,
        date: new Date(date).toISOString(),
        campaign: currentCampaign,
        externalId: buildExternalId(date, donation.name, donation.amount),
        rawSubject: subject,
        rawSnippet: snippet.slice(0, 300),
      });
      continue;
    }

    if (subject.includes('daily highlights') || subject.includes('Daily highlights')) {
      skippedHighlights++;
      continue;
    }

    skippedMarketing++;
  }

  console.log(`✅ Parsed ${gifts.length} individual donations`);
  console.log(`⏭️  Skipped ${skippedHighlights} daily highlights (aggregate, not individual)`);
  console.log(`⏭️  Skipped ${skippedMarketing} marketing/system emails\n`);

  // 4. Show parsed data
  const byCampaign: Record<string, { count: number; total: number }> = {};
  for (const g of gifts) {
    if (!byCampaign[g.campaign]) byCampaign[g.campaign] = { count: 0, total: 0 };
    byCampaign[g.campaign].count++;
    byCampaign[g.campaign].total += g.amount;
  }

  console.log('📊 Donations by campaign:');
  for (const [campaign, stats] of Object.entries(byCampaign)) {
    console.log(`  ${campaign}: ${stats.count} gifts, $${stats.total.toFixed(2)}`);
  }

  const totalAmount = gifts.reduce((sum, g) => sum + g.amount, 0);
  console.log(`\n💰 Total: ${gifts.length} gifts, $${totalAmount.toFixed(2)}\n`);

  if (DRY_RUN) {
    console.log('🏁 Dry run complete. Run without --dry-run to stage in TARDIS database.');
    return;
  }

  // 5. Stage in TARDIS database
  console.log('📥 Staging gifts in TARDIS GiftStaging table...');

  let inserted = 0;
  let duplicates = 0;

  for (const gift of gifts) {
    try {
      await prisma.giftStaging.create({
        data: {
          source: 'gofundme-email',
          displayName: gift.name,
          amount: gift.amount,
          giftDate: new Date(gift.date),
          campaign: gift.campaign,
          externalId: gift.externalId,
          rawSubject: gift.rawSubject,
          rawSnippet: gift.rawSnippet,
          status: 'pending',
        },
      });
      inserted++;
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Unique constraint violation — already staged
        duplicates++;
      } else {
        throw e;
      }
    }
  }

  console.log(`\n✅ Staged: ${inserted} new gifts`);
  console.log(`⏭️  Already staged: ${duplicates} duplicates`);
  console.log(`\n🔗 Review at: https://tardis.steampunkstudiolo.org/gift-staging`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
