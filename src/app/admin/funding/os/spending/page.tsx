'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import { ArrowLeft, FileText, HandCoins, Plus, RefreshCw, Save } from 'lucide-react';

type TransactionType =
  | 'appropriation'
  | 'allocation'
  | 'contract'
  | 'grant_payment'
  | 'milestone_payment'
  | 'clawback'
  | 'reconciliation';

type TransactionStatus =
  | 'planned'
  | 'committed'
  | 'disbursed'
  | 'reconciled'
  | 'cancelled';

interface SpendingRow {
  id: string;
  funding_program_id: string;
  opportunity_id?: string | null;
  organization_id?: string | null;
  transaction_type: TransactionType;
  transaction_status: TransactionStatus;
  amount: number;
  currency: string;
  transaction_date: string;
  jurisdiction?: string | null;
  source_reference?: string | null;
  description?: string | null;
  community_visible: boolean;
  fundingProgram?: {
    id: string;
    name: string;
    status?: string | null;
  } | null;
  organization?: {
    id: string;
    name: string;
    city?: string | null;
    state?: string | null;
  } | null;
  opportunity?: {
    id: string;
    name: string;
    funder_name?: string | null;
  } | null;
  relatedAward?: {
    id: string;
    award_status: string;
  } | null;
  primaryCommitmentId?: string | null;
  commitmentCount?: number;
}

interface SpendingReferenceData {
  fundingPrograms: Array<{ id: string; name: string; status?: string | null }>;
  organizations: Array<{ id: string; name: string; city?: string | null; state?: string | null }>;
  opportunities: Array<{ id: string; name: string; funder_name?: string | null }>;
}

interface Notice {
  type: 'success' | 'error';
  message: string;
}

const TRANSACTION_TYPES: TransactionType[] = [
  'appropriation',
  'allocation',
  'contract',
  'grant_payment',
  'milestone_payment',
  'clawback',
  'reconciliation',
];

const TRANSACTION_STATUSES: TransactionStatus[] = [
  'planned',
  'committed',
  'disbursed',
  'reconciled',
  'cancelled',
];

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

function formatCurrency(amount?: number | null) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '$0';
  return amount.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  });
}

export default function FundingSpendingAdminPage() {
  const [rows, setRows] = useState<SpendingRow[]>([]);
  const [reference, setReference] = useState<SpendingReferenceData>({
    fundingPrograms: [],
    organizations: [],
    opportunities: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [advancingStatus, setAdvancingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fundingProgramFilter, setFundingProgramFilter] = useState<string>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [sourceReferenceQuery, setSourceReferenceQuery] = useState<string>('');
  const [jurisdictionQuery, setJurisdictionQuery] = useState<string>('');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('');
  const [form, setForm] = useState({
    id: '',
    fundingProgramId: '',
    opportunityId: '',
    organizationId: '',
    transactionType: 'allocation' as TransactionType,
    transactionStatus: 'planned' as TransactionStatus,
    amount: '',
    currency: 'AUD',
    transactionDate: '',
    jurisdiction: '',
    sourceReference: '',
    description: '',
    communityVisible: true,
  });

  const fetchReference = async () => {
    const response = await fetch('/api/admin/funding/os/spending/reference?limit=150');
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load spending reference data');
    }
    setReference({
      fundingPrograms: payload.fundingPrograms || [],
      organizations: payload.organizations || [],
      opportunities: payload.opportunities || [],
    });
  };

  const fetchRows = async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', '120');
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (fundingProgramFilter !== 'all') {
        params.set('fundingProgramId', fundingProgramFilter);
      }
      if (organizationFilter !== 'all') {
        params.set('organizationId', organizationFilter);
      }
      if (sourceReferenceQuery.trim()) {
        params.set('sourceReferenceQuery', sourceReferenceQuery.trim());
      }
      if (jurisdictionQuery.trim()) {
        params.set('jurisdictionQuery', jurisdictionQuery.trim());
      }

      const response = await fetch(`/api/admin/funding/os/spending?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load spending transactions');
      }

      const nextRows = payload.data || [];
      setRows(nextRows);

      if (!selectedTransactionId && nextRows[0]?.id) {
        setSelectedTransactionId(nextRows[0].id);
      } else if (
        selectedTransactionId &&
        !nextRows.some((row: SpendingRow) => row.id === selectedTransactionId)
      ) {
        setSelectedTransactionId(nextRows[0]?.id || '');
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load spending transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchReference(), fetchRows()]).catch((fetchError) => {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load spending data');
      setLoading(false);
      setRefreshing(false);
    });
  }, [
    statusFilter,
    fundingProgramFilter,
    organizationFilter,
    sourceReferenceQuery,
    jurisdictionQuery,
  ]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedTransactionId) || null,
    [rows, selectedTransactionId]
  );

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.totalAmount += row.amount || 0;
        if (row.transaction_status === 'reconciled') {
          acc.reconciledCount += 1;
        }
        if (row.transaction_status === 'disbursed') {
          acc.disbursedCount += 1;
        }
        return acc;
      },
      {
        totalAmount: 0,
        reconciledCount: 0,
        disbursedCount: 0,
      }
    );
  }, [rows]);

  useEffect(() => {
    if (!selectedRow) {
      return;
    }

    setForm({
      id: selectedRow.id,
      fundingProgramId: selectedRow.funding_program_id,
      opportunityId: selectedRow.opportunity_id || '',
      organizationId: selectedRow.organization_id || '',
      transactionType: selectedRow.transaction_type,
      transactionStatus: selectedRow.transaction_status,
      amount: String(selectedRow.amount ?? ''),
      currency: selectedRow.currency || 'AUD',
      transactionDate: selectedRow.transaction_date ? selectedRow.transaction_date.slice(0, 16) : '',
      jurisdiction: selectedRow.jurisdiction || '',
      sourceReference: selectedRow.source_reference || '',
      description: selectedRow.description || '',
      communityVisible: selectedRow.community_visible,
    });
  }, [selectedRow]);

  const startNew = () => {
    setSelectedTransactionId('');
    setForm({
      id: '',
      fundingProgramId: reference.fundingPrograms[0]?.id || '',
      opportunityId: '',
      organizationId: '',
      transactionType: 'allocation',
      transactionStatus: 'planned',
      amount: '',
      currency: 'AUD',
      transactionDate: '',
      jurisdiction: '',
      sourceReference: '',
      description: '',
      communityVisible: true,
    });
  };

  const saveTransaction = async () => {
    if (!form.fundingProgramId) {
      setError('Funding program is required');
      return;
    }

    if (form.amount.trim() === '' || Number.isNaN(Number(form.amount))) {
      setError('A valid amount is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/funding/os/spending', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: form.id || undefined,
          fundingProgramId: form.fundingProgramId,
          opportunityId: form.opportunityId || null,
          organizationId: form.organizationId || null,
          transactionType: form.transactionType,
          transactionStatus: form.transactionStatus,
          amount: Number(form.amount),
          currency: form.currency || 'AUD',
          transactionDate: form.transactionDate ? new Date(form.transactionDate).toISOString() : null,
          jurisdiction: form.jurisdiction || null,
          sourceReference: form.sourceReference || null,
          description: form.description || null,
          communityVisible: form.communityVisible,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save spending transaction');
      }

      setNotice({
        type: 'success',
        message: form.id ? 'Spending transaction updated.' : 'Spending transaction created.',
      });
      setSelectedTransactionId(payload.transactionId || '');
      await fetchRows(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save spending transaction');
      setNotice({
        type: 'error',
        message: saveError instanceof Error ? saveError.message : 'Failed to save spending transaction',
      });
    } finally {
      setSaving(false);
    }
  };

  const nextStatus = useMemo(() => {
    const current = form.transactionStatus;
    if (!form.id) return null;
    if (current === 'planned') return 'committed' as TransactionStatus;
    if (current === 'committed') return 'disbursed' as TransactionStatus;
    if (current === 'disbursed') return 'reconciled' as TransactionStatus;
    return null;
  }, [form.id, form.transactionStatus]);

  const advanceStatus = async () => {
    if (!form.id || !nextStatus) {
      return;
    }

    setAdvancingStatus(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/funding/os/spending/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: form.id,
          status: nextStatus,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to advance spending status');
      }

      setForm((current) => ({ ...current, transactionStatus: nextStatus }));
      setNotice({
        type: 'success',
        message: `Transaction moved to ${nextStatus}.`,
      });
      await fetchRows(true);
    } catch (advanceError) {
      setError(
        advanceError instanceof Error
          ? advanceError.message
          : 'Failed to advance spending status'
      );
      setNotice({
        type: 'error',
        message:
          advanceError instanceof Error
            ? advanceError.message
            : 'Failed to advance spending status',
      });
    } finally {
      setAdvancingStatus(false);
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
                  <HandCoins className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Spending Ledger</h1>
                  <p className="text-base text-gray-600">
                    Create and reconcile public spending transactions that feed the accountability trail.
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
                <option value="all">All statuses</option>
                {TRANSACTION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                value={fundingProgramFilter}
                onChange={(event) => setFundingProgramFilter(event.target.value)}
                className="px-4 py-3 border-2 border-black bg-white text-sm font-bold"
              >
                <option value="all">All programs</option>
                {reference.fundingPrograms.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
              <select
                value={organizationFilter}
                onChange={(event) => setOrganizationFilter(event.target.value)}
                className="px-4 py-3 border-2 border-black bg-white text-sm font-bold"
              >
                <option value="all">All organizations</option>
                {reference.organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
              <input
                value={sourceReferenceQuery}
                onChange={(event) => setSourceReferenceQuery(event.target.value)}
                placeholder="Source reference"
                className="px-4 py-3 border-2 border-black bg-white text-sm font-bold min-w-[11rem]"
              />
              <input
                value={jurisdictionQuery}
                onChange={(event) => setJurisdictionQuery(event.target.value)}
                placeholder="Jurisdiction"
                className="px-4 py-3 border-2 border-black bg-white text-sm font-bold min-w-[10rem]"
              />
              <button
                onClick={() => fetchRows(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={startNew}
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#fff7e6] border-2 border-black font-bold hover:bg-[#ffefc2] transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Transaction
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                Visible Transactions
              </div>
              <div className="text-2xl font-black text-black">{rows.length}</div>
            </div>
            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                Visible Amount
              </div>
              <div className="text-2xl font-black text-black">{formatCurrency(summary.totalAmount)}</div>
            </div>
            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                Disbursed / Reconciled
              </div>
              <div className="text-2xl font-black text-black">
                {summary.disbursedCount} / {summary.reconciledCount}
              </div>
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

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
            <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-6 py-5 border-b-2 border-black">
                <h2 className="text-2xl font-black text-black">Transactions</h2>
              </div>
              <div className="p-6 space-y-4 max-h-[52rem] overflow-auto">
                {loading && rows.length === 0 ? (
                  <div className="text-sm text-gray-500">Loading spending transactions…</div>
                ) : rows.length === 0 ? (
                  <div className="text-sm text-gray-500">No spending transactions yet.</div>
                ) : (
                  rows.map((row) => (
                    <button
                      key={row.id}
                      onClick={() => setSelectedTransactionId(row.id)}
                      className={`w-full text-left border-2 p-4 transition-colors ${
                        row.id === selectedTransactionId
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-black bg-[#fafaf8] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-black text-black">
                            {row.fundingProgram?.name || 'Unknown program'}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {row.organization?.name || 'No specific organization'}
                          </div>
                        </div>
                        <div className="text-sm font-black text-black">
                          {formatCurrency(row.amount)}
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-2">
                        {row.transaction_type} · {row.transaction_status} · {formatDateTime(row.transaction_date)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-6 py-5 border-b-2 border-black">
                <h2 className="text-2xl font-black text-black">
                  {form.id ? 'Edit Transaction' : 'Create Transaction'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {selectedRow && (
                  <div className="bg-[#fafaf8] border border-gray-200 p-4 text-sm space-y-2">
                    <div className="font-black text-black">Evidence Links</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedRow.relatedAward && (
                        <Link
                          href={`/funding/accountability/awards/${selectedRow.relatedAward.id}`}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-black text-xs font-black hover:bg-gray-100 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Public Award Evidence
                        </Link>
                      )}
                      {selectedRow.primaryCommitmentId && (
                        <Link
                          href={`/funding/accountability/commitments/${selectedRow.primaryCommitmentId}`}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-black text-xs font-black hover:bg-gray-100 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Public Commitment Evidence
                          {typeof selectedRow.commitmentCount === 'number' && selectedRow.commitmentCount > 1
                            ? ` (${selectedRow.commitmentCount})`
                            : ''}
                        </Link>
                      )}
                      {!selectedRow.relatedAward && !selectedRow.primaryCommitmentId && (
                        <div className="text-xs text-gray-500">
                          No linked public evidence yet. Add an award/commitment relationship first.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Funding Program
                    </label>
                    <select
                      value={form.fundingProgramId}
                      onChange={(event) => setForm((current) => ({ ...current, fundingProgramId: event.target.value }))}
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    >
                      <option value="">Select program</option>
                      {reference.fundingPrograms.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Organization
                    </label>
                    <select
                      value={form.organizationId}
                      onChange={(event) => setForm((current) => ({ ...current, organizationId: event.target.value }))}
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    >
                      <option value="">No specific organization</option>
                      {reference.organizations.map((organization) => (
                        <option key={organization.id} value={organization.id}>
                          {organization.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                    Opportunity
                  </label>
                  <select
                    value={form.opportunityId}
                    onChange={(event) => setForm((current) => ({ ...current, opportunityId: event.target.value }))}
                    className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                  >
                    <option value="">No specific opportunity</option>
                    {reference.opportunities.map((opportunity) => (
                      <option key={opportunity.id} value={opportunity.id}>
                        {opportunity.name}
                        {opportunity.funder_name ? ` (${opportunity.funder_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Transaction Type
                    </label>
                    <select
                      value={form.transactionType}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          transactionType: event.target.value as TransactionType,
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    >
                      {TRANSACTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Transaction Status
                    </label>
                    <select
                      value={form.transactionStatus}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          transactionStatus: event.target.value as TransactionStatus,
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    >
                      {TRANSACTION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Amount
                    </label>
                    <input
                      value={form.amount}
                      onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                      type="number"
                      step="any"
                      min={0}
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Currency
                    </label>
                    <input
                      value={form.currency}
                      onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Transaction Date
                    </label>
                    <input
                      value={form.transactionDate}
                      onChange={(event) => setForm((current) => ({ ...current, transactionDate: event.target.value }))}
                      type="datetime-local"
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Jurisdiction
                    </label>
                    <input
                      value={form.jurisdiction}
                      onChange={(event) => setForm((current) => ({ ...current, jurisdiction: event.target.value }))}
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Source Reference
                    </label>
                    <input
                      value={form.sourceReference}
                      onChange={(event) => setForm((current) => ({ ...current, sourceReference: event.target.value }))}
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                  />
                </div>

                <label className="inline-flex items-center gap-3 px-4 py-3 border-2 border-black bg-[#fafaf8] font-bold text-sm">
                  <input
                    type="checkbox"
                    checked={form.communityVisible}
                    onChange={(event) => setForm((current) => ({ ...current, communityVisible: event.target.checked }))}
                    className="h-4 w-4"
                  />
                  Community visible
                </label>

                <button
                  onClick={saveTransaction}
                  disabled={saving || advancingStatus}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-[#eef4ff] text-[#1d4ed8] border-2 border-black font-bold hover:bg-[#dbeafe] transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving…' : form.id ? 'Save Changes' : 'Create Transaction'}
                </button>

                {form.id && nextStatus && (
                  <button
                    onClick={advanceStatus}
                    disabled={saving || advancingStatus}
                    className="inline-flex items-center gap-2 px-4 py-3 ml-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <HandCoins className="w-4 h-4" />
                    {advancingStatus ? 'Advancing…' : `Mark ${nextStatus}`}
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
