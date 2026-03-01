import Anthropic from '@anthropic-ai/sdk';
import type { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages';

/**
 * Shared Anthropic client with retry and usage logging.
 *
 * The SDK handles 429 / 5xx retries with exponential backoff automatically.
 * We add a thin wrapper that logs token usage for cost visibility in Vercel logs.
 */
const anthropic = new Anthropic({
  maxRetries: 3,
});

/**
 * Call Claude with automatic retry + usage logging.
 *
 * Usage is logged to console in a structured format that Vercel captures:
 *   [Claude] model=claude-sonnet-4-... input=1234 output=567 caller=document-parse
 */
export async function createMessage(
  params: MessageCreateParamsNonStreaming,
  caller: string,
) {
  const response = await anthropic.messages.create(params);

  console.log(
    `[Claude] model=${response.model} input=${response.usage.input_tokens} output=${response.usage.output_tokens} caller=${caller}`,
  );

  return response;
}

export { anthropic };
