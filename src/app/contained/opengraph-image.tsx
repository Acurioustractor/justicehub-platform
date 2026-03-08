import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'THE CONTAINED: Australian Tour 2026';
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#dc2626',
              letterSpacing: '6px',
              textTransform: 'uppercase',
            }}
          >
            JusticeHub presents
          </div>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-2px',
              lineHeight: 1,
            }}
          >
            THE CONTAINED
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#9ca3af',
              marginTop: '4px',
            }}
          >
            Australian Tour 2026
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
            { value: '$1.55M', label: 'per child/year' },
            { value: '84%', label: 'reoffend' },
            { value: '$75/day', label: 'alternatives' },
            { value: '3%', label: 'reoffending' },
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
                  fontSize: '14px',
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

        {/* Tour stops */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '40px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#6b7280',
          }}
        >
          <span>Mount Druitt</span>
          <span style={{ color: '#dc2626' }}>→</span>
          <span>Adelaide</span>
          <span style={{ color: '#dc2626' }}>→</span>
          <span>Perth</span>
          <span style={{ color: '#dc2626' }}>→</span>
          <span>Tennant Creek</span>
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
          justicehub.org.au/contained
        </div>
      </div>
    ),
    { ...size }
  );
}
