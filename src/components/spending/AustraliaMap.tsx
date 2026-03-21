'use client';

import Link from 'next/link';

interface StateInfo {
  code: string;
  name: string;
  totalMillions: number | null;
  detentionMillions: number | null;
  communityMillions: number | null;
  costPerChild: number | null;
  indigenousRatio: number | null;
}

// Simplified SVG paths for Australian states
const STATE_PATHS: Record<string, string> = {
  WA: 'M80,120 L80,350 L240,350 L240,180 L200,120 Z',
  NT: 'M240,120 L240,260 L360,260 L360,120 Z',
  SA: 'M240,260 L240,400 L360,400 L360,260 Z',
  QLD: 'M360,120 L360,300 L520,300 L520,120 Z',
  NSW: 'M360,300 L360,400 L500,400 L520,300 Z',
  VIC: 'M360,400 L360,440 L480,440 L500,400 Z',
  TAS: 'M400,460 L400,500 L460,500 L460,460 Z',
  ACT: 'M430,370 L430,390 L460,390 L460,370 Z',
};

const STATE_LABEL_POS: Record<string, { x: number; y: number }> = {
  WA: { x: 150, y: 240 },
  NT: { x: 300, y: 190 },
  SA: { x: 300, y: 330 },
  QLD: { x: 440, y: 210 },
  NSW: { x: 430, y: 350 },
  VIC: { x: 420, y: 420 },
  TAS: { x: 430, y: 480 },
  ACT: { x: 490, y: 380 },
};

function formatDollars(n: number | null): string {
  if (n == null) return 'N/A';
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}B`;
  return `$${n}M`;
}

export default function AustraliaMap({ states }: { states: StateInfo[] }) {
  const stateMap = new Map(states.map((s) => [s.code.toUpperCase(), s]));

  return (
    <div className="w-full">
      {/* SVG Map */}
      <div className="max-w-2xl mx-auto mb-8">
        <svg viewBox="60 100 500 420" className="w-full h-auto">
          {Object.entries(STATE_PATHS).map(([code, path]) => {
            const info = stateMap.get(code);
            const hasData = info && info.totalMillions != null;
            return (
              <Link key={code} href={`/spending/${code.toLowerCase()}`}>
                <g className="cursor-pointer group">
                  <path
                    d={path}
                    fill={hasData ? '#0A0A0A' : '#d1d5db'}
                    stroke="#F5F0E8"
                    strokeWidth={2}
                    className="transition-all group-hover:fill-[#DC2626]"
                  />
                  <text
                    x={STATE_LABEL_POS[code].x}
                    y={STATE_LABEL_POS[code].y}
                    textAnchor="middle"
                    fill="#F5F0E8"
                    fontSize={14}
                    fontWeight="bold"
                    fontFamily="Space Grotesk, sans-serif"
                    className="pointer-events-none"
                  >
                    {code}
                  </text>
                  {info && (
                    <text
                      x={STATE_LABEL_POS[code].x}
                      y={STATE_LABEL_POS[code].y + 16}
                      textAnchor="middle"
                      fill="#9CA3AF"
                      fontSize={10}
                      fontFamily="IBM Plex Mono, monospace"
                      className="pointer-events-none"
                    >
                      {formatDollars(info.totalMillions)}
                    </text>
                  )}
                </g>
              </Link>
            );
          })}
        </svg>
      </div>

      {/* State cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {states.map((s) => (
          <Link
            key={s.code}
            href={`/spending/${s.code.toLowerCase()}`}
            className="border border-gray-200 bg-white p-4 hover:border-[#0A0A0A] transition-colors"
          >
            <div className="flex items-baseline justify-between">
              <h3 className="font-bold text-sm">{s.code}</h3>
              <span className="font-mono text-xs text-gray-500">{s.name}</span>
            </div>
            <p
              className="text-xl font-bold mt-2"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              {formatDollars(s.totalMillions)}
            </p>
            <div className="flex gap-3 mt-2 text-xs font-mono">
              {s.detentionMillions != null && (
                <span className="text-red-600">
                  Det: ${s.detentionMillions}M
                </span>
              )}
              {s.communityMillions != null && (
                <span className="text-emerald-600">
                  Com: ${s.communityMillions}M
                </span>
              )}
            </div>
            {s.costPerChild != null && (
              <p className="text-xs text-gray-500 font-mono mt-1">
                ${(s.costPerChild / 1000).toFixed(0)}K/child/yr
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
