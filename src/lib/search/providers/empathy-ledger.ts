/**
 * Empathy Ledger Search Provider
 *
 * Searches media content from Empathy Ledger Content Hub API:
 * - Photos
 * - Videos
 * - Stories
 */

import { empathyLedgerSync, type ELMediaItem } from '@/services/empathy-ledger-sync';
import type { SearchProvider, SearchResult, JusticeSearchContext } from '../types';

export const empathyLedgerSearchProvider: SearchProvider = {
  name: 'empathy-ledger',

  async isAvailable() {
    return empathyLedgerSync.healthCheck();
  },

  async search(query: string, context?: JusticeSearchContext): Promise<SearchResult[]> {
    const searchTerm = query.trim().toLowerCase();

    try {
      // Build search options from context
      const mediaType = detectMediaType(context?.entityTypes);

      const response = await empathyLedgerSync.fetchMedia({
        projectCode: 'justicehub',
        mediaType,
        elderApprovedOnly: context?.elderApprovedOnly,
        culturalTags: context?.culturalTags,
        limit: context?.limit || 20,
      });

      // Filter results that match the query
      const matchedMedia = response.media.filter((item) =>
        matchesQuery(item, searchTerm)
      );

      return matchedMedia.map((item) => mediaToSearchResult(item, searchTerm));
    } catch (error) {
      console.error('Empathy Ledger search error:', error);
      return [];
    }
  },
};

/**
 * Detect media type from entity types
 */
function detectMediaType(
  entityTypes?: string[]
): 'image' | 'video' | 'audio' | undefined {
  if (!entityTypes) return undefined;

  if (entityTypes.includes('media')) {
    return undefined; // All media types
  }

  // Check for specific media hints
  for (const type of entityTypes) {
    if (type === 'story') return 'video'; // Stories are often videos
  }

  return undefined;
}

/**
 * Check if media item matches search query
 */
function matchesQuery(item: ELMediaItem, searchTerm: string): boolean {
  const searchFields = [
    item.title,
    item.description,
    item.altText,
    ...(item.culturalTags || []),
  ].filter(Boolean);

  return searchFields.some((field) =>
    field?.toLowerCase().includes(searchTerm)
  );
}

/**
 * Convert EL media item to unified search result
 */
function mediaToSearchResult(item: ELMediaItem, searchTerm: string): SearchResult {
  return {
    id: item.id,
    type: item.mediaType === 'video' ? 'story' : 'media',
    title: item.title || 'Untitled Media',
    description: item.description?.substring(0, 200),
    url: item.url,
    score: calculateMediaScore(item, searchTerm),
    source: {
      name: 'empathy-ledger',
      api: '/api/v1/content-hub/media',
    },
    metadata: {
      mediaType: item.mediaType,
      imageUrl: item.thumbnailUrl || item.url,
      elderApproved: item.elderApproved,
      culturalSensitivity: item.culturalSensitivity || undefined,
      tags: item.culturalTags,
      organizationId: item.organizationId || undefined,
      createdAt: item.createdAt,
    },
  };
}

/**
 * Calculate relevance score for media
 */
function calculateMediaScore(item: ELMediaItem, searchTerm: string): number {
  let score = 0.5; // Base score

  const term = searchTerm.toLowerCase();
  const title = (item.title || '').toLowerCase();
  const description = (item.description || '').toLowerCase();

  // Title match
  if (title.includes(term)) {
    score += 0.3;
    if (title.startsWith(term)) score += 0.1;
  }

  // Description match
  if (description.includes(term)) {
    score += 0.2;
  }

  // Cultural tag match
  if (item.culturalTags?.some((tag) => tag.toLowerCase().includes(term))) {
    score += 0.2;
  }

  // Elder approved bonus
  if (item.elderApproved) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}
