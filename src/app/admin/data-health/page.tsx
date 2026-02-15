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
} from 'lucide-react';

interface TableHealth {
  name: string;
  count: number;
  lastUpdated: string | null;
  healthScore: 'green' | 'yellow' | 'red';
  keyColumns: string[];
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
  lastScrapeJob: {
    job_type: string;
    status: string;
    started_at: string;
    completed_at: string | null;
    result: Record<string, any> | null;
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

// Map table names to admin/view routes
const TABLE_LINKS: Record<string, string> = {
  alma_interventions: '/intelligence/interventions',
  alma_evidence: '/intelligence/evidence',
  alma_funding_opportunities: '/intelligence/funding',
  alma_weekly_reports: '/intelligence/reports',
  organizations: '/organizations',
  services: '/services',
  articles: '/blog',
  blog_posts: '/blog',
  events: '/events',
  stories: '/stories',
  opportunities: '/opportunities',
  public_profiles: '/people',
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
                  Monitor database tables, content freshness, and scraper status
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
              </div>

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

              {/* Table Grid */}
              <div className="bg-white border-2 border-black overflow-hidden">
                <div className="bg-black text-white px-6 py-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  <h2 className="font-bold uppercase tracking-wider">Table Health Overview</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b-2 border-black">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Table</th>
                        <th className="px-4 py-3 text-right font-bold uppercase tracking-wider">Records</th>
                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Last Updated</th>
                        <th className="px-4 py-3 text-center font-bold uppercase tracking-wider w-20">Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.tables
                        .sort((a, b) => {
                          const order = { red: 0, yellow: 1, green: 2 };
                          return order[a.healthScore] - order[b.healthScore];
                        })
                        .map((table, idx) => {
                          const health = HEALTH_COLORS[table.healthScore];
                          const HealthIcon = health.icon;
                          const link = TABLE_LINKS[table.name];

                          return (
                            <tr key={table.name} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                              <td className="px-4 py-3">
                                <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold ${health.bg} ${health.text} border ${health.border}`}>
                                  <HealthIcon className="w-3 h-3" />
                                  {health.label}
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono font-medium">
                                {table.name}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold">
                                {table.count === 0 ? (
                                  <span className="text-red-500">0</span>
                                ) : (
                                  table.count.toLocaleString()
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {table.lastUpdated ? (
                                  <div className="flex items-center gap-1 text-gray-600">
                                    <Clock className="w-3 h-3" />
                                    <span className="font-mono text-xs">{timeAgo(table.lastUpdated)}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {link && (
                                  <Link
                                    href={link}
                                    className="inline-flex items-center justify-center w-8 h-8 border border-black hover:bg-black hover:text-white transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
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
