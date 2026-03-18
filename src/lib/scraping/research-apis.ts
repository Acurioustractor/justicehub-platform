/**
 * Research APIs — Structured academic data sources
 *
 * OpenAlex: 250M+ papers, free, no auth required
 * ABS Data API: Australian government statistics (requires API key)
 *
 * These provide structured data (not web scraping) for the research loop.
 */

export interface ResearchPaper {
  title: string;
  url: string;
  doi: string | null;
  authors: string[];
  year: number | null;
  abstract: string | null;
  cited_by_count: number;
  source: string | null; // journal/publisher
  open_access: boolean;
}

/**
 * Search OpenAlex for academic papers.
 * Free API, no auth, 100K requests/day.
 * Polite pool (faster): set mailto in User-Agent.
 *
 * @see https://docs.openalex.org/api-entities/works/search-works
 */
export async function searchOpenAlex(
  query: string,
  maxResults = 10,
): Promise<ResearchPaper[]> {
  try {
    const params = new URLSearchParams({
      search: query,
      per_page: String(Math.min(maxResults, 25)),
      sort: 'relevance_score:desc',
      select: 'id,title,doi,publication_year,cited_by_count,open_access,authorships,primary_location,abstract_inverted_index',
    });

    const response = await fetch(
      `https://api.openalex.org/works?${params}`,
      {
        headers: {
          'User-Agent': 'JusticeHub/1.0 (mailto:benjamin@act.place)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) {
      console.warn(`[OpenAlex] HTTP ${response.status}`);
      return [];
    }

    const data = await response.json() as {
      results?: OpenAlexWork[];
    };

    return (data.results || []).map(work => ({
      title: work.title || '',
      url: work.doi ? `https://doi.org/${work.doi.replace('https://doi.org/', '')}` : work.id || '',
      doi: work.doi ? work.doi.replace('https://doi.org/', '') : null,
      authors: (work.authorships || [])
        .slice(0, 5)
        .map(a => a.author?.display_name || '')
        .filter(Boolean),
      year: work.publication_year || null,
      abstract: reconstructAbstract(work.abstract_inverted_index),
      cited_by_count: work.cited_by_count || 0,
      source: work.primary_location?.source?.display_name || null,
      open_access: work.open_access?.is_oa || false,
    }));
  } catch (err) {
    console.warn(`[OpenAlex] Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    return [];
  }
}

/**
 * Search OpenAlex with filters for Australian youth justice specifically.
 */
export async function searchAustralianYouthJusticeResearch(
  topic: string,
  yearFrom = 2018,
  maxResults = 10,
): Promise<ResearchPaper[]> {
  try {
    // Use concept filtering + text search for best results
    const filter = [
      `from_publication_date:${yearFrom}-01-01`,
      'authorships.countries:AU', // Australian authors
    ].join(',');

    const params = new URLSearchParams({
      search: `${topic} youth justice Australia`,
      filter,
      per_page: String(Math.min(maxResults, 25)),
      sort: 'cited_by_count:desc',
      select: 'id,title,doi,publication_year,cited_by_count,open_access,authorships,primary_location,abstract_inverted_index',
    });

    const response = await fetch(
      `https://api.openalex.org/works?${params}`,
      {
        headers: {
          'User-Agent': 'JusticeHub/1.0 (mailto:benjamin@act.place)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) {
      console.warn(`[OpenAlex AU] HTTP ${response.status}`);
      // Fall back to unfiltered search
      return searchOpenAlex(`${topic} youth justice Australia`, maxResults);
    }

    const data = await response.json() as { results?: OpenAlexWork[] };

    return (data.results || []).map(work => ({
      title: work.title || '',
      url: work.doi ? `https://doi.org/${work.doi.replace('https://doi.org/', '')}` : work.id || '',
      doi: work.doi ? work.doi.replace('https://doi.org/', '') : null,
      authors: (work.authorships || [])
        .slice(0, 5)
        .map(a => a.author?.display_name || '')
        .filter(Boolean),
      year: work.publication_year || null,
      abstract: reconstructAbstract(work.abstract_inverted_index),
      cited_by_count: work.cited_by_count || 0,
      source: work.primary_location?.source?.display_name || null,
      open_access: work.open_access?.is_oa || false,
    }));
  } catch (err) {
    console.warn(`[OpenAlex AU] Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    return searchOpenAlex(`${topic} youth justice Australia`, maxResults);
  }
}

// --- Internal types ---

interface OpenAlexWork {
  id?: string;
  title?: string;
  doi?: string;
  publication_year?: number;
  cited_by_count?: number;
  open_access?: { is_oa?: boolean };
  authorships?: { author?: { display_name?: string } }[];
  primary_location?: { source?: { display_name?: string } };
  abstract_inverted_index?: Record<string, number[]>;
}

/**
 * OpenAlex stores abstracts as inverted indexes.
 * Reconstruct the original text from word→positions mapping.
 */
function reconstructAbstract(
  invertedIndex: Record<string, number[]> | null | undefined,
): string | null {
  if (!invertedIndex || Object.keys(invertedIndex).length === 0) return null;

  const words: [number, string][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push([pos, word]);
    }
  }
  words.sort((a, b) => a[0] - b[0]);
  return words.map(w => w[1]).join(' ');
}
