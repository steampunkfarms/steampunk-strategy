import Anthropic from '@anthropic-ai/sdk';
import { createMessage } from './claude';

export const MINUTES_POLISH_PROMPT = `You are a nonprofit governance secretary formatting board meeting minutes for Steampunk Farms Rescue Barn Inc., a California 501(c)(3) animal sanctuary (EIN: 82-4897930).

You will receive structured meeting data: metadata, attendees with roles, agenda items (some with recorded motions and votes), raw discussion notes, and action items.

Your job: Transform this into formal board meeting minutes compliant with California Corporations Code Section 6215 and nonprofit best practices.

FORMAT (use Markdown):
1. Header: Organization name, meeting type, date, time, and location
2. CALL TO ORDER: Who called the meeting to order and at what time
3. QUORUM: "X of Y directors present; quorum established." (or not established)
4. AGENDA ITEMS: For each item, write a clear paragraph summarizing the discussion
5. MOTIONS: Use the exact motion text provided. Format as:
   "**MOTION:** [exact text]. Moved by [name], seconded by [name]. Vote: [X] in favor, [X] opposed, [X] abstaining. Motion [passed/failed]."
   If unanimous, write "Motion passed unanimously."
6. ACTION ITEMS: Numbered list with assignee and due date
7. ADJOURNMENT: Time the meeting was adjourned
8. End with "---" and a signature block placeholder

TONE:
- Formal but not corporate. This is a family-run sanctuary, not a Fortune 500 company.
- Third person throughout ("The Board discussed..." not "We discussed...")
- Use officer titles on first reference ("President Tronboll"), then last name only
- Be accurate to the raw notes — NEVER invent discussion points not mentioned
- If raw notes are sparse on a topic, write a minimal but compliant paragraph
- Animal names (Piggie Smalls, Captain Oats, etc.) are real sanctuary residents — keep them
- Format financial amounts as currency ($1,234.56)

Return ONLY the formatted minutes text in Markdown. No JSON wrapping, no explanation.`;

export interface MeetingPolishInput {
  date: string;
  endTime?: string | null;
  type: string;
  location: string;
  calledBy?: string | null;
  attendees: Array<{
    name: string;
    role: string;
    present: boolean;
    arrivedLate: boolean;
    leftEarly: boolean;
    note?: string | null;
  }>;
  agendaItems: Array<{
    title: string;
    description?: string | null;
    category?: string | null;
    hasMotion: boolean;
    motionText?: string | null;
    motionBy?: string | null;
    secondedBy?: string | null;
    votesFor?: number | null;
    votesAgainst?: number | null;
    votesAbstain?: number | null;
    motionResult?: string | null;
  }>;
  rawNotes?: string | null;
  actionItems: Array<{
    description: string;
    assignee?: string | null;
    dueDate?: string | null;
  }>;
}

export function buildPolishPayload(meeting: MeetingPolishInput): string {
  const lines: string[] = [];

  lines.push('MEETING METADATA:');
  lines.push(`- Type: ${meeting.type}`);
  lines.push(`- Date: ${meeting.date}`);
  if (meeting.endTime) lines.push(`- Adjourned: ${meeting.endTime}`);
  lines.push(`- Location: ${meeting.location}`);
  if (meeting.calledBy) lines.push(`- Called by: ${meeting.calledBy}`);

  lines.push('\nATTENDEES:');
  for (const a of meeting.attendees) {
    let entry = `- ${a.name} (${a.role})`;
    if (!a.present) entry += ' — ABSENT';
    if (a.arrivedLate) entry += ' — arrived late';
    if (a.leftEarly) entry += ' — left early';
    if (a.note) entry += ` [${a.note}]`;
    lines.push(entry);
  }

  lines.push('\nAGENDA ITEMS:');
  for (let i = 0; i < meeting.agendaItems.length; i++) {
    const item = meeting.agendaItems[i];
    lines.push(`\n${i + 1}. ${item.title}`);
    if (item.category) lines.push(`   Category: ${item.category}`);
    if (item.description) lines.push(`   Notes: ${item.description}`);
    if (item.hasMotion) {
      lines.push(`   MOTION: "${item.motionText}"`);
      lines.push(`   Moved by: ${item.motionBy}, Seconded by: ${item.secondedBy}`);
      lines.push(`   Vote: ${item.votesFor ?? 0} for, ${item.votesAgainst ?? 0} against, ${item.votesAbstain ?? 0} abstain`);
      lines.push(`   Result: ${item.motionResult}`);
    }
  }

  if (meeting.rawNotes) {
    lines.push('\nRAW DISCUSSION NOTES:');
    lines.push(meeting.rawNotes);
  }

  if (meeting.actionItems.length > 0) {
    lines.push('\nACTION ITEMS:');
    for (const ai of meeting.actionItems) {
      let entry = `- ${ai.description}`;
      if (ai.assignee) entry += ` (assigned to: ${ai.assignee})`;
      if (ai.dueDate) entry += ` [due: ${ai.dueDate}]`;
      lines.push(entry);
    }
  }

  return lines.join('\n');
}

export async function polishMinutes(meeting: MeetingPolishInput): Promise<string> {
  const payload = buildPolishPayload(meeting);
  const model = 'claude-sonnet-4-20250514';

  const response = await createMessage({
    model,
    max_tokens: 4000,
    system: MINUTES_POLISH_PROMPT,
    messages: [{ role: 'user', content: payload }],
  }, 'board-minutes-polish');

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return text;
}
