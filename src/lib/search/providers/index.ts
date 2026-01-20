/**
 * Search Providers Index
 *
 * Following Dexter's pattern: centralized exports for all search providers.
 * Add new providers here to make them available to the unified search.
 */

export { internalSearchProvider } from './internal';
export { empathyLedgerSearchProvider } from './empathy-ledger';

// Re-export types
export type { SearchProvider } from '../types';
