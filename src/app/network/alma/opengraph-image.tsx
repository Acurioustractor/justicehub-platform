import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ALMA Network — Alternative Local Models of Australia | JusticeHub';
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
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: '#059669' }} />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: '32px' }}>
          <div style={{ fontSize: '14px', color: '#059669', textTransform: 'uppercase', letterSpacing: '3px' }}>
            ALMA Network
          </div>
          <div style={{ fontSize: '56px', fontWeight: 900, color: 'white', lineHeight: 1.1, maxWidth: '800px' }}>
            Alternative Local Models of Australia
          </div>
          <div style={{ fontSize: '22px', color: 'rgba(255,255,255,0.5)', maxWidth: '700px' }}>
            A decentralised network of community organisations proving that local models work better, cost less, and keep young people safe.
          </div>
          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#059669' }}>981</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>verified models</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#059669' }}>586</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>evidence-backed</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '36px', fontWeight: 900, color: 'white' }}>8</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>states</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>JUSTICEHUB</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>justicehub.com.au/network/alma</div>
          </div>
          <div style={{ fontSize: '11px', color: '#059669', textTransform: 'uppercase', letterSpacing: '2px' }}>The Alternative Exists</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
