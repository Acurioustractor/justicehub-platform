import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { SnapshotStatCard } from '@/components/intelligence/civic/SnapshotStatCard';
import { getAllClaims } from '@/lib/civic-intelligence/queries';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Foundation philanthropy and the access gap | JusticeHub',
  description:
    'Where Australian foundation philanthropy goes when it talks about Aboriginal community-led work. Tracking the share of dollars that reach ACCOs.',
};

interface TopFoundation {
  name: string;
  total: number;
  grants: number;
}
interface TopRecipient {
  org_id: string;
  name: string;
  slug: string | null;
  state: string | null;
  acco_certified: boolean;
  total_received: number;
  grant_count: number;
}

async function fetchTopFoundations(): Promise<TopFoundation[]> {
  const supabase = createServiceClient() as any;
  // Aggregate in JS — paginate the table because rollups require all rows
  const totals = new Map<string, { total: number; grants: number }>();
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data } = await supabase
      .from('foundation_grantees')
      .select('foundation_name, grant_amount')
      .range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    for (const r of data) {
      const name = r.foundation_name?.trim();
      if (!name) continue;
      const amt = Number(r.grant_amount || 0);
      const cur = totals.get(name) || { total: 0, grants: 0 };
      cur.total += amt;
      cur.grants++;
      totals.set(name, cur);
    }
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return Array.from(totals.entries())
    .map(([name, v]) => ({ name, total: v.total, grants: v.grants }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);
}

async function fetchTopRecipients(accoOnly: boolean): Promise<TopRecipient[]> {
  const supabase = createServiceClient() as any;
  // Paginate foundation_grantees, aggregate per ABN, then join to organizations.
  const byAbn = new Map<string, { total: number; grants: number }>();
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data } = await supabase
      .from('foundation_grantees')
      .select('grantee_abn, grant_amount')
      .not('grantee_abn', 'is', null)
      .range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    for (const r of data) {
      const abn = r.grantee_abn;
      const amt = Number(r.grant_amount || 0);
      if (!amt) continue;
      const cur = byAbn.get(abn) || { total: 0, grants: 0 };
      cur.total += amt;
      cur.grants++;
      byAbn.set(abn, cur);
    }
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  // Lookup orgs in batches of 100 ABNs
  const abns = Array.from(byAbn.keys());
  const orgsByAbn = new Map<string, { id: string; name: string; slug: string; state: string; acco_certified: boolean }>();
  for (let i = 0; i < abns.length; i += 100) {
    const chunk = abns.slice(i, i + 100);
    const { data } = await supabase
      .from('organizations')
      .select('id, abn, name, slug, state, acco_certified')
      .in('abn', chunk);
    for (const o of data || []) {
      if (!orgsByAbn.has(o.abn)) orgsByAbn.set(o.abn, o);
    }
  }
  const rows: TopRecipient[] = [];
  for (const [abn, v] of byAbn.entries()) {
    const org = orgsByAbn.get(abn);
    if (!org) continue;
    if (accoOnly && !org.acco_certified) continue;
    rows.push({
      org_id: org.id,
      name: org.name,
      slug: org.slug,
      state: org.state,
      acco_certified: org.acco_certified,
      total_received: v.total,
      grant_count: v.grants,
    });
  }
  return rows.sort((a, b) => b.total_received - a.total_received).slice(0, 12);
}

export default async function FoundationsPage() {
  const [claims, topFoundations, topRecipients, topAccoRecipients] = await Promise.all([
    getAllClaims(),
    fetchTopFoundations(),
    fetchTopRecipients(false),
    fetchTopRecipients(true),
  ]);

  const accoShareClaim = claims['access.share.foundation_dollars_to_acco.national'];

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-6 text-sm flex-wrap">
          <Link href="/" className="font-mono uppercase tracking-widest text-xs text-stone-700 hover:text-stone-900">JusticeHub</Link>
          <Link href="/intelligence/civic" className="text-stone-600 hover:text-stone-900 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Civic Intelligence
          </Link>
          <span className="text-stone-400">/</span>
          <span className="text-stone-900 font-medium">Foundations</span>
          <Link href="/intelligence/civic/methodology" className="ml-auto text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900">
            Methodology
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-stone-900 text-stone-50 px-6 py-20 border-b border-stone-700">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-3">Foundations · National Picture</p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Where philanthropy goes when it talks about Aboriginal community-led work.
          </h1>
          <p className="mt-5 max-w-2xl text-lg md:text-xl text-stone-300">
            The Australian foundation sector hands out hundreds of millions of dollars each year. A precise share of
            that money reaches Aboriginal Community Controlled Organisations. This page surfaces the number.
          </p>
        </div>
      </section>

      {/* Headline */}
      {accoShareClaim && (
        <section className="px-6 py-16 border-b border-stone-200">
          <div className="max-w-5xl mx-auto">
            <div className="border-2 border-rose-300 bg-rose-50 rounded-lg p-6">
              <p className="text-xs font-mono uppercase tracking-widest text-rose-700 mb-3">
                The ACCO share
              </p>
              <SnapshotStatCard
                claim={accoShareClaim}
                displayValue={
                  accoShareClaim.value_numeric != null
                    ? `${(Number(accoShareClaim.value_numeric) * 100).toFixed(2)}%`
                    : 'n/a'
                }
                accent="urgent"
                size="lg"
              />
              <p className="mt-5 text-sm text-stone-700">
                ACCOs deliver more than half of the confirmed Tier 1 frontline youth-justice work in Australia. They
                receive less than two percent of tracked foundation philanthropy. The denominator here is{' '}
                <strong>foundation_grantees</strong> — the grants we have records for, which is a partial census of the
                sector. The numerator is grants whose recipient ABN is registered with the Office of the Registrar of
                Indigenous Corporations (ORIC). The gap is real even with that bounded universe.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Top foundations by spend */}
      <section className="px-6 py-16 border-b border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 mb-3">Top foundations by tracked spend</h2>
          <p className="text-stone-700 mb-6 max-w-2xl">
            The largest known grant-givers in our database. This is a partial census — foundations that don&apos;t
            publish grantee lists or report through ACNC AIS won&apos;t appear here.
          </p>
          <ol className="space-y-2">
            {topFoundations.map((f, i) => (
              <li key={f.name} className="flex items-baseline justify-between gap-3 border border-stone-200 bg-white rounded-md px-4 py-3 flex-wrap">
                <span className="flex items-baseline gap-3">
                  <span className="text-xs font-mono text-stone-500 w-6">{i + 1}.</span>
                  <span className="font-medium text-stone-900">{f.name}</span>
                </span>
                <span className="text-sm font-mono text-stone-700">
                  ${(f.total / 1_000_000).toFixed(1)}M · {f.grants.toLocaleString()} grants
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Top recipients */}
      <section className="px-6 py-16 border-b border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 mb-3">Top recipients</h2>
          <p className="text-stone-700 mb-6 max-w-2xl">
            The largest known recipients of foundation grants, joined via ABN to JusticeHub organisations.
          </p>
          <ol className="space-y-2">
            {topRecipients.map((r, i) => (
              <li key={r.org_id} className="flex items-baseline justify-between gap-3 border border-stone-200 bg-white rounded-md px-4 py-3 flex-wrap">
                <span className="flex items-baseline gap-3">
                  <span className="text-xs font-mono text-stone-500 w-6">{i + 1}.</span>
                  {r.slug ? (
                    <Link href={`/sites/${r.slug}`} className="font-medium text-stone-900 hover:underline">{r.name}</Link>
                  ) : (
                    <span className="font-medium text-stone-900">{r.name}</span>
                  )}
                  {r.acco_certified && (
                    <span className="text-xs font-mono uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">ACCO</span>
                  )}
                  {r.state && <span className="text-xs font-mono text-stone-500">{r.state}</span>}
                </span>
                <span className="text-sm font-mono text-stone-700">
                  ${(r.total_received / 1_000_000).toFixed(2)}M · {r.grant_count} grants
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Top ACCO recipients */}
      <section className="px-6 py-16 border-b border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 mb-3">Top ACCO recipients</h2>
          <p className="text-stone-700 mb-6 max-w-2xl">
            Aboriginal Community Controlled Organisations that have received the most foundation philanthropy in our
            data. ACCO status is confirmed via ORIC registration.
          </p>
          {topAccoRecipients.length === 0 ? (
            <p className="text-stone-600 italic">
              No ACCO recipients matched in our data. This may indicate a join gap (ORIC ABNs not yet backfilled) more
              than a true absence — see methodology.
            </p>
          ) : (
            <ol className="space-y-2">
              {topAccoRecipients.map((r, i) => (
                <li key={r.org_id} className="flex items-baseline justify-between gap-3 border border-emerald-200 bg-emerald-50 rounded-md px-4 py-3 flex-wrap">
                  <span className="flex items-baseline gap-3">
                    <span className="text-xs font-mono text-stone-500 w-6">{i + 1}.</span>
                    {r.slug ? (
                      <Link href={`/sites/${r.slug}`} className="font-medium text-stone-900 hover:underline">{r.name}</Link>
                    ) : (
                      <span className="font-medium text-stone-900">{r.name}</span>
                    )}
                    {r.state && <span className="text-xs font-mono text-stone-500">{r.state}</span>}
                  </span>
                  <span className="text-sm font-mono text-stone-700">
                    ${(r.total_received / 1_000_000).toFixed(2)}M · {r.grant_count} grants
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Sources */}
      <section className="px-6 py-12 bg-stone-100">
        <div className="max-w-5xl mx-auto text-sm text-stone-700">
          <p className="font-mono uppercase tracking-widest text-xs text-stone-500 mb-3">Sources</p>
          <ul className="space-y-1.5">
            <li><strong>foundation_grantees</strong> — JusticeHub aggregation of foundation grant data from ACNC AIS + public foundation publications. 4,934+ grants from ~179 distinct foundations.</li>
            <li><strong>oric_corporations</strong> — Office of the Registrar of Indigenous Corporations register. Authoritative ACCO test.</li>
            <li><strong>organizations.acco_certified</strong> — TRUE when an org&apos;s ABN appears in oric_corporations. Set by scripts/civic/seed-detention-centres.mjs and refreshed via migrations.</li>
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
