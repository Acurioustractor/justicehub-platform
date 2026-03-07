/**
 * Robust JSON Parser
 *
 * 5-stage fallback for extracting JSON from LLM responses.
 * Handles: <think> blocks, markdown fences, trailing commas,
 * truncated JSON, control chars, single quotes.
 *
 * Ported from GrantScope's battle-tested pattern.
 */

/**
 * Parse JSON from an LLM response with aggressive cleanup.
 * Works with objects and arrays.
 *
 * @throws Error with context on complete failure
 */
export function parseJSON<T>(text: string): T {
  if (!text || !text.trim()) {
    throw new Error('parseJSON: empty input');
  }

  let cleaned = text;

  // Stage 1: Strip <think>...</think> blocks (reasoning models like DeepSeek)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '');

  // Stage 2: Strip markdown code fences
  cleaned = cleaned.replace(/```(?:json|JSON)?\s*\n?/g, '');
  cleaned = cleaned.replace(/```\s*$/gm, '');

  cleaned = cleaned.trim();

  // Stage 3: Try direct parse first (fast path)
  try {
    return JSON.parse(cleaned);
  } catch {
    // Continue to extraction
  }

  // Stage 4: Regex extract first JSON object or array
  const objMatch = cleaned.match(/(\{[\s\S]*\})/);
  const arrMatch = cleaned.match(/(\[[\s\S]*\])/);

  // Pick the one that appears first in the text
  let extracted: string | null = null;
  if (objMatch && arrMatch) {
    extracted =
      (objMatch.index ?? Infinity) < (arrMatch.index ?? Infinity)
        ? objMatch[1]
        : arrMatch[1];
  } else {
    extracted = objMatch?.[1] ?? arrMatch?.[1] ?? null;
  }

  if (extracted) {
    // Stage 5: Pre-cleanup
    let prepped = extracted;

    // Remove trailing commas before } or ]
    prepped = prepped.replace(/,\s*([}\]])/g, '$1');

    // Remove control characters (except \n, \r, \t)
    prepped = prepped.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

    // Escape unescaped newlines inside string values
    prepped = prepped.replace(
      /("(?:[^"\\]|\\.)*")/g,
      (match) => match.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
    );

    // Try parse after cleanup
    try {
      return JSON.parse(prepped);
    } catch {
      // Continue to bracket-depth parser
    }

    // Stage 6: Bracket-depth parser — find outermost balanced structure
    const balanced = extractBalanced(prepped);
    if (balanced) {
      // Final cleanup pass
      let final = balanced;
      final = final.replace(/,\s*([}\]])/g, '$1');
      // Replace single quotes with double quotes (only outside existing double-quoted strings)
      final = replaceSingleQuotes(final);

      try {
        return JSON.parse(final);
      } catch {
        // Fall through
      }
    }
  }

  // Stage 7: Complete failure — throw with context
  const preview = text.slice(0, 200).replace(/\n/g, '\\n');
  throw new Error(
    `parseJSON: failed to extract valid JSON.\nInput preview: ${preview}...`
  );
}

/**
 * Extract the outermost balanced {} or [] from text using bracket depth tracking.
 */
function extractBalanced(text: string): string | null {
  let start = -1;
  let depth = 0;
  let openChar: '{' | '[' | null = null;
  let closeChar: '}' | ']' | null = null;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\') {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (start === -1 && (ch === '{' || ch === '[')) {
      start = i;
      openChar = ch;
      closeChar = ch === '{' ? '}' : ']';
      depth = 1;
      continue;
    }

    if (openChar && ch === openChar) {
      depth++;
    } else if (closeChar && ch === closeChar) {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  // If we got an opening bracket but never closed it (truncated response),
  // try to close it ourselves
  if (start !== -1 && closeChar) {
    return text.slice(start) + closeChar;
  }

  return null;
}

/**
 * Replace single quotes with double quotes, being careful not to break
 * strings that already use double quotes.
 */
function replaceSingleQuotes(text: string): string {
  // Only do this if the text has more single quotes than double quotes
  // (indicates the LLM used single-quote JSON)
  const singleCount = (text.match(/'/g) || []).length;
  const doubleCount = (text.match(/"/g) || []).length;

  if (singleCount > doubleCount) {
    return text.replace(/'/g, '"');
  }

  return text;
}
