import Link from 'next/link';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Intelligence Hub | ALMA - Australian Youth Justice Intelligence',
  description:
    'Australia\'s most comprehensive youth justice intelligence system. Evidence-based, community-owned, Indigenous-governed.',
};

async function getALMAStats() {
  const supabase = createServerComponentClient({ cookies });

  const [interventions, evidence, contexts, verified, underReview] = await Promise.all([
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).neq('verification_status', 'ai_generated'),
    supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
    supabase.from('alma_community_contexts').select('*', { count: 'exact', head: true }),
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).eq('verification_status', 'needs_review'),
  ]);

  // Get state coverage
  const { data: stateData } = await supabase
    .from('alma_interventions')
    .select('metadata')
    .neq('verification_status', 'ai_generated')
    .not('metadata->>state', 'is', null);

  const states = new Set(
    stateData?.map((row: any) => row.metadata?.state).filter(Boolean)
  );

  return {
    interventions: interventions.count || 0,
    evidence: evidence.count || 0,
    contexts: contexts.count || 0,
    states: states.size,
    verified: verified.count || 0,
    underReview: underReview.count || 0,
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
            {stats.interventions} programs catalogued. {stats.evidence} evidence records.
            Across {stats.states} Australian states. This is ALMA—the intelligence system
            that ensures revenue flows to communities, not extractive researchers.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="border-2 border-black p-6">
              <div className="text-4xl font-bold text-black mb-2">{stats.interventions}</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">Programs</div>
            </div>
            <div className="border-2 border-black p-6">
              <div className="text-4xl font-bold text-black mb-2">{stats.evidence}</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">Evidence</div>
            </div>
            <div className="border-2 border-black p-6">
              <div className="text-4xl font-bold text-black mb-2">{stats.verified}</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">Verified</div>
            </div>
            <div className="border-2 border-black p-6">
              <div className="text-4xl font-bold text-black mb-2">{stats.states}/8</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">States</div>
            </div>
          </div>

          {stats.underReview > 0 && (
            <p className="text-sm text-gray-600 mb-8">
              {stats.underReview} programs currently under review for verification.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/intelligence/interventions" className="cta-primary">
              EXPLORE INTERVENTIONS <ArrowRight className="inline w-5 h-5 ml-2" />
            </Link>
            <Link href="/transparency" className="cta-secondary">
              VIEW DATA QUALITY
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
              <strong>Alternative Local Models Australia.</strong> Not a product. A practiced method
              for valuing Indigenous and community knowledge while ensuring those knowledge holders control
              access and benefit from its use.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="border-l-4 border-black pl-6">
                <h3 className="text-xl font-bold mb-3">Traditional Research (Extractive)</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>Universities extract data</li>
                  <li>Communities get nothing</li>
                  <li>Knowledge locked behind paywalls</li>
                  <li>No ongoing revenue</li>
                </ul>
              </div>

              <div className="border-l-4 border-black pl-6">
                <h3 className="text-xl font-bold mb-3">ALMA (Regenerative)</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>Communities control their data</li>
                  <li>30% revenue flows to knowledge holders</li>
                  <li>Open access intelligence</li>
                  <li>Ongoing value from citations</li>
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
              <h3 className="text-2xl font-bold mb-3">Media Intelligence Studio</h3>
              <p className="text-gray-700 group-hover:text-white mb-4">
                Real-time sentiment tracking, topic analysis, and source validation across 37+ articles
              </p>
              <div className="font-bold uppercase text-sm">
                Explore Data
              </div>
            </Link>

            <Link
              href="/intelligence/interventions"
              className="group border-2 border-black p-8 bg-white hover:bg-black hover:text-white transition-all"
            >
              <h3 className="text-2xl font-bold mb-3">Program Catalogue</h3>
              <p className="text-gray-700 group-hover:text-white mb-4">
                Browse {stats.interventions} catalogued programs with evidence links and community leadership data
              </p>
              <div className="font-bold uppercase text-sm">
                Browse Programs
              </div>
            </Link>

            <Link
              href="/transparency"
              className="group border-2 border-black p-8 bg-white hover:bg-black hover:text-white transition-all"
            >
              <h3 className="text-2xl font-bold mb-3">Data Quality</h3>
              <p className="text-gray-700 group-hover:text-white mb-4">
                Our commitment to honest data — see what is verified, under review, and how we ensure integrity
              </p>
              <div className="font-bold uppercase text-sm">
                View Transparency
              </div>
            </Link>

            <Link
              href="/stories/the-pattern"
              className="group border-2 border-black p-8 bg-white hover:bg-black hover:text-white transition-all"
            >
              <h3 className="text-2xl font-bold mb-3">The Pattern Story</h3>
              <p className="text-gray-700 group-hover:text-white mb-4">
                Interactive scrollytelling journey through the data revealing what community control really means
              </p>
              <div className="font-bold uppercase text-sm">
                Experience Story
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
              <div className="text-sm uppercase tracking-wider text-amber-600 mb-2">Data Integrity</div>
              <h3 className="text-xl font-bold mb-3">Audit Complete: Fabricated Data Removed</h3>
              <p className="text-gray-700">
                We completed an audit of ALMA data and removed AI-generated scores, placeholder outcomes,
                and template-generated entries. All remaining data is sourced from real documents
                and websites. Verification workflow is being built.
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
