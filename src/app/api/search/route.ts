import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Unified Search API
 *
 * Searches across all JusticeHub entities:
 * - Interventions/Programs (alma_interventions)
 * - Services (services)
 * - People (public_profiles)
 * - Organizations (organizations)
 *
 * Query params:
 * - q: search query (required)
 * - type: entity type filter (optional: intervention, service, person, organization, all)
 * - state: state filter (optional: NSW, VIC, QLD, WA, SA, TAS, ACT, NT, National)
 * - limit: max results per type (default: 10)
 */

export interface SearchResult {
  type: 'intervention' | 'service' | 'person' | 'organization';
  id: string;
  name: string;
  description?: string;
  url: string;
  state?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  counts: {
    interventions: number;
    services: number;
    people: number;
    organizations: number;
    total: number;
  };
  timing_ms: number;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('q');
  const typeFilter = searchParams.get('type') || 'all';
  const stateFilter = searchParams.get('state');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required and must be at least 2 characters' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const results: SearchResult[] = [];
  const counts = {
    interventions: 0,
    services: 0,
    people: 0,
    organizations: 0,
    total: 0,
  };

  const searchTerm = query.trim().toLowerCase();

  // Search interventions/programs
  if (typeFilter === 'all' || typeFilter === 'intervention') {
    let interventionQuery = supabase
      .from('alma_interventions')
      .select('id, name, description, intervention_type, metadata', { count: 'exact' })
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

    if (stateFilter) {
      interventionQuery = interventionQuery.contains('metadata', { state: stateFilter });
    }

    const { data: interventions, count } = await interventionQuery.limit(limit);

    counts.interventions = count || 0;

    if (interventions) {
      interventions.forEach(item => {
        results.push({
          type: 'intervention',
          id: item.id,
          name: item.name,
          description: item.description?.substring(0, 200),
          url: `/intelligence/interventions/${item.id}`,
          state: item.metadata?.state as string | undefined,
          metadata: {
            intervention_type: item.intervention_type,
          },
        });
      });
    }
  }

  // Search services
  if (typeFilter === 'all' || typeFilter === 'service') {
    let serviceQuery = supabase
      .from('services')
      .select('id, name, description, location_state, category', { count: 'exact' })
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

    if (stateFilter) {
      serviceQuery = serviceQuery.eq('location_state', stateFilter);
    }

    const { data: services, count } = await serviceQuery.limit(limit);

    counts.services = count || 0;

    if (services) {
      services.forEach(item => {
        results.push({
          type: 'service',
          id: item.id,
          name: item.name,
          description: item.description?.substring(0, 200),
          url: `/services/${item.id}`,
          state: item.location_state,
          metadata: {
            category: item.category,
          },
        });
      });
    }
  }

  // Search people
  if (typeFilter === 'all' || typeFilter === 'person') {
    let peopleQuery = supabase
      .from('public_profiles')
      .select('id, full_name, slug, bio, role', { count: 'exact' })
      .eq('is_public', true)
      .or(`full_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`);

    const { data: people, count } = await peopleQuery.limit(limit);

    counts.people = count || 0;

    if (people) {
      people.forEach(item => {
        results.push({
          type: 'person',
          id: item.id,
          name: item.full_name,
          description: item.bio?.substring(0, 200),
          url: `/people/${item.slug || item.id}`,
          metadata: {
            role: item.role,
          },
        });
      });
    }
  }

  // Search organizations
  if (typeFilter === 'all' || typeFilter === 'organization') {
    let orgQuery = supabase
      .from('organizations')
      .select('id, name, slug, description, type, location_state', { count: 'exact' })
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

    if (stateFilter) {
      orgQuery = orgQuery.eq('location_state', stateFilter);
    }

    const { data: organizations, count } = await orgQuery.limit(limit);

    counts.organizations = count || 0;

    if (organizations) {
      organizations.forEach(item => {
        results.push({
          type: 'organization',
          id: item.id,
          name: item.name,
          description: item.description?.substring(0, 200),
          url: `/organizations/${item.slug || item.id}`,
          state: item.location_state,
          metadata: {
            type: item.type,
          },
        });
      });
    }
  }

  counts.total = counts.interventions + counts.services + counts.people + counts.organizations;

  const response: SearchResponse = {
    query: query,
    results,
    counts,
    timing_ms: Date.now() - startTime,
  };

  return NextResponse.json(response);
}
