'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  BarChart3,
  Activity,
  ExternalLink,
  Shield,
  DollarSign,
  Building2,
  Zap,
  Lightbulb,
  ArrowRight,
  Globe,
  TrendingUp,
} from 'lucide-react';

interface TableHealth {
  name: string;
  count: number;
  lastUpdated: string | null;
  healthScore: 'green' | 'yellow' | 'red';
  keyColumns: string[];
  domain: string;
}

interface EnrichmentMetric {
  label: string;
  current: number;
  total: number;
  percentage: number;
}

interface ApiHealthResult {
  endpoint: string;
  status: number | null;
  latencyMs: number;
  healthy: boolean;
  error?: string;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
}

interface HealthData {
  tables: TableHealth[];
  summary: {
    total_tables: number;
    healthy: number;
    warning: number;
    critical: number;
    empty_tables: number;
    total_records: number;
  };
  enrichment: EnrichmentMetric[];
  verificationBreakdown: Record<string, number>;
  provenanceBreakdown: Record<string, number>;
  apis: ApiHealthResult[];
  recommendations: Recommendation[];
  lastScrapeJob: {
    job_type: string;
    status: string;
    started_at: string;
    completed_at: string | null;
  } | null;
  generatedAt: string;
}

const HEALTH_COLORS = {
  green: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-500',
    text: 'text-emerald-700',
    icon: CheckCircle2,
    label: 'Healthy',
  },
  yellow: {
    bg: 'bg-amber-50',
    border: 'border-amber-500',
    text: 'text-amber-700',
    icon: AlertTriangle,
    label: 'Warning',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-700',
    icon: XCircle,
    label: 'Critical',
  },
};

const DOMAIN_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  alma: { label: 'ALMA Evidence Engine', icon: Shield, color: 'border-purple-600' },
  funding: { label: 'Justice Funding', icon: DollarSign, color: 'border-green-600' },
  grantscope: { label: 'GrantScope Public Data (2.6M)', icon: TrendingUp, color: 'border-indigo-600' },
  geo: { label: 'Geographic Data', icon: Globe, color: 'border-teal-600' },
  charity: { label: 'Charity Registry', icon: Building2, color: 'border-blue-600' },
  campaign: { label: 'CONTAINED Campaign', icon: Lightbulb, color: 'border-red-600' },
  detention: { label: 'Detention Data', icon: Activity, color: 'border-orange-600' },
  platform: { label: 'Platform Content', icon: Globe, color: 'border-gray-600' },
  signal: { label: 'Signal Engine', icon: Zap, color: 'border-yellow-600' },
};

const TABLE_LINKS: Record<string, string> = {
  alma_interventions: '/intelligence/interventions',
  alma_evidence: '/intelligence/evidence',
  alma_funding_opportunities: '/intelligence/funding',
  alma_weekly_reports: '/intelligence/reports',
  justice_funding: '/justice-funding',
  organizations: '/organizations',
  services: '/services',
  articles: '/blog',
  blog_posts: '/blog',
  events: '/events',
  stories: '/stories',
  opportunities: '/opportunities',
  public_profiles: '/people',
};

const PRIORITY_COLORS = {
  high: { bg: 'bg-red-50', border: 'border-red-600', text: 'text-red-700', badge: 'bg-red-600' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-600', text: 'text-amber-700', badge: 'bg-amber-600' },
  low: { bg: 'bg-blue-50', border: 'border-blue-600', text: 'text-blue-700', badge: 'bg-blue-600' },
};

export default function DataHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchHealth() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/data-health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchHealth();
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  function groupByDomain(tables: TableHealth[]): Record<string, TableHealth[]> {
    const groups: Record<string, TableHealth[]> = {};
    for (const table of tables) {
      const domain = table.domain || 'platform';
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(table);
    }
    return groups;
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Navigation />

      <main className="page-content bg-gray-50 min-h-screen">
        {/* Header */}
        <section className="border-b-2 border-black bg-white">
          <div className="container-justice py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
                  Admin
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
                  Data Health Dashboard
                </h1>
                <p className="text-lg text-gray-700 mt-2">
                  All data sources, enrichment coverage, API health, and recommendations
                </p>
              </div>
              <button
                onClick={fetchHealth}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </section>

        <div className="container-justice py-8">
          {error && (
            <div className="bg-red-50 border-2 border-red-600 p-4 mb-8">
              <p className="text-red-700 font-medium">Error loading health data: {error}</p>
            </div>
          )}

          {loading && !data ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500 font-mono">Scanning tables...</span>
            </div>
          ) : data && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white border-2 border-black p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-600">Total Records</span>
                    <Database className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-3xl font-black font-mono">{data.summary.total_records.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">across {data.summary.total_tables} tables</div>
                </div>

                <div className="bg-emerald-50 border-2 border-emerald-500 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-emerald-700">Healthy</span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-black font-mono text-emerald-700">{data.summary.healthy}</div>
                  <div className="text-xs text-emerald-600 mt-1">&gt;10 records, updated &lt;7d</div>
                </div>

                <div className="bg-amber-50 border-2 border-amber-500 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-amber-700">Warning</span>
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-3xl font-black font-mono text-amber-700">{data.summary.warning}</div>
                  <div className="text-xs text-amber-600 mt-1">has records, updated &lt;30d</div>
                </div>

                <div className="bg-red-50 border-2 border-red-500 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-red-700">Critical</span>
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-3xl font-black font-mono text-red-700">{data.summary.critical}</div>
                  <div className="text-xs text-red-600 mt-1">empty or stale &gt;30d</div>
                </div>

                <div className="bg-white border-2 border-black p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-600">APIs</span>
                    <Activity className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-3xl font-black font-mono">
                    {data.apis.filter(a => a.healthy).length}/{data.apis.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">endpoints healthy</div>
                </div>
              </div>

              {/* Recommendations */}
              {data.recommendations.length > 0 && (
                <div className="bg-white border-2 border-black mb-8">
                  <div className="bg-black text-white px-6 py-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    <h2 className="font-bold uppercase tracking-wider">Recommendations</h2>
                    <span className="ml-auto text-xs font-mono opacity-70">{data.recommendations.length} actions</span>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {data.recommendations.map((rec, idx) => {
                      const colors = PRIORITY_COLORS[rec.priority];
                      return (
                        <div key={idx} className={`px-6 py-4 ${colors.bg}`}>
                          <div className="flex items-start gap-3">
                            <span className={`${colors.badge} text-white text-xs font-bold px-2 py-0.5 uppercase mt-0.5`}>
                              {rec.priority}
                            </span>
                            <div className="flex-1">
                              <div className={`font-bold ${colors.text}`}>{rec.title}</div>
                              <div className="text-sm text-gray-600 mt-1">{rec.description}</div>
                              {rec.action && (
                                <code className="text-xs bg-gray-100 px-2 py-1 mt-2 inline-block font-mono">{rec.action}</code>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Enrichment Coverage */}
              {data.enrichment.length > 0 && (
                <div className="bg-white border-2 border-black mb-8">
                  <div className="bg-black text-white px-6 py-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <h2 className="font-bold uppercase tracking-wider">Enrichment Coverage</h2>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.enrichment.map((metric) => (
                      <div key={metric.label}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-gray-700">{metric.label}</span>
                          <span className="text-sm font-bold font-mono text-gray-900">{metric.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-4 border border-gray-300">
                          <div
                            className={`h-full transition-all ${
                              metric.percentage >= 75 ? 'bg-emerald-500' :
                              metric.percentage >= 50 ? 'bg-amber-500' :
                              metric.percentage >= 25 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          {metric.current.toLocaleString()} / {metric.total.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Verification & Provenance Breakdowns */}
                  <div className="border-t border-gray-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.keys(data.verificationBreakdown).length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600 mb-3">Verification Status</h3>
                        <div className="space-y-2">
                          {Object.entries(data.verificationBreakdown)
                            .sort(([, a], [, b]) => b - a)
                            .map(([status, count]) => (
                              <div key={status} className="flex items-center justify-between">
                                <span className="text-sm font-mono">{status}</span>
                                <span className="text-sm font-bold font-mono">{count.toLocaleString()}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    {Object.keys(data.provenanceBreakdown).length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600 mb-3">Data Provenance</h3>
                        <div className="space-y-2">
                          {Object.entries(data.provenanceBreakdown)
                            .sort(([, a], [, b]) => b - a)
                            .map(([prov, count]) => (
                              <div key={prov} className="flex items-center justify-between">
                                <span className="text-sm font-mono">{prov}</span>
                                <span className="text-sm font-bold font-mono">{count.toLocaleString()}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* API Health */}
              {data.apis.length > 0 && (
                <div className="bg-white border-2 border-black mb-8">
                  <div className="bg-black text-white px-6 py-3 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    <h2 className="font-bold uppercase tracking-wider">API Health</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b-2 border-black">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Endpoint</th>
                          <th className="px-4 py-3 text-right font-bold uppercase tracking-wider">HTTP</th>
                          <th className="px-4 py-3 text-right font-bold uppercase tracking-wider">Latency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.apis.map((api) => (
                          <tr key={api.endpoint} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              {api.healthy ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-500">
                                  <CheckCircle2 className="w-3 h-3" /> OK
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-red-50 text-red-700 border border-red-500">
                                  <XCircle className="w-3 h-3" /> FAIL
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">{api.endpoint}</td>
                            <td className="px-4 py-3 text-right font-mono">
                              {api.status ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              <span className={api.latencyMs > 3000 ? 'text-red-600 font-bold' : api.latencyMs > 1000 ? 'text-amber-600' : 'text-gray-600'}>
                                {api.latencyMs}ms
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Data Domains */}
              {Object.entries(groupByDomain(data.tables)).map(([domain, tables]) => {
                const config = DOMAIN_CONFIG[domain] || DOMAIN_CONFIG.platform;
                const DomainIcon = config.icon;
                const domainRecords = tables.reduce((s, t) => s + t.count, 0);

                return (
                  <div key={domain} className={`bg-white border-2 ${config.color} mb-6`}>
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center gap-3">
                      <DomainIcon className="w-5 h-5" />
                      <h2 className="font-black uppercase tracking-wider">{config.label}</h2>
                      <span className="ml-auto text-xs font-mono text-gray-500">
                        {domainRecords.toLocaleString()} records across {tables.length} tables
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2 text-left font-bold uppercase tracking-wider text-xs">Status</th>
                            <th className="px-4 py-2 text-left font-bold uppercase tracking-wider text-xs">Table</th>
                            <th className="px-4 py-2 text-right font-bold uppercase tracking-wider text-xs">Records</th>
                            <th className="px-4 py-2 text-left font-bold uppercase tracking-wider text-xs">Last Updated</th>
                            <th className="px-4 py-2 text-center font-bold uppercase tracking-wider text-xs w-16">Link</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {tables
                            .sort((a, b) => b.count - a.count)
                            .map((table) => {
                              const health = HEALTH_COLORS[table.healthScore];
                              const HealthIcon = health.icon;
                              const link = TABLE_LINKS[table.name];

                              return (
                                <tr key={table.name} className="hover:bg-gray-50">
                                  <td className="px-4 py-2">
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold ${health.bg} ${health.text} border ${health.border}`}>
                                      <HealthIcon className="w-3 h-3" />
                                      {health.label}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 font-mono font-medium text-xs">
                                    {table.name}
                                  </td>
                                  <td className="px-4 py-2 text-right font-mono font-bold">
                                    {table.count === 0 ? (
                                      <span className="text-red-500">0</span>
                                    ) : (
                                      table.count.toLocaleString()
                                    )}
                                  </td>
                                  <td className="px-4 py-2">
                                    {table.lastUpdated ? (
                                      <div className="flex items-center gap-1 text-gray-600">
                                        <Clock className="w-3 h-3" />
                                        <span className="font-mono text-xs">{timeAgo(table.lastUpdated)}</span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    {link && (
                                      <Link
                                        href={link}
                                        className="inline-flex items-center justify-center w-7 h-7 border border-black hover:bg-black hover:text-white transition-colors"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </Link>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {/* Scraper Status */}
              {data.lastScrapeJob && (
                <div className="bg-white border-2 border-black p-6 mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5" />
                    <h2 className="text-lg font-black uppercase">Last Scraper Run</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 font-bold block">Job Type</span>
                      <span className="font-mono">{data.lastScrapeJob.job_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-bold block">Status</span>
                      <span className={`font-mono font-bold ${
                        data.lastScrapeJob.status === 'completed' ? 'text-emerald-600' :
                        data.lastScrapeJob.status === 'running' ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {data.lastScrapeJob.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-bold block">Started</span>
                      <span className="font-mono">{formatDate(data.lastScrapeJob.started_at)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-bold block">Completed</span>
                      <span className="font-mono">
                        {data.lastScrapeJob.completed_at ? formatDate(data.lastScrapeJob.completed_at) : 'In progress'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="bg-white border-2 border-black mb-8">
                <div className="bg-black text-white px-6 py-3 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  <h2 className="font-bold uppercase tracking-wider">Quick Links</h2>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/justice-funding" className="flex items-center gap-2 px-4 py-3 border-2 border-black font-bold text-sm hover:bg-black hover:text-white transition-colors">
                    <DollarSign className="w-4 h-4" /> Funding Explorer
                  </Link>
                  <Link href="/intelligence/interventions" className="flex items-center gap-2 px-4 py-3 border-2 border-black font-bold text-sm hover:bg-black hover:text-white transition-colors">
                    <Shield className="w-4 h-4" /> ALMA Browser
                  </Link>
                  <Link href="/transparency" className="flex items-center gap-2 px-4 py-3 border-2 border-black font-bold text-sm hover:bg-black hover:text-white transition-colors">
                    <BarChart3 className="w-4 h-4" /> Money Trail
                  </Link>
                  <Link href="/#where-money-goes" className="flex items-center gap-2 px-4 py-3 border-2 border-black font-bold text-sm hover:bg-black hover:text-white transition-colors">
                    <Globe className="w-4 h-4" /> Homepage Stats
                  </Link>
                </div>
              </div>

              {/* Generated timestamp */}
              <div className="text-center mt-6 text-xs text-gray-400 font-mono">
                Generated at {formatDate(data.generatedAt)}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
