'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import { ArrowLeft, CheckCircle2, FileText, RefreshCw, ShieldCheck } from 'lucide-react';

interface PublicEvidenceSubmission {
  id: string;
  kind: 'update' | 'validation';
  submittedAt?: string | null;
  commitmentId: string;
  updateId?: string | null;
  validationId?: string | null;
  summary?: string | null;
  updateType?: string | null;
  validationStatus?: string | null;
  confidenceScore?: number | null;
  trustRating?: number | null;
  impactRating?: number | null;
  organization?: {
    id: string;
    name: string;
    city?: string | null;
    state?: string | null;
  } | null;
  relationship?: {
    id: string;
    status: string;
    currentStageLabel?: string | null;
  } | null;
  award?: {
    id: string;
    award_status?: string | null;
  } | null;
  outcomeDefinition?: {
    id: string;
    name: string;
    outcome_domain?: string | null;
  } | null;
  review?: {
    workflowId: string;
    status: 'acknowledged';
    reviewedAt?: string | null;
    reviewedByUserId?: string | null;
  } | null;
  followUp?: {
    taskId: string;
    status: string;
    createdAt?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
  } | null;
  outreachFollowUp?: {
    taskId: string;
    status: string;
    createdAt?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    conversationTaskId?: string | null;
    conversationTaskStatus?: string | null;
    conversationError?: string | null;
  } | null;
  opsFollowUp?: {
    taskId: string;
    status: string;
    createdAt?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
  } | null;
  partnerRiskFollowUp?: {
    taskId: string;
    status: string;
    createdAt?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
  } | null;
  relationshipRiskFollowUp?: {
    taskId: string;
    status: string;
    createdAt?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
  } | null;
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function kindClass(kind: string) {
  return kind === 'update'
    ? 'bg-emerald-100 text-emerald-800'
    : 'bg-blue-100 text-blue-800';
}

function deriveSubmissionSeverity(
  row: Pick<
    PublicEvidenceSubmission,
    'kind' | 'validationStatus' | 'confidenceScore'
  >
) {
  if (row.kind === 'validation') {
    const validationStatus = String(row.validationStatus || '').trim().toLowerCase();
    if (validationStatus === 'contested' || validationStatus === 'needs_follow_up') {
      return 'urgent';
    }
    if (validationStatus === 'mixed') {
      return 'high';
    }
    return 'normal';
  }

  const confidence =
    typeof row.confidenceScore === 'number' && Number.isFinite(row.confidenceScore)
      ? row.confidenceScore
      : null;

  if (confidence !== null && confidence < 50) {
    return 'high';
  }

  return 'normal';
}

function severityClass(level: string) {
  if (level === 'urgent') return 'bg-red-100 text-red-800';
  if (level === 'high') return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-700';
}

function isUnworkedSubmission(
  row: Pick<
    PublicEvidenceSubmission,
    'review' | 'followUp' | 'outreachFollowUp' | 'opsFollowUp' | 'partnerRiskFollowUp'
  >
) {
  return (
    !row.review &&
    !row.followUp &&
    !row.outreachFollowUp &&
    !row.opsFollowUp &&
    !row.partnerRiskFollowUp
  );
}

function parseCommunityContext(summary?: string | null) {
  const text = String(summary || '').trim();
  const marker = '[Community context]';

  if (!text.startsWith(marker)) {
    return {
      hasContext: false,
      allowsFollowUp: false,
      contextBlock: null as string | null,
      remainder: text || null,
    };
  }

  const remainder = text.slice(marker.length).trim();
  const splitIndex = remainder.indexOf('\n\n');

  if (splitIndex === -1) {
    const fullContextBlock = remainder || null;
    return {
      hasContext: true,
      allowsFollowUp: /(^|\n)Follow-up contact:\s*Yes$/im.test(fullContextBlock || ''),
      contextBlock: fullContextBlock,
      remainder: null,
    };
  }

  const contextBlock = remainder.slice(0, splitIndex).trim();
  const nextContent = remainder.slice(splitIndex + 2).trim();

  return {
    hasContext: true,
    allowsFollowUp: /(^|\n)Follow-up contact:\s*Yes$/im.test(contextBlock),
    contextBlock: contextBlock || null,
    remainder: nextContent || null,
  };
}

export default function FundingPublicSubmissionsPage() {
  const [rows, setRows] = useState<PublicEvidenceSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<'all' | 'update' | 'validation'>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'acknowledged'>('all');
  const [escalatedOnly, setEscalatedOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [urgentUnworkedOnly, setUrgentUnworkedOnly] = useState(false);
  const [contactableOnly, setContactableOnly] = useState(false);
  const [contactOutreachOnly, setContactOutreachOnly] = useState(false);
  const [reviewingKey, setReviewingKey] = useState<string | null>(null);
  const [escalatingKey, setEscalatingKey] = useState<string | null>(null);
  const [outreachKey, setOutreachKey] = useState<string | null>(null);
  const [bridgingKey, setBridgingKey] = useState<string | null>(null);
  const [riskBridgingKey, setRiskBridgingKey] = useState<string | null>(null);
  const [relationshipRiskKey, setRelationshipRiskKey] = useState<string | null>(null);
  const [taskActionKey, setTaskActionKey] = useState<string | null>(null);

  const fetchData = async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', '80');
      if (kindFilter !== 'all') {
        params.set('kind', kindFilter);
      }
      if (reviewFilter !== 'all') {
        params.set('review', reviewFilter);
      }

      const response = await fetch(`/api/admin/funding/os/public-submissions?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load public submissions');
      }

      setRows(payload.data || []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : 'Failed to load public submissions'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kindFilter, reviewFilter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const focus = String(params.get('focus') || '').trim().toLowerCase();

    if (focus === 'urgent-contactable') {
      setEscalatedOnly(false);
      setUrgentOnly(true);
      setUrgentUnworkedOnly(false);
      setContactableOnly(true);
      setContactOutreachOnly(false);
      return;
    }

    if (focus === 'contact-outreach') {
      setEscalatedOnly(false);
      setUrgentOnly(false);
      setUrgentUnworkedOnly(false);
      setContactableOnly(false);
      setContactOutreachOnly(true);
    }
  }, []);

  const visibleRows = useMemo(() => {
    let nextRows = rows;

    if (urgentUnworkedOnly) {
      nextRows = nextRows.filter(
        (row) =>
          deriveSubmissionSeverity(row) === 'urgent' && isUnworkedSubmission(row)
      );
    }

    if (escalatedOnly) {
      nextRows = nextRows.filter((row) => row.followUp);
    }

    if (urgentOnly) {
      nextRows = nextRows.filter((row) => deriveSubmissionSeverity(row) === 'urgent');
    }

    if (contactableOnly) {
      nextRows = nextRows.filter((row) => parseCommunityContext(row.summary).allowsFollowUp);
    }

    if (contactOutreachOnly) {
      nextRows = nextRows.filter((row) => row.outreachFollowUp);
    }

    return nextRows;
  }, [rows, escalatedOnly, urgentOnly, urgentUnworkedOnly, contactableOnly, contactOutreachOnly]);

  const metrics = useMemo(() => {
    const updateCount = visibleRows.filter((row) => row.kind === 'update').length;
    const validationCount = visibleRows.filter((row) => row.kind === 'validation').length;
    const withNotes = visibleRows.filter((row) => row.summary && row.summary.trim()).length;
    const withContext = visibleRows.filter((row) => parseCommunityContext(row.summary).hasContext)
      .length;
    const followUpReady = visibleRows.filter(
      (row) => parseCommunityContext(row.summary).allowsFollowUp
    ).length;
    const acknowledgedCount = visibleRows.filter((row) => row.review).length;
    const escalatedCount = visibleRows.filter((row) => row.followUp).length;
    const outreachCount = visibleRows.filter((row) => row.outreachFollowUp).length;
    const opsQueueCount = visibleRows.filter((row) => row.opsFollowUp).length;
    const partnerRiskQueueCount = visibleRows.filter((row) => row.partnerRiskFollowUp).length;
    const relationshipRiskQueueCount = visibleRows.filter(
      (row) => row.relationshipRiskFollowUp
    ).length;
    const urgentCount = visibleRows.filter(
      (row) => deriveSubmissionSeverity(row) === 'urgent'
    ).length;
    const highCount = visibleRows.filter(
      (row) => deriveSubmissionSeverity(row) === 'high'
    ).length;
    const urgentUnworkedCount = rows.filter(
      (row) =>
        deriveSubmissionSeverity(row) === 'urgent' && isUnworkedSubmission(row)
    ).length;
    const urgentContactableCount = rows.filter(
      (row) =>
        deriveSubmissionSeverity(row) === 'urgent' &&
        parseCommunityContext(row.summary).allowsFollowUp
    ).length;

    return {
      total: visibleRows.length,
      updateCount,
      validationCount,
      withNotes,
      withContext,
      followUpReady,
      acknowledgedCount,
      escalatedCount,
      outreachCount,
      opsQueueCount,
      partnerRiskQueueCount,
      relationshipRiskQueueCount,
      urgentCount,
      highCount,
      urgentUnworkedCount,
      urgentContactableCount,
    };
  }, [rows, visibleRows]);

  const acknowledgeSubmission = async (row: PublicEvidenceSubmission) => {
    const reviewKey = `${row.kind}:${row.id}`;

    try {
      setReviewingKey(reviewKey);
      setError(null);

      const response = await fetch('/api/admin/funding/os/public-submissions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: row.kind,
          submissionId: row.id,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to acknowledge submission');
      }

      await fetchData(true);
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : 'Failed to acknowledge submission'
      );
    } finally {
      setReviewingKey(null);
    }
  };

  const sendToOperatingQueue = async (row: PublicEvidenceSubmission) => {
    const actionKey = `${row.kind}:${row.id}`;

    try {
      setBridgingKey(actionKey);
      setError(null);

      const response = await fetch('/api/admin/funding/os/public-submissions/ops-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: row.kind,
          submissionId: row.id,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send submission to the main follow-up queue');
      }

      await fetchData(true);
    } catch (bridgeError) {
      setError(
        bridgeError instanceof Error
          ? bridgeError.message
          : 'Failed to send submission to the main follow-up queue'
      );
    } finally {
      setBridgingKey(null);
    }
  };

  const createContactOutreach = async (row: PublicEvidenceSubmission) => {
    const actionKey = `${row.kind}:${row.id}`;

    try {
      setOutreachKey(actionKey);
      setError(null);

      const response = await fetch(
        '/api/admin/funding/os/public-submissions/contact-outreach',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: row.kind,
            submissionId: row.id,
          }),
        }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create contact outreach task');
      }

      await fetchData(true);
    } catch (outreachError) {
      setError(
        outreachError instanceof Error
          ? outreachError.message
          : 'Failed to create contact outreach task'
      );
    } finally {
      setOutreachKey(null);
    }
  };

  const sendToPartnerRiskQueue = async (row: PublicEvidenceSubmission) => {
    const actionKey = `${row.kind}:${row.id}`;

    try {
      setRiskBridgingKey(actionKey);
      setError(null);

      const response = await fetch('/api/admin/funding/os/public-submissions/ops-risk-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: row.kind,
          submissionId: row.id,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send submission to the partner-risk queue');
      }

      await fetchData(true);
    } catch (bridgeError) {
      setError(
        bridgeError instanceof Error
          ? bridgeError.message
          : 'Failed to send submission to the partner-risk queue'
      );
    } finally {
      setRiskBridgingKey(null);
    }
  };

  const sendToRelationshipRiskQueue = async (row: PublicEvidenceSubmission) => {
    const actionKey = `${row.kind}:${row.id}`;

    try {
      setRelationshipRiskKey(actionKey);
      setError(null);

      const response = await fetch(
        '/api/admin/funding/os/public-submissions/relationship-risk-followup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: row.kind,
            submissionId: row.id,
          }),
        }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error || 'Failed to send submission to the relationship workflow'
        );
      }

      await fetchData(true);
    } catch (bridgeError) {
      setError(
        bridgeError instanceof Error
          ? bridgeError.message
          : 'Failed to send submission to the relationship workflow'
      );
    } finally {
      setRelationshipRiskKey(null);
    }
  };

  const escalateSubmission = async (row: PublicEvidenceSubmission) => {
    const actionKey = `${row.kind}:${row.id}`;

    try {
      setEscalatingKey(actionKey);
      setError(null);

      const response = await fetch('/api/admin/funding/os/public-submissions/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: row.kind,
          submissionId: row.id,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to escalate submission');
      }

      await fetchData(true);
    } catch (escalateError) {
      setError(
        escalateError instanceof Error
          ? escalateError.message
          : 'Failed to escalate submission'
      );
    } finally {
      setEscalatingKey(null);
    }
  };

  const updateFollowUpStatus = async (
    row: PublicEvidenceSubmission,
    status: 'queued' | 'running' | 'completed'
  ) => {
    if (!row.followUp?.taskId) return;

    const actionKey = `${row.followUp.taskId}:${status}`;

    try {
      setTaskActionKey(actionKey);
      setError(null);

      const response = await fetch(
        '/api/admin/funding/os/public-submissions/follow-up-status',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: row.followUp.taskId,
            status,
          }),
        }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update follow-up');
      }

      await fetchData(true);
    } catch (statusError) {
      setError(
        statusError instanceof Error ? statusError.message : 'Failed to update follow-up'
      );
    } finally {
      setTaskActionKey(null);
    }
  };

  const updateContactOutreachStatus = async (
    row: PublicEvidenceSubmission,
    status: 'queued' | 'running' | 'completed'
  ) => {
    if (!row.outreachFollowUp?.taskId) return;

    const actionKey = `${row.outreachFollowUp.taskId}:${status}`;

    try {
      setTaskActionKey(actionKey);
      setError(null);

      const response = await fetch(
        '/api/admin/funding/os/public-submissions/contact-outreach-status',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: row.outreachFollowUp.taskId,
            status,
          }),
        }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update contact outreach');
      }

      await fetchData(true);
    } catch (statusError) {
      setError(
        statusError instanceof Error ? statusError.message : 'Failed to update contact outreach'
      );
    } finally {
      setTaskActionKey(null);
    }
  };

  const toggleEscalatedOnly = () => {
    if (urgentUnworkedOnly) {
      setUrgentUnworkedOnly(false);
    }
    setEscalatedOnly((current) => !current);
  };

  const toggleUrgentOnly = () => {
    if (urgentUnworkedOnly) {
      setUrgentUnworkedOnly(false);
    }
    setUrgentOnly((current) => !current);
  };

  const toggleUrgentUnworkedOnly = () => {
    setUrgentUnworkedOnly((current) => {
      const next = !current;
      if (next) {
        setEscalatedOnly(false);
        setUrgentOnly(false);
      }
      return next;
    });
  };

  const toggleContactableOnly = () => {
    setContactableOnly((current) => !current);
  };

  const toggleContactOutreachOnly = () => {
    if (urgentUnworkedOnly) {
      setUrgentUnworkedOnly(false);
    }
    setContactOutreachOnly((current) => !current);
  };

  const urgentContactableOnly =
    urgentOnly && contactableOnly && !urgentUnworkedOnly && !escalatedOnly;

  const toggleUrgentContactableOnly = () => {
    if (urgentContactableOnly) {
      setUrgentOnly(false);
      setContactableOnly(false);
      return;
    }

    setUrgentUnworkedOnly(false);
    setEscalatedOnly(false);
    setUrgentOnly(true);
    setContactableOnly(true);
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
                Back to Funding OS Review
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-amber-500 text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Public Evidence Review</h1>
                  <p className="text-base text-gray-600">
                    Review recent community-submitted updates and validations coming in through the public accountability flow.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="border-2 border-red-500 bg-red-50 text-red-800 p-4 mb-6 font-medium">
              {error}
            </div>
          )}

          <section className="bg-white border-2 border-black p-5 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                  Submission Type
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['all', 'All'],
                    ['update', 'Updates'],
                    ['validation', 'Validations'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setKindFilter(value as 'all' | 'update' | 'validation')
                      }
                      className={`px-3 py-2 border-2 border-black text-sm font-bold transition-colors ${
                        kindFilter === value ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                  Review Status
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['all', 'All'],
                    ['pending', 'Pending'],
                    ['acknowledged', 'Acknowledged'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setReviewFilter(value as 'all' | 'pending' | 'acknowledged')
                      }
                      className={`px-3 py-2 border-2 border-black text-sm font-bold transition-colors ${
                        reviewFilter === value ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 lg:items-end">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={toggleEscalatedOnly}
                    className={`px-3 py-2 border-2 border-black text-sm font-bold transition-colors ${
                      escalatedOnly ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {escalatedOnly ? 'Escalated Only' : 'Show Escalated Only'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleUrgentOnly}
                    className={`px-3 py-2 border-2 border-black text-sm font-bold transition-colors ${
                      urgentOnly ? 'bg-red-700 text-white' : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {urgentOnly ? 'Urgent Only' : 'Show Urgent Only'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleUrgentUnworkedOnly}
                    className={`px-3 py-2 border-2 border-black text-sm font-bold transition-colors ${
                      urgentUnworkedOnly ? 'bg-red-900 text-white' : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {urgentUnworkedOnly ? 'Urgent + Unworked' : 'Show Urgent + Unworked'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleContactableOnly}
                    className={`px-3 py-2 border-2 border-black text-sm font-bold transition-colors ${
                      contactableOnly ? 'bg-sky-700 text-white' : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {contactableOnly ? 'Contactable Only' : 'Show Contactable Only'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleContactOutreachOnly}
                    className={`px-3 py-2 border-2 border-black text-sm font-bold transition-colors ${
                      contactOutreachOnly ? 'bg-sky-900 text-white' : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {contactOutreachOnly ? 'Contact Tasks' : 'Show Contact Tasks'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleUrgentContactableOnly}
                    className={`px-3 py-2 border-2 border-black text-sm font-bold transition-colors ${
                      urgentContactableOnly
                        ? 'bg-sky-900 text-white'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {urgentContactableOnly
                      ? 'Urgent + Contactable'
                      : 'Show Urgent + Contactable'}
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  Showing {visibleRows.length} of {rows.length} recent public submissions
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 mb-8">
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">Total</div>
              <div className="text-3xl font-black text-black">{metrics.total}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">Updates</div>
              <div className="text-3xl font-black text-black">{metrics.updateCount}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">Validations</div>
              <div className="text-3xl font-black text-black">{metrics.validationCount}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">With Notes</div>
              <div className="text-3xl font-black text-black">{metrics.withNotes}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">With Context</div>
              <div className="text-3xl font-black text-[#0f766e]">{metrics.withContext}</div>
            </div>
            <button
              type="button"
              onClick={() => setContactableOnly((current) => !current)}
              disabled={metrics.followUpReady === 0 && !contactableOnly}
              className={`border-2 border-black p-5 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors disabled:opacity-50 ${
                contactableOnly ? 'bg-sky-700 text-white' : 'bg-white hover:bg-sky-50'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">Follow-up OK</div>
              <div
                className={`text-3xl font-black ${
                  contactableOnly ? 'text-white' : 'text-sky-700'
                }`}
              >
                {metrics.followUpReady}
              </div>
              <div
                className={`text-xs mt-2 font-bold ${
                  contactableOnly ? 'text-sky-100' : 'text-gray-600'
                }`}
              >
                {contactableOnly ? 'Active queue' : 'Open this lane'}
              </div>
            </button>
            <button
              type="button"
              onClick={toggleUrgentContactableOnly}
              disabled={metrics.urgentContactableCount === 0 && !urgentContactableOnly}
              className={`border-2 border-black p-5 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors disabled:opacity-50 ${
                urgentContactableOnly
                  ? 'bg-sky-900 text-white'
                  : 'bg-white hover:bg-sky-50'
              }`}
            >
              <div
                className={`text-xs font-bold uppercase tracking-[0.18em] mb-2 ${
                  urgentContactableOnly ? 'text-sky-100' : 'text-gray-500'
                }`}
              >
                Urgent + Contactable
              </div>
              <div
                className={`text-3xl font-black ${
                  urgentContactableOnly ? 'text-white' : 'text-sky-900'
                }`}
              >
                {metrics.urgentContactableCount}
              </div>
              <div
                className={`text-xs mt-2 font-bold ${
                  urgentContactableOnly ? 'text-sky-100' : 'text-gray-600'
                }`}
              >
                {urgentContactableOnly ? 'Active queue' : 'Open this lane'}
              </div>
            </button>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">Acknowledged</div>
              <div className="text-3xl font-black text-black">{metrics.acknowledgedCount}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">Escalated</div>
              <div className="text-3xl font-black text-black">{metrics.escalatedCount}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">Contact Tasks</div>
              <div className="text-3xl font-black text-sky-900">{metrics.outreachCount}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">Main Queue</div>
              <div className="text-3xl font-black text-black">{metrics.opsQueueCount}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">Partner Risk</div>
              <div className="text-3xl font-black text-red-800">{metrics.partnerRiskQueueCount}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">Rel Risk</div>
              <div className="text-3xl font-black text-[#0f766e]">{metrics.relationshipRiskQueueCount}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">Urgent</div>
              <div className="text-3xl font-black text-red-700">{metrics.urgentCount}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">High</div>
              <div className="text-3xl font-black text-amber-700">{metrics.highCount}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!urgentUnworkedOnly) {
                  setUrgentUnworkedOnly(true);
                  setEscalatedOnly(false);
                  setUrgentOnly(false);
                }
              }}
              disabled={metrics.urgentUnworkedCount === 0 && !urgentUnworkedOnly}
              className={`border-2 border-black p-5 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors disabled:opacity-50 ${
                urgentUnworkedOnly
                  ? 'bg-red-900 text-white'
                  : 'bg-white hover:bg-red-50'
              }`}
            >
              <div
                className={`text-xs font-bold uppercase tracking-[0.18em] mb-2 ${
                  urgentUnworkedOnly ? 'text-red-100' : 'text-gray-500'
                }`}
              >
                Urgent + Unworked
              </div>
              <div
                className={`text-3xl font-black ${
                  urgentUnworkedOnly ? 'text-white' : 'text-red-700'
                }`}
              >
                {metrics.urgentUnworkedCount}
              </div>
              <div
                className={`text-xs mt-2 font-bold ${
                  urgentUnworkedOnly ? 'text-red-100' : 'text-gray-600'
                }`}
              >
                {urgentUnworkedOnly ? 'Active queue' : 'Open this lane'}
              </div>
            </button>
          </div>

          <section className="space-y-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading public submissions…</div>
            ) : visibleRows.length === 0 ? (
              <div className="bg-white border-2 border-black p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {escalatedOnly && urgentOnly
                  ? 'No urgent escalated public submissions found for this filter.'
                  : urgentContactableOnly
                    ? 'No urgent contactable public submissions found for this filter.'
                  : contactOutreachOnly
                    ? 'No contact outreach tasks are available in the current queue slice.'
                  : urgentUnworkedOnly
                    ? 'No urgent unworked public submissions found for this filter.'
                  : contactableOnly
                    ? 'No contactable public submissions found for this filter.'
                  : escalatedOnly
                    ? 'No escalated public submissions found for this filter.'
                    : urgentOnly
                      ? 'No urgent public submissions found for this filter.'
                      : 'No public submissions found for this filter.'}
              </div>
            ) : (
              visibleRows.map((row) => {
                const parsedSummary = parseCommunityContext(row.summary);
                const submissionSeverity = deriveSubmissionSeverity(row);
                const canCreateOutreach =
                  parsedSummary.allowsFollowUp && submissionSeverity === 'urgent';

                return (
                <div
                  key={`${row.kind}-${row.id}`}
                  className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <div
                          className={`inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${severityClass(
                            submissionSeverity
                          )}`}
                        >
                          {submissionSeverity}
                        </div>
                        <div
                          className={`inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${kindClass(
                            row.kind
                          )}`}
                        >
                          {row.kind}
                        </div>
                        <div className="inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] border border-black bg-amber-100 text-amber-900">
                          community submitted
                        </div>
                        {parsedSummary.hasContext && (
                          <div className="inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] border border-black bg-[#d1fae5] text-[#065f46]">
                            context provided
                          </div>
                        )}
                        {parsedSummary.allowsFollowUp && (
                          <div className="inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] border border-black bg-sky-100 text-sky-900">
                            follow-up ok
                          </div>
                        )}
                        {row.review && (
                          <div className="inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] border border-black bg-emerald-100 text-emerald-900">
                            acknowledged
                          </div>
                        )}
                        {row.followUp && (
                          <div className="inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] border border-black bg-rose-100 text-rose-900">
                            follow-up {row.followUp.status}
                          </div>
                        )}
                        {row.outreachFollowUp && (
                          <div className="inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] border border-black bg-sky-100 text-sky-900">
                            outreach {row.outreachFollowUp.status}
                          </div>
                        )}
                        {row.opsFollowUp && (
                          <div className="inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] border border-black bg-violet-100 text-violet-900">
                            main queue {row.opsFollowUp.status}
                          </div>
                        )}
                        {row.partnerRiskFollowUp && (
                          <div className="inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] border border-black bg-red-100 text-red-900">
                            partner risk {row.partnerRiskFollowUp.status}
                          </div>
                        )}
                        {row.relationshipRiskFollowUp && (
                          <div className="inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] border border-black bg-[#d1fae5] text-[#065f46]">
                            relationship risk {row.relationshipRiskFollowUp.status}
                          </div>
                        )}
                      </div>
                      <div className="text-lg font-black text-black">
                        {row.organization?.name || 'Unknown organization'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {row.outcomeDefinition?.name || 'Unnamed outcome'}
                        {row.organization?.state ? ` · ${row.organization.state}` : ''}
                      </div>
                      {row.relationship?.id ? (
                        <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#0f766e] mt-1">
                          Active relationship · {row.relationship.currentStageLabel || row.relationship.status}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-sm text-gray-600">
                      Submitted {formatDateTime(row.submittedAt)}
                      {row.review?.reviewedAt ? (
                        <div className="mt-1 text-[11px] font-medium text-emerald-700">
                          Reviewed {formatDateTime(row.review.reviewedAt)}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm">
                    <div className="bg-[#fafaf8] border border-gray-200 p-3">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-1">
                        Context
                      </div>
                      <div className="font-black text-black">
                        {row.kind === 'update'
                          ? row.updateType || 'update'
                          : row.validationStatus || 'validation'}
                      </div>
                    </div>
                    <div className="bg-[#fafaf8] border border-gray-200 p-3">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-1">
                        Confidence / Trust
                      </div>
                      <div className="font-black text-black">
                        {row.kind === 'update'
                          ? `${Math.round(row.confidenceScore || 0)}`
                          : `${row.trustRating ?? '—'} / 5`}
                      </div>
                    </div>
                    <div className="bg-[#fafaf8] border border-gray-200 p-3">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-1">
                        Impact / Award
                      </div>
                      <div className="font-black text-black">
                        {row.kind === 'validation'
                          ? `${row.impactRating ?? '—'} / 5`
                          : row.award?.award_status || '—'}
                      </div>
                    </div>
                  </div>

                  {parsedSummary.contextBlock && (
                    <div className="mt-4 border border-gray-200 bg-[#ecfdf5] p-4">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-1">
                        Community Context
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {parsedSummary.contextBlock}
                      </div>
                    </div>
                  )}

                  {parsedSummary.remainder && (
                    <div className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">
                      {parsedSummary.remainder}
                    </div>
                  )}

                  {row.followUp && (
                    <div className="mt-4 border border-gray-200 bg-[#fafaf8] p-4 text-sm">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-1">
                        Follow-up Task
                      </div>
                      <div className="font-black text-black">
                        {row.followUp.status}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Created {formatDateTime(row.followUp.createdAt)}
                      </div>
                    </div>
                  )}

                  {row.outreachFollowUp && (
                    <div className="mt-4 border border-gray-200 bg-sky-50 p-4 text-sm">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-1">
                        Contact Outreach
                      </div>
                      <div className="font-black text-black">
                        {row.outreachFollowUp.status}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Queued {formatDateTime(row.outreachFollowUp.createdAt)}
                      </div>
                      {row.outreachFollowUp.conversationTaskId ? (
                        <div className="mt-3 border border-sky-200 bg-white p-3">
                          <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-1">
                            Tracked Conversation
                          </div>
                          <div className="font-black text-black">
                            {row.outreachFollowUp.conversationTaskStatus || 'queued'}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Contact completion opened a real conversation request.
                          </div>
                        </div>
                      ) : row.outreachFollowUp.conversationError ? (
                        <div className="mt-3 border border-amber-200 bg-amber-50 p-3">
                          <div className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800 mb-1">
                            Conversation Follow-up
                          </div>
                          <div className="text-xs text-amber-900">
                            {row.outreachFollowUp.conversationError}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {row.opsFollowUp && (
                    <div className="mt-4 border border-gray-200 bg-[#f5f3ff] p-4 text-sm">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-1">
                        Main Funding OS Follow-up
                      </div>
                      <div className="font-black text-black">{row.opsFollowUp.status}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Queued {formatDateTime(row.opsFollowUp.createdAt)}
                      </div>
                    </div>
                  )}

                  {row.partnerRiskFollowUp && (
                    <div className="mt-4 border border-gray-200 bg-[#fef2f2] p-4 text-sm">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-1">
                        Main Partner-Risk Follow-up
                      </div>
                      <div className="font-black text-black">
                        {row.partnerRiskFollowUp.status}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Queued {formatDateTime(row.partnerRiskFollowUp.createdAt)}
                      </div>
                    </div>
                  )}

                  {row.relationshipRiskFollowUp && (
                    <div className="mt-4 border border-gray-200 bg-[#ecfdf5] p-4 text-sm">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-1">
                        Relationship Workflow Follow-up
                      </div>
                      <div className="font-black text-black">
                        {row.relationshipRiskFollowUp.status}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Queued {formatDateTime(row.relationshipRiskFollowUp.createdAt)}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/funding/accountability/commitments/${row.commitmentId}`}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Open Public Evidence
                    </Link>
                    <Link
                      href={`/admin/funding/os/community-reporting?commitmentId=${row.commitmentId}`}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white border-2 border-black text-xs font-black hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Review in Community Reporting
                    </Link>
                    {!row.review ? (
                      <button
                        type="button"
                        onClick={() => acknowledgeSubmission(row)}
                        disabled={reviewingKey === `${row.kind}:${row.id}`}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-black text-white border-2 border-black text-xs font-black hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {reviewingKey === `${row.kind}:${row.id}`
                          ? 'Acknowledging…'
                          : 'Acknowledge Submission'}
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-[#f0fdf4] text-emerald-900 border-2 border-black text-xs font-black">
                        <ShieldCheck className="w-4 h-4" />
                        Submission acknowledged
                      </div>
                    )}
                    {canCreateOutreach &&
                      (!row.outreachFollowUp ? (
                        <button
                          type="button"
                          onClick={() => createContactOutreach(row)}
                          disabled={outreachKey === `${row.kind}:${row.id}`}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-sky-700 text-white border-2 border-black text-xs font-black hover:bg-sky-800 transition-colors disabled:opacity-50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          {outreachKey === `${row.kind}:${row.id}`
                            ? 'Creating outreach…'
                            : 'Contact Contributor'}
                        </button>
                      ) : (
                        <>
                          {row.outreachFollowUp.status !== 'running' &&
                            row.outreachFollowUp.status !== 'completed' && (
                              <button
                                type="button"
                                onClick={() => updateContactOutreachStatus(row, 'running')}
                                disabled={
                                  taskActionKey === `${row.outreachFollowUp?.taskId}:running`
                                }
                                className="inline-flex items-center gap-2 px-3 py-2 bg-sky-700 text-white border-2 border-black text-xs font-black hover:bg-sky-800 transition-colors disabled:opacity-50"
                              >
                                Start Contact
                              </button>
                            )}
                          {row.outreachFollowUp.status === 'running' && (
                            <button
                              type="button"
                              onClick={() => updateContactOutreachStatus(row, 'queued')}
                              disabled={
                                taskActionKey === `${row.outreachFollowUp?.taskId}:queued`
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              Return Outreach
                            </button>
                          )}
                          {row.outreachFollowUp.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => updateContactOutreachStatus(row, 'completed')}
                              disabled={
                                taskActionKey === `${row.outreachFollowUp?.taskId}:completed`
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 bg-sky-900 text-white border-2 border-black text-xs font-black hover:opacity-90 transition-colors disabled:opacity-50"
                            >
                              Mark Contact Complete
                            </button>
                          )}
                          {row.outreachFollowUp.conversationTaskId && (
                            <Link
                              href="/admin/funding/os/conversations"
                              className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                            >
                              Open Conversations
                            </Link>
                          )}
                        </>
                      ))}
                    {!row.followUp ? (
                      <button
                        type="button"
                        onClick={() => escalateSubmission(row)}
                        disabled={escalatingKey === `${row.kind}:${row.id}`}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-[#7c2d12] text-white border-2 border-black text-xs font-black hover:bg-[#9a3412] transition-colors disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {escalatingKey === `${row.kind}:${row.id}`
                          ? 'Escalating…'
                          : 'Escalate Follow-up'}
                      </button>
                    ) : (
                      <>
                        {!row.opsFollowUp ? (
                          <button
                            type="button"
                            onClick={() => sendToOperatingQueue(row)}
                            disabled={bridgingKey === `${row.kind}:${row.id}`}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-violet-700 text-white border-2 border-black text-xs font-black hover:bg-violet-800 transition-colors disabled:opacity-50"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            {bridgingKey === `${row.kind}:${row.id}`
                              ? 'Sending…'
                              : 'Send to Main Follow-up'}
                          </button>
                        ) : (
                          <Link
                            href={
                              submissionSeverity === 'urgent'
                                ? '/admin/funding/os/followups?routingClass=reporting&severity=critical'
                                : '/admin/funding/os/followups?routingClass=reporting'
                            }
                            className="inline-flex items-center gap-2 px-3 py-2 bg-[#f5f3ff] text-violet-900 border-2 border-black text-xs font-black hover:bg-[#ede9fe] transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Open Reporting Follow-up
                          </Link>
                        )}
                        {submissionSeverity === 'urgent' &&
                          (!row.partnerRiskFollowUp ? (
                            <button
                              type="button"
                              onClick={() => sendToPartnerRiskQueue(row)}
                              disabled={riskBridgingKey === `${row.kind}:${row.id}`}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-red-700 text-white border-2 border-black text-xs font-black hover:bg-red-800 transition-colors disabled:opacity-50"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              {riskBridgingKey === `${row.kind}:${row.id}`
                                ? 'Escalating risk…'
                                : 'Escalate Partner Risk'}
                            </button>
                          ) : (
                            <Link
                              href="/admin/funding/os/followups?routingClass=pipeline&severity=critical"
                              className="inline-flex items-center gap-2 px-3 py-2 bg-[#fef2f2] text-red-900 border-2 border-black text-xs font-black hover:bg-[#fee2e2] transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              Open Partner-Risk Follow-up
                            </Link>
                          ))}
                        {submissionSeverity === 'urgent' && row.relationship?.id &&
                          (!row.relationshipRiskFollowUp ? (
                            <button
                              type="button"
                              onClick={() => sendToRelationshipRiskQueue(row)}
                              disabled={relationshipRiskKey === `${row.kind}:${row.id}`}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-[#0f766e] text-white border-2 border-black text-xs font-black hover:opacity-90 transition-colors disabled:opacity-50"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              {relationshipRiskKey === `${row.kind}:${row.id}`
                                ? 'Routing relationship…'
                                : 'Escalate Relationship Risk'}
                            </button>
                          ) : (
                            <Link
                              href="/admin/funding/os/relationships/stage-tasks?stageKey=partner_risk_review"
                              className="inline-flex items-center gap-2 px-3 py-2 bg-[#ecfdf5] text-[#065f46] border-2 border-black text-xs font-black hover:bg-[#d1fae5] transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              Open Relationship Risk
                            </Link>
                          ))}
                        {row.followUp.status !== 'running' && row.followUp.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => updateFollowUpStatus(row, 'running')}
                            disabled={taskActionKey === `${row.followUp?.taskId}:running`}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-[#1d4ed8] text-white border-2 border-black text-xs font-black hover:bg-[#1e40af] transition-colors disabled:opacity-50"
                          >
                            Start Work
                          </button>
                        )}
                        {row.followUp.status === 'running' && (
                          <button
                            type="button"
                            onClick={() => updateFollowUpStatus(row, 'queued')}
                            disabled={taskActionKey === `${row.followUp?.taskId}:queued`}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors disabled:opacity-50"
                          >
                            Return to Queue
                          </button>
                        )}
                        {row.followUp.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => updateFollowUpStatus(row, 'completed')}
                            disabled={taskActionKey === `${row.followUp?.taskId}:completed`}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-black text-white border-2 border-black text-xs font-black hover:bg-gray-800 transition-colors disabled:opacity-50"
                          >
                            Mark Complete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )})
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
