/**
 * Web Search — Multi-provider search with automatic fallback
 *
 * Priority: Serper.dev (2.5K free/month, Google results) → Brave → Jina
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
 * Tries Serper (Google results) → Brave → Jina in order.
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

  // Try Brave Search
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;
  if (braveKey) {
    const results = await searchBrave(query, braveKey, maxResults);
    if (results.length > 0) return results;
  }

  // Fall back to Jina Search
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
      console.warn(`[Serper] HTTP ${response.status}`);
      return [];
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
