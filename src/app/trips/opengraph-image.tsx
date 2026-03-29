import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ALMA Network Learning Trips | JusticeHub';
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
          <div style={{ fontSize: '64px', fontWeight: 900, color: 'white', lineHeight: 1.1 }}>
            Learning Trips
          </div>
          <div style={{ fontSize: '22px', color: 'rgba(255,255,255,0.5)', maxWidth: '700px' }}>
            Immersive exchanges between community organisations. Visit each other&apos;s Country, see the work in practice, build real connections.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(5,150,105,0.1)', borderRadius: '12px', padding: '16px 20px', border: '1px solid rgba(5,150,105,0.2)' }}>
            <div style={{ fontSize: '16px', color: '#059669', fontWeight: 700 }}>Next trip:</div>
            <div style={{ fontSize: '16px', color: 'white' }}>Oonchiumpa SEQ Inspiration Trip — June 8–13, 2026</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>JUSTICEHUB</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>justicehub.com.au/trips</div>
          </div>
          <div style={{ fontSize: '11px', color: '#059669', textTransform: 'uppercase', letterSpacing: '2px' }}>Learning Trips</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
