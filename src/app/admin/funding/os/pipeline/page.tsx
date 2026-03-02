'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  FileCheck2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface PipelineRecommendation {
  id: string;
  opportunity_id: string;
  organization_id: string;
  recommendation_status: string;
  match_score: number;
  readiness_score: number;
  community_alignment_score: number;
  geographic_fit_score: number;
  created_at: string;
}

interface PipelineApplication {
  id: string;
  status: string;
  amount_requested?: number | null;
  amount_awarded?: number | null;
  submitted_at?: string | null;
}

interface PipelineAward {
  id: string;
  award_status: string;
  award_type: string;
  amount_awarded: number;
  amount_disbursed: number;
  community_report_due_at?: string | null;
}

interface PipelineOpportunity {
  id: string;
  name: string;
  funder_name?: string | null;
  deadline?: string | null;
  status?: string | null;
  max_grant_amount?: number | null;
  min_grant_amount?: number | null;
}

interface PipelineOrganization {
  id: string;
  name: string;
  slug?: string | null;
  city?: string | null;
  state?: string | null;
  partner_tier?: string | null;
}

interface PipelineItem {
  recommendation: PipelineRecommendation;
  application: PipelineApplication | null;
  award: PipelineAward | null;
  opportunity: PipelineOpportunity | null;
  organization: PipelineOrganization | null;
  pipelineStage: 'award_live' | 'application_live' | 'recommendation_engaged' | 'recommendation_candidate';
  updatedAt: string;
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

function formatCurrency(amount?: number | null) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '—';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

const STAGE_META = {
  recommendation_candidate: {
    title: 'Candidate',
    description: 'Strong machine-identified matches not yet acted on',
    tone: 'bg-[#eef4ff] border-[#bfdbfe] text-[#1d4ed8]',
    icon: CircleDot,
  },
  recommendation_engaged: {
    title: 'Engaged',
    description: 'Recommendations promoted and actively being worked',
    tone: 'bg-[#fff7e6] border-[#fcd34d] text-[#b45309]',
    icon: Sparkles,
  },
  application_live: {
    title: 'Application',
    description: 'An application record exists and is moving',
    tone: 'bg-[#f3e8ff] border-[#d8b4fe] text-[#7e22ce]',
    icon: FileCheck2,
  },
  award_live: {
    title: 'Award',
    description: 'A tracked award placeholder or live award exists',
    tone: 'bg-[#e7f8ee] border-[#86efac] text-[#15803d]',
    icon: CheckCircle2,
  },
} as const;

function FundingOperatingSystemPipelinePageContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [activeActionKind, setActiveActionKind] = useState<string | null>(null);
  const requestedOrganizationId = (searchParams.get('organizationId') || '').trim();
  const requestedOpportunityId = (searchParams.get('opportunityId') || '').trim();

  const fetchData = async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', '120');
      if (requestedOrganizationId) {
        params.set('organizationId', requestedOrganizationId);
      }
      if (requestedOpportunityId) {
        params.set('opportunityId', requestedOpportunityId);
      }

      const response = await fetch(`/api/admin/funding/os/pipeline?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load funding pipeline');
      }
      const payload = await response.json();
      setItems(payload.data || []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load pipeline');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [requestedOrganizationId, requestedOpportunityId]);

  const runRecommendationAction = async (
    kind: 'engage' | 'promote' | 'rescore',
    recommendationId: string
  ) => {
    setError(null);
    setActiveActionId(recommendationId);
    setActiveActionKind(kind);

    try {
      const request =
        kind === 'engage'
          ? fetch('/api/admin/funding/os/matches/status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ recommendationId, status: 'engaged' }),
            })
          : kind === 'promote'
            ? fetch('/api/admin/funding/os/matches/promote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recommendationId }),
              })
            : fetch('/api/admin/funding/os/matches/rescore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recommendationId }),
              });

      const response = await request;
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update funding recommendation');
      }

      await fetchData(true);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Failed to update funding recommendation'
      );
    } finally {
      setActiveActionId(null);
      setActiveActionKind(null);
    }
  };

  const columns = useMemo(() => {
    return {
      recommendation_candidate: items.filter((item) => item.pipelineStage === 'recommendation_candidate'),
      recommendation_engaged: items.filter((item) => item.pipelineStage === 'recommendation_engaged'),
      application_live: items.filter((item) => item.pipelineStage === 'application_live'),
      award_live: items.filter((item) => item.pipelineStage === 'award_live'),
    };
  }, [items]);

  const stageOrder: Array<keyof typeof STAGE_META> = [
    'recommendation_candidate',
    'recommendation_engaged',
    'application_live',
    'award_live',
  ];

  return (
    <div className="min-h-screen bg-[#f5f6f2] page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="flex flex-col gap-6 mb-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/admin/funding/os"
                className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Funding OS Review
              </Link>
              <h1 className="text-4xl font-black text-black mb-2">Funding Pipeline Board</h1>
              <p className="text-base text-gray-600">
                Track how recommendations move into applications and award placeholders across the operating system.
              </p>
              {(requestedOrganizationId || requestedOpportunityId) && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-[#fff7e6] border-2 border-black text-xs font-black text-[#b45309]">
                  Focused to alert context
                </div>
              )}
            </div>

            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Board
            </button>
          </div>

          {error && (
            <div className="border-2 border-red-500 bg-red-50 text-red-800 p-4 mb-6 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 items-start">
            {stageOrder.map((stageKey) => {
              const columnItems = columns[stageKey];
              const meta = STAGE_META[stageKey];
              const Icon = meta.icon;

              return (
                <section
                  key={stageKey}
                  className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[30rem]"
                >
                  <div className={`px-4 py-4 border-b-2 border-black ${meta.tone}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-5 h-5" />
                      <h2 className="text-lg font-black">{meta.title}</h2>
                    </div>
                    <p className="text-xs font-medium opacity-90">{meta.description}</p>
                    <div className="mt-2 text-xs font-black">{columnItems.length} items</div>
                  </div>

                  <div className="p-4 space-y-4 max-h-[42rem] overflow-auto">
                    {loading && items.length === 0 ? (
                      <div className="text-sm text-gray-500">Loading board…</div>
                    ) : columnItems.length === 0 ? (
                      <div className="text-sm text-gray-500">No items in this stage.</div>
                    ) : (
                      columnItems.map((item) => {
                        const isFocused =
                          (!requestedOrganizationId ||
                            item.recommendation.organization_id === requestedOrganizationId) &&
                          (!requestedOpportunityId ||
                            item.recommendation.opportunity_id === requestedOpportunityId);

                        return (
                          <div
                            key={item.recommendation.id}
                            className={`border-2 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                              isFocused
                                ? 'border-[#1d4ed8] bg-[#eff6ff]'
                                : 'border-black bg-[#fafaf8]'
                            }`}
                          >
                          <div className="mb-3">
                            <div className="text-sm font-black text-black">
                              {item.organization?.name || 'Unknown organization'}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {item.opportunity?.name || 'Unknown opportunity'}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-1">
                              {item.opportunity?.funder_name || 'Unknown funder'}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div className="bg-white border border-gray-200 p-2">
                              <div className="font-bold text-gray-600">Match</div>
                              <div className="text-black font-black">{Math.round(item.recommendation.match_score)}</div>
                            </div>
                            <div className="bg-white border border-gray-200 p-2">
                              <div className="font-bold text-gray-600">Readiness</div>
                              <div className="text-black font-black">{Math.round(item.recommendation.readiness_score)}</div>
                            </div>
                          </div>

                          {item.application && (
                            <div className="mb-3 p-2 border border-[#d8b4fe] bg-[#faf5ff] text-xs">
                              <div className="font-bold text-[#7e22ce]">Application</div>
                              <div>Status: {item.application.status}</div>
                              <div>Requested: {formatCurrency(item.application.amount_requested)}</div>
                            </div>
                          )}

                          {item.award && (
                            <div className="mb-3 p-2 border border-[#86efac] bg-[#f0fdf4] text-xs">
                              <div className="font-bold text-[#15803d]">Award</div>
                              <div>Status: {item.award.award_status}</div>
                              <div>Awarded: {formatCurrency(item.award.amount_awarded)}</div>
                              <div>Disbursed: {formatCurrency(item.award.amount_disbursed)}</div>
                            </div>
                          )}

                          <div className="text-[11px] text-gray-500 space-y-1">
                            <div>
                              {item.organization?.city || '—'}
                              {item.organization?.state ? `, ${item.organization.state}` : ''}
                            </div>
                            <div>Deadline: {formatDate(item.opportunity?.deadline)}</div>
                            <div>Updated: {formatDate(item.updatedAt)}</div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.pipelineStage === 'recommendation_candidate' && (
                              <button
                                onClick={() =>
                                  runRecommendationAction('engage', item.recommendation.id)
                                }
                                disabled={activeActionId === item.recommendation.id}
                                className="px-2.5 py-2 text-[11px] font-black border border-black bg-white hover:bg-gray-100 disabled:opacity-50"
                              >
                                {activeActionId === item.recommendation.id &&
                                activeActionKind === 'engage'
                                  ? 'Marking...'
                                  : 'Mark Contacted'}
                              </button>
                            )}

                            {(item.pipelineStage === 'recommendation_candidate' ||
                              item.pipelineStage === 'recommendation_engaged') && (
                              <button
                                onClick={() =>
                                  runRecommendationAction('promote', item.recommendation.id)
                                }
                                disabled={activeActionId === item.recommendation.id}
                                className="px-2.5 py-2 text-[11px] font-black border border-black bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                              >
                                {activeActionId === item.recommendation.id &&
                                activeActionKind === 'promote'
                                  ? 'Promoting...'
                                  : 'Promote'}
                              </button>
                            )}

                            <button
                              onClick={() =>
                                runRecommendationAction('rescore', item.recommendation.id)
                              }
                              disabled={activeActionId === item.recommendation.id}
                              className="px-2.5 py-2 text-[11px] font-black border border-black bg-[#eef4ff] text-[#1d4ed8] hover:bg-[#dbeafe] disabled:opacity-50"
                            >
                              {activeActionId === item.recommendation.id &&
                              activeActionKind === 'rescore'
                                ? 'Scoring...'
                                : 'Re-score'}
                            </button>
                          </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FundingOperatingSystemPipelinePage() {
  return (
    <Suspense fallback={null}>
      <FundingOperatingSystemPipelinePageContent />
    </Suspense>
  );
}
