import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';

import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Government youth justice programs | JusticeHub',
  description:
    'Every government youth justice program we track, with budget, minister, community-led status, and cultural authority flag.',
};

interface ProgramRow {
  id: string;
  name: string;
  jurisdiction: string;
  program_type: string | null;
  status: string;
  budget_amount: number | null;
  announced_date: string | null;
  implementation_date: string | null;
  minister: string | null;
  department: string | null;
  description: string | null;
  community_led: boolean | null;
  cultural_authority: boolean | null;
  official_url: string | null;
  evidence_community_led: boolean | null;
  evidence_matched_interventions: number | null;
  evidence_matched_acco_interventions: number | null;
}

async function fetchAll() {
  const supabase = createServiceClient() as any;
  const { data: programs } = await supabase
    .from('alma_government_programs')
    .select('id, name, jurisdiction, program_type, status, budget_amount, announced_date, implementation_date, minister, department, description, community_led, cultural_authority, official_url, evidence_community_led, evidence_matched_interventions, evidence_matched_acco_interventions')
    .order('budget_amount', { ascending: false, nullsFirst: false });
  return (programs || []) as ProgramRow[];
}

function fmtMoney(n: number | null) {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const TYPE_COLOR: Record<string, string> = {
  detention: 'bg-rose-100 text-rose-800 border-rose-200',
  diversion: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rehabilitation: 'bg-amber-100 text-amber-800 border-amber-200',
  cultural: 'bg-purple-100 text-purple-800 border-purple-200',
  therapeutic: 'bg-sky-100 text-sky-800 border-sky-200',
  conferencing: 'bg-teal-100 text-teal-800 border-teal-200',
  mentoring: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};
function typeChip(t: string | null) {
  if (!t) return null;
  const first = t.replace(/[[\]"]/g, '').split(',')[0].trim().toLowerCase();
  const color = TYPE_COLOR[first] || 'bg-stone-100 text-stone-700 border-stone-300';
  return (
    <span className={`inline-block text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${color}`}>
      {first}
    </span>
  );
}

export default async function GovProgramsPage() {
  const programs = await fetchAll();

  const byJur: Record<string, ProgramRow[]> = {};
  for (const p of programs) {
    if (!byJur[p.jurisdiction]) byJur[p.jurisdiction] = [];
    byJur[p.jurisdiction].push(p);
  }
  const jurisdictions = Object.keys(byJur).sort((a, b) => {
    const aBudget = byJur[a].reduce((s, p) => s + (p.budget_amount || 0), 0);
    const bBudget = byJur[b].reduce((s, p) => s + (p.budget_amount || 0), 0);
    return bBudget - aBudget;
  });

  const totalBudget = programs.reduce((s, p) => s + (p.budget_amount || 0), 0);
  const communityLed = programs.filter((p) => p.community_led === true).length;
  const culturalAuthority = programs.filter((p) => p.cultural_authority === true).length;
  const evidenceCommunityLed = programs.filter((p) => p.evidence_community_led === true).length;

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-6 text-sm flex-wrap">
          <Link href="/" className="font-mono uppercase tracking-widest text-xs text-stone-700 hover:text-stone-900">JusticeHub</Link>
          <Link href="/intelligence/civic" className="text-stone-600 hover:text-stone-900 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Civic Intelligence
          </Link>
          <span className="text-stone-400">/</span>
          <span className="text-stone-900 font-medium">Government Programs</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-stone-900 text-stone-50 px-6 py-20 border-b border-stone-700">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-3">Government Programs · National Picture</p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            What government has announced.
          </h1>
          <p className="mt-5 max-w-2xl text-lg md:text-xl text-stone-300">
            Every funded youth justice program JusticeHub has been able to track, with budget,
            jurisdiction, minister, and the two flags that matter most: community-led and
            cultural authority.
          </p>
        </div>
      </section>

      {/* Headline cards */}
      <section className="px-6 py-12 border-b border-stone-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-stone-200 bg-white p-5 rounded-md">
              <div className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">Programs tracked</div>
              <div className="text-3xl font-bold text-stone-900">{programs.length}</div>
            </div>
            <div className="border border-stone-200 bg-white p-5 rounded-md">
              <div className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">Combined budget</div>
              <div className="text-3xl font-bold text-stone-900">{fmtMoney(totalBudget)}</div>
            </div>
            <div className="border-2 border-emerald-200 bg-emerald-50 p-5 rounded-md">
              <div className="text-xs font-mono uppercase tracking-widest text-emerald-700 mb-1">Community-led</div>
              <div className="text-3xl font-bold text-emerald-900">{communityLed}</div>
              <div className="text-xs text-emerald-700">
                {programs.length > 0 ? `${((communityLed / programs.length) * 100).toFixed(0)}% of all`: ''}
              </div>
            </div>
            <div className="border-2 border-purple-200 bg-purple-50 p-5 rounded-md">
              <div className="text-xs font-mono uppercase tracking-widest text-purple-700 mb-1">Cultural authority</div>
              <div className="text-3xl font-bold text-purple-900">{culturalAuthority}</div>
              <div className="text-xs text-purple-700">
                {programs.length > 0 ? `${((culturalAuthority / programs.length) * 100).toFixed(0)}% of all` : ''}
              </div>
            </div>
          </div>
          <div className="mt-6 border-2 border-amber-200 bg-amber-50 rounded-md p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-amber-700 mb-2">Triangulated finding</p>
            <p className="text-sm text-stone-800">
              <strong>{communityLed} of {programs.length} programs ({((communityLed / programs.length) * 100).toFixed(1)}%)</strong> are explicitly flagged community-led in their announcing minister&apos;s text.
              Cross-referencing against the {1568} verified YJ interventions in JusticeHub&apos;s catalogue
              reveals additional programs delivered through community/Indigenous organisations even
              when the announcement didn&apos;t flag it. <strong>Evidence-based community-led count: {evidenceCommunityLed} ({((evidenceCommunityLed / programs.length) * 100).toFixed(1)}%)</strong>.
              Cultural-authority flag is set for {culturalAuthority} programs by the announcing minister.
            </p>
            <p className="mt-3 text-xs text-amber-800">
              <strong>Neither number is the final truth.</strong> The 76-program dataset is partial.
              A real census requires triangulating against state budget papers, AIHW YJ reports,
              Auditor-General audits, and Children&apos;s Commissioner reports — work in progress.
              See <Link href="/intelligence/civic/data-quality" className="underline">data quality</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Per-jurisdiction breakdown */}
      <section className="px-6 py-12 border-b border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900 mb-6">By jurisdiction</h2>
          <div className="space-y-8">
            {jurisdictions.map((j) => {
              const progs = byJur[j];
              const budget = progs.reduce((s, p) => s + (p.budget_amount || 0), 0);
              const cl = progs.filter((p) => p.community_led === true).length;
              return (
                <div key={j}>
                  <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
                    <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-stone-500" /> {j}
                    </h3>
                    <span className="text-sm font-mono text-stone-600">
                      {progs.length} programs · {fmtMoney(budget)} budget · {cl} community-led
                    </span>
                  </div>
                  <div className="space-y-2">
                    {progs.map((p) => (
                      <div key={p.id} className={`border rounded-md p-3 ${p.community_led ? 'border-emerald-300 bg-emerald-50' : 'border-stone-200 bg-white'}`}>
                        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-medium text-stone-900">{p.name}</span>
                            {typeChip(p.program_type)}
                            {p.community_led && (
                              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">Community-led</span>
                            )}
                            {p.cultural_authority && (
                              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-700 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded">Cultural authority</span>
                            )}
                            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">{p.status}</span>
                          </div>
                          <span className="text-sm font-mono text-stone-700">{fmtMoney(p.budget_amount)}</span>
                        </div>
                        <div className="text-xs text-stone-500 flex flex-wrap gap-3">
                          {p.minister && <span>Minister: {p.minister}</span>}
                          {p.department && <span>· {p.department}</span>}
                          {p.announced_date && <span>· Announced {p.announced_date}</span>}
                          {p.official_url && (
                            <a href={p.official_url} target="_blank" rel="noopener noreferrer" className="text-stone-700 underline">
                              source
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sources */}
      <section className="px-6 py-10 bg-stone-100">
        <div className="max-w-5xl mx-auto text-sm text-stone-700">
          <p className="font-mono uppercase tracking-widest text-xs text-stone-500 mb-3">Sources</p>
          <ul className="space-y-1.5">
            <li><strong>alma_government_programs</strong> — extracted from state budget papers, ministerial announcements, and department press releases. 76 programs tracked.</li>
            <li>community_led + cultural_authority flags reflect what the announcing minister or department explicitly claimed in the published material. Where the source did not name a delivery partner or cultural authority, the flag stays FALSE.</li>
            <li>
              Full methodology at{' '}
              <Link href="/intelligence/civic/methodology" className="underline underline-offset-2">/intelligence/civic/methodology</Link>.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
