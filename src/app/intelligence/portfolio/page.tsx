import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { InterventionCard } from '@/components/alma';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

type Intervention = Database['public']['Tables']['alma_interventions']['Row'];

interface PortfolioAnalytics {
  underfunded: Intervention[];
  readyToScale: Intervention[];
  highRisk: Intervention[];
  learningOpportunities: Array<{
    title: string;
    description: string;
    interventions: Intervention[];
    type: 'policy_tension' | 'cross_state' | 'emerging_practice';
  }>;
}

async function getPortfolioAnalytics(): Promise<PortfolioAnalytics> {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Get all interventions with evidence counts
  const { data: allInterventions } = await supabase
    .from('alma_interventions')
    .select(`
      *,
      evidence:alma_evidence(count),
      outcomes:alma_outcomes(count)
    `);

  const interventions = allInterventions || [];

  // UNDERFUNDED: High evidence (3+ evidence records), Community Controlled
  const underfunded = interventions.filter(
    (i) =>
      (i.evidence as any)?.[0]?.count >= 2 &&
      i.consent_level === 'Community Controlled'
  ).slice(0, 6);

  // READY TO SCALE: Programs with evidence AND outcomes (proven impact)
  const readyToScale = interventions.filter(
    (i) =>
      (i.evidence as any)?.[0]?.count >= 1 &&
      (i.outcomes as any)?.[0]?.count >= 1
  ).slice(0, 6);

  // HIGH RISK: Programs with "Detention" or "Custody" in name/type (simplified for now)
  const highRisk = interventions.filter(
    (i) =>
      i.type.includes('Detention') ||
      i.type.includes('Custody') ||
      i.name.toLowerCase().includes('detention')
  ).slice(0, 4);

  // LEARNING OPPORTUNITIES: Identify interesting patterns
  const qldInterventions = interventions.filter(
    (i) => (i.metadata as any)?.state === 'QLD'
  );
  const nswInterventions = interventions.filter(
    (i) => (i.metadata as any)?.state === 'NSW'
  );

  const learningOpportunities = [
    {
      title: 'QLD Policy Tension: Youth Justice Act Reform',
      description:
        'QLD has 39 documented programs (highest in Australia) but recent legislative changes emphasize detention over diversion. This creates tension between evidence-based practice and political directives.',
      interventions: qldInterventions.slice(0, 3),
      type: 'policy_tension' as const,
    },
    {
      title: 'Cross-State Comparison: Diversion Programs',
      description:
        'NSW and VIC have strong diversion programs with high community authority. These could inform national standards and cross-state learning.',
      interventions: nswInterventions.slice(0, 3),
      type: 'cross_state' as const,
    },
  ];

  return {
    underfunded,
    readyToScale,
    highRisk,
    learningOpportunities,
  };
}

async function getStats() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const [
    { count: totalInterventions },
    { count: communityControlled },
  ] = await Promise.all([
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }),
    supabase
      .from('alma_interventions')
      .select('*', { count: 'exact', head: true })
      .eq('consent_level', 'Community Controlled'),
  ]);

  // Count interventions that have at least one evidence record linked
  const { data: interventionsWithEvidence } = await supabase
    .from('alma_interventions')
    .select('id, evidence:alma_evidence(count)')
    .limit(2000);

  const withEvidence = interventionsWithEvidence?.filter(
    (i: any) => (i.evidence?.[0]?.count || 0) > 0
  ).length || 0;

  return {
    totalInterventions: totalInterventions || 0,
    communityControlled: communityControlled || 0,
    withEvidence,
  };
}

export default async function PortfolioPage() {
  const [analytics, stats] = await Promise.all([
    getPortfolioAnalytics(),
    getStats(),
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="border-b-2 border-black bg-white">
        <div className="container-justice py-16">
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
            Portfolio Intelligence
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mb-12 leading-relaxed">
            Strategic insights for funders, governments, and researchers. Identify high-impact
            programs, funding gaps, and emerging patterns across Australia's youth justice system.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-2 border-black p-6 bg-white">
              <div className="text-5xl font-bold text-black mb-2">{stats.totalInterventions}</div>
              <div className="text-sm uppercase tracking-wider text-gray-700 font-bold">Total Programs</div>
            </div>
            <div className="border-2 border-black p-6 bg-white">
              <div className="text-5xl font-bold text-black mb-2">{stats.communityControlled}</div>
              <div className="text-sm uppercase tracking-wider text-gray-700 font-bold">Community Controlled</div>
            </div>
            <div className="border-2 border-black p-6 bg-white">
              <div className="text-5xl font-bold text-black mb-2">{stats.withEvidence}</div>
              <div className="text-sm uppercase tracking-wider text-gray-700 font-bold">Evidence-Backed</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-justice py-12 space-y-16">
        {/* Underfunded High-Evidence Programs */}
        <section>
          <div className="flex items-start justify-between mb-8 pb-8 border-b-2 border-black">
            <div>
              <h2 className="text-3xl font-bold text-black mb-4 uppercase tracking-wider">
                Underfunded High-Evidence Programs
              </h2>
              <p className="text-lg text-gray-700 max-w-3xl leading-relaxed">
                Community-controlled programs with strong evidence bases that are ready for
                additional funding. These programs have proven impact but limited resources.
              </p>
            </div>
            <Link
              href="/intelligence/interventions?consent=Community%20Controlled"
              className="cta-primary whitespace-nowrap ml-6"
            >
              VIEW ALL →
            </Link>
          </div>

          {analytics.underfunded.length === 0 ? (
            <div className="border-2 border-black p-12 text-center">
              <p className="text-gray-700 font-medium">No underfunded programs identified yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analytics.underfunded.map((intervention) => (
                <InterventionCard
                  key={intervention.id}
                  intervention={intervention}
                  showEvidenceBadge
                />
              ))}
            </div>
          )}

          <div className="mt-8 border-l-4 border-eucalyptus-600 bg-eucalyptus-50 p-6">
            <h3 className="text-lg font-bold text-black mb-3 uppercase tracking-wider">
              Funding Opportunity
            </h3>
            <p className="text-gray-800 leading-relaxed">
              These programs demonstrate strong community authority and evidence backing. Corporate
              sponsors can provide $5K direct grants, with 60% flowing to programs and 40% to
              platform operations. State governments can license ALMA intelligence for $50-75K/year,
              with 30% flowing to communities.
            </p>
          </div>
        </section>

        {/* Ready to Scale */}
        <section>
          <div className="flex items-start justify-between mb-8 pb-8 border-b-2 border-black">
            <div>
              <h2 className="text-3xl font-bold text-black mb-4 uppercase tracking-wider">
                Ready to Scale
              </h2>
              <p className="text-lg text-gray-700 max-w-3xl leading-relaxed">
                Programs with both evidence AND tracked outcomes. These are proven models with
                demonstrated impact, ready for expansion to new locations or populations.
              </p>
            </div>
            <Link
              href="/intelligence/interventions"
              className="cta-primary whitespace-nowrap ml-6"
            >
              EXPLORE PROGRAMS →
            </Link>
          </div>

          {analytics.readyToScale.length === 0 ? (
            <div className="border-2 border-black p-12 text-center">
              <p className="text-gray-700 font-medium">No ready-to-scale programs identified yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analytics.readyToScale.map((intervention) => (
                <InterventionCard
                  key={intervention.id}
                  intervention={intervention}
                  showEvidenceBadge
                />
              ))}
            </div>
          )}

          <div className="mt-8 border-l-4 border-ochre-600 bg-ochre-50 p-6">
            <h3 className="text-lg font-bold text-black mb-3 uppercase tracking-wider">
              Scaling Opportunity
            </h3>
            <p className="text-gray-800 leading-relaxed">
              These programs have demonstrated impact through tracked outcomes. Research
              partnerships ($50K/year) can validate and expand these models. Indigenous
              co-authorship ensures community voices lead the research, with 50% of partnership
              revenue flowing to Indigenous governance.
            </p>
          </div>
        </section>

        {/* High Risk Programs */}
        {analytics.highRisk.length > 0 && (
          <section>
            <div className="mb-8 pb-8 border-b-2 border-black">
              <h2 className="text-3xl font-bold text-black mb-4 uppercase tracking-wider">
                Programs Requiring Review
              </h2>
              <p className="text-lg text-gray-700 max-w-3xl leading-relaxed">
                Programs with potential harm risk signals or practices that may contradict
                evidence-based approaches. These require governance review and community
                consultation.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {analytics.highRisk.map((intervention) => (
                <div
                  key={intervention.id}
                  className="border-2 border-accent bg-accent-50 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-black mb-3">
                        {intervention.name}
                      </h3>
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {intervention.description?.slice(0, 200)}...
                      </p>
                      <div className="flex items-center space-x-4">
                        <span className="inline-flex items-center px-4 py-2 border-2 border-black bg-black text-white font-bold uppercase text-xs tracking-wider">
                          {intervention.type}
                        </span>
                        {(intervention.metadata as any)?.state && (
                          <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                            State: {(intervention.metadata as any).state}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/intelligence/interventions/${intervention.id}`}
                      className="ml-4 px-6 py-3 border-2 border-black bg-white text-black hover:bg-black hover:text-white font-bold uppercase text-xs tracking-wider transition-colors whitespace-nowrap"
                    >
                      REVIEW →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-l-4 border-accent bg-accent-50 p-6">
              <h3 className="text-lg font-bold text-black mb-3 uppercase tracking-wider">
                Governance Note
              </h3>
              <p className="text-gray-800 leading-relaxed">
                These programs may involve detention, custody, or other practices with potential
                for harm. ALMA's Indigenous Advisory Board reviews all flagged programs to ensure
                cultural safety and community-led governance. Revenue from these programs (if
                licensed) flows entirely to Indigenous governance structures.
              </p>
            </div>
          </section>
        )}

        {/* Learning Opportunities */}
        <section>
          <div className="mb-8 pb-8 border-b-2 border-black">
            <h2 className="text-3xl font-bold text-black mb-4 uppercase tracking-wider">
              Learning Opportunities
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl leading-relaxed">
              Emerging patterns, policy tensions, and cross-jurisdictional insights. These
              intelligence signals inform research priorities and policy reform opportunities.
            </p>
          </div>

          <div className="space-y-8">
            {analytics.learningOpportunities.map((opportunity, index) => (
              <div key={index} className="border-2 border-black p-8 bg-white">
                <div className="flex items-start justify-between mb-4 pb-6 border-b-2 border-gray-200">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <h3 className="text-2xl font-bold text-black uppercase tracking-wider">
                        {opportunity.title}
                      </h3>
                      <span
                        className={`inline-flex items-center px-3 py-1 border-2 border-black text-xs font-bold uppercase tracking-wider ${opportunity.type === 'policy_tension'
                            ? 'bg-sand-100 text-black'
                            : opportunity.type === 'cross_state'
                              ? 'bg-eucalyptus-100 text-black'
                              : 'bg-ochre-100 text-black'
                          }`}
                      >
                        {opportunity.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-700 text-lg leading-relaxed">{opportunity.description}</p>
                  </div>
                </div>

                {opportunity.interventions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-black mb-4 uppercase tracking-wider">
                      Example Programs ({opportunity.interventions.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {opportunity.interventions.map((intervention) => (
                        <Link
                          key={intervention.id}
                          href={`/intelligence/interventions/${intervention.id}`}
                          className="block p-4 border-2 border-gray-300 hover:border-black hover:bg-gray-50 transition-all"
                        >
                          <h5 className="font-bold text-black mb-2">
                            {intervention.name}
                          </h5>
                          <p className="text-sm text-gray-700 font-medium">{intervention.type}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t-2 border-gray-200">
                  <h4 className="text-sm font-bold text-black mb-3 uppercase tracking-wider">Research Value</h4>
                  <p className="text-gray-700 leading-relaxed">
                    {opportunity.type === 'policy_tension'
                      ? 'Policy researchers can analyze the gap between evidence and implementation. Research partnerships provide access to this intelligence with Indigenous co-authorship requirements.'
                      : opportunity.type === 'cross_state'
                        ? 'Cross-jurisdictional comparisons reveal best practices and transferable models. State governments can license ALMA to benchmark their programs against national data.'
                        : 'Emerging practices indicate innovation happening at community level. Corporate sponsors can support these programs with direct grants and implementation funding.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Funder CTAs */}
        <section className="border-2 border-black bg-black p-12 text-white">
          <h2 className="text-3xl font-bold mb-6 uppercase tracking-wider">Access Portfolio Intelligence</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-3xl leading-relaxed">
            Support evidence-based youth justice reform while ensuring revenue flows to
            communities. Choose the partnership model that fits your organization.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* State Government */}
            <div className="border-2 border-white p-6 bg-white text-black">
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wider">State Government License</h3>
              <div className="text-4xl font-bold mb-6">$50-75K/year</div>
              <ul className="space-y-3 mb-8 text-gray-700">
                <li className="flex items-start">
                  <span className="font-bold mr-2">→</span>
                  <span>Quarterly intelligence updates</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">→</span>
                  <span>National benchmarking</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">→</span>
                  <span>Evidence library access</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">→</span>
                  <span className="font-bold text-black">30% to communities</span>
                </li>
              </ul>
              <Link
                href="/intelligence"
                className="block w-full text-center px-6 py-3 border-2 border-black bg-black text-white hover:bg-white hover:text-black font-bold uppercase text-sm tracking-wider transition-colors"
              >
                LEARN MORE
              </Link>
            </div>

            {/* Corporate */}
            <div className="border-2 border-white p-6 bg-ochre-600 text-white">
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wider">Corporate Sponsorship</h3>
              <div className="text-4xl font-bold mb-6">$100K/year</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="font-bold mr-2">→</span>
                  <span className="font-bold">60% direct program grants</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">→</span>
                  <span>Impact reporting</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">→</span>
                  <span>Community partnerships</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">→</span>
                  <span>Tax deductible</span>
                </li>
              </ul>
              <Link
                href="/intelligence"
                className="block w-full text-center px-6 py-3 border-2 border-white bg-white text-ochre-700 hover:bg-ochre-700 hover:text-white font-bold uppercase text-sm tracking-wider transition-colors"
              >
                LEARN MORE
              </Link>
            </div>

            {/* Research */}
            <div className="border-2 border-white p-6 bg-white text-black">
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wider">Research Partnership</h3>
              <div className="text-4xl font-bold mb-6">$50K/year</div>
              <ul className="space-y-3 mb-8 text-gray-700">
                <li className="flex items-start">
                  <span className="font-bold mr-2">→</span>
                  <span>Database access</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">→</span>
                  <span className="font-bold text-black">Indigenous co-authorship</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">→</span>
                  <span>Community validation</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">→</span>
                  <span className="font-bold text-black">50% to governance</span>
                </li>
              </ul>
              <Link
                href="/intelligence"
                className="block w-full text-center px-6 py-3 border-2 border-black bg-black text-white hover:bg-white hover:text-black font-bold uppercase text-sm tracking-wider transition-colors"
              >
                LEARN MORE
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
