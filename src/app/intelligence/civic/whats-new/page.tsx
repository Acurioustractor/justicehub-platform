/**
 * /intelligence/civic/whats-new
 *
 * Living feed of what's changed across the Centre of Excellence in the last
 * 7 / 30 days. Gives the exhibition kiosk a fresh face every visit; gives
 * journalists + funders a way to see momentum.
 *
 * Sources:
 *   - civic_intelligence_claims.computed_at   → claim added or refreshed
 *   - civic_claim_evidence.contributed_at     → evidence row added (closes a loop)
 *   - civic_org_classifications.confirmed_at  → org confirmed Tier 1
 *   - foundation_grantees.yj_classified_at    → grant classified
 *   - oversight_recommendations.created_at    → oversight rec indexed
 *
 * Everything is timestamped and linkable. Read-only, no admin actions.
 */

import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const revalidate = 600;

interface ChangeEntry {
  ts: string;
  kind: 'claim' | 'evidence' | 'tier1' | 'grant' | 'oversight';
  title: string;
  detail: string;
  href?: string;
}

async function getChanges(): Promise<{
  entries: ChangeEntry[];
  totals7d: { claims: number; evidence: number; tier1: number; grants: number; oversight: number };
  totals30d: { claims: number; evidence: number; tier1: number; grants: number; oversight: number };
}> {
  const supabase = createServiceClient() as any;
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
  const since7 = new Date(Date.now() - 7 * 86400_000).toISOString();

  const [claims, evidence, tier1, grants, oversight] = await Promise.all([
    supabase
      .from('civic_intelligence_claims')
      .select('claim_id, display_label, region, computed_at, verification_status')
      .gt('computed_at', since30)
      .in('verification_status', ['snapshot', 'verified'])
      .order('computed_at', { ascending: false })
      .limit(80),
    supabase
      .from('civic_claim_evidence')
      .select('id, claim_id, source_table, supports, contributed_at')
      .gt('contributed_at', since30)
      .order('contributed_at', { ascending: false })
      .limit(80),
    supabase
      .from('civic_org_classifications')
      .select('id, organization_id, sector_category, confirmed_at, tier')
      .gt('confirmed_at', since30)
      .eq('tier', 1)
      .order('confirmed_at', { ascending: false })
      .limit(60),
    supabase
      .from('foundation_grantees')
      .select('id, grantee_name, foundation_name, grant_amount, yj_classified_at, yj_relevant')
      .gt('yj_classified_at', since30)
      .eq('yj_relevant', true)
      .order('yj_classified_at', { ascending: false })
      .limit(40),
    supabase
      .from('oversight_recommendations')
      .select('id, jurisdiction, oversight_body, recommendation_text, created_at')
      .gt('created_at', since30)
      .order('created_at', { ascending: false })
      .limit(40),
  ]);

  // Fetch org names for tier1 entries
  const orgIds = (tier1.data || []).map((t: any) => t.organization_id);
  const orgsByIdMap = new Map<string, { name: string; slug: string | null }>();
  if (orgIds.length > 0) {
    for (let i = 0; i < orgIds.length; i += 100) {
      const chunk = orgIds.slice(i, i + 100);
      const { data } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .in('id', chunk);
      (data || []).forEach((o: any) => orgsByIdMap.set(o.id, { name: o.name, slug: o.slug }));
    }
  }

  const entries: ChangeEntry[] = [
    ...(claims.data || []).map((c: any) => ({
      ts: c.computed_at,
      kind: 'claim' as const,
      title: c.display_label,
      detail: `Region: ${c.region} · ${c.verification_status}`,
      href: `/intelligence/civic/claim/${encodeURIComponent(c.claim_id)}`,
    })),
    ...(evidence.data || []).map((e: any) => ({
      ts: e.contributed_at,
      kind: 'evidence' as const,
      title: `Evidence row added to ${e.claim_id}`,
      detail: `Source: ${e.source_table} · ${e.supports ? 'supports' : 'contradicts'}`,
      href: `/intelligence/civic/claim/${encodeURIComponent(e.claim_id)}`,
    })),
    ...(tier1.data || []).map((t: any) => {
      const o = orgsByIdMap.get(t.organization_id);
      return {
        ts: t.confirmed_at,
        kind: 'tier1' as const,
        title: o?.name || 'Tier 1 organisation confirmed',
        detail: `Sector: ${t.sector_category || 'unspecified'} · confirmed Tier 1`,
        href: o?.slug ? `/sites/${o.slug}` : undefined,
      };
    }),
    ...(grants.data || []).map((g: any) => ({
      ts: g.yj_classified_at,
      kind: 'grant' as const,
      title: `${g.foundation_name || 'A foundation'} → ${g.grantee_name || 'unknown grantee'}`,
      detail: `${g.grant_amount ? `$${Number(g.grant_amount).toLocaleString()}` : 'amount n/a'} · classified YJ-relevant`,
    })),
    ...(oversight.data || []).map((o: any) => ({
      ts: o.created_at,
      kind: 'oversight' as const,
      title: `${o.oversight_body || 'Oversight body'} recommendation`,
      detail: `${o.jurisdiction || 'jurisdiction n/a'} · ${(o.recommendation_text || '').slice(0, 120)}${o.recommendation_text && o.recommendation_text.length > 120 ? '…' : ''}`,
    })),
  ]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 80);

  // 7-day vs 30-day tallies (head:true keeps payloads tiny)
  const [c7, c30, e7, e30, t7, t30, g7, g30, o7, o30] = await Promise.all([
    supabase.from('civic_intelligence_claims').select('claim_id', { count: 'exact', head: true }).gt('computed_at', since7).in('verification_status', ['snapshot', 'verified']),
    supabase.from('civic_intelligence_claims').select('claim_id', { count: 'exact', head: true }).gt('computed_at', since30).in('verification_status', ['snapshot', 'verified']),
    supabase.from('civic_claim_evidence').select('id', { count: 'exact', head: true }).gt('contributed_at', since7),
    supabase.from('civic_claim_evidence').select('id', { count: 'exact', head: true }).gt('contributed_at', since30),
    supabase.from('civic_org_classifications').select('id', { count: 'exact', head: true }).gt('confirmed_at', since7).eq('tier', 1),
    supabase.from('civic_org_classifications').select('id', { count: 'exact', head: true }).gt('confirmed_at', since30).eq('tier', 1),
    supabase.from('foundation_grantees').select('id', { count: 'exact', head: true }).gt('yj_classified_at', since7).eq('yj_relevant', true),
    supabase.from('foundation_grantees').select('id', { count: 'exact', head: true }).gt('yj_classified_at', since30).eq('yj_relevant', true),
    supabase.from('oversight_recommendations').select('id', { count: 'exact', head: true }).gt('created_at', since7),
    supabase.from('oversight_recommendations').select('id', { count: 'exact', head: true }).gt('created_at', since30),
  ]);

  return {
    entries,
    totals7d: {
      claims: c7.count || 0,
      evidence: e7.count || 0,
      tier1: t7.count || 0,
      grants: g7.count || 0,
      oversight: o7.count || 0,
    },
    totals30d: {
      claims: c30.count || 0,
      evidence: e30.count || 0,
      tier1: t30.count || 0,
      grants: g30.count || 0,
      oversight: o30.count || 0,
    },
  };
}

const KIND_BADGE: Record<ChangeEntry['kind'], { label: string; cls: string }> = {
  claim: { label: 'Claim', cls: 'text-stone-700 bg-stone-100 border-stone-300' },
  evidence: { label: 'Evidence', cls: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  tier1: { label: 'Tier 1', cls: 'text-rose-700 bg-rose-50 border-rose-300' },
  grant: { label: 'Grant', cls: 'text-purple-700 bg-purple-50 border-purple-300' },
  oversight: { label: 'Oversight', cls: 'text-amber-700 bg-amber-50 border-amber-300' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return iso.slice(0, 10);
}

export const metadata = {
  title: 'What changed — Centre of Excellence',
  description: 'Living feed of recent additions to the youth-justice data model: claims, evidence, Tier 1 confirmations, classified grants, oversight findings.',
};

export default async function WhatsNewPage() {
  const { entries, totals7d, totals30d } = await getChanges();

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      {/* HEADER */}
      <header className="border-b-2 border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <Link href="/intelligence/civic/centre-of-excellence" className="text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900">
            ← Centre of Excellence
          </Link>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">What changed</h1>
          <p className="mt-3 max-w-2xl text-stone-700 leading-relaxed">
            Every addition to the youth-justice data model, in the order it happened.
            The data is living. Each row links to its evidence.
          </p>
        </div>
      </header>

      {/* TOTALS */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-5">Last 7 days · last 30 days</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <TotalCard label="Claims refreshed" sevenDay={totals7d.claims} thirtyDay={totals30d.claims} accent="stone" />
          <TotalCard label="Evidence rows added" sevenDay={totals7d.evidence} thirtyDay={totals30d.evidence} accent="emerald" />
          <TotalCard label="Tier 1 confirmations" sevenDay={totals7d.tier1} thirtyDay={totals30d.tier1} accent="rose" />
          <TotalCard label="YJ-relevant grants classified" sevenDay={totals7d.grants} thirtyDay={totals30d.grants} accent="purple" />
          <TotalCard label="Oversight findings indexed" sevenDay={totals7d.oversight} thirtyDay={totals30d.oversight} accent="amber" />
        </div>
      </section>

      {/* FEED */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-5">Most recent {entries.length}</p>
        {entries.length === 0 ? (
          <p className="text-stone-600 italic">No changes recorded in the last 30 days.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((e, i) => (
              <li key={`${e.kind}-${i}-${e.ts}`} className="border-2 border-stone-200 bg-white rounded p-4 hover:border-stone-400 transition-colors">
                <div className="flex items-baseline gap-3 flex-wrap mb-2">
                  <span className={`text-xs font-mono uppercase tracking-widest border px-2 py-0.5 rounded ${KIND_BADGE[e.kind].cls}`}>
                    {KIND_BADGE[e.kind].label}
                  </span>
                  <span className="text-xs font-mono text-stone-500">{relativeTime(e.ts)}</span>
                </div>
                {e.href ? (
                  <Link href={e.href} className="block font-semibold text-stone-900 hover:underline">{e.title}</Link>
                ) : (
                  <p className="font-semibold text-stone-900">{e.title}</p>
                )}
                <p className="mt-1 text-sm text-stone-700">{e.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="bg-stone-900 text-stone-300 py-8">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-2">Refresh cadence</p>
          <p className="text-sm leading-relaxed max-w-3xl">
            This feed regenerates every 10 minutes, pulling from civic_intelligence_claims, civic_claim_evidence, civic_org_classifications, foundation_grantees (YJ-relevant only), and oversight_recommendations.
            Every entry links back to where it lives in the dataset.
          </p>
        </div>
      </footer>
    </main>
  );
}

function TotalCard({
  label,
  sevenDay,
  thirtyDay,
  accent,
}: {
  label: string;
  sevenDay: number;
  thirtyDay: number;
  accent: 'stone' | 'emerald' | 'rose' | 'purple' | 'amber';
}) {
  const cls: Record<string, string> = {
    stone: 'border-stone-300 bg-white',
    emerald: 'border-emerald-300 bg-emerald-50',
    rose: 'border-rose-300 bg-rose-50',
    purple: 'border-purple-300 bg-purple-50',
    amber: 'border-amber-300 bg-amber-50',
  };
  return (
    <div className={`border-2 rounded p-4 ${cls[accent]}`}>
      <p className="text-3xl font-bold text-stone-900">{sevenDay.toLocaleString()}</p>
      <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mt-1">{label}</p>
      <p className="text-xs text-stone-500 mt-1">{thirtyDay.toLocaleString()} · 30d</p>
    </div>
  );
}
