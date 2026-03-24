import { ImageResponse } from 'next/og';
import { getDetentionCosts } from '@/lib/detention-costs';
import { createServiceClient } from '@/lib/supabase/service';
import { fmt } from '@/lib/format';

export const alt = 'Detention Cost Calculator — What if we chose differently? | JusticeHub';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const supabase = createServiceClient() as any;

  // Get live cost data
  const detentionCostsData = await getDetentionCosts();
  const nationalAnnual = detentionCostsData.national.annualCost;
  const detFmt = nationalAnnual >= 1_000_000 ? `$${(nationalAnnual / 1_000_000).toFixed(1)}M` : `$${(nationalAnnual / 1000).toFixed(0)}K`;

  const { data: costData } = await supabase
    .from('alma_interventions')
    .select('cost_per_young_person')
    .neq('verification_status', 'ai_generated')
    .not('cost_per_young_person', 'is', null)
    .gt('cost_per_young_person', 0)
    .lt('cost_per_young_person', 500000);

  const costs = (costData || []).map((r: any) => Number(r.cost_per_young_person)).filter((n: number) => n > 0);
  const avgCost = costs.length ? Math.round(costs.reduce((a: number, b: number) => a + b, 0) / costs.length) : 8500;
  const avgFmt = avgCost >= 1000 ? `$${(avgCost / 1000).toFixed(0)}K` : `$${avgCost.toLocaleString()}`;
  const ratio = Math.round(nationalAnnual / avgCost);

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 70px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: '#DC2626' }} />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: '32px' }}>
          <div style={{ fontSize: '14px', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '3px' }}>
            Interactive Calculator
          </div>
          <div style={{ fontSize: '56px', fontWeight: 900, color: 'white', lineHeight: 1.1, maxWidth: '800px' }}>
            What if we redirected detention spending to community alternatives?
          </div>
          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#DC2626' }}>{detFmt}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>detention/year</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#059669' }}>{avgFmt}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>ALMA average</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '36px', fontWeight: 900, color: 'white' }}>{ratio}x</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>cheaper</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>JUSTICEHUB</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>justicehub.org.au/calculator</div>
          </div>
          <div style={{ fontSize: '11px', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '2px' }}>Cost Calculator</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
