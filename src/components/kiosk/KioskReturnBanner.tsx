'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Sticky top banner shown only when ?from=kiosk is on the URL. Gives the
 * visitor a one-tap "Return to kiosk" affordance so they can dive into an
 * org page or claim trail from the kiosk and come back without using the
 * browser back stack.
 *
 * Designed to be safe to mount on any page — does nothing without the param.
 */

export function KioskReturnBanner() {
  const sp = useSearchParams();
  if (sp.get('from') !== 'kiosk') return null;
  return (
    <div className="sticky top-0 z-50 bg-emerald-700 text-white border-b-2 border-emerald-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.2em]">
          From the exhibition kiosk
        </p>
        <Link
          href="/kiosk"
          className="inline-flex items-center min-h-[44px] px-4 bg-white text-emerald-800 text-xs sm:text-sm font-mono uppercase tracking-widest rounded hover:bg-emerald-50"
        >
          ← Return to kiosk
        </Link>
      </div>
    </div>
  );
}
