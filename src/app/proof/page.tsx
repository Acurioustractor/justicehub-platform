import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  Shield,
  TrendingUp,
  ArrowRight,
  DollarSign,
  Users,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Beaker,
  Star,
  Heart,
} from 'lucide-react';
import { Metadata } from 'next';
import { fmt } from '@/lib/format';
import { STATE_NAMES } from '@/lib/constants';
import { getDetentionCosts } from '@/lib/detention-costs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'The Wall of Proof | ALMA Network | JusticeHub',
  description:
    'Every verified alternative model in Australia. Evidence levels, cost data, outcomes. The proof that community-led youth justice works — all in one place.',
};

const EVIDENCE_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  Proven: { bg: 'bg-[#059669]/10', text: 'text-[#059669]', icon: CheckCircle },
  Effective: { bg: 'bg-[#059669]/10', text: 'text-[#059669]', icon: TrendingUp },
  Promising: { bg: 'bg-amber-500/10', text: 'text-amber-600', icon: Star },
  'Indigenous-led': { bg: 'bg-purple-500/10', text: 'text-purple-600', icon: Heart },
  Untested: { bg: 'bg-[#0A0A0A]/5', text: 'text-[#0A0A0A]/40', icon: Beaker },
};

function getEvidenceKey(level: string): string {
  if (level.startsWith('Proven')) return 'Proven';
  if (level.startsWith('Effective')) return 'Effective';
  if (level.startsWith('Promising')) return 'Promising';
  if (level.startsWith('Indigenous')) return 'Indigenous-led';
  return 'Untested';
}

export default async function WallOfProofPage() {
  const supabase = createServiceClient() as any;

  // Fetch all verified interventions with org data (raise limit above Supabase default 1000)
  const [{ data: interventions }, { count: totalCount }] = await Promise.all([
    supabase
      .from('alma_interventions')
      .select(`
        id, name, type, description, evidence_level, cost_per_young_person,
        operating_organization_id,
        organizations!alma_interventions_operating_organization_id_fkey(name, slug, state, is_indigenous_org)
      `)
      .neq('verification_status', 'ai_generated')
      .order('evidence_level', { ascending: true })
      .order('name')
      .limit(2000),
    supabase
      .from('alma_interventions')
      .select('id', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated'),
  ]);

  const allModels = interventions || [];
  const modelCount = totalCount || allModels.length;

  // Stats
  const withCost = allModels.filter((m: any) => m.cost_per_young_person && m.cost_per_young_person > 0 && m.cost_per_young_person < 500000);
  const avgCost = withCost.length
    ? withCost.reduce((s: number, m: any) => s + Number(m.cost_per_young_person), 0) / withCost.length
    : 0;
  const detentionCostsData = await getDetentionCosts();
  const detentionCost = detentionCostsData.national.annualCost;

  // Evidence breakdown
  const evidenceCounts: Record<string, number> = {};
  for (const m of allModels) {
    const key = m.evidence_level ? getEvidenceKey(m.evidence_level) : 'Untested';
    evidenceCounts[key] = (evidenceCounts[key] || 0) + 1;
  }

  // Type breakdown
  const typeCounts: Record<string, number> = {};
  for (const m of allModels) {
    if (m.type) typeCounts[m.type] = (typeCounts[m.type] || 0) + 1;
  }
  const topTypes = Object.entries(typeCounts).sort(([, a], [, b]) => b - a).slice(0, 12);

  // State breakdown
  const stateCounts: Record<string, number> = {};
  for (const m of allModels) {
    const state = m.organizations?.state;
    if (state) stateCounts[state] = (stateCounts[state] || 0) + 1;
  }

  // Top evidence-backed models (Proven + Effective with cost data)
  const topModels = allModels
    .filter((m: any) => {
      const key = m.evidence_level ? getEvidenceKey(m.evidence_level) : '';
      return (key === 'Proven' || key === 'Effective') && m.cost_per_young_person > 0;
    })
    .sort((a: any, b: any) => (a.cost_per_young_person || 999999) - (b.cost_per_young_person || 999999))
    .slice(0, 20);

  // Indigenous-led models
  const indigenousLed = allModels.filter((m: any) => {
    const key = m.evidence_level ? getEvidenceKey(m.evidence_level) : '';
    return key === 'Indigenous-led';
  });

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <p
              className="text-sm uppercase tracking-[0.3em] text-[#DC2626] mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {modelCount.toLocaleString()} Verified Models
            </p>
            <h1
              className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              The Wall of Proof
            </h1>
            <p className="text-lg text-white/70 max-w-3xl mb-8">
              Every verified alternative model in Australia. Evidence levels. Cost data.
              Real organisations doing real work. This is the proof that the alternative
              exists — and it works better.
            </p>

            {/* Hero stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {modelCount}
                </p>
                <p className="text-xs text-white/40 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  verified models
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-3xl font-bold text-[#059669]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {(evidenceCounts['Proven'] || 0) + (evidenceCounts['Effective'] || 0)}
                </p>
                <p className="text-xs text-white/40 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  proven or effective
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-3xl font-bold text-[#059669]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {fmt(avgCost)}
                </p>
                <p className="text-xs text-white/40 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  avg cost/young person
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-3xl font-bold text-[#DC2626]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {Math.round(detentionCost / avgCost)}x
                </p>
                <p className="text-xs text-white/40 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  cheaper than detention
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-16">
          {/* Evidence level breakdown */}
          <section>
            <h2 className="text-xl font-bold tracking-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Evidence Levels
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {['Proven', 'Effective', 'Promising', 'Indigenous-led', 'Untested'].map((level) => {
                const style = EVIDENCE_COLORS[level];
                const Icon = style.icon;
                const count = evidenceCounts[level] || 0;
                const pct = modelCount ? Math.round((count / modelCount) * 100) : 0;
                return (
                  <div key={level} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${style.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${style.text}`} />
                      </div>
                      <span className="text-xs font-medium text-[#0A0A0A]/60">{level}</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {count}
                    </p>
                    <div className="mt-2 h-1.5 bg-[#0A0A0A]/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${style.bg.replace('/10', '/40')}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-[#0A0A0A]/30 mt-1">{pct}% of all models</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* By state */}
          <section>
            <h2 className="text-xl font-bold tracking-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Models by State
            </h2>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {Object.entries(STATE_NAMES).map(([code, name]) => {
                const count = stateCounts[code] || 0;
                return (
                  <Link
                    key={code}
                    href={`/states/${code.toLowerCase()}`}
                    className="bg-white rounded-xl border border-[#0A0A0A]/10 p-3 text-center hover:border-[#0A0A0A]/30 transition-colors group"
                  >
                    <p className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {count}
                    </p>
                    <p className="text-xs font-bold text-[#0A0A0A]/50 group-hover:text-[#0A0A0A] transition-colors">
                      {code}
                    </p>
                  </Link>
                );
              })}
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
                  <p className="text-xs text-[#0A0A0A]/60 mt-1">{type}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Top proven models */}
          {topModels.length > 0 && (
            <section>
              <h2 className="text-xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Top Proven Models
              </h2>
              <p className="text-sm text-[#0A0A0A]/50 mb-6">
                Proven or effective models with cost data — sorted by cost per young person.
              </p>
              <div className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#0A0A0A] text-white text-xs uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        <th className="text-left px-4 py-3">Model</th>
                        <th className="text-left px-4 py-3 hidden md:table-cell">Organisation</th>
                        <th className="text-left px-4 py-3 hidden md:table-cell">State</th>
                        <th className="text-left px-4 py-3">Evidence</th>
                        <th className="text-right px-4 py-3">Cost/YP</th>
                        <th className="text-right px-4 py-3 hidden md:table-cell">vs Detention</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0A0A0A]/5">
                      {topModels.map((m: any) => {
                        const key = getEvidenceKey(m.evidence_level || '');
                        const style = EVIDENCE_COLORS[key] || EVIDENCE_COLORS['Untested'];
                        const cost = Number(m.cost_per_young_person);
                        const ratio = cost > 0 ? Math.round(detentionCost / cost) : 0;
                        return (
                          <tr key={m.id} className="hover:bg-[#F5F0E8]/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-sm">{m.name}</p>
                              <p className="text-xs text-[#0A0A0A]/40 mt-0.5">{m.type}</p>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              {m.organizations ? (
                                <Link
                                  href={`/sites/${m.organizations.slug}`}
                                  className="text-sm text-[#059669] hover:underline"
                                >
                                  {m.organizations.name}
                                </Link>
                              ) : (
                                <span className="text-xs text-[#0A0A0A]/30">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className="text-xs text-[#0A0A0A]/50">
                                {m.organizations?.state || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                                {key}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-bold text-[#059669]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                                {fmt(cost)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right hidden md:table-cell">
                              <span className="text-xs font-medium text-[#0A0A0A]/60">
                                {ratio}x cheaper
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Indigenous-led models */}
          {indigenousLed.length > 0 && (
            <section>
              <h2 className="text-xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Indigenous-Led Models
              </h2>
              <p className="text-sm text-[#0A0A0A]/50 mb-6">
                Culturally grounded, community authority. These models don&apos;t need Western evidence
                frameworks to prove they work — they have 65,000 years of proof.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {indigenousLed.slice(0, 12).map((m: any) => (
                  <div key={m.id} className="bg-white rounded-xl border border-purple-200 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-500/10 shrink-0">
                        <Heart className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{m.name}</h3>
                        {m.organizations && (
                          <p className="text-xs text-[#0A0A0A]/40 mt-0.5">
                            {m.organizations.name} · {m.organizations.state}
                          </p>
                        )}
                        {m.description && (
                          <p className="text-xs text-[#0A0A0A]/60 mt-1.5 line-clamp-2">
                            {m.description}
                          </p>
                        )}
                        {m.cost_per_young_person > 0 && (
                          <p className="text-xs mt-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            <span className="text-[#059669] font-medium">{fmt(Number(m.cost_per_young_person))}</span>
                            <span className="text-[#0A0A0A]/30"> per young person</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {indigenousLed.length > 12 && (
                <p className="text-xs text-[#0A0A0A]/40 mt-3 text-center">
                  + {indigenousLed.length - 12} more Indigenous-led models in the network
                </p>
              )}
            </section>
          )}

          {/* The argument */}
          <section className="bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <p
                className="text-sm uppercase tracking-[0.3em] text-[#DC2626] mb-4"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                The Argument
              </p>
              <h2
                className="text-2xl md:text-3xl font-bold text-white mb-6"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {modelCount} alternatives exist. The average costs {fmt(avgCost)} per young
                person. Detention costs {fmt(detentionCost)}. That&apos;s {Math.round(detentionCost / avgCost)}x
                more expensive — for worse outcomes.
              </h2>
              <p className="text-white/60 mb-8">
                This isn&apos;t opinion. This is {modelCount} verified models, {withCost.length} with cost
                data, {(evidenceCounts['Proven'] || 0) + (evidenceCounts['Effective'] || 0)} proven or effective.
                The alternative exists. It works. It costs less. The only question is whether we fund it.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href="/follow-the-money"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#DC2626] text-white font-semibold rounded-lg hover:bg-[#DC2626]/90 transition-colors text-sm"
                >
                  Follow the Money <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/network/alma/impact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  Network Impact
                </Link>
                <Link
                  href="/join"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  Join the Network
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
