import { createServiceClient } from '@/lib/supabase/service-lite';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

export async function GET() {
  const supabase = createServiceClient();

  try {
    // Fetch all operational detention facilities
    const { data: facilities, error: facError } = await supabase
      .from('youth_detention_facilities')
      .select(
        'name, slug, city, state, capacity_beds, security_level, operational_status, latitude, longitude, facility_type, indigenous_population_percentage, government_department'
      )
      .eq('operational_status', 'operational')
      .order('state')
      .order('name');

    if (facError) throw facError;

    // Fetch state-level ROGS detention vs community spending (table 17A.10, 2024-25)
    const states = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'] as const;
    const stateSpending: Record<
      string,
      { detention_m: number; community_m: number; cost_per_day: number | null }
    > = {};

    const [{ data: detentionRows }, { data: communityRows }] =
      await Promise.all([
        supabase
          .from('rogs_justice_spending')
          .select('nsw, vic, qld, sa, wa, tas, nt, act')
          .eq('rogs_section', 'youth_justice')
          .eq('rogs_table', '17A.10')
          .eq('financial_year', '2024-25')
          .eq('unit', "$'000")
          .eq('service_type', 'Detention-based supervision')
          .eq('description3', 'Detention-based services')
          .limit(1)
          .single(),
        supabase
          .from('rogs_justice_spending')
          .select('nsw, vic, qld, sa, wa, tas, nt, act')
          .eq('rogs_section', 'youth_justice')
          .eq('rogs_table', '17A.10')
          .eq('financial_year', '2024-25')
          .eq('unit', "$'000")
          .eq('service_type', 'Community-based supervision')
          .eq('description3', 'Community-based services')
          .limit(1)
          .single(),
      ]);

    for (const st of states) {
      const key = st.toLowerCase() as Lowercase<(typeof states)[number]>;
      const detVal = detentionRows?.[key];
      const comVal = communityRows?.[key];

      stateSpending[st] = {
        detention_m: detVal ? Math.round(Number(detVal) / 1000) : 0,
        community_m: comVal ? Math.round(Number(comVal) / 1000) : 0,
        cost_per_day: null,
      };
    }

    return NextResponse.json({
      facilities: facilities || [],
      stateSpending,
    });
  } catch (error) {
    console.error('Facilities API error:', error);
    return NextResponse.json({ facilities: [], stateSpending: {} }, { status: 200 });
  }
}
