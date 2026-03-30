import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/intelligence/alma-search
 *
 * Location-aware ALMA intervention search.
 * Searches intervention name/description AND org name/state/location.
 * Returns interventions with org details for richer results.
 *
 * Query params:
 *   q: search query (searches name, description, org name, org state)
 *   state: state filter (NSW, VIC, QLD, etc.)
 *   evidence: evidence level filter
 *   limit: max results (default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim().toLowerCase();
    const stateFilter = searchParams.get('state');
    const evidenceFilter = searchParams.get('evidence');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (!query || query.length < 2) {
      return NextResponse.json({ interventions: [], count: 0 });
    }

    const supabase = createServiceClient();

    // Search interventions joined with organizations for location data
    let interventionQuery = supabase
      .from('alma_interventions')
      .select(`
        id, name, description, type, evidence_level, cost_per_young_person,
        operating_organization_id,
        organizations!alma_interventions_operating_organization_id_fkey (
          id, name, slug, state, is_indigenous_org
        )
      `)
      .neq('verification_status', 'ai_generated')
      .limit(limit);

    // Build OR filter across intervention + org fields
    // Supabase doesn't support cross-table OR, so we do two queries
    const { data: byIntervention } = await supabase
      .from('alma_interventions')
      .select(`
        id, name, description, type, evidence_level, cost_per_young_person,
        organizations!alma_interventions_operating_organization_id_fkey (
          id, name, slug, state, is_indigenous_org
        )
      `)
      .neq('verification_status', 'ai_generated')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);

    // Search by org name/state
    const { data: matchingOrgs } = await supabase
      .from('organizations')
      .select('id, name, state')
      .or(`name.ilike.%${query}%,state.ilike.%${query}%`)
      .limit(50);

    const orgIds = matchingOrgs?.map(o => o.id) || [];

    let byOrg: any[] = [];
    if (orgIds.length > 0) {
      const { data } = await supabase
        .from('alma_interventions')
        .select(`
          id, name, description, type, evidence_level, cost_per_young_person,
          organizations!alma_interventions_operating_organization_id_fkey (
            id, name, slug, state, is_indigenous_org
          )
        `)
        .neq('verification_status', 'ai_generated')
        .in('operating_organization_id', orgIds)
        .limit(limit);
      byOrg = data || [];
    }

    // Merge and deduplicate
    const seen = new Set<string>();
    let results: any[] = [];

    for (const item of [...(byIntervention || []), ...byOrg]) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);

      const org = Array.isArray(item.organizations) ? item.organizations[0] : item.organizations;

      // Apply state filter
      if (stateFilter && org?.state !== stateFilter) continue;

      // Apply evidence filter
      if (evidenceFilter && item.evidence_level && !item.evidence_level.toLowerCase().includes(evidenceFilter.toLowerCase())) continue;

      results.push({
        id: item.id,
        name: item.name,
        description: item.description?.substring(0, 300),
        type: item.type,
        evidence_level: item.evidence_level,
        cost_per_young_person: item.cost_per_young_person,
        state: org?.state,
        organization_name: org?.name,
        organization_slug: org?.slug,
        is_indigenous_org: org?.is_indigenous_org,
      });
    }

    // Sort: exact matches first, then by evidence level
    const evidenceOrder: Record<string, number> = {
      'Proven': 0, 'Effective': 1, 'Promising': 2, 'Indigenous-led': 3, 'Untested': 4,
    };
    results.sort((a, b) => {
      const aMatch = a.name.toLowerCase().includes(query) ? 0 : 1;
      const bMatch = b.name.toLowerCase().includes(query) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      const aEv = evidenceOrder[a.evidence_level?.split(' ')[0] || 'Untested'] ?? 5;
      const bEv = evidenceOrder[b.evidence_level?.split(' ')[0] || 'Untested'] ?? 5;
      return aEv - bEv;
    });

    return NextResponse.json({
      interventions: results.slice(0, limit),
      count: results.length,
      query,
    });
  } catch (err: any) {
    console.error('ALMA search error:', err);
    return NextResponse.json({ interventions: [], count: 0, error: err.message });
  }
}
