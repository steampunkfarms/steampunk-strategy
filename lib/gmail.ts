import { google } from 'googleapis';
import { prisma } from './prisma';

// --- Gmail API Client ---

export function getGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// --- Vendor Matching ---

const VENDOR_MAP: Record<string, string> = {
  'elstonhayandgrain': 'elstons',
  'elston': 'elstons',
  'starmilling': 'star-milling',
  'star milling': 'star-milling',
  'amazon': 'amazon',
  'chewy': 'chewy',
  'tractorsupply': 'tractor-supply',
  'tractor supply': 'tractor-supply',
  'zeffy': 'zeffy',
  'stripe': 'stripe',
  'paypal': 'paypal',
  'patreon': 'patreon',
  'ironwoodpigs': 'ironwood-pigs',
  'ironwood': 'ironwood-pigs',
  'raiseright': 'raiseright',
  'shopwithscrip': 'raiseright',
  'glscrip': 'raiseright',
};

export function matchVendorSlug(senderEmail: string, senderName: string, subject: string): string | null {
  const combined = `${senderEmail} ${senderName} ${subject}`.toLowerCase();
  for (const [keyword, slug] of Object.entries(VENDOR_MAP)) {
    if (combined.includes(keyword)) return slug;
  }
  return null;
}

// --- Email Type Classification ---

export function classifyEmail(subject: string, senderEmail: string): 'invoice' | 'receipt' | 'payment_confirmation' | 'shipping' | 'statement' | 'unknown' {
  const s = subject.toLowerCase();
  const from = senderEmail.toLowerCase();

  if (from.includes('zeffy') || from.includes('stripe') || from.includes('paypal') || from.includes('patreon')) {
    return 'payment_confirmation';
  }
  if (s.includes('invoice') || s.includes('bill')) return 'invoice';
  if (s.includes('receipt') || s.includes('order confirmation') || s.includes('order #')) return 'receipt';
  if (s.includes('shipped') || s.includes('delivered') || s.includes('tracking')) return 'shipping';
  if (s.includes('statement') || s.includes('alert')) return 'statement';
  return 'unknown';
}

// --- Amount Extraction ---

export function extractAmount(text: string): number | null {
  // Look for dollar amounts in the text
  const patterns = [
    /(?:total|amount|charge|payment|order total|grand total)[:\s]*\$?([\d,]+\.?\d{0,2})/i,
    /\$\s?([\d,]+\.\d{2})/,
    /USD\s?([\d,]+\.\d{2})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (amount > 0 && amount < 100000) return amount;
    }
  }
  return null;
}

// --- Amazon Personal vs Farm Classification ---
// Card 9785 = Frederick's personal card. Card 9932 = farm bank account.
// Gift card (with or without either card for remainder) = farm.
// Only skip: card 9785 alone with NO gift card balance.

export function isAmazonPersonal(bodyText: string): boolean {
  const text = bodyText.toLowerCase();
  const hasGiftCard = text.includes('gift card') || text.includes('gift card balance');
  const hasCard9932 = text.includes('9932');
  const hasCard9785 = text.includes('9785');

  // Gift card present = farm (RaiseRight or farm-purchased)
  if (hasGiftCard) return false;

  // Farm bank card 9932 = farm
  if (hasCard9932) return false;

  // Card 9785 alone with no gift card and no 9932 = personal
  if (hasCard9785) return true;

  // No card info found — don't skip, let it through for manual review
  return false;
}

// --- Email Parsing ---

export interface ParsedEmail {
  messageId: string;
  date: string;
  senderEmail: string;
  senderName: string;
  subject: string;
  bodyText: string;
  amount: number | null;
  vendorSlug: string | null;
  type: ReturnType<typeof classifyEmail>;
  hasAttachment: boolean;
  attachmentFilename?: string;
  attachmentMimeType?: string;
}

export function parseEmailHeaders(headers: Array<{ name: string; value: string }>): {
  from: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  date: string;
} {
  const get = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
  const from = get('From');
  // Parse "Name <email>" format
  const emailMatch = from.match(/<([^>]+)>/);
  const senderEmail = emailMatch ? emailMatch[1] : from;
  const senderName = from.replace(/<[^>]+>/, '').replace(/"/g, '').trim();

  return {
    from,
    senderName,
    senderEmail,
    subject: get('Subject'),
    date: get('Date'),
  };
}

export function decodeBody(body: { data?: string } | undefined): string {
  if (!body?.data) return '';
  return Buffer.from(body.data, 'base64url').toString('utf-8');
}

export function getTextFromParts(parts: Array<{
  mimeType?: string;
  body?: { data?: string };
  parts?: Array<{ mimeType?: string; body?: { data?: string }; parts?: unknown[] }>;
}>): string {
  let text = '';
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      text += decodeBody(part.body);
    } else if (part.parts) {
      text += getTextFromParts(part.parts as typeof parts);
    }
  }
  return text;
}

// --- Deduplication ---

export async function isDuplicate(messageId: string, vendorSlug: string | null, date: string, amount: number | null): Promise<boolean> {
  const existing = await prisma.transaction.findFirst({
    where: {
      OR: [
        { sourceId: messageId },
        ...(vendorSlug && amount ? [{
          vendor: { slug: vendorSlug },
          date: new Date(date),
          amount,
        }] : []),
      ],
    },
  });
  return existing !== null;
}

// --- Search Queries ---

export const FINANCIAL_QUERIES = [
  // Invoices & bills from known vendors
  'from:(elstonhayandgrain.com OR starmilling.com OR chewy.com OR amazon.com OR tractorsupply.com) subject:(invoice OR bill OR order OR receipt OR confirmation)',
  // Payment confirmations
  'from:(noreply@zeffy.com OR stripe.com OR paypal.com OR patreon.com) subject:(payment OR receipt OR confirmation OR donation)',
  // RaiseRight notifications (deposits, signups, order confirmations)
  'from:(raiseright.com OR shopwithscrip.com OR glscrip.com) subject:(deposit OR earning OR enrollment OR order OR statement)',
  // Broader catch-all with attachments
  '(invoice OR receipt OR "payment confirmation" OR "order confirmation") has:attachment',
];

// Build a combined query for incremental scanning
export function buildIncrementalQuery(afterDate: string): string {
  return `(${FINANCIAL_QUERIES.map(q => `(${q})`).join(' OR ')}) after:${afterDate}`;
}
