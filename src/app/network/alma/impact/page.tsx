import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { TrendingUp, Users, DollarSign, Shield, ArrowRight, Heart } from 'lucide-react';
import { Metadata } from 'next';

import { fmt } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Network Impact | ALMA Network | JusticeHub',
  description: 'Collective impact of the ALMA Network — community organisations proving alternative models work.',
};

export default async function NetworkImpactPage() {
  const supabase = createServiceClient() as any;

  // Network stats
  const [
    basecampsRes,
    minersRes,
    interventionsRes,
    evidenceRes,
    validationsRes,
    costDataRes,
    evidenceLevelRes,
    storiesRes,
    youthOppsRes,
  ] = await Promise.all([
    supabase.from('organizations').select('id, name, state', { count: 'exact' }).or('partner_tier.eq.basecamp,type.eq.basecamp'),
    supabase.from('network_memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('alma_interventions').select('id, evidence_level, cost_per_young_person, type').neq('verification_status', 'ai_generated'),
    supabase.from('alma_evidence').select('id', { count: 'exact', head: true }),
    supabase.from('peer_validations').select('id', { count: 'exact', head: true }).eq('is_public', true),
    supabase.from('alma_interventions').select('cost_per_young_person').neq('verification_status', 'ai_generated').not('cost_per_young_person', 'is', null),
    supabase.from('alma_interventions').select('evidence_level').neq('verification_status', 'ai_generated').not('evidence_level', 'is', null),
    supabase.from('alma_stories').select('id', { count: 'exact', head: true }),
    supabase.from('youth_opportunities').select('id', { count: 'exact', head: true }).eq('status', 'open'),
  ]);

  const basecamps = basecampsRes.data || [];
  const interventions = interventionsRes.data || [];
  const costData = (costDataRes.data || []).map((r: any) => Number(r.cost_per_young_person)).filter((n: number) => n > 0 && n < 500000);

  // Evidence level breakdown
  const evidenceLevels: Record<string, number> = {};
  for (const i of interventions) {
    const level = i.evidence_level ? i.evidence_level.split('(')[0].trim() : 'Unknown';
    evidenceLevels[level] = (evidenceLevels[level] || 0) + 1;
  }

  // Type breakdown
  const types: Record<string, number> = {};
  for (const i of interventions) {
    if (i.type) types[i.type] = (types[i.type] || 0) + 1;
  }
  const topTypes = Object.entries(types).sort(([, a], [, b]) => b - a).slice(0, 8);

  // Cost stats
  const avgCost = costData.length ? costData.reduce((a: number, b: number) => a + b, 0) / costData.length : 0;
  const medianCost = costData.length ? costData.sort((a: number, b: number) => a - b)[Math.floor(costData.length / 2)] : 0;

  // Detention cost comparison (known national average)
  const detentionCostPerDay = 1500; // Conservative national average
  const detentionCostPerYear = detentionCostPerDay * 365;

  const evidenceBacked = interventions.filter((i: any) =>
    i.evidence_level && !i.evidence_level.startsWith('Untested')
  ).length;

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <Link href="/network/alma" className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 mb-4">
              ALMA Network <ArrowRight className="w-3 h-3" />
            </Link>
            <p className="text-sm uppercase tracking-[0.3em] text-[#059669] mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Network Impact
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              The Proof
            </h1>
            <p className="text-lg text-white/70 max-w-2xl">
              {interventions.length.toLocaleString()} alternative models. {evidenceBacked} with
              evidence. Collectively proving that community-led approaches work
              better and cost less than the system they&apos;re replacing.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-16">
          {/* Key metrics */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: interventions.length.toLocaleString(), label: 'ALMA Models', icon: TrendingUp, color: 'text-[#059669]' },
              { value: `${Math.round((evidenceBacked / interventions.length) * 100)}%`, label: 'Evidence-backed', icon: Shield, color: 'text-[#059669]' },
              { value: basecamps.length.toString(), label: 'Basecamps', icon: Users, color: 'text-[#059669]' },
              { value: (evidenceRes.count || 0).toLocaleString(), label: 'Evidence items', icon: Heart, color: 'text-[#059669]' },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                  <Icon className={`w-5 h-5 ${m.color} mb-2`} />
                  <p className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{m.value}</p>
                  <p className="text-xs text-[#0A0A0A]/50 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{m.label}</p>
                </div>
              );
            })}
          </section>

          {/* Cost comparison */}
          {avgCost > 0 && (
            <section className="bg-[#0A0A0A] text-white rounded-xl p-8">
              <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                The Cost Argument
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#DC2626]/10 rounded-lg p-5 border border-[#DC2626]/20">
                  <p className="text-xs uppercase tracking-wider text-[#DC2626] mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Detention</p>
                  <p className="text-3xl font-bold text-[#DC2626]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(detentionCostPerYear)}</p>
                  <p className="text-xs text-white/50 mt-1">per young person per year</p>
                  <p className="text-xs text-white/30 mt-2">(${detentionCostPerDay.toLocaleString()}/day national avg)</p>
                </div>
                <div className="bg-[#059669]/10 rounded-lg p-5 border border-[#059669]/20">
                  <p className="text-xs uppercase tracking-wider text-[#059669] mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>ALMA Average</p>
                  <p className="text-3xl font-bold text-[#059669]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(avgCost)}</p>
                  <p className="text-xs text-white/50 mt-1">per young person (avg)</p>
                  <p className="text-xs text-white/30 mt-2">Median: {fmt(medianCost)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <p className="text-xs uppercase tracking-wider text-white/50 mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Ratio</p>
                  <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{Math.round(detentionCostPerYear / avgCost)}x</p>
                  <p className="text-xs text-white/50 mt-1">cheaper than detention</p>
                  <p className="text-xs text-white/30 mt-2">Same money = {Math.round(detentionCostPerYear / avgCost)}x more young people reached</p>
                </div>
              </div>
            </section>
          )}

          {/* Evidence breakdown */}
          <section>
            <h2 className="text-xl font-bold tracking-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Evidence Level
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(evidenceLevels)
                .sort(([, a], [, b]) => b - a)
                .map(([level, count]) => (
                  <div key={level} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-4 text-center">
                    <p className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{count}</p>
                    <p className="text-xs text-[#0A0A0A]/60 mt-1">{level}</p>
                  </div>
                ))}
            </div>
          </section>

          {/* Model types */}
          <section>
            <h2 className="text-xl font-bold tracking-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              What the Models Do
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {topTypes.map(([type, count]) => (
                <div key={type} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-4">
                  <p className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{count}</p>
                  <p className="text-sm text-[#0A0A0A]/60 mt-1">{type}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Network CTA */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/follow-the-money/big-vs-small" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6 hover:border-[#0A0A0A]/30 transition-colors group">
              <DollarSign className="w-6 h-6 text-[#DC2626] mb-3" />
              <h3 className="font-bold mb-2">Big vs Small</h3>
              <p className="text-sm text-[#0A0A0A]/60">See how the top 10 funded providers compare to community alternatives on cost and outcomes.</p>
              <span className="text-sm font-semibold text-[#DC2626] mt-3 flex items-center gap-1 group-hover:underline">View comparison <ArrowRight className="w-3 h-3" /></span>
            </Link>
            <Link href="/join" className="bg-[#0A0A0A] text-white rounded-xl p-6 hover:bg-[#0A0A0A]/90 transition-colors group">
              <Users className="w-6 h-6 text-[#059669] mb-3" />
              <h3 className="font-bold text-white mb-2">Add Your Model</h3>
              <p className="text-sm text-white/60">Join the ALMA Network and add your community model to the evidence base.</p>
              <span className="text-sm font-semibold text-[#059669] mt-3 flex items-center gap-1 group-hover:underline">Join now <ArrowRight className="w-3 h-3" /></span>
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
