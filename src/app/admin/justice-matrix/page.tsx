import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  Scale,
  Users,
  Globe,
  Database,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Search,
  ExternalLink,
  RefreshCw,
  MapPin,
  Award,
  FileText
} from 'lucide-react';

// Types for Justice Matrix data
interface RecentCase {
  id: string;
  case_citation: string;
  jurisdiction: string;
  year: number;
  outcome: string;
}

interface SourceHealth {
  id: string;
  name: string;
  source_type: string;
  is_active: boolean;
  last_scraped_at: string;
  success_rate: number;
  total_items_found: number;
}

interface RecentDiscovery {
  id: string;
  extracted_title: string;
  item_type: string;
  status: string;
  discovered_at: string;
}

export default async function JusticeMatrixAdminPage() {
  const supabase = await createClient();
  // Cast to any to bypass deep type instantiation issues with new tables
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/admin/justice-matrix');
  }

  // Check admin role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profileData?.is_super_admin) {
    redirect('/');
  }

  // Fetch all stats in parallel (using db to bypass type issues with new tables)
  const [
    { count: casesCount },
    { count: campaignsCount },
    { count: pendingCount },
    { count: sourcesCount },
    { count: activeSourcesCount },
    { count: featuredCasesCount },
    { count: featuredCampaignsCount },
    { data: recentCases },
    { data: recentDiscoveries },
    { data: sourceHealth },
  ] = await Promise.all([
    db.from('justice_matrix_cases').select('*', { count: 'exact', head: true }),
    db.from('justice_matrix_campaigns').select('*', { count: 'exact', head: true }),
    db.from('justice_matrix_discovered').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('justice_matrix_sources').select('*', { count: 'exact', head: true }),
    db.from('justice_matrix_sources').select('*', { count: 'exact', head: true }).eq('is_active', true),
    db.from('justice_matrix_cases').select('*', { count: 'exact', head: true }).eq('featured', true),
    db.from('justice_matrix_campaigns').select('*', { count: 'exact', head: true }).eq('featured', true),
    db.from('justice_matrix_cases').select('id, case_citation, jurisdiction, year, outcome').order('created_at', { ascending: false }).limit(5),
    db.from('justice_matrix_discovered').select('id, extracted_title, item_type, status, discovered_at').order('discovered_at', { ascending: false }).limit(5),
    db.from('justice_matrix_sources').select('id, name, source_type, is_active, last_scraped_at, success_rate, total_items_found').order('scrape_priority', { ascending: true }).limit(5),
  ]);

  // Get outcome breakdown
  const { data: outcomeStats } = await db
    .from('justice_matrix_cases')
    .select('outcome');

  const outcomes = outcomeStats?.reduce((acc: Record<string, number>, row: { outcome?: string }) => {
    if (row.outcome) {
      acc[row.outcome] = (acc[row.outcome] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  // Get region breakdown
  const { data: regionStats } = await db
    .from('justice_matrix_cases')
    .select('region');

  const regions = regionStats?.reduce((acc: Record<string, number>, row: { region?: string }) => {
    if (row.region) {
      acc[row.region] = (acc[row.region] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-8 h-8 text-blue-600" />
                <h1 className="text-4xl font-black text-black">Justice Matrix</h1>
              </div>
              <p className="text-lg text-gray-600">
                Global strategic litigation and advocacy clearing house
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/preview/justice-matrix"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                View Preview
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-50">
                  <Scale className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="text-4xl font-black text-black mb-1">{casesCount || 0}</div>
              <div className="text-sm font-bold text-gray-900">Strategic Cases</div>
              <div className="text-xs text-gray-600">{featuredCasesCount || 0} featured</div>
            </div>

            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-green-50">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="text-4xl font-black text-black mb-1">{campaignsCount || 0}</div>
              <div className="text-sm font-bold text-gray-900">Advocacy Campaigns</div>
              <div className="text-xs text-gray-600">{featuredCampaignsCount || 0} featured</div>
            </div>

            <Link
              href="/admin/justice-matrix/discoveries"
              className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-3 ${(pendingCount || 0) > 0 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                  <Clock className={`w-6 h-6 ${(pendingCount || 0) > 0 ? 'text-yellow-600' : 'text-gray-600'}`} />
                </div>
                {(pendingCount || 0) > 0 && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-600">
                    REVIEW
                  </span>
                )}
              </div>
              <div className="text-4xl font-black text-black mb-1">{pendingCount || 0}</div>
              <div className="text-sm font-bold text-gray-900">Pending Review</div>
              <div className="text-xs text-gray-600">Click to review discoveries</div>
            </Link>

            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-purple-50">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="text-4xl font-black text-black mb-1">{activeSourcesCount || 0}</div>
              <div className="text-sm font-bold text-gray-900">Active Sources</div>
              <div className="text-xs text-gray-600">of {sourcesCount || 0} total sources</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Outcomes Breakdown */}
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <h3 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Case Outcomes
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Favorable</span>
                  </div>
                  <span className="text-2xl font-black text-green-600">{outcomes.favorable || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="font-medium">Adverse</span>
                  </div>
                  <span className="text-2xl font-black text-red-600">{outcomes.adverse || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium">Pending</span>
                  </div>
                  <span className="text-2xl font-black text-yellow-600">{outcomes.pending || 0}</span>
                </div>
              </div>
              {(casesCount || 0) > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Favorable rate: <span className="font-bold text-green-600">
                      {Math.round(((outcomes.favorable || 0) / (casesCount || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Regional Coverage */}
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <h3 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Regional Coverage
              </h3>
              <div className="space-y-3">
                {(Object.entries(regions) as [string, number][]).map(([region, count]) => (
                  <div key={region} className="flex items-center justify-between">
                    <span className="font-medium capitalize">{region.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 h-2">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${Math.round((count / (casesCount || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
                {Object.keys(regions).length === 0 && (
                  <p className="text-gray-500 text-sm">No cases yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Cases */}
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-black flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-600" />
                  Recent Cases
                </h3>
                <Link
                  href="/api/justice-matrix/cases"
                  className="text-sm text-blue-600 font-bold hover:underline"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {(recentCases as RecentCase[] | null)?.map((c) => (
                  <div key={c.id} className="flex items-start justify-between py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{c.case_citation}</p>
                      <p className="text-xs text-gray-500">{c.jurisdiction} • {c.year}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 ${
                      c.outcome === 'favorable' ? 'bg-green-100 text-green-700' :
                      c.outcome === 'adverse' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {c.outcome || 'pending'}
                    </span>
                  </div>
                ))}
                {(!recentCases || recentCases.length === 0) && (
                  <p className="text-gray-500 text-sm">No cases yet. Run the seeding script to add initial data.</p>
                )}
              </div>
            </div>

            {/* Source Health */}
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-black flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-600" />
                  Source Health
                </h3>
              </div>
              <div className="space-y-3">
                {(sourceHealth as SourceHealth[] | null)?.map((source) => (
                  <div key={source.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{source.name}</p>
                      <p className="text-xs text-gray-500">
                        {source.source_type} • {source.total_items_found || 0} items found
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {source.success_rate >= 80 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : source.success_rate >= 50 ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-xs font-bold ${source.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                        {source.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                ))}
                {(!sourceHealth || sourceHealth.length === 0) && (
                  <p className="text-gray-500 text-sm">No sources configured yet. Run migrations to add default sources.</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
            <h3 className="text-xl font-black text-black mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/admin/justice-matrix/discoveries"
                className="flex items-center gap-3 px-4 py-3 bg-yellow-50 border-2 border-yellow-600 text-yellow-700 font-bold hover:bg-yellow-100 transition-colors"
              >
                <Clock className="w-5 h-5" />
                Review Discoveries
              </Link>

              <button
                className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-2 border-blue-600 text-blue-600 font-bold hover:bg-blue-100 transition-colors"
                title="Run /ralph-matrix-scan in Claude"
              >
                <RefreshCw className="w-5 h-5" />
                Run Discovery Scan
              </button>

              <Link
                href="/api/justice-matrix/cases"
                className="flex items-center gap-3 px-4 py-3 bg-purple-50 border-2 border-purple-600 text-purple-600 font-bold hover:bg-purple-100 transition-colors"
              >
                <FileText className="w-5 h-5" />
                API: Cases
              </Link>

              <Link
                href="/api/justice-matrix/campaigns"
                className="flex items-center gap-3 px-4 py-3 bg-green-50 border-2 border-green-600 text-green-600 font-bold hover:bg-green-100 transition-colors"
              >
                <FileText className="w-5 h-5" />
                API: Campaigns
              </Link>
            </div>
          </div>

          {/* Recent Discoveries Preview */}
          {recentDiscoveries && recentDiscoveries.length > 0 && (
            <div className="mt-8 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-black flex items-center gap-2">
                  <Search className="w-5 h-5 text-yellow-600" />
                  Recent Discoveries
                </h3>
                <Link
                  href="/admin/justice-matrix/discoveries"
                  className="text-sm text-blue-600 font-bold hover:underline"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {(recentDiscoveries as RecentDiscovery[]).map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{d.extracted_title || 'Untitled'}</p>
                      <p className="text-xs text-gray-500">
                        {d.item_type} • {new Date(d.discovered_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 ${
                      d.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      d.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
