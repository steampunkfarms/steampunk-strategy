/**
 * Synthesize notes for ProductSpeciesMap learning loop.
 *
 * When a product mapping already has notes and the user provides new notes,
 * this helper merges them into a single concise note using Claude Haiku.
 * Falls back to simple concatenation if the API key is unavailable.
 *
 * see docs/handoffs/_working/20260307-product-species-map-learning-working-spec.md
 */
import Anthropic from '@anthropic-ai/sdk';

/**
 * Merge old and new notes into a single concise institutional knowledge note.
 * Uses Claude Haiku for intelligent synthesis; falls back to concatenation.
 */
export async function synthesizeNotes(existingNote: string, newNote: string): Promise<string> {
  if (!existingNote) return newNote;
  if (!newNote) return existingNote;
  if (existingNote === newNote) return existingNote;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback: simple concatenation with dedup
    return `${existingNote}\n---\n${newNote}`;
  }

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20241022',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Merge these two notes about a farm product into one concise note. Keep all unique information. No preamble, just the merged note.\n\nExisting: ${existingNote}\n\nNew: ${newNote}`,
      }],
    });

    const result = (msg.content[0] as { type: 'text'; text: string })?.text?.trim();
    return result || `${existingNote}\n---\n${newNote}`;
  } catch {
    return `${existingNote}\n---\n${newNote}`;
  }
}
