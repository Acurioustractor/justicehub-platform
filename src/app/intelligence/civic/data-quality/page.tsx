import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Data quality — what we know and what we don\'t | JusticeHub',
  description:
    'Where the JusticeHub civic intelligence layer has gaps. Per-state Tier 1 coverage, foundation funding tracking, ACCO certification, philanthropy YJ-relevance.',
};

interface StateRow {
  state: string;
  tier1_orgs: number;
  with_yj_funding: number;
  with_foundation_funding: number;
  acco: number;
}

interface CompletenessRow {
  tier1_total: number;
  acco_certified: number;
  with_logo: number;
  with_email: number;
  with_history: number;
  with_ar_url: number;
  avg_completeness: number;
}

async function fetchAuditData() {
  const supabase = createServiceClient() as any;
  const totalsRes = await supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .neq('archived', true);

  // Direct queries that don't depend on RPC
  const { data: stateRows } = await supabase
    .from('v_entity_360')
    .select('state, is_confirmed_tier1, acco_certified, total_justice_funding_received, foundation_dollars_received')
    .eq('is_confirmed_tier1', true);

  const byState: Record<string, StateRow> = {};
  for (const r of stateRows || []) {
    const s = r.state || 'NULL';
    if (!byState[s]) byState[s] = { state: s, tier1_orgs: 0, with_yj_funding: 0, with_foundation_funding: 0, acco: 0 };
    byState[s].tier1_orgs++;
    if (Number(r.total_justice_funding_received) > 0) byState[s].with_yj_funding++;
    if (Number(r.foundation_dollars_received) > 0) byState[s].with_foundation_funding++;
    if (r.acco_certified) byState[s].acco++;
  }
  const stateArr = Object.values(byState).sort((a, b) => b.tier1_orgs - a.tier1_orgs);

  // Per-org enrichment completeness for Tier 1
  let completeness: CompletenessRow = {
    tier1_total: 0, acco_certified: 0, with_logo: 0, with_email: 0,
    with_history: 0, with_ar_url: 0, avg_completeness: 0,
  };
  // Use the cleaner direct query
  const { data: enrichRows } = await supabase
    .from('organizations')
    .select('id, abn, logo_url, contact_email, history_summary, annual_report_url, acco_certified, profile_completeness_score, civic_org_classifications!inner(tier, confirmed_at)')
    .eq('civic_org_classifications.tier', 1)
    .not('civic_org_classifications.confirmed_at', 'is', null);

  if (enrichRows) {
    completeness.tier1_total = enrichRows.length;
    let scoreSum = 0;
    let scoreCount = 0;
    for (const o of enrichRows as any[]) {
      if (o.acco_certified) completeness.acco_certified++;
      if (o.logo_url) completeness.with_logo++;
      if (o.contact_email) completeness.with_email++;
      if (o.history_summary) completeness.with_history++;
      if (o.annual_report_url) completeness.with_ar_url++;
      if (o.profile_completeness_score != null) {
        scoreSum += Number(o.profile_completeness_score);
        scoreCount++;
      }
    }
    completeness.avg_completeness = scoreCount > 0 ? scoreSum / scoreCount : 0;
  }

  // Foundation YJ-classification progress
  const { count: totalGrants } = await supabase
    .from('foundation_grantees')
    .select('id', { count: 'exact', head: true });
  const { count: classifiedGrants } = await supabase
    .from('foundation_grantees')
    .select('id', { count: 'exact', head: true })
    .not('yj_classified_at', 'is', null);
  const { count: yjRelevantGrants } = await supabase
    .from('foundation_grantees')
    .select('id', { count: 'exact', head: true })
    .eq('yj_relevant', true);

  // Total ABN coverage
  const totalOrgs = totalsRes.count || 0;
  const { count: orgsWithAbn } = await supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .neq('archived', true)
    .not('abn', 'is', null);

  return {
    states: stateArr,
    completeness,
    foundations: { totalGrants: totalGrants || 0, classifiedGrants: classifiedGrants || 0, yjRelevantGrants: yjRelevantGrants || 0 },
    orgs: { total: totalOrgs, withAbn: orgsWithAbn || 0 },
  };
}

function StateGapRow({ row }: { row: StateRow }) {
  const yjPct = row.tier1_orgs > 0 ? (row.with_yj_funding / row.tier1_orgs) * 100 : 0;
  const fdnPct = row.tier1_orgs > 0 ? (row.with_foundation_funding / row.tier1_orgs) * 100 : 0;
  return (
    <tr className="border-b border-stone-200">
      <td className="py-2 px-3 font-medium">{row.state}</td>
      <td className="py-2 px-3 text-right font-mono">{row.tier1_orgs}</td>
      <td className="py-2 px-3 text-right font-mono">{row.acco}</td>
      <td className="py-2 px-3 text-right font-mono">
        {row.with_yj_funding} <span className="text-stone-500">({yjPct.toFixed(0)}%)</span>
      </td>
      <td className="py-2 px-3 text-right font-mono">
        {row.with_foundation_funding}{' '}
        <span className={fdnPct < 30 ? 'text-rose-700 font-bold' : 'text-stone-500'}>
          ({fdnPct.toFixed(0)}%)
        </span>
      </td>
    </tr>
  );
}

export default async function DataQualityPage() {
  const data = await fetchAuditData();
  const { completeness } = data;
  const pct = (n: number, d: number) => d > 0 ? ((n / d) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-6 text-sm flex-wrap">
          <Link href="/" className="font-mono uppercase tracking-widest text-xs text-stone-700 hover:text-stone-900">JusticeHub</Link>
          <Link href="/intelligence/civic" className="text-stone-600 hover:text-stone-900 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Civic Intelligence
          </Link>
          <span className="text-stone-400">/</span>
          <span className="text-stone-900 font-medium">Data Quality</span>
        </div>
      </nav>

      <section className="bg-stone-900 text-stone-50 px-6 py-16 border-b border-stone-700">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-3">Methodology · Audit</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
            What we know and where we don&apos;t.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-stone-300">
            This page is the honest accounting of the civic intelligence layer. Where the data is rich, where it is
            thin, and which claims need caveats.
          </p>
        </div>
      </section>

      {/* Per-state Tier 1 coverage */}
      <section className="px-6 py-12 border-b border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-2">Per-state Tier 1 funding coverage</h2>
          <p className="text-stone-700 text-sm mb-5 max-w-2xl">
            What share of each state&apos;s confirmed Tier 1 frontline YJ organisations have tracked funding data.
            Low foundation coverage is a data gap, not an absence — see notes.
          </p>
          <table className="w-full text-sm border border-stone-200 bg-white">
            <thead className="bg-stone-100">
              <tr className="border-b border-stone-200 text-left">
                <th className="py-2 px-3 font-mono text-xs uppercase tracking-widest text-stone-600">State</th>
                <th className="py-2 px-3 font-mono text-xs uppercase tracking-widest text-stone-600 text-right">Tier 1 orgs</th>
                <th className="py-2 px-3 font-mono text-xs uppercase tracking-widest text-stone-600 text-right">ACCO</th>
                <th className="py-2 px-3 font-mono text-xs uppercase tracking-widest text-stone-600 text-right">With YJ funding</th>
                <th className="py-2 px-3 font-mono text-xs uppercase tracking-widest text-stone-600 text-right">With foundation $</th>
              </tr>
            </thead>
            <tbody>
              {data.states.map((s) => <StateGapRow key={s.state} row={s} />)}
            </tbody>
          </table>
          <p className="text-xs text-stone-500 mt-3 italic">
            SA/ACT/TAS show zero foundation funding because our foundation_grantees table tracks 179 of the ~9,000 active
            Australian grant-makers. The gap is in the data, not the world.
          </p>
        </div>
      </section>

      {/* Tier 1 enrichment completeness */}
      <section className="px-6 py-12 border-b border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-2">Tier 1 organisation enrichment</h2>
          <p className="text-stone-700 text-sm mb-5 max-w-2xl">
            Per-field coverage on the {completeness.tier1_total} confirmed Tier 1 frontline YJ organisations. The civic
            page currently renders these mostly as bare text — most do not yet have logos or contact data.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="border border-stone-200 bg-white p-4 rounded-md">
              <div className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">ACCO certified</div>
              <div className="text-2xl font-bold text-stone-900">{completeness.acco_certified}</div>
              <div className="text-xs text-stone-500">{pct(completeness.acco_certified, completeness.tier1_total)}%</div>
            </div>
            <div className="border border-stone-200 bg-white p-4 rounded-md">
              <div className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">Has logo</div>
              <div className="text-2xl font-bold text-rose-700">{completeness.with_logo}</div>
              <div className="text-xs text-stone-500">{pct(completeness.with_logo, completeness.tier1_total)}%</div>
            </div>
            <div className="border border-stone-200 bg-white p-4 rounded-md">
              <div className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">Has email</div>
              <div className="text-2xl font-bold text-rose-700">{completeness.with_email}</div>
              <div className="text-xs text-stone-500">{pct(completeness.with_email, completeness.tier1_total)}%</div>
            </div>
            <div className="border border-stone-200 bg-white p-4 rounded-md">
              <div className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">Has history</div>
              <div className="text-2xl font-bold text-rose-700">{completeness.with_history}</div>
              <div className="text-xs text-stone-500">{pct(completeness.with_history, completeness.tier1_total)}%</div>
            </div>
            <div className="border border-stone-200 bg-white p-4 rounded-md">
              <div className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">Has annual report URL</div>
              <div className="text-2xl font-bold text-rose-700">{completeness.with_ar_url}</div>
              <div className="text-xs text-stone-500">{pct(completeness.with_ar_url, completeness.tier1_total)}%</div>
            </div>
            <div className="border border-stone-200 bg-white p-4 rounded-md">
              <div className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">Avg completeness</div>
              <div className="text-2xl font-bold text-stone-900">{completeness.avg_completeness.toFixed(2)}</div>
              <div className="text-xs text-stone-500">on a 0..1 scale</div>
            </div>
          </div>
        </div>
      </section>

      {/* Foundation grant YJ classification progress */}
      <section className="px-6 py-12 border-b border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-2">Foundation grant YJ classification</h2>
          <p className="text-stone-700 text-sm mb-5 max-w-2xl">
            LLM classification of foundation_grantees rows for YJ relevance. Until this hits 100%, the
            &ldquo;philanthropy to YJ&rdquo; claims read against the partially-classified subset.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-stone-200 bg-white p-4 rounded-md">
              <div className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">Total grants</div>
              <div className="text-2xl font-bold text-stone-900">{data.foundations.totalGrants.toLocaleString()}</div>
            </div>
            <div className="border border-stone-200 bg-white p-4 rounded-md">
              <div className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">Classified</div>
              <div className="text-2xl font-bold text-stone-900">{data.foundations.classifiedGrants.toLocaleString()}</div>
              <div className="text-xs text-stone-500">{pct(data.foundations.classifiedGrants, data.foundations.totalGrants)}%</div>
            </div>
            <div className="border border-stone-200 bg-white p-4 rounded-md">
              <div className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">YJ-relevant</div>
              <div className="text-2xl font-bold text-rose-700">{data.foundations.yjRelevantGrants.toLocaleString()}</div>
              <div className="text-xs text-stone-500">
                {data.foundations.classifiedGrants > 0
                  ? pct(data.foundations.yjRelevantGrants, data.foundations.classifiedGrants) + '% of classified'
                  : 'n/a'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABN backbone health */}
      <section className="px-6 py-12 bg-stone-100">
        <div className="max-w-5xl mx-auto text-sm text-stone-700">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-2">ABN backbone health</h2>
          <p className="mb-3 max-w-2xl">The ABN is our universal entity-resolution join key. Coverage matters.</p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Active organisations: {data.orgs.total.toLocaleString()} · with ABN: {data.orgs.withAbn.toLocaleString()} ({pct(data.orgs.withAbn, data.orgs.total)}%)</li>
            <li>ABR registry holds 20.0M ABNs — refresh detector runs weekly</li>
            <li>ACNC charities: 65,304 (all with ABN)</li>
            <li>ORIC corporations: 7,369 total, 3,895 with ABN (after trigram backfill stage 1)</li>
            <li>Known duplicate org rows sharing ABNs: ~5,513 (entity dedup script in design)</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
