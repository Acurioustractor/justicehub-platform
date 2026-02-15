/**
 * Internal Search Provider
 *
 * Searches JusticeHub's Supabase database across:
 * - Interventions/Programs (alma_interventions)
 * - Services
 * - People (public_profiles)
 * - Organizations
 */

import { createServiceClient } from '@/lib/supabase/service';
import type { SearchProvider, SearchResult, JusticeSearchContext } from '../types';

/**
 * Escape special ILIKE characters to prevent SQL injection
 * This prevents users from injecting wildcards that alter query behavior
 */
function sanitizeSearchTerm(term: string): string {
  return term
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/%/g, '\\%')     // Escape % wildcards
    .replace(/_/g, '\\_');    // Escape _ single-char wildcards
}

const DESCRIPTION_PREVIEW_LENGTH = 200;

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export const internalSearchProvider: SearchProvider = {
  name: 'justicehub-internal',

  async isAvailable() {
    try {
      const supabase = createServiceClient();
      const { error } = await supabase.from('organizations').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  async search(query: string, context?: JusticeSearchContext): Promise<SearchResult[]> {
    const supabase = createServiceClient();
    const results: SearchResult[] = [];
    // Sanitize input to prevent SQL injection via ILIKE wildcards
    const searchTerm = sanitizeSearchTerm(query.trim().toLowerCase());
    const limit = context?.limit || 10;
    const entityTypes = context?.entityTypes || ['intervention', 'service', 'organization', 'person'];

    // Parallel search across all entity types
    const searches = await Promise.allSettled([
      // Interventions/Programs
      entityTypes.includes('intervention')
        ? searchInterventions(supabase, searchTerm, context, limit)
        : Promise.resolve([]),

      // Services
      entityTypes.includes('service')
        ? searchServices(supabase, searchTerm, context, limit)
        : Promise.resolve([]),

      // Organizations
      entityTypes.includes('organization')
        ? searchOrganizations(supabase, searchTerm, context, limit)
        : Promise.resolve([]),

      // People
      entityTypes.includes('person')
        ? searchPeople(supabase, searchTerm, context, limit)
        : Promise.resolve([]),
    ]);

    // Collect successful results
    for (const result of searches) {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      }
    }

    // Sort by relevance score
    return results.sort((a, b) => b.score - a.score);
  },
};

async function searchInterventions(
  supabase: ReturnType<typeof createServiceClient>,
  searchTerm: string,
  context: JusticeSearchContext | undefined,
  limit: number
): Promise<SearchResult[]> {
  let query = supabase
    .from('alma_interventions')
    .select('id, name, description, type, metadata')
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .limit(limit);

  if (context?.state) {
    query = query.contains('metadata', { state: context.state });
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((item: any) => ({
    id: item.id,
    type: 'intervention' as const,
    title: item.name || 'Intervention',
    description: asOptionalString(item.description)?.substring(0, DESCRIPTION_PREVIEW_LENGTH),
    url: `/intelligence/interventions/${item.id}`,
    score: calculateScore(searchTerm, item.name, item.description),
    source: { name: 'justicehub', table: 'alma_interventions' },
    metadata: {
      state: asOptionalString((item.metadata as Record<string, unknown> | null)?.state),
      category: asOptionalString(item.type),
    },
  }));
}

async function searchServices(
  supabase: ReturnType<typeof createServiceClient>,
  searchTerm: string,
  context: JusticeSearchContext | undefined,
  limit: number
): Promise<SearchResult[]> {
  let query = supabase
    .from('services')
    .select('id, name, description, location_state, service_type')
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .limit(limit);

  if (context?.state) {
    query = query.eq('location_state', context.state);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((item: any) => ({
    id: item.id,
    type: 'service' as const,
    title: item.name || 'Service',
    description: asOptionalString(item.description)?.substring(0, DESCRIPTION_PREVIEW_LENGTH),
    url: `/services/${item.id}`,
    score: calculateScore(searchTerm, item.name, item.description),
    source: { name: 'justicehub', table: 'services' },
    metadata: {
      state: asOptionalString(item.location_state),
      category: asOptionalString(item.service_type),
    },
  }));
}

async function searchOrganizations(
  supabase: ReturnType<typeof createServiceClient>,
  searchTerm: string,
  context: JusticeSearchContext | undefined,
  limit: number
): Promise<SearchResult[]> {
  let query = supabase
    .from('organizations')
    .select('id, name, slug, description, type, location, logo_url')
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .limit(limit);

  if (context?.state) {
    query = query.ilike('location', `%${context.state}%`);
  }

  if (context?.organizationId) {
    query = query.eq('id', context.organizationId);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((item: any) => ({
    id: item.id,
    type: 'organization' as const,
    title: item.name || 'Organization',
    description: asOptionalString(item.description)?.substring(0, DESCRIPTION_PREVIEW_LENGTH),
    url: `/organizations/${item.slug || item.id}`,
    score: calculateScore(searchTerm, item.name, item.description),
    source: { name: 'justicehub', table: 'organizations' },
    metadata: {
      state: asOptionalString(item.location),
      category: asOptionalString(item.type),
      imageUrl: asOptionalString(item.logo_url),
    },
  }));
}

async function searchPeople(
  supabase: ReturnType<typeof createServiceClient>,
  searchTerm: string,
  context: JusticeSearchContext | undefined,
  limit: number
): Promise<SearchResult[]> {
  const query = supabase
    .from('public_profiles')
    .select('id, full_name, slug, bio, role_tags, photo_url')
    .eq('is_public', true)
    .or(`full_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
    .limit(limit);

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((item: any) => ({
    id: item.id,
    type: 'person' as const,
    title: item.full_name,
    description: item.bio?.substring(0, 200),
    url: `/people/${item.slug || item.id}`,
    score: calculateScore(searchTerm, item.full_name, item.bio),
    source: { name: 'justicehub', table: 'public_profiles' },
    metadata: {
      category: Array.isArray(item.role_tags) ? asOptionalString(item.role_tags[0]) : undefined,
      imageUrl: asOptionalString(item.photo_url),
    },
  }));
}

/**
 * Calculate relevance score based on match quality
 */
function calculateScore(
  searchTerm: string,
  title: string | null,
  description: string | null
): number {
  let score = 0;
  const term = searchTerm.toLowerCase();
  const titleLower = (title || '').toLowerCase();
  const descLower = (description || '').toLowerCase();

  // Exact title match
  if (titleLower === term) {
    score += 1.0;
  }
  // Title starts with term
  else if (titleLower.startsWith(term)) {
    score += 0.8;
  }
  // Title contains term
  else if (titleLower.includes(term)) {
    score += 0.6;
  }

  // Description contains term
  if (descLower.includes(term)) {
    score += 0.3;
  }

  // Word boundary bonus
  const termWords = term.split(/\s+/);
  const matchedWords = termWords.filter(
    (word) => titleLower.includes(word) || descLower.includes(word)
  );
  score += (matchedWords.length / termWords.length) * 0.2;

  return Math.min(score, 1.0);
}
