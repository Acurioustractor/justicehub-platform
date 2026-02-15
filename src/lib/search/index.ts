/**
 * JusticeHub Unified Search
 *
 * Single entry point for all search functionality.
 * Inspired by Dexter's pattern of consolidating 20+ tools into one search interface.
 *
 * Usage:
 * ```typescript
 * import { justiceSearch } from '@/lib/search';
 *
 * // Full search
 * const results = await justiceSearch.search('healing programs in NSW');
 *
 * // Quick autocomplete
 * const suggestions = await justiceSearch.quickSearch('heal');
 *
 * // Organization-specific search
 * const orgResults = await justiceSearch.searchOrganization(orgId, 'mentoring');
 * ```
 */

export { createJusticeSearch, justiceSearch } from './unified-search';
export * from './types';
export * from './intent-detector';
export * from './providers';
