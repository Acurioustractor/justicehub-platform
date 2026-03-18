import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hour cache

// Pre-computed top recipients (from justice_funding aggregate query)
// Updated periodically — avoids scanning 64K rows on every request
const TOP_RECIPIENTS = [
  { recipient_name: 'Legal Aid Queensland', total_millions: 1147.7, grant_count: 28 },
  { recipient_name: 'Department of Youth Justice and Victim Support', total_millions: 688.0, grant_count: 9 },
  { recipient_name: 'Department of Youth Justice', total_millions: 537.0, grant_count: 6 },
  { recipient_name: 'Blue Care: Head Office', total_millions: 531.5, grant_count: 13 },
  { recipient_name: 'Endeavour Foundation', total_millions: 316.1, grant_count: 6 },
  { recipient_name: 'TAFE Queensland', total_millions: 265.8, grant_count: 25 },
  { recipient_name: 'Catholic Archdiocese of Brisbane', total_millions: 252.4, grant_count: 46 },
  { recipient_name: 'Life Without Barriers', total_millions: 228.4, grant_count: 26 },
  { recipient_name: 'Lifeline Community Care', total_millions: 204.6, grant_count: 17 },
  { recipient_name: 'Ozcare', total_millions: 203.3, grant_count: 21 },
];

/**
 * GET /api/contained/funding-recipients
 * Returns top grant recipients + state spending summary.
 */
export async function GET() {
  try {
    const supabase = createServiceClient();

    // State spending from ROGS (detention vs community)
    const states = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'] as const;
    const stateSpending: Record<string, { detention_m: number; community_m: number; total_m: number }> = {};

    const [{ data: detRow }, { data: comRow }] = await Promise.all([
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

    let nationalDetention = 0;
    let nationalCommunity = 0;

    for (const st of states) {
      const key = st.toLowerCase() as Lowercase<(typeof states)[number]>;
      const det = detRow?.[key] ? Math.round(Number(detRow[key]) / 1000) : 0;
      const com = comRow?.[key] ? Math.round(Number(comRow[key]) / 1000) : 0;
      stateSpending[st] = { detention_m: det, community_m: com, total_m: det + com };
      nationalDetention += det;
      nationalCommunity += com;
    }

    return NextResponse.json({
      topRecipients: TOP_RECIPIENTS,
      stateSpending,
      national: {
        detention_m: nationalDetention,
        community_m: nationalCommunity,
        total_m: nationalDetention + nationalCommunity,
      },
    });
  } catch (error) {
    console.error('Funding recipients error:', error);
    return NextResponse.json({ topRecipients: TOP_RECIPIENTS, stateSpending: {}, national: {} }, { status: 200 });
  }
}
