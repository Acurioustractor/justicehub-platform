import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type FundingYearSummary = {
  financial_year: string;
  dollars: number;
  grants: number;
  programs: string[];
};

// Helper: enrich a profile object with ACNC charity + AIS financial data
async function enrichWithAcnc(profile: Record<string, unknown>, abn: string) {
  const { data: acnc } = await supabase
    .from('acnc_charities')
    .select('name, charity_size, pbi, hpc, registration_date, website, number_of_responsible_persons, date_established, operating_states, purpose_law_policy, purpose_reconciliation, purpose_social_welfare, purpose_human_rights, ben_aboriginal_tsi, ben_youth, ben_children, ben_pre_post_release, ben_victims_of_crime, ben_people_at_risk_of_homelessness')
    .eq('abn', abn)
    .single();
  if (acnc) {
    profile.acnc = acnc;
  }
  // Latest AIS financials
  const { data: ais } = await supabase
    .from('acnc_ais')
    .select('ais_year, total_revenue, total_expenses, net_assets_liabilities, total_assets, total_liabilities, staff_fte, staff_volunteers, revenue_from_government, employee_expenses')
    .eq('abn', abn)
    .order('ais_year', { ascending: false })
    .limit(1)
    .single();
  if (ais) {
    profile.financials = ais;
  }
}

/**
 * GET /api/justice-funding
 *
 * Query params:
 *   q=search text         Full-text search across recipient, program, description, location
 *   state=QLD             Filter by state
 *   sector=youth_justice  Filter by sector
 *   source=brisbane_council  Filter by data source
 *   year=2023-24          Filter by financial year
 *   org=uuid              Filter by ALMA organization ID
 *   abn=12345678901       Filter by ABN
 *   indigenous=true       Filter to Indigenous-led orgs only
 *   min_amount=1000       Minimum funding amount
 *   max_amount=500000     Maximum funding amount
 *   limit=50              Results per page (default 50, max 500)
 *   offset=0              Pagination offset
 *   view=summary|by_org|by_program|overview|by_sector|by_year|top_recipients|organizations
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const view = params.get('view');
  const stateFilter = params.get('state') || 'QLD';

  // Aggregated overview for the dashboard
  if (view === 'overview') {
    const { data, error } = await supabase.rpc('justice_funding_overview', { p_state: stateFilter });
    if (!error && data) return NextResponse.json(data);
    // Fallback: run inline SQL via summary views
    const { data: summary } = await supabase.from('v_justice_funding_summary').select('*');
    return NextResponse.json(summary);
  }

  if (view === 'by_sector') {
    const { data, error } = await supabase.rpc('justice_funding_by_sector', { p_state: stateFilter });
    if (!error && data) return NextResponse.json(data);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  if (view === 'by_year') {
    const { data, error } = await supabase.rpc('justice_funding_by_year', { p_state: stateFilter });
    if (!error && data) return NextResponse.json(data);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  // Org profile: money + interventions + outcomes + ACNC governance in one call
  // Supports: ?view=org_profile&org=<uuid> OR ?view=org_profile&abn=<abn>
  if (view === 'org_profile') {
    const orgId = params.get('org');
    const abnParam = params.get('abn');
    if (!orgId && !abnParam) return NextResponse.json({ error: 'org or abn parameter required' }, { status: 400 });

    // If ABN provided, resolve to org ID first
    let resolvedOrgId = orgId;
    let resolvedAbn = abnParam;
    if (!resolvedOrgId && abnParam) {
      const { data: fundingRow } = await supabase
        .from('justice_funding')
        .select('alma_organization_id, recipient_name')
        .eq('recipient_abn', abnParam)
        .not('alma_organization_id', 'is', null)
        .limit(1)
        .single();
      if (fundingRow?.alma_organization_id) {
        resolvedOrgId = fundingRow.alma_organization_id;
      } else {
        // No ALMA org — build a lightweight profile from funding data directly
        const { data: fundingRows } = await supabase
          .from('justice_funding')
          .select('*')
          .eq('recipient_abn', abnParam)
          .order('amount_dollars', { ascending: false });
        if (!fundingRows?.length) return NextResponse.json({ error: 'No funding records for this ABN' }, { status: 404 });
        const totalDollars = fundingRows.reduce((s, r) => s + (r.amount_dollars || 0), 0);
        const years = new Set(fundingRows.map(r => r.financial_year).filter(Boolean));
        const sectors = [...new Set(fundingRows.map(r => r.sector).filter(Boolean))];
        const byYear = Object.values(
          fundingRows.reduce((acc, r) => {
            const fy = r.financial_year || 'Unknown';
            if (!acc[fy]) acc[fy] = { financial_year: fy, dollars: 0, grants: 0, programs: [] as string[] };
            acc[fy].dollars += r.amount_dollars || 0;
            acc[fy].grants += 1;
            if (r.program_name && !acc[fy].programs.includes(r.program_name)) acc[fy].programs.push(r.program_name);
            return acc;
          }, {} as Record<string, FundingYearSummary>)
        ) as FundingYearSummary[];

        byYear.sort((a, b) => a.financial_year.localeCompare(b.financial_year));

        const profile: Record<string, unknown> = {
          organization: { id: null, name: fundingRows[0].recipient_name, slug: null, type: null, state: fundingRows[0].state, city: fundingRows[0].location, description: null },
          funding: { total_dollars: totalDollars, grant_count: fundingRows.length, years_funded: years.size, by_year: byYear, by_sector: sectors.map(s => ({ sector: s, dollars: fundingRows.filter(r => r.sector === s).reduce((sum, r) => sum + (r.amount_dollars || 0), 0), grants: fundingRows.filter(r => r.sector === s).length })) },
          interventions: [],
          is_indigenous: /aboriginal|torres strait|indigenous|murri|first nations/i.test(fundingRows[0].recipient_name),
          recipient_abn: abnParam,
        };
        // Enrich with ACNC
        await enrichWithAcnc(profile, abnParam);
        return NextResponse.json(profile);
      }
    }

    const { data, error } = await supabase.rpc('justice_funding_org_profile', { p_org_id: resolvedOrgId });
    if (error || !data) return NextResponse.json({ error: error?.message }, { status: 500 });

    // Enrich with ACNC data if org has funding records with ABN
    const profile = typeof data === 'string' ? JSON.parse(data) : data;
    try {
      let abn = resolvedAbn;
      if (!abn) {
        const { data: abnRow } = await supabase
          .from('justice_funding')
          .select('recipient_abn')
          .eq('alma_organization_id', resolvedOrgId)
          .not('recipient_abn', 'is', null)
          .limit(1)
          .single();
        abn = abnRow?.recipient_abn || null;
      }
      if (abn) {
        profile.recipient_abn = abn;
        await enrichWithAcnc(profile, abn);
      }
    } catch { /* ACNC enrichment is best-effort */ }

    // Enrich with tender count
    try {
      const { count } = await supabase
        .from('state_tenders')
        .select('id', { count: 'exact', head: true })
        .or(`supplier_name.ilike.%${profile.organization?.name?.substring(0, 30)}%`);
      if (count && count > 0) profile.tender_count = count;
    } catch { /* tender enrichment is best-effort */ }

    return NextResponse.json(profile);
  }

  // Map locations — lightweight aggregation for full map (not paginated)
  if (view === 'org_map') {
    const { data, error } = await supabase.rpc('justice_funding_map_locations', {
      p_state: stateFilter,
      p_q: params.get('q') || null,
      p_sector: params.get('sector') || null,
      p_indigenous_only: params.get('indigenous') === 'true',
      p_location: params.get('location') || null,
      p_funding_type: params.get('funding_type') || null,
      p_source: params.get('source') || null,
      p_beneficiary: params.get('beneficiary') || null,
      p_purpose: params.get('purpose') || null,
      p_charity_size: params.get('charity_size') || null,
      p_alma_only: params.get('alma_only') === 'true',
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const result = data?.justice_funding_map_locations || data;
    return NextResponse.json(result);
  }

  // Organizations directory with aggregated data + locations + ACNC enrichment
  if (view === 'organizations') {
    const q = params.get('q');
    const sector = params.get('sector');
    const indigenous = params.get('indigenous');
    const location = params.get('location');
    const limit = Math.min(parseInt(params.get('limit') || '100'), 500);
    const offset = parseInt(params.get('offset') || '0');
    const { data, error } = await supabase.rpc('justice_funding_organizations', {
      p_state: stateFilter,
      p_q: q || null,
      p_sector: sector || null,
      p_indigenous_only: indigenous === 'true',
      p_location: location || null,
      p_limit: limit,
      p_offset: offset,
      p_funding_type: params.get('funding_type') || null,
      p_source: params.get('source') || null,
      p_beneficiary: params.get('beneficiary') || null,
      p_purpose: params.get('purpose') || null,
      p_charity_size: params.get('charity_size') || null,
      p_alma_only: params.get('alma_only') === 'true',
      p_sort: params.get('sort') || 'funding',
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const result = data?.justice_funding_organizations || data;
    return NextResponse.json(result);
  }

  if (view === 'top_recipients') {
    const sectorParam = params.get('sector');
    const yearParam = params.get('year');
    const indigenousParam = params.get('indigenous');
    const limitParam = Math.min(parseInt(params.get('limit') || '25'), 100);
    const { data, error } = await supabase.rpc('justice_funding_top_recipients', {
      p_state: stateFilter,
      p_sector: sectorParam || null,
      p_year: yearParam || null,
      p_indigenous_only: indigenousParam === 'true',
      p_limit: limitParam,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  }

  // State tenders
  if (view === 'tenders') {
    const tenderState = params.get('tender_state');
    let query = supabase
      .from('state_tenders')
      .select('*')
      .eq('is_justice_related', true)
      .order('published_date', { ascending: false, nullsFirst: false });
    if (tenderState) query = query.eq('state', tenderState.toUpperCase());
    const { data, error } = await query.limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tenders: data || [], total: data?.length || 0 });
  }

  // ACNC profile by ABN
  if (view === 'acnc_profile') {
    const abn = params.get('abn');
    if (!abn) return NextResponse.json({ error: 'abn parameter required' }, { status: 400 });
    const { data, error } = await supabase
      .from('acnc_charities')
      .select('name, abn, charity_size, pbi, hpc, registration_date, website, state, number_of_responsible_persons, date_established, operating_states, purpose_law_policy, purpose_reconciliation, purpose_social_welfare, purpose_human_rights, ben_aboriginal_tsi, ben_youth, ben_children, ben_pre_post_release, ben_victims_of_crime, ben_people_at_risk_of_homelessness')
      .eq('abn', abn)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    // Also fetch latest AIS financials
    const { data: ais } = await supabase
      .from('acnc_ais')
      .select('ais_year, total_revenue, total_expenses, net_assets_liabilities, total_assets, total_liabilities, staff_fte, staff_volunteers, revenue_from_government, employee_expenses')
      .eq('abn', abn)
      .order('ais_year', { ascending: false })
      .limit(1)
      .single();
    return NextResponse.json({ ...data, financials: ais || null });
  }

  // Power concentration analysis
  if (view === 'power') {
    const { data, error } = await supabase.rpc('justice_funding_power_concentration', { p_state: stateFilter });
    if (!error && data) return NextResponse.json(data);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  // Legacy summary views
  if (view === 'summary') {
    const { data, error } = await supabase.from('v_justice_funding_summary').select('*');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (view === 'by_org') {
    const { data, error } = await supabase.from('v_justice_funding_by_org').select('*').limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (view === 'by_program') {
    const { data, error } = await supabase.from('v_justice_funding_by_program').select('*').limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Build query
  let query = supabase
    .from('justice_funding')
    .select('*', { count: 'exact' });

  // Filters
  const q = params.get('q');
  const sector = params.get('sector');
  const source = params.get('source');
  const year = params.get('year');
  const org = params.get('org');
  const abn = params.get('abn');
  const indigenous = params.get('indigenous');
  const minAmount = params.get('min_amount');
  const maxAmount = params.get('max_amount');
  const limit = Math.min(parseInt(params.get('limit') || '50'), 500);
  const offset = parseInt(params.get('offset') || '0');

  if (q) {
    const searchTerm = `%${q}%`;
    query = query.or(
      `recipient_name.ilike.${searchTerm},program_name.ilike.${searchTerm},project_description.ilike.${searchTerm},location.ilike.${searchTerm}`
    );
  }
  if (stateFilter) query = query.eq('state', stateFilter.toUpperCase());
  if (sector) query = query.eq('sector', sector);
  if (source) query = query.eq('source', source);
  if (year) query = query.eq('financial_year', year);
  if (org) query = query.eq('alma_organization_id', org);
  if (abn) query = query.eq('recipient_abn', abn);
  if (indigenous === 'true') {
    query = query.or(
      'recipient_name.ilike.%aboriginal%,recipient_name.ilike.%torres strait%,recipient_name.ilike.%indigenous%,recipient_name.ilike.%murri%,recipient_name.ilike.%first nations%'
    );
  }
  if (minAmount) query = query.gte('amount_dollars', parseFloat(minAmount));
  if (maxAmount) query = query.lte('amount_dollars', parseFloat(maxAmount));

  query = query
    .order('amount_dollars', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    records: data,
    total: count,
    limit,
    offset,
    has_more: (count || 0) > offset + limit,
  });
}
