import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  DollarSign,
  Users,
  Shield,
  AlertTriangle,
  Trophy,
  Minus,
} from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'State Leaderboard | Youth Justice | JusticeHub',
  description:
    'Which Australian states lead on community youth justice — and which are still failing? Live rankings based on funding, community models, Indigenous org support, and transparency.',
};

const STATE_NAMES: Record<string, string> = {
  NT: 'Northern Territory',
  QLD: 'Queensland',
  NSW: 'New South Wales',
  VIC: 'Victoria',
  WA: 'Western Australia',
  SA: 'South Australia',
  TAS: 'Tasmania',
  ACT: 'Australian Capital Territory',
};

const ALL_STATES = ['NT', 'QLD', 'NSW', 'VIC', 'WA', 'SA', 'TAS', 'ACT'];

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

interface StateScore {
  state: string;
  name: string;
  totalFunding: number;
  fundingRecords: number;
  totalOrgs: number;
  indigenousOrgs: number;
  indigenousPct: number;
  almaModels: number;
  evidenceBacked: number;
  hasBasecamp: boolean;
  score: number;
  grade: string;
}

function calcGrade(score: number): string {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: 'bg-[#059669]/10', text: 'text-[#059669]' },
  B: { bg: 'bg-[#059669]/10', text: 'text-[#059669]' },
  C: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  D: { bg: 'bg-[#DC2626]/10', text: 'text-[#DC2626]' },
  F: { bg: 'bg-[#DC2626]/10', text: 'text-[#DC2626]' },
};

export default async function LeaderboardPage() {
  const supabase = createServiceClient() as any;

  // Fetch per-state data in parallel
  const stateDataPromises = ALL_STATES.map(async (state) => {
    const [fundingRes, orgsRes, indOrgsRes, almaRes, basecampRes] = await Promise.all([
      supabase.from('justice_funding').select('amount_dollars').eq('state', state).gt('amount_dollars', 0),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('state', state),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('state', state).eq('is_indigenous_org', true),
      supabase
        .from('alma_interventions')
        .select('id, evidence_level, organizations!alma_interventions_operating_organization_id_fkey(state)')
        .neq('verification_status', 'ai_generated'),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('state', state).or('partner_tier.eq.basecamp,type.eq.basecamp'),
    ]);

    const funding = fundingRes.data || [];
    const totalFunding = funding.reduce((s: number, f: any) => s + (Number(f.amount_dollars) || 0), 0);
    const totalOrgs = orgsRes.count || 0;
    const indigenousOrgs = indOrgsRes.count || 0;
    const indigenousPct = totalOrgs > 0 ? Math.round((indigenousOrgs / totalOrgs) * 100) : 0;

    // Filter ALMA models by org state
    const allAlma = almaRes.data || [];
    const stateAlma = allAlma.filter((a: any) => a.organizations?.state === state);
    const almaModels = stateAlma.length;
    const evidenceBacked = stateAlma.filter((a: any) => a.evidence_level && !a.evidence_level.startsWith('Untested')).length;
    const hasBasecamp = (basecampRes.count || 0) > 0;

    // Score: weighted composite
    // - ALMA models per 100 orgs (25%)
    // - Evidence-backed % (20%)
    // - Indigenous org % (20%)
    // - Has basecamp (15%)
    // - Funding records (10%)
    // - Funding amount (10%)
    const almaPerOrg = totalOrgs > 0 ? Math.min((almaModels / totalOrgs) * 100 * 5, 25) : 0;
    const evidencePctScore = almaModels > 0 ? Math.min((evidenceBacked / almaModels) * 20, 20) : 0;
    const indigenousScore = Math.min(indigenousPct * 0.4, 20);
    const basecampScore = hasBasecamp ? 15 : 0;
    const recordsScore = Math.min(funding.length / 500, 1) * 10;
    const fundingScore = Math.min(totalFunding / 500_000_000, 1) * 10;

    const score = Math.round(almaPerOrg + evidencePctScore + indigenousScore + basecampScore + recordsScore + fundingScore);

    return {
      state,
      name: STATE_NAMES[state],
      totalFunding,
      fundingRecords: funding.length,
      totalOrgs,
      indigenousOrgs,
      indigenousPct,
      almaModels,
      evidenceBacked,
      hasBasecamp,
      score,
      grade: calcGrade(score),
    } as StateScore;
  });

  const stateScores = (await Promise.all(stateDataPromises)).sort((a, b) => b.score - a.score);

  // National totals
  const nationalFunding = stateScores.reduce((s, st) => s + st.totalFunding, 0);
  const nationalOrgs = stateScores.reduce((s, st) => s + st.totalOrgs, 0);
  const nationalAlma = stateScores.reduce((s, st) => s + st.almaModels, 0);

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
              Live Rankings
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              State Leaderboard
            </h1>
            <p className="text-lg text-white/70 max-w-2xl">
              Which states are leading on community youth justice? Ranked by ALMA models,
              evidence base, Indigenous org support, and network participation. Updated live.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-12">
          {/* Rankings table */}
          <section className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="bg-[#0A0A0A] text-white text-xs uppercase tracking-wider"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    <th className="text-left px-4 py-3 w-12">#</th>
                    <th className="text-left px-4 py-3">State</th>
                    <th className="text-center px-4 py-3">Grade</th>
                    <th className="text-right px-4 py-3 hidden md:table-cell">ALMA Models</th>
                    <th className="text-right px-4 py-3 hidden md:table-cell">Evidence %</th>
                    <th className="text-right px-4 py-3 hidden md:table-cell">Indigenous Orgs</th>
                    <th className="text-right px-4 py-3 hidden lg:table-cell">Funding</th>
                    <th className="text-center px-4 py-3 hidden md:table-cell">Basecamp</th>
                    <th className="text-right px-4 py-3">Score</th>
                    <th className="px-4 py-3 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A0A0A]/5">
                  {stateScores.map((st, i) => {
                    const gradeStyle = GRADE_COLORS[st.grade];
                    const evidencePct = st.almaModels > 0 ? Math.round((st.evidenceBacked / st.almaModels) * 100) : 0;
                    return (
                      <tr key={st.state} className="hover:bg-[#F5F0E8]/50 transition-colors">
                        <td className="px-4 py-4">
                          <span
                            className={`text-lg font-bold ${i === 0 ? 'text-[#059669]' : i <= 2 ? 'text-[#0A0A0A]' : 'text-[#0A0A0A]/30'}`}
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <Link href={`/states/${st.state.toLowerCase()}`} className="hover:underline">
                            <p className="font-bold">{st.name}</p>
                            <p className="text-xs text-[#0A0A0A]/40">{st.state}</p>
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${gradeStyle.bg} ${gradeStyle.text}`}>
                            {st.grade}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right hidden md:table-cell">
                          <span className="font-bold">{st.almaModels}</span>
                        </td>
                        <td className="px-4 py-4 text-right hidden md:table-cell">
                          <span className={evidencePct >= 50 ? 'text-[#059669] font-medium' : 'text-[#0A0A0A]/50'}>
                            {evidencePct}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right hidden md:table-cell">
                          <span className="font-medium">{st.indigenousOrgs}</span>
                          <span className="text-[#0A0A0A]/30 text-xs ml-1">({st.indigenousPct}%)</span>
                        </td>
                        <td className="px-4 py-4 text-right hidden lg:table-cell">
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-xs">
                            {fmt(st.totalFunding)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center hidden md:table-cell">
                          {st.hasBasecamp ? (
                            <Shield className="w-4 h-4 text-[#059669] mx-auto" />
                          ) : (
                            <Minus className="w-4 h-4 text-[#0A0A0A]/20 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span
                            className="text-lg font-bold"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            {st.score}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <Link href={`/states/${st.state.toLowerCase()}`}>
                            <ArrowRight className="w-4 h-4 text-[#0A0A0A]/20 hover:text-[#0A0A0A]/60" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Scoring methodology */}
          <section className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
            <h2 className="font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              How Scores Work
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                { weight: '25%', metric: 'ALMA models per org', desc: 'More community alternatives = higher score' },
                { weight: '20%', metric: 'Evidence-backed %', desc: 'Models with formal evidence backing' },
                { weight: '20%', metric: 'Indigenous org share', desc: 'Higher % of Indigenous-led orgs' },
                { weight: '15%', metric: 'Network Basecamp', desc: 'Has an active ALMA Basecamp' },
                { weight: '10%', metric: 'Funding records', desc: 'Transparency of funding data' },
                { weight: '10%', metric: 'Total funding', desc: 'Scale of tracked funding' },
              ].map((item) => (
                <div key={item.metric} className="bg-[#F5F0E8] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#059669]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{item.weight}</span>
                    <span className="font-bold text-xs">{item.metric}</span>
                  </div>
                  <p className="text-xs text-[#0A0A0A]/50">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#0A0A0A]/30 mt-4">
              Scores are calculated live from platform data. They measure community readiness
              and transparency — not government spending or detention rates (which are often
              indicators of failure, not success).
            </p>
          </section>

          {/* Top and bottom callout */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stateScores.length > 0 && (
              <div className="bg-[#059669]/5 rounded-xl border border-[#059669]/20 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-5 h-5 text-[#059669]" />
                  <span className="font-bold text-[#059669]">Leading</span>
                </div>
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {stateScores[0].name}
                </h3>
                <p className="text-sm text-[#0A0A0A]/60">
                  Score: {stateScores[0].score} · {stateScores[0].almaModels} ALMA models ·{' '}
                  {stateScores[0].indigenousOrgs} Indigenous orgs
                  {stateScores[0].hasBasecamp ? ' · Active Basecamp' : ''}
                </p>
                <Link href={`/states/${stateScores[0].state.toLowerCase()}`} className="text-sm font-semibold text-[#059669] mt-3 flex items-center gap-1 hover:underline">
                  View scorecard <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
            {stateScores.length > 1 && (
              <div className="bg-[#DC2626]/5 rounded-xl border border-[#DC2626]/20 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                  <span className="font-bold text-[#DC2626]">Most ground to cover</span>
                </div>
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {stateScores[stateScores.length - 1].name}
                </h3>
                <p className="text-sm text-[#0A0A0A]/60">
                  Score: {stateScores[stateScores.length - 1].score} · {stateScores[stateScores.length - 1].almaModels} ALMA models ·{' '}
                  {stateScores[stateScores.length - 1].indigenousOrgs} Indigenous orgs
                  {!stateScores[stateScores.length - 1].hasBasecamp ? ' · No Basecamp yet' : ''}
                </p>
                <Link href="/join" className="text-sm font-semibold text-[#DC2626] mt-3 flex items-center gap-1 hover:underline">
                  Help build the network <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </section>

          {/* CTA */}
          <section className="bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Your state&apos;s ranking is based on what the community builds.
            </h2>
            <p className="text-white/60 mb-8 max-w-2xl mx-auto">
              Every ALMA model added, every org that joins, every peer validation — it all
              moves your state up. The leaderboard is a mirror of community action.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/join" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm">
                Join the Network <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/share" className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm">
                Share Your State&apos;s Score
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
