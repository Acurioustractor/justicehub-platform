'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  Database, Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, FileText,
  Building2, MapPin, Microscope, BookOpen, Link2, RefreshCw, ChevronRight, BarChart3,
  AlertCircle, Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Stats {
  totals: { services: number; organizations: number; registeredServices: number; profiles: number; stories: number; evidence: number; interventions: number; discoveredLinks: number; ingestionJobs: number; scrapedServices: number; dataSources: number; };
  byState: Record<string, number>;
  byOrgType: Record<string, number>;
  byEvidenceType: Record<string, number>;
  linkStatus: Record<string, number>;
  jobStatus: Record<string, number>;
  recentActivity: { services: number; organizations: number; evidence: number; };
  lastUpdated: string;
}

interface Source {
  id: string;
  name: string;
  type: string;
  pipeline?: 'directory' | 'programs' | 'alma' | 'sync';
  lifecycle?: 'canonical' | 'supporting' | 'legacy';
  legacy?: boolean;
  compatibilityOnly?: boolean;
  canonicalPipeline?: 'directory' | 'programs' | 'alma' | 'sync';
  canonicalTable?: string | null;
  table: string;
  count: number;
  lastUpdated: string | null;
  status: 'healthy' | 'stale' | 'empty';
  description: string;
}
interface Alert { id: string; type: 'warning' | 'error' | 'info'; category: string; message: string; detail: string | null; count: number | null; table: string | null; }
interface TimelineDay { date: string; services: number; organizations: number; evidence: number; interventions: number; links: number; total: number; }

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#4f46e5'];

export default function DataOperationsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchData() {
    setRefreshing(true);
    try {
      const [statsRes, sourcesRes, alertsRes, timelineRes] = await Promise.all([
        fetch('/api/admin/data-operations/stats'),
        fetch('/api/admin/data-operations/sources'),
        fetch('/api/admin/data-operations/alerts'),
        fetch('/api/admin/data-operations/timeline?days=30'),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (sourcesRes.ok) setSources((await sourcesRes.json()).sources);
      if (alertsRes.ok) setAlerts((await alertsRes.json()).alerts);
      if (timelineRes.ok) setTimeline((await timelineRes.json()).daily);
    } catch (error) { console.error('Error fetching data:', error); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { fetchData(); }, []);

  const totalRecords = stats ? Object.values(stats.totals).reduce((a, b) => a + b, 0) : 0;
  const stateChartData = stats ? Object.entries(stats.byState).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value) : [];
  const evidenceChartData = stats ? Object.entries(stats.byEvidenceType).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value) : [];

  const getStatusIcon = (status: string) => {
    if (status === 'healthy') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'stale') return <Clock className="w-4 h-4 text-yellow-600" />;
    if (status === 'empty') return <AlertTriangle className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-400" />;
  };

  const getAlertIcon = (type: string) => {
    if (type === 'error') return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (type === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <Info className="w-5 h-5 text-blue-600" />;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      directory: <MapPin className="w-5 h-5" />,
      programs: <FileText className="w-5 h-5" />,
      alma: <Microscope className="w-5 h-5" />,
      sync: <RefreshCw className="w-5 h-5" />,
    };
    return icons[type] || <Database className="w-5 h-5" />;
  };

  if (loading) return (<div className="min-h-screen bg-gray-50"><Navigation /><main className="pt-32 pb-16"><div className="container-justice"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div></div></main><Footer /></div>);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="pt-32 pb-16">
        <div className="container-justice">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-black text-white"><Database className="w-6 h-6" /></div>
                <h1 className="text-4xl font-black">Data Operations</h1>
              </div>
              <p className="text-gray-600">Monitor all data sources, track health, and identify expansion opportunities</p>
            </div>
            <button onClick={fetchData} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh
            </button>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" />System Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="border-2 border-black bg-white p-4"><div className="text-3xl font-black text-blue-600">{stats?.totals.services.toLocaleString()}</div><div className="text-sm font-medium">Services</div><div className="text-xs text-gray-500">Directory entries</div></div>
              <div className="border-2 border-black bg-white p-4"><div className="text-3xl font-black text-purple-600">{stats?.totals.organizations.toLocaleString()}</div><div className="text-sm font-medium">Organizations</div><div className="text-xs text-gray-500">Partners & groups</div></div>
              <div className="border-2 border-black bg-white p-4"><div className="text-3xl font-black text-green-600">{stats?.totals.registeredServices}</div><div className="text-sm font-medium">Programs</div><div className="text-xs text-gray-500">Curated & verified</div></div>
              <div className="border-2 border-black bg-white p-4"><div className="text-3xl font-black text-ochre-600">{stats?.totals.evidence}</div><div className="text-sm font-medium">Evidence</div><div className="text-xs text-gray-500">Research studies</div></div>
              <div className="border-2 border-black bg-white p-4"><div className="text-3xl font-black text-red-600">{stats?.totals.interventions.toLocaleString()}</div><div className="text-sm font-medium">Interventions</div><div className="text-xs text-gray-500">ALMA library</div></div>
              <div className="border-2 border-black bg-white p-4"><div className="text-3xl font-black text-cyan-600">{stats?.totals.discoveredLinks.toLocaleString()}</div><div className="text-sm font-medium">Links Queue</div><div className="text-xs text-gray-500">Pending scrape</div></div>
            </div>
            <div className="mt-4 p-4 border-2 border-black bg-white">
              <div className="flex items-center justify-between">
                <div><span className="text-sm text-gray-600">Total Records: </span><span className="text-2xl font-black">{totalRecords.toLocaleString()}</span></div>
                <div className="text-sm text-gray-500">Last updated: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'N/A'}</div>
              </div>
            </div>
          </section>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" />30-Day Activity</h2>
              <div className="border-2 border-black bg-white p-4 h-[300px]">
                {timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeline.slice(-30)}><XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} /><YAxis tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ border: '2px solid black', borderRadius: 0 }} /><Bar dataKey="total" fill="#2563eb" name="Total" /></BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-gray-500">No activity data</div>}
              </div>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" />Services by State</h2>
              <div className="border-2 border-black bg-white p-4 h-[300px]">
                {stateChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={stateChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>{stateChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-gray-500">No state data</div>}
              </div>
            </section>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Database className="w-5 h-5" />Data Sources</h2>
            <div className="border-2 border-black bg-white overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-black"><tr><th className="text-left px-4 py-3 font-bold">Source</th><th className="text-left px-4 py-3 font-bold">Pipeline</th><th className="text-left px-4 py-3 font-bold">Lifecycle</th><th className="text-right px-4 py-3 font-bold">Records</th><th className="text-left px-4 py-3 font-bold">Last Updated</th><th className="text-left px-4 py-3 font-bold">Status</th></tr></thead>
                <tbody>
                  {sources.map((source, i) => (
                    <tr key={source.id} className={`border-b ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="p-2 bg-gray-100 border border-gray-200">{getTypeIcon(source.type)}</div><div><div className="font-bold">{source.name}</div><div className="text-xs text-gray-500">{source.description}</div></div></div></td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-100 text-xs font-medium uppercase">{source.pipeline || source.type}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 text-xs font-medium uppercase w-fit ${source.lifecycle === 'legacy' ? 'bg-yellow-100 text-yellow-800' : source.lifecycle === 'supporting' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {source.lifecycle || 'canonical'}
                          </span>
                          {source.compatibilityOnly && (
                            <span className="text-[10px] text-gray-600">
                              Compat only → {(source.canonicalPipeline || source.pipeline || source.type)}:{source.canonicalTable || source.table}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">{source.count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{source.lastUpdated ? new Date(source.lastUpdated).toLocaleDateString() : 'Never'}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2">{getStatusIcon(source.status)}<span className="text-sm capitalize">{source.status}</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Microscope className="w-5 h-5" />Evidence by Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {evidenceChartData.map((item, i) => (<div key={item.name} className="border-2 border-black bg-white p-3" style={{ borderLeftColor: COLORS[i % COLORS.length], borderLeftWidth: 4 }}><div className="text-2xl font-black">{item.value}</div><div className="text-xs font-medium truncate" title={item.name}>{item.name}</div></div>))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5" />Alerts & Issues{alerts.length > 0 && <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-sm font-medium">{alerts.length}</span>}</h2>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`border-2 border-black p-4 flex items-start gap-4 ${alert.type === 'error' ? 'bg-red-50' : alert.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'}`}>
                    {getAlertIcon(alert.type)}
                    <div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="font-bold">{alert.message}</span><span className="px-2 py-0.5 bg-white border text-xs">{alert.category}</span></div><p className="text-sm text-gray-700">{alert.detail}</p>{alert.table && <Link href={`/admin/${alert.table}`} className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 hover:underline">View table<ChevronRight className="w-3 h-3" /></Link>}</div>
                    {alert.count !== null && <div className="text-2xl font-black text-gray-400">{alert.count}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-black bg-green-50 p-8 text-center"><CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" /><p className="font-bold text-green-800">All systems healthy</p><p className="text-sm text-green-600">No alerts or issues detected</p></div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <Link href="/admin/services" className="border-2 border-black bg-white p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"><MapPin className="w-6 h-6 mb-2" /><div className="font-bold">Manage Services</div><div className="text-sm text-gray-600">View and edit service directory</div></Link>
              <Link href="/admin/organizations" className="border-2 border-black bg-white p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"><Building2 className="w-6 h-6 mb-2" /><div className="font-bold">Manage Organizations</div><div className="text-sm text-gray-600">Partner orgs and basecamps</div></Link>
              <Link href="/intelligence/evidence" className="border-2 border-black bg-white p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"><Microscope className="w-6 h-6 mb-2" /><div className="font-bold">Evidence Library</div><div className="text-sm text-gray-600">Research and studies</div></Link>
              <Link href="/community-programs" className="border-2 border-black bg-white p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"><FileText className="w-6 h-6 mb-2" /><div className="font-bold">Community Programs</div><div className="text-sm text-gray-600">Curated program profiles</div></Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
