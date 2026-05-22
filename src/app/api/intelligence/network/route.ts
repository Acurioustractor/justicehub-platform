import { createServiceClient } from '@/lib/supabase/service-lite';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/intelligence/network
 *
 * Entity Network Explorer API
 * Accepts: ?entity_id=UUID | ?abn=STRING | ?search=NAME | ?featured=true
 *
 * Returns the target entity and all direct connections (1-hop).
 */

interface NetworkNode {
  id: string;
  label: string;
  entity_type: string | null;
  state: string | null;
  abn: string | null;
  power_score: number | null;
  procurement_dollars: number | null;
  justice_dollars: number | null;
  donation_dollars: number | null;
  foundation_dollars: number | null;
  board_connections: number | null;
  alma_intervention_count: number | null;
  jh_org_id: string | null;
  jh_org_slug: string | null;
  is_center: boolean;
}

interface NetworkEdge {
  source: string;
  target: string;
  relationship_type: string;
  dollar_amount: number | null;
  description: string | null;
}

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  const entityId = searchParams.get('entity_id');
  const abn = searchParams.get('abn');
  const search = searchParams.get('search');
  const featured = searchParams.get('featured');

  try {
    // --- Featured entities (landing page) ---
    if (featured === 'true') {
      // Get GS entities that have ALMA interventions via JH organizations
      const { data: featuredEntities, error } = await supabase.rpc('get_featured_network_entities').limit(12);

      if (error) {
        // Fallback: just get entities with most relationships
        const { data: fallback } = await supabase
          .from('gs_entities')
          .select('id, canonical_name, entity_type, state, latest_revenue')
          .not('canonical_name', 'is', null)
          .order('latest_revenue', { ascending: false, nullsFirst: false })
          .limit(12);

        return NextResponse.json({
          type: 'featured',
          entities: (fallback || []).map((e: any) => ({
            id: e.id,
            name: e.canonical_name,
            entity_type: e.entity_type,
            state: e.state,
            power_score: null,
            alma_intervention_count: null,
          })),
        });
      }

      return NextResponse.json({
        type: 'featured',
        entities: (featuredEntities || []).map((e: any) => ({
          id: e.id,
          name: e.canonical_name || e.name,
          entity_type: e.entity_type,
          state: e.state,
          power_score: e.power_score ?? null,
          alma_intervention_count: e.alma_intervention_count ?? null,
        })),
      });
    }

    // --- Search mode (as-you-type) ---
    if (search) {
      const { data: searchResults, error } = await supabase
        .from('gs_entities')
        .select('id, canonical_name, entity_type, state, latest_revenue')
        .ilike('canonical_name', `%${search}%`)
        .not('canonical_name', 'is', null)
        .order('latest_revenue', { ascending: false, nullsFirst: false })
        .limit(10);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        type: 'search',
        results: (searchResults || []).map((e: any) => ({
          id: e.id,
          name: e.canonical_name,
          entity_type: e.entity_type,
          state: e.state,
          power_score: null,
          alma_intervention_count: null,
        })),
      });
    }

    // --- Entity network mode ---
    let resolvedEntityId = entityId;

    if (abn && !resolvedEntityId) {
      const { data: entity } = await supabase
        .from('gs_entities')
        .select('id')
        .eq('abn', abn)
        .limit(1)
        .single();

      if (entity) resolvedEntityId = entity.id;
    }

    if (!resolvedEntityId) {
      return NextResponse.json(
        { error: 'Provide entity_id, abn, or search parameter' },
        { status: 400 }
      );
    }

    // Fetch the center entity
    const { data: centerEntity } = await supabase
      .from('gs_entities')
      .select('id, canonical_name, abn, entity_type, state, latest_revenue')
      .eq('id', resolvedEntityId)
      .single();

    if (!centerEntity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    // Check for JH org match
    const { data: jhOrg } = await supabase
      .from('organizations')
      .select('id, slug')
      .eq('gs_entity_id', resolvedEntityId)
      .limit(1)
      .single();

    // Build center node
    const centerNode: NetworkNode = {
      id: centerEntity.id,
      label: centerEntity.canonical_name || 'Unknown',
      entity_type: centerEntity.entity_type,
      state: centerEntity.state,
      abn: centerEntity.abn,
      power_score: null,
      procurement_dollars: null,
      justice_dollars: null,
      donation_dollars: null,
      foundation_dollars: null,
      board_connections: null,
      alma_intervention_count: null,
      jh_org_id: jhOrg?.id ?? null,
      jh_org_slug: jhOrg?.slug ?? null,
      is_center: true,
    };

    // Fetch relationships where this entity is source or target
    const [{ data: outRels }, { data: inRels }] = await Promise.all([
      supabase
        .from('gs_relationships')
        .select('id, source_entity_id, target_entity_id, relationship_type, amount, properties')
        .eq('source_entity_id', resolvedEntityId)
        .limit(25),
      supabase
        .from('gs_relationships')
        .select('id, source_entity_id, target_entity_id, relationship_type, amount, properties')
        .eq('target_entity_id', resolvedEntityId)
        .limit(25),
    ]);

    const allRels = [...(outRels || []), ...(inRels || [])];

    // Collect unique connected entity IDs
    const connectedIds = new Set<string>();
    for (const rel of allRels) {
      if (rel.source_entity_id !== resolvedEntityId) {
        connectedIds.add(rel.source_entity_id);
      }
      if (rel.target_entity_id !== resolvedEntityId) {
        connectedIds.add(rel.target_entity_id);
      }
    }

    // Fetch connected entities in bulk
    const connectedIdArray = Array.from(connectedIds);
    let connectedEntities: any[] = [];
    let connectedJhOrgs: any[] = [];

    if (connectedIdArray.length > 0) {
      const chunks = [];
      for (let i = 0; i < connectedIdArray.length; i += 50) {
        chunks.push(connectedIdArray.slice(i, i + 50));
      }

      const entityResults = await Promise.all(
        chunks.map((chunk) =>
          supabase
            .from('gs_entities')
            .select('id, canonical_name, abn, entity_type, state')
            .in('id', chunk)
        )
      );
      connectedEntities = entityResults.flatMap((r) => r.data || []);

      const jhOrgResults = await Promise.all(
        chunks.map((chunk) =>
          supabase
            .from('organizations')
            .select('id, slug, gs_entity_id')
            .in('gs_entity_id', chunk)
        )
      );
      connectedJhOrgs = jhOrgResults.flatMap((r) => r.data || []);
    }

    // Build lookup maps
    const entityMap = new Map(connectedEntities.map((e: any) => [e.id, e]));
    const jhOrgMap = new Map(connectedJhOrgs.map((o: any) => [o.gs_entity_id, o]));

    // Build nodes
    const nodes: NetworkNode[] = [centerNode];
    for (const id of connectedIdArray) {
      const entity = entityMap.get(id);
      const jh = jhOrgMap.get(id);

      nodes.push({
        id,
        label: entity?.canonical_name || 'Unknown',
        entity_type: entity?.entity_type ?? null,
        state: entity?.state ?? null,
        abn: entity?.abn ?? null,
        power_score: null,
        procurement_dollars: null,
        justice_dollars: null,
        donation_dollars: null,
        foundation_dollars: null,
        board_connections: null,
        alma_intervention_count: null,
        jh_org_id: jh?.id ?? null,
        jh_org_slug: jh?.slug ?? null,
        is_center: false,
      });
    }

    // Build edges
    const edges: NetworkEdge[] = allRels.map((rel: any) => ({
      source: rel.source_entity_id,
      target: rel.target_entity_id,
      relationship_type: rel.relationship_type || 'unknown',
      dollar_amount: rel.amount ?? null,
      description: null,
    }));

    return NextResponse.json({
      type: 'network',
      center_entity_id: resolvedEntityId,
      nodes,
      edges,
    });
  } catch (err: any) {
    console.error('[network API]', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
