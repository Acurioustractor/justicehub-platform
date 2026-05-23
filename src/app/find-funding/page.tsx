import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Coins, Calendar, Heart, Building2, ExternalLink } from 'lucide-react';

import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Find funding — grants, foundations, government programs | JusticeHub',
  description:
    'Open grants, philanthropic foundations supporting youth justice, and current government programs. Filter by state, amount, and deadline.',
};

interface GrantRow {
  id: string;
  name: string;
  description: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  provider: string | null;
  program: string | null;
  url: string | null;
  source: string | null;
  focus_areas: string[] | null;
}

interface FoundationRow {
  foundation_name: string;
  total_given: number;
  grants_count: number;
  yj_relevant_dollars: number;
}

interface GovProgramRow {
  id: string;
  name: string;
  jurisdiction: string;
  budget_amount: number | null;
  status: string;
  evidence_community_led: boolean | null;
}

async function fetchData(searchParams: { state?: string; min?: string }) {
  const supabase = createServiceClient() as any;
  const state = searchParams.state?.toUpperCase();
  const minAmount = searchParams.min ? parseInt(searchParams.min, 10) : null;

  // Live grants (future-deadline or no-deadline)
  let grantsQ = supabase
    .from('grant_opportunities')
    .select('id, name, description, amount_min, amount_max, deadline, provider, program, url, source, focus_areas')
    .or(`deadline.is.null,deadline.gte.${new Date().toISOString().slice(0, 10)}`)
    .order('deadline', { ascending: true, nullsFirst: false })
    .limit(50);
  if (minAmount) grantsQ = grantsQ.gte('amount_max', minAmount);
  const { data: grants } = await grantsQ;

  // Top foundations (with YJ-relevant dollars from classifier when available)
  const foundationsMap = new Map<string, FoundationRow>();
  let off = 0;
  while (true) {
    const { data: page } = await supabase
      .from('foundation_grantees')
      .select('foundation_name, grant_amount, yj_relevant')
      .range(off, off + 999);
    if (!page || page.length === 0) break;
    for (const r of page) {
      const n = r.foundation_name?.trim();
      if (!n) continue;
      const cur = foundationsMap.get(n) || { foundation_name: n, total_given: 0, grants_count: 0, yj_relevant_dollars: 0 };
      const amt = Number(r.grant_amount || 0);
      cur.total_given += amt;
      cur.grants_count++;
      if (r.yj_relevant === true) cur.yj_relevant_dollars += amt;
      foundationsMap.set(n, cur);
    }
    if (page.length < 1000) break;
    off += 1000;
  }
  const foundations = Array.from(foundationsMap.values())
    .sort((a, b) => b.yj_relevant_dollars - a.yj_relevant_dollars || b.total_given - a.total_given)
    .slice(0, 15);

  // Current gov programs (in_progress or announced + future)
  let progQ = supabase
    .from('alma_government_programs')
    .select('id, name, jurisdiction, budget_amount, status, evidence_community_led')
    .in('status', ['announced', 'in_progress', 'implemented'])
    .order('budget_amount', { ascending: false, nullsFirst: false })
    .limit(30);
  if (state) progQ = progQ.eq('jurisdiction', state);
  const { data: programs } = await progQ;

  return {
    grants: (grants || []) as GrantRow[],
    foundations,
    programs: (programs || []) as GovProgramRow[],
    state,
    minAmount,
  };
}

function fmtMoney(n: number | null) {
  if (n == null || isNaN(n)) return null;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default async function FindFundingPage(props: { searchParams?: Promise<{ state?: string; min?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const data = await fetchData(sp);

  const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
  const MINS = [10_000, 50_000, 100_000, 500_000, 1_000_000];

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-6 text-sm flex-wrap">
          <Link href="/" className="font-mono uppercase tracking-widest text-xs text-stone-700 hover:text-stone-900">JusticeHub</Link>
          <Link href="/exhibition" className="text-stone-600 hover:text-stone-900 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to search
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-stone-900 text-stone-50 px-6 py-16 border-b border-stone-700">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-3">JusticeHub · Find funding</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Money, where it sits.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-stone-300">
            Live grants you can apply for, foundations supporting youth justice work, and current government programs.
          </p>
        </div>
      </section>

      {/* Filter chips */}
      <section className="px-6 py-6 border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-2 text-sm items-baseline">
          <span className="text-xs font-mono uppercase tracking-widest text-stone-500 mr-2">Filter:</span>
          <Link
            href="/find-funding"
            className={`px-3 py-1.5 rounded-full border ${!data.state && !data.minAmount ? 'bg-stone-900 text-stone-50 border-stone-900' : 'border-stone-300 hover:border-stone-500'}`}
          >
            All
          </Link>
          {STATES.map((s) => (
            <Link
              key={s}
              href={`/find-funding?state=${s}${data.minAmount ? `&min=${data.minAmount}` : ''}`}
              className={`px-3 py-1.5 rounded-full border ${data.state === s ? 'bg-stone-900 text-stone-50 border-stone-900' : 'border-stone-300 hover:border-stone-500'}`}
            >
              {s}
            </Link>
          ))}
          <span className="text-stone-400 mx-2">·</span>
          {MINS.map((m) => (
            <Link
              key={m}
              href={`/find-funding?${data.state ? `state=${data.state}&` : ''}min=${m}`}
              className={`px-3 py-1.5 rounded-full border ${data.minAmount === m ? 'bg-stone-900 text-stone-50 border-stone-900' : 'border-stone-300 hover:border-stone-500'}`}
            >
              ≥ {fmtMoney(m)}
            </Link>
          ))}
        </div>
      </section>

      {/* Live grants */}
      <section className="px-6 py-12 border-b border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900 mb-2 flex items-baseline gap-2">
            <Coins className="w-6 h-6 self-center" /> Live grants you can apply for
          </h2>
          <p className="text-stone-700 text-sm mb-5">
            {data.grants.length} grants visible. {data.state ? `State filter: ${data.state}. ` : ''}{data.minAmount ? `Minimum amount: ${fmtMoney(data.minAmount)}.` : ''}
          </p>
          {data.grants.length === 0 ? (
            <p className="text-stone-600 italic">No grants match the current filters. Try clearing them.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.grants.map((g) => (
                <a
                  key={g.id}
                  href={g.url || '#'}
                  target={g.url ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="border border-stone-200 bg-white rounded-md p-4 hover:shadow-md transition block"
                >
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3 className="font-bold text-stone-900">{g.name}</h3>
                    {g.url && <ExternalLink className="w-3 h-3 text-stone-400 self-center" />}
                  </div>
                  {g.provider && (
                    <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">{g.provider}</p>
                  )}
                  {(g.amount_min || g.amount_max) && (
                    <p className="text-sm font-mono text-stone-800">
                      {g.amount_min ? fmtMoney(g.amount_min) : '?'} – {g.amount_max ? fmtMoney(g.amount_max) : '?'}
                    </p>
                  )}
                  {g.deadline && (
                    <p className="text-xs text-stone-600 flex items-baseline gap-1 mt-1">
                      <Calendar className="w-3 h-3 self-center" /> Closes {g.deadline}
                    </p>
                  )}
                  {g.description && (
                    <p className="text-sm text-stone-700 line-clamp-2 mt-2">{g.description}</p>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top YJ-leaning foundations */}
      <section className="px-6 py-12 border-b border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900 mb-2 flex items-baseline gap-2">
            <Heart className="w-6 h-6 self-center" /> Foundations supporting youth justice
          </h2>
          <p className="text-stone-700 text-sm mb-5">
            Top 15 by tracked YJ-relevant grants (LLM-classified). Foundations classified across all grants — not just YJ.
            <Link href="/intelligence/civic/foundations" className="ml-2 underline text-stone-700">
              See the asymmetry analysis →
            </Link>
          </p>
          <ol className="space-y-2">
            {data.foundations.map((f, i) => (
              <li key={f.foundation_name} className="border border-stone-200 bg-white rounded-md p-3 flex items-baseline justify-between gap-3 flex-wrap">
                <span className="flex items-baseline gap-3">
                  <span className="text-xs font-mono text-stone-500 w-6">{i + 1}.</span>
                  <span className="font-medium text-stone-900">{f.foundation_name}</span>
                  {f.yj_relevant_dollars > 0 && (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      {fmtMoney(f.yj_relevant_dollars)} YJ-tagged
                    </span>
                  )}
                </span>
                <span className="text-sm font-mono text-stone-600">
                  {fmtMoney(f.total_given)} · {f.grants_count} grants
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Government programs */}
      <section className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900 mb-2 flex items-baseline gap-2">
            <Building2 className="w-6 h-6 self-center" /> Current government programs
          </h2>
          <p className="text-stone-700 text-sm mb-5">
            {data.programs.length} programs (announced / in progress / implemented).
            <Link href="/intelligence/civic/government-programs" className="ml-2 underline text-stone-700">
              See the full inventory →
            </Link>
          </p>
          <ol className="space-y-2">
            {data.programs.map((p) => (
              <li key={p.id} className={`border rounded-md p-3 ${p.evidence_community_led ? 'border-emerald-300 bg-emerald-50' : 'border-stone-200 bg-white'}`}>
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <span className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">{p.jurisdiction}</span>
                    <span className="font-medium text-stone-900">{p.name}</span>
                    {p.evidence_community_led && (
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Community-led</span>
                    )}
                    <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">{p.status}</span>
                  </span>
                  <span className="text-sm font-mono text-stone-700">{fmtMoney(p.budget_amount) || '—'}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
