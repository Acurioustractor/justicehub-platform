/**
 * JusticeHub Unified Search - Type Definitions
 *
 * Following Dexter's pattern of consolidating multiple search tools
 * into a single, extensible search interface.
 */

// Search result types across all data sources
export type SearchResultType =
  | 'intervention'
  | 'service'
  | 'person'
  | 'organization'
  | 'media'
  | 'story'
  | 'research'
  | 'news';

// Base search result interface
export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  url: string;
  score: number; // Relevance score 0-1
  source: SearchSource;
  metadata: SearchResultMetadata;
  highlights?: string[]; // Matched text snippets
}

// Source tracking for results
export interface SearchSource {
  name: 'justicehub' | 'empathy-ledger' | 'external';
  table?: string;
  api?: string;
}

// Common metadata fields
export interface SearchResultMetadata {
  state?: string;
  organizationId?: string;
  organizationName?: string;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  elderApproved?: boolean;
  culturalSensitivity?: string;
  createdAt?: string;
  [key: string]: unknown;
}

// Search context for domain-aware queries
export interface JusticeSearchContext {
  // User intent detection
  intent?: SearchIntent;
  // Geographic scope
  state?: string;
  states?: string[];
  // Entity focus
  entityTypes?: SearchResultType[];
  // Cultural filters
  elderApprovedOnly?: boolean;
  culturalTags?: string[];
  // Organization context
  organizationId?: string;
  // Pagination
  page?: number;
  limit?: number;
}

// Detected search intents
export type SearchIntent =
  | 'find_program' // "healing programs", "diversion services"
  | 'find_person' // "who works at", "contact for"
  | 'find_organization' // "organizations in NSW"
  | 'find_media' // "videos about", "photos of"
  | 'find_research' // "evidence for", "outcomes of"
  | 'general'; // Default fallback

// Search options for the unified search
export interface UnifiedSearchOptions {
  query: string;
  context?: JusticeSearchContext;
  // Data source selection
  sources?: {
    internal?: boolean; // JusticeHub Supabase
    empathyLedger?: boolean; // EL Content Hub
    external?: boolean; // Research APIs, news
  };
  // Search mode
  mode?: 'fast' | 'comprehensive';
  // Include AI enhancements
  aiEnhanced?: boolean;
}

// Response from unified search
export interface UnifiedSearchResponse {
  query: string;
  intent: SearchIntent;
  results: SearchResult[];
  facets: SearchFacets;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  timing: {
    total_ms: number;
    sources: Record<string, number>;
  };
  suggestions?: string[]; // Related searches
  warnings?: string[]; // Source failures or degraded results
}

// Custom error types for better error handling
export class SearchError extends Error {
  constructor(
    message: string,
    public code: SearchErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SearchError';
  }
}

export enum SearchErrorCode {
  INVALID_QUERY = 'INVALID_QUERY',
  SOURCE_UNAVAILABLE = 'SOURCE_UNAVAILABLE',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Faceted search counts
export interface SearchFacets {
  byType: Record<SearchResultType, number>;
  byState: Record<string, number>;
  bySource: Record<string, number>;
  total: number;
}

// Individual search provider interface (following Dexter's tool pattern)
export interface SearchProvider {
  name: string;
  search: (query: string, context?: JusticeSearchContext) => Promise<SearchResult[]>;
  isAvailable: () => Promise<boolean>;
}
