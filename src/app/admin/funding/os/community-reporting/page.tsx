'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import { ArrowLeft, Plus, RefreshCw, Save, Send, ShieldCheck } from 'lucide-react';

interface CommitmentRow {
  id: string;
  commitment_status: string;
  baseline_value?: number | null;
  target_value?: number | null;
  current_value?: number | null;
  target_date?: string | null;
  measurement_notes?: string | null;
  evidence_confidence_score: number;
  community_priority_weight: number;
  organization?: {
    id: string;
    name: string;
    city?: string | null;
    state?: string | null;
  } | null;
  award?: {
    id: string;
    award_status: string;
    amount_awarded?: number | null;
    community_report_due_at?: string | null;
  } | null;
  outcomeDefinition?: {
    id: string;
    name: string;
    outcome_domain: string;
    unit?: string | null;
    description?: string | null;
  } | null;
  latestUpdate?: {
    id: string;
    update_type: string;
    reported_value?: number | null;
    reported_at?: string | null;
    confidence_score: number;
    narrative?: string | null;
  } | null;
  latestUpdateValidationCount: number;
}

interface CommitmentReferenceAward {
  id: string;
  award_status: string;
  amount_awarded?: number | null;
  community_report_due_at?: string | null;
  organization?: {
    id: string;
    name: string;
    city?: string | null;
    state?: string | null;
  } | null;
  fundingProgram?: {
    id: string;
    name: string;
  } | null;
}

interface CommitmentReferenceOutcomeDefinition {
  id: string;
  name: string;
  outcome_domain: string;
  unit?: string | null;
  description?: string | null;
}

interface Notice {
  type: 'success' | 'error';
  message: string;
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

function formatNumber(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-AU', {
    maximumFractionDigits: 2,
  });
}

function FundingCommunityReportingAdminPageContent() {
  const searchParams = useSearchParams();
  const [commitments, setCommitments] = useState<CommitmentRow[]>([]);
  const [referenceAwards, setReferenceAwards] = useState<CommitmentReferenceAward[]>([]);
  const [referenceOutcomeDefinitions, setReferenceOutcomeDefinitions] = useState<
    CommitmentReferenceOutcomeDefinition[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingReference, setLoadingReference] = useState(true);
  const [savingCommitment, setSavingCommitment] = useState(false);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [submittingValidation, setSubmittingValidation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<string>('');
  const [editingCommitmentId, setEditingCommitmentId] = useState<string>('');
  const [latestCreatedUpdateId, setLatestCreatedUpdateId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  const [commitmentForm, setCommitmentForm] = useState({
    fundingAwardId: '',
    outcomeDefinitionId: '',
    commitmentStatus: 'draft',
    baselineValue: '',
    targetValue: '',
    currentValue: '',
    targetDate: '',
    evidenceConfidenceScore: '0',
    communityPriorityWeight: '50',
    measurementNotes: '',
  });

  const [updateForm, setUpdateForm] = useState({
    updateType: 'progress',
    reportedValue: '',
    confidenceScore: '70',
    narrative: '',
    evidenceUrls: '',
  });
  const [validationForm, setValidationForm] = useState({
    updateId: '',
    validatorKind: 'community_member',
    validationStatus: 'confirmed',
    validatorName: '',
    trustRating: '4',
    impactRating: '4',
    validationNotes: '',
  });

  const requestedCommitmentId = (searchParams.get('commitmentId') || '').trim();
  const requestedFundingAwardId = (searchParams.get('fundingAwardId') || '').trim();
  const requestedOrganizationId = (searchParams.get('organizationId') || '').trim();
  const requestedStatus = (searchParams.get('status') || '').trim().toLowerCase();

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
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (requestedOrganizationId) {
        params.set('organizationId', requestedOrganizationId);
      }

      const response = await fetch(`/api/admin/funding/os/outcome-commitments?${params.toString()}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to load outcome commitments');
      }

      const payload = await response.json();
      const nextCommitments = payload.data || [];
      setCommitments(nextCommitments);

      const requestedCommitment =
        nextCommitments.find(
          (commitment: CommitmentRow) => commitment.id === requestedCommitmentId
        ) || null;
      const requestedAwardCommitment =
        nextCommitments.find(
          (commitment: CommitmentRow) => commitment.award?.id === requestedFundingAwardId
        ) || null;

      if (requestedCommitment?.id) {
        setSelectedCommitmentId(requestedCommitment.id);
      } else if (requestedAwardCommitment?.id) {
        setSelectedCommitmentId(requestedAwardCommitment.id);
      } else if (!selectedCommitmentId && nextCommitments[0]?.id) {
        setSelectedCommitmentId(nextCommitments[0].id);
      } else if (
        selectedCommitmentId &&
        !nextCommitments.some((commitment: CommitmentRow) => commitment.id === selectedCommitmentId)
      ) {
        setSelectedCommitmentId(nextCommitments[0]?.id || '');
      }

      if (requestedFundingAwardId && !requestedAwardCommitment && !requestedCommitment) {
        setSelectedCommitmentId('');
        setEditingCommitmentId('');
        setCommitmentForm({
          fundingAwardId: requestedFundingAwardId,
          outcomeDefinitionId: referenceOutcomeDefinitions[0]?.id || '',
          commitmentStatus: 'draft',
          baselineValue: '',
          targetValue: '',
          currentValue: '',
          targetDate: '',
          evidenceConfidenceScore: '0',
          communityPriorityWeight: '50',
          measurementNotes: '',
        });
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load outcome commitments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchReferenceData = async () => {
    setLoadingReference(true);

    try {
      const response = await fetch('/api/admin/funding/os/outcome-commitments/reference?limit=120');
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to load commitment reference data');
      }

      const payload = await response.json();
      setReferenceAwards(payload.awards || []);
      setReferenceOutcomeDefinitions(payload.outcomeDefinitions || []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to load commitment reference data'
      );
    } finally {
      setLoadingReference(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, requestedOrganizationId, requestedCommitmentId, requestedFundingAwardId, referenceOutcomeDefinitions]);

  useEffect(() => {
    const allowedStatuses = new Set(['all', 'draft', 'active', 'completed', 'paused', 'cancelled']);
    if (requestedStatus && allowedStatuses.has(requestedStatus) && requestedStatus !== statusFilter) {
      setStatusFilter(requestedStatus);
    }
  }, [requestedStatus, statusFilter]);

  useEffect(() => {
    fetchReferenceData();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const selectedCommitment = useMemo(
    () => commitments.find((commitment) => commitment.id === selectedCommitmentId) || null,
    [commitments, selectedCommitmentId]
  );

  const selectedReferenceAward = useMemo(
    () =>
      referenceAwards.find((award) => award.id === commitmentForm.fundingAwardId) || null,
    [referenceAwards, commitmentForm.fundingAwardId]
  );

  useEffect(() => {
    if (latestCreatedUpdateId) {
      setValidationForm((current) => ({
        ...current,
        updateId: latestCreatedUpdateId,
      }));
      return;
    }

    if (selectedCommitment?.latestUpdate?.id) {
      setValidationForm((current) => ({
        ...current,
        updateId: current.updateId || selectedCommitment.latestUpdate?.id || '',
      }));
    }
  }, [latestCreatedUpdateId, selectedCommitment?.latestUpdate?.id]);

  useEffect(() => {
    if (!selectedCommitment) {
      return;
    }

    setEditingCommitmentId(selectedCommitment.id);
    setCommitmentForm({
      fundingAwardId: selectedCommitment.award?.id || '',
      outcomeDefinitionId: selectedCommitment.outcomeDefinition?.id || '',
      commitmentStatus: selectedCommitment.commitment_status || 'draft',
      baselineValue:
        selectedCommitment.baseline_value == null
          ? ''
          : String(selectedCommitment.baseline_value),
      targetValue:
        selectedCommitment.target_value == null ? '' : String(selectedCommitment.target_value),
      currentValue:
        selectedCommitment.current_value == null
          ? ''
          : String(selectedCommitment.current_value),
      targetDate: selectedCommitment.target_date || '',
      evidenceConfidenceScore: String(selectedCommitment.evidence_confidence_score ?? 0),
      communityPriorityWeight: String(selectedCommitment.community_priority_weight ?? 50),
      measurementNotes: selectedCommitment.measurement_notes || '',
    });
  }, [selectedCommitment]);

  useEffect(() => {
    if (selectedCommitment || editingCommitmentId) {
      return;
    }

    if (referenceAwards.length === 0 || referenceOutcomeDefinitions.length === 0) {
      return;
    }

    setCommitmentForm((current) => ({
      ...current,
      fundingAwardId: current.fundingAwardId || referenceAwards[0].id,
      outcomeDefinitionId: current.outcomeDefinitionId || referenceOutcomeDefinitions[0].id,
    }));
  }, [selectedCommitment, editingCommitmentId, referenceAwards, referenceOutcomeDefinitions]);

  const startNewCommitment = (fundingAwardId?: string) => {
    setEditingCommitmentId('');
    setCommitmentForm({
      fundingAwardId: fundingAwardId || referenceAwards[0]?.id || '',
      outcomeDefinitionId: referenceOutcomeDefinitions[0]?.id || '',
      commitmentStatus: 'draft',
      baselineValue: '',
      targetValue: '',
      currentValue: '',
      targetDate: '',
      evidenceConfidenceScore: '0',
      communityPriorityWeight: '50',
      measurementNotes: '',
    });
  };

  const submitCommitment = async () => {
    if (!commitmentForm.fundingAwardId || !commitmentForm.outcomeDefinitionId) {
      setError('Funding award and outcome definition are required');
      return;
    }

    setSavingCommitment(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/funding/os/outcome-commitments', {
        method: editingCommitmentId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitmentId: editingCommitmentId || undefined,
          fundingAwardId: commitmentForm.fundingAwardId,
          outcomeDefinitionId: commitmentForm.outcomeDefinitionId,
          commitmentStatus: commitmentForm.commitmentStatus,
          baselineValue:
            commitmentForm.baselineValue.trim() === ''
              ? null
              : Number(commitmentForm.baselineValue),
          targetValue:
            commitmentForm.targetValue.trim() === ''
              ? null
              : Number(commitmentForm.targetValue),
          currentValue:
            commitmentForm.currentValue.trim() === ''
              ? null
              : Number(commitmentForm.currentValue),
          targetDate: commitmentForm.targetDate || null,
          evidenceConfidenceScore: Number(commitmentForm.evidenceConfidenceScore || 0),
          communityPriorityWeight: Number(commitmentForm.communityPriorityWeight || 50),
          measurementNotes: commitmentForm.measurementNotes.trim() || null,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save outcome commitment');
      }

      const nextCommitmentId = payload.commitmentId || editingCommitmentId;
      setEditingCommitmentId(nextCommitmentId || '');
      if (nextCommitmentId) {
        setSelectedCommitmentId(nextCommitmentId);
      }
      setNotice({
        type: 'success',
        message: editingCommitmentId
          ? 'Outcome commitment updated.'
          : 'Outcome commitment created.',
      });
      await fetchData(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save outcome commitment');
      setNotice({
        type: 'error',
        message:
          submitError instanceof Error ? submitError.message : 'Failed to save outcome commitment',
      });
    } finally {
      setSavingCommitment(false);
    }
  };

  const submitOutcomeUpdate = async () => {
    if (!selectedCommitmentId) {
      setError('Select a commitment first');
      return;
    }

    setSubmittingUpdate(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/funding/os/outcome-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitmentId: selectedCommitmentId,
          updateType: updateForm.updateType,
          reportedValue:
            updateForm.reportedValue.trim() === ''
              ? null
              : Number(updateForm.reportedValue),
          confidenceScore: Number(updateForm.confidenceScore || 0),
          narrative: updateForm.narrative.trim() || null,
          evidenceUrls: updateForm.evidenceUrls
            .split('\n')
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create outcome update');
      }

      setLatestCreatedUpdateId(payload.updateId || '');
      setNotice({
        type: 'success',
        message: 'Outcome update recorded and ready for community validation.',
      });
      setUpdateForm((current) => ({
        ...current,
        reportedValue: '',
        narrative: '',
        evidenceUrls: '',
      }));
      await fetchData(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create outcome update');
      setNotice({
        type: 'error',
        message: submitError instanceof Error ? submitError.message : 'Failed to create outcome update',
      });
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const submitValidation = async () => {
    if (!validationForm.updateId.trim()) {
      setError('A valid update ID is required for validation');
      return;
    }

    setSubmittingValidation(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/funding/os/community-validations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateId: validationForm.updateId.trim(),
          validatorKind: validationForm.validatorKind,
          validationStatus: validationForm.validationStatus,
          validatorName: validationForm.validatorName.trim() || null,
          trustRating:
            validationForm.trustRating.trim() === ''
              ? null
              : Number(validationForm.trustRating),
          impactRating:
            validationForm.impactRating.trim() === ''
              ? null
              : Number(validationForm.impactRating),
          validationNotes: validationForm.validationNotes.trim() || null,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to record community validation');
      }

      setNotice({
        type: 'success',
        message: 'Community validation recorded.',
      });
      setValidationForm((current) => ({
        ...current,
        validationNotes: '',
      }));
      await fetchData(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to record community validation');
      setNotice({
        type: 'error',
        message: submitError instanceof Error ? submitError.message : 'Failed to record community validation',
      });
    } finally {
      setSubmittingValidation(false);
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
                Back to Funding OS Review
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-emerald-500 text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Community Reporting</h1>
                  <p className="text-base text-gray-600">
                    Submit outcome updates and community validations against live commitments.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="px-4 py-3 border-2 border-black bg-white text-sm font-bold"
              >
                <option value="all">All commitments</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {notice && (
            <div
              className={`border-2 p-4 mb-6 font-medium ${
                notice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : 'bg-red-50 border-red-500 text-red-800'
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

          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
            <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-6 py-5 border-b-2 border-black">
                <h2 className="text-2xl font-black text-black">Outcome Commitments</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Choose a commitment, then report progress and record how community responds.
                </p>
              </div>

              <div className="p-6 space-y-4 max-h-[54rem] overflow-auto">
                {loading && commitments.length === 0 ? (
                  <div className="text-sm text-gray-500">Loading commitments…</div>
                ) : commitments.length === 0 ? (
                  <div className="text-sm text-gray-500">No commitments available for this filter.</div>
                ) : (
                  commitments.map((commitment) => (
                    <button
                      key={commitment.id}
                      onClick={() => {
                        setSelectedCommitmentId(commitment.id);
                        setLatestCreatedUpdateId('');
                        setValidationForm((current) => ({
                          ...current,
                          updateId: commitment.latestUpdate?.id || '',
                        }));
                      }}
                      className={`w-full text-left border-2 p-4 transition-colors ${
                        commitment.id === selectedCommitmentId
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-black bg-[#fafaf8] hover:bg-white'
                      }`}
                    >
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="text-sm font-black text-black">
                            {commitment.outcomeDefinition?.name || 'Unnamed outcome'}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {commitment.organization?.name || 'Unknown organization'}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1">
                            Domain: {commitment.outcomeDefinition?.outcome_domain || '—'}
                          </div>
                        </div>
                        <div className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-700">
                          {commitment.commitment_status}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                        <div className="bg-white border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Baseline</div>
                          <div className="font-black text-black">{formatNumber(commitment.baseline_value)}</div>
                        </div>
                        <div className="bg-white border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Current</div>
                          <div className="font-black text-black">{formatNumber(commitment.current_value)}</div>
                        </div>
                        <div className="bg-white border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Target</div>
                          <div className="font-black text-black">{formatNumber(commitment.target_value)}</div>
                        </div>
                        <div className="bg-white border border-gray-200 p-2">
                          <div className="font-bold text-gray-600">Due</div>
                          <div className="font-black text-black">{formatDate(commitment.target_date)}</div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-600 space-y-1">
                        <div>
                          Latest update: <span className="font-black text-black">{commitment.latestUpdate?.update_type || 'none'}</span>
                          {commitment.latestUpdate?.reported_at
                            ? ` on ${formatDate(commitment.latestUpdate.reported_at)}`
                            : ''}
                        </div>
                        <div>
                          Latest validation count: <span className="font-black text-black">{commitment.latestUpdateValidationCount}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <div className="space-y-6">
              <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="px-6 py-5 border-b-2 border-black flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-black">Commitment Setup</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Create a new outcome commitment or update the selected one.
                    </p>
                  </div>
                  <button
                    onClick={() => startNewCommitment()}
                    disabled={loadingReference}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-[#fff7e6] border-2 border-black font-bold hover:bg-[#ffefc2] transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    New Commitment
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Funding Award
                      </label>
                      <select
                        value={commitmentForm.fundingAwardId}
                        onChange={(event) =>
                          setCommitmentForm((current) => ({
                            ...current,
                            fundingAwardId: event.target.value,
                          }))
                        }
                        disabled={loadingReference}
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium disabled:opacity-50"
                      >
                        <option value="">Select funding award</option>
                        {referenceAwards.map((award) => (
                          <option key={award.id} value={award.id}>
                            {(award.organization?.name || 'Unknown org') +
                              ' - ' +
                              (award.fundingProgram?.name || 'Unknown program')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Outcome Definition
                      </label>
                      <select
                        value={commitmentForm.outcomeDefinitionId}
                        onChange={(event) =>
                          setCommitmentForm((current) => ({
                            ...current,
                            outcomeDefinitionId: event.target.value,
                          }))
                        }
                        disabled={loadingReference}
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium disabled:opacity-50"
                      >
                        <option value="">Select outcome</option>
                        {referenceOutcomeDefinitions.map((definition) => (
                          <option key={definition.id} value={definition.id}>
                            {definition.name} ({definition.outcome_domain})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Commitment Status
                      </label>
                      <select
                        value={commitmentForm.commitmentStatus}
                        onChange={(event) =>
                          setCommitmentForm((current) => ({
                            ...current,
                            commitmentStatus: event.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="paused">Paused</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Evidence Confidence
                      </label>
                      <input
                        value={commitmentForm.evidenceConfidenceScore}
                        onChange={(event) =>
                          setCommitmentForm((current) => ({
                            ...current,
                            evidenceConfidenceScore: event.target.value,
                          }))
                        }
                        type="number"
                        min={0}
                        max={100}
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Community Priority
                      </label>
                      <input
                        value={commitmentForm.communityPriorityWeight}
                        onChange={(event) =>
                          setCommitmentForm((current) => ({
                            ...current,
                            communityPriorityWeight: event.target.value,
                          }))
                        }
                        type="number"
                        min={0}
                        max={100}
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                      />
                    </div>
                  </div>

                  {selectedReferenceAward && (
                    <div className="text-xs text-gray-600 bg-[#fafaf8] border border-gray-200 p-3">
                      Reporting org: <span className="font-black text-black">{selectedReferenceAward.organization?.name || '—'}</span>
                      {' · '}
                      Award status: <span className="font-black text-black">{selectedReferenceAward.award_status}</span>
                      {' · '}
                      Report due: <span className="font-black text-black">{formatDate(selectedReferenceAward.community_report_due_at)}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Baseline
                      </label>
                      <input
                        value={commitmentForm.baselineValue}
                        onChange={(event) =>
                          setCommitmentForm((current) => ({
                            ...current,
                            baselineValue: event.target.value,
                          }))
                        }
                        type="number"
                        step="any"
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Target
                      </label>
                      <input
                        value={commitmentForm.targetValue}
                        onChange={(event) =>
                          setCommitmentForm((current) => ({
                            ...current,
                            targetValue: event.target.value,
                          }))
                        }
                        type="number"
                        step="any"
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Current
                      </label>
                      <input
                        value={commitmentForm.currentValue}
                        onChange={(event) =>
                          setCommitmentForm((current) => ({
                            ...current,
                            currentValue: event.target.value,
                          }))
                        }
                        type="number"
                        step="any"
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Target Date
                      </label>
                      <input
                        value={commitmentForm.targetDate}
                        onChange={(event) =>
                          setCommitmentForm((current) => ({
                            ...current,
                            targetDate: event.target.value,
                          }))
                        }
                        type="date"
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Measurement Notes
                    </label>
                    <textarea
                      value={commitmentForm.measurementNotes}
                      onChange={(event) =>
                        setCommitmentForm((current) => ({
                          ...current,
                          measurementNotes: event.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    />
                  </div>

                  <button
                    onClick={submitCommitment}
                    disabled={savingCommitment || loadingReference}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-[#eef4ff] text-[#1d4ed8] border-2 border-black font-bold hover:bg-[#dbeafe] transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {savingCommitment
                      ? 'Saving…'
                      : editingCommitmentId
                        ? 'Save Commitment Changes'
                        : 'Create Commitment'}
                  </button>
                </div>
              </section>

              <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="px-6 py-5 border-b-2 border-black">
                  <h2 className="text-2xl font-black text-black">Selected Commitment</h2>
                </div>
                <div className="p-6">
                  {!selectedCommitment ? (
                    <div className="text-sm text-gray-500">Select a commitment to continue.</div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-1">Outcome</div>
                        <div className="font-black text-black">{selectedCommitment.outcomeDefinition?.name || '—'}</div>
                        <div className="text-gray-600">{selectedCommitment.outcomeDefinition?.description || 'No description yet.'}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-[#fafaf8] border border-gray-200 p-3">
                          <div className="font-bold text-gray-600">Award Status</div>
                          <div className="font-black text-black">{selectedCommitment.award?.award_status || '—'}</div>
                        </div>
                        <div className="bg-[#fafaf8] border border-gray-200 p-3">
                          <div className="font-bold text-gray-600">Report Due</div>
                          <div className="font-black text-black">{formatDate(selectedCommitment.award?.community_report_due_at)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="px-6 py-5 border-b-2 border-black">
                  <h2 className="text-2xl font-black text-black">Submit Outcome Update</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Update Type
                      </label>
                      <select
                        value={updateForm.updateType}
                        onChange={(event) =>
                          setUpdateForm((current) => ({ ...current, updateType: event.target.value }))
                        }
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                      >
                        <option value="baseline">Baseline</option>
                        <option value="progress">Progress</option>
                        <option value="milestone">Milestone</option>
                        <option value="final">Final</option>
                        <option value="correction">Correction</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Confidence Score
                      </label>
                      <input
                        value={updateForm.confidenceScore}
                        onChange={(event) =>
                          setUpdateForm((current) => ({ ...current, confidenceScore: event.target.value }))
                        }
                        type="number"
                        min={0}
                        max={100}
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Reported Value
                    </label>
                    <input
                      value={updateForm.reportedValue}
                      onChange={(event) =>
                        setUpdateForm((current) => ({ ...current, reportedValue: event.target.value }))
                      }
                      type="number"
                      step="any"
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Narrative
                    </label>
                    <textarea
                      value={updateForm.narrative}
                      onChange={(event) =>
                        setUpdateForm((current) => ({ ...current, narrative: event.target.value }))
                      }
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Evidence URLs
                    </label>
                    <textarea
                      value={updateForm.evidenceUrls}
                      onChange={(event) =>
                        setUpdateForm((current) => ({ ...current, evidenceUrls: event.target.value }))
                      }
                      rows={3}
                      placeholder="One URL per line"
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    />
                  </div>

                  <button
                    onClick={submitOutcomeUpdate}
                    disabled={submittingUpdate || !selectedCommitment}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white border-2 border-black font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {submittingUpdate ? 'Submitting…' : 'Record Outcome Update'}
                  </button>
                </div>
              </section>

              <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="px-6 py-5 border-b-2 border-black">
                  <h2 className="text-2xl font-black text-black">Record Community Validation</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Update ID
                    </label>
                    <input
                      value={validationForm.updateId}
                      onChange={(event) =>
                        setValidationForm((current) => ({ ...current, updateId: event.target.value }))
                      }
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Validator Kind
                      </label>
                      <select
                        value={validationForm.validatorKind}
                        onChange={(event) =>
                          setValidationForm((current) => ({ ...current, validatorKind: event.target.value }))
                        }
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                      >
                        <option value="community_member">Community member</option>
                        <option value="community_board">Community board</option>
                        <option value="elder">Elder</option>
                        <option value="participant">Participant</option>
                        <option value="independent_evaluator">Independent evaluator</option>
                        <option value="funder">Funder</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Validation Status
                      </label>
                      <select
                        value={validationForm.validationStatus}
                        onChange={(event) =>
                          setValidationForm((current) => ({ ...current, validationStatus: event.target.value }))
                        }
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="contested">Contested</option>
                        <option value="mixed">Mixed</option>
                        <option value="needs_follow_up">Needs follow up</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Validator Name
                      </label>
                      <input
                        value={validationForm.validatorName}
                        onChange={(event) =>
                          setValidationForm((current) => ({ ...current, validatorName: event.target.value }))
                        }
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Trust Rating
                      </label>
                      <input
                        value={validationForm.trustRating}
                        onChange={(event) =>
                          setValidationForm((current) => ({ ...current, trustRating: event.target.value }))
                        }
                        type="number"
                        min={1}
                        max={5}
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                        Impact Rating
                      </label>
                      <input
                        value={validationForm.impactRating}
                        onChange={(event) =>
                          setValidationForm((current) => ({ ...current, impactRating: event.target.value }))
                        }
                        type="number"
                        min={1}
                        max={5}
                        className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Validation Notes
                    </label>
                    <textarea
                      value={validationForm.validationNotes}
                      onChange={(event) =>
                        setValidationForm((current) => ({ ...current, validationNotes: event.target.value }))
                      }
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    />
                  </div>

                  <button
                    onClick={submitValidation}
                    disabled={submittingValidation}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-black text-white border-2 border-black font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {submittingValidation ? 'Submitting…' : 'Record Community Validation'}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FundingCommunityReportingAdminPage() {
  return (
    <Suspense fallback={null}>
      <FundingCommunityReportingAdminPageContent />
    </Suspense>
  );
}
