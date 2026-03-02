'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Network, RefreshCw } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';

interface FundingRelationship {
  id: string;
  sourceFollowUpTaskId?: string | null;
  parentConversationTaskId?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  organizationCity?: string | null;
  organizationState?: string | null;
  recommendationId?: string | null;
  opportunityId?: string | null;
  opportunityName?: string | null;
  funderName?: string | null;
  engagementKind: string;
  stageKey?: string | null;
  stageTaskId?: string | null;
  stageTaskKind?: string | null;
  stageTaskLabel?: string | null;
  stageTaskStatus?: string | null;
  pathwayTaskId?: string | null;
  pathwayTaskKind?: string | null;
  pathwayTaskLabel?: string | null;
  pathwayTaskStatus?: string | null;
  partnerRiskTaskId?: string | null;
  partnerRiskTaskStatus?: string | null;
  partnerRiskTaskLabel?: string | null;
  partnerRiskResolution?: string | null;
  partnerRiskResolutionNote?: string | null;
  partnerRiskOpsTaskId?: string | null;
  partnerRiskOpsTaskStatus?: string | null;
  promotedApplicationId?: string | null;
  promotedAwardId?: string | null;
  pathwayPromotionError?: string | null;
  relationshipStatus: string;
  currentStageLabel?: string | null;
  nextActionLabel?: string | null;
  nextActionDueAt?: string | null;
  lastEngagedAt?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface Notice {
  type: 'success' | 'error';
  message: string;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusClass(status?: string | null) {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-800';
  if (status === 'active') return 'bg-blue-100 text-blue-800';
  if (status === 'paused') return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-700';
}

function isLinkedStageTaskOverdue(item: FundingRelationship) {
  if (!item.stageTaskId) return false;
  if (!item.nextActionDueAt) return false;
  if (item.stageTaskStatus === 'completed') return false;

  const dueAt = new Date(item.nextActionDueAt);
  if (Number.isNaN(dueAt.getTime())) return false;

  return dueAt.getTime() < Date.now();
}

function hasActivePartnerRisk(item: FundingRelationship) {
  const partnerRiskTaskActive =
    Boolean(item.partnerRiskTaskId) && item.partnerRiskTaskStatus !== 'completed';
  const partnerRiskOpsTaskActive =
    Boolean(item.partnerRiskOpsTaskId) && item.partnerRiskOpsTaskStatus !== 'completed';

  return partnerRiskTaskActive || partnerRiskOpsTaskActive;
}

function stageBadgeMeta(stageKey?: string | null) {
  if (stageKey === 'application_live') {
    return {
      label: 'application live',
      className: 'bg-[#f3e8ff] text-[#7e22ce]',
    };
  }

  if (stageKey === 'award_recommended') {
    return {
      label: 'award recommended',
      className: 'bg-[#e7f8ee] text-[#15803d]',
    };
  }

  if (stageKey === 'engaged_partner') {
    return {
      label: 'engaged partner',
      className: 'bg-[#eef8f7] text-[#0f766e]',
    };
  }

  return {
    label: stageKey ? stageKey.replace(/_/g, ' ') : 'relationship',
    className: 'bg-[#eef4ff] text-[#1d4ed8]',
  };
}

function FundingRelationshipQueuePageContent() {
  const searchParams = useSearchParams();
  const [relationships, setRelationships] = useState<FundingRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'paused' | 'completed' | 'closed'
  >('all');
  const [promotionFilter, setPromotionFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [partnerRiskOnly, setPartnerRiskOnly] = useState(false);
  const [updatingRelationshipId, setUpdatingRelationshipId] = useState<string | null>(null);

  const loadRelationships = async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', '40');
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      const response = await fetch(`/api/admin/funding/os/relationships?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load relationships');
      }

      setRelationships(Array.isArray(payload.data) ? payload.data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load relationships');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRelationships();
  }, [statusFilter]);

  useEffect(() => {
    const promotion = String(searchParams.get('promotion') || 'all')
      .trim()
      .toLowerCase();
    if (promotion === 'success' || promotion === 'failed') {
      setPromotionFilter(promotion);
    } else {
      setPromotionFilter('all');
    }

    const risk = String(searchParams.get('risk') || 'all')
      .trim()
      .toLowerCase();
    setPartnerRiskOnly(risk === 'partner');
  }, [searchParams]);

  const visibleRelationships = useMemo(
    () => {
      let next = relationships;

      if (promotionFilter === 'success') {
        next = next.filter((item) => item.promotedApplicationId || item.promotedAwardId);
      } else if (promotionFilter === 'failed') {
        next = next.filter((item) => item.pathwayPromotionError);
      }

      if (overdueOnly) {
        next = next.filter((item) => isLinkedStageTaskOverdue(item));
      }

      if (partnerRiskOnly) {
        next = next.filter((item) => hasActivePartnerRisk(item));
      }

      return next;
    },
    [overdueOnly, partnerRiskOnly, promotionFilter, relationships]
  );

  const summary = useMemo(
    () => ({
      total: visibleRelationships.length,
      active: visibleRelationships.filter((item) => item.relationshipStatus === 'active').length,
      paused: visibleRelationships.filter((item) => item.relationshipStatus === 'paused').length,
      completed: visibleRelationships.filter((item) => item.relationshipStatus === 'completed')
        .length,
      overdueActions: visibleRelationships.filter((item) => isLinkedStageTaskOverdue(item)).length,
      partnerRisk: visibleRelationships.filter((item) => hasActivePartnerRisk(item)).length,
      promotionSuccess: visibleRelationships.filter(
        (item) => item.promotedApplicationId || item.promotedAwardId
      ).length,
      promotionFailed: visibleRelationships.filter((item) => item.pathwayPromotionError).length,
    }),
    [visibleRelationships]
  );

  const updateStatus = async (
    relationshipId: string,
    status: 'active' | 'paused' | 'completed' | 'closed'
  ) => {
    try {
      setUpdatingRelationshipId(relationshipId);
      setNotice(null);
      const response = await fetch('/api/admin/funding/os/relationships/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationshipId, status }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update relationship');
      }

      setNotice({
        type: 'success',
        message:
          status === 'active'
            ? 'Relationship reactivated.'
            : status === 'paused'
              ? 'Relationship paused.'
              : status === 'completed'
                ? 'Relationship marked complete.'
                : 'Relationship closed.',
      });
      await loadRelationships(true);
    } catch (updateError) {
      setNotice({
        type: 'error',
        message:
          updateError instanceof Error ? updateError.message : 'Failed to update relationship',
      });
    } finally {
      setUpdatingRelationshipId(null);
    }
  };

  const updateStage = async (
    relationshipId: string,
    stageKey: 'intro_scheduled' | 'info_sent' | 'waiting_response' | 'engaged_partner'
  ) => {
    try {
      setUpdatingRelationshipId(relationshipId);
      setNotice(null);
      const response = await fetch('/api/admin/funding/os/relationships/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationshipId, stageKey }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update relationship stage');
      }

      setNotice({
        type: 'success',
        message: `Moved relationship to ${payload.currentStageLabel || 'the next stage'}.`,
      });
      await loadRelationships(true);
    } catch (stageError) {
      setNotice({
        type: 'error',
        message:
          stageError instanceof Error ? stageError.message : 'Failed to update relationship stage',
      });
    } finally {
      setUpdatingRelationshipId(null);
    }
  };

  const retryPathwayPromotion = async (relationshipId: string) => {
    try {
      setUpdatingRelationshipId(relationshipId);
      setNotice(null);
      const response = await fetch('/api/admin/funding/os/relationships/pathway-promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationshipId }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to retry funding pathway promotion');
      }

      setNotice({
        type: 'success',
        message:
          `Funding pathway promotion retried. ` +
          `Application ${payload.applicationId?.slice(0, 8) || 'created'}` +
          (payload.awardId ? ` • Award ${payload.awardId.slice(0, 8)}` : ''),
      });
      await loadRelationships(true);
    } catch (retryError) {
      setNotice({
        type: 'error',
        message:
          retryError instanceof Error
            ? retryError.message
            : 'Failed to retry funding pathway promotion',
      });
    } finally {
      setUpdatingRelationshipId(null);
    }
  };

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
                Back to Funding OS
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-[#0f766e] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <Network className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Relationships</h1>
                  <p className="text-base text-gray-600">
                    Durable relationship records created after outcome follow-through.
                  </p>
                  <div className="mt-3">
                    <Link
                      href="/admin/funding/os/relationships/stage-tasks"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                    >
                      Open Relationship Actions
                    </Link>
                    <Link
                      href="/admin/funding/os/relationships/pathway-tasks"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                    >
                      Open Funding Pathway Tasks
                    </Link>
                    <Link
                      href="/admin/funding/os/conversations?reply=relationship"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                    >
                      Open Relationship Replies
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadRelationships(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Queue
            </button>
          </div>

          {notice && (
            <div
              className={`border-2 p-4 mb-6 font-medium ${
                notice.type === 'success'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-red-500 bg-red-50 text-red-800'
              }`}
            >
              {notice.message}
            </div>
          )}

          {error && (
            <div className="border-2 border-red-500 bg-red-50 text-red-800 p-4 mb-6 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-8 gap-5 mb-8">
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Visible</div>
              <div className="text-4xl font-black text-black">{summary.total}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Active</div>
              <div className="text-4xl font-black text-blue-700">{summary.active}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Paused</div>
              <div className="text-4xl font-black text-amber-700">{summary.paused}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Completed</div>
              <div className="text-4xl font-black text-emerald-700">{summary.completed}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Overdue Actions</div>
              <div className="text-4xl font-black text-red-700">{summary.overdueActions}</div>
            </div>
            <button
              type="button"
              onClick={() => setPartnerRiskOnly(true)}
              disabled={summary.partnerRisk === 0 && !partnerRiskOnly}
              className={`border-2 border-black p-5 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors disabled:opacity-50 ${
                partnerRiskOnly
                  ? 'bg-[#0f766e] text-white'
                  : 'bg-white hover:bg-[#ecfdf5]'
              }`}
            >
              <div
                className={`text-xs uppercase font-bold mb-2 ${
                  partnerRiskOnly ? 'text-[#d1fae5]' : 'text-gray-600'
                }`}
              >
                Partner Risk
              </div>
              <div
                className={`text-4xl font-black ${
                  partnerRiskOnly ? 'text-white' : 'text-[#0f766e]'
                }`}
              >
                {summary.partnerRisk}
              </div>
              <div
                className={`text-xs font-bold mt-2 ${
                  partnerRiskOnly ? 'text-[#d1fae5]' : 'text-gray-600'
                }`}
              >
                {partnerRiskOnly ? 'Active queue' : 'Open this lane'}
              </div>
            </button>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Pipeline Live</div>
              <div className="text-4xl font-black text-emerald-700">{summary.promotionSuccess}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Pipeline Failed</div>
              <div className="text-4xl font-black text-red-700">{summary.promotionFailed}</div>
            </div>
          </div>

          <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                  Promotion Triage
                </div>
                <div className="text-sm font-black text-black">
                  Jump directly into relationship-to-pipeline outcomes.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'success', 'failed'] as const).map((value) => (
                  <button
                    key={`top-${value}`}
                    type="button"
                    onClick={() => {
                      setPromotionFilter(value);
                      if (value !== 'failed') {
                        setOverdueOnly(false);
                      }
                    }}
                    className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors ${
                      promotionFilter === value
                        ? value === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : value === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-[#0f766e] text-white'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {value === 'all'
                      ? 'All'
                      : value === 'success'
                        ? 'Pipeline Live'
                        : 'Pipeline Failed'}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Queue Filter</div>
                <div className="text-sm font-black text-black">
                  Showing {visibleRelationships.length} of {relationships.length} relationship
                  {relationships.length === 1 ? '' : 's'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPromotionFilter('failed');
                    setOverdueOnly(false);
                  }}
                  className="px-3 py-2 text-xs font-black border-2 border-black bg-red-50 text-red-800 hover:bg-red-100 transition-colors"
                >
                  Retry Failures Only
                </button>
                {(['all', 'success', 'failed'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPromotionFilter(value)}
                    className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors ${
                      promotionFilter === value
                        ? value === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : value === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-[#0f766e] text-white'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {value === 'all'
                      ? 'All promotions'
                      : value === 'success'
                        ? 'Promotion success'
                        : 'Promotion failed'}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setOverdueOnly((current) => !current)}
                  className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors ${
                    overdueOnly ? 'bg-red-100 text-red-800' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {overdueOnly ? 'Overdue Only' : 'Show Overdue Only'}
                </button>
                <button
                  type="button"
                  onClick={() => setPartnerRiskOnly((current) => !current)}
                  className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors ${
                    partnerRiskOnly
                      ? 'bg-[#ecfdf5] text-[#065f46]'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {partnerRiskOnly ? 'Partner Risk Only' : 'Show Partner Risk Only'}
                </button>
                {(['all', 'active', 'paused', 'completed', 'closed'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors ${
                      statusFilter === value
                        ? 'bg-[#0f766e] text-white'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {value === 'all'
                      ? 'All'
                      : value === 'active'
                        ? 'Active'
                        : value === 'paused'
                          ? 'Paused'
                          : value === 'completed'
                            ? 'Completed'
                            : 'Closed'}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {loading ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Loading relationships…
            </div>
          ) : visibleRelationships.length === 0 ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {partnerRiskOnly
                ? 'No active partner-risk relationships match the current queue filter.'
                : overdueOnly
                ? 'No relationships with overdue linked actions match the current queue filter.'
                : 'No relationships match the current queue filter.'}
            </div>
          ) : (
            <div className="space-y-5">
              {visibleRelationships.map((item) => {
                const conversationHref = item.parentConversationTaskId
                  ? `/funding/conversations/${encodeURIComponent(item.parentConversationTaskId)}`
                  : '/admin/funding/os/conversations';
                const followUpHref = '/admin/funding/os/conversations/follow-ups';
                const pathwayHref = '/admin/funding/os/relationships/pathway-tasks';
                const pipelineHref =
                  item.organizationId && item.opportunityId
                    ? `/admin/funding/os/pipeline?organizationId=${encodeURIComponent(
                        item.organizationId
                      )}&opportunityId=${encodeURIComponent(item.opportunityId)}`
                    : '/admin/funding/os/pipeline';
                const awardAccountabilityHref = item.promotedAwardId
                  ? `/funding/accountability/awards/${encodeURIComponent(item.promotedAwardId)}`
                  : null;
                const linkedStageTaskOverdue = isLinkedStageTaskOverdue(item);
                const stageBadge = stageBadgeMeta(item.stageKey);

                return (
                  <article
                    key={item.id}
                    className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h2 className="text-2xl font-black text-black">
                            {item.organizationName || 'Organization relationship'}
                          </h2>
                          <span
                            className={`px-2 py-1 text-[11px] font-black border border-black ${statusClass(
                              item.relationshipStatus
                            )}`}
                          >
                            {item.relationshipStatus}
                          </span>
                          {item.stageKey && (
                            <span
                              className={`px-2 py-1 text-[11px] font-black border border-black ${stageBadge.className}`}
                            >
                              {stageBadge.label}
                            </span>
                          )}
                          {linkedStageTaskOverdue && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-red-100 text-red-800">
                              overdue action
                            </span>
                          )}
                          {(item.promotedApplicationId || item.promotedAwardId) && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-emerald-100 text-emerald-800">
                              pipeline live
                            </span>
                          )}
                          {item.pathwayPromotionError && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-red-100 text-red-800">
                              pipeline failed
                            </span>
                          )}
                          {item.partnerRiskTaskId && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#d1fae5] text-[#065f46]">
                              {hasActivePartnerRisk(item) ? 'partner risk active' : 'partner risk'}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {[item.funderName, item.opportunityName].filter(Boolean).join(' • ') ||
                            'Funding relationship'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 text-xs font-black border border-black bg-white">
                          {item.currentStageLabel || 'Relationship active'}
                        </span>
                        <span className="px-2 py-1 text-xs font-black border border-black bg-white">
                          Updated {formatDate(item.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="border border-gray-200 bg-[#f8fafc] p-4">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                          Next Action
                        </div>
                        <div className="text-sm font-black text-black">
                          {item.nextActionLabel || 'No next action recorded'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Due {formatDate(item.nextActionDueAt)}
                        </div>
                        {item.stageTaskLabel && (
                          <div className="mt-3 border border-gray-200 bg-white p-3">
                            <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                              Stage Task
                            </div>
                            <div className="text-sm font-black text-black">
                              {item.stageTaskLabel}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 flex flex-wrap items-center gap-2">
                              <span>{item.stageTaskStatus || 'queued'}</span>
                              {linkedStageTaskOverdue && (
                                <span className="px-2 py-0.5 text-[10px] font-black border border-black bg-red-100 text-red-800">
                                  Overdue
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {item.pathwayTaskLabel && (
                          <div className="mt-3 border border-gray-200 bg-white p-3">
                            <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                              Funding Pathway Task
                            </div>
                            <div className="text-sm font-black text-black">
                              {item.pathwayTaskLabel}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {item.pathwayTaskStatus || 'queued'}
                            </div>
                          </div>
                        )}
                        {item.partnerRiskTaskLabel && (
                          <div className="mt-3 border border-gray-200 bg-white p-3">
                            <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                              Partner-Risk Action
                            </div>
                            <div className="text-sm font-black text-black">
                              {item.partnerRiskTaskLabel}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {item.partnerRiskTaskStatus || 'queued'}
                            </div>
                            {item.partnerRiskResolution && (
                              <div className="text-xs font-bold text-[#065f46] mt-2">
                                {item.partnerRiskResolution.replace(/_/g, ' ')}
                              </div>
                            )}
                            {item.partnerRiskResolutionNote && (
                              <div className="text-xs text-gray-700 mt-2 whitespace-pre-wrap">
                                {item.partnerRiskResolutionNote}
                              </div>
                            )}
                            {item.partnerRiskResolution &&
                              (item.partnerRiskResolution === 'pause_relationship' ||
                                item.partnerRiskResolution === 'escalate_pipeline_risk') && (
                                <div className="mt-3">
                                  <Link
                                    href="/admin/funding/os/conversations?reply=relationship"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                                  >
                                    Open Relationship Replies
                                  </Link>
                                </div>
                              )}
                          </div>
                        )}
                        {item.partnerRiskOpsTaskId && (
                          <div className="mt-3 border border-gray-200 bg-white p-3">
                            <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                              Pipeline-Risk Follow-up
                            </div>
                            <div className="text-sm font-black text-black">
                              Work the main pipeline-risk queue
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {item.partnerRiskOpsTaskStatus || 'queued'}
                            </div>
                          </div>
                        )}
                        {(item.promotedApplicationId || item.promotedAwardId || item.pathwayPromotionError) && (
                          <div className="mt-3 border border-gray-200 bg-white p-3">
                            <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                              Downstream Checkpoint
                            </div>
                            {item.pathwayPromotionError ? (
                              <div className="text-sm font-black text-red-700">
                                {item.pathwayPromotionError}
                              </div>
                            ) : (
                              <div className="text-sm font-black text-black">
                                {item.promotedAwardId
                                  ? 'Award accountability is live'
                                  : item.promotedApplicationId
                                    ? 'Application pathway is live'
                                    : 'Downstream funding checkpoint is live'}
                              </div>
                            )}
                            <div className="text-xs text-gray-600 mt-1">
                              {item.promotedApplicationId
                                ? `Application ${item.promotedApplicationId.slice(0, 8)}`
                                : 'No application id'}
                              {item.promotedAwardId
                                ? ` • Award ${item.promotedAwardId.slice(0, 8)}`
                                : ''}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="border border-gray-200 bg-[#f8fafc] p-4">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                          Last Engaged
                        </div>
                        <div className="text-sm font-black text-black">
                          {formatDate(item.lastEngagedAt)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {item.organizationCity || '—'}
                          {item.organizationState ? `, ${item.organizationState}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.relationshipStatus !== 'completed' &&
                        item.relationshipStatus !== 'closed' && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateStage(item.id, 'intro_scheduled')}
                              disabled={updatingRelationshipId === item.id}
                              className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              Intro Scheduled
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStage(item.id, 'info_sent')}
                              disabled={updatingRelationshipId === item.id}
                              className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              Info Sent
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStage(item.id, 'waiting_response')}
                              disabled={updatingRelationshipId === item.id}
                              className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              Waiting Response
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStage(item.id, 'engaged_partner')}
                              disabled={updatingRelationshipId === item.id}
                              className="px-3 py-2 text-xs font-black border-2 border-black bg-[#eef8f7] text-[#0f766e] hover:bg-[#d7f0ee] transition-colors disabled:opacity-50"
                            >
                              Engaged Partner
                            </button>
                          </>
                        )}
                      {item.relationshipStatus !== 'active' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(item.id, 'active')}
                          disabled={updatingRelationshipId === item.id}
                          className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          Reactivate
                        </button>
                      )}
                      {item.relationshipStatus !== 'paused' && item.relationshipStatus !== 'completed' && item.relationshipStatus !== 'closed' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(item.id, 'paused')}
                          disabled={updatingRelationshipId === item.id}
                          className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          Pause
                        </button>
                      )}
                      {item.relationshipStatus !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(item.id, 'completed')}
                          disabled={updatingRelationshipId === item.id}
                          className="px-3 py-2 text-xs font-black border-2 border-black bg-[#0f766e] text-white hover:opacity-90 transition-colors disabled:opacity-50"
                        >
                          Mark Complete
                        </button>
                      )}
                      {item.relationshipStatus !== 'closed' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(item.id, 'closed')}
                          disabled={updatingRelationshipId === item.id}
                          className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          Close Relationship
                        </button>
                      )}
                      <Link
                        href={followUpHref}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                      >
                        Open Follow-ups
                      </Link>
                      {item.stageTaskId && (
                        <Link
                          href="/admin/funding/os/relationships/stage-tasks"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                        >
                          Open Relationship Actions
                        </Link>
                      )}
                      {item.partnerRiskTaskId && (
                        <Link
                          href="/admin/funding/os/relationships/stage-tasks?stageKey=partner_risk_review"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-[#ecfdf5] border-2 border-black text-xs font-black text-[#065f46] hover:bg-[#d1fae5] transition-colors"
                        >
                          Open Partner-Risk Actions
                        </Link>
                      )}
                      {item.partnerRiskOpsTaskId && (
                        <Link
                          href="/admin/funding/os/followups?routingClass=pipeline&severity=critical"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border-2 border-black text-xs font-black text-red-800 hover:bg-red-100 transition-colors"
                        >
                          Open Pipeline-Risk Follow-up
                        </Link>
                      )}
                      {item.pathwayTaskId && (
                        <Link
                          href={pathwayHref}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                        >
                          Open Funding Pathway Tasks
                        </Link>
                      )}
                      {(item.promotedApplicationId || item.promotedAwardId) && (
                        <Link
                          href={pipelineHref}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                        >
                          Open Application Context
                        </Link>
                      )}
                      {awardAccountabilityHref && (
                        <Link
                          href={awardAccountabilityHref}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                        >
                          Open Award Accountability
                        </Link>
                      )}
                      {item.pathwayPromotionError && (
                        <button
                          type="button"
                          onClick={() => retryPathwayPromotion(item.id)}
                          disabled={updatingRelationshipId === item.id}
                          className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          Retry Pipeline Promotion
                        </button>
                      )}
                      <Link
                        href={conversationHref}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                      >
                        Open Conversation
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FundingRelationshipQueuePage() {
  return (
    <Suspense fallback={null}>
      <FundingRelationshipQueuePageContent />
    </Suspense>
  );
}
