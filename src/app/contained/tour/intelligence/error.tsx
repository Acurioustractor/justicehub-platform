'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// Next.js auto-mounts this error boundary for /contained/tour/intelligence.
// Any uncaught render/effect error here gives the user a readable degraded
// view instead of a white "Application error" screen.
export default function TourIntelligenceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[contained/tour/intelligence] error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8] flex items-center justify-center p-6">
      <div className="max-w-lg space-y-4">
        <div className="text-[#DC2626] text-xs uppercase tracking-[0.2em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Something went wrong
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          The Tour Intelligence map could not render.
        </h1>
        <p className="text-sm text-[#F5F0E8]/80">
          The page tried to read data the API did not return. The rest of the campaign
          site is unaffected.
        </p>
        {error?.digest && (
          <p className="text-[11px] text-[#F5F0E8]/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            digest: {error.digest}
          </p>
        )}
        <div className="flex gap-3 pt-2">
          <button
            onClick={reset}
            className="bg-[#DC2626] text-white text-xs uppercase tracking-[0.15em] px-4 py-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Try again
          </button>
          <Link
            href="/contained"
            className="border border-white/20 text-xs uppercase tracking-[0.15em] px-4 py-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Back to Contained
          </Link>
        </div>
      </div>
    </div>
  );
}
