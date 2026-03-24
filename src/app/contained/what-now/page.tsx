import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Users,
  Shield,
  DollarSign,
  TrendingUp,
  Heart,
  Mic,
  Share2,
  Calendar,
  Palette,
  MapPin,
} from 'lucide-react';
import { Metadata } from 'next';
import { fmt } from '@/lib/format';
import { getDetentionCosts } from '@/lib/detention-costs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'What Now? | After CONTAINED | JusticeHub',
  description:
    'You\'ve seen the reality. Now here\'s what you can do about it. Join the network, follow the money, share the data, and support the alternative.',
};

export default async function WhatNowPage() {
  const supabase = createServiceClient() as any;

  const [modelsRes, costRes, basecampsRes] = await Promise.all([
    supabase.from('alma_interventions').select('id', { count: 'exact', head: true }).neq('verification_status', 'ai_generated'),
    supabase.from('alma_interventions').select('cost_per_young_person').neq('verification_status', 'ai_generated').not('cost_per_young_person', 'is', null).gt('cost_per_young_person', 0).lt('cost_per_young_person', 500000),
    supabase.from('organizations').select('id, name, state', { count: 'exact' }).or('partner_tier.eq.basecamp,type.eq.basecamp'),
  ]);

  const modelCount = modelsRes.count || 0;
  const costs = (costRes.data || []).map((r: any) => Number(r.cost_per_young_person)).filter((n: number) => n > 0);
  const avgCost = costs.length ? Math.round(costs.reduce((a: number, b: number) => a + b, 0) / costs.length) : 8500;
  const detentionCostsData = await getDetentionCosts();
  const ratio = Math.round(detentionCostsData.national.annualCost / avgCost);
  const basecamps = basecampsRes.data || [];

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero — emotional bridge */}
        <section className="bg-[#0A0A0A] text-white py-24">
          <div className="max-w-4xl mx-auto px-6 sm:px-12 text-center">
            <p
              className="text-sm uppercase tracking-[0.3em] text-[#DC2626] mb-6"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              You&apos;ve Seen It
            </p>
            <h1
              className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Now what?
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Room 1 showed you the reality. Room 2 showed you the alternative.
              Room 3 showed you the community already building it. This page is
              Room 4 — where you decide what to do next.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-16">
          {/* The fact */}
          <section className="bg-[#0A0A0A] text-white rounded-xl p-8 text-center">
            <p className="text-white/40 text-sm mb-3">The fact you just experienced:</p>
            <p className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {modelCount} community alternatives exist.
              They cost <span className="text-[#059669]">{ratio}x less</span> than detention.
              They work <span className="text-[#059669]">better</span>.
            </p>
          </section>

          {/* Five actions — who are you? */}
          <section>
            <h2
              className="text-2xl font-bold tracking-tight mb-2 text-center"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Pick your action
            </h2>
            <p className="text-center text-[#0A0A0A]/60 mb-10">
              What you do next depends on who you are.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Community org */}
              <Link
                href="/join"
                className="bg-white rounded-xl border-2 border-[#0A0A0A]/10 p-8 hover:border-[#059669] transition-all group"
              >
                <Users className="w-8 h-8 text-[#059669] mb-4" />
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  I run a community organisation
                </h3>
                <p className="text-sm text-[#0A0A0A]/60 mb-4">
                  Join the ALMA Network. Get your model on the map, access matched grants,
                  connect with {basecamps.length} Basecamps and peers doing the same work.
                  Two minutes to join. Free forever.
                </p>
                <span className="inline-flex items-center gap-2 font-semibold text-sm text-[#059669] group-hover:underline">
                  Join the network <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              {/* Young person */}
              <Link
                href="/services"
                className="bg-white rounded-xl border-2 border-[#0A0A0A]/10 p-8 hover:border-[#DC2626] transition-all group"
              >
                <Heart className="w-8 h-8 text-[#DC2626] mb-4" />
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  I need help or know someone who does
                </h3>
                <p className="text-sm text-[#0A0A0A]/60 mb-4">
                  Find services near you. Crisis support, legal help, mentorship, housing,
                  cultural programs. No judgment, just options.
                </p>
                <span className="inline-flex items-center gap-2 font-semibold text-sm text-[#DC2626] group-hover:underline">
                  Find support <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              {/* Funder */}
              <Link
                href="/proof"
                className="bg-white rounded-xl border-2 border-[#0A0A0A]/10 p-8 hover:border-[#0A0A0A] transition-all group"
              >
                <DollarSign className="w-8 h-8 text-[#0A0A0A] mb-4" />
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  I fund or shape policy
                </h3>
                <p className="text-sm text-[#0A0A0A]/60 mb-4">
                  See the Wall of Proof — {modelCount} models with evidence and cost data.
                  Run the calculator. Follow the money. Make decisions based on data.
                </p>
                <span className="inline-flex items-center gap-2 font-semibold text-sm text-[#0A0A0A]/60 group-hover:underline">
                  See the proof <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              {/* Amplifier */}
              <Link
                href="/share"
                className="bg-white rounded-xl border-2 border-[#0A0A0A]/10 p-8 hover:border-[#059669] transition-all group"
              >
                <Share2 className="w-8 h-8 text-[#059669] mb-4" />
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  I want to spread the word
                </h3>
                <p className="text-sm text-[#0A0A0A]/60 mb-4">
                  Download branded data cards. Copy ready-to-post LinkedIn content. Share your
                  state&apos;s scorecard. Every share puts a number in front of someone who
                  needs to see it.
                </p>
                <span className="inline-flex items-center gap-2 font-semibold text-sm text-[#059669] group-hover:underline">
                  Get shareable content <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </section>

          {/* Quick links to everything */}
          <section>
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Explore the platform
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { href: '/proof', icon: Shield, label: 'Wall of Proof', desc: `${modelCount} models` },
                { href: '/calculator', icon: TrendingUp, label: 'Cost Calculator', desc: `${ratio}x cheaper` },
                { href: '/follow-the-money', icon: DollarSign, label: 'Follow the Money', desc: 'Funding trail' },
                { href: '/voices', icon: Mic, label: 'Community Voices', desc: 'Real stories' },
                { href: '/leaderboard', icon: TrendingUp, label: 'State Rankings', desc: 'Who leads?' },
                { href: '/competitions', icon: Palette, label: 'Art Competitions', desc: 'Young creatives' },
                { href: '/gig-guide', icon: Calendar, label: 'Gig Guide', desc: 'Events near you' },
                { href: '/network/alma', icon: Users, label: 'ALMA Network', desc: 'The movement' },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="bg-white rounded-xl border border-[#0A0A0A]/10 p-4 hover:border-[#0A0A0A]/30 transition-colors group"
                  >
                    <Icon className="w-4 h-4 text-[#059669] mb-2" />
                    <p className="font-bold text-sm">{link.label}</p>
                    <p className="text-xs text-[#0A0A0A]/40">{link.desc}</p>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Bring it to your city */}
          <section className="bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <MapPin className="w-8 h-8 text-[#DC2626] mb-4" />
                <h2
                  className="text-2xl font-bold text-white mb-4"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Bring CONTAINED to your city
                </h2>
                <p className="text-white/60 mb-6">
                  The container travels. If you have a venue, a community, and a reason —
                  we&apos;ll bring it to you. Every stop adds orgs, stories, and data
                  to the platform.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/contained/nominations"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm"
                  >
                    Nominate your city <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/contained/tour"
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
                  >
                    See tour dates
                  </Link>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <p className="text-xs uppercase tracking-wider text-white/40 mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  What happens at every stop
                </p>
                <div className="space-y-3">
                  {[
                    'Local orgs profiled on JusticeHub',
                    'Stories captured via Empathy Ledger',
                    'Attendees invited to join the ALMA Network',
                    'Local intelligence briefing published',
                    'Art submissions for monthly competition',
                    'Connections to state Basecamp',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-white/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* The line */}
          <section className="text-center py-8">
            <p
              className="text-xl md:text-2xl font-bold max-w-3xl mx-auto"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              &ldquo;This is time for alternative models of Australia to rise up, support
              our young kids, and build a safer community.&rdquo;
            </p>
            <p className="text-sm text-[#0A0A0A]/40 mt-4">
              You&apos;ve seen it. Now be part of it.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
