'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  CircleHelp,
  Compass,
  FilePlus2,
  Layers3,
  Megaphone,
  MessageCircle,
  Scale,
  Search,
} from 'lucide-react';

export type MatrixFlowActive =
  | 'hub'
  | 'how'
  | 'ask'
  | 'explore'
  | 'issues'
  | 'cases'
  | 'campaigns'
  | 'contribute'
  | 'guide';

const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const C = {
  surface: '#ffffff',
  border: '#e4e4e7',
  ink: '#18181b',
  body: '#3f3f46',
  muted: '#71717a',
  accent: '#4a2560',
  teal: '#1f6f78',
  amber: '#a96a1c',
};

const links: Array<{
  key: MatrixFlowActive;
  href: string;
  label: string;
  short: string;
  help: string;
  icon: ReactNode;
}> = [
  {
    key: 'hub',
    href: '/justice-matrix',
    label: 'Hub',
    short: 'Start',
    help: 'Orient',
    icon: <Compass className="h-4 w-4" />,
  },
  {
    key: 'how',
    href: '/justice-matrix/how-it-works',
    label: 'How it works',
    short: 'How',
    help: 'Trust',
    icon: <CircleHelp className="h-4 w-4" />,
  },
  {
    key: 'guide',
    href: '/justice-matrix/guide',
    label: 'Guide',
    short: 'Guide',
    help: 'Map',
    icon: <BookOpenCheck className="h-4 w-4" />,
  },
  {
    key: 'ask',
    href: '/justice-matrix/ask',
    label: 'Ask',
    short: 'Ask',
    help: 'Question',
    icon: <MessageCircle className="h-4 w-4" />,
  },
  {
    key: 'explore',
    href: '/justice-matrix/explore',
    label: 'Explore',
    short: 'Explore',
    help: 'Search',
    icon: <Search className="h-4 w-4" />,
  },
  {
    key: 'issues',
    href: '/justice-matrix/issues',
    label: 'Issues',
    short: 'Issues',
    help: 'Playbooks',
    icon: <Layers3 className="h-4 w-4" />,
  },
  {
    key: 'cases',
    href: '/justice-matrix/cases',
    label: 'Cases',
    short: 'Cases',
    help: 'Law',
    icon: <Scale className="h-4 w-4" />,
  },
  {
    key: 'campaigns',
    href: '/justice-matrix/campaigns',
    label: 'Campaigns',
    short: 'Campaigns',
    help: 'Movement',
    icon: <Megaphone className="h-4 w-4" />,
  },
  {
    key: 'contribute',
    href: '/justice-matrix/contribute',
    label: 'Contribute',
    short: 'Add',
    help: 'Add source',
    icon: <FilePlus2 className="h-4 w-4" />,
  },
];

export function MatrixFlowNav({
  active,
  className = '',
}: {
  active: MatrixFlowActive;
  className?: string;
}) {
  return (
    <section className={className} style={{ background: '#fafafa', borderBottom: `1px solid ${C.border}` }}>
      <nav className="mx-auto max-w-7xl px-5 py-3 md:px-8" aria-label="Justice Matrix flow">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="uppercase" style={{ color: C.muted, fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em' }}>
            User flow
          </div>
          <Link href="/justice-matrix/how-it-works#faq" className="hidden items-center gap-1 text-xs font-semibold hover:underline sm:inline-flex" style={{ color: C.accent }}>
            FAQ <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9">
          {links.map((item) => {
            const selected = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                title={item.label}
                aria-current={selected ? 'page' : undefined}
                className="group flex min-w-0 items-center gap-1.5 rounded-md border px-2 py-2 transition-colors hover:border-zinc-300"
                style={{
                  background: selected ? C.accent : C.surface,
                  borderColor: selected ? C.accent : C.border,
                  color: selected ? '#fff' : C.ink,
                }}
              >
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded"
                  style={{
                    background: selected ? 'rgba(255,255,255,0.14)' : 'rgba(74,37,96,0.08)',
                    color: selected ? '#fff' : item.key === 'campaigns' ? C.amber : item.key === 'how' ? C.teal : C.accent,
                  }}
                >
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold xl:text-[13px]">{item.short}</span>
                  <span
                    className="block truncate uppercase"
                    style={{
                      color: selected ? 'rgba(255,255,255,0.70)' : C.muted,
                      fontFamily: MONO,
                      fontSize: 9,
                      letterSpacing: '0.08em',
                    }}
                  >
                    {item.help}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </section>
  );
}
