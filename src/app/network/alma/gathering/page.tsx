import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Plane,
  DollarSign,
  Shield,
  TrendingUp,
  Heart,
  Globe,
} from 'lucide-react';
import { Metadata } from 'next';

import { fmt } from '@/lib/format';
import { getDetentionCosts } from '@/lib/detention-costs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'First National Gathering | ALMA Network | JusticeHub',
  description:
    'The first national gathering of the ALMA Network — Basecamps, miners, and validators from across Australia coming together to plan the future of community-led youth justice.',
};

export default async function GatheringPage() {
  const supabase = createServiceClient() as any;

  // National scorecard data
  const [
    basecampsRes,
    membersRes,
    interventionsRes,
    fundingRes,
    indOrgRes,
    validationsRes,
    storiesRes,
  ] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, state', { count: 'exact' })
      .or('partner_tier.eq.basecamp,type.eq.basecamp'),
    supabase
      .from('network_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('alma_interventions')
      .select('id, cost_per_young_person, evidence_level')
      .neq('verification_status', 'ai_generated'),
    supabase
      .from('justice_funding')
      .select('amount_dollars')
      .gt('amount_dollars', 0),
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('is_indigenous_org', true),
    supabase
      .from('peer_validations')
      .select('id', { count: 'exact', head: true })
      .eq('is_public', true),
    supabase
      .from('alma_stories')
      .select('id', { count: 'exact', head: true }),
  ]);

  const basecamps = basecampsRes.data || [];
  const interventions = interventionsRes.data || [];
  const funding = fundingRes.data || [];

  const totalFunding = funding.reduce((sum: number, f: any) => sum + (Number(f.amount_dollars) || 0), 0);
  const costData = interventions
    .map((i: any) => Number(i.cost_per_young_person))
    .filter((n: number) => n > 0 && n < 500000);
  const avgCost = costData.length ? costData.reduce((a: number, b: number) => a + b, 0) / costData.length : 0;
  const evidenceBacked = interventions.filter(
    (i: any) => i.evidence_level && !i.evidence_level.startsWith('Untested')
  ).length;
  const detentionCostsData = await getDetentionCosts();
  const detentionCostPerYear = detentionCostsData.national.annualCost;

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <Link
              href="/network/alma"
              className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 mb-4"
            >
              ALMA Network <ArrowRight className="w-3 h-3" />
            </Link>
            <p
              className="text-sm uppercase tracking-[0.3em] text-[#059669] mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              July 2026
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              The First National Gathering
            </h1>
            <p className="text-lg text-white/70 max-w-3xl mb-8">
              Basecamps, miners, and validators from across Australia. Three days of sharing
              what works, challenging what doesn&apos;t, and planning the next year of the
              movement together.
            </p>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-white/60">
                <Calendar className="w-4 h-4" />
                <span className="text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  July 2026 — Dates TBC
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <MapPin className="w-4 h-4" />
                <span className="text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Location TBC
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-16">
          {/* National Scorecard */}
          <section>
            <h2
              className="text-2xl font-bold tracking-tight mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              National Scorecard
            </h2>
            <p className="text-sm text-[#0A0A0A]/60 mb-6">
              The collective state of the ALMA Network — what we&apos;ve built together.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  value: basecamps.length.toString(),
                  label: 'Basecamps',
                  sub: `across ${new Set(basecamps.map((b: any) => b.state)).size} states`,
                  icon: Shield,
                  color: '#059669',
                },
                {
                  value: interventions.length.toLocaleString(),
                  label: 'ALMA Models',
                  sub: `${evidenceBacked} evidence-backed`,
                  icon: TrendingUp,
                  color: '#059669',
                },
                {
                  value: fmt(totalFunding),
                  label: 'Funding Tracked',
                  sub: `${funding.length.toLocaleString()} records`,
                  icon: DollarSign,
                  color: '#DC2626',
                },
                {
                  value: (indOrgRes.count || 0).toLocaleString(),
                  label: 'Indigenous Orgs',
                  sub: 'in the database',
                  icon: Heart,
                  color: '#059669',
                },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5">
                    <Icon className="w-5 h-5 mb-2" style={{ color: m.color }} />
                    <p
                      className="text-2xl font-bold"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {m.value}
                    </p>
                    <p
                      className="text-xs text-[#0A0A0A]/50 mt-1"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {m.label}
                    </p>
                    <p className="text-xs text-[#0A0A0A]/30 mt-0.5">{m.sub}</p>
                  </div>
                );
              })}
            </div>

            {/* Cost comparison summary */}
            {avgCost > 0 && (
              <div className="mt-4 bg-[#0A0A0A] text-white rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-1">
                  <p className="text-sm text-white/50">The cost argument in one line:</p>
                  <p className="text-lg font-bold text-white mt-1">
                    Detention costs{' '}
                    <span className="text-[#DC2626]">{fmt(detentionCostPerYear)}/year</span> per young
                    person. ALMA models average{' '}
                    <span className="text-[#059669]">{fmt(avgCost)}</span>.
                    That&apos;s{' '}
                    <span className="text-white">{Math.round(detentionCostPerYear / avgCost)}x cheaper</span>.
                  </p>
                </div>
                <Link
                  href="/network/alma/impact"
                  className="text-sm text-[#059669] font-semibold flex items-center gap-1 whitespace-nowrap hover:underline"
                >
                  Full impact data <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </section>

          {/* Agenda */}
          <section>
            <h2
              className="text-2xl font-bold tracking-tight mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              What Happens
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  day: 'Day 1',
                  title: 'State Reports',
                  desc: 'Each Basecamp presents their state — what\'s working, what\'s broken, where the money goes. Real data, real stories, no spin.',
                  icon: Globe,
                },
                {
                  day: 'Day 2',
                  title: 'Working Sessions',
                  desc: 'Cross-state collaboration on shared challenges: funding applications, policy responses, data methodology, story collection, funder relationships.',
                  icon: Users,
                },
                {
                  day: 'Day 3',
                  title: 'The Year Ahead',
                  desc: 'National priorities, coordinated campaigns, trip planning, open-source platform roadmap, and the commitments that carry us through the next year.',
                  icon: Calendar,
                },
              ].map((d) => {
                const Icon = d.icon;
                return (
                  <div key={d.day} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#059669]/10">
                        <Icon className="w-4 h-4 text-[#059669]" />
                      </div>
                      <span
                        className="text-xs uppercase tracking-wider text-[#0A0A0A]/40"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {d.day}
                      </span>
                    </div>
                    <h3 className="font-bold mb-2">{d.title}</h3>
                    <p className="text-sm text-[#0A0A0A]/60">{d.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Travel Bursary */}
          <section className="bg-white rounded-xl border border-[#0A0A0A]/10 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Plane className="w-5 h-5 text-[#059669]" />
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Travel Bursaries
                  </h2>
                </div>
                <p className="text-sm text-[#0A0A0A]/70 mb-4">
                  No community organisation should miss the gathering because of cost. Travel
                  bursaries cover flights, accommodation, and meals for network members who
                  need support getting there.
                </p>
                <p className="text-sm text-[#0A0A0A]/70">
                  Priority goes to Basecamps and Indigenous-led organisations, especially
                  those traveling from remote communities. Bursaries are funded by the network
                  revenue model — consulting fees and report sales from larger organisations
                  subsidise access for community orgs.
                </p>
              </div>
              <div className="bg-[#F5F0E8] rounded-xl p-6">
                <h3
                  className="font-bold mb-4"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Bursary Covers
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Plane, label: 'Return flights from anywhere in Australia' },
                    { icon: MapPin, label: '3 nights accommodation (shared)' },
                    { icon: Heart, label: 'All meals during the gathering' },
                    { icon: DollarSign, label: 'Ground transport to/from venue' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-[#059669] shrink-0" />
                        <span className="text-sm text-[#0A0A0A]/70">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-4 border-t border-[#0A0A0A]/10">
                  <p
                    className="text-xs text-[#0A0A0A]/40"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    Applications open when dates are confirmed
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Registration */}
          <section className="bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2
                  className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-4"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Register Interest
                </h2>
                <p className="text-white/70 mb-6">
                  Dates and location are being confirmed. Register your interest and
                  we&apos;ll notify you when registration opens — including travel bursary
                  applications.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/join"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm"
                  >
                    Join the Network <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/basecamps"
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
                  >
                    See Basecamps
                  </Link>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <p
                  className="text-xs uppercase tracking-wider text-white/40 mb-4"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Who Should Come
                </p>
                <div className="space-y-3">
                  {[
                    { role: 'Basecamps', desc: 'State coordinators — present your state report' },
                    { role: 'Miners', desc: 'Community orgs in the network — share your work' },
                    { role: 'Validators', desc: 'Peers and community members — verify what\'s real' },
                    { role: 'Young People', desc: 'Those with lived experience — your voice matters most' },
                    { role: 'Funders', desc: 'See where your money goes and what actually works' },
                  ].map((item) => (
                    <div key={item.role} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-2 shrink-0" />
                      <div>
                        <span className="text-sm font-semibold text-white">{item.role}</span>
                        <span className="text-sm text-white/50"> — {item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Open Source */}
          <section className="text-center py-8">
            <p
              className="text-xs uppercase tracking-[0.3em] text-[#0A0A0A]/40 mb-3"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Open Source Commitment
            </p>
            <h2
              className="text-2xl font-bold tracking-tight mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Everything We Build, We Share
            </h2>
            <p className="text-sm text-[#0A0A0A]/60 max-w-2xl mx-auto">
              The platform codebase, data methodology, and governance model will be published
              at the gathering. If another country wants to build their own version of this —
              they can.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
