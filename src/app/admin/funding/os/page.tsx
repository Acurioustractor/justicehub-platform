'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Gauge,
  Network,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
} from 'lucide-react';

interface CapabilityProfile {
  id: string;
  organization_id: string;
  funding_readiness_score: number;
  community_trust_score: number;
  reporting_to_community_score: number;
  delivery_confidence_score: number;
  capability_tags?: string[];
  service_geographies?: string[];
  organization?: {
    id: string;
    name: string;
    slug?: string | null;
    type?: string | null;
    state?: string | null;
    city?: string | null;
  } | null;
  signals?: Array<{
    id: string;
    signal_type: string;
    signal_name: string;
    signal_score: number;
    source_kind: string;
  }>;
}

interface FundingMatchRecommendation {
  id: string;
  opportunity_id: string;
  organization_id: string;
  recommendation_status: string;
  match_score: number;
  readiness_score: number;
  community_alignment_score: number;
  outcome_alignment_score: number;
  geographic_fit_score: number;
  explainability?: {
    overlap?: {
      opportunityFocusAreas?: string[];
      organizationCapabilityTags?: string[];
      opportunityJurisdictions?: string[];
      organizationGeographies?: string[];
    };
  };
  opportunity?: {
    id: string;
    name: string;
    funder_name?: string | null;
    deadline?: string | null;
    status?: string | null;
    max_grant_amount?: number | null;
  } | null;
  organization?: {
    id: string;
    name: string;
    slug?: string | null;
    city?: string | null;
    state?: string | null;
  } | null;
  created_at: string;
  updated_at?: string | null;
}

interface FundingWorkflow {
  id: string;
  workflow_type: string;
  workflow_status: string;
  scope_kind: string;
  started_at: string;
  completed_at?: string | null;
  records_scanned: number;
  records_changed: number;
  error_count: number;
  output_payload?: Record<string, unknown>;
}

interface FundingRelationshipReview {
  id: string;
  promotedApplicationId?: string | null;
  promotedAwardId?: string | null;
  pathwayPromotionError?: string | null;
}

interface FundingConversationReview {
  id: string;
  status?: string | null;
  reviewDecision?: string | null;
  nextStepKind?: string | null;
  relationshipNoticeRespondedAt?: string | null;
}

interface FundingPublicEvidenceReview {
  id: string;
  kind: 'update' | 'validation';
  summary?: string | null;
  validationStatus?: string | null;
  confidenceScore?: number | null;
  outreachFollowUp?: {
    taskId: string;
    status: string;
  } | null;
}

interface FundingAlertDigest {
  id: string;
  sourceId?: string | null;
  status: string;
  title: string;
  description?: string;
  createdAt?: string | null;
  reviewDecision?: 'acknowledged' | 'resolved' | string | null;
  reviewFeedback?: string | null;
  reviewedAt?: string | null;
  generatedAt?: string | null;
  notificationsType?: string | null;
  targetOrganizationId?: string | null;
  targetOrganizationName?: string | null;
  severityScore: number;
  severityLevel: 'critical' | 'high' | 'medium' | 'low' | string;
  summary: {
    total: number;
    overdueCommunityReports: number;
    spendWithoutValidation: number;
    strongMatchesNotEngaged: number;
    awardsWithoutCommitments: number;
    commitmentsWithoutUpdates: number;
    engagedMatchesStalled: number;
  };
}

interface AccountabilityAlertItem {
  funding_award_id: string;
  organization_name: string;
  funding_program_name: string;
  funding_source_name: string;
  award_status?: string;
  tracked_public_spend?: number | null;
  community_validation_count?: number | null;
  outcome_commitment_count?: number | null;
  outcome_update_count?: number | null;
  community_report_due_at?: string | null;
}

interface CommitmentGapAlertItem {
  id: string;
  funding_award_id: string;
  organization_id: string;
  outcome_definition_id: string;
  commitment_status: string;
  updated_at?: string | null;
  organization_name: string;
  outcome_name: string;
}

interface FundingAlerts {
  summary: {
    total: number;
    overdueCommunityReports: number;
    spendWithoutValidation: number;
    strongMatchesNotEngaged: number;
    awardsWithoutCommitments: number;
    commitmentsWithoutUpdates: number;
    engagedMatchesStalled: number;
  };
  overdueCommunityReports: {
    count: number;
    items: AccountabilityAlertItem[];
  };
  spendWithoutValidation: {
    count: number;
    items: AccountabilityAlertItem[];
  };
  strongMatchesNotEngaged: {
    count: number;
    items: FundingMatchRecommendation[];
  };
  awardsWithoutCommitments: {
    count: number;
    items: AccountabilityAlertItem[];
  };
  commitmentsWithoutUpdates: {
    count: number;
    items: CommitmentGapAlertItem[];
  };
  engagedMatchesStalled: {
    count: number;
    items: FundingMatchRecommendation[];
  };
}

interface Notice {
  type: 'success' | 'error' | 'info';
  message: string;
}

function statusClass(status: string) {
  if (status === 'completed') return 'bg-green-100 text-green-800';
  if (status === 'running') return 'bg-blue-100 text-blue-800';
  if (status === 'failed') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
}

function recommendationClass(score: number) {
  if (score >= 85) return 'bg-green-100 text-green-800';
  if (score >= 70) return 'bg-blue-100 text-blue-800';
  return 'bg-amber-100 text-amber-800';
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

function formatDuration(startedAt?: string, completedAt?: string | null) {
  if (!startedAt || !completedAt) return '—';
  const diff = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(diff) || diff <= 0) return '—';
  if (diff < 1000) return `${diff}ms`;
  const seconds = Math.round(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  return remSeconds === 0 ? `${minutes}m` : `${minutes}m ${remSeconds}s`;
}

function formatCurrency(value?: number | null) {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function digestSeverityClass(level: string) {
  if (level === 'critical') return 'bg-red-100 text-red-800';
  if (level === 'high') return 'bg-amber-100 text-amber-800';
  if (level === 'medium') return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-700';
}

function digestReviewClass(decision?: string | null) {
  if (decision === 'resolved') return 'bg-emerald-100 text-emerald-800';
  if (decision === 'acknowledged') return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-700';
}

function getDigestAction(digest: FundingAlertDigest) {
  if (digest.targetOrganizationId) {
    if (digest.summary.strongMatchesNotEngaged > 0 || digest.summary.engagedMatchesStalled > 0) {
      return {
        label: 'Open Pipeline',
        href: `/admin/funding/os/pipeline?organizationId=${digest.targetOrganizationId}`,
      };
    }

    return {
      label: 'Open Reporting',
      href: `/admin/funding/os/community-reporting?organizationId=${digest.targetOrganizationId}&status=all`,
    };
  }

  if (digest.summary.strongMatchesNotEngaged > 0 || digest.summary.engagedMatchesStalled > 0) {
    return {
      label: 'Open Pipeline',
      href: '/admin/funding/os/pipeline',
    };
  }

  return {
    label: 'Open Reporting',
    href: '/admin/funding/os/community-reporting?status=all',
  };
}

export default function FundingOperatingSystemPage() {
  const [profiles, setProfiles] = useState<CapabilityProfile[]>([]);
  const [matches, setMatches] = useState<FundingMatchRecommendation[]>([]);
  const [workflows, setWorkflows] = useState<FundingWorkflow[]>([]);
  const [relationships, setRelationships] = useState<FundingRelationshipReview[]>([]);
  const [conversations, setConversations] = useState<FundingConversationReview[]>([]);
  const [publicSubmissions, setPublicSubmissions] = useState<FundingPublicEvidenceReview[]>([]);
  const [alerts, setAlerts] = useState<FundingAlerts | null>(null);
  const [alertDigests, setAlertDigests] = useState<FundingAlertDigest[]>([]);
  const [criticalPendingDigestCount, setCriticalPendingDigestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [runningCycle, setRunningCycle] = useState(false);
  const [sendingAlertDigest, setSendingAlertDigest] = useState(false);
  const [reviewingDigestId, setReviewingDigestId] = useState<string | null>(null);
  const [reviewingDigestDecision, setReviewingDigestDecision] = useState<'acknowledged' | 'resolved' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [digestScope, setDigestScope] = useState<'all' | 'global' | 'organization'>('all');
  const [digestSeverity, setDigestSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [digestReviewStatus, setDigestReviewStatus] = useState<'all' | 'pending' | 'acknowledged' | 'resolved'>('all');
  const [digestRecentDays, setDigestRecentDays] = useState<'7' | '30' | '90'>('30');

  const fetchData = async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const digestParams = new URLSearchParams();
      digestParams.set('limit', '8');
      digestParams.set('scope', digestScope);
      digestParams.set('severity', digestSeverity);
      digestParams.set('reviewStatus', digestReviewStatus);
      digestParams.set('recentDays', digestRecentDays);
      const criticalPendingParams = new URLSearchParams();
      criticalPendingParams.set('limit', '50');
      criticalPendingParams.set('severity', 'critical');
      criticalPendingParams.set('reviewStatus', 'pending');
      criticalPendingParams.set('recentDays', '30');

      const [profilesRes, matchesRes, workflowsRes, relationshipsRes, conversationsRes, publicSubmissionsRes, alertsRes, digestsRes, criticalPendingRes] = await Promise.all([
        fetch('/api/admin/funding/os/capability-profiles?limit=12'),
        fetch('/api/admin/funding/os/matches?limit=20'),
        fetch('/api/admin/funding/os/workflows?limit=12'),
        fetch('/api/admin/funding/os/relationships?limit=60&status=all'),
        fetch('/api/admin/funding/os/conversations?limit=60&status=all'),
        fetch('/api/admin/funding/os/public-submissions?limit=80'),
        fetch('/api/admin/funding/os/alerts?limit=4'),
        fetch(`/api/admin/funding/os/alerts/digests?${digestParams.toString()}`),
        fetch(`/api/admin/funding/os/alerts/digests?${criticalPendingParams.toString()}`),
      ]);

      if (!profilesRes.ok || !matchesRes.ok || !workflowsRes.ok || !relationshipsRes.ok || !conversationsRes.ok || !publicSubmissionsRes.ok || !alertsRes.ok || !digestsRes.ok || !criticalPendingRes.ok) {
        throw new Error('Failed to load Funding OS review data');
      }

      const [profilesPayload, matchesPayload, workflowsPayload, relationshipsPayload, conversationsPayload, publicSubmissionsPayload, alertsPayload, digestsPayload, criticalPendingPayload] = await Promise.all([
        profilesRes.json(),
        matchesRes.json(),
        workflowsRes.json(),
        relationshipsRes.json(),
        conversationsRes.json(),
        publicSubmissionsRes.json(),
        alertsRes.json(),
        digestsRes.json(),
        criticalPendingRes.json(),
      ]);

      setProfiles(profilesPayload.data || []);
      setMatches(matchesPayload.data || []);
      setWorkflows(workflowsPayload.data || []);
      setRelationships(relationshipsPayload.data || []);
      setConversations(conversationsPayload.data || []);
      setPublicSubmissions(publicSubmissionsPayload.data || []);
      setAlerts(alertsPayload.data || null);
      setAlertDigests(digestsPayload.data || []);
      setCriticalPendingDigestCount(Array.isArray(criticalPendingPayload.data) ? criticalPendingPayload.data.length : 0);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const runCycle = async () => {
    setRunningCycle(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/funding/os/run-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to run Funding OS cycle');
      }

      const payload = await response.json();
      await fetchData(true);
      setNotice({
        type: 'success',
        message:
          `Cycle completed: ${payload?.ingest?.programsUpserted || 0} programs refreshed, ` +
          `${payload?.matches?.recommendationsUpserted || 0} recommendations updated, ` +
          `${payload?.alerts?.summary?.total || 0} active alerts.`,
      });
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Failed to run cycle');
      setNotice({
        type: 'error',
        message: runError instanceof Error ? runError.message : 'Failed to run cycle',
      });
    } finally {
      setRunningCycle(false);
    }
  };

  const sendAlertDigest = async (force = false) => {
    setSendingAlertDigest(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/funding/os/alerts/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(force ? { force: true } : {}),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send alert digest');
      }

      setNotice({
        type: 'success',
        message:
          payload.skippedDuplicate
            ? 'Skipped sending alert digest because an identical recent digest already exists.'
            : payload.notificationsQueued > 0
            ? `Queued ${payload.notificationsQueued} alert digest notification${payload.followUpTasksQueued ? ` and ${payload.followUpTasksQueued} follow-up task${payload.followUpTasksQueued === 1 ? '' : 's'}${payload.followUpTasksAutoAssigned ? ` (${payload.followUpTasksAutoAssigned} auto-routed)` : ''}.` : '.'}`
            : 'No active alerts to notify right now.',
      });
      await fetchData(true);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send alert digest');
      setNotice({
        type: 'error',
        message: sendError instanceof Error ? sendError.message : 'Failed to send alert digest',
      });
    } finally {
      setSendingAlertDigest(false);
    }
  };

  const reviewAlertDigest = async (
    digestId: string,
    decision: 'acknowledged' | 'resolved'
  ) => {
    setReviewingDigestId(digestId);
    setReviewingDigestDecision(decision);
    setError(null);

    try {
      const response = await fetch('/api/admin/funding/os/alerts/digests/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digestId, decision }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update alert digest');
      }

      setNotice({
        type: 'success',
        message:
          decision === 'resolved'
            ? 'Alert digest marked resolved.'
            : 'Alert digest acknowledged.',
      });
      await fetchData(true);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to update alert digest');
      setNotice({
        type: 'error',
        message: reviewError instanceof Error ? reviewError.message : 'Failed to update alert digest',
      });
    } finally {
      setReviewingDigestId(null);
      setReviewingDigestDecision(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [digestScope, digestSeverity, digestReviewStatus, digestRecentDays]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const runBootstrap = async () => {
    setBootstrapping(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/funding/os/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to run Funding OS bootstrap');
      }

      const payload = await response.json();
      await fetchData(true);
      setNotice({
        type: 'success',
        message:
          `Bootstrap completed: ${payload?.matches?.recommendationsUpserted || 0} recommendations ` +
          `from ${payload?.matches?.pairingsEvaluated || 0} evaluated pairings.`,
      });
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Failed to run bootstrap');
      setNotice({
        type: 'error',
        message: runError instanceof Error ? runError.message : 'Failed to run bootstrap',
      });
    } finally {
      setBootstrapping(false);
    }
  };

  const promoteRecommendation = async (recommendationId: string) => {
    setPromotingId(recommendationId);
    setError(null);

    try {
      const response = await fetch('/api/admin/funding/os/matches/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to promote recommendation');
      }

      const payload = await response.json();
      await fetchData(true);
      setNotice({
        type: 'success',
        message:
          `Promoted recommendation into pipeline. ` +
          `Application ${payload.applicationId?.slice(0, 8) || 'created'}, ` +
          `award ${payload.awardId?.slice(0, 8) || 'created'}.`,
      });
    } catch (promoteError) {
      setError(promoteError instanceof Error ? promoteError.message : 'Failed to promote recommendation');
      setNotice({
        type: 'error',
        message: promoteError instanceof Error ? promoteError.message : 'Failed to promote recommendation',
      });
    } finally {
      setPromotingId(null);
    }
  };

  const metrics = useMemo(() => {
    const allowsFollowUp = (summary?: string | null) =>
      /(^|\n)Follow-up contact:\s*Yes$/im.test(String(summary || ''));
    const isUrgentPublicSubmission = (submission: FundingPublicEvidenceReview) => {
      if (submission.kind === 'validation') {
        const validationStatus = String(submission.validationStatus || '').trim().toLowerCase();
        return validationStatus === 'contested' || validationStatus === 'needs_follow_up';
      }

      const confidence =
        typeof submission.confidenceScore === 'number' && Number.isFinite(submission.confidenceScore)
          ? submission.confidenceScore
          : null;

      return confidence !== null && confidence < 50;
    };

    const strongMatches = matches.filter((match) => match.match_score >= 80).length;
    const avgReadiness = profiles.length
      ? Math.round(
          profiles.reduce((sum, profile) => sum + (profile.funding_readiness_score || 0), 0) /
            profiles.length
        )
      : 0;
    const completedWorkflows = workflows.filter((workflow) => workflow.workflow_status === 'completed').length;
    const successfulRelationshipPromotions = relationships.filter(
      (relationship) => relationship.promotedApplicationId || relationship.promotedAwardId
    ).length;
    const failedRelationshipPromotions = relationships.filter(
      (relationship) => relationship.pathwayPromotionError
    ).length;
    const relationshipRepliesAwaitingReview = conversations.filter(
      (conversation) =>
        conversation.relationshipNoticeRespondedAt &&
        conversation.reviewDecision !== 'acknowledged' &&
        conversation.reviewDecision !== 'resolved'
    ).length;
    const relationshipRepliesRunning = conversations.filter(
      (conversation) =>
        conversation.relationshipNoticeRespondedAt &&
        (conversation.status === 'running' || conversation.status === 'in_progress') &&
        (conversation.reviewDecision === 'acknowledged' || conversation.nextStepKind)
    ).length;
    const urgentContactablePublicSubmissions = publicSubmissions.filter(
      (submission) => isUrgentPublicSubmission(submission) && allowsFollowUp(submission.summary)
    ).length;
    const publicEvidenceContactTasks = publicSubmissions.filter(
      (submission) => submission.outreachFollowUp
    ).length;

    return {
      profileCount: profiles.length,
      strongMatches,
      avgReadiness,
      workflowCount: workflows.length,
      completedWorkflows,
      successfulRelationshipPromotions,
      failedRelationshipPromotions,
      relationshipRepliesAwaitingReview,
      relationshipRepliesRunning,
      urgentContactablePublicSubmissions,
      publicEvidenceContactTasks,
    };
  }, [profiles, matches, workflows, relationships, conversations, publicSubmissions]);

  return (
    <div className="min-h-screen bg-[#f5f6f2] page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="flex flex-col gap-6 mb-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/admin/funding"
                className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Funding
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-emerald-500 text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <Network className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Funding OS Review</h1>
                  <p className="text-base text-gray-600">
                    Review basecamp-aware capability profiles, agent workflows, and live match recommendations.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-[#fff1f2] border-2 border-black text-xs font-black text-[#be123c]">
                    {criticalPendingDigestCount} unresolved critical digest{criticalPendingDigestCount === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/funding/os/pipeline"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#eef4ff] border-2 border-black font-bold hover:bg-[#dbeafe] transition-colors"
              >
                <Workflow className="w-4 h-4" />
                Open Pipeline Board
              </Link>
              <Link
                href="/admin/funding/os/followups"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#fff1f2] border-2 border-black font-bold hover:bg-[#ffe4e6] transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Follow-up Queue
              </Link>
              <Link
                href="/admin/funding/os/conversations"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#eef8f7] border-2 border-black font-bold hover:bg-[#d7f0ee] transition-colors"
              >
                <Network className="w-4 h-4" />
                Conversation Requests
              </Link>
              <Link
                href="/admin/funding/os/relationships"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#f5f3ff] border-2 border-black font-bold hover:bg-[#ede9fe] transition-colors"
              >
                <Network className="w-4 h-4" />
                Relationships
              </Link>
              <Link
                href="/admin/funding/os/relationships/stage-tasks"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#ecfeff] border-2 border-black font-bold hover:bg-[#cffafe] transition-colors"
              >
                <Workflow className="w-4 h-4" />
                Relationship Actions
              </Link>
              <Link
                href="/admin/funding/os/relationships/pathway-tasks"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#fef3c7] border-2 border-black font-bold hover:bg-[#fde68a] transition-colors"
              >
                <Workflow className="w-4 h-4" />
                Funding Pathway Tasks
              </Link>
              <Link
                href="/funding/accountability"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#e7f8ee] border-2 border-black font-bold hover:bg-[#d2f4de] transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Community Accountability
              </Link>
              <Link
                href="/funding/discovery"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#eef8f7] border-2 border-black font-bold hover:bg-[#d7f0ee] transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Funder Discovery
              </Link>
              <Link
                href="/admin/funding/os/discovery-workspace"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#f5f3ff] border-2 border-black font-bold hover:bg-[#ede9fe] transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Shared Discovery Workspace
              </Link>
              <Link
                href="/admin/funding/os/application-drafts"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#eef4ff] border-2 border-black font-bold hover:bg-[#dbeafe] transition-colors"
              >
                <Workflow className="w-4 h-4" />
                Application Drafts
              </Link>
              <Link
                href="/admin/funding/os/application-draft-reviews"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#eff6ff] border-2 border-black font-bold hover:bg-[#dbeafe] transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Application Draft Reviews
              </Link>
              <Link
                href="/admin/funding/os/discovery-candidates"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#ecfeff] border-2 border-black font-bold hover:bg-[#cffafe] transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Discovery Cohort Candidates
              </Link>
              <Link
                href="/admin/funding/os/community-reporting"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#fff7e6] border-2 border-black font-bold hover:bg-[#ffefc2] transition-colors"
              >
                <Bot className="w-4 h-4" />
                Community Reporting
              </Link>
              <Link
                href="/admin/funding/os/public-submissions"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#fff4e6] border-2 border-black font-bold hover:bg-[#ffe7c2] transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Public Evidence Review
              </Link>
              <Link
                href="/admin/funding/os/outcome-definitions"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#eef8f7] border-2 border-black font-bold hover:bg-[#d7f0ee] transition-colors"
              >
                <Target className="w-4 h-4" />
                Outcome Definitions
              </Link>
              <Link
                href="/admin/funding/os/spending"
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#f3f8ec] border-2 border-black font-bold hover:bg-[#e7f2d8] transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Spending Ledger
              </Link>
              <button
                onClick={() => sendAlertDigest(false)}
                disabled={sendingAlertDigest || runningCycle || bootstrapping}
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#fff7e6] text-[#b45309] border-2 border-black font-bold hover:bg-[#ffefc2] transition-colors disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                {sendingAlertDigest ? 'Sending Digest…' : 'Send Alert Digest'}
              </button>
              <button
                onClick={() => sendAlertDigest(true)}
                disabled={sendingAlertDigest || runningCycle || bootstrapping}
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#fff1f2] text-[#be123c] border-2 border-black font-bold hover:bg-[#ffe4e6] transition-colors disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                {sendingAlertDigest ? 'Sending Digest…' : 'Force Send'}
              </button>
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing || bootstrapping || runningCycle}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={runCycle}
                disabled={runningCycle || bootstrapping}
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#dbeafe] text-[#1e3a8a] border-2 border-black font-bold hover:bg-[#bfdbfe] transition-colors disabled:opacity-50"
              >
                <Bot className="w-4 h-4" />
                {runningCycle ? 'Running Cycle…' : 'Run Cycle'}
              </button>
              <button
                onClick={runBootstrap}
                disabled={bootstrapping || runningCycle}
                className="inline-flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white border-2 border-black font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <Sparkles className="w-4 h-4" />
                {bootstrapping ? 'Running Bootstrap…' : 'Run Bootstrap'}
              </button>
            </div>
          </div>

          {notice && (
            <div
              className={`border-2 p-4 mb-6 font-medium ${
                notice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : notice.type === 'error'
                    ? 'bg-red-50 border-red-500 text-red-800'
                    : 'bg-blue-50 border-blue-500 text-blue-800'
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-11 gap-5 mb-8">
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-gray-600">Profiles</span>
                <Gauge className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-4xl font-black text-black">{metrics.profileCount}</div>
              <div className="text-xs text-gray-500 mt-1">capability records loaded</div>
            </div>

            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-gray-600">Avg Readiness</span>
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-4xl font-black text-blue-700">{metrics.avgReadiness}</div>
              <div className="text-xs text-gray-500 mt-1">funding readiness score</div>
            </div>

            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-gray-600">Strong Matches</span>
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-4xl font-black text-indigo-700">{metrics.strongMatches}</div>
              <div className="text-xs text-gray-500 mt-1">80+ score recommendations</div>
            </div>

            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-gray-600">Workflows</span>
                <Workflow className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-4xl font-black text-black">{metrics.workflowCount}</div>
              <div className="text-xs text-gray-500 mt-1">recent workflow runs</div>
            </div>

            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-gray-600">Completed</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-4xl font-black text-emerald-700">{metrics.completedWorkflows}</div>
              <div className="text-xs text-gray-500 mt-1">completed recent workflows</div>
            </div>

            <Link
              href="/admin/funding/os/relationships?promotion=success"
              className="block bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-gray-600">Rel to Pipeline</span>
                <Network className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-4xl font-black text-emerald-700">
                {metrics.successfulRelationshipPromotions}
              </div>
              <div className="text-xs text-gray-500 mt-1">successful relationship promotions</div>
            </Link>

            <Link
              href="/admin/funding/os/relationships?promotion=failed"
              className="block bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-gray-600">Rel Failures</span>
                <Network className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-4xl font-black text-red-700">
                {metrics.failedRelationshipPromotions}
              </div>
              <div className="text-xs text-gray-500 mt-1">relationship promotion failures</div>
            </Link>

            <Link
              href="/admin/funding/os/conversations?reply=relationship"
              className="block bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#f5f3ff] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-gray-600">Rel Replies</span>
                <MessageSquare className="w-5 h-5 text-[#5b21b6]" />
              </div>
              <div className="text-4xl font-black text-[#5b21b6]">
                {metrics.relationshipRepliesAwaitingReview}
              </div>
              <div className="text-xs text-gray-500 mt-1">relationship replies awaiting review</div>
            </Link>

            <Link
              href="/admin/funding/os/conversations?reply=relationship&status=running"
              className="block bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#eef4ff] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-gray-600">Rel Reply Live</span>
                <MessageSquare className="w-5 h-5 text-[#1d4ed8]" />
              </div>
              <div className="text-4xl font-black text-[#1d4ed8]">
                {metrics.relationshipRepliesRunning}
              </div>
              <div className="text-xs text-gray-500 mt-1">relationship replies already reopened</div>
            </Link>

            <Link
              href="/admin/funding/os/public-submissions?focus=urgent-contactable"
              className="block bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#fff7e6] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-gray-600">Urgent + Contact</span>
                <ShieldCheck className="w-5 h-5 text-[#b45309]" />
              </div>
              <div className="text-4xl font-black text-[#b45309]">
                {metrics.urgentContactablePublicSubmissions}
              </div>
              <div className="text-xs text-gray-500 mt-1">urgent public submissions with follow-up consent</div>
            </Link>

            <Link
              href="/admin/funding/os/public-submissions?focus=contact-outreach"
              className="block bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#eef8f7] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-gray-600">Contact Tasks</span>
                <MessageSquare className="w-5 h-5 text-[#0f766e]" />
              </div>
              <div className="text-4xl font-black text-[#0f766e]">
                {metrics.publicEvidenceContactTasks}
              </div>
              <div className="text-xs text-gray-500 mt-1">live contributor outreach tasks</div>
            </Link>
          </div>

          <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            <div className="px-5 py-4 border-b-2 border-black bg-[#f8fafc]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-black">Recent Alert Digests</h2>
                  <p className="text-sm text-gray-700 mt-1">
                    Outbound Funding OS alert snapshots queued into the shared agent task queue.
                  </p>
                </div>
                <div className="text-sm font-black text-slate-700">{alertDigests.length} shown</div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button
                  onClick={() => {
                    setDigestScope('all');
                    setDigestSeverity('critical');
                    setDigestReviewStatus('pending');
                    setDigestRecentDays('30');
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-[#fff1f2] text-[#be123c] hover:bg-[#ffe4e6] transition-colors"
                >
                  Unresolved Critical
                </button>
                <button
                  onClick={() => {
                    setDigestScope('organization');
                    setDigestSeverity('all');
                    setDigestReviewStatus('pending');
                    setDigestRecentDays('30');
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-[#eef4ff] text-[#1d4ed8] hover:bg-[#dbeafe] transition-colors"
                >
                  Org Queue
                </button>
                <button
                  onClick={() => {
                    setDigestScope('all');
                    setDigestSeverity('all');
                    setDigestReviewStatus('all');
                    setDigestRecentDays('30');
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
                <label className="text-xs font-bold text-gray-700">
                  Scope
                  <select
                    value={digestScope}
                    onChange={(event) =>
                      setDigestScope(event.target.value as 'all' | 'global' | 'organization')
                    }
                    className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="all">All digests</option>
                    <option value="global">Global only</option>
                    <option value="organization">Org targeted</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-gray-700">
                  Severity
                  <select
                    value={digestSeverity}
                    onChange={(event) =>
                      setDigestSeverity(
                        event.target.value as 'all' | 'critical' | 'high' | 'medium' | 'low'
                      )
                    }
                    className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="all">All severity</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-gray-700">
                  Review
                  <select
                    value={digestReviewStatus}
                    onChange={(event) =>
                      setDigestReviewStatus(
                        event.target.value as 'all' | 'pending' | 'acknowledged' | 'resolved'
                      )
                    }
                    className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="all">All review states</option>
                    <option value="pending">Pending</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-gray-700">
                  Window
                  <select
                    value={digestRecentDays}
                    onChange={(event) => setDigestRecentDays(event.target.value as '7' | '30' | '90')}
                    className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {loading && alertDigests.length === 0 ? (
                <div className="p-5 text-sm text-gray-500">Loading alert digests…</div>
              ) : alertDigests.length === 0 ? (
                <div className="p-5 text-sm text-gray-500">No alert digests queued yet.</div>
              ) : (
                alertDigests.map((digest) => (
                  <div key={digest.id} className="p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-sm font-black text-black">{digest.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {digest.notificationsType || 'ops_alert_digest'} • {' '}
                          {digest.targetOrganizationName
                            ? `target ${digest.targetOrganizationName}`
                            : digest.targetOrganizationId
                              ? `target ${digest.targetOrganizationId}`
                              : 'global'} • queued {formatDate(digest.createdAt)}
                        </div>
                        {digest.description ? (
                          <div className="text-xs text-gray-600 mt-2">{digest.description}</div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-bold ${digestSeverityClass(digest.severityLevel)}`}>
                          {digest.severityLevel} {digest.severityScore}
                        </span>
                        <span className={`px-2 py-1 text-xs font-bold ${statusClass(digest.status)}`}>
                          {digest.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-bold ${digestReviewClass(digest.reviewDecision)}`}>
                          {digest.reviewDecision || 'pending'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 text-xs mt-4">
                      <div className="bg-gray-50 border border-gray-200 p-2">
                        <div className="font-bold text-gray-600">Total</div>
                        <div className="text-black font-black">{digest.summary.total}</div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 p-2">
                        <div className="font-bold text-gray-600">Overdue</div>
                        <div className="text-black font-black">{digest.summary.overdueCommunityReports}</div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 p-2">
                        <div className="font-bold text-gray-600">No Validation</div>
                        <div className="text-black font-black">{digest.summary.spendWithoutValidation}</div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 p-2">
                        <div className="font-bold text-gray-600">Idle Matches</div>
                        <div className="text-black font-black">{digest.summary.strongMatchesNotEngaged}</div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 p-2">
                        <div className="font-bold text-gray-600">No Commitments</div>
                        <div className="text-black font-black">{digest.summary.awardsWithoutCommitments}</div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 p-2">
                        <div className="font-bold text-gray-600">No Updates</div>
                        <div className="text-black font-black">{digest.summary.commitmentsWithoutUpdates}</div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 p-2">
                        <div className="font-bold text-gray-600">Stalled</div>
                        <div className="text-black font-black">{digest.summary.engagedMatchesStalled}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Link
                        href={getDigestAction(digest).href}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                      >
                        {getDigestAction(digest).label}
                      </Link>
                      {!digest.reviewDecision && (
                        <button
                          onClick={() => reviewAlertDigest(digest.id, 'acknowledged')}
                          disabled={reviewingDigestId === digest.id}
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-[#eef4ff] text-[#1d4ed8] hover:bg-[#dbeafe] transition-colors disabled:opacity-50"
                        >
                          {reviewingDigestId === digest.id && reviewingDigestDecision === 'acknowledged'
                            ? 'Saving…'
                            : 'Acknowledge'}
                        </button>
                      )}
                      {digest.reviewDecision !== 'resolved' && (
                        <button
                          onClick={() => reviewAlertDigest(digest.id, 'resolved')}
                          disabled={reviewingDigestId === digest.id}
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black border border-black bg-[#e7f8ee] text-[#166534] hover:bg-[#d2f4de] transition-colors disabled:opacity-50"
                        >
                          {reviewingDigestId === digest.id && reviewingDigestDecision === 'resolved'
                            ? 'Saving…'
                            : 'Resolve'}
                        </button>
                      )}
                      {digest.reviewedAt ? (
                        <span className="text-[11px] text-gray-500">
                          Reviewed {formatDate(digest.reviewedAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-4 border-b-2 border-black bg-[#fff4db]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-black">Overdue Community Reports</h2>
                    <p className="text-sm text-gray-700">Awards with reporting dates already missed.</p>
                  </div>
                  <div className="text-3xl font-black text-amber-700">
                    {alerts?.summary.overdueCommunityReports || 0}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {loading && !alerts ? (
                  <div className="p-5 text-sm text-gray-500">Loading alerts…</div>
                ) : (alerts?.overdueCommunityReports.items || []).length === 0 ? (
                  <div className="p-5 text-sm text-gray-500">No overdue community reports right now.</div>
                ) : (
                  (alerts?.overdueCommunityReports.items || []).map((item) => (
                    <div key={item.funding_award_id} className="p-5">
                      <div className="text-sm font-black text-black">{item.organization_name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.funding_program_name} • {item.funding_source_name}
                      </div>
                      <div className="mt-2 text-xs text-red-700 font-bold">
                        Due {formatDate(item.community_report_due_at)}
                      </div>
                      <Link
                        href={`/admin/funding/os/community-reporting?fundingAwardId=${item.funding_award_id}&status=all`}
                        className="mt-3 inline-flex items-center gap-2 px-2.5 py-2 text-[11px] font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                      >
                        Open Reporting
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-4 border-b-2 border-black bg-[#fee2e2]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-black">Spend Without Validation</h2>
                    <p className="text-sm text-gray-700">Money is moving without community confirmation.</p>
                  </div>
                  <div className="text-3xl font-black text-red-700">
                    {alerts?.summary.spendWithoutValidation || 0}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {loading && !alerts ? (
                  <div className="p-5 text-sm text-gray-500">Loading alerts…</div>
                ) : (alerts?.spendWithoutValidation.items || []).length === 0 ? (
                  <div className="p-5 text-sm text-gray-500">No spend-without-validation alerts right now.</div>
                ) : (
                  (alerts?.spendWithoutValidation.items || []).map((item) => (
                    <div key={item.funding_award_id} className="p-5">
                      <div className="text-sm font-black text-black">{item.organization_name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.funding_program_name} • {item.funding_source_name}
                      </div>
                      <div className="mt-2 text-xs text-black">
                        {formatCurrency(item.tracked_public_spend)} tracked • {item.community_validation_count || 0} validations
                      </div>
                      <Link
                        href={`/admin/funding/os/community-reporting?fundingAwardId=${item.funding_award_id}&status=all`}
                        className="mt-3 inline-flex items-center gap-2 px-2.5 py-2 text-[11px] font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                      >
                        Add Validation
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-4 border-b-2 border-black bg-[#edf2ff]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-black">Strong Matches Not Engaged</h2>
                    <p className="text-sm text-gray-700">High-fit candidates still waiting for action.</p>
                  </div>
                  <div className="text-3xl font-black text-indigo-700">
                    {alerts?.summary.strongMatchesNotEngaged || 0}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {loading && !alerts ? (
                  <div className="p-5 text-sm text-gray-500">Loading alerts…</div>
                ) : (alerts?.strongMatchesNotEngaged.items || []).length === 0 ? (
                  <div className="p-5 text-sm text-gray-500">No high-score candidate backlog right now.</div>
                ) : (
                  (alerts?.strongMatchesNotEngaged.items || []).map((item) => (
                    <div key={item.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-black text-black truncate">
                            {item.organization?.name || item.organization_id}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {item.opportunity?.name || item.opportunity_id}
                          </div>
                        </div>
                        <div className={`px-2 py-1 text-xs font-bold ${recommendationClass(item.match_score)}`}>
                          {Math.round(item.match_score)}
                        </div>
                      </div>
                      <Link
                        href={`/admin/funding/os/pipeline?organizationId=${item.organization_id}&opportunityId=${item.opportunity_id}`}
                        className="mt-3 inline-flex items-center gap-2 px-2.5 py-2 text-[11px] font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                      >
                        Open Pipeline
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-4 border-b-2 border-black bg-[#ecfccb]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-black">Awards Missing Commitments</h2>
                    <p className="text-sm text-gray-700">Awards in flight with no defined outcome commitments.</p>
                  </div>
                  <div className="text-3xl font-black text-lime-700">
                    {alerts?.summary.awardsWithoutCommitments || 0}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {loading && !alerts ? (
                  <div className="p-5 text-sm text-gray-500">Loading alerts…</div>
                ) : (alerts?.awardsWithoutCommitments.items || []).length === 0 ? (
                  <div className="p-5 text-sm text-gray-500">No awards are missing commitments right now.</div>
                ) : (
                  (alerts?.awardsWithoutCommitments.items || []).map((item) => (
                    <div key={item.funding_award_id} className="p-5">
                      <div className="text-sm font-black text-black">{item.organization_name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.funding_program_name} • {item.funding_source_name}
                      </div>
                      <div className="mt-2 text-xs text-black">
                        {item.outcome_commitment_count || 0} commitments • {item.outcome_update_count || 0} updates
                      </div>
                      <Link
                        href={`/admin/funding/os/community-reporting?fundingAwardId=${item.funding_award_id}&status=all`}
                        className="mt-3 inline-flex items-center gap-2 px-2.5 py-2 text-[11px] font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                      >
                        Create Commitment
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-4 border-b-2 border-black bg-[#fae8ff]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-black">Commitments Missing Updates</h2>
                    <p className="text-sm text-gray-700">Promises exist, but no reported progress has landed.</p>
                  </div>
                  <div className="text-3xl font-black text-fuchsia-700">
                    {alerts?.summary.commitmentsWithoutUpdates || 0}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {loading && !alerts ? (
                  <div className="p-5 text-sm text-gray-500">Loading alerts…</div>
                ) : (alerts?.commitmentsWithoutUpdates.items || []).length === 0 ? (
                  <div className="p-5 text-sm text-gray-500">No commitments are waiting on first updates.</div>
                ) : (
                  (alerts?.commitmentsWithoutUpdates.items || []).map((item) => (
                    <div key={item.id} className="p-5">
                      <div className="text-sm font-black text-black">{item.organization_name}</div>
                      <div className="text-xs text-gray-500 mt-1">{item.outcome_name}</div>
                      <div className="mt-2 text-xs text-black">
                        {item.commitment_status} • last touched {formatDate(item.updated_at)}
                      </div>
                      <Link
                        href={`/admin/funding/os/community-reporting?commitmentId=${item.id}&status=all`}
                        className="mt-3 inline-flex items-center gap-2 px-2.5 py-2 text-[11px] font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                      >
                        Submit Update
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-4 border-b-2 border-black bg-[#ffe4e6]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-black">Engaged Matches Stalled</h2>
                    <p className="text-sm text-gray-700">Matches moved forward, then stopped progressing.</p>
                  </div>
                  <div className="text-3xl font-black text-rose-700">
                    {alerts?.summary.engagedMatchesStalled || 0}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {loading && !alerts ? (
                  <div className="p-5 text-sm text-gray-500">Loading alerts…</div>
                ) : (alerts?.engagedMatchesStalled.items || []).length === 0 ? (
                  <div className="p-5 text-sm text-gray-500">No engaged matches are stalled right now.</div>
                ) : (
                  (alerts?.engagedMatchesStalled.items || []).map((item) => (
                    <div key={item.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-black text-black truncate">
                            {item.organization?.name || item.organization_id}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {item.opportunity?.name || item.opportunity_id}
                          </div>
                          <div className="mt-2 text-xs text-black">
                            Last moved {formatDate(item.updated_at)}
                          </div>
                        </div>
                        <div className={`px-2 py-1 text-xs font-bold ${recommendationClass(item.match_score)}`}>
                          {Math.round(item.match_score)}
                        </div>
                      </div>
                      <Link
                        href={`/admin/funding/os/pipeline?organizationId=${item.organization_id}&opportunityId=${item.opportunity_id}`}
                        className="mt-3 inline-flex items-center gap-2 px-2.5 py-2 text-[11px] font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                      >
                        Resume Pipeline
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-4 border-b-2 border-black bg-[#e6efe6]">
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-emerald-700" />
                  <h2 className="text-xl font-black text-black">Capability Profiles</h2>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  Basecamp and partner organizations with the strongest visible readiness signals.
                </p>
              </div>
              <div className="max-h-[42rem] overflow-auto divide-y divide-gray-100">
                {loading && profiles.length === 0 ? (
                  <div className="p-5 text-sm text-gray-500">Loading capability profiles…</div>
                ) : profiles.length === 0 ? (
                  <div className="p-5 text-sm text-gray-500">No capability profiles yet. Run bootstrap to seed them.</div>
                ) : (
                  profiles.map((profile) => (
                    <div key={profile.id} className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="text-lg font-black text-black">
                            {profile.organization?.name || profile.organization_id}
                          </div>
                          <div className="text-xs text-gray-500">
                            {profile.organization?.city || '—'}
                            {profile.organization?.state ? `, ${profile.organization.state}` : ''}
                          </div>
                        </div>
                        <div className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold">
                          {profile.funding_readiness_score}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Trust</div>
                          <div className="text-black font-black">{profile.community_trust_score}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Reporting</div>
                          <div className="text-black font-black">{profile.reporting_to_community_score}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Delivery</div>
                          <div className="text-black font-black">{profile.delivery_confidence_score}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(profile.capability_tags || []).slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs font-bold bg-[#eef3ff] text-[#1d4ed8] border border-[#c7d2fe]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-600">
                        {(profile.signals || []).length} visible signals
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="xl:col-span-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-4 border-b-2 border-black bg-[#edf2ff]">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-700" />
                  <h2 className="text-xl font-black text-black">Match Recommendations</h2>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  Current best-fit matches produced by the funding operating system.
                </p>
              </div>
              <div className="max-h-[42rem] overflow-auto divide-y divide-gray-100">
                {loading && matches.length === 0 ? (
                  <div className="p-5 text-sm text-gray-500">Loading recommendations…</div>
                ) : matches.length === 0 ? (
                  <div className="p-5 text-sm text-gray-500">No recommendations yet. Run bootstrap to generate them.</div>
                ) : (
                  matches.map((match) => (
                    <div key={match.id} className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <div className="text-sm font-black text-black truncate">
                            {match.organization?.name || `Org ${match.organization_id.slice(0, 8)}`}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {match.opportunity?.name || `Opp ${match.opportunity_id.slice(0, 8)}`}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {(match.opportunity?.funder_name || 'Unknown funder')} • {match.recommendation_status.replace(/_/g, ' ')}
                          </div>
                        </div>
                        <div className={`px-2 py-1 text-xs font-bold ${recommendationClass(match.match_score)}`}>
                          {Math.round(match.match_score)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Readiness</div>
                          <div className="text-black font-black">{Math.round(match.readiness_score)}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Community</div>
                          <div className="text-black font-black">{Math.round(match.community_alignment_score)}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Outcome</div>
                          <div className="text-black font-black">{Math.round(match.outcome_alignment_score)}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Geo Fit</div>
                          <div className="text-black font-black">{Math.round(match.geographic_fit_score)}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        Focus overlap: {(match.explainability?.overlap?.opportunityFocusAreas || []).slice(0, 3).join(', ') || '—'}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-xs text-gray-500">
                          {match.organization?.city || '—'}
                          {match.organization?.state ? `, ${match.organization.state}` : ''}
                        </div>
                        <button
                          onClick={() => promoteRecommendation(match.id)}
                          disabled={promotingId === match.id}
                          className="px-3 py-2 text-xs font-bold bg-black text-white border-2 border-black hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          {promotingId === match.id ? 'Promoting…' : 'Promote to Pipeline'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="xl:col-span-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-4 border-b-2 border-black bg-[#fff4db]">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-amber-700" />
                  <h2 className="text-xl font-black text-black">Workflow Output</h2>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  Recent ingest, refresh, and matching runs with their scan/change counts.
                </p>
              </div>
              <div className="max-h-[42rem] overflow-auto divide-y divide-gray-100">
                {loading && workflows.length === 0 ? (
                  <div className="p-5 text-sm text-gray-500">Loading workflows…</div>
                ) : workflows.length === 0 ? (
                  <div className="p-5 text-sm text-gray-500">No workflows recorded yet.</div>
                ) : (
                  workflows.map((workflow) => (
                    <div key={workflow.id} className="p-5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                          <div className="text-sm font-black text-black">{workflow.workflow_type}</div>
                          <div className="text-xs text-gray-500">{workflow.scope_kind}</div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-bold ${statusClass(workflow.workflow_status)}`}>
                          {workflow.workflow_status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Scanned</div>
                          <div className="text-black font-black">{workflow.records_scanned}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Changed</div>
                          <div className="text-black font-black">{workflow.records_changed}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        Started: {formatDate(workflow.started_at)}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        Duration: {formatDuration(workflow.started_at, workflow.completed_at)}
                      </div>
                      {workflow.error_count > 0 && (
                        <div className="text-xs font-bold text-red-700 mb-1">
                          Errors: {workflow.error_count}
                        </div>
                      )}
                      <div className="text-[11px] text-gray-500 font-mono break-words">
                        {JSON.stringify(workflow.output_payload || {}).slice(0, 220) || '{}'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
