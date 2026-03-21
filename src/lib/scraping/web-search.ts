/**
 * Web Search — Multi-provider search with automatic fallback
 *
 * Priority: Serper (2.5K/mo) → Brave (2K/mo) → Google CSE (100/day) → Jina (free unlimited)
 * Total free capacity: ~4,600 searches/month + unlimited Jina fallback
 *
 * Usage:
 *   import { searchWeb } from '@/lib/scraping/web-search';
 *   const results = await searchWeb('youth justice evaluation Australia');
 */

export interface SearchResult {
  title: string;
  url: string;
  description: string;
}

/**
 * Search the web using available providers.
 * Tries Serper (2.5K/mo) → Brave (2K/mo) → Google CSE (100/day) → Jina (free) in order.
 */
export async function searchWeb(
  query: string,
  maxResults = 5
): Promise<SearchResult[]> {
  // Try Serper.dev first (Google results, 2.5K free/month)
  const serperKey = process.env.SERPER_API_KEY;
  if (serperKey) {
    const results = await searchSerper(query, serperKey, maxResults);
    if (results.length > 0) return results;
  }

  // Try Brave Search (2K free/month)
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;
  if (braveKey) {
    const results = await searchBrave(query, braveKey, maxResults);
    if (results.length > 0) return results;
  }

  // Try Google Custom Search (100 free/day = ~3K/month)
  const googleKey = process.env.GOOGLE_CSE_KEY;
  const googleCx = process.env.GOOGLE_CSE_CX;
  if (googleKey && googleCx) {
    const results = await searchGoogleCSE(query, googleKey, googleCx, maxResults);
    if (results.length > 0) return results;
  }

  // Fall back to Jina Search (free, always available)
  console.log('[Search] Using Jina fallback for:', query.slice(0, 60));
  return searchJina(query, maxResults);
}

async function searchSerper(
  query: string,
  apiKey: string,
  maxResults: number
): Promise<SearchResult[]> {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: maxResults }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.warn(`[Serper] HTTP ${response.status} — quota may be exhausted, falling back`);
      return [];
    }

    const remaining = response.headers.get('x-ratelimit-remaining');
    if (remaining) {
      const n = parseInt(remaining, 10);
      if (n < 100) console.warn(`[Serper] Only ${n} searches remaining this month`);
    }

    const data = (await response.json()) as {
      organic?: { title?: string; link?: string; snippet?: string }[];
    };

    return (data.organic || []).slice(0, maxResults).map((r) => ({
      title: r.title || '',
      url: r.link || '',
      description: r.snippet || '',
    }));
  } catch (err) {
    console.warn(
      `[Serper] Failed: ${err instanceof Error ? err.message : 'Unknown'}`
    );
    return [];
  }
}

async function searchBrave(
  query: string,
  apiKey: string,
  maxResults: number
): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      count: String(maxResults),
    });

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?${params}`,
      {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!response.ok) {
      console.warn(`[Brave Search] HTTP ${response.status}`);
      return [];
    }

    const data = (await response.json()) as {
      web?: {
        results?: { title?: string; url?: string; description?: string }[];
      };
    };

    return (data.web?.results || []).slice(0, maxResults).map((r) => ({
      title: r.title || '',
      url: r.url || '',
      description: r.description || '',
    }));
  } catch (err) {
    console.warn(
      `[Brave Search] Failed: ${err instanceof Error ? err.message : 'Unknown'}`
    );
    return [];
  }
}

async function searchGoogleCSE(
  query: string,
  apiKey: string,
  cx: string,
  maxResults: number
): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx,
      q: query,
      num: String(Math.min(maxResults, 10)),
    });

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!response.ok) {
      console.warn(`[Google CSE] HTTP ${response.status}`);
      return [];
    }

    const data = (await response.json()) as {
      items?: { title?: string; link?: string; snippet?: string }[];
    };

    return (data.items || []).slice(0, maxResults).map((r) => ({
      title: r.title || '',
      url: r.link || '',
      description: r.snippet || '',
    }));
  } catch (err) {
    console.warn(
      `[Google CSE] Failed: ${err instanceof Error ? err.message : 'Unknown'}`
    );
    return [];
  }
}

async function searchJina(
  query: string,
  maxResults: number
): Promise<SearchResult[]> {
  try {
    const apiKey = process.env.JINA_API_KEY;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(
      `https://s.jina.ai/${encodeURIComponent(query)}`,
      {
        headers,
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!response.ok) {
      console.warn(`[Jina Search] HTTP ${response.status}`);
      return [];
    }

    const data = (await response.json()) as {
      data?: { title?: string; url?: string; description?: string }[];
    };

    return (data.data || []).slice(0, maxResults).map((r) => ({
      title: r.title || '',
      url: r.url || '',
      description: r.description || '',
    }));
  } catch (err) {
    console.warn(
      `[Jina Search] Failed: ${err instanceof Error ? err.message : 'Unknown'}`
    );
    return [];
  }
}
