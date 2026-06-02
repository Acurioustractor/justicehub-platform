import Link from 'next/link';
import { ArrowRight, FileText, MapPinned, Network, ShieldCheck } from 'lucide-react';

type Tone = 'light' | 'dark';

const points = [
  { label: 'Law', body: 'cases, campaigns, and rights in plain language' },
  { label: 'Support', body: 'detention sites, local alternatives, and funding' },
  { label: 'People', body: 'stories only when consent makes them safe to share' },
];

export function YouthRemandVerticalCard({
  tone = 'light',
  className = '',
}: {
  tone?: Tone;
  className?: string;
}) {
  const dark = tone === 'dark';
  return (
    <section
      className={`rounded-xl border p-5 md:p-6 ${className}`}
      style={{
        background: dark ? '#0f0f0f' : '#ffffff',
        borderColor: dark ? 'rgba(255,255,255,0.14)' : '#ded8cf',
        color: dark ? '#f5f0e8' : '#171717',
      }}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]"
              style={{ background: dark ? 'rgba(220,38,38,0.18)' : '#f4e8e5', color: dark ? '#fca5a5' : '#9f1239' }}
            >
              <Network className="h-3.5 w-3.5" />
              First issue guide
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: dark ? 'rgba(255,255,255,0.08)' : '#f2eadf', color: dark ? '#d8d0c7' : '#5f574f' }}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Research, not legal advice
            </span>
          </div>
          <h2 className="max-w-3xl text-2xl font-bold tracking-tight md:text-4xl">
            If CONTAINED leaves people asking &quot;what now?&quot;, start with youth remand.
          </h2>
          <p
            className="mt-3 max-w-3xl text-sm leading-6 md:text-base"
            style={{ color: dark ? 'rgba(245,240,232,0.72)' : '#514a42' }}
          >
            This guide explains why young people are held before sentence, what it costs, what alternatives exist,
            who is organising, and what a visitor, advocate, worker, funder, or decision-maker can do next.
          </p>
        </div>

        <div className="grid gap-2">
          <Link
            href="/justice-network/youth-remand"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold"
            style={{ background: dark ? '#dc2626' : '#171717', color: '#ffffff' }}
          >
            Understand youth remand <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/justice-network"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-bold"
            style={{ borderColor: dark ? 'rgba(255,255,255,0.22)' : '#ded8cf', color: dark ? '#f5f0e8' : '#171717' }}
          >
            See the wider map <MapPinned className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-3">
        {points.map((point) => (
          <div
            key={point.label}
            className="rounded-lg border p-3"
            style={{
              borderColor: dark ? 'rgba(255,255,255,0.12)' : '#ded8cf',
              background: dark ? 'rgba(255,255,255,0.04)' : '#fbfaf7',
            }}
          >
            <div className="mb-1 flex items-center gap-2 text-sm font-bold">
              <FileText className="h-4 w-4" style={{ color: dark ? '#fca5a5' : '#9f1239' }} />
              {point.label}
            </div>
            <p className="text-xs leading-5" style={{ color: dark ? 'rgba(245,240,232,0.66)' : '#756d63' }}>
              {point.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
