'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  Users,
  Linkedin,
  Eye,
  BarChart3,
  ExternalLink,
  Target,
  Zap,
  DollarSign,
  Heart,
} from 'lucide-react';

interface AnalyticsData {
  summary: {
    total_entities: number;
    linkedin_engaged: number;
    outreach_breakdown: Record<string, number>;
    category_breakdown: Record<string, number>;
    list_breakdown: Record<string, number>;
  };
  site: {
    total_articles: number;
    total_views: number;
    total_shares: number;
    contained_articles: number;
    contained_views: number;
  };
  top_linkedin_engagers: Array<{
    name: string;
    organization: string;
    composite_score: number;
    alignment_category: string;
    campaign_list: string;
    outreach_status: string;
    entity_type: string;
    warm_paths: Array<{ via: string; comment_snippet?: string; profile_url?: string }>;
  }>;
  page_analytics: {
    total_tracked: number;
    today: number;
    this_week: number;
    top_pages: Array<{ path: string; views: number }>;
    top_referrers: Array<{ referrer: string; views: number }>;
    campaigns: Array<{ campaign: string; views: number }>;
  };
  top_contained_articles: Array<{
    title: string;
    slug: string;
    view_count: number;
    share_count: number;
  }>;
  top_viewed_articles: Array<{
    title: string;
    slug: string;
    view_count: number;
    share_count: number;
    category: string;
  }>;
}

const CATEGORY_STYLES: Record<string, string> = {
  ally: 'bg-emerald-100 text-emerald-800',
  potential_ally: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-700',
  opponent: 'bg-red-100 text-red-800',
  unknown: 'bg-yellow-100 text-yellow-800',
};

const LIST_ICONS: Record<string, typeof Users> = {
  allies_to_activate: Zap,
  funders_to_pitch: DollarSign,
  decision_makers: Target,
  warm_intros: Heart,
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => {
        if (!r.ok) throw new Error(r.status === 401 ? 'Not authenticated' : 'Failed');
        return r.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-bold">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, site, page_analytics, top_linkedin_engagers, top_contained_articles, top_viewed_articles } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-2">
          <ArrowLeft className="w-4 h-4" /> Admin
        </Link>
        <h1 className="text-3xl font-black tracking-tight">CAMPAIGN ANALYTICS</h1>
        <p className="text-gray-500 mt-1 mb-8">
          LinkedIn engagement × site analytics × campaign pipeline
        </p>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard icon={Users} label="Total Entities" value={summary.total_entities} />
          <SummaryCard icon={Linkedin} label="LinkedIn Engaged" value={summary.linkedin_engaged} color="text-blue-600" />
          <SummaryCard
            icon={TrendingUp}
            label="Engagement Rate"
            value={`${((summary.linkedin_engaged / Math.max(summary.total_entities, 1)) * 100).toFixed(1)}%`}
            color="text-emerald-600"
          />
          <SummaryCard
            icon={BarChart3}
            label="Contacted"
            value={Object.entries(summary.outreach_breakdown).filter(([k]) => k !== 'pending').reduce((sum, [, v]) => sum + v, 0)}
            color="text-purple-600"
          />
        </div>

        {/* Site Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <SummaryCard icon={Eye} label="Total Article Views" value={site.total_views} color="text-blue-600" />
          <SummaryCard icon={BarChart3} label="Total Articles" value={site.total_articles} />
          <SummaryCard icon={Eye} label="CONTAINED Views" value={site.contained_views} color="text-red-600" />
          <SummaryCard icon={BarChart3} label="CONTAINED Articles" value={site.contained_articles} color="text-red-600" />
          <SummaryCard icon={ExternalLink} label="Total Shares" value={site.total_shares} color="text-emerald-600" />
        </div>

        {/* Page Analytics */}
        {page_analytics && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <SummaryCard icon={Eye} label="Page Views Today" value={page_analytics.today} color="text-emerald-600" />
              <SummaryCard icon={TrendingUp} label="Page Views This Week" value={page_analytics.this_week} color="text-blue-600" />
              <SummaryCard icon={BarChart3} label="Total Tracked" value={page_analytics.total_tracked} />
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Top Pages */}
              <div className="bg-white border-2 border-black p-6">
                <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Top Pages
                </h2>
                <div className="space-y-2">
                  {page_analytics.top_pages.map((p, i) => (
                    <div key={p.path} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-xs font-mono text-gray-700 truncate max-w-[70%]" title={p.path}>
                        <span className="text-gray-300 mr-1">{i + 1}.</span>
                        {p.path}
                      </span>
                      <span className="text-sm font-bold">{p.views}</span>
                    </div>
                  ))}
                  {page_analytics.top_pages.length === 0 && (
                    <p className="text-gray-400 text-sm">No page views tracked yet. Views will appear as visitors browse the site.</p>
                  )}
                </div>
              </div>

              {/* Top Referrers */}
              <div className="bg-white border-2 border-black p-6">
                <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-emerald-600" />
                  Top Referrers
                </h2>
                <div className="space-y-2">
                  {page_analytics.top_referrers.map(r => (
                    <div key={r.referrer} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-xs font-mono text-gray-700 truncate max-w-[70%]">{r.referrer}</span>
                      <span className="text-sm font-bold">{r.views}</span>
                    </div>
                  ))}
                  {page_analytics.top_referrers.length === 0 && (
                    <p className="text-gray-400 text-sm">No referrer data yet. This shows where visitors come from (LinkedIn, Google, direct).</p>
                  )}
                </div>
              </div>

              {/* UTM Campaigns */}
              <div className="bg-white border-2 border-black p-6">
                <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-600" />
                  UTM Campaigns
                </h2>
                <div className="space-y-2">
                  {page_analytics.campaigns.map(c => (
                    <div key={c.campaign} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-xs font-mono text-gray-700">{c.campaign}</span>
                      <span className="text-sm font-bold">{c.views}</span>
                    </div>
                  ))}
                  {page_analytics.campaigns.length === 0 && (
                    <p className="text-gray-400 text-sm">No UTM campaigns tracked yet. Use UTM-tagged URLs in LinkedIn posts to track campaign performance.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* LinkedIn Engagement by Category */}
          <div className="bg-white border-2 border-black p-6">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <Linkedin className="w-5 h-5 text-blue-600" />
              LinkedIn Engagers by Category
            </h2>
            <div className="space-y-3">
              {Object.entries(summary.category_breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${CATEGORY_STYLES[cat] || 'bg-gray-100'}`}>
                        {cat.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(count / summary.linkedin_engaged) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Pipeline by Campaign List */}
          <div className="bg-white border-2 border-black p-6">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              LinkedIn Engagers by Campaign List
            </h2>
            <div className="space-y-3">
              {Object.entries(summary.list_breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([list, count]) => {
                  const Icon = LIST_ICONS[list] || Users;
                  return (
                    <div key={list} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">{list.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ width: `${(count / summary.linkedin_engaged) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold w-8 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Outreach Status */}
          <div className="bg-white border-2 border-black p-6">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Outreach Pipeline (LinkedIn Engagers)
            </h2>
            <div className="space-y-2">
              {Object.entries(summary.outreach_breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-medium capitalize">{status.replace(/_/g, ' ')}</span>
                    <span className="text-lg font-black">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* CONTAINED Articles Performance */}
          <div className="bg-white border-2 border-black p-6">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              CONTAINED Articles
            </h2>
            {top_contained_articles.length === 0 ? (
              <p className="text-gray-400 text-sm">No CONTAINED articles with view data yet</p>
            ) : (
              <div className="space-y-3">
                {top_contained_articles.map(article => (
                  <div key={article.slug} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <Link
                      href={`/stories/${article.slug}`}
                      className="text-sm font-medium text-blue-600 hover:underline truncate max-w-[70%]"
                    >
                      {article.title}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {article.view_count || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top LinkedIn Engagers Table */}
        <div className="bg-white border-2 border-black p-6 mb-8">
          <h2 className="text-lg font-black mb-4 flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-blue-600" />
            Top LinkedIn Engagers — Sorted by Composite Score
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            People who engaged with your LinkedIn content, scored against campaign alignment. These are your warmest leads.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-2 px-2 font-black">Name</th>
                  <th className="text-left py-2 px-2 font-black">Organization</th>
                  <th className="text-center py-2 px-2 font-black">Score</th>
                  <th className="text-left py-2 px-2 font-black">Category</th>
                  <th className="text-left py-2 px-2 font-black">List</th>
                  <th className="text-left py-2 px-2 font-black">Status</th>
                  <th className="text-left py-2 px-2 font-black">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {top_linkedin_engagers.map((person, i) => {
                  const engagement = person.warm_paths?.[0];
                  return (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2.5 px-2 font-medium">
                        <div className="flex items-center gap-2">
                          {person.name}
                          {engagement?.profile_url && (
                            <a href={engagement.profile_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 text-blue-500" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-gray-600 truncate max-w-[150px]">{person.organization || '—'}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                          person.composite_score >= 70 ? 'bg-emerald-100 text-emerald-800' :
                          person.composite_score >= 50 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {person.composite_score}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${CATEGORY_STYLES[person.alignment_category] || 'bg-gray-100'}`}>
                          {person.alignment_category?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-xs text-gray-600">{person.campaign_list?.replace(/_/g, ' ') || '—'}</td>
                      <td className="py-2.5 px-2">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          person.outreach_status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                          person.outreach_status === 'responded' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {person.outreach_status || 'pending'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-xs text-gray-500 truncate max-w-[200px]">
                        {engagement?.comment_snippet || engagement?.via?.replace(/_/g, ' ') || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Viewed Articles */}
        {top_viewed_articles && top_viewed_articles.length > 0 && (
          <div className="bg-white border-2 border-black p-6 mb-8">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Top Viewed Articles (All Time)
            </h2>
            <div className="space-y-2">
              {top_viewed_articles.map((article, i) => (
                <div key={article.slug} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-gray-300 w-6">{i + 1}</span>
                    <Link
                      href={`/stories/${article.slug}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {article.title}
                    </Link>
                    {article.category && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{article.category}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold">
                    <Eye className="w-3.5 h-3.5 text-gray-400" />
                    {article.view_count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vercel Analytics CTA */}
        <div className="bg-white border-2 border-black p-6">
          <h2 className="text-lg font-black mb-2">Site Analytics (Vercel)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Page views, referrers, UTM tracking, and geographic data are available in the Vercel dashboard.
            Use UTM-tagged links in LinkedIn posts to track which content drives traffic.
          </p>
          <div className="bg-gray-50 border border-gray-200 p-4 rounded mb-4">
            <p className="text-xs font-mono text-gray-600 mb-1">UTM template for LinkedIn:</p>
            <code className="text-xs text-blue-700 break-all">
              https://www.justicehub.com.au/stories/[slug]?utm_source=linkedin&utm_medium=social&utm_campaign=[campaign-name]
            </code>
          </div>
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors"
          >
            Open Vercel Analytics <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: {
  icon: typeof Users;
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="bg-white border-2 border-black p-4">
      <Icon className={`w-5 h-5 mb-2 ${color || 'text-gray-400'}`} />
      <div className="text-2xl font-black">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
    </div>
  );
}
