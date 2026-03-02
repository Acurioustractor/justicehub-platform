'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Loader2,
  Zap,
  Search,
  FileText,
  Plus,
  ChevronRight,
  Clock,
  ArrowRightLeft,
  MessageSquare,
  BookOpen,
} from 'lucide-react';

interface OverviewData {
  stats: {
    activeGrants: { count: number; totalAmount: number };
    compliance: { current: number; expiring: number; expired: number };
    sessionsThisMonth: number;
    openActions: { high: number; medium: number; low: number };
  };
  budget: {
    totalBudgeted: number;
    totalActual: number;
    burnRate: number;
  };
  deadlines: Array<{
    id: string;
    type: 'grant' | 'compliance';
    label: string;
    dueDate: string;
    daysUntilDue: number;
  }>;
}

interface AgentResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-red-100', text: 'text-red-800' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  low: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function OverviewTab({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Agent action states
  const [pulseLoading, setPulseLoading] = useState(false);
  const [pulseResult, setPulseResult] = useState<AgentResult | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceResult, setComplianceResult] = useState<AgentResult | null>(null);
  const [grantMatchLoading, setGrantMatchLoading] = useState(false);
  const [grantMatchResult, setGrantMatchResult] = useState<AgentResult | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org-hub/${orgId}/overview`);
      if (!res.ok) throw new Error('Failed to load overview data');
      const json = await res.json();
      // Map API response to component's expected shape
      const now = new Date();
      const mapped: OverviewData = {
        stats: {
          activeGrants: { count: json.grants?.count || 0, totalAmount: json.grants?.totalAwarded || 0 },
          compliance: {
            current: json.compliance?.byStatus?.current || 0,
            expiring: json.compliance?.byStatus?.expiring || 0,
            expired: json.compliance?.byStatus?.expired || 0,
          },
          sessionsThisMonth: json.sessions?.thisMonth || 0,
          openActions: {
            high: (json.actionItems?.byPriority?.high || 0) + (json.actionItems?.byPriority?.urgent || 0),
            medium: json.actionItems?.byPriority?.medium || 0,
            low: json.actionItems?.byPriority?.low || 0,
          },
        },
        budget: {
          totalBudgeted: json.budget?.totalBudgeted || 0,
          totalActual: json.budget?.totalActual || 0,
          burnRate: parseFloat(json.budget?.burnRate || '0'),
        },
        deadlines: (json.upcomingDeadlines || []).map((d: any) => ({
          id: d.id,
          type: d.type === 'grant_acquittal' ? 'grant' : 'compliance',
          label: d.title,
          dueDate: d.date,
          daysUntilDue: Math.ceil((new Date(d.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        })),
      };
      setData(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const runAgentAction = useCallback(async (
    endpoint: string,
    setLoadingFn: (v: boolean) => void,
    setResultFn: (v: AgentResult | null) => void,
  ) => {
    setLoadingFn(true);
    setResultFn(null);
    try {
      const res = await fetch(`/api/org-hub/${orgId}/${endpoint}`, { method: 'POST' });
      if (!res.ok) throw new Error(`Agent action failed`);
      const json = await res.json();
      // Normalize agent responses to include a message
      const message = json.message ||
        (json.itemsCreated != null ? `Created ${json.itemsCreated} action items` :
        json.docsChecked != null ? `Checked ${json.docsChecked} docs, ${json.statusUpdates || 0} updated` :
        json.matches != null ? `Found ${json.matches.length} matching opportunities` :
        'Action completed');
      setResultFn({ ...json, message });
      // Refresh overview after agent action
      fetchOverview();
    } catch (err) {
      setResultFn({
        success: false,
        message: err instanceof Error ? err.message : 'Agent action failed',
      });
    } finally {
      setLoadingFn(false);
    }
  }, [orgId, fetchOverview]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <p className="text-red-700 font-bold">Error: {error}</p>
        <button
          onClick={fetchOverview}
          className="mt-3 px-4 py-2 font-bold bg-black text-white hover:bg-gray-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { stats, budget, deadlines } = data;

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Grants */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 p-2 border-2 border-black">
              <DollarSign className="w-5 h-5 text-green-700" />
            </div>
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Active Grants</span>
          </div>
          <p className="text-3xl font-black">{stats.activeGrants.count}</p>
          <p className="text-sm font-medium text-gray-600 mt-1">
            {formatCurrency(stats.activeGrants.totalAmount)} total
          </p>
        </div>

        {/* Compliance */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 border-2 border-black">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
            </div>
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Compliance</span>
          </div>
          <div className="flex gap-3 items-baseline">
            <div>
              <span className="text-3xl font-black text-green-700">{stats.compliance.current}</span>
              <span className="text-xs font-bold text-gray-500 ml-1">current</span>
            </div>
          </div>
          <div className="flex gap-3 mt-1 text-sm font-medium">
            {stats.compliance.expiring > 0 && (
              <span className="text-yellow-700">{stats.compliance.expiring} expiring</span>
            )}
            {stats.compliance.expired > 0 && (
              <span className="text-red-700">{stats.compliance.expired} expired</span>
            )}
          </div>
        </div>

        {/* Sessions This Month */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-100 p-2 border-2 border-black">
              <Calendar className="w-5 h-5 text-purple-700" />
            </div>
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Sessions This Month</span>
          </div>
          <p className="text-3xl font-black">{stats.sessionsThisMonth}</p>
        </div>

        {/* Open Actions */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-red-100 p-2 border-2 border-black">
              <AlertTriangle className="w-5 h-5 text-red-700" />
            </div>
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Open Actions</span>
          </div>
          <p className="text-3xl font-black">
            {stats.openActions.high + stats.openActions.medium + stats.openActions.low}
          </p>
          <div className="flex gap-2 mt-2">
            {stats.openActions.high > 0 && (
              <span className={`px-2 py-1 text-xs font-bold ${PRIORITY_COLORS.high.bg} ${PRIORITY_COLORS.high.text}`}>
                {stats.openActions.high} high
              </span>
            )}
            {stats.openActions.medium > 0 && (
              <span className={`px-2 py-1 text-xs font-bold ${PRIORITY_COLORS.medium.bg} ${PRIORITY_COLORS.medium.text}`}>
                {stats.openActions.medium} med
              </span>
            )}
            {stats.openActions.low > 0 && (
              <span className={`px-2 py-1 text-xs font-bold ${PRIORITY_COLORS.low.bg} ${PRIORITY_COLORS.low.text}`}>
                {stats.openActions.low} low
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Budget Summary + Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Summary */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-lg font-black">Budget Summary</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-bold mb-1">
                <span>Budgeted</span>
                <span>{formatCurrency(budget.totalBudgeted)}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 border border-black">
                <div className="h-full bg-blue-500" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-bold mb-1">
                <span>Actual Spend</span>
                <span>{formatCurrency(budget.totalActual)}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 border border-black">
                <div
                  className={`h-full ${budget.burnRate > 90 ? 'bg-red-500' : budget.burnRate > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(budget.burnRate, 100)}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-600">Burn Rate</span>
                <span className={`px-2 py-1 text-xs font-bold ${
                  budget.burnRate > 90 ? 'bg-red-100 text-red-800' :
                  budget.burnRate > 70 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {budget.burnRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-5 h-5" />
            <h3 className="text-lg font-black">Upcoming Deadlines</h3>
            <span className="ml-auto px-2 py-1 text-xs font-bold bg-gray-100 text-gray-700">Next 30 days</span>
          </div>
          {deadlines.length === 0 ? (
            <p className="text-gray-500 text-sm font-medium py-4 text-center">No upcoming deadlines</p>
          ) : (
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {deadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 hover:border-black transition-colors"
                >
                  <div className={`p-1.5 ${deadline.type === 'grant' ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {deadline.type === 'grant' ? (
                      <DollarSign className="w-4 h-4 text-green-700" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{deadline.label}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(deadline.dueDate).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold whitespace-nowrap ${
                    deadline.daysUntilDue <= 7 ? 'bg-red-100 text-red-800' :
                    deadline.daysUntilDue <= 14 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {deadline.daysUntilDue} days
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agent Actions */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-5 h-5" />
          <h3 className="text-lg font-black">Agent Actions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Pulse Check */}
          <div>
            <button
              onClick={() => runAgentAction('pulse', setPulseLoading, setPulseResult)}
              disabled={pulseLoading}
              className="w-full px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pulseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Run Pulse Check
            </button>
            {pulseResult && (
              <div className={`mt-2 p-3 text-sm font-medium border ${
                pulseResult.success ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                {pulseResult.message}
              </div>
            )}
          </div>

          {/* Compliance Scan */}
          <div>
            <button
              onClick={() => runAgentAction('compliance-check', setComplianceLoading, setComplianceResult)}
              disabled={complianceLoading}
              className="w-full px-4 py-2 font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {complianceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Compliance Scan
            </button>
            {complianceResult && (
              <div className={`mt-2 p-3 text-sm font-medium border ${
                complianceResult.success ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                {complianceResult.message}
              </div>
            )}
          </div>

          {/* Grant Match */}
          <div>
            <button
              onClick={() => runAgentAction('grant-match', setGrantMatchLoading, setGrantMatchResult)}
              disabled={grantMatchLoading}
              className="w-full px-4 py-2 font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {grantMatchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Grant Match
            </button>
            {grantMatchResult && (
              <div className={`mt-2 p-3 text-sm font-medium border ${
                grantMatchResult.success ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                {grantMatchResult.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Plus className="w-5 h-5" />
          <h3 className="text-lg font-black">Quick Add</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/organizations/${orgSlug}/hub?tab=grants`}
            className="inline-flex items-center gap-2 px-4 py-2 font-bold border-2 border-black hover:bg-gray-100 transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            New Grant
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/organizations/${orgSlug}/hub?tab=compliance`}
            className="inline-flex items-center gap-2 px-4 py-2 font-bold border-2 border-black hover:bg-gray-100 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            New Compliance Item
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/organizations/${orgSlug}/hub?tab=programs`}
            className="inline-flex items-center gap-2 px-4 py-2 font-bold border-2 border-black hover:bg-gray-100 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            New Session
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/organizations/${orgSlug}/hub?tab=referrals`}
            className="inline-flex items-center gap-2 px-4 py-2 font-bold border-2 border-black hover:bg-gray-100 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            New Referral
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/organizations/${orgSlug}/hub?tab=stories`}
            className="inline-flex items-center gap-2 px-4 py-2 font-bold border-2 border-black hover:bg-gray-100 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            New Story
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/organizations/${orgSlug}/hub?tab=communications`}
            className="inline-flex items-center gap-2 px-4 py-2 font-bold border-2 border-black hover:bg-gray-100 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            New Communication
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
