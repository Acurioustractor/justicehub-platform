import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Users, MapPin, FileText, Scale, Globe } from 'lucide-react';

async function getReportStats() {
  const supabase = await createClient();

  const [interventions, evidence, inquiries, international] = await Promise.all([
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }),
    supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
    supabase.from('historical_inquiries').select('*', { count: 'exact', head: true }),
    supabase.from('international_programs').select('*', { count: 'exact', head: true }),
  ]);

  // Get state distribution
  const { data: stateData } = await supabase
    .from('alma_interventions')
    .select('metadata')
    .limit(1500);

  const stateCounts: Record<string, number> = {};
  stateData?.forEach((row: any) => {
    const state = row.metadata?.state || 'Unknown';
    if (state !== 'Unknown') {
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    }
  });

  // Get intervention type distribution
  const { data: typeData } = await supabase
    .from('alma_interventions')
    .select('type')
    .limit(1500);

  const typeCounts: Record<string, number> = {};
  typeData?.forEach((row: any) => {
    if (row.type) {
      typeCounts[row.type] = (typeCounts[row.type] || 0) + 1;
    }
  });

  return {
    interventions: interventions.count || 0,
    evidence: evidence.count || 0,
    inquiries: inquiries.count || 0,
    international: international.count || 0,
    stateCount: Object.keys(stateCounts).length,
    stateCounts,
    typeCounts,
    lastUpdated: new Date().toISOString(),
  };
}

export default async function YouthJusticeReportPage() {
  const stats = await getReportStats();

  const topStates = Object.entries(stats.stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topTypes = Object.entries(stats.typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 py-16 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <div className="inline-block bg-black text-white text-xs font-bold uppercase tracking-wider px-3 py-1 mb-6">
            Live Report
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-6">
            Youth Justice in Australia
          </h1>

          <p className="text-xl text-earth-700 max-w-3xl mb-8">
            A comprehensive, live database of youth justice interventions, research evidence,
            historical inquiries, and international best practices. Updated continuously.
          </p>

          <div className="text-sm text-earth-600">
            Last updated: {new Date(stats.lastUpdated).toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </section>

      {/* Key Stats */}
      <section className="py-12 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="border-2 border-black p-6 text-center">
              <div className="text-4xl md:text-5xl font-black text-ochre-600 mb-2">
                {stats.interventions.toLocaleString()}
              </div>
              <div className="text-sm uppercase tracking-wider text-earth-600 font-medium">
                Interventions
              </div>
            </div>

            <div className="border-2 border-black p-6 text-center">
              <div className="text-4xl md:text-5xl font-black text-eucalyptus-600 mb-2">
                {stats.evidence}
              </div>
              <div className="text-sm uppercase tracking-wider text-earth-600 font-medium">
                Evidence Records
              </div>
            </div>

            <div className="border-2 border-black p-6 text-center">
              <div className="text-4xl md:text-5xl font-black text-ochre-600 mb-2">
                {stats.stateCount}/8
              </div>
              <div className="text-sm uppercase tracking-wider text-earth-600 font-medium">
                States Covered
              </div>
            </div>

            <div className="border-2 border-black p-6 text-center">
              <div className="text-4xl md:text-5xl font-black text-eucalyptus-600 mb-2">
                {stats.inquiries}
              </div>
              <div className="text-sm uppercase tracking-wider text-earth-600 font-medium">
                Historical Inquiries
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Report Sections Grid */}
      <section className="py-12 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <h2 className="text-3xl font-bold mb-8">Explore the Report</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/youth-justice-report/interventions"
              className="group border-2 border-black p-6 hover:bg-ochre-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-ochre-100 border border-black">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-ochre-600 transition-colors">
                    Interventions by State
                  </h3>
                  <p className="text-earth-600 mb-4">
                    {stats.interventions.toLocaleString()} programs across {stats.stateCount} jurisdictions.
                    Filter by type, evidence level, and community authority.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {topStates.map(([state, count]) => (
                      <span key={state} className="text-xs bg-sand-100 border border-black px-2 py-1">
                        {state}: {count}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/youth-justice-report/research"
              className="group border-2 border-black p-6 hover:bg-eucalyptus-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-eucalyptus-100 border border-black">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-eucalyptus-600 transition-colors">
                    Australian Research
                  </h3>
                  <p className="text-earth-600 mb-4">
                    {stats.evidence} peer-reviewed studies, evaluations, and research papers on
                    youth justice interventions in Australia.
                  </p>
                  <span className="text-xs bg-eucalyptus-100 border border-black px-2 py-1">
                    Connected to ALMA Knowledge Base
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/youth-justice-report/inquiries"
              className="group border-2 border-black p-6 hover:bg-sand-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-sand-100 border border-black">
                  <Scale className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-ochre-600 transition-colors">
                    Historical Inquiries
                  </h3>
                  <p className="text-earth-600 mb-4">
                    Royal commissions, parliamentary inquiries, and reviews into youth justice
                    across Australian jurisdictions.
                  </p>
                  <span className="text-xs bg-sand-100 border border-black px-2 py-1">
                    Tracking implementation status
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/youth-justice-report/international"
              className="group border-2 border-black p-6 hover:bg-ochre-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-ochre-100 border border-black">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-ochre-600 transition-colors">
                    International Best Practices
                  </h3>
                  <p className="text-earth-600 mb-4">
                    Effective youth justice approaches from New Zealand, Scandinavia, Canada,
                    and other jurisdictions.
                  </p>
                  <span className="text-xs bg-ochre-100 border border-black px-2 py-1">
                    Replication guidance included
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Intervention Types */}
      <section className="py-12 border-b-2 border-black bg-sand-50">
        <div className="container-justice max-w-5xl">
          <h2 className="text-3xl font-bold mb-8">Intervention Types</h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {topTypes.map(([type, count]) => (
              <div key={type} className="border-2 border-black p-4 bg-white">
                <div className="text-2xl font-bold text-ochre-600 mb-1">{count}</div>
                <div className="text-sm text-earth-600">{type}</div>
              </div>
            ))}
          </div>

          <Link
            href="/intelligence/interventions"
            className="inline-flex items-center gap-2 mt-8 font-bold text-ochre-600 hover:text-ochre-800"
          >
            Browse all interventions
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Key Findings */}
      <section className="py-12">
        <div className="container-justice max-w-5xl">
          <h2 className="text-3xl font-bold mb-8">Key Findings</h2>

          <div className="space-y-6">
            <div className="border-l-4 border-ochre-500 pl-6 py-2">
              <h3 className="text-xl font-bold mb-2">Community-led programs show better outcomes</h3>
              <p className="text-earth-600">
                Programs with high community authority scores consistently demonstrate better engagement,
                lower recidivism, and stronger cultural connection outcomes.
              </p>
            </div>

            <div className="border-l-4 border-eucalyptus-500 pl-6 py-2">
              <h3 className="text-xl font-bold mb-2">Diversion works better than detention</h3>
              <p className="text-earth-600">
                Evidence consistently shows diversion programs are more effective at reducing reoffending
                than detention, particularly for first-time and minor offenders.
              </p>
            </div>

            <div className="border-l-4 border-ochre-500 pl-6 py-2">
              <h3 className="text-xl font-bold mb-2">Indigenous-led approaches are essential</h3>
              <p className="text-earth-600">
                First Nations young people are drastically overrepresented. Indigenous-led, culturally
                grounded programs are critical to addressing this systemic issue.
              </p>
            </div>

            <div className="border-l-4 border-eucalyptus-500 pl-6 py-2">
              <h3 className="text-xl font-bold mb-2">Early intervention prevents escalation</h3>
              <p className="text-earth-600">
                Programs that engage young people early, before formal justice contact, show the strongest
                long-term outcomes and best cost-effectiveness.
              </p>
            </div>
          </div>

          <Link
            href="/youth-justice-report/recommendations"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
          >
            View Recommendations
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
