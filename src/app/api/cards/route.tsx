import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

const STATE_NAMES: Record<string, string> = {
  NT: 'Northern Territory',
  QLD: 'Queensland',
  NSW: 'New South Wales',
  VIC: 'Victoria',
  WA: 'Western Australia',
  SA: 'South Australia',
  TAS: 'Tasmania',
  ACT: 'Australian Capital Territory',
};

// Card wrapper — consistent branding
function CardWrapper({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
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
      {/* Red accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: '#DC2626',
        }}
      />

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        {children}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-0.5px',
            }}
          >
            JUSTICEHUB
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            justicehub.org.au
          </div>
        </div>
        <div
          style={{
            fontSize: '11px',
            color: '#059669',
            textTransform: 'uppercase' as const,
            letterSpacing: '2px',
          }}
        >
          {subtitle || 'ALMA Network'}
        </div>
      </div>
    </div>
  );
}

// Card: Cost Comparison
function CostComparisonCard({
  detentionCost,
  almaCost,
  ratio,
  modelCount,
}: {
  detentionCost: number;
  almaCost: number;
  ratio: number;
  modelCount: number;
}) {
  return (
    <CardWrapper subtitle="The Cost Argument">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div style={{ fontSize: '14px', color: '#DC2626', textTransform: 'uppercase' as const, letterSpacing: '3px' }}>
          Youth Justice Cost Comparison
        </div>

        <div style={{ display: 'flex', gap: '40px' }}>
          {/* Detention */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#DC2626', textTransform: 'uppercase' as const, letterSpacing: '2px', marginBottom: '8px' }}>
              Detention
            </div>
            <div style={{ fontSize: '64px', fontWeight: 900, color: '#DC2626', lineHeight: 1 }}>
              {fmt(detentionCost)}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
              per young person per year
            </div>
          </div>

          {/* ALMA */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#059669', textTransform: 'uppercase' as const, letterSpacing: '2px', marginBottom: '8px' }}>
              Community Models
            </div>
            <div style={{ fontSize: '64px', fontWeight: 900, color: '#059669', lineHeight: 1 }}>
              {fmt(almaCost)}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
              average across {modelCount} verified models
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '20px 24px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ fontSize: '48px', fontWeight: 900, color: 'white' }}>{ratio}x</div>
          <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)' }}>
            cheaper than detention. Better outcomes. Proven by evidence.
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}

// Card: Funding Disparity
function FundingDisparityCard({
  totalFunding,
  fundingRecords,
  indigenousOrgCount,
  totalOrgs,
}: {
  totalFunding: number;
  fundingRecords: number;
  indigenousOrgCount: number;
  totalOrgs: number;
}) {
  const indigenousPct = totalOrgs > 0 ? Math.round((indigenousOrgCount / totalOrgs) * 100) : 0;
  return (
    <CardWrapper subtitle="Follow the Money">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ fontSize: '14px', color: '#DC2626', textTransform: 'uppercase' as const, letterSpacing: '3px' }}>
          Where Youth Justice Funding Goes
        </div>

        <div style={{ fontSize: '72px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
          {fmt(totalFunding)}
        </div>
        <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginTop: '-16px' }}>
          in youth justice funding tracked across {fundingRecords.toLocaleString()} records
        </div>

        <div style={{ display: 'flex', gap: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#059669' }}>
              {indigenousOrgCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              Indigenous organisations ({indigenousPct}% of all orgs)
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '36px', fontWeight: 900, color: 'white' }}>
              {totalOrgs.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              total organisations tracked
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}

// Card: Wall of Proof
function WallOfProofCard({
  modelCount,
  evidenceBacked,
  avgCost,
  ratio,
}: {
  modelCount: number;
  evidenceBacked: number;
  avgCost: number;
  ratio: number;
}) {
  const evidencePct = modelCount > 0 ? Math.round((evidenceBacked / modelCount) * 100) : 0;
  return (
    <CardWrapper subtitle="Wall of Proof">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ fontSize: '14px', color: '#059669', textTransform: 'uppercase' as const, letterSpacing: '3px' }}>
          The Alternative Exists
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
          <div style={{ fontSize: '96px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
            {modelCount}
          </div>
          <div style={{ fontSize: '24px', color: 'rgba(255,255,255,0.6)' }}>
            verified alternative models
          </div>
        </div>

        <div style={{ display: 'flex', gap: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#059669' }}>{evidenceBacked}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              evidence-backed ({evidencePct}%)
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#059669' }}>{fmt(avgCost)}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              average cost per young person
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '36px', fontWeight: 900, color: 'white' }}>{ratio}x</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              cheaper than detention
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}

// Card: State Scorecard
function StateScorecardCard({
  state,
  stateName,
  totalFunding,
  orgCount,
  indigenousOrgs,
  almaModels,
}: {
  state: string;
  stateName: string;
  totalFunding: number;
  orgCount: number;
  indigenousOrgs: number;
  almaModels: number;
}) {
  const indigenousPct = orgCount > 0 ? Math.round((indigenousOrgs / orgCount) * 100) : 0;
  return (
    <CardWrapper subtitle={`${state} Scorecard`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ fontSize: '14px', color: '#DC2626', textTransform: 'uppercase' as const, letterSpacing: '3px' }}>
          Youth Justice Scorecard
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
          <div style={{ fontSize: '72px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
            {stateName}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' as const }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#DC2626' }}>{fmt(totalFunding)}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>funding tracked</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>{orgCount}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>organisations</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#059669' }}>{indigenousOrgs}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Indigenous orgs ({indigenousPct}%)</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#059669' }}>{almaModels}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>ALMA models</div>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'cost-comparison';
  const state = searchParams.get('state')?.toUpperCase();

  // We can't use the service client in edge runtime directly,
  // so we'll use pre-computed data or fetch from API
  // For now, use reasonable defaults that can be overridden by query params
  const detentionCost = 547500;
  const ntDetentionCost = 1539205;

  // Allow overrides via query params for flexibility
  const modelCount = parseInt(searchParams.get('models') || '981');
  const evidenceBacked = parseInt(searchParams.get('evidence') || '586');
  const avgCost = parseInt(searchParams.get('avg_cost') || '8500');
  const ratio = Math.round(detentionCost / avgCost);
  const totalFunding = parseInt(searchParams.get('funding') || '2100000000');
  const fundingRecords = parseInt(searchParams.get('records') || '70963');
  const totalOrgs = parseInt(searchParams.get('orgs') || '18304');
  const indigenousOrgs = parseInt(searchParams.get('indigenous_orgs') || '1853');

  let card: JSX.Element;

  switch (type) {
    case 'cost-comparison':
      card = (
        <CostComparisonCard
          detentionCost={state === 'NT' ? ntDetentionCost : detentionCost}
          almaCost={avgCost}
          ratio={state === 'NT' ? Math.round(ntDetentionCost / avgCost) : ratio}
          modelCount={modelCount}
        />
      );
      break;

    case 'funding':
      card = (
        <FundingDisparityCard
          totalFunding={totalFunding}
          fundingRecords={fundingRecords}
          indigenousOrgCount={indigenousOrgs}
          totalOrgs={totalOrgs}
        />
      );
      break;

    case 'proof':
      card = (
        <WallOfProofCard
          modelCount={modelCount}
          evidenceBacked={evidenceBacked}
          avgCost={avgCost}
          ratio={ratio}
        />
      );
      break;

    case 'state':
      if (!state || !STATE_NAMES[state]) {
        card = (
          <CardWrapper>
            <div style={{ fontSize: '24px', color: 'white' }}>Invalid state. Use ?state=QLD</div>
          </CardWrapper>
        );
      } else {
        const stateFunding = parseInt(searchParams.get('state_funding') || '0');
        const stateOrgs = parseInt(searchParams.get('state_orgs') || '0');
        const stateIndigenous = parseInt(searchParams.get('state_indigenous') || '0');
        const stateAlma = parseInt(searchParams.get('state_alma') || '0');
        card = (
          <StateScorecardCard
            state={state}
            stateName={STATE_NAMES[state]}
            totalFunding={stateFunding}
            orgCount={stateOrgs}
            indigenousOrgs={stateIndigenous}
            almaModels={stateAlma}
          />
        );
      }
      break;

    default:
      card = (
        <CostComparisonCard
          detentionCost={detentionCost}
          almaCost={avgCost}
          ratio={ratio}
          modelCount={modelCount}
        />
      );
  }

  return new ImageResponse(card, {
    width: 1200,
    height: 630,
  });
}
