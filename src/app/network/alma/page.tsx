import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  Users,
  Shield,
  TrendingUp,
  MapPin,
  ArrowRight,
  CheckCircle,
  Calendar,
  Heart,
} from 'lucide-react';
import { Metadata } from 'next';
import { STATE_NAMES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ALMA Network | JusticeHub',
  description:
    'The Alternative Local Models of Australia network — community organisations building the alternative to a broken system.',
};

export default async function ALMANetworkPage() {
  const supabase = createServiceClient() as any;

  const [
    basecampsRes,
    minersRes,
    validationsRes,
    interventionsRes,
    youthOppsRes,
  ] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, slug, state, is_indigenous_org')
      .or('partner_tier.eq.basecamp,type.eq.basecamp'),
    supabase
      .from('network_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('peer_validations')
      .select('id', { count: 'exact', head: true })
      .eq('is_public', true),
    supabase
      .from('alma_interventions')
      .select('id', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated'),
    supabase
      .from('youth_opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open'),
  ]);

  const basecamps = basecampsRes.data || [];
  const minerCount = minersRes.count || 0;
  const validationCount = validationsRes.count || 0;
  const interventionCount = interventionsRes.count || 0;
  const openOpps = youthOppsRes.count || 0;

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <p
              className="text-sm uppercase tracking-[0.3em] text-[#059669] mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              ALMA Network
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Alternative Local Models
              <br />
              of Australia
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mb-10">
              A decentralised network of community organisations proving that
              local models work better, cost less, and keep young people safe.
              Open source. Community validated. Built to replace a broken system.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { value: basecamps.length, label: 'Basecamps' },
                { value: minerCount, label: 'Miners' },
                { value: interventionCount.toLocaleString(), label: 'ALMA Models' },
                { value: validationCount, label: 'Validations' },
                { value: openOpps, label: 'Open Opportunities' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {s.value}
                  </p>
                  <p className="text-xs text-white/50 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-16">
          {/* How it works */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              How the Network Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield, title: 'Basecamps',
                  desc: 'One coordinator org per state. They connect local organisations, tell stories, advocate for funding, and keep the network strong.',
                  link: '/basecamps', linkText: 'See Basecamps',
                },
                {
                  icon: Heart, title: 'Miners',
                  desc: 'Community organisations doing the work. They contribute stories and impact data. The network gets smarter with every org that joins.',
                  link: '/join', linkText: 'Join as a Miner',
                },
                {
                  icon: CheckCircle, title: 'Validators',
                  desc: 'Peers who confirm the work is real. Endorsements, site visits, collaboration — accountability from community, not government.',
                  link: null, linkText: 'Validation is earned, not granted.',
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0A0A0A] text-white mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold mb-2">{card.title}</h3>
                    <p className="text-sm text-[#0A0A0A]/60 mb-3">{card.desc}</p>
                    {card.link ? (
                      <Link href={card.link} className="text-sm font-semibold text-[#059669] hover:underline flex items-center gap-1">
                        {card.linkText} <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <p className="text-sm text-[#0A0A0A]/40">{card.linkText}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Basecamps */}
          <section>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Active Basecamps
              </h2>
              <Link href="/basecamps" className="text-sm font-semibold hover:underline flex items-center gap-1">
                All states <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {basecamps.map((bc: any) => (
                <Link
                  key={bc.id}
                  href={`/sites/${bc.slug}`}
                  className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#059669]/10 text-[#059669]">{bc.state}</span>
                    {bc.is_indigenous_org && <span className="text-xs text-[#0A0A0A]/40">Indigenous-led</span>}
                  </div>
                  <h3 className="font-bold text-sm group-hover:underline">{bc.name}</h3>
                  <p className="text-xs text-[#0A0A0A]/50 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {STATE_NAMES[bc.state]}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* Network Hub — All Pages */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              The Network
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/proof" className="bg-[#0A0A0A] text-white rounded-xl p-6 hover:bg-[#0A0A0A]/90 transition-colors group">
                <Shield className="w-6 h-6 text-[#059669] mb-3" />
                <h3 className="font-bold text-lg text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Wall of Proof</h3>
                <p className="text-sm text-white/60">{interventionCount.toLocaleString()} verified models with evidence and cost data.</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#059669] mt-3 group-hover:underline">See proof <ArrowRight className="w-3 h-3" /></span>
              </Link>
              <Link href="/follow-the-money" className="bg-[#0A0A0A] text-white rounded-xl p-6 hover:bg-[#0A0A0A]/90 transition-colors group">
                <TrendingUp className="w-6 h-6 text-[#DC2626] mb-3" />
                <h3 className="font-bold text-lg text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Follow the Money</h3>
                <p className="text-sm text-white/60">State-by-state breakdown of where youth justice funding goes.</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#DC2626] mt-3 group-hover:underline">Explore <ArrowRight className="w-3 h-3" /></span>
              </Link>
              <Link href="/calculator" className="bg-[#0A0A0A] text-white rounded-xl p-6 hover:bg-[#0A0A0A]/90 transition-colors group">
                <TrendingUp className="w-6 h-6 text-white mb-3" />
                <h3 className="font-bold text-lg text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Cost Calculator</h3>
                <p className="text-sm text-white/60">Interactive: what if we redirected detention spending?</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-white/70 mt-3 group-hover:underline">Calculate <ArrowRight className="w-3 h-3" /></span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <Link href="/network/alma/impact" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
                <h3 className="font-bold text-sm mb-1">Network Impact</h3>
                <p className="text-xs text-[#0A0A0A]/50">Collective proof in numbers</p>
                <span className="text-xs font-semibold text-[#059669] mt-2 flex items-center gap-1 group-hover:underline">View <ArrowRight className="w-3 h-3" /></span>
              </Link>
              <Link href="/trips" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
                <h3 className="font-bold text-sm mb-1">Learning Trips</h3>
                <p className="text-xs text-[#0A0A0A]/50">Visit each other&apos;s Country</p>
                <span className="text-xs font-semibold text-[#059669] mt-2 flex items-center gap-1 group-hover:underline">View <ArrowRight className="w-3 h-3" /></span>
              </Link>
              <Link href="/network/alma/gathering" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
                <h3 className="font-bold text-sm mb-1">National Gathering</h3>
                <p className="text-xs text-[#0A0A0A]/50">July 2026 — first ever</p>
                <span className="text-xs font-semibold text-[#059669] mt-2 flex items-center gap-1 group-hover:underline">View <ArrowRight className="w-3 h-3" /></span>
              </Link>
              <Link href="/network/alma/services" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
                <h3 className="font-bold text-sm mb-1">Services</h3>
                <p className="text-xs text-[#0A0A0A]/50">Reports, consulting, intelligence</p>
                <span className="text-xs font-semibold text-[#059669] mt-2 flex items-center gap-1 group-hover:underline">View <ArrowRight className="w-3 h-3" /></span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <Link href="/voices" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
                <h3 className="font-bold text-sm mb-1">Community Voices</h3>
                <p className="text-xs text-[#0A0A0A]/50">Real stories from real people</p>
                <span className="text-xs font-semibold text-[#059669] mt-2 flex items-center gap-1 group-hover:underline">Listen <ArrowRight className="w-3 h-3" /></span>
              </Link>
              <Link href="/competitions" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
                <h3 className="font-bold text-sm mb-1">Art Competitions</h3>
                <p className="text-xs text-[#0A0A0A]/50">Monthly creative challenges</p>
                <span className="text-xs font-semibold text-[#059669] mt-2 flex items-center gap-1 group-hover:underline">Enter <ArrowRight className="w-3 h-3" /></span>
              </Link>
              <Link href="/gig-guide" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
                <h3 className="font-bold text-sm mb-1">Gig Guide</h3>
                <p className="text-xs text-[#0A0A0A]/50">Events near basecamps</p>
                <span className="text-xs font-semibold text-[#059669] mt-2 flex items-center gap-1 group-hover:underline">Browse <ArrowRight className="w-3 h-3" /></span>
              </Link>
              <Link href="/join" className="bg-[#059669] text-white rounded-xl p-5 hover:bg-[#059669]/90 transition-colors group">
                <h3 className="font-bold text-sm text-white mb-1">Join the Network</h3>
                <p className="text-xs text-white/60">Two minutes. Free forever.</p>
                <span className="text-xs font-semibold text-white mt-2 flex items-center gap-1 group-hover:underline">Join now <ArrowRight className="w-3 h-3" /></span>
              </Link>
            </div>
          </section>

          {/* Thesis */}
          <section className="bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Why &ldquo;Alternative&rdquo;?
            </h2>
            <div className="space-y-4 text-white/80 max-w-3xl">
              <p>
                Australia spends billions on youth justice systems that don&apos;t work.
                Detention costs over $1,500 per child per day. Reoffending rates sit
                above 50%. The money flows to large service providers while community
                organisations fight for scraps.
              </p>
              <p>
                The ALMA Network isn&apos;t asking for permission. We&apos;re building the
                alternative — community-led models that achieve better outcomes at a
                fraction of the cost. Every Basecamp, every miner, every story is
                proof that the system can change.
              </p>
              <p className="text-white font-semibold">
                This is time for alternative models of Australia to rise up, support
                our young kids, and build a safer community.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
