import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, TrendingDown, TrendingUp, Users, Shield } from 'lucide-react';
import { Metadata } from 'next';

import { fmt } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Big vs Small — Who Gets the Money? | JusticeHub',
  description:
    'The top 10 youth justice providers receive billions. Community organisations get scraps. Same young people. Different outcomes. Follow the money.',
};

interface OrgRow {
  name: string;
  state: string;
  isIndigenous: boolean;
  totalFunding: number;
  grantCount: number;
  almaModels: number;
  evidenceItems: number;
  avgCostPerYP: number | null;
}

export default async function BigVsSmallPage() {
  const supabase = createServiceClient() as any;

  // Direct query for top funded
  const { data: fundingAgg } = await supabase
    .from('justice_funding')
    .select('alma_organization_id, amount_dollars')
    .gt('amount_dollars', 0)
    .not('alma_organization_id', 'is', null)
    .limit(50000);

  const orgTotals: Record<string, number> = {};
  const orgGrantCounts: Record<string, number> = {};
  for (const row of fundingAgg || []) {
    const id = row.alma_organization_id;
    const amt = Number(row.amount_dollars) || 0;
    orgTotals[id] = (orgTotals[id] || 0) + amt;
    orgGrantCounts[id] = (orgGrantCounts[id] || 0) + 1;
  }

  const topIds = Object.entries(orgTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([id]) => id);

  // Get org details + ALMA data for top orgs
  const { data: topOrgs } = await supabase
    .from('organizations')
    .select('id, name, state, is_indigenous_org')
    .in('id', topIds);

  const topOrgMap: Record<string, any> = {};
  for (const o of topOrgs || []) topOrgMap[o.id] = o;

  // Get ALMA intervention counts and costs for these orgs
  const { data: almaData } = await supabase
    .from('alma_interventions')
    .select('operating_organization_id, cost_per_young_person, evidence_level')
    .in('operating_organization_id', topIds)
    .neq('verification_status', 'ai_generated');

  const almaByOrg: Record<string, { count: number; costs: number[]; evidence: string[] }> = {};
  for (const a of almaData || []) {
    const id = a.operating_organization_id;
    if (!almaByOrg[id]) almaByOrg[id] = { count: 0, costs: [], evidence: [] };
    almaByOrg[id].count++;
    if (a.cost_per_young_person) almaByOrg[id].costs.push(Number(a.cost_per_young_person));
    if (a.evidence_level) almaByOrg[id].evidence.push(a.evidence_level);
  }

  const bigProviders: OrgRow[] = topIds.slice(0, 10).map((id) => ({
    name: topOrgMap[id]?.name || 'Unknown',
    state: topOrgMap[id]?.state || '',
    isIndigenous: topOrgMap[id]?.is_indigenous_org || false,
    totalFunding: orgTotals[id],
    grantCount: orgGrantCounts[id] || 0,
    almaModels: almaByOrg[id]?.count || 0,
    evidenceItems: 0,
    avgCostPerYP: almaByOrg[id]?.costs.length
      ? almaByOrg[id].costs.reduce((a, b) => a + b, 0) / almaByOrg[id].costs.length
      : null,
  }));

  // Community alternatives: Indigenous orgs with ALMA models and cost data
  const { data: communityAlma } = await supabase
    .from('alma_interventions')
    .select('operating_organization_id, cost_per_young_person, evidence_level, name')
    .neq('verification_status', 'ai_generated')
    .not('cost_per_young_person', 'is', null)
    .lt('cost_per_young_person', 100000)
    .order('cost_per_young_person', { ascending: true })
    .limit(200);

  // Group by org
  const communityByOrg: Record<string, { models: number; costs: number[]; evidence: string[]; names: string[] }> = {};
  for (const a of communityAlma || []) {
    const id = a.operating_organization_id;
    if (!communityByOrg[id]) communityByOrg[id] = { models: 0, costs: [], evidence: [], names: [] };
    communityByOrg[id].models++;
    communityByOrg[id].costs.push(Number(a.cost_per_young_person));
    if (a.evidence_level) communityByOrg[id].evidence.push(a.evidence_level);
    communityByOrg[id].names.push(a.name);
  }

  const communityOrgIds = Object.keys(communityByOrg).filter((id) => !topIds.includes(id)).slice(0, 50);
  const { data: communityOrgs } = await supabase
    .from('organizations')
    .select('id, name, state, is_indigenous_org')
    .in('id', communityOrgIds.length > 0 ? communityOrgIds : ['none'])
    .eq('is_indigenous_org', true);

  const communityOrgMap: Record<string, any> = {};
  for (const o of communityOrgs || []) communityOrgMap[o.id] = o;

  const alternatives: Array<OrgRow & { programNames: string[] }> = communityOrgIds
    .filter((id) => communityOrgMap[id])
    .map((id) => ({
      name: communityOrgMap[id].name,
      state: communityOrgMap[id].state,
      isIndigenous: true,
      totalFunding: orgTotals[id] || 0,
      grantCount: orgGrantCounts[id] || 0,
      almaModels: communityByOrg[id].models,
      evidenceItems: 0,
      avgCostPerYP: communityByOrg[id].costs.reduce((a, b) => a + b, 0) / communityByOrg[id].costs.length,
      programNames: communityByOrg[id].names,
    }))
    .sort((a, b) => (a.avgCostPerYP || 999999) - (b.avgCostPerYP || 999999))
    .slice(0, 10);

  // Totals for the contrast
  const bigTotal = bigProviders.reduce((s, o) => s + o.totalFunding, 0);
  const smallTotal = alternatives.reduce((s, o) => s + o.totalFunding, 0);
  const bigAvgCost = bigProviders.filter((o) => o.avgCostPerYP).map((o) => o.avgCostPerYP!);
  const smallAvgCost = alternatives.filter((o) => o.avgCostPerYP).map((o) => o.avgCostPerYP!);
  const bigCostAvg = bigAvgCost.length ? bigAvgCost.reduce((a, b) => a + b, 0) / bigAvgCost.length : 0;
  const smallCostAvg = smallAvgCost.length ? smallAvgCost.reduce((a, b) => a + b, 0) / smallAvgCost.length : 0;

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <Link href="/follow-the-money" className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 mb-4">
              Follow the Money <ArrowRight className="w-3 h-3" />
            </Link>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
              <p className="text-sm uppercase tracking-[0.3em] text-[#DC2626]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                The Comparison
              </p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Big vs Small
            </h1>
            <p className="text-lg text-white/70 max-w-2xl">
              The top 10 providers receive {fmt(bigTotal)}. Indigenous community
              organisations with proven ALMA models receive {fmt(smallTotal)}.
              Same young people. Different outcomes. Different costs.
            </p>
          </div>
        </section>

        {/* The contrast */}
        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16">
          {/* Headline comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="bg-[#DC2626]/5 rounded-xl border border-[#DC2626]/20 p-8">
              <TrendingDown className="w-6 h-6 text-[#DC2626] mb-3" />
              <p className="text-sm uppercase tracking-wider text-[#DC2626] mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Top 10 Providers
              </p>
              <p className="text-4xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {fmt(bigTotal)}
              </p>
              <div className="space-y-1 text-sm text-[#0A0A0A]/60">
                <p>{bigProviders.reduce((s, o) => s + o.almaModels, 0)} ALMA models between them</p>
                {bigCostAvg > 0 && <p>Average cost: <strong className="text-[#DC2626]">{fmt(bigCostAvg)}/young person</strong></p>}
                <p>{bigProviders.filter((o) => !o.isIndigenous).length} of 10 are non-Indigenous</p>
              </div>
            </div>

            <div className="bg-[#059669]/5 rounded-xl border border-[#059669]/20 p-8">
              <TrendingUp className="w-6 h-6 text-[#059669] mb-3" />
              <p className="text-sm uppercase tracking-wider text-[#059669] mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Community Alternatives
              </p>
              <p className="text-4xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {fmt(smallTotal)}
              </p>
              <div className="space-y-1 text-sm text-[#0A0A0A]/60">
                <p>{alternatives.reduce((s, o) => s + o.almaModels, 0)} ALMA models with evidence</p>
                {smallCostAvg > 0 && <p>Average cost: <strong className="text-[#059669]">{fmt(smallCostAvg)}/young person</strong></p>}
                <p>All Indigenous-led, community-controlled</p>
              </div>
            </div>
          </div>

          {bigCostAvg > 0 && smallCostAvg > 0 && (
            <div className="bg-[#0A0A0A] text-white rounded-xl p-8 mb-16 text-center">
              <p className="text-sm text-white/50 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Cost ratio</p>
              <p className="text-5xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {Math.round(bigCostAvg / smallCostAvg)}x
              </p>
              <p className="text-white/60 max-w-lg mx-auto">
                The top providers cost <strong className="text-[#DC2626]">{Math.round(bigCostAvg / smallCostAvg)} times more</strong> per
                young person than community alternatives. For the same money,
                community models could reach {Math.round(bigCostAvg / smallCostAvg)} times as many young people.
              </p>
            </div>
          )}

          {/* Big providers table */}
          <section className="mb-16">
            <h2 className="text-xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Top 10 Funded Providers
            </h2>
            <div className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-[#0A0A0A]/5 text-xs font-semibold text-[#0A0A0A]/50" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <div className="col-span-4">Organisation</div>
                <div className="col-span-2 text-right">Funding</div>
                <div className="col-span-1 text-right">Grants</div>
                <div className="col-span-2 text-right">ALMA Models</div>
                <div className="col-span-2 text-right">Cost/YP</div>
                <div className="col-span-1 text-center">Indigenous</div>
              </div>
              {bigProviders.map((org, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-5 py-3 border-t border-[#0A0A0A]/5 items-center text-sm">
                  <div className="col-span-4 truncate font-medium">{org.name}</div>
                  <div className="col-span-2 text-right font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(org.totalFunding)}</div>
                  <div className="col-span-1 text-right text-[#0A0A0A]/50" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{org.grantCount}</div>
                  <div className="col-span-2 text-right">
                    {org.almaModels > 0 ? (
                      <span className="text-[#0A0A0A]/70">{org.almaModels}</span>
                    ) : (
                      <span className="text-[#DC2626]/60">0</span>
                    )}
                  </div>
                  <div className="col-span-2 text-right" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {org.avgCostPerYP ? (
                      <span className="text-[#DC2626] font-medium">{fmt(org.avgCostPerYP)}</span>
                    ) : (
                      <span className="text-[#0A0A0A]/30">—</span>
                    )}
                  </div>
                  <div className="col-span-1 text-center">
                    {org.isIndigenous ? (
                      <span className="text-xs text-[#059669]">Yes</span>
                    ) : (
                      <span className="text-xs text-[#0A0A0A]/30">No</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Community alternatives */}
          <section className="mb-16">
            <h2 className="text-xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Community Alternatives — Indigenous-Led, Evidence-Backed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alternatives.map((org, i) => (
                <div key={i} className="bg-white rounded-xl border border-[#059669]/20 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-sm">{org.name}</h3>
                      <p className="text-xs text-[#0A0A0A]/50">{org.state} · Indigenous-led</p>
                    </div>
                    <Shield className="w-4 h-4 text-[#059669] shrink-0" />
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {org.avgCostPerYP && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#059669]/10 text-[#059669] font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {fmt(org.avgCostPerYP)}/person
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#0A0A0A]/5 text-[#0A0A0A]/50">
                      {org.almaModels} ALMA model{org.almaModels !== 1 ? 's' : ''}
                    </span>
                    {org.totalFunding > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#0A0A0A]/5 text-[#0A0A0A]/50" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {fmt(org.totalFunding)} received
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#0A0A0A]/40">
                    {org.programNames.slice(0, 3).join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              The money is there. The alternatives exist.
            </h2>
            <p className="text-white/70 mb-6 max-w-2xl">
              Every dollar spent on a system that costs {bigCostAvg > 0 ? fmt(bigCostAvg) : '$200K+'} per
              young person is a dollar that could fund {bigCostAvg > 0 && smallCostAvg > 0 ? Math.round(bigCostAvg / smallCostAvg) : 5}+ community
              alternatives. The ALMA Network is building the proof. Join us.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/network/alma" className="px-5 py-2.5 bg-white text-[#0A0A0A] font-semibold rounded-lg text-sm hover:bg-white/90">
                Explore the ALMA Network
              </Link>
              <Link href="/join" className="px-5 py-2.5 border border-white/30 text-white font-semibold rounded-lg text-sm hover:bg-white/10">
                Join the Network
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
