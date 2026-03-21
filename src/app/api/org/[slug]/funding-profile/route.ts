import { createServiceClient } from '@/lib/supabase/service-lite';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

/**
 * GET /api/org/[slug]/funding-profile
 *
 * Returns unified funding picture for an organization:
 * - JusticeHub justice_funding records (QLD grants, NIAA, budget SDS, etc.)
 * - GrantScope contracts (AusTender federal contracts)
 * - GrantScope grants (grant_opportunities)
 * - GrantScope donations (AEC political donations)
 * - ACNC enrichment data
 * - Board/person data from GS person_roles
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createServiceClient();

  try {
    // Find the org by slug
    // Try slug first, then name (many orgs have no slug)
    let org: Record<string, unknown> | null = null;
    const selectCols = 'id, name, slug, abn, gs_entity_id, acnc_data, website, description, logo_url, state';

    const { data: bySlug } = await supabase
      .from('organizations')
      .select(selectCols)
      .eq('slug', slug)
      .maybeSingle();

    if (bySlug) {
      org = bySlug;
    } else {
      // Try URL-decoded name match (slugified: "life-without-barriers" -> "Life Without Barriers")
      const nameGuess = decodeURIComponent(slug).replace(/-/g, ' ');
      const { data: byName } = await supabase
        .from('organizations')
        .select(selectCols)
        .ilike('name', nameGuess)
        .maybeSingle();
      org = byName;
    }

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Run all queries in parallel
    const queries: Promise<unknown>[] = [
      // 1. JusticeHub justice_funding records
      supabase
        .from('justice_funding')
        .select('id, recipient_name, amount_dollars, source, program_name, funding_type, project_description, financial_year, state')
        .eq('alma_organization_id', org.id)
        .order('amount_dollars', { ascending: false })
        .limit(100),

      // 2. ALMA interventions linked to this org
      supabase
        .from('alma_interventions')
        .select('id, name, type, service_role, evidence_level, geography, estimated_annual_capacity, cost_per_young_person, current_funding')
        .eq('operating_organization_id', org.id)
        .neq('verification_status', 'ai_generated'),
    ];

    // 3-5. GS relationships (only if org has gs_entity_id)
    if (org.gs_entity_id) {
      // Contracts where this org is target (receives) or source (pays)
      queries.push(
        supabase
          .from('gs_relationships')
          .select(`
            id, relationship_type, amount, year, dataset, start_date, end_date, properties,
            source_entity:gs_entities!gs_relationships_source_entity_id_fkey(canonical_name, abn, entity_type),
            target_entity:gs_entities!gs_relationships_target_entity_id_fkey(canonical_name, abn, entity_type)
          `)
          .or(`source_entity_id.eq.${org.gs_entity_id},target_entity_id.eq.${org.gs_entity_id}`)
          .order('amount', { ascending: false, nullsFirst: false })
          .limit(200)
      );

      // Person roles for this entity
      queries.push(
        supabase
          .from('person_roles')
          .select('person_name, role_title, start_date, end_date, dataset')
          .eq('entity_id', org.gs_entity_id)
          .order('start_date', { ascending: false, nullsFirst: false })
          .limit(50)
      );
    }

    const results = await Promise.all(queries);

    const [fundingResult, interventionsResult] = results as [
      { data: unknown[] | null },
      { data: unknown[] | null },
    ];

    const gsRelationships = org.gs_entity_id ? (results[2] as { data: unknown[] | null })?.data || [] : [];
    const personRoles = org.gs_entity_id ? (results[3] as { data: unknown[] | null })?.data || [] : [];

    // Categorize GS relationships
    const contracts = (gsRelationships as Record<string, unknown>[]).filter((r) => r.relationship_type === 'contract');
    const grants = (gsRelationships as Record<string, unknown>[]).filter((r) => r.relationship_type === 'grant');
    const donations = (gsRelationships as Record<string, unknown>[]).filter((r) => r.relationship_type === 'donation');
    const lobbying = (gsRelationships as Record<string, unknown>[]).filter((r) => r.relationship_type === 'lobbies_for');

    // Calculate totals
    const jhFunding = fundingResult?.data || [];
    const jhTotal = (jhFunding as { amount_dollars: number }[]).reduce((s, f) => s + (f.amount_dollars || 0), 0);
    const contractTotal = contracts.reduce((s, c) => s + (Number((c as Record<string, unknown>).amount) || 0), 0);
    const grantTotal = grants.reduce((s, g) => s + (Number((g as Record<string, unknown>).amount) || 0), 0);
    const donationTotal = donations.reduce((s, d) => s + (Number((d as Record<string, unknown>).amount) || 0), 0);

    return NextResponse.json({
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        abn: org.abn,
        website: org.website,
        description: org.description,
        logo_url: org.logo_url,
        state: org.state,
        acnc: org.acnc_data,
        has_gs_link: !!org.gs_entity_id,
      },
      summary: {
        total_known_funding: jhTotal + contractTotal + grantTotal,
        justice_funding_total: jhTotal,
        justice_funding_count: jhFunding.length,
        federal_contracts_total: contractTotal,
        federal_contracts_count: contracts.length,
        grants_total: grantTotal,
        grants_count: grants.length,
        political_donations_total: donationTotal,
        political_donations_count: donations.length,
        lobbying_count: lobbying.length,
        interventions_count: (interventionsResult?.data || []).length,
        board_members_count: personRoles.length,
      },
      justice_funding: jhFunding,
      interventions: interventionsResult?.data || [],
      federal_contracts: contracts,
      grants,
      political_donations: donations,
      lobbying,
      board_members: personRoles,
    });
  } catch (error) {
    console.error('Org funding profile error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
