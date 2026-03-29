import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { fmt } from '@/lib/format';
import { STATE_NAMES } from '@/lib/constants';
import { getDetentionCosts } from '@/lib/detention-costs';

export const dynamic = 'force-dynamic';

function buildCard(type: string, params: URLSearchParams, nationalAnnualCost: number, stateAnnualCosts: Record<string, number>) {
  const state = params.get('state')?.toUpperCase();
  const modelCount = parseInt(params.get('models') || '981');
  const evidenceBacked = parseInt(params.get('evidence') || '586');
  const avgCost = parseInt(params.get('avg_cost') || '8500');
  const detentionCost = state && stateAnnualCosts[state] ? stateAnnualCosts[state] : nationalAnnualCost;
  const ratio = Math.round(detentionCost / avgCost);
  const totalFunding = parseInt(params.get('funding') || '2100000000');
  const fundingRecords = parseInt(params.get('records') || '70963');
  const totalOrgs = parseInt(params.get('orgs') || '18304');
  const indigenousOrgs = parseInt(params.get('indigenous_orgs') || '1853');
  const accentColor = type === 'proof' ? '#059669' : '#DC2626';

  let title = 'YOUTH JUSTICE COST COMPARISON';
  let mainStat = fmt(detentionCost);
  let mainLabel = 'detention cost per year';
  let secondStat = fmt(avgCost);
  let secondLabel = `avg across ${modelCount} community models`;
  let thirdStat = `${ratio}x`;
  let thirdLabel = 'cheaper than detention';

  if (type === 'proof') {
    title = 'THE ALTERNATIVE EXISTS';
    mainStat = modelCount.toString();
    mainLabel = 'verified alternative models';
    secondStat = evidenceBacked.toString();
    secondLabel = 'evidence-backed';
    thirdStat = fmt(avgCost);
    thirdLabel = 'avg cost per young person';
  } else if (type === 'funding') {
    title = 'WHERE YOUTH JUSTICE FUNDING GOES';
    mainStat = fmt(totalFunding);
    mainLabel = `tracked across ${fundingRecords.toLocaleString()} records`;
    secondStat = totalOrgs.toLocaleString();
    secondLabel = 'organisations';
    thirdStat = indigenousOrgs.toLocaleString();
    thirdLabel = `Indigenous orgs (${totalOrgs > 0 ? Math.round((indigenousOrgs / totalOrgs) * 100) : 0}%)`;
  } else if (type === 'state' && state && STATE_NAMES[state]) {
    title = `${STATE_NAMES[state].toUpperCase()} — YOUTH JUSTICE SCORECARD`;
    mainStat = fmt(parseInt(params.get('state_funding') || '0'));
    mainLabel = 'funding tracked';
    secondStat = params.get('state_orgs') || '0';
    secondLabel = 'organisations';
    thirdStat = params.get('state_alma') || '0';
    thirdLabel = 'ALMA models';
  }

  return { title, mainStat, mainLabel, secondStat, secondLabel, thirdStat, thirdLabel, accentColor, ratio };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'cost-comparison';
    const detentionCostsData = await getDetentionCosts();
    const stateAnnualCosts: Record<string, number> = {};
    for (const [code, data] of Object.entries(detentionCostsData.byState)) {
      stateAnnualCosts[code] = data.annualCost;
    }
    const card = buildCard(type, searchParams, detentionCostsData.national.annualCost, stateAnnualCosts);

    const response = new ImageResponse(
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
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: card.accentColor }} />

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <div style={{ fontSize: '14px', color: card.accentColor, letterSpacing: '3px', marginBottom: '32px' }}>
              {card.title}
            </div>
            <div style={{ fontSize: '80px', fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: '8px' }}>
              {card.mainStat}
            </div>
            <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginBottom: '40px' }}>
              {card.mainLabel}
            </div>
            <div style={{ display: 'flex', gap: '48px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '36px', fontWeight: 900, color: card.accentColor }}>{card.secondStat}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{card.secondLabel}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '36px', fontWeight: 900, color: 'white' }}>{card.thirdStat}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{card.thirdLabel}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>JUSTICEHUB</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>justicehub.com.au</div>
            </div>
            <div style={{ fontSize: '11px', color: '#059669', letterSpacing: '2px' }}>ALMA NETWORK</div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );

    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return response;
  } catch (err) {
    console.error('GET /api/cards error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
