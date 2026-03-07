// Captain's Log AI Classification — auto-tags entries using Claude
// see docs/handoffs/_working/20260307-captains-log-working-spec.md

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const CLASSIFICATION_PROMPT = `You are a nonprofit operations classifier for Steampunk Farms Rescue Barn Inc., a 501(c)(3) animal sanctuary.

Given an action item title and optional body text, classify it into these categories. Return ONLY valid JSON matching this exact schema — no markdown, no explanation.

Schema:
{
  "domain": string[],        // from: compliance, governance, financial-policy, operations, technology, fundraising, program-services, medical, communications, hr
  "actionType": string[],    // from: board-resolution, document-drafting, research, vendor-contact, filing, policy-review, system-configuration, data-entry, outreach, scheduling, procurement
  "urgency": string[],       // from: time-sensitive, fiscal-year-dependent, audit-related, grant-deadline, regulatory-deadline, routine
  "prepCategory": string[],  // from: board-meeting-prep, 990-prep, grant-report-prep, audit-prep, budget-prep, annual-review-prep, none
  "suggestedPriority": string, // one of: critical, high, normal, low
  "suggestedTags": string[]    // 3-6 concise freeform tags for search/filter
}

Context: The sanctuary has ~60 animals across 8 programs (Cluck Crew/poultry, General Herd/livestock, etc.). The org files Form 990-EZ, CA state filings, has a board of directors (family members), runs social media for public awareness, and operates a soap e-commerce store (Cleanpunk).`;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, body } = await request.json();
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

    const anthropic = new Anthropic();
    const userContent = `Title: ${title}${body ? `\n\nBody: ${body}` : ''}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        { role: 'user', content: CLASSIFICATION_PROMPT + '\n\n' + userContent },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const classification = JSON.parse(text);

    return NextResponse.json(classification);
  } catch (error) {
    console.error('Classification error:', error);
    // Fallback classification when Claude is unavailable
    return NextResponse.json({
      domain: ['operations'],
      actionType: ['research'],
      urgency: ['routine'],
      prepCategory: ['none'],
      suggestedPriority: 'normal',
      suggestedTags: ['needs-review'],
    });
  }
}
