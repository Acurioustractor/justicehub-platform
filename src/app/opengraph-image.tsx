import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'JusticeHub — The alternative exists. 981 community models. 64x cheaper than detention.';
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

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: '24px' }}>
          <div style={{ fontSize: '14px', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '3px' }}>
            981 alternative models · 586 with evidence · 64x cheaper than detention
          </div>
          <div style={{ fontSize: '64px', fontWeight: 900, color: 'white', lineHeight: 1.1 }}>
            Australia locks up children.
          </div>
          <div style={{ fontSize: '64px', fontWeight: 900, color: '#059669', lineHeight: 1.1 }}>
            The alternative exists.
          </div>
          <div style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)', maxWidth: '700px', marginTop: '8px' }}>
            The transparency engine for youth justice in Australia. Funding tracked. Models proven. Communities connected.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>JUSTICEHUB</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>justicehub.org.au</div>
          </div>
          <div style={{ fontSize: '11px', color: '#059669', textTransform: 'uppercase', letterSpacing: '2px' }}>ALMA Network</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
