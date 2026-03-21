import { createServiceClient } from '@/lib/supabase/service-lite';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const STATES = ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'] as const;
type StateCode = (typeof STATES)[number];

const STATE_NAMES: Record<string, string> = {
  nsw: 'New South Wales',
  vic: 'Victoria',
  qld: 'Queensland',
  wa: 'Western Australia',
  sa: 'South Australia',
  tas: 'Tasmania',
  act: 'Australian Capital Territory',
  nt: 'Northern Territory',
};

function toMillions(val: number | null): number | null {
  return val != null ? Math.round(val / 1000) : null;
}

function toNumber(val: unknown): number | null {
  if (val == null) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ state: string }> }
) {
  const { state: rawState } = await params;
  const stateCode = rawState.toLowerCase() as StateCode;

  if (!STATES.includes(stateCode)) {
    return NextResponse.json({ error: `Invalid state: ${rawState}` }, { status: 400 });
  }

  const stateUpper = stateCode.toUpperCase();
  const supabase = createServiceClient();

  try {
    const [
      rogsSpending,
      rogsTimeSeries,
      rogsDetentionPop,
      rogsIndigenous,
      fundingBySector,
      fundingBySource,
      fundingTopRecipients,
      fundingPrograms,
      facilities,
      governmentProgramsResult,
    ] = await Promise.all([
      // 1. ROGS latest year — detention vs community spend (Table 17A.10)
      supabase
        .from('rogs_justice_spending')
        .select('description3, ' + stateCode)
        .eq('rogs_section', 'youth_justice')
        .eq('rogs_table', '17A.10')
        .eq('financial_year', '2024-25')
        .eq('unit', "$'000")
        .in('description3', [
          'Detention-based services',
          'Community-based services',
          'Group conferencing',
          'Total expenditure',
        ]),

      // 2. ROGS time series — all years for detention + community
      supabase
        .from('rogs_justice_spending')
        .select('financial_year, description3, ' + stateCode)
        .eq('rogs_section', 'youth_justice')
        .eq('rogs_table', '17A.10')
        .eq('unit', "$'000")
        .in('description3', [
          'Detention-based services',
          'Community-based services',
          'Total expenditure',
        ])
        .order('financial_year', { ascending: true }),

      // 3. Detention population
      supabase
        .from('rogs_justice_spending')
        .select('financial_year, ' + stateCode)
        .eq('rogs_section', 'youth_justice')
        .eq('rogs_table', '17A.1')
        .eq('financial_year', '2024-25')
        .eq('unit', 'no.')
        .eq('description2', 'Detention')
        .eq('indigenous_status', 'All people')
        .limit(1),

      // 4. Indigenous ratio
      supabase
        .from('rogs_justice_spending')
        .select(stateCode)
        .eq('rogs_section', 'youth_justice')
        .eq('rogs_table', '17A.7')
        .eq('financial_year', '2024-25')
        .eq('unit', 'ratio')
        .like('service_type', '%Detention%')
        .limit(1),

      // 5. justice_funding by sector
      supabase.rpc('justice_funding_by_sector', { p_state: stateUpper }),

      // 6. justice_funding by source
      supabase
        .from('justice_funding')
        .select('source')
        .eq('state', stateUpper)
        .not('amount_dollars', 'is', null),

      // 7. Top recipients
      supabase.rpc('justice_funding_top_recipients', {
        p_state: stateUpper,
        p_sector: null,
        p_year: null,
        p_indigenous_only: false,
        p_limit: 20,
      }),

      // 8. Programs
      supabase
        .from('justice_funding')
        .select('program_name, amount_dollars')
        .eq('state', stateUpper)
        .not('program_name', 'is', null)
        .not('amount_dollars', 'is', null),

      // 9. Youth detention facilities
      supabase
        .from('youth_detention_facilities')
        .select('name, latitude, longitude, capacity, location, operator')
        .eq('state', stateUpper),

      // 10. Government programs / promises
      supabase
        .from('alma_government_programs')
        .select('id, name, program_type, announced_date, status, budget_amount, description, official_url, minister, department, target_cohort')
        .eq('jurisdiction', stateUpper)
        .order('announced_date', { ascending: false })
        .limit(30),
    ]);

    // --- Process ROGS headline ---
    const getVal = (desc3: string): number | null => {
      const row = (rogsSpending.data as any[])?.find((r: any) => r.description3 === desc3);
      return row ? toNumber(row[stateCode]) : null;
    };

    const detentionSpend = getVal('Detention-based services');
    const communitySpend = getVal('Community-based services');
    const totalSpend = getVal('Total expenditure');
    const detPopRow = (rogsDetentionPop.data as any[])?.[0];
    const detPop = detPopRow ? toNumber(detPopRow[stateCode]) : null;
    const indRow = (rogsIndigenous.data as any[])?.[0];
    const indigenousRatio = indRow ? toNumber(indRow[stateCode]) : null;

    const costPerChild =
      detentionSpend && detPop && detPop > 0
        ? Math.round((detentionSpend * 1000) / detPop)
        : null;

    const headline = {
      totalSpend: toMillions(totalSpend),
      detentionSpend: toMillions(detentionSpend),
      communitySpend: toMillions(communitySpend),
      costPerChild,
      indigenousRatio: indigenousRatio ? parseFloat(indigenousRatio.toFixed(2)) : null,
      detentionPopulation: detPop ? Math.round(detPop) : null,
    };

    // --- Process time series ---
    const yearMap: Record<string, { year: string; detention: number | null; community: number | null; total: number | null }> = {};
    for (const row of (rogsTimeSeries.data as any[]) || []) {
      const fy = row.financial_year;
      if (!yearMap[fy]) yearMap[fy] = { year: fy, detention: null, community: null, total: null };
      const val = toNumber(row[stateCode]);
      if (row.description3 === 'Detention-based services') yearMap[fy].detention = val ? Math.round(val / 1000) : null;
      if (row.description3 === 'Community-based services') yearMap[fy].community = val ? Math.round(val / 1000) : null;
      if (row.description3 === 'Total expenditure') yearMap[fy].total = val ? Math.round(val / 1000) : null;
    }
    const timeSeries = Object.values(yearMap)
      .filter((d) => d.detention != null || d.community != null)
      .sort((a, b) => a.year.localeCompare(b.year));

    // --- Process funding by sector ---
    const bySector = (fundingBySector.data || []).map((d: any) => ({
      sector: d.sector || 'Unknown',
      total: d.total_dollars || d.total || 0,
      count: d.grant_count || d.count || 0,
    }));

    // --- Process funding by source (aggregate manually) ---
    const sourceMap: Record<string, number> = {};
    for (const row of fundingBySource.data || []) {
      const src = row.source || 'Unknown';
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    }
    const bySource = Object.entries(sourceMap)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // --- Process top recipients ---
    const topRecipients = (fundingTopRecipients.data || []).slice(0, 20).map((d: any) => ({
      org: d.recipient_name || d.name || 'Unknown',
      total: d.total_dollars || d.total || 0,
      count: d.grant_count || d.count || 0,
      orgId: d.alma_organization_id || d.org_id || null,
      abn: d.recipient_abn || d.abn || null,
    }));

    // --- Process programs ---
    const programMap: Record<string, { total: number; count: number }> = {};
    for (const row of fundingPrograms.data || []) {
      const name = row.program_name;
      if (!programMap[name]) programMap[name] = { total: 0, count: 0 };
      programMap[name].total += row.amount_dollars || 0;
      programMap[name].count += 1;
    }
    const programs = Object.entries(programMap)
      .map(([name, v]) => ({ name, total: v.total, count: v.count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    // --- Facilities ---
    const facilitiesData = (facilities.data || []).map((f: any) => ({
      name: f.name,
      lat: f.latitude,
      lng: f.longitude,
      capacity: f.capacity,
      location: f.location,
      operator: f.operator,
    }));

    // --- Government programs / promises ---
    const governmentPrograms = (governmentProgramsResult.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      programType: p.program_type,
      announcedDate: p.announced_date,
      status: p.status,
      budgetAmount: p.budget_amount,
      description: p.description,
      url: p.official_url,
      minister: p.minister,
      department: p.department,
      targetCohort: p.target_cohort,
    }));

    // --- Promise vs Reality: compare announced $ vs actual funding $ ---
    const totalPromised = governmentPrograms.reduce(
      (sum: number, p: any) => sum + (p.budgetAmount || 0), 0
    );
    const totalActualFunding = (fundingPrograms.data || []).reduce(
      (sum: number, r: any) => sum + (r.amount_dollars || 0), 0
    );

    return NextResponse.json({
      state: stateUpper,
      stateName: STATE_NAMES[stateCode],
      source: 'Productivity Commission ROGS 2026 + JusticeHub funding database',
      headline,
      timeSeries,
      bySector,
      bySource,
      topRecipients,
      programs,
      facilities: facilitiesData,
      governmentPrograms,
      promiseVsReality: {
        totalPromised,
        totalActualFunding,
      },
    });
  } catch (error) {
    console.error('Spending API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spending data' },
      { status: 500 }
    );
  }
}
