'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import { ArrowLeft, CheckCircle2, Clock3, FileText, HandCoins, RefreshCw, ShieldCheck } from 'lucide-react';

interface AccountabilityRow {
  funding_award_id: string;
  funding_source_name: string;
  funding_program_name: string;
  organization_name: string;
  award_status: string;
  amount_awarded: number;
  amount_disbursed: number;
  tracked_public_spend: number;
  outcome_commitment_count: number;
  outcome_update_count: number;
  community_validation_count: number;
  avg_community_trust_rating?: number | null;
  avg_community_impact_rating?: number | null;
  community_report_due_at?: string | null;
  updated_at: string;
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

function formatRating(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toFixed(1);
}

function isOverdue(value?: string | null) {
  if (!value) return false;
  const due = new Date(value);
  return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
}

export default function FundingCommunityAccountabilityPage() {
  const [rows, setRows] = useState<AccountabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awardStatus, setAwardStatus] = useState<string>('all');
  const [organizationQuery, setOrganizationQuery] = useState<string>('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const fetchData = async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (awardStatus !== 'all') {
        params.set('awardStatus', awardStatus);
      }
      if (organizationQuery.trim()) {
        params.set('organizationQuery', organizationQuery.trim());
      }
      if (overdueOnly) {
        params.set('overdueOnly', 'true');
      }

      const response = await fetch(`/api/funding/accountability?${params.toString()}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to load accountability');
      }
      const payload = await response.json();
      setRows(payload.data || []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load accountability');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [awardStatus, organizationQuery, overdueOnly]);

  const availableStatuses = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.award_status).filter(Boolean))).sort();
  }, [rows]);

  const metrics = useMemo(() => {
    const totals = rows.reduce(
      (acc, row) => {
        acc.awarded += row.amount_awarded || 0;
        acc.disbursed += row.amount_disbursed || 0;
        acc.tracked += row.tracked_public_spend || 0;
        acc.validations += row.community_validation_count || 0;
        if (isOverdue(row.community_report_due_at)) {
          acc.overdue += 1;
        }
        if (typeof row.avg_community_trust_rating === 'number') {
          acc.trustTotal += row.avg_community_trust_rating;
          acc.trustCount += 1;
        }
        return acc;
      },
      {
        awarded: 0,
        disbursed: 0,
        tracked: 0,
        validations: 0,
        overdue: 0,
        trustTotal: 0,
        trustCount: 0,
      }
    );

    return {
      awardCount: rows.length,
      totalAwarded: totals.awarded,
      totalDisbursed: totals.disbursed,
      totalTracked: totals.tracked,
      totalValidations: totals.validations,
      overdueReports: totals.overdue,
      avgTrust: totals.trustCount ? totals.trustTotal / totals.trustCount : null,
    };
  }, [rows]);

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
                <div className="flex h-12 w-12 items-center justify-center bg-emerald-500 text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Community Accountability</h1>
                  <p className="text-base text-gray-600">
                    Track awards, public spend, and community-validated outcomes in one public evidence layer.
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                  Organization
                </label>
                <input
                  value={organizationQuery}
                  onChange={(event) => setOrganizationQuery(event.target.value)}
                  placeholder="Search an organization"
                  className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <div className="w-full lg:w-56">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                  Award Status
                </label>
                <select
                  value={awardStatus}
                  onChange={(event) => setAwardStatus(event.target.value)}
                  className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <option value="all">All statuses</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <label className="inline-flex items-center gap-3 px-4 py-3 border-2 border-black bg-[#fafaf8] font-bold text-sm min-h-[52px]">
                <input
                  type="checkbox"
                  checked={overdueOnly}
                  onChange={(event) => setOverdueOnly(event.target.checked)}
                  className="h-4 w-4"
                />
                Show overdue only
              </label>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">Tracked Awards</div>
              <div className="text-3xl font-black text-black">{metrics.awardCount}</div>
              <div className="text-sm text-gray-600 mt-2">Total awarded {formatCurrency(metrics.totalAwarded)}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                <HandCoins className="w-4 h-4" />
                Public Spend
              </div>
              <div className="text-3xl font-black text-black">{formatCurrency(metrics.totalTracked)}</div>
              <div className="text-sm text-gray-600 mt-2">Disbursed {formatCurrency(metrics.totalDisbursed)}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                Community Validation
              </div>
              <div className="text-3xl font-black text-black">{metrics.totalValidations}</div>
              <div className="text-sm text-gray-600 mt-2">Average trust {formatRating(metrics.avgTrust)} / 5</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                <Clock3 className="w-4 h-4" />
                Reporting Due
              </div>
              <div className="text-3xl font-black text-black">{metrics.overdueReports}</div>
              <div className="text-sm text-gray-600 mt-2">Awards currently overdue for a community report</div>
            </div>
          </div>

          <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="px-6 py-5 border-b-2 border-black">
              <h2 className="text-2xl font-black text-black">Award Accountability Ledger</h2>
              <p className="text-sm text-gray-600 mt-1">
                This view makes it visible where money moved, how much has been disbursed, and whether community members have validated impact.
              </p>
            </div>

            <div className="p-6">
              {loading && rows.length === 0 ? (
                <div className="text-sm text-gray-500">Loading accountability data…</div>
              ) : rows.length === 0 ? (
                <div className="text-sm text-gray-500">No accountability records yet.</div>
              ) : (
                <div className="space-y-4">
                  {rows.map((row) => (
                    <div
                      key={row.funding_award_id}
                      className="border-2 border-black bg-[#fafaf8] p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <div className="text-sm font-black text-black">{row.organization_name}</div>
                          <div className="text-base font-bold text-gray-800 mt-1">{row.funding_program_name}</div>
                          <div className="text-xs text-gray-600 mt-1">{row.funding_source_name}</div>
                        </div>
                        <div
                          className={`inline-flex items-center px-3 py-1 text-xs font-black border border-black ${
                            isOverdue(row.community_report_due_at)
                              ? 'bg-red-100 text-red-800'
                              : 'bg-[#eef4ff] text-[#1d4ed8]'
                          }`}
                        >
                          {row.award_status}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mt-4 text-xs">
                        <div className="bg-white border border-gray-200 p-3">
                          <div className="font-bold text-gray-600">Awarded</div>
                          <div className="text-sm font-black text-black">{formatCurrency(row.amount_awarded)}</div>
                        </div>
                        <div className="bg-white border border-gray-200 p-3">
                          <div className="font-bold text-gray-600">Disbursed</div>
                          <div className="text-sm font-black text-black">{formatCurrency(row.amount_disbursed)}</div>
                        </div>
                        <div className="bg-white border border-gray-200 p-3">
                          <div className="font-bold text-gray-600">Tracked Spend</div>
                          <div className="text-sm font-black text-black">{formatCurrency(row.tracked_public_spend)}</div>
                        </div>
                        <div className="bg-white border border-gray-200 p-3">
                          <div className="font-bold text-gray-600">Commitments</div>
                          <div className="text-sm font-black text-black">{row.outcome_commitment_count}</div>
                        </div>
                        <div className="bg-white border border-gray-200 p-3">
                          <div className="font-bold text-gray-600">Updates</div>
                          <div className="text-sm font-black text-black">{row.outcome_update_count}</div>
                        </div>
                        <div className="bg-white border border-gray-200 p-3">
                          <div className="font-bold text-gray-600">Validations</div>
                          <div className="text-sm font-black text-black">{row.community_validation_count}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs text-gray-600">
                        <div>
                          Community trust rating: <span className="font-black text-black">{formatRating(row.avg_community_trust_rating)} / 5</span>
                        </div>
                        <div>
                          Community impact rating: <span className="font-black text-black">{formatRating(row.avg_community_impact_rating)} / 5</span>
                        </div>
                        <div>
                          Community report due: <span className={`font-black ${isOverdue(row.community_report_due_at) ? 'text-red-700' : 'text-black'}`}>{formatDate(row.community_report_due_at)}</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Link
                          href={`/funding/accountability/awards/${row.funding_award_id}`}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          View Evidence Trail
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
