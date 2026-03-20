import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { ArrowRight, Users, Heart, TrendingUp, MapPin, BookOpen, Zap, Shield, Globe, Leaf } from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Become a Steward | JusticeHub',
  description:
    'Join the movement to protect and nurture youth justice reform. Access evidence-based intelligence, connect with communities, and steward systemic change.',
};

async function getImpactStats() {
  const supabase = createServiceClient();

  const [
    { count: interventions },
    { count: withOutcomes },
    { count: aboriginalPrograms },
    { data: stateData },
  ] = await Promise.all([
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }),
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).not('outcomes', 'is', null),
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).ilike('name', '%Aboriginal%'),
    supabase.from('alma_interventions').select('metadata').not('metadata->>state', 'is', null),
  ]);

  const states = new Set(stateData?.map((row: any) => row.metadata?.state).filter(Boolean));

  return {
    totalPrograms: interventions || 0,
    withOutcomes: withOutcomes || 0,
    aboriginalLed: aboriginalPrograms || 0,
    statesCovered: states.size,
    outcomesRate: interventions ? Math.round(((withOutcomes || 0) / interventions) * 100) : 0,
  };
}

export default async function StewardsPage() {
  const stats = await getImpactStats();

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="page-content">
      {/* Hero Section */}
      <section className="section-padding border-b-2 border-black bg-gradient-to-br from-green-50 to-white">
        <div className="container-justice text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border-2 border-green-700 text-green-800 font-bold text-sm mb-8">
            <Leaf className="w-4 h-4" />
            PROTECT WHAT WORKS
          </div>

          <h1 className="headline-truth mb-6">
            Become a<br />
            JusticeHub Steward.
          </h1>

          <p className="body-truth mx-auto mb-12 max-w-3xl">
            Stewards protect and nurture what works. Access Australia's most comprehensive youth justice
            intelligence. Connect with communities. Ensure resources flow to evidence-based programs
            that honor Indigenous knowledge and community control.
          </p>

          {/* Impact Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
            <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl font-black text-green-700 mb-2">{stats.totalPrograms}</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">Programs Documented</div>
            </div>
            <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl font-black text-green-600 mb-2">{stats.outcomesRate}%</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">With Outcomes Data</div>
            </div>
            <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl font-black text-purple-600 mb-2">{stats.aboriginalLed}</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">Aboriginal-Led Programs</div>
            </div>
            <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl font-black text-blue-600 mb-2">{stats.statesCovered}/8</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">States Covered</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup?role=steward" className="cta-primary">
              BECOME A STEWARD <ArrowRight className="inline w-5 h-5 ml-2" />
            </Link>
            <Link href="/intelligence/interventions" className="cta-secondary">
              EXPLORE THE DATA
            </Link>
          </div>
        </div>
      </section>

      {/* What Stewards Do */}
      <section className="section-padding border-b-2 border-black">
        <div className="container-justice">
          <h2 className="text-3xl font-black text-black mb-4 text-center">
            What JusticeHub Stewards Do
          </h2>
          <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
            Stewards are caretakers of evidence and community knowledge. They protect what works,
            nurture emerging programs, and ensure resources flow to communities—not extractive systems.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="border-2 border-black p-8 bg-white hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow">
              <div className="inline-flex p-4 bg-blue-50 mb-6">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Protect Knowledge</h3>
              <p className="text-gray-700 mb-4">
                Full access to ALMA's {stats.totalPrograms} documented programs, outcome data,
                and evidence base. Safeguard community intelligence.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>→ Program outcome data</li>
                <li>→ Cost-effectiveness analysis</li>
                <li>→ Community authority scores</li>
                <li>→ Evidence quality ratings</li>
              </ul>
            </div>

            <div className="border-2 border-black p-8 bg-white hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow">
              <div className="inline-flex p-4 bg-green-50 mb-6">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Nurture Communities</h3>
              <p className="text-gray-700 mb-4">
                Bridge programs across jurisdictions. Share what's working. Build networks
                that strengthen collective care for young people.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>→ Cross-state collaboration</li>
                <li>→ Program replication guides</li>
                <li>→ Community introductions</li>
                <li>→ Knowledge sharing circles</li>
              </ul>
            </div>

            <div className="border-2 border-black p-8 bg-white hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow">
              <div className="inline-flex p-4 bg-orange-50 mb-6">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Guide Resources</h3>
              <p className="text-gray-700 mb-4">
                Use evidence to inform policy, direct funding, and ensure investment flows
                to programs with proven community outcomes.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>→ Policy brief templates</li>
                <li>→ Funding case studies</li>
                <li>→ Evidence summaries</li>
                <li>→ Impact measurement guides</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Free vs Paid — The Clear Distinction */}
      <section className="section-padding border-b-2 border-black bg-gray-50">
        <div className="container-justice">
          <h2 className="text-3xl font-black text-black mb-4 text-center">
            Free vs Steward Access
          </h2>
          <p className="text-center text-gray-700 mb-4 max-w-2xl mx-auto">
            JusticeHub&apos;s public data is free forever. Steward access unlocks the tools
            that turn data into action.
          </p>
          <p className="text-center text-sm text-gray-500 mb-12 max-w-2xl mx-auto">
            Revenue from Steward subscriptions funds the infrastructure and flows back to
            community knowledge holders. Not to shareholders.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free — What Everyone Gets */}
            <div className="border-2 border-black bg-white">
              <div className="bg-[#0A0A0A] text-white p-4 border-b-2 border-black">
                <h3 className="text-xl font-bold">Public Access</h3>
                <p className="text-gray-400 text-sm">Free forever</p>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Browse, search, and explore — no account needed.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm">
                    <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Browse all {stats.totalPrograms} programs</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Search by state, type, evidence level</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>View program summaries and evidence ratings</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Chat with ALMA (basic queries)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Justice spending transparency</span>
                  </li>
                </ul>
                <Link
                  href="/intelligence/interventions"
                  className="block w-full text-center py-3 border-2 border-black font-bold hover:bg-gray-100 transition-colors"
                >
                  Explore Free Data
                </Link>
              </div>
            </div>

            {/* Professional Steward — What You Get Paid */}
            <div className="border-2 border-black bg-white relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#DC2626] text-white text-xs font-bold px-3 py-1 border-2 border-black">
                  FOR PRACTITIONERS
                </span>
              </div>
              <div className="bg-[#059669] text-white p-4 border-b-2 border-black">
                <h3 className="text-xl font-bold">Professional Steward</h3>
                <p className="text-emerald-100 text-sm">$29/month</p>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  The tools to write funding applications, build evidence cases, and compare programs.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" />
                    <span><strong>Deep outcome data</strong> — full evaluation results, not just summaries</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" />
                    <span><strong>Cost-per-outcome comparisons</strong> — detention vs community, by program type</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" />
                    <span><strong>Export-ready policy briefs</strong> — evidence summaries formatted for MPs and funders</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" />
                    <span><strong>Portfolio comparison tools</strong> — benchmark your program against peers</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" />
                    <span><strong>Community introductions</strong> — connect with programs doing similar work</span>
                  </li>
                </ul>
                <Link
                  href="/signup?role=steward&tier=professional"
                  className="block w-full text-center py-3 bg-[#059669] text-white font-bold border-2 border-black hover:bg-emerald-700 transition-colors"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>

            {/* Organization */}
            <div className="border-2 border-black bg-white">
              <div className="bg-[#0A0A0A] text-white p-4 border-b-2 border-black">
                <h3 className="text-xl font-bold">Organization</h3>
                <p className="text-gray-400 text-sm">Custom pricing</p>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  For departments, foundations, and service providers who need data at scale.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-[#0A0A0A] mt-0.5 flex-shrink-0" />
                    <span><strong>API access to ALMA</strong> — integrate evidence into your own systems</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-[#0A0A0A] mt-0.5 flex-shrink-0" />
                    <span><strong>Unlimited team seats</strong> — your whole department, one subscription</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-[#0A0A0A] mt-0.5 flex-shrink-0" />
                    <span><strong>Custom intelligence reports</strong> — tailored to your region or portfolio</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-[#0A0A0A] mt-0.5 flex-shrink-0" />
                    <span><strong>Advisory council seat</strong> — input on research priorities</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-[#0A0A0A] mt-0.5 flex-shrink-0" />
                    <span><strong>Priority support</strong> — dedicated contact for your team</span>
                  </li>
                </ul>
                <Link
                  href="/contact?subject=organization"
                  className="block w-full text-center py-3 bg-[#0A0A0A] text-white font-bold border-2 border-black hover:bg-gray-800 transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steward Community */}
      <section className="section-padding border-b-2 border-black">
        <div className="container-justice">
          <h2 className="text-3xl font-black text-black mb-4 text-center">
            The Steward Community
          </h2>
          <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
            Join a growing network of practitioners, researchers, policy makers, and community
            leaders committed to protecting and nurturing youth justice reform.
          </p>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
            <div className="text-center p-6 border-2 border-black bg-white">
              <Globe className="w-8 h-8 mx-auto mb-4 text-blue-600" />
              <div className="text-3xl font-black text-black mb-1">{stats.statesCovered}</div>
              <div className="text-sm text-gray-600">States Represented</div>
            </div>
            <div className="text-center p-6 border-2 border-black bg-white">
              <Users className="w-8 h-8 mx-auto mb-4 text-green-600" />
              <div className="text-3xl font-black text-black mb-1">50+</div>
              <div className="text-sm text-gray-600">Active Stewards</div>
            </div>
            <div className="text-center p-6 border-2 border-black bg-white">
              <Heart className="w-8 h-8 mx-auto mb-4 text-red-600" />
              <div className="text-3xl font-black text-black mb-1">{stats.aboriginalLed}</div>
              <div className="text-sm text-gray-600">Aboriginal-Led Programs</div>
            </div>
            <div className="text-center p-6 border-2 border-black bg-white">
              <MapPin className="w-8 h-8 mx-auto mb-4 text-purple-600" />
              <div className="text-3xl font-black text-black mb-1">100+</div>
              <div className="text-sm text-gray-600">Communities Served</div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="border-l-4 border-green-700 pl-6 py-4">
              <p className="text-gray-700 italic mb-4">
                "JusticeHub gave us the evidence we needed to secure $2M in funding for our
                community-led diversion program. The data speaks louder than any pitch deck."
              </p>
              <p className="font-bold text-black">— Youth Justice Program Director, QLD</p>
            </div>
            <div className="border-l-4 border-blue-600 pl-6 py-4">
              <p className="text-gray-700 italic mb-4">
                "Being able to compare outcomes across similar programs helped us refine our
                approach. We're seeing 40% better engagement since joining the network."
              </p>
              <p className="font-bold text-black">— Community Services Manager, NT</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stewardship Principles */}
      <section className="section-padding border-b-2 border-black bg-green-50">
        <div className="container-justice">
          <h2 className="text-3xl font-black text-black mb-4 text-center">
            Stewardship Principles
          </h2>
          <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
            What guides our community of stewards.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="border-2 border-black bg-white p-6">
              <div className="text-3xl mb-4">🌱</div>
              <h3 className="font-bold text-black mb-2">Nurture, Don't Extract</h3>
              <p className="text-sm text-gray-600">
                We grow community capacity. We never take knowledge without giving back.
              </p>
            </div>
            <div className="border-2 border-black bg-white p-6">
              <div className="text-3xl mb-4">🛡️</div>
              <h3 className="font-bold text-black mb-2">Protect What Works</h3>
              <p className="text-sm text-gray-600">
                Evidence-based programs deserve protection from political winds and funding cuts.
              </p>
            </div>
            <div className="border-2 border-black bg-white p-6">
              <div className="text-3xl mb-4">🤝</div>
              <h3 className="font-bold text-black mb-2">Community First</h3>
              <p className="text-sm text-gray-600">
                Communities own their data and knowledge. Revenue flows to knowledge holders.
              </p>
            </div>
            <div className="border-2 border-black bg-white p-6">
              <div className="text-3xl mb-4">🔄</div>
              <h3 className="font-bold text-black mb-2">Long-Term Thinking</h3>
              <p className="text-sm text-gray-600">
                We steward for generations, not quarterly reports. Sustainable change takes time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-black text-white">
        <div className="container-justice text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to Steward Change?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join stewards across Australia protecting and nurturing evidence-based youth justice.
            Start free. Grow when you're ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup?role=steward"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-700 text-white font-bold border-2 border-white hover:bg-green-800 transition-colors"
            >
              BECOME A STEWARD <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/intelligence"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-bold border-2 border-white hover:bg-white hover:text-black transition-colors"
            >
              EXPLORE ALMA FIRST
            </Link>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}
