import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const STATS: Record<string, { value: string; label: string; subtext: string; source: string }> = {
  detention_cost: {
    value: '$1.55M',
    label: 'per child per year',
    subtext: 'Australia spends $1.55 million per child per year in youth detention — for an 84% reoffending rate.',
    source: 'Productivity Commission ROGS 2024-25',
  },
  reoffending: {
    value: '84%',
    label: 'reoffend within 2 years',
    subtext: 'After release from youth detention, 84% of young people reoffend within two years. The system creates more crime.',
    source: 'AIHW Youth Justice 2023-24',
  },
  indigenous: {
    value: '23.1x',
    label: 'Indigenous overrepresentation',
    subtext: 'Indigenous young people are 23.1 times more likely to be in detention than non-Indigenous youth. In the NT, it\'s 28 times.',
    source: 'Productivity Commission ROGS 2024-25',
  },
  alternatives: {
    value: '$520M',
    label: 'community programs',
    subtext: '$520M on community youth justice vs $1.14B on detention. 939 alternatives catalogued on ALMA.',
    source: 'ROGS 2024-25 + ALMA Database',
  },
  ratio: {
    value: '$15:$1',
    label: 'punitive vs what works',
    subtext: 'For every $1 spent on community programs that actually work, $15 goes to punitive systems that don\'t.',
    source: 'Calculated from ROGS 2024-25',
  },
  evidence: {
    value: '489',
    label: 'evidence items collected',
    subtext: '489 evidence items, 1,150 measured outcomes. The data is clear — alternatives work. They just aren\'t funded.',
    source: 'ALMA Evidence Database',
  },
};

/**
 * GET /api/contained/share-card?stat=detention_cost
 * Generates a 1080x1080 shareable stat card image
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statKey = searchParams.get('stat') || 'detention_cost';
  const stat = STATS[statKey];

  if (!stat) {
    return new Response('Invalid stat. Options: ' + Object.keys(STATS).join(', '), { status: 400 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: '#000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
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
            height: '8px',
            background: '#dc2626',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#dc2626',
              letterSpacing: '6px',
              textTransform: 'uppercase',
            }}
          >
            The Contained
          </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#6b7280',
              letterSpacing: '4px',
              textTransform: 'uppercase',
            }}
          >
            Australian Tour 2026
          </div>
        </div>

        {/* Main stat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              fontSize: '140px',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1,
              letterSpacing: '-4px',
            }}
          >
            {stat.value}
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#dc2626',
              textTransform: 'uppercase',
              letterSpacing: '3px',
            }}
          >
            {stat.label}
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 400,
              color: '#9ca3af',
              lineHeight: 1.5,
              maxWidth: '80%',
            }}
          >
            {stat.subtext}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#4b5563',
              maxWidth: '60%',
            }}
          >
            Source: {stat.source}
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#6b7280',
            }}
          >
            justicehub.org.au/contained
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    }
  );
}
