/**
 * Fix Facebook's broken UTF-8 encoding in data exports.
 *
 * Facebook encodes multi-byte UTF-8 characters as individual \uXXXX escape
 * sequences representing each raw byte. For example, the right single quote '
 * (U+2019, UTF-8 bytes E2 80 99) appears as \u00e2\u0080\u0099 in the JSON.
 *
 * The fix: treat each char code as a raw byte, build a Latin-1 buffer,
 * then decode as UTF-8.
 */

/**
 * Fix a single string that may contain Facebook's broken UTF-8 encoding.
 */
export function fixFacebookString(text: string): string {
  // Only apply the fix if there are bytes in the \u0080-\u00ff range,
  // which indicates Facebook's broken encoding. Normal UTF-8 strings
  // decoded by JSON.parse won't have these unless they're the broken pattern.
  if (!/[\u0080-\u00ff]/.test(text)) return text;

  try {
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      bytes[i] = text.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    // If decoding fails, return the original string
    return text;
  }
}

/**
 * Recursively fix Facebook encoding on all string values in an object/array.
 */
export function fixFacebookEncoding<T>(obj: T): T {
  if (typeof obj === 'string') {
    return fixFacebookString(obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(fixFacebookEncoding) as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = fixFacebookEncoding(value);
    }
    return result as T;
  }
  return obj;
}
