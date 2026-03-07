import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Take Action — CONTAINED Tour 2026';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 80px',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
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
            background: '#dc2626',
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#dc2626',
            letterSpacing: '6px',
            textTransform: 'uppercase',
          }}
        >
          CONTAINED Tour 2026
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '80px',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-2px',
            lineHeight: 1,
            marginTop: '16px',
          }}
        >
          TAKE ACTION
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#9ca3af',
            marginTop: '24px',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          Nominate decision-makers. Share the evidence.
          Fund the movement. Change youth justice.
        </div>

        {/* Action items */}
        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginTop: '48px',
          }}
        >
          {['Nominate', 'Share', 'Donate', 'Spread'].map((action) => (
            <div
              key={action}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  background: '#dc2626',
                  borderRadius: '50%',
                }}
              />
              {action}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            fontSize: '16px',
            fontWeight: 700,
            color: '#4b5563',
          }}
        >
          justicehub.org.au/contained/act
        </div>
      </div>
    ),
    { ...size }
  );
}
