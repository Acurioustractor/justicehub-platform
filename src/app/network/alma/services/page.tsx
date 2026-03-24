import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  FileText,
  BarChart3,
  Users,
  ArrowRight,
  DollarSign,
  Shield,
  TrendingUp,
  Globe,
  BookOpen,
  Briefcase,
} from 'lucide-react';
import { Metadata } from 'next';
import { fmt } from '@/lib/format';
import { STATE_NAMES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Services | ALMA Network | JusticeHub',
  description:
    'Data analysis, impact reports, and consulting services powered by the ALMA Network. Intelligence that funds the movement.',
};

export default async function ServicesPage() {
  const supabase = createServiceClient() as any;

  const [interventionsRes, fundingRes, orgRes, evidenceRes] = await Promise.all([
    supabase
      .from('alma_interventions')
      .select('id', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated'),
    supabase
      .from('justice_funding')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('alma_evidence')
      .select('id', { count: 'exact', head: true }),
  ]);

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
              Intelligence Services
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Data That Funds the Movement
            </h1>
            <p className="text-lg text-white/70 max-w-3xl mb-8">
              The platform generates intelligence that governments, funders, and large
              organisations need. Revenue from services goes directly to supporting
              Basecamps, travel bursaries, and community org access.
            </p>

            <div className="flex flex-wrap gap-6">
              {[
                { value: (orgRes.count || 0).toLocaleString(), label: 'Organisations' },
                { value: (fundingRes.count || 0).toLocaleString(), label: 'Funding records' },
                { value: (interventionsRes.count || 0).toLocaleString(), label: 'ALMA models' },
                { value: (evidenceRes.count || 0).toLocaleString(), label: 'Evidence items' },
              ].map((s) => (
                <div key={s.label}>
                  <p
                    className="text-xl font-bold text-white"
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
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-16">
          {/* Services */}
          <section>
            <h2
              className="text-2xl font-bold tracking-tight mb-8"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              What We Offer
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* State Reports */}
              <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#DC2626]/10">
                    <BarChart3 className="w-5 h-5 text-[#DC2626]" />
                  </div>
                  <div>
                    <h3
                      className="font-bold"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      Automated State Reports
                    </h3>
                    <p
                      className="text-xs text-[#0A0A0A]/40"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      Quarterly · Per state
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#0A0A0A]/60 mb-4">
                  Comprehensive quarterly reports for each state: funding flows, recipient
                  analysis, Indigenous org share, community vs corporate breakdown, ALMA model
                  count and evidence levels, ministerial statement analysis.
                </p>
                <ul className="space-y-1.5 mb-4">
                  {[
                    'Total youth justice spend and top 20 recipients',
                    'Indigenous org funding share vs population',
                    'Community vs corporate provider analysis',
                    'ALMA models operating in state with evidence ratings',
                    'CivicScope: what government says vs what data shows',
                    'Quarter-on-quarter trends',
                  ].map((item, i) => (
                    <li key={i} className="text-xs text-[#0A0A0A]/50 flex items-start gap-2">
                      <span className="text-[#DC2626] mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-[#0A0A0A]/10 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#0A0A0A]/40">Available for all 8 states</p>
                    <div className="flex gap-1 mt-1">
                      {Object.keys(STATE_NAMES).map((s) => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 bg-[#0A0A0A]/5 rounded text-[#0A0A0A]/40">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Impact Reports */}
              <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#059669]/10">
                    <FileText className="w-5 h-5 text-[#059669]" />
                  </div>
                  <div>
                    <h3
                      className="font-bold"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      Impact Report Generator
                    </h3>
                    <p
                      className="text-xs text-[#0A0A0A]/40"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      On demand · Per org or network
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#0A0A0A]/60 mb-4">
                  Automated impact reports from platform data. Basecamps and miners use these
                  for their own fundraising — populated with real numbers, peer validations,
                  cost comparisons, and stories.
                </p>
                <ul className="space-y-1.5 mb-4">
                  {[
                    'Org-specific: programs, outcomes, cost per young person',
                    'Peer validation summary and community endorsements',
                    'Funding history and grant success tracking',
                    'Comparison with state detention costs',
                    'Empathy Ledger stories and media as supporting evidence',
                    'Export as PDF — ready to attach to grant applications',
                  ].map((item, i) => (
                    <li key={i} className="text-xs text-[#0A0A0A]/50 flex items-start gap-2">
                      <span className="text-[#059669] mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-[#0A0A0A]/10">
                  <p className="text-xs text-[#0A0A0A]/40">
                    Free for network members · Premium for external orgs
                  </p>
                </div>
              </div>

              {/* Consulting */}
              <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#0A0A0A]/10">
                    <Briefcase className="w-5 h-5 text-[#0A0A0A]" />
                  </div>
                  <div>
                    <h3
                      className="font-bold"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      Consulting & Analysis
                    </h3>
                    <p
                      className="text-xs text-[#0A0A0A]/40"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      Custom · Governments & corporates
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#0A0A0A]/60 mb-4">
                  Custom data analysis, sector reports, and funding landscape briefings.
                  Governments and corporates pay market rate for intelligence the platform
                  generates — surplus funds community access.
                </p>
                <ul className="space-y-1.5 mb-4">
                  {[
                    'Sector landscape analysis — who does what, where, for how much',
                    'Funding gap analysis — where money should go but doesn\'t',
                    'Policy impact assessment — what will this change actually do?',
                    'Community model evaluation — evidence-backed program reviews',
                    'Data integration — connect your data with national intelligence',
                  ].map((item, i) => (
                    <li key={i} className="text-xs text-[#0A0A0A]/50 flex items-start gap-2">
                      <span className="text-[#0A0A0A]/30 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-[#0A0A0A]/10">
                  <p className="text-xs text-[#0A0A0A]/40">
                    Contact for pricing — scales with organisation size
                  </p>
                </div>
              </div>

              {/* Funding Landscape */}
              <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#DC2626]/10">
                    <Globe className="w-5 h-5 text-[#DC2626]" />
                  </div>
                  <div>
                    <h3
                      className="font-bold"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      Funding Landscape Briefings
                    </h3>
                    <p
                      className="text-xs text-[#0A0A0A]/40"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      Monthly · Subscribers
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#0A0A0A]/60 mb-4">
                  Monthly briefings on the youth justice funding landscape: new grants,
                  tender opportunities, government announcements, funding shifts, and what
                  they mean for community organisations.
                </p>
                <ul className="space-y-1.5 mb-4">
                  {[
                    'New youth-focused grants and tenders identified',
                    'Government budget announcements analysed',
                    'Ministerial statement context from CivicScope',
                    'Matched opportunities for your org\'s focus area',
                    'Deadline reminders and application tips',
                  ].map((item, i) => (
                    <li key={i} className="text-xs text-[#0A0A0A]/50 flex items-start gap-2">
                      <span className="text-[#DC2626] mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-[#0A0A0A]/10">
                  <p className="text-xs text-[#0A0A0A]/40">
                    Free for network Basecamps · Subscription for others
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing model */}
          <section className="bg-white rounded-xl border border-[#0A0A0A]/10 p-8">
            <h2
              className="text-xl font-bold mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              The Revenue Model
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#059669]/10 mx-auto mb-3">
                  <Shield className="w-5 h-5 text-[#059669]" />
                </div>
                <h3 className="font-bold mb-1">Community Orgs</h3>
                <p
                  className="text-2xl font-bold text-[#059669] mb-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Free
                </p>
                <p className="text-xs text-[#0A0A0A]/50">
                  All platform features, impact reports, grant matching. Pay-what-you-can
                  if you want to contribute.
                </p>
              </div>
              <div className="text-center p-4 border-l border-r border-[#0A0A0A]/10">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#0A0A0A]/10 mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-[#0A0A0A]" />
                </div>
                <h3 className="font-bold mb-1">Large Organisations</h3>
                <p
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Market Rate
                </p>
                <p className="text-xs text-[#0A0A0A]/50">
                  State reports, data access, consulting. Pricing scales with organisation
                  size and revenue.
                </p>
              </div>
              <div className="text-center p-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#DC2626]/10 mx-auto mb-3">
                  <DollarSign className="w-5 h-5 text-[#DC2626]" />
                </div>
                <h3 className="font-bold mb-1">Government</h3>
                <p
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Premium
                </p>
                <p className="text-xs text-[#0A0A0A]/50">
                  Custom analysis, policy briefings, sector mapping. You created the
                  problem — you fund the intelligence that solves it.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-[#0A0A0A]/10 text-center">
              <p className="text-sm text-[#0A0A0A]/60">
                <strong>All surplus</strong> from services goes to Basecamp funding, travel bursaries,
                and keeping the platform free for community organisations.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12">
            <div className="max-w-2xl">
              <h2
                className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Get in Touch
              </h2>
              <p className="text-white/70 mb-6">
                Whether you&apos;re a community org that needs an impact report, a government
                department that needs sector intelligence, or a funder who wants to understand
                where the money actually goes — we can help.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/join"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm"
                >
                  Join the Network
                </Link>
                <a
                  href="mailto:benjamin@act.place"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
