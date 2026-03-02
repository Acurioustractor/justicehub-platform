'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import {
  FundingDiscoveryShortlistButton,
  FundingDiscoveryShortlistLink,
} from '@/components/funding/funding-discovery-shortlist';
import { ArrowLeft, Compass, RefreshCw, Search, ShieldCheck, Target } from 'lucide-react';

interface DiscoveryOrganization {
  id: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug?: string | null;
    type?: string | null;
    state?: string | null;
    city?: string | null;
    description?: string | null;
  } | null;
  capabilityTags: string[];
  serviceGeographies: string[];
  priorityPopulations: string[];
  operatingModels: string[];
  firstNationsLed: boolean;
  livedExperienceLed: boolean;
  fundingReadinessScore: number;
  complianceReadinessScore: number;
  deliveryConfidenceScore: number;
  communityTrustScore: number;
  evidenceMaturityScore: number;
  reportingToCommunityScore: number;
  canManageGovernmentContracts: boolean;
  canManagePhilanthropicGrants: boolean;
  capabilityNotes?: string | null;
  updatedAt?: string | null;
  topMatches: Array<{
    id: string;
    matchScore: number;
    status: string;
    opportunity?: {
      id: string;
      name?: string | null;
      funder_name?: string | null;
      source_type?: string | null;
      deadline?: string | null;
      status?: string | null;
      max_grant_amount?: number | null;
    } | null;
  }>;
  topMatchCount: number;
  strongestMatchScore: number;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value);
}

function scoreClass(score: number) {
  if (score >= 85) return 'bg-emerald-100 text-emerald-800';
  if (score >= 70) return 'bg-blue-100 text-blue-800';
  return 'bg-amber-100 text-amber-800';
}

export default function FundingDiscoveryPage() {
  const [items, setItems] = useState<DiscoveryOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [capabilityTag, setCapabilityTag] = useState('');
  const [minReadiness, setMinReadiness] = useState('60');
  const [minTrust, setMinTrust] = useState('60');
  const [firstNationsOnly, setFirstNationsOnly] = useState(false);

  const fetchDiscovery = async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', '24');
      if (q.trim()) params.set('q', q.trim());
      if (stateFilter !== 'all') params.set('state', stateFilter);
      if (capabilityTag.trim()) params.set('capabilityTag', capabilityTag.trim());
      if (minReadiness.trim()) params.set('minReadiness', minReadiness.trim());
      if (minTrust.trim()) params.set('minTrust', minTrust.trim());
      if (firstNationsOnly) params.set('firstNationsLed', 'true');

      const response = await fetch(`/api/funding/discovery?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load funder discovery');
      }

      setItems(payload.data || []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load funder discovery');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiscovery();
  }, [q, stateFilter, capabilityTag, minReadiness, minTrust, firstNationsOnly]);

  const summary = useMemo(() => {
    const strongest = items.filter((item) => item.strongestMatchScore >= 80).length;
    const avgTrust =
      items.length > 0
        ? Math.round(
            items.reduce((sum, item) => sum + item.communityTrustScore, 0) / items.length
          )
        : 0;
    const govReady = items.filter((item) => item.canManageGovernmentContracts).length;

    return {
      total: items.length,
      strongest,
      avgTrust,
      govReady,
    };
  }, [items]);

  return (
    <div className="min-h-screen bg-[#f5f6f2] page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="flex flex-col gap-6 mb-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/admin/funding/os"
                prefetch={false}
                className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Funding OS Review
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-[#0f766e] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Funder Discovery</h1>
                  <p className="text-base text-gray-600">
                    Search capability-rich community organizations and see where current funding matches are strongest.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <FundingDiscoveryShortlistLink />
              <button
                onClick={() => fetchDiscovery(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Discovery
              </button>
            </div>
          </div>

          {error && (
            <div className="border-2 border-red-500 bg-red-50 text-red-800 p-4 mb-6 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Visible Orgs</div>
              <div className="text-4xl font-black text-black">{summary.total}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Strong Match Pool</div>
              <div className="text-4xl font-black text-emerald-700">{summary.strongest}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Average Trust</div>
              <div className="text-4xl font-black text-blue-700">{summary.avgTrust}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Gov Contract Ready</div>
              <div className="text-4xl font-black text-[#0f766e]">{summary.govReady}</div>
            </div>
          </div>

          <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            <div className="px-5 py-4 border-b-2 border-black bg-[#f8fafc]">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                <label className="text-xs font-bold text-gray-700">
                  Search
                  <div className="mt-1 flex items-center gap-2 rounded-none border-2 border-black bg-white px-3 py-2">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                      value={q}
                      onChange={(event) => setQ(event.target.value)}
                      placeholder="Name, place, capability"
                      className="w-full bg-transparent text-sm font-medium outline-none"
                    />
                  </div>
                </label>
                <label className="text-xs font-bold text-gray-700">
                  State
                  <select
                    value={stateFilter}
                    onChange={(event) => setStateFilter(event.target.value)}
                    className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="all">All states</option>
                    <option value="NSW">NSW</option>
                    <option value="QLD">QLD</option>
                    <option value="VIC">VIC</option>
                    <option value="WA">WA</option>
                    <option value="SA">SA</option>
                    <option value="NT">NT</option>
                    <option value="ACT">ACT</option>
                    <option value="TAS">TAS</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-gray-700">
                  Capability Tag
                  <input
                    value={capabilityTag}
                    onChange={(event) => setCapabilityTag(event.target.value)}
                    placeholder="youth_justice"
                    className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                  />
                </label>
                <label className="text-xs font-bold text-gray-700">
                  Min Readiness
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={minReadiness}
                    onChange={(event) => setMinReadiness(event.target.value)}
                    className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                  />
                </label>
                <label className="text-xs font-bold text-gray-700">
                  Min Trust
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={minTrust}
                    onChange={(event) => setMinTrust(event.target.value)}
                    className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                  />
                </label>
                <label className="flex items-end gap-3 text-xs font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={firstNationsOnly}
                    onChange={(event) => setFirstNationsOnly(event.target.checked)}
                    className="h-4 w-4 rounded-none border-2 border-black"
                  />
                  <span className="pb-2">First Nations led only</span>
                </label>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {loading ? (
              <div className="xl:col-span-2 border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Loading funder discovery…
              </div>
            ) : items.length === 0 ? (
              <div className="xl:col-span-2 border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                No organizations match this search yet.
              </div>
            ) : (
              items.map((item) => (
                <article
                  key={item.id}
                  className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h2 className="text-2xl font-black text-black">
                          {item.organization?.name || 'Organization'}
                        </h2>
                        {item.firstNationsLed && (
                          <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#fff7ed] text-[#9a3412]">
                            First Nations led
                          </span>
                        )}
                        {item.livedExperienceLed && (
                          <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#eef4ff] text-[#1d4ed8]">
                            Lived experience led
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {[item.organization?.type, item.organization?.city, item.organization?.state]
                          .filter(Boolean)
                          .join(' • ') || 'Community organization'}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 text-xs font-black border border-black ${scoreClass(item.strongestMatchScore)}`}>
                        Strongest match {item.strongestMatchScore}
                      </span>
                      <span className={`px-2 py-1 text-xs font-black border border-black ${scoreClass(item.communityTrustScore)}`}>
                        Trust {item.communityTrustScore}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-[11px]">
                    <div className="border border-gray-200 bg-gray-50 p-3">
                      <div className="font-bold text-gray-600">Readiness</div>
                      <div className="text-lg font-black text-black">{item.fundingReadinessScore}</div>
                    </div>
                    <div className="border border-gray-200 bg-gray-50 p-3">
                      <div className="font-bold text-gray-600">Delivery</div>
                      <div className="text-lg font-black text-black">{item.deliveryConfidenceScore}</div>
                    </div>
                    <div className="border border-gray-200 bg-gray-50 p-3">
                      <div className="font-bold text-gray-600">Community</div>
                      <div className="text-lg font-black text-black">{item.reportingToCommunityScore}</div>
                    </div>
                    <div className="border border-gray-200 bg-gray-50 p-3">
                      <div className="font-bold text-gray-600">Top Matches</div>
                      <div className="text-lg font-black text-black">{item.topMatchCount}</div>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {item.capabilityTags.slice(0, 6).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-[11px] font-bold border border-black bg-white"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="border border-gray-200 bg-[#f8fafc] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-[#0f766e]" />
                        <div className="text-sm font-black text-black">Operating Readiness</div>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Government contracts: {item.canManageGovernmentContracts ? 'Yes' : 'No'}</div>
                        <div>Philanthropic grants: {item.canManagePhilanthropicGrants ? 'Yes' : 'No'}</div>
                        <div>Service geographies: {item.serviceGeographies.slice(0, 4).join(', ') || '—'}</div>
                      </div>
                    </div>
                    <div className="border border-gray-200 bg-[#f8fafc] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-[#1d4ed8]" />
                        <div className="text-sm font-black text-black">Current Match Signals</div>
                      </div>
                      <div className="space-y-2">
                        {item.topMatches.length === 0 ? (
                          <div className="text-xs text-gray-500">No current recommendation signals yet.</div>
                        ) : (
                          item.topMatches.map((match) => (
                            <div key={`${item.id}-${match.id}`} className="border border-gray-200 bg-white p-3">
                              <div className="flex items-center justify-between gap-3 mb-1">
                                <div className="text-xs font-black text-black">
                                  {match.opportunity?.name || 'Funding opportunity'}
                                </div>
                                <span className={`px-2 py-1 text-[10px] font-black border border-black ${scoreClass(match.matchScore)}`}>
                                  {match.matchScore}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-600">
                                {[match.opportunity?.funder_name, match.opportunity?.status]
                                  .filter(Boolean)
                                  .join(' • ') || 'Recommendation signal'}
                              </div>
                              <div className="text-[11px] text-gray-500 mt-1">
                                Deadline {formatDate(match.opportunity?.deadline)} • Max {formatCurrency(match.opportunity?.max_grant_amount)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t-2 border-dashed border-gray-200 pt-4">
                    <div className="text-xs text-gray-500">
                      Profile updated {formatDate(item.updatedAt)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <FundingDiscoveryShortlistButton
                        organizationId={item.organizationId}
                        compact
                      />
                      <Link
                        href={`/funding/discovery/${item.organizationId}`}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                      >
                        View organization detail
                      </Link>
                    </div>
                  </div>

                  {item.capabilityNotes && (
                    <div className="text-xs text-gray-600 border-t-2 border-dashed border-gray-200 pt-4 mt-4">
                      {item.capabilityNotes}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
