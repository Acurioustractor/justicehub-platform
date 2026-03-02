'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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

interface CommitmentRecord {
  id: string;
  commitment_status: string;
  baseline_value?: number | null;
  target_value?: number | null;
  current_value?: number | null;
  target_date?: string | null;
  measurement_notes?: string | null;
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
  outcome_summary?: string | null;
  public_summary?: string | null;
  fundingSource?: {
    id: string;
    name: string;
    source_kind?: string | null;
  } | null;
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
}

interface TransactionRecord {
  id: string;
  transaction_type: string;
  transaction_status: string;
  amount: number;
  currency?: string | null;
  transaction_date?: string | null;
  description?: string | null;
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

export default function FundingAwardAccountabilityDetailPage() {
  const params = useParams<{ fundingAwardId: string }>();
  const fundingAwardId = String(params?.fundingAwardId || '').trim();

  const [award, setAward] = useState<AwardDetail | null>(null);
  const [commitments, setCommitments] = useState<CommitmentRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (background = false) => {
    if (!fundingAwardId) return;

    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(
        `/api/funding/accountability/awards/${encodeURIComponent(fundingAwardId)}`
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load award evidence trail');
      }

      setAward(payload.award || null);
      setCommitments(payload.commitments || []);
      setTransactions(payload.transactions || []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to load award evidence trail'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fundingAwardId]);

  const metrics = useMemo(() => {
    let updateCount = 0;
    let validationCount = 0;

    for (const commitment of commitments) {
      updateCount += commitment.updates.length;
      for (const update of commitment.updates) {
        validationCount += update.validations.length;
      }
    }

    return {
      commitmentCount: commitments.length,
      updateCount,
      validationCount,
      trackedSpend: transactions.reduce(
        (sum, transaction) => sum + (transaction.amount || 0),
        0
      ),
    };
  }, [commitments, transactions]);

  return (
    <div className="min-h-screen bg-[#f5f6f2] page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="flex flex-col gap-6 mb-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/funding/accountability"
                className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Accountability
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-emerald-500 text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Evidence Trail</h1>
                  <p className="text-base text-gray-600">
                    Review the commitments, progress updates, and community validations behind this award.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || !fundingAwardId}
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

          {loading && !award ? (
            <div className="text-sm text-gray-500">Loading evidence trail…</div>
          ) : !award ? (
            <div className="text-sm text-gray-500">No award found for this evidence trail.</div>
          ) : (
            <>
              <section className="bg-white border-2 border-black p-6 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="text-sm font-black text-black">
                      {award.organization?.name || 'Unknown organization'}
                    </div>
                    <div className="text-2xl font-black text-black mt-1">
                      {award.fundingProgram?.name || 'Unknown program'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {award.fundingSource?.name || 'Unknown funding source'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-3 py-1 text-xs font-black border border-black bg-[#eef4ff] text-[#1d4ed8]">
                      {award.award_status}
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      Report due {formatDate(award.community_report_due_at)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
                  <div className="bg-[#fafaf8] border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">Awarded</div>
                    <div className="text-2xl font-black text-black">{formatCurrency(award.amount_awarded)}</div>
                  </div>
                  <div className="bg-[#fafaf8] border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">Disbursed</div>
                    <div className="text-2xl font-black text-black">{formatCurrency(award.amount_disbursed)}</div>
                  </div>
                  <div className="bg-[#fafaf8] border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">Tracked Spend</div>
                    <div className="text-2xl font-black text-black">{formatCurrency(metrics.trackedSpend)}</div>
                  </div>
                  <div className="bg-[#fafaf8] border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">Evidence Items</div>
                    <div className="text-sm font-black text-black">
                      {metrics.commitmentCount} commitments · {metrics.updateCount} updates · {metrics.validationCount} validations
                    </div>
                  </div>
                </div>

                {(award.public_summary || award.outcome_summary) && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6 text-sm">
                    <div className="bg-[#fafaf8] border border-gray-200 p-4">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">Public Summary</div>
                      <div className="text-gray-700">{award.public_summary || '—'}</div>
                    </div>
                    <div className="bg-[#fafaf8] border border-gray-200 p-4">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">Outcome Summary</div>
                      <div className="text-gray-700">{award.outcome_summary || '—'}</div>
                    </div>
                  </div>
                )}
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
                <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="px-6 py-5 border-b-2 border-black">
                    <h2 className="text-2xl font-black text-black">Outcome Commitments</h2>
                  </div>
                  <div className="p-6 space-y-5">
                    {commitments.length === 0 ? (
                      <div className="text-sm text-gray-500">No commitments linked to this award yet.</div>
                    ) : (
                      commitments.map((commitment) => (
                        <div
                          key={commitment.id}
                          className="border-2 border-black bg-[#fafaf8] p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="text-sm font-black text-black">
                                {commitment.outcomeDefinition?.name || 'Unnamed outcome'}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {commitment.outcomeDefinition?.outcome_domain || '—'}
                                {commitment.outcomeDefinition?.unit
                                  ? ` · ${commitment.outcomeDefinition.unit}`
                                  : ''}
                              </div>
                            </div>
                            <div className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-700">
                              {commitment.commitment_status}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
                            <div className="bg-white border border-gray-200 p-3">
                              <div className="font-bold text-gray-600">Baseline</div>
                              <div className="font-black text-black">{formatNumber(commitment.baseline_value)}</div>
                            </div>
                            <div className="bg-white border border-gray-200 p-3">
                              <div className="font-bold text-gray-600">Current</div>
                              <div className="font-black text-black">{formatNumber(commitment.current_value)}</div>
                            </div>
                            <div className="bg-white border border-gray-200 p-3">
                              <div className="font-bold text-gray-600">Target</div>
                              <div className="font-black text-black">{formatNumber(commitment.target_value)}</div>
                            </div>
                            <div className="bg-white border border-gray-200 p-3">
                              <div className="font-bold text-gray-600">Target Date</div>
                              <div className="font-black text-black">{formatDate(commitment.target_date)}</div>
                            </div>
                          </div>

                          {commitment.measurement_notes && (
                            <div className="mt-4 text-sm text-gray-700">
                              {commitment.measurement_notes}
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                              href={`/funding/accountability/commitments/${commitment.id}`}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              Share Commitment
                            </Link>
                            <Link
                              href={`/funding/accountability/commitments/${commitment.id}?contribute=update#contribute-panel`}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white border-2 border-black text-xs font-black hover:bg-emerald-700 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Contribute Update
                            </Link>
                            {commitment.updates.length > 0 ? (
                              <Link
                                href={`/funding/accountability/commitments/${commitment.id}?contribute=validation#contribute-panel`}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-[#1d4ed8] text-white border-2 border-black text-xs font-black hover:bg-[#1e40af] transition-colors"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                Add Validation
                              </Link>
                            ) : (
                              <div className="inline-flex items-center gap-2 px-3 py-2 bg-[#f3f4f6] border-2 border-black text-[11px] font-black text-gray-600">
                                <ShieldCheck className="w-4 h-4" />
                                Add validation after first update
                              </div>
                            )}
                          </div>

                          <div className="mt-5 space-y-4">
                            {commitment.updates.length === 0 ? (
                              <div className="text-sm text-gray-500">No updates recorded yet.</div>
                            ) : (
                              commitment.updates.map((update) => (
                                <div key={update.id} className="bg-white border border-gray-200 p-4">
                                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
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
                                        <div
                                          key={validation.id}
                                          className="border border-gray-200 bg-[#f8fafc] p-3"
                                        >
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
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="px-6 py-5 border-b-2 border-black">
                      <h2 className="text-2xl font-black text-black">Spending Trail</h2>
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
                              <div className="text-xs text-gray-700 mt-2">
                                {transaction.description}
                              </div>
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
                      This page exposes the evidence chain behind one funding award so community can see what was promised, what was reported, how money moved, and whether people on the ground validated the claim.
                    </p>
                    <div className="grid grid-cols-1 gap-3 mt-4 text-xs">
                      <div className="flex items-center gap-2">
                        <HandCoins className="w-4 h-4 text-emerald-700" />
                        Spending is visible against the same award that outcomes are reported on.
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        Community validation sits beside organizational reporting, not behind it.
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
