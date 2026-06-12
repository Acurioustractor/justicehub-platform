import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Square (1080x1080) stat tiles for the CONTAINED campaign.
 * Figures are hardcoded to the brand-guide §7 canon (corrected 2026-06-11);
 * the retired $4,250/day and QLD-sourced 84% figures must never reappear here.
 * Every tile carries its source line (gate: no stat without source/year/jurisdiction).
 *
 * Usage: /api/contained/stat-tile?stat=cost|return|ratio
 * Brand-locked: #0A0A0A / #F5F0E8 / #DC2626 / #059669,
 * Space Grotesk + IBM Plex Mono (compendium/brand-guide.md).
 */

const SIZE = 1080;

const spaceGroteskBold = fetch(
  new URL('../nomination-tile/SpaceGrotesk-Bold.ttf', import.meta.url)
).then((r) => r.arrayBuffer());
const plexMonoRegular = fetch(
  new URL('../nomination-tile/IBMPlexMono-Regular.ttf', import.meta.url)
).then((r) => r.arrayBuffer());
const plexMonoBold = fetch(
  new URL('../nomination-tile/IBMPlexMono-Bold.ttf', import.meta.url)
).then((r) => r.arrayBuffer());

const GROTESK = 'Space Grotesk';
const MONO = 'IBM Plex Mono';

type StatSpec = {
  kicker: string;
  leftLabel: string;
  leftValue: string;
  leftSub: string;
  rightLabel: string;
  rightValue: string;
  rightSub: string;
  question: string;
  source: string;
};

// Brand-guide §7 canon. Do not edit figures here without updating the guide first.
const STATS: Record<string, StatSpec> = {
  cost: {
    kicker: 'CONTAINED · THE ARITHMETIC',
    leftLabel: 'DETENTION, SA',
    leftValue: '$3,261',
    leftSub: 'PER YOUNG PERSON, PER DAY',
    rightLabel: 'COMMUNITY ALTERNATIVES',
    rightValue: '$75',
    rightSub: 'PER YOUNG PERSON, PER DAY',
    question: 'If the evidence is this overwhelming, what are we actually doing?',
    source:
      'Productivity Commission ROGS 2024-25 Table 17A.20 (Kurlana Tapa) · Community Services Benchmark Study 2024',
  },
  return: {
    kicker: 'CONTAINED · WHAT DETENTION RETURNS',
    leftLabel: 'AFTER DETENTION, AUSTRALIA',
    leftValue: '84%',
    leftSub: 'BACK UNDER SUPERVISION WITHIN 12 MONTHS',
    rightLabel: 'DIAGRAMA, SPAIN',
    rightValue: '13.6%',
    rightSub: 'REOFFENDING AFTER RELEASE',
    question: 'If the evidence is this overwhelming, what are we actually doing?',
    source:
      'AIHW Young people returning to sentenced youth justice supervision 2023-24 · Diagrama Foundation evaluation',
  },
  ratio: {
    kicker: 'CONTAINED · SAME DOLLAR, DIFFERENT FUTURE',
    leftLabel: 'IN DETENTION',
    leftValue: '1',
    leftSub: 'YOUNG PERSON HELD',
    rightLabel: 'IN COMMUNITY PROGRAMS',
    rightValue: '16',
    rightSub: 'YOUNG PEOPLE SUPPORTED',
    question: 'If the evidence is this overwhelming, what are we actually doing?',
    source: 'Queensland Productivity Commission 2024',
  },
};

export async function GET(req: NextRequest) {
  const stat = req.nextUrl.searchParams.get('stat') || 'cost';
  const spec = STATS[stat] || STATS.cost;

  const [grotesk, monoReg, monoBold] = await Promise.all([
    spaceGroteskBold,
    plexMonoRegular,
    plexMonoBold,
  ]);

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
          padding: '64px 64px 48px',
          fontFamily: GROTESK,
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
          {spec.kicker}
        </div>

        {/* The comparison */}
        <div style={{ marginTop: '90px', display: 'flex', flexDirection: 'column', gap: '56px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 700,
                fontFamily: MONO,
                letterSpacing: '5px',
                color: '#DC2626',
                display: 'flex',
              }}
            >
              {spec.leftLabel}
            </div>
            <div
              style={{
                fontSize: '190px',
                fontWeight: 700,
                lineHeight: 0.95,
                letterSpacing: '-8px',
                color: '#DC2626',
                display: 'flex',
              }}
            >
              {spec.leftValue}
            </div>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 700,
                fontFamily: MONO,
                letterSpacing: '3px',
                color: 'rgba(245,240,232,0.7)',
                display: 'flex',
              }}
            >
              {spec.leftSub}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 700,
                fontFamily: MONO,
                letterSpacing: '5px',
                color: '#059669',
                display: 'flex',
              }}
            >
              {spec.rightLabel}
            </div>
            <div
              style={{
                fontSize: '190px',
                fontWeight: 700,
                lineHeight: 0.95,
                letterSpacing: '-8px',
                color: '#059669',
                display: 'flex',
              }}
            >
              {spec.rightValue}
            </div>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 700,
                fontFamily: MONO,
                letterSpacing: '3px',
                color: 'rgba(245,240,232,0.7)',
                display: 'flex',
              }}
            >
              {spec.rightSub}
            </div>
          </div>
        </div>

        {/* The question */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
          }}
        >
          <div
            style={{
              fontSize: '40px',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-1px',
              display: 'flex',
            }}
          >
            {spec.question}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              fontFamily: MONO,
              fontSize: '19px',
              color: 'rgba(245,240,232,0.55)',
            }}
          >
            <div style={{ display: 'flex', maxWidth: '720px', lineHeight: 1.4 }}>{spec.source}</div>
            <div style={{ fontWeight: 700, fontSize: '23px', color: '#F5F0E8', display: 'flex' }}>
              justicehub.com.au/contained
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: SIZE,
      height: SIZE,
      fonts: [
        { name: GROTESK, data: grotesk, weight: 700 as const, style: 'normal' as const },
        { name: MONO, data: monoReg, weight: 400 as const, style: 'normal' as const },
        { name: MONO, data: monoBold, weight: 700 as const, style: 'normal' as const },
      ],
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': `inline; filename="contained-stat-${stat}.png"`,
      },
    }
  );
}
