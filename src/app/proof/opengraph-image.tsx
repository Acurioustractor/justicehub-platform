import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'The Wall of Proof — 981 verified alternative models | JusticeHub';
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
            The Alternative Exists
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <div style={{ fontSize: '96px', fontWeight: 900, color: 'white', lineHeight: 1 }}>981</div>
            <div style={{ fontSize: '28px', color: 'rgba(255,255,255,0.6)' }}>verified alternative models</div>
          </div>
          <div style={{ fontSize: '22px', color: 'rgba(255,255,255,0.5)', maxWidth: '700px' }}>
            Evidence levels. Cost data. Real organisations. The proof that community-led youth justice works better and costs less.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>JUSTICEHUB</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>justicehub.org.au/proof</div>
          </div>
          <div style={{ fontSize: '11px', color: '#059669', textTransform: 'uppercase', letterSpacing: '2px' }}>Wall of Proof</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
