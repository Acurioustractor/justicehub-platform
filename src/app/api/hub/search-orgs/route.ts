import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hub/search-orgs?q=name-or-abn&state=NSW
 *
 * Search JusticeHub organizations and CivicGraph entities for the claim flow.
 * Requires authentication.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const state = searchParams.get('state');

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const service = createServiceClient() as any;
  const cleanQuery = q.trim();
  const cleanAbn = cleanQuery.replace(/\s/g, '');
  const isAbn = /^\d{11}$/.test(cleanAbn);

  let query = service
    .from('organizations')
    .select('id, name, slug, state, city, abn, gs_entity_id')
    .eq('is_active', true)
    .order('name')
    .limit(10);

  query = isAbn ? query.eq('abn', cleanAbn) : query.ilike('name', `%${cleanQuery}%`);

  if (state) {
    query = query.eq('state', state);
  }

  const { data: justiceHubOrgs, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = (justiceHubOrgs || []).map((org: any) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    state: org.state,
    city: org.city,
    abn: org.abn,
    gs_entity_id: org.gs_entity_id,
    source: 'justicehub',
  }));

  const existingAbns = new Set(results.map((org: any) => org.abn).filter(Boolean));
  const existingGsIds = new Set(results.map((org: any) => org.gs_entity_id).filter(Boolean));

  if (results.length < 10) {
    let entityQuery = service
      .from('gs_entities')
      .select('id, gs_id, canonical_name, abn, entity_type, state, lga_name, website, description, is_community_controlled')
      .order('source_count', { ascending: false, nullsFirst: false })
      .limit(10 - results.length);

    entityQuery = isAbn
      ? entityQuery.eq('abn', cleanAbn)
      : entityQuery.ilike('canonical_name', `%${cleanQuery}%`);

    if (state) {
      entityQuery = entityQuery.eq('state', state);
    }

    const { data: civicGraphEntities, error: entityError } = await entityQuery;
    if (entityError) {
      return NextResponse.json({ error: entityError.message }, { status: 500 });
    }

    for (const entity of civicGraphEntities || []) {
      if (entity.abn && existingAbns.has(entity.abn)) continue;
      if (entity.id && existingGsIds.has(entity.id)) continue;

      results.push({
        id: entity.id,
        name: entity.canonical_name,
        slug: null,
        state: entity.state,
        city: entity.lga_name,
        abn: entity.abn,
        gs_entity_id: entity.id,
        gs_id: entity.gs_id,
        entity_type: entity.entity_type,
        website: entity.website,
        description: entity.description,
        is_community_controlled: entity.is_community_controlled,
        source: 'civicgraph',
      });
    }
  }

  return NextResponse.json({ results });
}
