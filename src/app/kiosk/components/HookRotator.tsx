'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { HookEntry } from '../lib/hook-content';

/**
 * Cold-start hook + 60s-idle attract loop.
 *
 * Behaviour:
 *   - Mount: show entries[0] for 10s, then cycle.
 *   - Every tap: navigate to /kiosk/lenses (the five-lens grid).
 *   - Cycle interval: 10s per entry.
 *
 * This is also the screen the kiosk falls back to after 60s of idle anywhere
 * else (handled by IdleWatcher at the lens-layout level).
 */

export function HookRotator({ entries }: { entries: HookEntry[] }) {
  const [idx, setIdx] = useState(0);
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (entries.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % entries.length);
    }, 10_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [entries.length]);

  if (entries.length === 0) return null;
  const entry = entries[idx];
  const isNumberEntry = entry.kind === 'number';
  const isLiveCounts = entry.kind === 'live_counts';

  return (
    <button
      type="button"
      onClick={() => router.push('/kiosk/lenses')}
      className="block w-full h-screen relative overflow-hidden bg-[#0A0A0A] text-white text-left"
      aria-label="Tap anywhere to begin"
    >
      {/* Background image */}
      {entry.image && !isNumberEntry && !isLiveCounts && (
        <img
          src={entry.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-70 transition-opacity duration-500"
          onError={(e) => {
            // graceful fallback if image is missing — just show black background
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

      {/* Content */}
      <div className="relative z-10 h-full max-w-5xl mx-auto px-8 sm:px-16 py-16 sm:py-24 flex flex-col justify-end">
        {isLiveCounts && entry.liveCounts ? (
          <div className="space-y-8">
            <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.4em] text-emerald-400">
              Centre of Excellence for Youth Justice
            </p>
            <p className="text-3xl sm:text-5xl md:text-6xl font-bold leading-tight max-w-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Every fact here earns its headline by{' '}
              <span className="text-emerald-400">multiple independent sources</span>.
            </p>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 pt-2">
              <CountBox value={entry.liveCounts.triangulated} label="Triangulated claims" />
              <CountBox value={entry.liveCounts.totalClaims} label="Sourced facts" />
              <CountBox value={entry.liveCounts.tier1} label="Confirmed Tier 1" />
              <CountBox value={entry.liveCounts.accos} label="Named ACCOs" />
            </ul>
          </div>
        ) : isNumberEntry ? (
          <div className="space-y-6">
            <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.4em] text-[#DC2626]">
              The cost asymmetry
            </p>
            <p className="text-5xl sm:text-7xl md:text-8xl font-bold leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              $1,330,000
            </p>
            <p className="text-xl sm:text-2xl text-white/80" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              to lock up one child for one year.
            </p>
            <p className="text-3xl sm:text-5xl font-bold text-[#059669]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              $36,869 to support them in community.
            </p>
            <p className="text-xl sm:text-2xl text-white/60">= <span className="text-white font-bold">32× cheaper</span></p>
          </div>
        ) : (
          <div className="space-y-6">
            <blockquote className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight max-w-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              "{entry.quote}"
            </blockquote>
            <div>
              <p className="text-sm sm:text-base font-mono uppercase tracking-[0.3em] text-white/70">
                {entry.name} · {entry.org} · {entry.place}
              </p>
            </div>
          </div>
        )}
        <p className="mt-12 text-xs sm:text-sm font-mono uppercase tracking-[0.4em] text-white/50 animate-pulse">
          Tap anywhere to begin →
        </p>
      </div>
    </button>
  );
}

function CountBox({ value, label }: { value: number; label: string }) {
  return (
    <li className="border-l-4 border-emerald-500 pl-3">
      <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] text-white/60">{label}</p>
    </li>
  );
}
