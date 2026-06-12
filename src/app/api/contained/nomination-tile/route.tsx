import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Square (1080x1080) "NOMINATED" share tile for the CONTAINED campaign.
 * Generated on demand from nomination data so every nominator can
 * download and post their own tile after submitting.
 *
 * Usage: /api/contained/nomination-tile?name=...&title=...&reason=...
 * Brand-locked: #0A0A0A / #F5F0E8 / #DC2626, Space Grotesk + IBM Plex Mono,
 * over the real (grayscale) cell-room photo (compendium/brand-guide.md).
 */

const SIZE = 1080;
const MAX_REASON = 220;

const spaceGroteskBold = fetch(new URL('./SpaceGrotesk-Bold.ttf', import.meta.url)).then((r) =>
  r.arrayBuffer()
);
const plexMonoRegular = fetch(new URL('./IBMPlexMono-Regular.ttf', import.meta.url)).then((r) =>
  r.arrayBuffer()
);
const plexMonoBold = fetch(new URL('./IBMPlexMono-Bold.ttf', import.meta.url)).then((r) =>
  r.arrayBuffer()
);

const GROTESK = 'Space Grotesk';
const MONO = 'IBM Plex Mono';

function clamp(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + '…';
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const name = clamp(params.get('name') || 'Your Decision-Maker', 48);
  const title = clamp(params.get('title') || '', 64);
  const reason = clamp(params.get('reason') || '', MAX_REASON);
  // Design variants: 'poster' (type-only blackout), 'split' (photo band +
  // black panel), 'scrim' (full-bleed photo under a dark scrim).
  const variant = params.get('variant') || 'split';

  // Scale the name down for long names so it fills the width across 1-2 lines
  const nameSize = name.length > 28 ? 76 : name.length > 18 ? 92 : 104;

  const bgUrl = new URL('/images/contained/cell-room-bg.jpg', req.nextUrl.origin).toString();

  const [grotesk, monoReg, monoBold] = await Promise.all([
    spaceGroteskBold,
    plexMonoRegular,
    plexMonoBold,
  ]);

  const imageOptions = {
    width: SIZE,
    height: SIZE,
    fonts: [
      { name: GROTESK, data: grotesk, weight: 700 as const, style: 'normal' as const },
      { name: MONO, data: monoReg, weight: 400 as const, style: 'normal' as const },
      { name: MONO, data: monoBold, weight: 700 as const, style: 'normal' as const },
    ],
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Disposition': 'inline; filename="contained-nominated.png"',
    },
  };

  if (variant === 'poster') {
    // A — Blackout poster. No photo. The name IS the image.
    const posterNameSize = name.length > 28 ? 96 : name.length > 18 ? 120 : 150;
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#0A0A0A',
            color: '#F5F0E8',
            padding: '64px 64px 52px',
            fontFamily: GROTESK,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', height: '12px', background: '#DC2626', width: '130px' }} />
          <div
            style={{
              marginTop: '26px',
              fontSize: '24px',
              fontWeight: 700,
              fontFamily: MONO,
              letterSpacing: '7px',
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            CONTAINED · PUBLIC NOMINATION
          </div>

          {/* Name dominates the frame */}
          <div
            style={{
              marginTop: '96px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontSize: `${posterNameSize}px`,
                fontWeight: 700,
                lineHeight: 0.96,
                letterSpacing: '-4px',
                textTransform: 'uppercase',
                display: 'flex',
              }}
            >
              {name}
            </div>
            {title ? (
              <div
                style={{
                  marginTop: '20px',
                  fontSize: '38px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'rgba(245,240,232,0.7)',
                  display: 'flex',
                }}
              >
                {title}
              </div>
            ) : null}
            {/* Stamp overlaps the name block, top-right */}
            <div
              style={{
                position: 'absolute',
                top: '-86px',
                right: '-12px',
                border: '8px solid #DC2626',
                color: '#DC2626',
                fontSize: '54px',
                fontWeight: 700,
                letterSpacing: '8px',
                textTransform: 'uppercase',
                padding: '8px 28px',
                transform: 'rotate(6deg)',
                display: 'flex',
              }}
            >
              NOMINATED
            </div>
          </div>

          {reason ? (
            <div
              style={{
                marginTop: '64px',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '10px solid #DC2626',
                paddingLeft: '30px',
                gap: '14px',
              }}
            >
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  fontFamily: MONO,
                  letterSpacing: '4px',
                  textTransform: 'uppercase',
                  color: '#DC2626',
                  display: 'flex',
                }}
              >
                WHY THEY NEED TO WALK THROUGH
              </div>
              <div
                style={{
                  fontSize: '29px',
                  fontFamily: MONO,
                  lineHeight: 1.45,
                  display: 'flex',
                }}
              >
                {reason}
              </div>
            </div>
          ) : null}

          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: '24px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex' }}>Three rooms. Ten minutes in each.</div>
              <div style={{ color: '#DC2626', display: 'flex' }}>Walk through. Then decide.</div>
            </div>
            <div style={{ display: 'flex' }}>justicehub.com.au/contained</div>
          </div>
        </div>
      ),
      imageOptions
    );
  }

  if (variant === 'split') {
    // B — Split band. Photo on top reads as a photo; black panel below
    // carries the type at full strength.
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#0A0A0A',
            color: '#F5F0E8',
            fontFamily: GROTESK,
            position: 'relative',
          }}
        >
          {/* Photo band */}
          <div style={{ display: 'flex', height: '430px', position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bgUrl}
              alt=""
              width={SIZE}
              height={430}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(10,10,10,0.25)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '40px',
                left: '56px',
                fontSize: '24px',
                fontWeight: 700,
                fontFamily: MONO,
                letterSpacing: '7px',
                textTransform: 'uppercase',
                color: '#F5F0E8',
                display: 'flex',
              }}
            >
              CONTAINED · PUBLIC NOMINATION
            </div>
            {/* Stamp sits across the seam */}
            <div
              style={{
                position: 'absolute',
                bottom: '-44px',
                left: '56px',
                border: '8px solid #DC2626',
                color: '#DC2626',
                fontSize: '58px',
                fontWeight: 700,
                letterSpacing: '9px',
                textTransform: 'uppercase',
                padding: '8px 32px',
                transform: 'rotate(-3deg)',
                background: '#0A0A0A',
                display: 'flex',
              }}
            >
              NOMINATED
            </div>
          </div>

          {/* Type panel */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '84px 56px 48px',
            }}
          >
            <div
              style={{
                fontSize: `${nameSize}px`,
                fontWeight: 700,
                lineHeight: 0.98,
                letterSpacing: '-3px',
                textTransform: 'uppercase',
                display: 'flex',
              }}
            >
              {name}
            </div>
            {title ? (
              <div
                style={{
                  marginTop: '12px',
                  fontSize: '34px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'rgba(245,240,232,0.7)',
                  display: 'flex',
                }}
              >
                {title}
              </div>
            ) : null}

            {reason ? (
              <div
                style={{
                  marginTop: '36px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderLeft: '10px solid #DC2626',
                  paddingLeft: '28px',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    fontFamily: MONO,
                    letterSpacing: '4px',
                    textTransform: 'uppercase',
                    color: '#DC2626',
                    display: 'flex',
                  }}
                >
                  WHY THEY NEED TO WALK THROUGH
                </div>
                <div
                  style={{
                    fontSize: '27px',
                    fontFamily: MONO,
                    lineHeight: 1.4,
                    display: 'flex',
                  }}
                >
                  {reason}
                </div>
              </div>
            ) : null}

            <div
              style={{
                marginTop: 'auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                fontFamily: MONO,
                fontWeight: 700,
                fontSize: '23px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex' }}>Three rooms. Ten minutes in each.</div>
                <div style={{ color: '#DC2626', display: 'flex' }}>Walk through. Then decide.</div>
              </div>
              <div style={{ display: 'flex' }}>justicehub.com.au/contained</div>
            </div>
          </div>
        </div>
      ),
      imageOptions
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0A0A0A',
          color: '#F5F0E8',
          padding: '56px 56px 48px',
          fontFamily: GROTESK,
          position: 'relative',
        }}
      >
        {/* Real cell-room photo (CONTAINED build), pre-treated grayscale */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bgUrl}
          alt=""
          width={SIZE}
          height={SIZE}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Dark scrim so the type carries; lighter up top so the room reads */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(180deg, rgba(10,10,10,0.58) 0%, rgba(10,10,10,0.74) 45%, rgba(10,10,10,0.9) 100%)',
          }}
        />

        {/* Top rule + kicker */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', height: '12px', background: '#DC2626', width: '130px' }} />
          <div
            style={{
              marginTop: '26px',
              fontSize: '24px',
              fontWeight: 700,
              fontFamily: MONO,
              letterSpacing: '7px',
              textTransform: 'uppercase',
              color: '#F5F0E8',
              display: 'flex',
            }}
          >
            CONTAINED · PUBLIC NOMINATION
          </div>
        </div>

        {/* Stamp */}
        <div
          style={{
            marginTop: '40px',
            display: 'flex',
          }}
        >
          <div
            style={{
              border: '8px solid #DC2626',
              color: '#DC2626',
              fontSize: '62px',
              fontWeight: 700,
              letterSpacing: '9px',
              textTransform: 'uppercase',
              padding: '10px 36px',
              transform: 'rotate(-4deg)',
              display: 'flex',
              boxShadow: '0 0 0 2px rgba(220,38,38,0.25)',
            }}
          >
            NOMINATED
          </div>
        </div>

        {/* Name block */}
        <div
          style={{
            marginTop: '44px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div
            style={{
              fontSize: `${nameSize}px`,
              fontWeight: 700,
              lineHeight: 0.98,
              letterSpacing: '-3px',
              textTransform: 'uppercase',
              color: '#F5F0E8',
              display: 'flex',
            }}
          >
            {name}
          </div>
          {title ? (
            <div
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#F5F0E8',
                letterSpacing: '0px',
                textTransform: 'uppercase',
                display: 'flex',
              }}
            >
              {title}
            </div>
          ) : null}
        </div>

        {/* Why */}
        {reason ? (
          <div
            style={{
              marginTop: '36px',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '10px solid #DC2626',
              paddingLeft: '30px',
              gap: '14px',
            }}
          >
            <div
              style={{
                fontSize: '26px',
                fontWeight: 700,
                fontFamily: MONO,
                letterSpacing: '4px',
                textTransform: 'uppercase',
                color: '#DC2626',
                display: 'flex',
              }}
            >
              WHY THEY NEED TO WALK THROUGH
            </div>
            <div
              style={{
                fontSize: '29px',
                fontWeight: 400,
                fontFamily: MONO,
                lineHeight: 1.45,
                color: '#F5F0E8',
                display: 'flex',
              }}
            >
              {reason}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: '24px',
            }}
          >
            <div style={{ color: '#F5F0E8', display: 'flex' }}>
              Three rooms. Ten minutes in each.
            </div>
            <div style={{ color: '#DC2626', display: 'flex' }}>Walk through. Then decide.</div>
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              fontFamily: MONO,
              color: '#F5F0E8',
              display: 'flex',
            }}
          >
            justicehub.com.au/contained
          </div>
        </div>
      </div>
    ),
    imageOptions
  );
}
