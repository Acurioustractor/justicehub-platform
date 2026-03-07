/**
 * Jina Reader — Free Scraping Tier
 *
 * Fetches web page content as markdown via Jina's free r.jina.ai endpoint.
 * Use as first attempt before Firecrawl ($) to reduce costs.
 *
 * - No API key required
 * - Returns clean markdown
 * - 15s timeout
 * - Minimum 100 chars to accept
 * - Tracks consecutive failures for caller to fallback
 */

let consecutiveFailures = 0;

/**
 * Scrape a URL via Jina Reader (free).
 * Returns markdown content or null on failure.
 */
export async function scrapeViaJina(url: string): Promise<string | null> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Accept: 'text/markdown',
        'X-No-Cache': 'true',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      consecutiveFailures++;
      console.warn(`[Jina] HTTP ${response.status} for ${url}`);
      return null;
    }

    const text = await response.text();

    // Jina returns content after "Markdown Content:\n" header
    const markerIdx = text.indexOf('Markdown Content:\n');
    const content = markerIdx !== -1 ? text.slice(markerIdx + 18) : text;

    // Minimum content threshold
    if (content.trim().length < 100) {
      consecutiveFailures++;
      console.warn(`[Jina] Content too short (${content.trim().length} chars) for ${url}`);
      return null;
    }

    // Success — reset failure counter
    consecutiveFailures = 0;
    return content.trim();
  } catch (err) {
    consecutiveFailures++;
    console.warn(
      `[Jina] Failed for ${url}: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
    return null;
  }
}

/**
 * Check if Jina has had too many consecutive failures.
 * Caller should prefer Firecrawl after 3 consecutive failures.
 */
export function shouldPreferFirecrawl(): boolean {
  return consecutiveFailures >= 3;
}

/** Reset the failure counter (e.g., on new batch) */
export function resetJinaFailures(): void {
  consecutiveFailures = 0;
}
