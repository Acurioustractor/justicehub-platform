'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  HandCoins,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface ValidationRecord {
  id: string;
  validator_user_id?: string | null;
  validator_kind: string;
  validator_name?: string | null;
  validation_status: string;
  validation_notes?: string | null;
  impact_rating?: number | null;
  trust_rating?: number | null;
  validated_at?: string | null;
}

interface UpdateRecord {
  id: string;
  reported_by_user_id?: string | null;
  update_type: string;
  reported_value?: number | null;
  reported_at?: string | null;
  narrative?: string | null;
  confidence_score: number;
  evidence_urls?: string[] | null;
  validations: ValidationRecord[];
}

interface CommitmentDetail {
  id: string;
  commitment_status: string;
  baseline_value?: number | null;
  target_value?: number | null;
  current_value?: number | null;
  target_date?: string | null;
  measurement_notes?: string | null;
  evidence_confidence_score: number;
  community_priority_weight: number;
  outcomeDefinition?: {
    id: string;
    name: string;
    outcome_domain: string;
    unit?: string | null;
    description?: string | null;
  } | null;
  updates: UpdateRecord[];
}

interface AwardDetail {
  id: string;
  award_status: string;
  award_type: string;
  amount_awarded: number;
  amount_disbursed: number;
  community_report_due_at?: string | null;
  fundingSource?: {
    id: string;
    name: string;
  } | null;
  fundingProgram?: {
    id: string;
    name: string;
  } | null;
  organization?: {
    id: string;
    name: string;
    city?: string | null;
    state?: string | null;
  } | null;
}

interface TransactionRecord {
  id: string;
  transaction_type: string;
  transaction_status: string;
  amount: number;
  transaction_date?: string | null;
  description?: string | null;
}

interface SubmissionNotice {
  type: 'success' | 'error';
  message: string;
}

function formatCurrency(amount?: number | null) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '$0';
  return amount.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  });
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

function formatNumber(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-AU', {
    maximumFractionDigits: 2,
  });
}

export default function FundingCommitmentAccountabilityDetailPage() {
  const params = useParams<{ commitmentId: string }>();
  const searchParams = useSearchParams();
  const commitmentId = String(params?.commitmentId || '').trim();
  const contributionMode = String(searchParams?.get('contribute') || '')
    .trim()
    .toLowerCase();

  const [award, setAward] = useState<AwardDetail | null>(null);
  const [commitment, setCommitment] = useState<CommitmentDetail | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionNotice, setSubmissionNotice] = useState<SubmissionNotice | null>(null);
  const [submittingMode, setSubmittingMode] = useState<'update' | 'validation' | null>(null);
  const [updateType, setUpdateType] = useState<'progress' | 'milestone' | 'final'>('progress');
  const [reportedValueInput, setReportedValueInput] = useState('');
  const [updateNarrative, setUpdateNarrative] = useState('');
  const [updateConfidence, setUpdateConfidence] = useState('70');
  const [updateEvidenceUrls, setUpdateEvidenceUrls] = useState('');
  const [websiteField, setWebsiteField] = useState('');
  const [contributorRole, setContributorRole] = useState('');
  const [communityConnection, setCommunityConnection] = useState('');
  const [communityLocation, setCommunityLocation] = useState('');
  const [allowFollowUpContact, setAllowFollowUpContact] = useState(false);
  const [followUpContactPreference, setFollowUpContactPreference] = useState('');
  const [selectedValidationUpdateId, setSelectedValidationUpdateId] = useState('');
  const [validatorKind, setValidatorKind] = useState<
    'community_member' | 'community_board' | 'elder' | 'participant'
  >('community_member');
  const [validatorName, setValidatorName] = useState('');
  const [validationStatus, setValidationStatus] = useState<
    'confirmed' | 'contested' | 'mixed' | 'needs_follow_up'
  >('confirmed');
  const [validationNotes, setValidationNotes] = useState('');
  const [trustRatingInput, setTrustRatingInput] = useState('4');
  const [impactRatingInput, setImpactRatingInput] = useState('4');

  const fetchData = async (background = false) => {
    if (!commitmentId) return;

    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(
        `/api/funding/accountability/commitments/${encodeURIComponent(commitmentId)}`
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load commitment evidence trail');
      }

      setAward(payload.award || null);
      setCommitment(payload.commitment || null);
      setTransactions(payload.transactions || []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to load commitment evidence trail'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [commitmentId]);

  useEffect(() => {
    if (commitment?.updates?.length) {
      setSelectedValidationUpdateId((current) =>
        current && commitment.updates.some((update) => update.id === current)
          ? current
          : commitment.updates[0].id
      );
    } else {
      setSelectedValidationUpdateId('');
    }
  }, [commitment]);

  useEffect(() => {
    if (!commitment || !contributionMode) return;

    const contributionPanel = document.getElementById('contribute-panel');
    if (!contributionPanel) return;

    const timeout = window.setTimeout(() => {
      contributionPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [commitment, contributionMode]);

  const metrics = useMemo(() => {
    if (!commitment) {
      return {
        updateCount: 0,
        validationCount: 0,
        trackedSpend: 0,
      };
    }

    let validationCount = 0;
    for (const update of commitment.updates) {
      validationCount += update.validations.length;
    }

    return {
      updateCount: commitment.updates.length,
      validationCount,
      trackedSpend: transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0),
    };
  }, [commitment, transactions]);

  const submitCommunityUpdate = async () => {
    if (!commitmentId) return;

    try {
      setSubmittingMode('update');
      setSubmissionNotice(null);
      const response = await fetch(
        `/api/funding/accountability/commitments/${encodeURIComponent(commitmentId)}/contribute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'update',
            updateType,
            reportedValue:
              reportedValueInput.trim() === '' ? null : Number(reportedValueInput.trim()),
            narrative: updateNarrative.trim() || null,
            confidenceScore: Number(updateConfidence || 0),
            website: websiteField,
            contributorRole: contributorRole.trim() || null,
            communityConnection: communityConnection.trim() || null,
            communityLocation: communityLocation.trim() || null,
            allowFollowUpContact,
            followUpContactPreference: allowFollowUpContact
              ? followUpContactPreference.trim() || null
              : null,
            evidenceUrls: updateEvidenceUrls
              .split('\n')
              .map((value) => value.trim())
              .filter(Boolean),
          }),
        }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to submit community update');
      }

      setSubmissionNotice({
        type: 'success',
        message:
          'Thanks. Your update was received as community-submitted evidence and should be read alongside other updates and validations.',
      });
      setReportedValueInput('');
      setUpdateNarrative('');
      setUpdateEvidenceUrls('');
      await fetchData(true);
    } catch (submitError) {
      setSubmissionNotice({
        type: 'error',
        message:
          submitError instanceof Error
            ? submitError.message
            : 'Failed to submit community update',
      });
    } finally {
      setSubmittingMode(null);
    }
  };

  const submitCommunityValidation = async () => {
    if (!commitmentId || !selectedValidationUpdateId) return;

    try {
      setSubmittingMode('validation');
      setSubmissionNotice(null);
      const response = await fetch(
        `/api/funding/accountability/commitments/${encodeURIComponent(commitmentId)}/contribute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'validation',
            updateId: selectedValidationUpdateId,
            validatorKind,
            validatorName: validatorName.trim() || null,
            validationStatus,
            validationNotes: validationNotes.trim() || null,
            trustRating: Number(trustRatingInput || 0),
            impactRating: Number(impactRatingInput || 0),
            website: websiteField,
            contributorRole: contributorRole.trim() || null,
            communityConnection: communityConnection.trim() || null,
            communityLocation: communityLocation.trim() || null,
            allowFollowUpContact,
            followUpContactPreference: allowFollowUpContact
              ? followUpContactPreference.trim() || null
              : null,
          }),
        }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to submit community validation');
      }

      setSubmissionNotice({
        type: 'success',
        message:
          'Thanks. Your validation was received as community-submitted evidence and should be reviewed alongside the reported update.',
      });
      setValidatorName('');
      setValidationNotes('');
      await fetchData(true);
    } catch (submitError) {
      setSubmissionNotice({
        type: 'error',
        message:
          submitError instanceof Error
            ? submitError.message
            : 'Failed to submit community validation',
      });
    } finally {
      setSubmittingMode(null);
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
                href={award ? `/funding/accountability/awards/${award.id}` : '/funding/accountability'}
                className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-emerald-500 text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Commitment Evidence</h1>
                  <p className="text-base text-gray-600">
                    A shareable, commitment-level view of what was promised, reported, and validated.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || !commitmentId}
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

          {loading && !commitment ? (
            <div className="text-sm text-gray-500">Loading commitment evidence…</div>
          ) : !commitment ? (
            <div className="text-sm text-gray-500">No commitment found for this evidence trail.</div>
          ) : (
            <>
              <section className="bg-white border-2 border-black p-6 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="text-sm font-black text-black">
                      {award?.organization?.name || 'Unknown organization'}
                    </div>
                    <div className="text-2xl font-black text-black mt-1">
                      {commitment.outcomeDefinition?.name || 'Unnamed outcome'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {commitment.outcomeDefinition?.outcome_domain || '—'}
                      {commitment.outcomeDefinition?.unit ? ` · ${commitment.outcomeDefinition.unit}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-3 py-1 text-xs font-black border border-black bg-[#eef4ff] text-[#1d4ed8]">
                      {commitment.commitment_status}
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      Target date {formatDate(commitment.target_date)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
                  <div className="bg-[#fafaf8] border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">Baseline</div>
                    <div className="text-2xl font-black text-black">{formatNumber(commitment.baseline_value)}</div>
                  </div>
                  <div className="bg-[#fafaf8] border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">Current</div>
                    <div className="text-2xl font-black text-black">{formatNumber(commitment.current_value)}</div>
                  </div>
                  <div className="bg-[#fafaf8] border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">Target</div>
                    <div className="text-2xl font-black text-black">{formatNumber(commitment.target_value)}</div>
                  </div>
                  <div className="bg-[#fafaf8] border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">Evidence Score</div>
                    <div className="text-2xl font-black text-black">{Math.round(commitment.evidence_confidence_score || 0)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-[#fafaf8] border border-gray-200 p-4 text-sm">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">Update Count</div>
                    <div className="font-black text-black">{metrics.updateCount}</div>
                  </div>
                  <div className="bg-[#fafaf8] border border-gray-200 p-4 text-sm">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">Validation Count</div>
                    <div className="font-black text-black">{metrics.validationCount}</div>
                  </div>
                  <div className="bg-[#fafaf8] border border-gray-200 p-4 text-sm">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">Tracked Spend</div>
                    <div className="font-black text-black">{formatCurrency(metrics.trackedSpend)}</div>
                  </div>
                </div>

                {commitment.measurement_notes && (
                  <div className="mt-6 text-sm text-gray-700">{commitment.measurement_notes}</div>
                )}

                {award && (
                  <div className="mt-6 text-xs text-gray-600">
                    Linked award: <Link href={`/funding/accountability/awards/${award.id}`} className="font-black text-[#1d4ed8] underline">{award.fundingProgram?.name || award.id}</Link>
                    {' · '}
                    {award.fundingSource?.name || 'Unknown funding source'}
                  </div>
                )}
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
                <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="px-6 py-5 border-b-2 border-black">
                    <h2 className="text-2xl font-black text-black">Reporting Timeline</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {commitment.updates.length === 0 ? (
                      <div className="text-sm text-gray-500">No updates recorded yet.</div>
                    ) : (
                      commitment.updates.map((update) => (
                        <div key={update.id} className="border-2 border-black bg-[#fafaf8] p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-xs font-black uppercase tracking-[0.14em] text-gray-700">
                                  {update.update_type}
                                </div>
                                {!update.reported_by_user_id && (
                                  <div className="inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] border border-black bg-amber-100 text-amber-900">
                                    community submitted
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Reported {formatDateTime(update.reported_at)} · Confidence {Math.round(update.confidence_score || 0)}
                              </div>
                            </div>
                            <div className="text-sm font-black text-black">
                              {formatNumber(update.reported_value)}
                            </div>
                          </div>

                          {update.narrative && (
                            <div className="text-sm text-gray-700 mt-3">{update.narrative}</div>
                          )}

                          {Array.isArray(update.evidence_urls) && update.evidence_urls.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {update.evidence_urls.map((url) => (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block text-xs font-bold text-[#1d4ed8] underline break-all"
                                >
                                  {url}
                                </a>
                              ))}
                            </div>
                          )}

                          <div className="mt-4 space-y-2">
                            {update.validations.length === 0 ? (
                              <div className="text-xs text-gray-500">No community validations yet.</div>
                            ) : (
                              update.validations.map((validation) => (
                                <div key={validation.id} className="border border-gray-200 bg-white p-3">
                                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-xs font-black text-black">
                                          {validation.validator_name || validation.validator_kind}
                                        </div>
                                        {!validation.validator_user_id && (
                                          <div className="inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] border border-black bg-amber-100 text-amber-900">
                                            community submitted
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-gray-600 mt-1">
                                        {validation.validation_status} · {formatDateTime(validation.validated_at)}
                                      </div>
                                    </div>
                                    <div className="text-[11px] font-black text-gray-700">
                                      Trust {validation.trust_rating ?? '—'} / 5 · Impact {validation.impact_rating ?? '—'} / 5
                                    </div>
                                  </div>
                                  {validation.validation_notes && (
                                    <div className="text-xs text-gray-700 mt-2">
                                      {validation.validation_notes}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="space-y-6">
                  <div
                    id="contribute-panel"
                    className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="px-6 py-5 border-b-2 border-black">
                      <h2 className="text-2xl font-black text-black">Contribute</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Share a progress update or validate what has been reported.
                      </p>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                        Community submissions are recorded as contributed evidence. They add public
                        context and should be read alongside other updates and validations, not treated
                        as automatic endorsement on their own.
                      </div>

                      <div className="border border-gray-200 bg-[#f8fafc] p-4">
                        <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                          About Your Connection
                        </div>
                        <div className="text-sm text-gray-700 mb-4">
                          Add a little context so people reading this evidence can understand how close
                          you are to the outcome, place, or community impact you are describing.
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <label className="text-xs font-bold text-gray-700">
                            Your role in this context
                            <input
                              value={contributorRole}
                              onChange={(event) => setContributorRole(event.target.value)}
                              className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm"
                              placeholder="Optional: community member, worker, organiser, carer…"
                            />
                          </label>
                          <label className="text-xs font-bold text-gray-700">
                            Your connection to this outcome
                            <textarea
                              value={communityConnection}
                              onChange={(event) => setCommunityConnection(event.target.value)}
                              rows={3}
                              className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm"
                              placeholder="Optional: how you know this work, who it affected, what you directly saw, or why your perspective matters."
                            />
                          </label>
                          <label className="text-xs font-bold text-gray-700">
                            Place or community context
                            <input
                              value={communityLocation}
                              onChange={(event) => setCommunityLocation(event.target.value)}
                              className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm"
                              placeholder="Optional: town, region, community, or Country context"
                            />
                          </label>
                          <label className="flex items-start gap-3 text-xs font-bold text-gray-700">
                            <input
                              type="checkbox"
                              checked={allowFollowUpContact}
                              onChange={(event) =>
                                setAllowFollowUpContact(event.target.checked)
                              }
                              className="mt-0.5 h-4 w-4 rounded-none border-2 border-black"
                            />
                            <span>
                              The team may contact me for follow-up about this contribution
                            </span>
                          </label>
                          <label className="text-xs font-bold text-gray-700">
                            Follow-up preference
                            <input
                              value={followUpContactPreference}
                              onChange={(event) =>
                                setFollowUpContactPreference(event.target.value)
                              }
                              disabled={!allowFollowUpContact}
                              className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                              placeholder="Optional: best way or time to follow up"
                            />
                          </label>
                        </div>
                      </div>

                      {submissionNotice && (
                        <div
                          className={`border-2 p-4 text-sm font-medium ${
                            submissionNotice.type === 'success'
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                              : 'border-red-500 bg-red-50 text-red-800'
                          }`}
                        >
                          {submissionNotice.message}
                        </div>
                      )}

                      <div
                        className={`space-y-3 ${
                          contributionMode === 'update'
                            ? 'rounded-sm border-2 border-emerald-500 p-3'
                            : ''
                        }`}
                      >
                        <label
                          className="block"
                          aria-hidden="true"
                          style={{ position: 'absolute', left: '-9999px', top: 'auto' }}
                        >
                          Website
                          <input
                            type="text"
                            tabIndex={-1}
                            autoComplete="off"
                            value={websiteField}
                            onChange={(event) => setWebsiteField(event.target.value)}
                          />
                        </label>
                        <div className="text-sm font-black text-black">Share a community update</div>
                        <div className="grid grid-cols-1 gap-3">
                          <label className="text-xs font-bold text-gray-700">
                            Update type
                            <select
                              value={updateType}
                              onChange={(event) =>
                                setUpdateType(event.target.value as 'progress' | 'milestone' | 'final')
                              }
                              className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm"
                            >
                              <option value="progress">Progress</option>
                              <option value="milestone">Milestone</option>
                              <option value="final">Final</option>
                            </select>
                          </label>
                          <label className="text-xs font-bold text-gray-700">
                            Reported value
                            <input
                              value={reportedValueInput}
                              onChange={(event) => setReportedValueInput(event.target.value)}
                              inputMode="decimal"
                              className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm"
                              placeholder="Optional numeric value"
                            />
                          </label>
                          <label className="text-xs font-bold text-gray-700">
                            Confidence (0-100)
                            <input
                              value={updateConfidence}
                              onChange={(event) => setUpdateConfidence(event.target.value)}
                              inputMode="numeric"
                              className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm"
                            />
                          </label>
                          <label className="text-xs font-bold text-gray-700">
                            What changed
                            <textarea
                              value={updateNarrative}
                              onChange={(event) => setUpdateNarrative(event.target.value)}
                              rows={4}
                              className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm"
                              placeholder="Describe what changed in community terms."
                            />
                          </label>
                          <label className="text-xs font-bold text-gray-700">
                            Evidence links (one per line)
                            <textarea
                              value={updateEvidenceUrls}
                              onChange={(event) => setUpdateEvidenceUrls(event.target.value)}
                              rows={3}
                              className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm"
                              placeholder="https://..."
                            />
                          </label>
                          <button
                            type="button"
                            onClick={submitCommunityUpdate}
                            disabled={submittingMode === 'update'}
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white border-2 border-black font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            {submittingMode === 'update' ? 'Submitting…' : 'Submit Update'}
                          </button>
                        </div>
                      </div>

                      <div
                        className={`border-t-2 border-black pt-6 space-y-3 ${
                          contributionMode === 'validation'
                            ? 'rounded-sm border-2 border-emerald-500 p-3'
                            : ''
                        }`}
                      >
                        <div className="text-sm font-black text-black">Validate a reported update</div>
                        {commitment.updates.length === 0 ? (
                          <div className="text-sm text-gray-500">
                            A validation can be submitted after the first update is reported.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            <label className="text-xs font-bold text-gray-700">
                              Update to validate
                              <select
                                value={selectedValidationUpdateId}
                                onChange={(event) => setSelectedValidationUpdateId(event.target.value)}
                                className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm"
                              >
                                {commitment.updates.map((update) => (
                                  <option key={update.id} value={update.id}>
                                    {update.update_type} · {formatDateTime(update.reported_at)}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="text-xs font-bold text-gray-700">
                              Validator role
                              <select
                                value={validatorKind}
                                onChange={(event) =>
                                  setValidatorKind(
                                    event.target.value as
                                      | 'community_member'
                                      | 'community_board'
                                      | 'elder'
                                      | 'participant'
                                  )
                                }
                                className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm"
                              >
                                <option value="community_member">Community member</option>
                                <option value="community_board">Community board</option>
                                <option value="elder">Elder</option>
                                <option value="participant">Participant</option>
                              </select>
                            </label>
                            <label className="text-xs font-bold text-gray-700">
                              Your name
                              <input
                                value={validatorName}
                                onChange={(event) => setValidatorName(event.target.value)}
                                className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm"
                                placeholder="Optional"
                              />
                            </label>
                            <label className="text-xs font-bold text-gray-700">
                              Validation result
                              <select
                                value={validationStatus}
                                onChange={(event) =>
                                  setValidationStatus(
                                    event.target.value as
                                      | 'confirmed'
                                      | 'contested'
                                      | 'mixed'
                                      | 'needs_follow_up'
                                  )
                                }
                                className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm"
                              >
                                <option value="confirmed">Confirmed</option>
                                <option value="contested">Contested</option>
                                <option value="mixed">Mixed</option>
                                <option value="needs_follow_up">Needs follow-up</option>
                              </select>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <label className="text-xs font-bold text-gray-700">
                                Trust (1-5)
                                <input
                                  value={trustRatingInput}
                                  onChange={(event) => setTrustRatingInput(event.target.value)}
                                  inputMode="numeric"
                                  className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm"
                                />
                              </label>
                              <label className="text-xs font-bold text-gray-700">
                                Impact (1-5)
                                <input
                                  value={impactRatingInput}
                                  onChange={(event) => setImpactRatingInput(event.target.value)}
                                  inputMode="numeric"
                                  className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm"
                                />
                              </label>
                            </div>
                            <label className="text-xs font-bold text-gray-700">
                              Notes
                              <textarea
                                value={validationNotes}
                                onChange={(event) => setValidationNotes(event.target.value)}
                                rows={4}
                                className="mt-1 w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm"
                                placeholder="Share what you saw, what feels true, or what needs follow-up."
                              />
                            </label>
                            <button
                              type="button"
                              onClick={submitCommunityValidation}
                              disabled={submittingMode === 'validation' || !selectedValidationUpdateId}
                              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#0f766e] text-white border-2 border-black font-bold hover:opacity-90 transition-colors disabled:opacity-50"
                            >
                              {submittingMode === 'validation' ? 'Submitting…' : 'Submit Validation'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="px-6 py-5 border-b-2 border-black">
                      <h2 className="text-2xl font-black text-black">Linked Spending</h2>
                    </div>
                    <div className="p-6 space-y-3">
                      {transactions.length === 0 ? (
                        <div className="text-sm text-gray-500">No tracked public transactions yet.</div>
                      ) : (
                        transactions.map((transaction) => (
                          <div key={transaction.id} className="border border-gray-200 bg-[#fafaf8] p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xs font-black uppercase tracking-[0.14em] text-gray-700">
                                  {transaction.transaction_type}
                                </div>
                                <div className="text-[11px] text-gray-600 mt-1">
                                  {transaction.transaction_status} · {formatDateTime(transaction.transaction_date)}
                                </div>
                              </div>
                              <div className="text-sm font-black text-black">
                                {formatCurrency(transaction.amount)}
                              </div>
                            </div>
                            {transaction.description && (
                              <div className="text-xs text-gray-700 mt-2">{transaction.description}</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-[#1d4ed8]" />
                      <div className="text-lg font-black text-black">Why This Matters</div>
                    </div>
                    <p className="text-sm text-gray-700">
                      This page makes one commitment shareable on its own. That means a community can point to a single promise, inspect the reporting history, and judge the evidence without wading through the rest of the award.
                    </p>
                    <div className="grid grid-cols-1 gap-3 mt-4 text-xs">
                      <div className="flex items-center gap-2">
                        <HandCoins className="w-4 h-4 text-emerald-700" />
                        Spending remains visible alongside the commitment, not in a separate admin silo.
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        Community validation stays attached to each reported update.
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
