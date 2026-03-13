import { createServiceClient } from '@/lib/supabase/service-lite';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour — ROGS data changes annually

/**
 * Justice Spending API — serves ROGS (Productivity Commission) data
 * Source: Report on Government Services 2026
 *
 * Query params:
 *   ?state=nsw     — filter to specific state (lowercase)
 *   ?section=youth_justice — filter by section (corrections, youth_justice, police, courts)
 */
export async function GET(request: Request) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const stateFilter = searchParams.get('state')?.toLowerCase();
  const sectionFilter = searchParams.get('section');

  try {
    // Key spending metrics — latest year
    const { data: youthJustice } = await supabase
      .from('rogs_justice_spending')
      .select('*')
      .eq('rogs_section', 'youth_justice')
      .eq('rogs_table', '17A.10')
      .eq('financial_year', '2024-25')
      .eq('unit', "$'000")
      .in('description3', ['Detention-based services', 'Community-based services', 'Group conferencing', 'Total expenditure']);

    const { data: corrections } = await supabase
      .from('rogs_justice_spending')
      .select('*')
      .eq('rogs_section', 'corrections')
      .eq('financial_year', '2023-24')
      .eq('unit', "$'000")
      .eq('description3', 'Total net operating expenditure and capital costs');

    const { data: indigenous } = await supabase
      .from('rogs_justice_spending')
      .select('*')
      .eq('rogs_section', 'youth_justice')
      .eq('rogs_table', '17A.7')
      .eq('financial_year', '2024-25')
      .eq('unit', 'ratio')
      .like('service_type', '%Detention%');

    // Youth detention population
    const { data: detentionPop } = await supabase
      .from('rogs_justice_spending')
      .select('*')
      .eq('rogs_section', 'youth_justice')
      .eq('rogs_table', '17A.1')
      .eq('financial_year', '2024-25')
      .eq('unit', 'no.')
      .eq('description2', 'Detention')
      .eq('indigenous_status', 'All people');

    const states = ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'] as const;
    type State = typeof states[number];

    const stateNames: Record<State, string> = {
      nsw: 'New South Wales', vic: 'Victoria', qld: 'Queensland',
      wa: 'Western Australia', sa: 'South Australia', tas: 'Tasmania',
      act: 'Australian Capital Territory', nt: 'Northern Territory',
    };

    function getVal(rows: typeof youthJustice, desc3: string, state: State): number | null {
      const row = rows?.find(r => r.description3 === desc3);
      return row?.[state] ?? null;
    }

    function getFirstVal(rows: typeof corrections, state: State): number | null {
      return rows?.[0]?.[state] ?? null;
    }

    // Build state-by-state breakdown
    const stateBreakdown = states
      .filter(s => !stateFilter || s === stateFilter)
      .map(state => {
        const detentionSpend = getVal(youthJustice, 'Detention-based services', state);
        const communitySpend = getVal(youthJustice, 'Community-based services', state);
        const totalYJ = getVal(youthJustice, 'Total expenditure', state);
        const prisonSpend = getFirstVal(corrections, state);
        const indigenousRatio = indigenous?.[0]?.[state];
        const detPop = detentionPop?.[0]?.[state];

        const costPerChild = detentionSpend && detPop && detPop > 0
          ? Math.round((detentionSpend * 1000) / detPop)
          : null;

        return {
          state: state.toUpperCase(),
          state_name: stateNames[state],
          youth_justice: {
            detention_millions: detentionSpend ? Math.round(detentionSpend / 1000) : null,
            community_millions: communitySpend ? Math.round(communitySpend / 1000) : null,
            total_millions: totalYJ ? Math.round(totalYJ / 1000) : null,
            detention_population: detPop ? Math.round(detPop) : null,
            cost_per_child_per_year: costPerChild,
            detention_to_community_ratio: detentionSpend && communitySpend && communitySpend > 0
              ? parseFloat((detentionSpend / communitySpend).toFixed(1))
              : null,
          },
          corrections: {
            prison_millions: prisonSpend ? Math.round(prisonSpend / 1000) : null,
          },
          indigenous_detention_ratio: indigenousRatio ? parseFloat(indigenousRatio) : null,
        };
      });

    // National totals
    const national = {
      youth_detention_millions: getVal(youthJustice, 'Detention-based services', 'aust' as State),
      youth_community_millions: getVal(youthJustice, 'Community-based services', 'aust' as State),
      youth_total_millions: getVal(youthJustice, 'Total expenditure', 'aust' as State),
      prison_millions: getFirstVal(corrections, 'aust' as State),
      indigenous_detention_ratio: indigenous?.[0]?.aust ? parseFloat(indigenous[0].aust) : null,
      detention_population: detentionPop?.[0]?.aust ? Math.round(detentionPop[0].aust) : null,
    };

    return NextResponse.json({
      success: true,
      source: 'Productivity Commission Report on Government Services 2026',
      rogs_year: '2024-25',
      national: {
        youth_detention_billions: national.youth_detention_millions ? parseFloat((national.youth_detention_millions / 1000000).toFixed(2)) : null,
        youth_community_billions: national.youth_community_millions ? parseFloat((national.youth_community_millions / 1000000).toFixed(2)) : null,
        youth_total_billions: national.youth_total_millions ? parseFloat((national.youth_total_millions / 1000000).toFixed(2)) : null,
        prison_billions: national.prison_millions ? parseFloat((national.prison_millions / 1000000).toFixed(1)) : null,
        indigenous_detention_ratio: national.indigenous_detention_ratio,
        detention_population: national.detention_population,
      },
      states: stateBreakdown,
    });
  } catch (error) {
    console.error('Justice spending API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch justice spending data' },
      { status: 500 }
    );
  }
}
