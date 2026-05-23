import Link from 'next/link';
import { KioskSearch } from './KioskSearch';

/**
 * Persistent five-lens nav. Sits pinned at top of every /kiosk/lenses/* screen.
 * The current lens is highlighted; the other four are always one tap away.
 * A search button on the right opens a full-modal search across orgs / claims /
 * government programs / grants / foundations.
 *
 * Kiosk constraint: tap targets must be at least 56px tall so a finger can hit
 * any lens without misfires. Use `min-h-[56px]` and large hit area.
 */

export type LensKey = 'home' | 'orgs' | 'spending' | 'places' | 'stories' | 'what-works';

const LENSES: { key: LensKey; label: string; href: string }[] = [
  { key: 'orgs', label: 'Orgs', href: '/kiosk/lenses/orgs' },
  { key: 'spending', label: 'Spending', href: '/kiosk/lenses/spending' },
  { key: 'places', label: 'Places', href: '/kiosk/lenses/places' },
  { key: 'stories', label: 'Stories', href: '/kiosk/lenses/stories' },
  { key: 'what-works', label: 'What works', href: '/kiosk/lenses/what-works' },
];

export function LensBar({ current }: { current: LensKey }) {
  return (
    <nav className="sticky top-0 z-20 bg-[#0A0A0A] border-b-2 border-stone-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ul className="flex items-stretch gap-1 sm:gap-3">
          <li>
            <Link
              href="/kiosk"
              className="flex items-center min-h-[56px] px-3 sm:px-4 text-xs font-mono uppercase tracking-widest text-stone-400 hover:text-white transition-colors"
            >
              ←
            </Link>
          </li>
          {LENSES.map((l) => {
            const active = l.key === current;
            return (
              <li key={l.key} className="flex-1">
                <Link
                  href={l.href}
                  className={`flex items-center justify-center min-h-[56px] px-3 sm:px-4 text-sm font-mono uppercase tracking-widest transition-colors ${
                    active
                      ? 'text-white bg-stone-800 border-b-4 border-emerald-500'
                      : 'text-stone-400 hover:text-white hover:bg-stone-900'
                  }`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
          <li>
            <KioskSearch />
          </li>
        </ul>
      </div>
    </nav>
  );
}
