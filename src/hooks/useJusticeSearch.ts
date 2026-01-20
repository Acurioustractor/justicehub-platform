'use client';

/**
 * useJusticeSearch - React Hook for Unified Search
 *
 * Provides easy frontend integration with the unified search API.
 *
 * Usage:
 * ```tsx
 * const { results, search, quickSearch, isLoading, error, facets } = useJusticeSearch();
 *
 * // Full search
 * await search('healing programs in NSW');
 *
 * // Quick autocomplete
 * await quickSearch('heal');
 * ```
 */

import { useState, useCallback } from 'react';
import type {
  UnifiedSearchResponse,
  SearchResult,
  SearchFacets,
  SearchResultType,
  SearchIntent,
} from '@/lib/search/types';

export interface UseJusticeSearchOptions {
  /** Default entity types to search */
  defaultTypes?: SearchResultType[];
  /** Default state filter */
  defaultState?: string;
  /** Results per page */
  limit?: number;
  /** Auto-search on mount with initial query */
  initialQuery?: string;
}

export interface UseJusticeSearchReturn {
  // State
  results: SearchResult[];
  facets: SearchFacets | null;
  intent: SearchIntent | null;
  suggestions: string[];
  warnings: string[];
  isLoading: boolean;
  error: string | null;
  query: string;
  // Pagination
  page: number;
  total: number;
  hasMore: boolean;
  // Timing
  timing: { total_ms: number; sources: Record<string, number> } | null;
  // Actions
  search: (query: string, options?: SearchOptions) => Promise<void>;
  quickSearch: (query: string) => Promise<SearchResult[]>;
  loadMore: () => Promise<void>;
  reset: () => void;
  setFilters: (filters: SearchFilters) => void;
  // Filters
  filters: SearchFilters;
}

export interface SearchOptions {
  type?: SearchResultType;
  state?: string;
  elderApproved?: boolean;
  page?: number;
}

export interface SearchFilters {
  type?: SearchResultType;
  state?: string;
  elderApproved?: boolean;
}

export function useJusticeSearch(
  options: UseJusticeSearchOptions = {}
): UseJusticeSearchReturn {
  const { limit = 20 } = options;

  // State
  const [results, setResults] = useState<SearchResult[]>([]);
  const [facets, setFacets] = useState<SearchFacets | null>(null);
  const [intent, setIntent] = useState<SearchIntent | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [timing, setTiming] = useState<{ total_ms: number; sources: Record<string, number> } | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});

  /**
   * Full search with all features
   */
  const search = useCallback(
    async (searchQuery: string, searchOptions?: SearchOptions) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setError('Search query must be at least 2 characters');
        return;
      }

      setIsLoading(true);
      setError(null);
      setQuery(searchQuery);

      const currentPage = searchOptions?.page || 1;
      setPage(currentPage);

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          page: currentPage.toString(),
          limit: limit.toString(),
        });

        // Apply filters
        const activeType = searchOptions?.type || filters.type;
        const activeState = searchOptions?.state || filters.state;
        const activeElderApproved = searchOptions?.elderApproved ?? filters.elderApproved;

        if (activeType) params.append('type', activeType);
        if (activeState) params.append('state', activeState);
        if (activeElderApproved) params.append('elder_approved', 'true');

        const response = await fetch(`/api/intelligence/search?${params}`);

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data: UnifiedSearchResponse = await response.json();

        setResults(data.results);
        setFacets(data.facets);
        setIntent(data.intent);
        setSuggestions(data.suggestions || []);
        setWarnings(data.warnings || []);
        setTotal(data.pagination.total);
        setHasMore(data.pagination.hasMore);
        setTiming(data.timing);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [limit, filters]
  );

  /**
   * Quick search for autocomplete (returns results directly)
   */
  const quickSearch = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '5',
      });

      const response = await fetch(`/api/intelligence/search?${params}`);

      if (!response.ok) {
        return [];
      }

      const data: UnifiedSearchResponse = await response.json();
      return data.results;
    } catch {
      return [];
    }
  }, []);

  /**
   * Load more results (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !query) return;

    await search(query, { page: page + 1 });
  }, [hasMore, isLoading, query, page, search]);

  /**
   * Reset search state
   */
  const reset = useCallback(() => {
    setResults([]);
    setFacets(null);
    setIntent(null);
    setSuggestions([]);
    setWarnings([]);
    setError(null);
    setQuery('');
    setPage(1);
    setTotal(0);
    setHasMore(false);
    setTiming(null);
  }, []);

  /**
   * Update filters (triggers new search if query exists)
   */
  const updateFilters = useCallback(
    (newFilters: SearchFilters) => {
      setFilters(newFilters);
      if (query) {
        search(query, { ...newFilters, page: 1 });
      }
    },
    [query, search]
  );

  return {
    // State
    results,
    facets,
    intent,
    suggestions,
    warnings,
    isLoading,
    error,
    query,
    // Pagination
    page,
    total,
    hasMore,
    // Timing
    timing,
    // Actions
    search,
    quickSearch,
    loadMore,
    reset,
    setFilters: updateFilters,
    // Filters
    filters,
  };
}

// Type icons mapping for UI
export const RESULT_TYPE_ICONS: Record<SearchResultType, string> = {
  intervention: '🎯',
  service: '🏢',
  person: '👤',
  organization: '🏛️',
  media: '📷',
  story: '📖',
  research: '📊',
  news: '📰',
};

// Type labels for display
export const RESULT_TYPE_LABELS: Record<SearchResultType, string> = {
  intervention: 'Programs',
  service: 'Services',
  person: 'People',
  organization: 'Organizations',
  media: 'Media',
  story: 'Stories',
  research: 'Research',
  news: 'News',
};

// State options
export const AUSTRALIAN_STATES = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NT', label: 'Northern Territory' },
  { value: 'National', label: 'National' },
];
