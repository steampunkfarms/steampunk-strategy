/**
 * scan-pledge-collection.ts
 *
 * Scans the "Pledge Collection" Gmail label to understand the content:
 * - What shelter emails look like
 * - Pledged amounts format
 * - Whether PDFs (shelter notes, medical records) are attached
 * - Subject/sender patterns
 *
 * Usage:
 *   npx tsx scripts/scan-pledge-collection.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

const LABEL_NAME = 'Pledge Collection';

async function main() {
  console.log(`🔍 Scanning Gmail label: "${LABEL_NAME}"\n`);

  // 1. Find the label
  const labelsRes = await gmail.users.labels.list({ userId: 'me' });
  const label = labelsRes.data.labels?.find(l => l.name === LABEL_NAME);

  if (!label?.id) {
    // Try nested labels
    const allLabels = labelsRes.data.labels || [];
    console.log('Available labels containing "pledge" or "shelter":');
    for (const l of allLabels) {
      if (l.name && (l.name.toLowerCase().includes('pledge') || l.name.toLowerCase().includes('shelter'))) {
        console.log(`  - ${l.name} (${l.id})`);
      }
    }
    console.error(`\n❌ Exact label "${LABEL_NAME}" not found. Check label name above.`);
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

  // 3. Analyze each message
  interface MessageInfo {
    date: string;
    from: string;
    subject: string;
    snippet: string;
    hasAttachments: boolean;
    attachments: { filename: string; mimeType: string; size: number }[];
  }

  const messages: MessageInfo[] = [];

  for (const msg of allMessages) {
    try {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const headers = detail.data.payload?.headers || [];
      const getHeader = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      // Find attachments recursively
      const attachments: { filename: string; mimeType: string; size: number }[] = [];
      function findAttachments(parts: any[]) {
        for (const part of parts) {
          if (part.filename && part.filename.length > 0) {
            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType || 'unknown',
              size: part.body?.size || 0,
            });
          }
          if (part.parts) findAttachments(part.parts);
        }
      }
      if (detail.data.payload?.parts) {
        findAttachments(detail.data.payload.parts);
      }

      messages.push({
        date: getHeader('Date'),
        from: getHeader('From'),
        subject: getHeader('Subject'),
        snippet: detail.data.snippet || '',
        hasAttachments: attachments.length > 0,
        attachments,
      });
    } catch {
      // skip unreadable
    }
  }

  // Sort chronologically
  messages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 4. Summary analysis
  console.log('═══════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Unique senders
  const senders = new Map<string, number>();
  for (const m of messages) {
    const sender = m.from.replace(/<.*>/, '').trim();
    senders.set(sender, (senders.get(sender) || 0) + 1);
  }
  console.log('📬 Senders:');
  for (const [sender, count] of [...senders.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${sender}: ${count} messages`);
  }

  // Attachment analysis
  const withAttachments = messages.filter(m => m.hasAttachments);
  console.log(`\n📎 Messages with attachments: ${withAttachments.length} of ${messages.length}`);

  const fileTypes = new Map<string, number>();
  const allAttachments: { filename: string; mimeType: string; size: number; messageSubject: string }[] = [];
  for (const m of withAttachments) {
    for (const att of m.attachments) {
      const ext = att.filename.split('.').pop()?.toLowerCase() || 'unknown';
      fileTypes.set(ext, (fileTypes.get(ext) || 0) + 1);
      allAttachments.push({ ...att, messageSubject: m.subject });
    }
  }

  if (fileTypes.size > 0) {
    console.log('\n📄 Attachment types:');
    for (const [ext, count] of [...fileTypes.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  .${ext}: ${count} files`);
    }
  }

  // Subject patterns
  console.log('\n📋 Subject line patterns:');
  const subjectKeywords = new Map<string, number>();
  const keywords = ['cat', 'dog', 'pig', 'goat', 'chicken', 'duck', 'horse', 'donkey', 'cow', 'sheep', 'rabbit', 'turkey', 'pledge', 'medical', 'vet', 'shelter', 'intake', 'rescue', 'barn', 'feral', 'spay', 'neuter', 'vaccine', 'foster'];
  for (const m of messages) {
    const lower = (m.subject + ' ' + m.snippet).toLowerCase();
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        subjectKeywords.set(kw, (subjectKeywords.get(kw) || 0) + 1);
      }
    }
  }
  for (const [kw, count] of [...subjectKeywords.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  "${kw}": appears in ${count} messages`);
  }

  // 5. Full message list
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('ALL MESSAGES (chronological)');
  console.log('═══════════════════════════════════════════════════════════\n');

  for (const m of messages) {
    const dateStr = new Date(m.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const sender = m.from.replace(/<.*>/, '').trim();
    console.log(`📅 ${dateStr} | From: ${sender}`);
    console.log(`   Subject: ${m.subject}`);
    console.log(`   Snippet: ${m.snippet.slice(0, 200)}`);
    if (m.hasAttachments) {
      console.log(`   📎 Attachments: ${m.attachments.map(a => `${a.filename} (${a.mimeType}, ${Math.round(a.size / 1024)}KB)`).join(', ')}`);
    }
    console.log('');
  }

  // 6. PDF inventory
  const pdfs = allAttachments.filter(a => a.mimeType === 'application/pdf' || a.filename.toLowerCase().endsWith('.pdf'));
  if (pdfs.length > 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`PDF INVENTORY (${pdfs.length} files)`);
    console.log('═══════════════════════════════════════════════════════════\n');
    for (const pdf of pdfs) {
      console.log(`  📄 ${pdf.filename} (${Math.round(pdf.size / 1024)}KB)`);
      console.log(`     From message: ${pdf.messageSubject}`);
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
