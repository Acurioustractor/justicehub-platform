import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Detention Cost Calculator — What if we chose differently? | JusticeHub';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#DC2626' }}>$547K</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>detention/year</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#059669' }}>$8K</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>ALMA average</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '36px', fontWeight: 900, color: 'white' }}>64x</div>
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
