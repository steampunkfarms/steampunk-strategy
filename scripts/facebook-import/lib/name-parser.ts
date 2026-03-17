/**
 * Extract person names from Facebook export title patterns.
 *
 * Reactions: "Steampunk Farms Rescue Barn reacted to {Name}'s comment."
 *            "Steampunk Farms Rescue Barn liked {Name}'s post."
 * Comments:  "Steampunk Farms Rescue Barn replied to {Name}'s comment."
 *            "Steampunk Farms Rescue Barn commented on {Name}'s post."
 */

const PAGE_NAME = 'Steampunk Farms Rescue Barn';

// Patterns that extract the target person's name from a title string
const TITLE_PATTERNS = [
  // "SFRB reacted to X's comment/post/photo/video"
  /reacted to (.+?)(?:'s|'s) (?:comment|post|photo|video|live video|reel)/i,
  // "SFRB liked X's comment/post/photo/video"
  /liked (.+?)(?:'s|'s) (?:comment|post|photo|video|live video|reel)/i,
  // "SFRB replied to X's comment"
  /replied to (.+?)(?:'s|'s) comment/i,
  // "SFRB commented on X's post/photo/video"
  /commented on (.+?)(?:'s|'s) (?:post|photo|video|live video|reel)/i,
];

// Titles that refer to the page itself (not a person)
const SELF_REFERENCES = [
  'their own post',
  'their own comment',
  'their own photo',
  'their own video',
  'own post',
  'own comment',
];

/**
 * Extract the target person's name from a Facebook title string.
 * Returns null if the title is a self-reference or doesn't match any pattern.
 */
export function extractNameFromTitle(title: string): string | null {
  if (!title) return null;

  // Skip self-references
  for (const ref of SELF_REFERENCES) {
    if (title.toLowerCase().includes(ref)) return null;
  }

  for (const pattern of TITLE_PATTERNS) {
    const match = title.match(pattern);
    if (match) {
      const name = match[1].trim();
      // Skip if the extracted name is the page itself
      if (name === PAGE_NAME) return null;
      return name;
    }
  }

  return null;
}

/**
 * Extract the reaction type from a title string.
 * "SFRB reacted to..." → the reaction type is in the data, not the title.
 * "SFRB liked..." → LIKE
 */
export function extractActionFromTitle(title: string): string | null {
  if (!title) return null;
  if (title.includes('liked')) return 'LIKE';
  if (title.includes('reacted to')) return 'REACTION';
  if (title.includes('replied to')) return 'REPLY';
  if (title.includes('commented on')) return 'COMMENT';
  return null;
}

/**
 * Split a full name into firstName and remaining lastName.
 * Handles multi-part last names, suffixes, etc.
 *
 * "Catherine Macias" → { firstName: "Catherine", lastName: "Macias" }
 * "Anna Des Troismaisons Krolikowski" → { firstName: "Anna", lastName: "Des Troismaisons Krolikowski" }
 * "SJ Pigeon" → { firstName: "SJ", lastName: "Pigeon" }
 * "Madonna" → null (single name, can't split)
 */
export function splitName(fullName: string): { firstName: string; lastName: string } | null {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return null;
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

/**
 * Normalize a name for dedup comparison.
 * Lowercases, trims, collapses whitespace.
 */
export function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}
