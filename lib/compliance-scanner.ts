import { prisma } from './prisma';

// --- Compliance Sender Map ---
// Maps sender email domains to authority slugs matching ComplianceTask.authority values

export const COMPLIANCE_SENDER_MAP: Record<string, { authority: string; defaultUrgency: 'critical' | 'warning' | 'info' }> = {
  'irs.gov':              { authority: 'IRS',                defaultUrgency: 'critical' },
  'ftb.ca.gov':           { authority: 'CA_FTB',             defaultUrgency: 'critical' },
  'sos.ca.gov':           { authority: 'CA_SOS',             defaultUrgency: 'warning' },
  'oag.ca.gov':           { authority: 'CA_AG',              defaultUrgency: 'warning' },
  'cdtfa.ca.gov':         { authority: 'CA_CDTFA',           defaultUrgency: 'critical' },
  'caag.state.ca.us':     { authority: 'CA_AG',              defaultUrgency: 'warning' },
  'tax.ca.gov':           { authority: 'CA_FTB',             defaultUrgency: 'critical' },
  'candid.org':           { authority: 'Candid',             defaultUrgency: 'info' },
  'candidnow.org':        { authority: 'Candid',             defaultUrgency: 'info' },
  'guidestar.org':        { authority: 'Candid',             defaultUrgency: 'info' },
  'charitynavigator.org': { authority: 'Charity Navigator',  defaultUrgency: 'info' },
  'sandiegocounty.gov':   { authority: 'County',             defaultUrgency: 'warning' },
  'sdcounty.ca.gov':      { authority: 'County',             defaultUrgency: 'warning' },
};

// --- Compliance Gmail Queries ---

export const COMPLIANCE_QUERIES = [
  // Direct government senders
  'from:(irs.gov OR ftb.ca.gov OR sos.ca.gov OR oag.ca.gov OR cdtfa.ca.gov OR tax.ca.gov OR caag.state.ca.us)',
  // Charity/nonprofit oversight
  'from:(candid.org OR candidnow.org OR guidestar.org OR charitynavigator.org)',
  // County
  'from:(sandiegocounty.gov OR sdcounty.ca.gov)',
  // Broader compliance keyword catch
  'subject:(notice OR "filing deadline" OR "annual report" OR "return due" OR "tax form" OR penalty OR delinquent OR revocation OR "renewal reminder")',
];

// --- Urgency Keywords ---

const CRITICAL_KEYWORDS = ['penalty', 'delinquent', 'revocation', 'suspension', 'final notice', 'levy', 'lien', 'deficiency'];
const WARNING_KEYWORDS = ['deadline', 'due date', 'reminder', 'expiring', 'overdue', 'action required', 'response required'];

// --- Compliance Notice Type ---

export interface ComplianceNotice {
  messageId: string;
  authority: string;
  noticeType: 'filing_reminder' | 'penalty_notice' | 'renewal' | 'profile_update' | 'tax_form' | 'general_notice';
  urgency: 'critical' | 'warning' | 'info';
  subject: string;
  senderEmail: string;
  receivedDate: Date;
  extractedDeadline: Date | null;
  bodySnippet: string;
  matchedTaskSlug: string | null;
}

// --- Classify a compliance email ---

export function classifyComplianceEmail(
  subject: string,
  senderEmail: string,
  bodyText: string,
): { isCompliance: boolean; authority: string | null; urgency: 'critical' | 'warning' | 'info'; noticeType: ComplianceNotice['noticeType'] } {
  const from = senderEmail.toLowerCase();
  const combined = `${subject} ${bodyText}`.toLowerCase();

  // Match sender domain to authority
  let authority: string | null = null;
  let baseUrgency: 'critical' | 'warning' | 'info' = 'info';

  for (const [domain, config] of Object.entries(COMPLIANCE_SENDER_MAP)) {
    if (from.includes(domain)) {
      authority = config.authority;
      baseUrgency = config.defaultUrgency;
      break;
    }
  }

  // If no authority matched by sender, check if subject has compliance keywords
  if (!authority) {
    const subLower = subject.toLowerCase();
    const hasComplianceKeywords = /\b(filing|tax form|annual report|990|1099|w-?9|renewal|compliance|exemption|nonprofit status)\b/i.test(subLower);
    if (!hasComplianceKeywords) {
      return { isCompliance: false, authority: null, urgency: 'info', noticeType: 'general_notice' };
    }
    // Unknown authority but compliance-related
    authority = 'Unknown';
  }

  // Determine urgency — escalate based on keywords
  let urgency = baseUrgency;
  if (CRITICAL_KEYWORDS.some(kw => combined.includes(kw))) {
    urgency = 'critical';
  } else if (urgency !== 'critical' && WARNING_KEYWORDS.some(kw => combined.includes(kw))) {
    urgency = 'warning';
  }

  // Determine notice type
  const noticeType = classifyNoticeType(subject, bodyText);

  return { isCompliance: true, authority, urgency, noticeType };
}

function classifyNoticeType(subject: string, bodyText: string): ComplianceNotice['noticeType'] {
  const combined = `${subject} ${bodyText}`.toLowerCase();

  if (/penalty|delinquen|lien|levy|deficien/i.test(combined)) return 'penalty_notice';
  if (/renew|expir|registration/i.test(combined)) return 'renewal';
  if (/tax form|1099|990|w-?9|schedule/i.test(combined)) return 'tax_form';
  if (/filing|annual report|statement of information|return due/i.test(combined)) return 'filing_reminder';
  if (/profile|update.*profile|seal|badge/i.test(combined)) return 'profile_update';
  return 'general_notice';
}

// --- Extract deadline dates from email text ---

export function extractDeadline(subject: string, bodyText: string): Date | null {
  const combined = `${subject} ${bodyText}`;

  // Patterns: "due by March 15, 2026", "deadline: 04/15/2026", "must be filed by May 1"
  const patterns = [
    /(?:due|deadline|must be (?:filed|received|submitted) by|expires?|expiration)[:\s]+(\w+ \d{1,2},?\s*\d{4})/i,
    /(?:due|deadline|expires?)[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /(?:due|deadline|expires?)[:\s]+(\d{4}-\d{2}-\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = combined.match(pattern);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2024 && parsed.getFullYear() <= 2030) {
        return parsed;
      }
    }
  }
  return null;
}

// --- Match to existing ComplianceTask ---

export async function matchComplianceTask(authority: string, subject: string): Promise<{ id: string; slug: string; name: string } | null> {
  // Try exact authority match first
  const tasks = await prisma.complianceTask.findMany({
    where: { authority },
    select: { id: true, slug: true, name: true },
  });

  if (tasks.length === 0) return null;
  if (tasks.length === 1) return tasks[0];

  // Multiple tasks for same authority — try keyword matching
  const subLower = subject.toLowerCase();
  for (const task of tasks) {
    const taskWords = task.name.toLowerCase().split(/\s+/);
    const matchScore = taskWords.filter(w => w.length > 3 && subLower.includes(w)).length;
    if (matchScore >= 2) return task;
  }

  // Default to first task for this authority
  return tasks[0];
}

// --- Check if compliance notice already scanned ---

export async function isComplianceDuplicate(messageId: string): Promise<boolean> {
  const existing = await prisma.auditLog.findFirst({
    where: {
      entity: 'ComplianceNotice',
      details: { contains: messageId },
    },
  });
  return existing !== null;
}

// --- Create compliance alert records ---

export async function createComplianceAlert(notice: ComplianceNotice): Promise<void> {
  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      action: 'import',
      entity: 'ComplianceNotice',
      entityId: notice.matchedTaskSlug ?? 'unmatched',
      details: JSON.stringify({
        source: 'gmail_compliance_scan',
        messageId: notice.messageId,
        authority: notice.authority,
        noticeType: notice.noticeType,
        urgency: notice.urgency,
        senderEmail: notice.senderEmail,
        subject: notice.subject,
        extractedDeadline: notice.extractedDeadline?.toISOString() ?? null,
        bodySnippet: notice.bodySnippet,
      }),
      userName: 'gmail-scanner',
    },
  });

  // If we matched a task and extracted a deadline, create/update ComplianceCompletion
  if (notice.matchedTaskSlug && notice.extractedDeadline) {
    const task = await prisma.complianceTask.findUnique({
      where: { slug: notice.matchedTaskSlug },
    });

    if (task) {
      const fiscalYear = notice.extractedDeadline.getFullYear();
      const period = String(fiscalYear);

      // Check if completion record already exists for this period
      const existing = await prisma.complianceCompletion.findUnique({
        where: { taskId_fiscalYear_period: { taskId: task.id, fiscalYear, period } },
      });

      if (!existing) {
        await prisma.complianceCompletion.create({
          data: {
            taskId: task.id,
            fiscalYear,
            period,
            dueDate: notice.extractedDeadline,
            status: 'upcoming',
            notes: `Auto-detected from Gmail: ${notice.subject.slice(0, 200)}`,
          },
        });
        console.log(`[Gmail Compliance] Created completion record for ${task.name} — due ${notice.extractedDeadline.toISOString().split('T')[0]}`);
      }
    }
  }

  // Log urgency
  const emoji = notice.urgency === 'critical' ? '🔴' : notice.urgency === 'warning' ? '🟡' : '🔵';
  console.log(`[Gmail Compliance] ${emoji} ${notice.urgency.toUpperCase()}: ${notice.authority} — ${notice.noticeType} — ${notice.subject.slice(0, 80)}`);
}
