import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { ArrowRight, TrendingUp, MapPin, Users, Heart, BarChart3, Target, Zap, CheckCircle2, Leaf } from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Impact Dashboard | JusticeHub Stewards',
  description:
    'Real-time impact metrics from Australia\'s youth justice intelligence network. See the evidence. Track the outcomes.',
};

async function getComprehensiveStats() {
  const supabase = createServiceClient();

  // Parallel queries for all stats
  const [
    { count: totalInterventions },
    { count: withOutcomes },
    { count: aboriginalPrograms },
    { data: byState },
    { data: byType },
    { data: recentUpdates },
  ] = await Promise.all([
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }),
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).not('outcomes', 'is', null),
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).or('name.ilike.%Aboriginal%,name.ilike.%Indigenous%'),
    supabase.from('alma_interventions').select('metadata'),
    supabase.from('alma_interventions').select('intervention_type'),
    supabase.from('alma_interventions').select('name, intervention_type, created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  // Process state distribution
  const stateCount: Record<string, number> = {};
  byState?.forEach((row: any) => {
    const state = row.metadata?.state || 'Unknown';
    stateCount[state] = (stateCount[state] || 0) + 1;
  });

  // Process type distribution
  const typeCount: Record<string, number> = {};
  byType?.forEach((row: any) => {
    const type = row.intervention_type || 'Other';
    typeCount[type] = (typeCount[type] || 0) + 1;
  });

  // Sort by count
  const topTypes = Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const topStates = Object.entries(stateCount)
    .filter(([state]) => state !== 'Unknown')
    .sort((a, b) => b[1] - a[1]);

  return {
    total: totalInterventions || 0,
    withOutcomes: withOutcomes || 0,
    aboriginal: aboriginalPrograms || 0,
    outcomesRate: totalInterventions ? Math.round(((withOutcomes || 0) / totalInterventions) * 100) : 0,
    statesCount: Object.keys(stateCount).filter(s => s !== 'Unknown').length,
    byState: topStates,
    byType: topTypes,
    recentUpdates: recentUpdates || [],
  };
}

export default async function ImpactDashboardPage() {
  const stats = await getComprehensiveStats();

  // Calculate bar widths
  const maxTypeCount = Math.max(...stats.byType.map(([, count]) => count));
  const maxStateCount = Math.max(...stats.byState.map(([, count]) => count));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="page-content">
      {/* Header */}
      <section className="section-padding border-b-2 border-black bg-white">
        <div className="container-justice">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-700 text-green-800 font-bold text-xs mb-4">
                <Leaf className="w-3 h-3" />
                STEWARD DASHBOARD
              </div>
              <h1 className="text-4xl font-black text-black mb-2">Impact Dashboard</h1>
              <p className="text-lg text-gray-600">
                Real-time metrics from Australia's youth justice intelligence network
              </p>
            </div>
            <Link
              href="/intelligence/interventions"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 text-white font-bold border-2 border-black hover:bg-green-800 transition-colors"
            >
              Explore All Data <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-bold text-gray-600 uppercase">Total Programs</span>
              </div>
              <div className="text-5xl font-black text-black">{stats.total}</div>
            </div>

            <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-bold text-gray-600 uppercase">With Outcomes</span>
              </div>
              <div className="text-5xl font-black text-green-600">{stats.outcomesRate}%</div>
              <div className="text-sm text-gray-500 mt-1">{stats.withOutcomes} programs</div>
            </div>

            <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Heart className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-bold text-gray-600 uppercase">Aboriginal-Led</span>
              </div>
              <div className="text-5xl font-black text-purple-600">{stats.aboriginal}</div>
              <div className="text-sm text-gray-500 mt-1">{Math.round((stats.aboriginal / stats.total) * 100)}% of total</div>
            </div>

            <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-sm font-bold text-gray-600 uppercase">States Covered</span>
              </div>
              <div className="text-5xl font-black text-orange-600">{stats.statesCount}/8</div>
            </div>
          </div>
        </div>
      </section>

      {/* Distribution Charts */}
      <section className="section-padding border-b-2 border-black">
        <div className="container-justice">
          <div className="grid md:grid-cols-2 gap-8">
            {/* By State */}
            <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <h3 className="text-xl font-black text-black mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                Programs by State
              </h3>
              <div className="space-y-4">
                {stats.byState.map(([state, count]) => (
                  <div key={state}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-700">{state}</span>
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-4 border border-gray-300">
                      <div
                        className="h-full bg-orange-500"
                        style={{ width: `${(count / maxStateCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Type */}
            <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <h3 className="text-xl font-black text-black mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Programs by Type
              </h3>
              <div className="space-y-4">
                {stats.byType.map(([type, count]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-700 truncate max-w-[200px]">{type}</span>
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-4 border border-gray-300">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(count / maxTypeCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Updates & Actions */}
      <section className="section-padding">
        <div className="container-justice">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Recent Updates */}
            <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <h3 className="text-xl font-black text-black mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Recent Additions
              </h3>
              <div className="space-y-4">
                {stats.recentUpdates.map((update: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-200 last:border-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{update.name}</p>
                      <p className="text-xs text-gray-500">{update.intervention_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Steward Actions */}
            <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <h3 className="text-xl font-black text-black mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Steward Actions
              </h3>
              <div className="space-y-4">
                <Link
                  href="/intelligence/interventions"
                  className="flex items-center justify-between p-4 border-2 border-black hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-gray-900">Browse All Programs</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/intelligence/portfolio"
                  className="flex items-center justify-between p-4 border-2 border-black hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-gray-900">Compare Portfolios</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/intelligence/interventions?consent_level=Community%20Controlled"
                  className="flex items-center justify-between p-4 border-2 border-black hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-gray-900">Aboriginal-Led Programs</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/stewards"
                  className="flex items-center justify-between p-4 border-2 border-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <span className="font-bold text-green-800">Become a Steward</span>
                  <ArrowRight className="w-5 h-5 text-green-700" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}
