/**
 * Unified Justice Search
 *
 * Following Dexter's pattern of consolidating multiple search tools
 * into a single, intelligent search interface.
 *
 * Instead of the LLM calling 20+ separate tools, it calls one search
 * function that intelligently routes across data sources.
 */

import type {
  UnifiedSearchOptions,
  UnifiedSearchResponse,
  SearchResult,
  SearchFacets,
  SearchResultType,
  JusticeSearchContext,
} from './types';
import { buildSearchContext, cleanQuery } from './intent-detector';
import { internalSearchProvider, empathyLedgerSearchProvider } from './providers';

/**
 * Main entry point for unified search
 *
 * Usage:
 * ```typescript
 * const results = await createJusticeSearch().search('healing programs in NSW');
 * ```
 */
export function createJusticeSearch() {
  return {
    /**
     * Search across all configured data sources
     */
    search: async (
      query: string,
      options?: Partial<UnifiedSearchOptions>
    ): Promise<UnifiedSearchResponse> => {
      const startTime = Date.now();
      const sourceTiming: Record<string, number> = {};

      // Build context from query analysis
      const detectedContext = buildSearchContext(query);
      const context: JusticeSearchContext = {
        ...detectedContext,
        ...options?.context,
        limit: options?.context?.limit || 20,
      };

      // Clean query for better matching
      const cleanedQuery = cleanQuery(query);

      // Determine which sources to search
      const sources = {
        internal: options?.sources?.internal ?? true,
        empathyLedger: options?.sources?.empathyLedger ?? true,
        external: options?.sources?.external ?? false,
      };

      // Collect results from all sources in parallel
      const searchPromises: Promise<{ source: string; results: SearchResult[] }>[] = [];

      if (sources.internal) {
        searchPromises.push(
          (async () => {
            const sourceStart = Date.now();
            const results = await internalSearchProvider.search(cleanedQuery, context);
            sourceTiming['internal'] = Date.now() - sourceStart;
            return { source: 'internal', results };
          })()
        );
      }

      if (sources.empathyLedger) {
        searchPromises.push(
          (async () => {
            const sourceStart = Date.now();
            try {
              const results = await empathyLedgerSearchProvider.search(cleanedQuery, context);
              sourceTiming['empathy-ledger'] = Date.now() - sourceStart;
              return { source: 'empathy-ledger', results };
            } catch (error) {
              console.warn('Empathy Ledger search failed, continuing with other sources:', error);
              sourceTiming['empathy-ledger'] = Date.now() - sourceStart;
              return { source: 'empathy-ledger', results: [] };
            }
          })()
        );
      }

      // Wait for all searches to complete
      const searchResults = await Promise.allSettled(searchPromises);

      // Merge and dedupe results, track failed sources
      const allResults: SearchResult[] = [];
      const failedSources: string[] = [];

      for (const result of searchResults) {
        if (result.status === 'fulfilled') {
          allResults.push(...result.value.results);
        } else {
          // Track failed source for user warning
          failedSources.push('unknown source');
          console.error('Search source failed:', result.reason);
        }
      }

      // Sort by score and dedupe by ID
      const sortedResults = dedupeAndSort(allResults);

      // Apply pagination
      const page = context.page || 1;
      const limit = context.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedResults = sortedResults.slice(startIndex, startIndex + limit);

      // Build facets
      const facets = buildFacets(sortedResults);

      // Generate suggestions for related searches
      const suggestions = generateSuggestions(query, detectedContext.intent || 'general');

      // Build warnings for failed sources
      const warnings = failedSources.length > 0
        ? [`Some search sources unavailable: ${failedSources.join(', ')}. Results may be incomplete.`]
        : undefined;

      return {
        query,
        intent: detectedContext.intent || 'general',
        results: paginatedResults,
        facets,
        pagination: {
          page,
          limit,
          total: sortedResults.length,
          hasMore: startIndex + limit < sortedResults.length,
        },
        timing: {
          total_ms: Date.now() - startTime,
          sources: sourceTiming,
        },
        suggestions,
        warnings,
      };
    },

    /**
     * Quick search for autocomplete (faster, fewer results)
     */
    quickSearch: async (query: string): Promise<SearchResult[]> => {
      if (query.length < 2) return [];

      const context = buildSearchContext(query);
      const cleanedQuery = cleanQuery(query);

      // Only search internal for speed
      const results = await internalSearchProvider.search(cleanedQuery, {
        ...context,
        limit: 5,
      });

      return results.slice(0, 5);
    },

    /**
     * Search within a specific organization
     */
    searchOrganization: async (
      orgId: string,
      query: string
    ): Promise<SearchResult[]> => {
      const context: JusticeSearchContext = {
        organizationId: orgId,
        limit: 20,
      };

      const [internal, media] = await Promise.all([
        internalSearchProvider.search(query, context),
        empathyLedgerSearchProvider.search(query, context),
      ]);

      return dedupeAndSort([...internal, ...media]);
    },

    /**
     * Check if all search providers are available
     */
    healthCheck: async (): Promise<Record<string, boolean>> => {
      const [internal, empathyLedger] = await Promise.all([
        internalSearchProvider.isAvailable(),
        empathyLedgerSearchProvider.isAvailable(),
      ]);

      return {
        internal,
        empathyLedger,
      };
    },
  };
}

/**
 * Deduplicate results by ID and sort by score
 */
function dedupeAndSort(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const deduped: SearchResult[] = [];

  for (const result of results) {
    const key = `${result.type}:${result.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(result);
    }
  }

  return deduped.sort((a, b) => b.score - a.score);
}

/**
 * Build search facets from results
 */
function buildFacets(results: SearchResult[]): SearchFacets {
  const byType: Record<SearchResultType, number> = {
    intervention: 0,
    service: 0,
    person: 0,
    organization: 0,
    media: 0,
    story: 0,
    research: 0,
    news: 0,
  };

  const byState: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  for (const result of results) {
    byType[result.type]++;

    const state = result.metadata.state;
    if (state) {
      byState[state] = (byState[state] || 0) + 1;
    }

    bySource[result.source.name] = (bySource[result.source.name] || 0) + 1;
  }

  return {
    byType,
    byState,
    bySource,
    total: results.length,
  };
}

/**
 * Generate related search suggestions
 */
function generateSuggestions(query: string, intent: string): string[] {
  const suggestions: string[] = [];
  const terms = query.toLowerCase().split(/\s+/);

  // Intent-based suggestions
  switch (intent) {
    case 'find_program':
      suggestions.push(
        `${query} outcomes`,
        `${query} evaluation`,
        `similar programs to ${query}`
      );
      break;
    case 'find_organization':
      suggestions.push(
        `${query} programs`,
        `${query} team`,
        `${query} stories`
      );
      break;
    case 'find_person':
      suggestions.push(
        `${query} organization`,
        `${query} work`,
        `contact ${query}`
      );
      break;
    case 'find_media':
      suggestions.push(
        `${query} videos`,
        `${query} photos`,
        `${query} stories`
      );
      break;
    default:
      // Geographic expansion
      if (!terms.some((t) => ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'].includes(t))) {
        suggestions.push(`${query} in NSW`, `${query} national`);
      }
  }

  return suggestions.slice(0, 3);
}

// Export singleton for convenience
export const justiceSearch = createJusticeSearch();
