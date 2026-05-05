import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * Full org detail for the side panel — pulls from the canonical chain.
 *
 * Sources joined:
 *   organizations  → JH-side wrapper (name, slug, partner_tier, logo)
 *   gs_entities    → canonical registry (abn, state, postcode, lga, remoteness, sector, community_controlled)
 *   acnc_charities → regulator data (charity_size, registration_date, purposes, beneficiaries, hpc, pbi)
 *   postcode_geo   → coordinates
 *   alma_interventions → list of YJ programs delivered
 *   justice_funding    → total funding tracked
 */
export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const sb = createServiceClient();
    const orgId = ctx.params.id;

    // Org base + gs_entity link
    const { data: org, error: e1 } = await sb
      .from('organizations')
      .select('id, name, slug, description, website, partner_tier, logo_url, gs_entity_id')
      .eq('id', orgId)
      .single();
    if (e1 || !org) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Canonical gs_entity
    let gs: any = null;
    if (org.gs_entity_id) {
      const { data } = await sb
        .from('gs_entities')
        .select('canonical_name, abn, acn, state, postcode, lga_name, remoteness, sector, sub_sector, latest_revenue, latest_assets, financial_year, is_community_controlled, community_controlled_tier, is_supply_nation_certified, seifa_irsd_decile, website, email, phone, description')
        .eq('id', org.gs_entity_id)
        .single();
      gs = data;
    }

    // ACNC charity record
    let acnc: any = null;
    const abn = gs?.abn;
    if (abn) {
      const { data } = await sb
        .from('acnc_charities')
        .select('charity_size, pbi, hpc, registration_date, address_line_1, town_city, state, postcode, website, purposes, beneficiaries, operating_states, ben_aboriginal_tsi, ben_youth, ben_pre_post_release, is_foundation, is_oric_corporation, oric_icn, is_social_enterprise')
        .eq('abn', abn)
        .maybeSingle();
      acnc = data;
    }

    // Postcode coords
    let geo: any = null;
    if (gs?.postcode) {
      const { data } = await sb
        .from('postcode_geo')
        .select('postcode, locality, latitude, longitude, sa2_name, sa3_name, sa4_name, lga_name, remoteness_2021')
        .eq('postcode', gs.postcode)
        .not('latitude', 'is', null)
        .limit(1)
        .maybeSingle();
      geo = data;
    }

    // Programs delivered
    const { data: programs } = await sb
      .from('alma_interventions')
      .select('id, name, type, evidence_level, target_cohort, geography, years_operating, cultural_authority')
      .eq('operating_organization_id', orgId)
      .neq('verification_status', 'ai_generated')
      .order('name')
      .range(0, 199);

    // Funding totals (linked to this org by gs_entity_id or by abn)
    let fundingTotal = 0;
    let fundingCount = 0;
    if (org.gs_entity_id || abn) {
      const orFilter = [org.gs_entity_id ? `gs_entity_id.eq.${org.gs_entity_id}` : null, abn ? `recipient_abn.eq.${abn}` : null]
        .filter(Boolean)
        .join(',');
      const { data: funding } = await sb
        .from('justice_funding')
        .select('amount_dollars')
        .or(orFilter)
        .range(0, 9999);
      for (const f of funding ?? []) {
        fundingTotal += Number(f.amount_dollars) || 0;
        fundingCount++;
      }
    }

    return NextResponse.json({
      org: {
        id: org.id,
        name: gs?.canonical_name || org.name,
        slug: org.slug,
        description: gs?.description || org.description,
        website: gs?.website || org.website,
        logo_url: org.logo_url,
        partner_tier: org.partner_tier,
      },
      registry: gs
        ? {
            abn: gs.abn,
            acn: gs.acn,
            state: gs.state,
            postcode: gs.postcode,
            lga: gs.lga_name,
            remoteness: gs.remoteness,
            sector: gs.sector,
            sub_sector: gs.sub_sector,
            latest_revenue: gs.latest_revenue,
            latest_assets: gs.latest_assets,
            financial_year: gs.financial_year,
            community_controlled: !!gs.is_community_controlled,
            community_controlled_tier: gs.community_controlled_tier,
            supply_nation_certified: !!gs.is_supply_nation_certified,
            seifa_irsd_decile: gs.seifa_irsd_decile,
            email: gs.email,
            phone: gs.phone,
          }
        : null,
      acnc: acnc
        ? {
            charity_size: acnc.charity_size,
            pbi: !!acnc.pbi,
            hpc: !!acnc.hpc,
            registration_date: acnc.registration_date,
            address: [acnc.address_line_1, acnc.town_city, acnc.state, acnc.postcode].filter(Boolean).join(', '),
            website: acnc.website,
            purposes: acnc.purposes,
            beneficiaries: acnc.beneficiaries,
            operating_states: acnc.operating_states,
            beneficiary_flags: {
              aboriginal_tsi: !!acnc.ben_aboriginal_tsi,
              youth: !!acnc.ben_youth,
              pre_post_release: !!acnc.ben_pre_post_release,
            },
            is_foundation: !!acnc.is_foundation,
            is_oric_corporation: !!acnc.is_oric_corporation,
            oric_icn: acnc.oric_icn,
            is_social_enterprise: !!acnc.is_social_enterprise,
          }
        : null,
      geo: geo
        ? {
            lat: Number(geo.latitude),
            lng: Number(geo.longitude),
            locality: geo.locality,
            sa2_name: geo.sa2_name,
            sa3_name: geo.sa3_name,
            sa4_name: geo.sa4_name,
            lga_name: geo.lga_name,
            remoteness: geo.remoteness_2021,
          }
        : null,
      programs: (programs ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        evidence_level: p.evidence_level,
        target_cohort: p.target_cohort,
        geography: p.geography,
        years_operating: p.years_operating,
        cultural_authority: p.cultural_authority,
      })),
      funding: {
        total_dollars: fundingTotal,
        records: fundingCount,
      },
    });
  } catch (err) {
    console.error('orgs/[id] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
