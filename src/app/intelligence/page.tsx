import Link from 'next/link';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Intelligence Hub | ALMA - Australian Youth Justice Intelligence',
  description:
    'Australia\'s most comprehensive youth justice intelligence system. Evidence-based, community-owned, Indigenous-governed.',
};

async function getALMAStats() {
  const supabase = createServerComponentClient({ cookies });

  const [interventions, evidence, outcomes, contexts] = await Promise.all([
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }),
    supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
    supabase.from('alma_outcomes').select('*', { count: 'exact', head: true }),
    supabase.from('alma_community_contexts').select('*', { count: 'exact', head: true }),
  ]);

  // Get state coverage
  const { data: stateData } = await supabase
    .from('alma_interventions')
    .select('metadata')
    .not('metadata->>state', 'is', null);

  const states = new Set(
    stateData?.map((row: any) => row.metadata?.state).filter(Boolean)
  );

  return {
    interventions: interventions.count || 0,
    evidence: evidence.count || 0,
    outcomes: outcomes.count || 0,
    contexts: contexts.count || 0,
    states: states.size,
  };
}

export default async function IntelligencePage() {
  const stats = await getALMAStats();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="section-padding border-b-2 border-black">
        <div className="container-justice text-center">
          <h1 className="headline-truth mb-6">
            Youth Justice Intelligence.<br />
            Community-Owned.<br />
            Evidence-Based.
          </h1>

          <p className="body-truth mx-auto mb-12 max-w-3xl">
            {stats.interventions} programs documented. {stats.evidence} evidence records. {stats.outcomes} outcomes tracked.
            Across {stats.states} Australian states. This is ALMA—the intelligence system
            that ensures revenue flows to communities, not extractive researchers.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="border-2 border-black p-6">
              <div className="text-4xl font-bold text-black mb-2">{stats.interventions}</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">Interventions</div>
            </div>
            <div className="border-2 border-black p-6">
              <div className="text-4xl font-bold text-black mb-2">{stats.evidence}</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">Evidence</div>
            </div>
            <div className="border-2 border-black p-6">
              <div className="text-4xl font-bold text-black mb-2">{stats.outcomes}</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">Outcomes</div>
            </div>
            <div className="border-2 border-black p-6">
              <div className="text-4xl font-bold text-black mb-2">{stats.states}/8</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">States</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/intelligence/interventions" className="cta-primary">
              EXPLORE INTERVENTIONS <ArrowRight className="inline w-5 h-5 ml-2" />
            </Link>
            <Link href="/intelligence/portfolio" className="cta-secondary">
              VIEW PORTFOLIO ANALYTICS
            </Link>
          </div>
        </div>
      </section>

      {/* What is ALMA */}
      <section className="section-padding border-b-2 border-black bg-gray-50">
        <div className="container-justice">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">
            What is ALMA?
          </h2>

          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-800 mb-6">
              <strong>Adaptive Learning & Measurement Architecture.</strong> Not a product. A practiced method
              for valuing Indigenous and community knowledge while ensuring those knowledge holders control
              access and benefit from its use.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="border-l-4 border-black pl-6">
                <h3 className="text-xl font-bold mb-3">Traditional Research (Extractive)</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>→ Universities extract data</li>
                  <li>→ Communities get nothing</li>
                  <li>→ Knowledge locked behind paywalls</li>
                  <li>→ No ongoing revenue</li>
                </ul>
              </div>

              <div className="border-l-4 border-black pl-6">
                <h3 className="text-xl font-bold mb-3">ALMA (Regenerative)</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>→ Communities control their data</li>
                  <li>→ 30% revenue flows to knowledge holders</li>
                  <li>→ Open access intelligence</li>
                  <li>→ Ongoing value from citations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore the Data */}
      <section className="section-padding border-b-2 border-black bg-gray-50">
        <div className="container-justice">
          <h2 className="text-3xl font-bold text-black mb-4 text-center">
            Explore ALMA Intelligence
          </h2>
          <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
            Dive into the data. See the evidence. Access the sources.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Link
              href="/stories/intelligence"
              className="group border-2 border-black p-8 bg-white hover:bg-black hover:text-white transition-all"
            >
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-bold mb-3">Media Intelligence Studio</h3>
              <p className="text-gray-700 group-hover:text-white mb-4">
                Real-time sentiment tracking, topic analysis, and source validation across 37+ articles
              </p>
              <div className="font-bold uppercase text-sm">
                Explore Data →
              </div>
            </Link>

            <Link
              href="/intelligence/interventions"
              className="group border-2 border-black p-8 bg-white hover:bg-black hover:text-white transition-all"
            >
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-2xl font-bold mb-3">Intervention Database</h3>
              <p className="text-gray-700 group-hover:text-white mb-4">
                Browse {stats.interventions} documented programs with outcomes, costs, and community leadership data
              </p>
              <div className="font-bold uppercase text-sm">
                Browse Programs →
              </div>
            </Link>

            <Link
              href="/intelligence/portfolio"
              className="group border-2 border-black p-8 bg-white hover:bg-black hover:text-white transition-all"
            >
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-2xl font-bold mb-3">Portfolio Analytics</h3>
              <p className="text-gray-700 group-hover:text-white mb-4">
                Compare intervention effectiveness, cost analysis, and community control models
              </p>
              <div className="font-bold uppercase text-sm">
                View Analytics →
              </div>
            </Link>

            <Link
              href="/stories/the-pattern"
              className="group border-2 border-black p-8 bg-white hover:bg-black hover:text-white transition-all"
            >
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold mb-3">The Pattern Story</h3>
              <p className="text-gray-700 group-hover:text-white mb-4">
                Interactive scrollytelling journey through the data revealing what community control really means
              </p>
              <div className="font-bold uppercase text-sm">
                Experience Story →
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Intelligence */}
      <section className="section-padding bg-gray-50">
        <div className="container-justice">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">
            Recent Intelligence Updates
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="border-2 border-black p-6 bg-white">
              <div className="text-sm uppercase tracking-wider text-gray-600 mb-2">Policy Tension</div>
              <h3 className="text-xl font-bold mb-3">QLD: 39 Programs vs. Detention Focus</h3>
              <p className="text-gray-700">
                Queensland has Australia's most comprehensive youth justice program documentation (39 interventions),
                yet recent legislation emphasizes detention over diversion. This creates tension between
                evidence-based practice and political directives.
              </p>
            </div>

            <div className="border-2 border-black p-6 bg-white">
              <div className="text-sm uppercase tracking-wider text-gray-600 mb-2">Coverage Complete</div>
              <h3 className="text-xl font-bold mb-3">National Documentation: 7/8 States</h3>
              <p className="text-gray-700">
                ALMA now covers 7 of 8 Australian jurisdictions with comprehensive intervention data.
                Community Controlled sources represent 23% of documented programs, ensuring Indigenous
                voices lead the intelligence.
              </p>
            </div>

            <div className="border-2 border-black p-6 bg-white">
              <div className="text-sm uppercase tracking-wider text-gray-600 mb-2">Emerging Pattern</div>
              <h3 className="text-xl font-bold mb-3">Diversion Programs: High Community Authority</h3>
              <p className="text-gray-700">
                Programs focusing on diversion and community-led approaches consistently show higher
                Community Authority scores (weighted at 30% in portfolio analysis). These programs are
                ready for scaling and replication.
              </p>
            </div>

            <div className="border-2 border-black p-6 bg-white">
              <div className="text-sm uppercase tracking-wider text-gray-600 mb-2">Data Governance</div>
              <h3 className="text-xl font-bold mb-3">Indigenous Protocols Live</h3>
              <p className="text-gray-700">
                All Community Controlled content now requires cultural authority attribution.
                Revenue sharing mechanisms active. 10% grant citation fees flowing to communities
                whose knowledge informed successful applications.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
