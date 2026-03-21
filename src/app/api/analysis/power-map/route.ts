import { createServiceClient } from '@/lib/supabase/service-lite';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

/**
 * GET /api/analysis/power-map
 *
 * Returns the full power map of youth justice money flow:
 * - All JH orgs with funding totals (JH + GS combined)
 * - Federal government departments as funding sources
 * - Political donation flows
 * - Board member overlaps
 * - Intervention counts and evidence levels
 */
export async function GET() {
  const supabase = createServiceClient();

  try {
    // 1. All orgs with GS links and ACNC data
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, slug, abn, gs_entity_id, acnc_data, state, website')
      .not('abn', 'is', null)
      .order('name');

    if (!orgs?.length) {
      return NextResponse.json({ error: 'No orgs found' }, { status: 500 });
    }

    // 2. JH funding totals per org
    const { data: jhFundingByOrg } = await supabase
      .rpc('get_funding_by_org_summary') // We'll fall back to raw SQL if this doesn't exist
      .select('*');

    // Fallback: raw aggregation
    let jhFundingMap: Record<string, { total: number; count: number; sources: string[] }> = {};
    if (!jhFundingByOrg) {
      const { data: rawFunding } = await supabase
        .from('justice_funding')
        .select('alma_organization_id, amount_dollars, source')
        .not('alma_organization_id', 'is', null);

      if (rawFunding) {
        for (const f of rawFunding) {
          const key = f.alma_organization_id;
          if (!jhFundingMap[key]) jhFundingMap[key] = { total: 0, count: 0, sources: [] };
          jhFundingMap[key].total += f.amount_dollars || 0;
          jhFundingMap[key].count++;
          if (f.source && !jhFundingMap[key].sources.includes(f.source)) {
            jhFundingMap[key].sources.push(f.source);
          }
        }
      }
    }

    // 3. GS relationships for all linked orgs
    const gsEntityIds = orgs
      .filter(o => o.gs_entity_id)
      .map(o => o.gs_entity_id);

    let gsRelMap: Record<string, {
      contracts: { total: number; count: number; counterparties: string[] };
      grants: { total: number; count: number };
      donations: { total: number; count: number; parties: string[] };
      lobbying: number;
    }> = {};

    if (gsEntityIds.length > 0) {
      // Query in batches to avoid URL limits
      const batchSize = 50;
      for (let i = 0; i < gsEntityIds.length; i += batchSize) {
        const batch = gsEntityIds.slice(i, i + batchSize);
        const idList = batch.map(id => `"${id}"`).join(',');

        const { data: rels } = await supabase
          .from('gs_relationships')
          .select(`
            source_entity_id, target_entity_id, relationship_type, amount,
            source_entity:gs_entities!gs_relationships_source_entity_id_fkey(canonical_name),
            target_entity:gs_entities!gs_relationships_target_entity_id_fkey(canonical_name)
          `)
          .or(batch.map(id => `source_entity_id.eq.${id}`).join(',') + ',' + batch.map(id => `target_entity_id.eq.${id}`).join(','));

        if (rels) {
          for (const rel of rels) {
            // Find which JH org this belongs to
            const matchedEntityId = batch.find(id =>
              id === rel.source_entity_id || id === rel.target_entity_id
            );
            if (!matchedEntityId) continue;

            if (!gsRelMap[matchedEntityId]) {
              gsRelMap[matchedEntityId] = {
                contracts: { total: 0, count: 0, counterparties: [] },
                grants: { total: 0, count: 0 },
                donations: { total: 0, count: 0, parties: [] },
                lobbying: 0,
              };
            }

            const entry = gsRelMap[matchedEntityId];
            const amt = Number(rel.amount) || 0;
            const counterparty = rel.source_entity_id === matchedEntityId
              ? (rel.target_entity as { canonical_name: string } | null)?.canonical_name
              : (rel.source_entity as { canonical_name: string } | null)?.canonical_name;

            switch (rel.relationship_type) {
              case 'contract':
                entry.contracts.total += amt;
                entry.contracts.count++;
                if (counterparty && !entry.contracts.counterparties.includes(counterparty)) {
                  entry.contracts.counterparties.push(counterparty);
                }
                break;
              case 'grant':
                entry.grants.total += amt;
                entry.grants.count++;
                break;
              case 'donation':
                entry.donations.total += amt;
                entry.donations.count++;
                if (counterparty && !entry.donations.parties.includes(counterparty)) {
                  entry.donations.parties.push(counterparty);
                }
                break;
              case 'lobbies_for':
                entry.lobbying++;
                break;
            }
          }
        }
      }
    }

    // 4. Intervention counts per org
    const { data: interventionCounts } = await supabase
      .from('alma_interventions')
      .select('operating_organization_id, evidence_level')
      .neq('verification_status', 'ai_generated')
      .not('operating_organization_id', 'is', null);

    const interventionMap: Record<string, { count: number; proven: number; promising: number }> = {};
    if (interventionCounts) {
      for (const i of interventionCounts) {
        const key = i.operating_organization_id;
        if (!interventionMap[key]) interventionMap[key] = { count: 0, proven: 0, promising: 0 };
        interventionMap[key].count++;
        if (i.evidence_level === 'Proven' || i.evidence_level === 'Effective') interventionMap[key].proven++;
        if (i.evidence_level === 'Promising') interventionMap[key].promising++;
      }
    }

    // 5. Build unified org profiles
    const profiles = orgs.map(org => {
      const jh = jhFundingMap[org.id] || { total: 0, count: 0, sources: [] };
      const gs = org.gs_entity_id ? gsRelMap[org.gs_entity_id] : null;
      const interventions = interventionMap[org.id] || { count: 0, proven: 0, promising: 0 };
      const acnc = org.acnc_data as Record<string, unknown> | null;

      const totalFunding = jh.total + (gs?.contracts.total || 0) + (gs?.grants.total || 0);

      return {
        name: org.name,
        slug: org.slug,
        abn: org.abn,
        state: org.state || acnc?.state || null,
        website: org.website || acnc?.website || null,
        charity_size: acnc?.charity_size || null,
        beneficiaries: acnc?.beneficiaries || [],
        directors: acnc?.responsible_persons || null,
        total_funding: totalFunding,
        justice_funding: { total: jh.total, count: jh.count, sources: jh.sources },
        federal_contracts: gs?.contracts || { total: 0, count: 0, counterparties: [] },
        grants: gs?.grants || { total: 0, count: 0 },
        political_donations: gs?.donations || { total: 0, count: 0, parties: [] },
        lobbying: gs?.lobbying || 0,
        interventions,
        has_gs_link: !!org.gs_entity_id,
      };
    });

    // Sort by total funding descending
    profiles.sort((a, b) => b.total_funding - a.total_funding);

    // Summary stats
    const totalJHFunding = profiles.reduce((s, p) => s + p.justice_funding.total, 0);
    const totalContracts = profiles.reduce((s, p) => s + p.federal_contracts.total, 0);
    const totalGrants = profiles.reduce((s, p) => s + p.grants.total, 0);
    const totalDonations = profiles.reduce((s, p) => s + p.political_donations.total, 0);
    const orgsWithDonations = profiles.filter(p => p.political_donations.count > 0);

    return NextResponse.json({
      summary: {
        total_orgs: profiles.length,
        orgs_with_gs_link: profiles.filter(p => p.has_gs_link).length,
        total_known_funding: totalJHFunding + totalContracts + totalGrants,
        justice_funding_total: totalJHFunding,
        federal_contracts_total: totalContracts,
        grants_total: totalGrants,
        political_donations_total: totalDonations,
        orgs_with_donations: orgsWithDonations.length,
        total_interventions: profiles.reduce((s, p) => s + p.interventions.count, 0),
      },
      orgs: profiles,
      political_donors: orgsWithDonations.map(p => ({
        name: p.name,
        slug: p.slug,
        donations: p.political_donations,
        total_funding_received: p.total_funding,
      })),
    });
  } catch (error) {
    console.error('Power map error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
