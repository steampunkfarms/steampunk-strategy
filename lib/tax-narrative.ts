import Anthropic from '@anthropic-ai/sdk';
import { createMessage } from './claude';
import type { TaxRollup } from './queries';

export const PART_III_PROMPT = `You are writing IRS Form 990-EZ Part III (Statement of Program Service Accomplishments) for Steampunk Farms Rescue Barn Inc., a California 501(c)(3) animal sanctuary (EIN: 82-4897930), located in Ranchita, CA (San Diego County backcountry).

The organization operates one primary program: providing permanent sanctuary, daily care, and veterinary services for 60+ rescued farm animals including horses, goats, pigs, sheep, chickens, ducks, dogs, cats, and other species.

You will receive the fiscal year's financial data: expenses by category, revenue sources, donor-paid amounts, and other operational details.

REQUIREMENTS:
1. Write 2-3 paragraphs for the primary program service accomplishment (Part III, Line 28)
2. Include actual dollar amounts from the data provided
3. Mention animal count and types of care provided
4. Reference donor-paid bills as in-kind contributed services if applicable
5. Keep it factual, quantified, and suitable for IRS review — no marketing language
6. Use third person ("The organization provided...")

Also generate a SCHEDULE O section titled "SCHEDULE O — Other Expenses (Form 990-EZ, Line 16)" that lists each expense category under Line 16 with its total amount, formatted as:
Category Name .... $XX,XXX

Return the Part III narrative first, then a line "---", then the Schedule O content.
Do not wrap in JSON or add explanatory text.`;

export function buildNarrativePayload(rollup: TaxRollup): string {
  const lines: string[] = [];

  lines.push(`FISCAL YEAR: ${rollup.fiscalYear}`);
  lines.push('');

  lines.push('REVENUE:');
  lines.push(`Total Revenue: $${rollup.revenue.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  for (const item of rollup.revenue.byLine) {
    lines.push(`  ${item.line}: $${item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${item.description})`);
  }
  lines.push('');

  lines.push('EXPENSES:');
  lines.push(`Total Expenses: $${rollup.expenses.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  for (const item of rollup.expenses.byLine) {
    lines.push(`  ${item.line}: $${item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${item.description})`);
    if (item.categories.length > 0) {
      lines.push(`    Categories: ${item.categories.join(', ')}`);
    }
  }
  lines.push('');

  lines.push('SCHEDULE O DETAIL (Line 16 breakdown):');
  for (const so of rollup.expenses.scheduleO) {
    lines.push(`  ${so.category}: $${so.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${so.count} transactions)`);
  }
  lines.push('');

  if (rollup.donorPaidTotal > 0) {
    lines.push(`DONOR-PAID BILLS (in-kind contributed services): $${rollup.donorPaidTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    lines.push('');
  }

  lines.push(`NET INCOME: $${rollup.netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  lines.push(`BOARD MEETINGS FILED: ${rollup.boardMinutesFiled}`);

  return lines.join('\n');
}

export async function generatePartIIINarrative(rollup: TaxRollup): Promise<{ narrative: string; scheduleO: string }> {
  const payload = buildNarrativePayload(rollup);
  const model = 'claude-sonnet-4-20250514';

  const response = await createMessage({
    model,
    max_tokens: 3000,
    system: PART_III_PROMPT,
    messages: [{ role: 'user', content: payload }],
  }, 'tax-narrative-part-iii');

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  // Split on --- separator
  const parts = text.split(/\n---\n/);
  return {
    narrative: (parts[0] ?? '').trim(),
    scheduleO: (parts[1] ?? '').trim(),
  };
}
