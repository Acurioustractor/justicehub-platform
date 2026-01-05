import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, TrendingUp, Users } from 'lucide-react';
import type { Database } from '@/types/supabase';

type Intervention = Database['public']['Tables']['alma_interventions']['Row'];

export const metadata = {
  title: 'NT Youth Justice Showcase | ALMA - Aboriginal Intelligence First',
  description:
    'Northern Territory youth justice intelligence with Oochiumpa as the benchmark. Aboriginal-owned programs first, detention flagged.',
};

async function getNTInterventions() {
  // Use direct client with anon key for public access
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get all interventions and filter for NT in JavaScript
  // (PostgreSQL array contains can be tricky with Supabase)
  const { data, error } = await supabase
    .from('alma_interventions')
    .select('*')
    .order('evidence_level', { ascending: false });

  if (error) {
    console.error('Error fetching NT interventions:', error);
    return [];
  }

  // Filter for NT geography
  const ntInterventions = (data || []).filter((intervention) => {
    const geography = intervention.geography as string[] | null;
    return geography && geography.includes('NT');
  });

  return ntInterventions as Intervention[];
}

function getStarRating(intervention: Intervention): number {
  // Oochiumpa gets 5 stars (Aboriginal-owned, 95% success)
  if (intervention.name === 'Oochiumpa Youth Services') return 5;

  // Aboriginal-led programs get 4 stars
  if (intervention.evidence_level === 'Indigenous-led (culturally grounded, community authority)') {
    return 4;
  }

  // Promising gets 3 stars
  if (intervention.evidence_level === 'Promising (community-endorsed, emerging evidence)') {
    return 3;
  }

  // Detention gets 1 star (high harm risk)
  if (intervention.harm_risk_level === 'High') {
    return 1;
  }

  return 2;
}

function getCategoryBadge(intervention: Intervention) {
  if (intervention.cultural_authority?.includes('Aboriginal Community Controlled')) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
        <CheckCircle className="w-3 h-3 mr-1" />
        Aboriginal-Led
      </span>
    );
  }

  if (intervention.harm_risk_level === 'High') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
        <AlertTriangle className="w-3 h-3 mr-1" />
        High Harm Risk
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">
      Government-Led
    </span>
  );
}

export default async function NTShowcasePage() {
  const interventions = await getNTInterventions();

  // Separate into categories
  const oochiumpa = interventions.find((i) => i.name === 'Oochiumpa Youth Services');
  const aboriginalLed = interventions.filter(
    (i) =>
      i.evidence_level === 'Indigenous-led (culturally grounded, community authority)' &&
      i.name !== 'Oochiumpa Youth Services'
  );
  const governmentLowRisk = interventions.filter(
    (i) =>
      i.cultural_authority?.includes('Government') &&
      (i.harm_risk_level === 'Low' || i.harm_risk_level === 'Medium')
  );
  const detention = interventions.filter((i) => i.harm_risk_level === 'High');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="section-padding border-b-2 border-black bg-gradient-to-b from-white to-gray-50">
        <div className="container-justice text-center">
          <div className="inline-block px-4 py-2 bg-black text-white text-sm font-bold mb-4">
            NT YOUTH JUSTICE INTELLIGENCE
          </div>
          <h1 className="headline-truth mb-6">
            Oochiumpa Sets The Benchmark.<br />
            Aboriginal Intelligence First.
          </h1>
          <p className="body-truth mx-auto mb-8 max-w-3xl">
            In ALMA, <strong>Oochiumpa's 95% offending reduction</strong> is the standard for NT youth justice.
            Government programs are evaluated against this Aboriginal-owned success story.
            Detention is flagged <strong className="text-red-600">HIGH HARM RISK</strong>.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="border-2 border-green-500 bg-green-50 p-6">
              <div className="text-4xl font-bold text-green-700 mb-2">1</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">Benchmark</div>
              <div className="text-xs text-gray-600 mt-1">Oochiumpa</div>
            </div>
            <div className="border-2 border-blue-500 bg-blue-50 p-6">
              <div className="text-4xl font-bold text-blue-700 mb-2">{aboriginalLed.length}</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">Aboriginal-Led</div>
              <div className="text-xs text-gray-600 mt-1">NAAJA, AMSANT</div>
            </div>
            <div className="border-2 border-gray-400 bg-gray-50 p-6">
              <div className="text-4xl font-bold text-gray-700 mb-2">{governmentLowRisk.length}</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">Government</div>
              <div className="text-xs text-gray-600 mt-1">Diversion</div>
            </div>
            <div className="border-2 border-red-500 bg-red-50 p-6">
              <div className="text-4xl font-bold text-red-700 mb-2">{detention.length}</div>
              <div className="text-sm uppercase tracking-wider text-gray-700">Detention</div>
              <div className="text-xs text-gray-600 mt-1">Flagged</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Benchmark: Oochiumpa */}
      {oochiumpa && (
        <section className="section-padding border-b-2 border-black bg-white">
          <div className="container-justice">
            <div className="text-center mb-8">
              <div className="inline-block px-4 py-2 bg-green-500 text-white text-sm font-bold mb-4">
                THE BENCHMARK
              </div>
              <h2 className="text-3xl font-bold text-black mb-2">Oochiumpa Youth Services</h2>
              <div className="text-yellow-500 text-3xl mb-2">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-600">Aboriginal-Owned | Proven Outcomes | Community Controlled</p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="border-4 border-green-500 rounded-lg p-8 bg-green-50">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-700 mb-2">95%</div>
                    <div className="text-sm uppercase tracking-wider text-gray-700">Offending Reduction</div>
                    <div className="text-xs text-gray-600 mt-1">18 of 19 young people</div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-700 mb-2">72%</div>
                    <div className="text-sm uppercase tracking-wider text-gray-700">School Re-engagement</div>
                    <div className="text-xs text-gray-600 mt-1">From 95% disengaged</div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-700 mb-2">89%</div>
                    <div className="text-sm uppercase tracking-wider text-gray-700">Program Retention</div>
                    <div className="text-xs text-gray-600 mt-1">Cultural safety</div>
                  </div>
                </div>

                <div className="border-t-2 border-green-300 pt-6">
                  <h3 className="font-bold text-lg mb-3">What Makes Oochiumpa Work</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Aboriginal-owned</strong> - Community Controlled Organisation
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>On-country experiences</strong> - Cultural connection healing
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Elder involvement</strong> - Intergenerational knowledge
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Holistic support</strong> - Family, culture, education, health
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-white rounded border-2 border-green-400">
                  <div className="text-sm text-gray-700">
                    <strong>Funding Status:</strong> <span className="text-red-600 font-semibold">At-risk</span> (underfunded despite proven outcomes)
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    💡 Oochiumpa achieves 95% success while detention costs $XXX,000/year with 40% recidivism
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Link href={`/intelligence/interventions/${oochiumpa.id}`} className="cta-primary flex-1 text-center">
                    VIEW FULL DETAILS
                  </Link>
                  <Link href="/docs/NT_BASELINE_COMPARISON_REPORT" className="cta-secondary flex-1 text-center">
                    READ COMPARISON REPORT
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Aboriginal-Led Programs */}
      {aboriginalLed.length > 0 && (
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="text-center mb-8">
              <div className="inline-block px-4 py-2 bg-blue-500 text-white text-sm font-bold mb-4">
                ABORIGINAL-LED PROGRAMS
              </div>
              <h2 className="text-3xl font-bold text-black mb-2">Similar to Oochiumpa</h2>
              <p className="text-gray-600">Aboriginal Community Controlled | Healing-Focused</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {aboriginalLed.map((intervention) => (
                <div key={intervention.id} className="border-2 border-blue-400 rounded-lg p-6 bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-xl mb-1">{intervention.name}</h3>
                      <div className="text-yellow-500 text-lg">{'⭐'.repeat(getStarRating(intervention))}</div>
                    </div>
                    {getCategoryBadge(intervention)}
                  </div>

                  <p className="text-gray-700 text-sm mb-4">{intervention.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <Users className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Authority:</strong> {intervention.cultural_authority}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <TrendingUp className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Type:</strong> {intervention.type}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-gray-700">
                    <strong>Pattern Match:</strong> {(intervention.metadata as any)?.similarity_to_oochiumpa || 'Aboriginal-led, healing-focused'}
                  </div>

                  <Link
                    href={`/intelligence/interventions/${intervention.id}`}
                    className="mt-4 block text-center py-2 px-4 border-2 border-blue-500 text-blue-700 font-bold hover:bg-blue-500 hover:text-white transition-all"
                  >
                    VIEW DETAILS
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center max-w-3xl mx-auto">
              <div className="p-4 bg-blue-100 border-2 border-blue-400 rounded">
                <p className="text-sm text-gray-800">
                  <strong>Requires Partnership:</strong> Outcome data for these Aboriginal-led programs not publicly available.
                  Week 2 goal is to establish partnerships with NAAJA and AMSANT to document similar success rates.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Government Programs */}
      {governmentLowRisk.length > 0 && (
        <section className="section-padding border-b-2 border-black bg-white">
          <div className="container-justice">
            <div className="text-center mb-8">
              <div className="inline-block px-4 py-2 bg-gray-500 text-white text-sm font-bold mb-4">
                GOVERNMENT PROGRAMS
              </div>
              <h2 className="text-3xl font-bold text-black mb-2">Diversion & Support</h2>
              <p className="text-gray-600">Compared to Oochiumpa Benchmark</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {governmentLowRisk.map((intervention) => (
                <div key={intervention.id} className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="mb-3">
                    <h3 className="font-bold text-lg mb-1">{intervention.name}</h3>
                    <div className="text-yellow-500">{'⭐'.repeat(getStarRating(intervention))}</div>
                  </div>

                  {getCategoryBadge(intervention)}

                  <div className="mt-3 text-xs space-y-1 text-gray-600">
                    <div><strong>Type:</strong> {intervention.type}</div>
                    <div><strong>Risk:</strong> {intervention.harm_risk_level}</div>
                  </div>

                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <strong>⚠️ Data Gap:</strong> No published 95% success rates equivalent to Oochiumpa
                  </div>

                  <Link
                    href={`/intelligence/interventions/${intervention.id}`}
                    className="mt-3 block text-center py-2 px-3 border border-gray-400 text-gray-700 text-sm hover:bg-gray-200 transition-all"
                  >
                    Details
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Detention - Flagged */}
      {detention.length > 0 && (
        <section className="section-padding border-b-2 border-black bg-red-50">
          <div className="container-justice">
            <div className="text-center mb-8">
              <div className="inline-block px-4 py-2 bg-red-600 text-white text-sm font-bold mb-4">
                ⚠️ HIGH HARM RISK
              </div>
              <h2 className="text-3xl font-bold text-black mb-2">Detention Facilities</h2>
              <p className="text-gray-700">40% Recidivism | Royal Commission Documented Failures</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {detention.map((intervention) => (
                <div key={intervention.id} className="border-4 border-red-500 rounded-lg p-6 bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-xl mb-1">{intervention.name}</h3>
                      <div className="text-yellow-500 text-lg">⭐</div>
                    </div>
                    {getCategoryBadge(intervention)}
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start text-red-700">
                      <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Known Issues:</strong> {(intervention.metadata as any)?.known_issues}
                      </div>
                    </div>
                    <div className="flex items-start text-red-700">
                      <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Overrepresentation:</strong> {(intervention.metadata as any)?.aboriginal_overrepresentation}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-red-100 border-2 border-red-400 rounded">
                    <div className="text-sm font-bold mb-2">Comparison to Oochiumpa:</div>
                    <div className="text-sm text-gray-800">
                      {(intervention.metadata as any)?.comparison_to_oochiumpa}
                    </div>
                  </div>

                  <Link
                    href={`/intelligence/interventions/${intervention.id}`}
                    className="mt-4 block text-center py-2 px-4 border-2 border-red-500 text-red-700 font-bold hover:bg-red-500 hover:text-white transition-all"
                  >
                    VIEW DETAILS
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center max-w-4xl mx-auto">
              <div className="p-6 bg-white border-4 border-red-500 rounded-lg">
                <h3 className="font-bold text-xl mb-3">The Alternative Exists</h3>
                <p className="text-gray-800 mb-4">
                  <strong>Oochiumpa proves community-owned healing works better than detention.</strong><br />
                  95% offending reduction vs 40% recidivism. Cultural safety vs documented abuse.
                  Aboriginal-owned vs government facility.
                </p>
                <p className="text-sm text-gray-700">
                  Yet detention receives $XXX million in government funding, while Oochiumpa is at-risk.
                  This is the systemic failure ALMA exposes.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* The Data Speaks */}
      <section className="section-padding bg-gray-900 text-white">
        <div className="container-justice text-center">
          <h2 className="text-3xl font-bold mb-6">What The Data Shows</h2>
          <p className="max-w-3xl mx-auto mb-8 text-gray-300">
            NT has documented 10 youth justice interventions. The outcomes are clear:
            Aboriginal-owned programs achieve exceptional results, while detention causes harm.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="border-2 border-green-400 bg-green-900 p-6">
              <div className="text-4xl mb-3">95%</div>
              <h3 className="font-bold text-lg mb-2">Oochiumpa Success Rate</h3>
              <p className="text-sm text-gray-300">
                Young people removed from offending list through Aboriginal-owned healing
              </p>
            </div>

            <div className="border-2 border-red-400 bg-red-900 p-6">
              <div className="text-4xl mb-3">40%</div>
              <h3 className="font-bold text-lg mb-2">Detention Re-offending</h3>
              <p className="text-sm text-gray-300">
                Government facilities show higher recidivism despite more funding
              </p>
            </div>

            <div className="border-2 border-blue-400 bg-blue-900 p-6">
              <div className="text-4xl mb-3">4</div>
              <h3 className="font-bold text-lg mb-2">Aboriginal-Led Programs</h3>
              <p className="text-sm text-gray-300">
                Community Controlled organisations with proven or emerging evidence
              </p>
            </div>
          </div>

          <div className="mt-12 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">The Question Funders Must Answer</h3>
            <p className="text-lg text-gray-300 mb-6">
              Why does detention receive millions in government funding while Oochiumpa—
              with 95% success—is at-risk?
            </p>
            <p className="text-sm text-gray-400">
              ALMA makes this disparity impossible to ignore. Aboriginal intelligence is centered.
              Detention is flagged. The data demands different decisions.
            </p>
          </div>

          <div className="mt-8 flex gap-4 justify-center">
            <Link href="/intelligence/interventions" className="cta-primary">
              EXPLORE ALL INTERVENTIONS
            </Link>
            <Link href="/intelligence/portfolio" className="cta-secondary bg-white text-black hover:bg-gray-200">
              VIEW PORTFOLIO ANALYTICS
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
