import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  ArrowRight,
  Shield,
  Heart,
  DollarSign,
  TrendingUp,
  Users,
  MapPin,
  Mic,
  Calendar,
  Sparkles,
} from 'lucide-react';
import EmpathyLedgerStories from '@/components/EmpathyLedgerStories';
import { ActivityFeed } from '@/components/activity-feed';
import { fmt } from '@/lib/format';
import { getDetentionCosts } from '@/lib/detention-costs';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createServiceClient() as any;

  const [
    interventionsRes,
    costDataRes,
    fundingRes,
    orgRes,
    basecampsRes,
    evidenceRes,
    storiesRes,
    youthOppsRes,
  ] = await Promise.all([
    supabase
      .from('alma_interventions')
      .select('id, evidence_level', { count: 'exact' })
      .neq('verification_status', 'ai_generated'),
    supabase
      .from('alma_interventions')
      .select('cost_per_young_person')
      .neq('verification_status', 'ai_generated')
      .not('cost_per_young_person', 'is', null)
      .gt('cost_per_young_person', 0)
      .lt('cost_per_young_person', 500000),
    supabase
      .from('justice_funding')
      .select('amount_dollars')
      .gt('amount_dollars', 0),
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('organizations')
      .select('id, name, slug, state, is_indigenous_org')
      .or('partner_tier.eq.basecamp,type.eq.basecamp')
      .order('state'),
    supabase
      .from('alma_evidence')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('alma_stories')
      .select('id, title, excerpt, story_type, organizations(name, state)')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('youth_opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open'),
  ]);

  const interventions = interventionsRes.data || [];
  const costData = (costDataRes.data || []).map((r: any) => Number(r.cost_per_young_person)).filter((n: number) => n > 0);
  const funding = fundingRes.data || [];
  const basecamps = basecampsRes.data || [];
  const stories = storiesRes.data || [];

  const totalFunding = funding.reduce((sum: number, f: any) => sum + (Number(f.amount_dollars) || 0), 0);
  const avgCost = costData.length ? Math.round(costData.reduce((a: number, b: number) => a + b, 0) / costData.length) : 8500;
  const detentionCostsData = await getDetentionCosts();
  const detentionCost = detentionCostsData.national.annualCost;
  const nationalDailyCost = detentionCostsData.national.dailyCost;
  const ntDailyCost = detentionCostsData.byState.NT?.dailyCost || nationalDailyCost;
  const ratio = Math.round(detentionCost / avgCost);
  const evidenceBacked = interventions.filter((i: any) => i.evidence_level && !i.evidence_level.startsWith('Untested')).length;

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navigation />

      <main id="main-content">
        {/* Hero — The one line that stops people */}
        <section className="bg-[#0A0A0A] text-white header-offset">
          <div className="max-w-6xl mx-auto px-6 sm:px-12 py-24 md:py-32">
            <p
              className="text-sm uppercase tracking-[0.3em] text-[#DC2626] mb-6"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {interventions.length.toLocaleString()} alternative models. {evidenceBacked} with evidence. {ratio}x cheaper than detention.
            </p>
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.05]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Australia locks up children.
              <br />
              <span className="text-[#059669]">The alternative exists.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mb-10">
              {interventions.length.toLocaleString()} community models proving it works better and costs
              less. {fmt(totalFunding)} in funding tracked. {(orgRes.count || 0).toLocaleString()} organisations
              mapped. This is the transparency engine for youth justice in Australia.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/proof"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm"
              >
                See the Proof <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/follow-the-money"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#DC2626] text-white font-semibold rounded-lg hover:bg-[#DC2626]/90 transition-colors text-sm"
              >
                Follow the Money
              </Link>
              <Link
                href="/join"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                Join the Network
              </Link>
            </div>
          </div>
        </section>

        {/* The Cost Argument — Visceral, immediate */}
        <section className="bg-[#0A0A0A] border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#DC2626]/10 rounded-xl p-6 border border-[#DC2626]/20">
                <p
                  className="text-xs uppercase tracking-wider text-[#DC2626] mb-1"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Detention
                </p>
                <p
                  className="text-4xl font-bold text-[#DC2626]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {fmt(detentionCost)}
                </p>
                <p className="text-sm text-white/80 mt-1">per young person per year</p>
                <p className="text-xs text-white/50 mt-2">${nationalDailyCost.toLocaleString()}/day national average. NT: ${ntDailyCost.toLocaleString()}/day.</p>
              </div>
              <div className="bg-[#059669]/10 rounded-xl p-6 border border-[#059669]/20">
                <p
                  className="text-xs uppercase tracking-wider text-[#059669] mb-1"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Community Models
                </p>
                <p
                  className="text-4xl font-bold text-[#059669]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {fmt(avgCost)}
                </p>
                <p className="text-sm text-white/80 mt-1">per young person (average)</p>
                <p className="text-xs text-white/50 mt-2">Across {costData.length} models with cost data.</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10 flex flex-col justify-center">
                <p
                  className="text-5xl font-bold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {ratio}x
                </p>
                <p className="text-sm text-white/80 mt-1">cheaper. Better outcomes. Proven.</p>
                <Link
                  href="/calculator"
                  className="text-sm font-semibold text-[#059669] mt-3 flex items-center gap-1 hover:underline"
                >
                  Try the calculator <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Three Paths — Who are you? */}
        <section className="max-w-6xl mx-auto px-6 sm:px-12 py-20">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-center"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            What do you need?
          </h2>
          <p className="text-center text-[#0A0A0A]/60 mb-12 max-w-xl mx-auto">
            Three doors. Pick yours.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/services"
              className="bg-white rounded-xl border-2 border-[#0A0A0A]/10 p-8 hover:border-[#0A0A0A]/40 transition-all group"
            >
              <Heart className="w-8 h-8 text-[#DC2626] mb-4" />
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                I need help
              </h3>
              <p className="text-sm text-[#0A0A0A]/60 mb-4">
                Find services near you. Crisis support, legal help, mentorship, housing.
                No judgment, just options.
              </p>
              <span className="inline-flex items-center gap-2 font-semibold text-sm text-[#DC2626] group-hover:underline">
                Find support <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link
              href="/join"
              className="bg-white rounded-xl border-2 border-[#0A0A0A]/10 p-8 hover:border-[#0A0A0A]/40 transition-all group"
            >
              <Users className="w-8 h-8 text-[#059669] mb-4" />
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                I do the work
              </h3>
              <p className="text-sm text-[#0A0A0A]/60 mb-4">
                Join the ALMA Network. Get your model on the map, access matched grants,
                connect with peers doing the same work.
              </p>
              <span className="inline-flex items-center gap-2 font-semibold text-sm text-[#059669] group-hover:underline">
                Join the network <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link
              href="/proof"
              className="bg-white rounded-xl border-2 border-[#0A0A0A]/10 p-8 hover:border-[#0A0A0A]/40 transition-all group"
            >
              <DollarSign className="w-8 h-8 text-[#0A0A0A] mb-4" />
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                I fund or shape policy
              </h3>
              <p className="text-sm text-[#0A0A0A]/60 mb-4">
                See the evidence. {interventions.length} models, {evidenceBacked} proven. Follow the
                money. Make decisions based on data, not lobby groups.
              </p>
              <span className="inline-flex items-center gap-2 font-semibold text-sm text-[#0A0A0A]/60 group-hover:underline">
                See the proof <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </section>

        {/* The Network — Basecamps — hidden until org data is verified */}
        {false && <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div>
                <p
                  className="text-sm uppercase tracking-[0.3em] text-[#059669] mb-4"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  ALMA Network
                </p>
                <h2
                  className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Community organisations in every state
                </h2>
                <p className="text-white/60 mb-8">
                  Basecamps coordinate the network. Miners do the work. Validators confirm
                  it&apos;s real. Together, they&apos;re building the alternative to a system
                  that spends billions failing kids.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { value: basecamps.length, label: 'Basecamps' },
                    { value: interventions.length.toLocaleString(), label: 'ALMA Models' },
                    { value: (evidenceRes.count || 0).toLocaleString(), label: 'Evidence Items' },
                    { value: youthOppsRes.count || 0, label: 'Open Opportunities' },
                  ].map((s) => (
                    <div key={s.label}>
                      <p
                        className="text-2xl font-bold text-white"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {s.value}
                      </p>
                      <p
                        className="text-xs text-white/40"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/network/alma"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm"
                  >
                    Explore the Network <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/basecamps"
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
                  >
                    See Basecamps
                  </Link>
                </div>
              </div>

              {/* Basecamp cards */}
              <div className="space-y-3">
                {basecamps.slice(0, 6).map((bc: any) => (
                  <Link
                    key={bc.id}
                    href={`/sites/${bc.slug}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#059669]/20">
                      <Shield className="w-4 h-4 text-[#059669]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white group-hover:underline truncate">
                        {bc.name}
                      </p>
                      <p className="text-xs text-white/40 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {bc.state}
                        {bc.is_indigenous_org && ' · Indigenous-led'}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>}

        {/* The Proof Row */}
        <section className="max-w-6xl mx-auto px-6 sm:px-12 py-20">
          <h2
            className="text-3xl font-bold tracking-tight mb-4 text-center"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            The intelligence
          </h2>
          <p className="text-center text-[#0A0A0A]/60 mb-12 max-w-xl mx-auto">
            Data that exposes, proves, and equips. Every number is live from the platform.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/proof" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <Shield className="w-5 h-5 text-[#059669] mb-2" />
              <p className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{interventions.length}</p>
              <p className="text-xs text-[#0A0A0A]/50 mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>verified models</p>
              <span className="text-xs font-semibold text-[#059669] mt-2 flex items-center gap-1 group-hover:underline">Wall of Proof <ArrowRight className="w-3 h-3" /></span>
            </Link>
            <Link href="/follow-the-money" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <DollarSign className="w-5 h-5 text-[#DC2626] mb-2" />
              <p className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(totalFunding)}</p>
              <p className="text-xs text-[#0A0A0A]/50 mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>funding tracked</p>
              <span className="text-xs font-semibold text-[#DC2626] mt-2 flex items-center gap-1 group-hover:underline">Follow the Money <ArrowRight className="w-3 h-3" /></span>
            </Link>
            <Link href="/funders" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <Users className="w-5 h-5 text-[#0A0A0A]/60 mb-2" />
              <p className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{(orgRes.count || 0).toLocaleString()}</p>
              <p className="text-xs text-[#0A0A0A]/50 mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>organisations</p>
              <span className="text-xs font-semibold text-[#0A0A0A]/60 mt-2 flex items-center gap-1 group-hover:underline">Funders <ArrowRight className="w-3 h-3" /></span>
            </Link>
            <Link href="/intelligence/chat" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <Sparkles className="w-5 h-5 text-[#059669] mb-2" />
              <p className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>ALMA</p>
              <p className="text-xs text-[#0A0A0A]/50 mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>AI chat</p>
              <span className="text-xs font-semibold text-[#059669] mt-2 flex items-center gap-1 group-hover:underline">Ask ALMA <ArrowRight className="w-3 h-3" /></span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Link href="/calculator" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <TrendingUp className="w-5 h-5 text-[#0A0A0A]/60 mb-2" />
              <p className="font-bold text-sm">Cost Calculator</p>
              <p className="text-xs text-[#0A0A0A]/40 mt-0.5">Detention vs alternatives</p>
            </Link>
            <Link href="/follow-the-money/big-vs-small" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <TrendingUp className="w-5 h-5 text-[#DC2626] mb-2" />
              <p className="font-bold text-sm">Big vs Small</p>
              <p className="text-xs text-[#0A0A0A]/40 mt-0.5">Corporate vs community</p>
            </Link>
            <Link href="/voices" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <Mic className="w-5 h-5 text-[#059669] mb-2" />
              <p className="font-bold text-sm">Community Voices</p>
              <p className="text-xs text-[#0A0A0A]/40 mt-0.5">Real stories</p>
            </Link>
            <Link href="/trips" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <Calendar className="w-5 h-5 text-[#059669] mb-2" />
              <p className="font-bold text-sm">Learning Trips</p>
              <p className="text-xs text-[#0A0A0A]/40 mt-0.5">Visit each other&apos;s Country</p>
            </Link>
          </div>
        </section>

        {/* Stories from the community */}
        {stories.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 sm:px-12 pb-16">
            <div className="flex items-baseline justify-between mb-6">
              <h2
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                From the community
              </h2>
              <Link href="/voices" className="text-sm font-semibold text-[#059669] hover:underline flex items-center gap-1">
                All voices <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stories.map((story: any) => (
                <div key={story.id} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5">
                  <p className="font-semibold text-sm mb-1">{story.title}</p>
                  {story.organizations && (
                    <p className="text-xs text-[#0A0A0A]/40 mb-2">
                      {story.organizations.name} · {story.organizations.state}
                    </p>
                  )}
                  {story.excerpt && (
                    <p className="text-xs text-[#0A0A0A]/60 line-clamp-3">{story.excerpt}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empathy Ledger Stories */}
        <section className="max-w-6xl mx-auto px-6 sm:px-12 pb-16">
          <EmpathyLedgerStories />
        </section>

        {/* Activity Feed — hidden until data is reliable */}
        {false && <ActivityFeed />}

        {/* Final CTA — The line */}
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-4xl mx-auto px-6 sm:px-12 text-center">
            <p
              className="text-sm uppercase tracking-[0.3em] text-[#059669] mb-6"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              ALMA Network
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              This is time for alternative models of Australia to rise up, support our
              young kids, and build a safer community.
            </h2>
            <p className="text-white/60 mb-10 max-w-2xl mx-auto">
              The evidence is clear. The solutions exist. The network is growing. The only
              question is whether we fund what works — or keep paying for what doesn&apos;t.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/join"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm"
              >
                Join the Network <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/proof"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#DC2626] text-white font-semibold rounded-lg hover:bg-[#DC2626]/90 transition-colors text-sm"
              >
                See the Proof
              </Link>
              <Link
                href="/contained"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                Experience CONTAINED
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
