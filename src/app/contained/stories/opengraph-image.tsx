import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'THE CONTAINED: Real Stories of Justice';
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
          padding: '60px 80px',
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
            background: '#dc2626',
          }}
        />

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              fontSize: '18px',
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
              fontSize: '64px',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-2px',
              lineHeight: 1.1,
            }}
          >
            Real Stories of Justice
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 400,
              color: '#9ca3af',
              marginTop: '8px',
              lineHeight: 1.4,
            }}
          >
            Community voices, evidence, and lived experience from across Australia.
            The stories the system doesn&apos;t want you to hear.
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: '48px',
            marginTop: '48px',
          }}
        >
          {[
            { value: '12', label: 'community voices' },
            { value: '46', label: 'articles' },
            { value: '3', label: 'video stories' },
            { value: '939', label: 'alternatives catalogued' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 900,
                  color: '#fff',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#dc2626',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            right: '80px',
            fontSize: '16px',
            fontWeight: 700,
            color: '#4b5563',
          }}
        >
          justicehub.org.au/contained/stories
        </div>
      </div>
    ),
    { ...size }
  );
}
