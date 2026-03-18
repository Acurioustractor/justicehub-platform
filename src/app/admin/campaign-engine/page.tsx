'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Loader2,
  Users,
  Target,
  HandshakeIcon,
  DollarSign,
  Landmark,
  Eye,
  Zap,
  Search,
  ChevronDown,
  ChevronRight,
  Building2,
  User,
  XCircle,
  RefreshCw,
  Heart,
  MapPin,
  Shield,
  Plus,
  Link as LinkIcon,
} from 'lucide-react';

interface Entity {
  id: string;
  entity_type: 'person' | 'organization';
  name: string;
  organization: string | null;
  position: string | null;
  email: string | null;
  website: string | null;
  acnc_abn: string | null;
  justice_alignment_score: number;
  reach_influence_score: number;
  accessibility_score: number;
  composite_score: number;
  alignment_category: string;
  campaign_list: string;
  alignment_signals: Array<{ type: string; detail: string }>;
  warm_paths: Array<{ via: string; org: string; abn?: string; comment?: string }>;
  funding_history: Array<{ total: number; grants: number }>;
  outreach_status: string;
  ghl_contact_id: string | null;
  score_confidence: string;
  last_scored_at: string;
  passion_score?: number;
  engagement_signals?: Array<{ type: string; snippet: string }>;
  political_donations_summary?: Record<string, unknown>;
  conflict_score?: number;
}

interface Stats {
  total: number;
  by_category: Record<string, number>;
  by_list: Record<string, number>;
  by_outreach: Record<string, number>;
  by_type: Record<string, number>;
  last_run: {
    started_at: string;
    completed_at: string;
    status: string;
    orgs_scored: number;
    persons_scored: number;
  } | null;
}

interface SocialProofData {
  supporters: Array<Entity & { comment: string }>;
  total_scored: number;
  offers_count: number;
  location_demand: Array<{ location: string; count: number }>;
}

interface TrackedPost {
  id: string;
  post_url: string;
  campaign_slug: string;
  last_scraped_at: string | null;
  total_comments: number;
  is_active: boolean;
}

const CAMPAIGN_LISTS = [
  { key: 'allies_to_activate', label: 'Allies to Activate', icon: Zap, color: 'text-emerald-600' },
  { key: 'funders_to_pitch', label: 'Funders to Pitch', icon: DollarSign, color: 'text-blue-600' },
  { key: 'decision_makers', label: 'Decision Makers', icon: Landmark, color: 'text-purple-600' },
  { key: 'opponents_to_understand', label: 'Opponents', icon: Eye, color: 'text-red-600' },
  { key: 'warm_intros', label: 'Warm Intros', icon: HandshakeIcon, color: 'text-amber-600' },
] as const;

type ViewMode = 'lists' | 'social_proof' | 'tracked_posts';

const CATEGORY_COLORS: Record<string, string> = {
  ally: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  potential_ally: 'bg-blue-100 text-blue-800 border-blue-300',
  neutral: 'bg-gray-100 text-gray-700 border-gray-300',
  opponent: 'bg-red-100 text-red-800 border-red-300',
  unknown: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-red-50 text-red-700',
};

export default function CampaignEnginePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [totalEntities, setTotalEntities] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeList, setActiveList] = useState('allies_to_activate');
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('lists');
  const [socialProof, setSocialProof] = useState<SocialProofData | null>(null);
  const [socialProofLoading, setSocialProofLoading] = useState(false);
  const [trackedPosts, setTrackedPosts] = useState<TrackedPost[]>([]);
  const [trackedPostsLoading, setTrackedPostsLoading] = useState(false);
  const [newPostUrl, setNewPostUrl] = useState('');

  const fetchStats = async () => {
    const res = await fetch('/api/admin/campaign-alignment/stats');
    if (!res.ok) throw new Error(res.status === 401 ? 'Not authenticated' : res.status === 403 ? 'Not authorized' : 'Failed');
    return res.json();
  };

  const fetchList = async (list: string, searchQ?: string, type?: string) => {
    const params = new URLSearchParams({ list, limit: '100' });
    if (searchQ) params.set('search', searchQ);
    if (type) params.set('entity_type', type);
    const res = await fetch(`/api/admin/campaign-alignment/lists?${params}`);
    if (!res.ok) throw new Error('Failed to fetch list');
    return res.json();
  };

  const fetchSocialProof = async () => {
    setSocialProofLoading(true);
    try {
      const res = await fetch('/api/admin/campaign-alignment/social-proof?limit=20');
      if (!res.ok) throw new Error('Failed to fetch social proof');
      const data = await res.json();
      setSocialProof(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load social proof');
    } finally {
      setSocialProofLoading(false);
    }
  };

  const fetchTrackedPosts = async () => {
    setTrackedPostsLoading(true);
    try {
      const res = await fetch('/api/admin/campaign-alignment/tracked-posts');
      if (!res.ok) throw new Error('Failed to fetch tracked posts');
      const data = await res.json();
      setTrackedPosts(data.posts || []);
    } catch {
      // Silently fail — table may not exist yet
    } finally {
      setTrackedPostsLoading(false);
    }
  };

  const addTrackedPost = async () => {
    if (!newPostUrl.trim()) return;
    try {
      const res = await fetch('/api/admin/campaign-alignment/tracked-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_url: newPostUrl.trim() }),
      });
      if (!res.ok) throw new Error('Failed to add post');
      setNewPostUrl('');
      fetchTrackedPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add post');
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      const [statsData, listData] = await Promise.all([
        fetchStats(),
        fetchList(activeList, search || undefined, entityType || undefined),
      ]);
      setStats(statsData);
      setEntities(listData.entities);
      setTotalEntities(listData.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading) {
      fetchList(activeList, search || undefined, entityType || undefined)
        .then(data => { setEntities(data.entities); setTotalEntities(data.total); })
        .catch(() => {});
    }
  }, [activeList, search, entityType]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (viewMode === 'social_proof' && !socialProof) fetchSocialProof();
    if (viewMode === 'tracked_posts' && trackedPosts.length === 0) fetchTrackedPosts();
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const runScoring = async () => {
    if (scoring) return;
    setScoring(true);
    try {
      const res = await fetch('/api/admin/campaign-alignment/score', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scoring failed');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scoring failed');
    } finally {
      setScoring(false);
    }
  };

  const runEnrichment = async () => {
    if (enriching) return;
    setEnriching(true);
    setEnrichResult(null);
    try {
      const res = await fetch('/api/admin/campaign-alignment/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enrichment failed');
      setEnrichResult(
        `Scraped ${data.orgs_scraped} orgs — found ${data.persons_found} people (${data.persons_created} new, ${data.persons_updated} updated)`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrichment failed');
    } finally {
      setEnriching(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Type', 'Organization', 'Position', 'Email', 'Category', 'List', 'Alignment', 'Influence', 'Accessibility', 'Composite', 'Passion', 'Confidence', 'Outreach'];
    const rows = entities.map(e => [
      e.name, e.entity_type, e.organization || '', e.position || '', e.email || '',
      e.alignment_category, e.campaign_list, e.justice_alignment_score, e.reach_influence_score,
      e.accessibility_score, e.composite_score, e.passion_score || 0, e.score_confidence, e.outreach_status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${activeList}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-bold mb-2">{error}</p>
          <Link href="/admin" className="text-blue-600 underline">Back to Admin</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-2">
              <ArrowLeft className="w-4 h-4" /> Admin
            </Link>
            <h1 className="text-3xl font-black tracking-tight">CAMPAIGN ALIGNMENT ENGINE</h1>
            <p className="text-gray-500 mt-1">
              Cross-referencing {stats?.total?.toLocaleString() || 0} entities across 2.7M public records
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-sm font-bold hover:bg-gray-50">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={runEnrichment}
              disabled={enriching}
              className="flex items-center gap-2 px-4 py-2 border border-purple-300 bg-purple-50 text-purple-800 font-bold text-sm hover:bg-purple-100 disabled:opacity-50"
            >
              {enriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              {enriching ? 'Enriching...' : 'Enrich Leaders'}
            </button>
            <button
              onClick={runScoring}
              disabled={scoring}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {scoring ? 'Scoring...' : 'Run Scoring'}
            </button>
          </div>
        </div>

        {/* Last run info */}
        {stats?.last_run && (
          <div className="text-xs text-gray-400 mb-4">
            Last scored: {new Date(stats.last_run.completed_at || stats.last_run.started_at).toLocaleString('en-AU')}
            {' — '}{stats.last_run.orgs_scored.toLocaleString()} orgs + {stats.last_run.persons_scored.toLocaleString()} persons
            {stats.last_run.status === 'failed' && <span className="text-red-500 ml-2">(FAILED)</span>}
          </div>
        )}

        {/* Enrichment result */}
        {enrichResult && (
          <div className="bg-purple-50 border border-purple-200 px-4 py-3 mb-4 text-sm text-purple-800 flex items-center justify-between">
            <span>{enrichResult}</span>
            <button onClick={() => setEnrichResult(null)} className="text-purple-400 hover:text-purple-600 ml-4">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error banner */}
        {error && stats && (
          <div className="bg-red-50 border border-red-200 px-4 py-3 mb-4 text-sm text-red-800 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stat Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
            {[
              { label: 'Total', value: stats.total, icon: Users },
              { label: 'Allies', value: stats.by_category.ally || 0, icon: Target },
              { label: 'Potential', value: stats.by_category.potential_ally || 0, icon: HandshakeIcon },
              { label: 'Funders', value: stats.by_list.funders_to_pitch || 0, icon: DollarSign },
              { label: 'Decisions', value: stats.by_list.decision_makers || 0, icon: Landmark },
              { label: 'Warm Intros', value: stats.by_list.warm_intros || 0, icon: HandshakeIcon },
              { label: 'Orgs', value: stats.by_type.organization || 0, icon: Building2 },
              { label: 'Persons', value: stats.by_type.person || 0, icon: User },
            ].map(card => (
              <div key={card.label} className="bg-white border border-gray-200 p-4 text-center">
                <card.icon className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                <div className="text-2xl font-black">{card.value.toLocaleString()}</div>
                <div className="text-xs text-gray-500 font-medium">{card.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 pb-2">
          {[
            { key: 'lists' as ViewMode, label: 'Campaign Lists', icon: Users },
            { key: 'social_proof' as ViewMode, label: 'Social Proof', icon: Heart },
            { key: 'tracked_posts' as ViewMode, label: 'Tracked Posts', icon: LinkIcon },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                viewMode === tab.key
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* === LISTS VIEW === */}
        {viewMode === 'lists' && (
          <>
            {/* Campaign List Tabs */}
            <div className="flex gap-1 mb-6 overflow-x-auto">
              {CAMPAIGN_LISTS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveList(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-bold whitespace-nowrap border transition-colors ${
                    activeList === tab.key
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeList === tab.key ? 'text-white' : tab.color}`} />
                  {tab.label}
                  {stats?.by_list[tab.key] ? (
                    <span className={`ml-1 text-xs ${activeList === tab.key ? 'text-gray-300' : 'text-gray-400'}`}>
                      ({(stats.by_list[tab.key] || 0).toLocaleString()})
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, organization, or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                />
              </div>
              <select
                value={entityType}
                onChange={e => setEntityType(e.target.value)}
                className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
              >
                <option value="">All Types</option>
                <option value="organization">Organizations</option>
                <option value="person">Persons</option>
              </select>
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-500 mb-3">
              Showing {entities.length} of {totalEntities} entities
            </div>

            {/* Entity Table */}
            <div className="bg-white border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="w-8 px-2"></th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">Entity</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">Category</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600">Alignment</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600">Influence</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600">Access</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600">Composite</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600">Passion</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">Confidence</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">Outreach</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.map(entity => (
                    <EntityRow key={entity.id} entity={entity} expandedRow={expandedRow} setExpandedRow={setExpandedRow} isOpponentView={activeList === 'opponents_to_understand'} />
                  ))}
                  {entities.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                        {stats?.total === 0 ? 'No entities scored yet. Click "Run Scoring" to begin.' : 'No entities found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* === SOCIAL PROOF VIEW === */}
        {viewMode === 'social_proof' && (
          <SocialProofView data={socialProof} loading={socialProofLoading} onRefresh={fetchSocialProof} />
        )}

        {/* === TRACKED POSTS VIEW === */}
        {viewMode === 'tracked_posts' && (
          <TrackedPostsView
            posts={trackedPosts}
            loading={trackedPostsLoading}
            newPostUrl={newPostUrl}
            setNewPostUrl={setNewPostUrl}
            onAdd={addTrackedPost}
            onRefresh={fetchTrackedPosts}
          />
        )}
      </div>
    </div>
  );
}

function EntityRow({ entity, expandedRow, setExpandedRow, isOpponentView }: {
  entity: Entity;
  expandedRow: string | null;
  setExpandedRow: (id: string | null) => void;
  isOpponentView: boolean;
}) {
  const isExpanded = expandedRow === entity.id;
  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpandedRow(isExpanded ? null : entity.id)}
      >
        <td className="px-2 text-gray-400">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {entity.entity_type === 'organization'
              ? <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              : <User className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            <div>
              <div className="font-medium text-black flex items-center gap-2">
                {entity.name}
                {isOpponentView && entity.alignment_signals?.some(s => s.detail?.includes('detention contractor')) && (
                  <span className="inline-flex px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white uppercase">Detention</span>
                )}
              </div>
              {entity.organization && entity.entity_type === 'person' && (
                <div className="text-gray-500 text-xs">{entity.position ? `${entity.position} @ ` : ''}{entity.organization}</div>
              )}
              {entity.email && <div className="text-gray-400 text-xs">{entity.email}</div>}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium border ${CATEGORY_COLORS[entity.alignment_category] || CATEGORY_COLORS.unknown}`}>
            {entity.alignment_category.replace('_', ' ')}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <ScoreBar value={entity.justice_alignment_score} max={100} color="emerald" />
        </td>
        <td className="px-4 py-3 text-center">
          <ScoreBar value={entity.reach_influence_score} max={100} color="blue" />
        </td>
        <td className="px-4 py-3 text-center">
          <ScoreBar value={entity.accessibility_score} max={100} color="amber" />
        </td>
        <td className="px-4 py-3 text-center font-bold">{entity.composite_score}</td>
        <td className="px-4 py-3 text-center">
          {(entity.passion_score || 0) > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
              <Heart className="w-3 h-3" /> {entity.passion_score}
            </span>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium ${CONFIDENCE_COLORS[entity.score_confidence] || ''}`}>
            {entity.score_confidence}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">{entity.outreach_status}</td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-gray-200 bg-gray-50">
          <td colSpan={10} className="px-8 py-4">
            <ExpandedDetails entity={entity} isOpponentView={isOpponentView} />
          </td>
        </tr>
      )}
    </>
  );
}

function SocialProofView({ data, loading, onRefresh }: { data: SocialProofData | null; loading: boolean; onRefresh: () => void }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data || data.supporters.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-bold mb-2">No passion scores yet</p>
        <p className="text-sm">Run the passion scoring script first:</p>
        <code className="text-xs mt-2 block text-gray-500">node scripts/score-engagement-passion.mjs</code>
      </div>
    );
  }

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6 text-sm">
          <span className="font-bold">{data.total_scored} scored</span>
          <span className="text-rose-600 font-medium">{data.offers_count} offered to help</span>
        </div>
        <button onClick={onRefresh} className="text-sm text-gray-500 hover:text-black flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Location demand */}
      {data.location_demand.length > 0 && (
        <div className="bg-white border border-gray-200 p-4 mb-6">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" /> Location Demand
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.location_demand.map(ld => (
              <span key={ld.location} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 text-sm">
                <span className="font-bold">{ld.location}</span>
                <span className="text-gray-400">({ld.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quote cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.supporters.map(s => (
          <div key={s.id} className="bg-white border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-black">{s.name}</div>
                {s.organization && (
                  <div className="text-xs text-gray-500">{s.position ? `${s.position} @ ` : ''}{s.organization}</div>
                )}
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-700 text-xs font-bold">
                <Heart className="w-3 h-3" /> {s.passion_score}
              </span>
            </div>
            {s.comment && (
              <blockquote className="text-sm text-gray-700 border-l-2 border-gray-200 pl-3 mb-3 italic line-clamp-4">
                &ldquo;{s.comment}&rdquo;
              </blockquote>
            )}
            <div className="flex flex-wrap gap-1.5">
              {(s.engagement_signals || []).map((sig, i) => {
                if (sig.type === 'engaged') return null;
                const badgeColors: Record<string, string> = {
                  offer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  location_demand: 'bg-blue-50 text-blue-700 border-blue-200',
                  substantive: 'bg-gray-50 text-gray-600 border-gray-200',
                  expertise: 'bg-purple-50 text-purple-700 border-purple-200',
                  tags_others: 'bg-amber-50 text-amber-700 border-amber-200',
                };
                const labels: Record<string, string> = {
                  offer: 'Offered to help',
                  location_demand: `Wants in ${sig.snippet}`,
                  substantive: 'Detailed comment',
                  expertise: 'Has expertise',
                  tags_others: 'Tagged others',
                };
                return (
                  <span key={i} className={`inline-flex px-2 py-0.5 text-[10px] font-medium border ${badgeColors[sig.type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {labels[sig.type] || sig.snippet}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrackedPostsView({ posts, loading, newPostUrl, setNewPostUrl, onAdd, onRefresh }: {
  posts: TrackedPost[];
  loading: boolean;
  newPostUrl: string;
  setNewPostUrl: (v: string) => void;
  onAdd: () => void;
  onRefresh: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold">Tracked LinkedIn Posts</h3>
        <button onClick={onRefresh} className="text-sm text-gray-500 hover:text-black flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Add post */}
      <div className="bg-white border border-gray-200 p-4 mb-6 flex gap-3">
        <input
          type="url"
          placeholder="Paste LinkedIn post URL..."
          value={newPostUrl}
          onChange={e => setNewPostUrl(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
          onKeyDown={e => e.key === 'Enter' && onAdd()}
        />
        <button
          onClick={onAdd}
          disabled={!newPostUrl.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold hover:bg-gray-800 disabled:opacity-30"
        >
          <Plus className="w-4 h-4" /> Add Post
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No tracked posts yet. Add a LinkedIn post URL above to start monitoring.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 divide-y divide-gray-100">
          {posts.map(post => (
            <div key={post.id} className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-black truncate">{post.post_url}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {post.total_comments} comments
                  {post.last_scraped_at && ` — last scraped ${new Date(post.last_scraped_at).toLocaleDateString('en-AU')}`}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium ${post.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {post.is_active ? 'Active' : 'Paused'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
  };
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[color] || 'bg-gray-500'} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 w-6 text-right">{value}</span>
    </div>
  );
}

function ExpandedDetails({ entity, isOpponentView }: { entity: Entity; isOpponentView: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
      {/* Alignment Signals */}
      <div>
        <h4 className="font-bold text-gray-700 mb-2">Alignment Signals</h4>
        {(!entity.alignment_signals || entity.alignment_signals.length === 0) ? (
          <p className="text-gray-400 text-xs">No signals</p>
        ) : (
          <ul className="space-y-1">
            {entity.alignment_signals.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 font-medium rounded text-[10px] uppercase flex-shrink-0">{s.type}</span>
                <span className="text-gray-700">{s.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Warm Paths / Opposition details */}
      <div>
        {isOpponentView && entity.political_donations_summary ? (
          <>
            <h4 className="font-bold text-red-700 mb-2 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Conflict Analysis
            </h4>
            <div className="space-y-1 text-xs">
              {entity.conflict_score != null && (
                <p className="text-red-700 font-bold">Conflict Score: {entity.conflict_score}</p>
              )}
              <pre className="text-gray-600 whitespace-pre-wrap text-[10px] bg-gray-100 p-2 rounded">
                {JSON.stringify(entity.political_donations_summary, null, 2)}
              </pre>
            </div>
          </>
        ) : (
          <>
            <h4 className="font-bold text-gray-700 mb-2">Warm Paths</h4>
            {(!entity.warm_paths || entity.warm_paths.length === 0) ? (
              <p className="text-gray-400 text-xs">No warm paths identified</p>
            ) : (
              <ul className="space-y-1">
                {entity.warm_paths.map((w, i) => (
                  <li key={i} className="text-xs text-gray-700">
                    Via <span className="font-medium">{w.via}</span>: {w.org}
                    {w.comment && (
                      <blockquote className="text-gray-500 italic mt-1 border-l-2 border-gray-200 pl-2 line-clamp-2">
                        &ldquo;{w.comment}&rdquo;
                      </blockquote>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Funding / Links */}
      <div>
        <h4 className="font-bold text-gray-700 mb-2">Details</h4>
        <div className="space-y-1 text-xs text-gray-600">
          {entity.acnc_abn && <p>ABN: {entity.acnc_abn}</p>}
          {entity.website && <p>Web: <a href={entity.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{entity.website}</a></p>}
          {entity.ghl_contact_id && <p className="text-emerald-600 font-medium">GHL Contact Linked</p>}
          {entity.funding_history && entity.funding_history.length > 0 && (
            <p>Funding: ${entity.funding_history[0].total?.toLocaleString()} ({entity.funding_history[0].grants} grants)</p>
          )}
          {entity.passion_score != null && entity.passion_score > 0 && (
            <p className="text-rose-600 font-medium">Passion Score: {entity.passion_score}</p>
          )}
        </div>
      </div>
    </div>
  );
}
