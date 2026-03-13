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
  Users,
  Layers,
  CheckCircle2,
  CircleAlert,
  Target,
  ExternalLink,
  BookOpenCheck,
  RefreshCw,
  Link2,
} from 'lucide-react';

// --- Types ---

interface FundingData {
  readinessScore: number;
  trustScore: number;
  deliveryScore: number;
  complianceScore: number;
  evidenceScore: number;
  checklist: Array<{ key: string; label: string; complete: boolean; detail: string }>;
  nextActions: string[];
  topMatches: Array<{ id: string; name: string; matchScore: number; funder: string; deadline: string | null; maxAmount: number | null }>;
  applications: Array<{ id: string; name: string; status: string; amountRequested: number; amountAwarded: number }>;
  commitments: Array<{ id: string; name: string; status: string; baseline: number | null; current: number | null; target: number | null }>;
  supportNeeds: string[];
  organizationId: string;
}

interface EmpathyLedgerData {
  linked: boolean;
  storyCount: number;
  storytellerCount: number;
  orgName: string;
}

interface OverviewApiResponse {
  grants: { count: number; totalAwarded: number };
  compliance: { total: number; byStatus: Record<string, number> };
  sessions: { thisMonth: number; participantsThisMonth: number };
  actionItems: { open: number; byPriority: Record<string, number>; items: Array<{ id: string; title: string; priority: string; status: string; due_date: string | null }> };
  budget: { totalBudgeted: number; totalActual: number; burnRate: string };
  upcomingDeadlines: Array<{ type: string; title: string; date: string; id: string }>;
  people: { count: number };
  programs: { count: number };
  stories: { count: number };
  funding: FundingData | null;
  empathyLedger: EmpathyLedgerData | null;
}

interface AgentResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

type TabKey = 'overview' | 'grants' | 'compliance' | 'people' | 'programs' | 'referrals' | 'stories' | 'analysis' | 'media' | 'communications' | 'messages' | 'inbox' | 'support_network';

// --- Helpers ---

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function scoreClass(score: number) {
  if (score >= 85) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (score >= 70) return 'bg-blue-100 text-blue-800 border-blue-300';
  return 'bg-amber-100 text-amber-800 border-amber-300';
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// --- Component ---

export function OverviewTab({
  orgId,
  orgSlug,
  onNavigateTab,
}: {
  orgId: string;
  orgSlug: string;
  onNavigateTab?: (tab: TabKey) => void;
}) {
  const [data, setData] = useState<OverviewApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Agent action states
  const [pulseLoading, setPulseLoading] = useState(false);
  const [pulseResult, setPulseResult] = useState<AgentResult | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceResult, setComplianceResult] = useState<AgentResult | null>(null);
  const [grantMatchLoading, setGrantMatchLoading] = useState(false);
  const [grantMatchResult, setGrantMatchResult] = useState<AgentResult | null>(null);
  const [elSyncLoading, setElSyncLoading] = useState(false);
  const [elSyncResult, setElSyncResult] = useState<AgentResult | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org-hub/${orgId}/overview`);
      if (!res.ok) throw new Error('Failed to load overview data');
      const json = await res.json();
      setData(json);
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
      if (!res.ok) throw new Error('Agent action failed');
      const json = await res.json();
      const message = json.message ||
        (json.itemsCreated != null ? `Created ${json.itemsCreated} action items` :
        json.docsChecked != null ? `Checked ${json.docsChecked} docs, ${json.statusUpdates || 0} updated` :
        json.matches != null ? `Found ${json.matches.length} matching opportunities` :
        'Action completed');
      setResultFn({ ...json, message });
      fetchOverview();
    } catch (err) {
      setResultFn({ success: false, message: err instanceof Error ? err.message : 'Agent action failed' });
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
        <button onClick={fetchOverview} className="mt-3 px-4 py-2 font-bold bg-black text-white hover:bg-gray-800">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { grants, compliance, sessions, actionItems, budget, upcomingDeadlines, people, programs, stories, funding, empathyLedger } = data;

  const compCurrent = compliance.byStatus?.current || 0;
  const compExpiring = compliance.byStatus?.expiring || 0;
  const compExpired = compliance.byStatus?.expired || 0;
  const actionsHigh = (actionItems.byPriority?.high || 0) + (actionItems.byPriority?.urgent || 0);
  const actionsMedium = actionItems.byPriority?.medium || 0;
  const actionsLow = actionItems.byPriority?.low || 0;
  const totalActions = actionsHigh + actionsMedium + actionsLow;
  const burnRate = parseFloat(budget.burnRate || '0');

  // Compute problem digest alerts
  const alerts: string[] = [];
  if (compExpiring > 0) alerts.push(`${compExpiring} compliance doc${compExpiring > 1 ? 's' : ''} expiring soon`);
  if (compExpired > 0) alerts.push(`${compExpired} compliance doc${compExpired > 1 ? 's' : ''} expired`);
  if (actionsHigh > 0) alerts.push(`${actionsHigh} high-priority action${actionsHigh > 1 ? 's' : ''} open`);
  if (burnRate > 90) alerts.push(`Budget burn rate at ${burnRate.toFixed(1)}%`);
  if (funding) {
    if (funding.readinessScore < 70) alerts.push(`Funding readiness score is ${funding.readinessScore}`);
    const incomplete = funding.checklist.filter(c => !c.complete);
    if (incomplete.length > 0) alerts.push(`${incomplete.length} funding checklist item${incomplete.length > 1 ? 's' : ''} need work`);
  }
  const overdueGrants = upcomingDeadlines.filter(d => {
    const days = Math.ceil((new Date(d.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days < 0 && d.type === 'grant_acquittal';
  });
  if (overdueGrants.length > 0) alerts.push(`${overdueGrants.length} overdue grant acquittal${overdueGrants.length > 1 ? 's' : ''}`);

  const navigateTab = (tab: TabKey) => {
    if (onNavigateTab) onNavigateTab(tab);
  };

  return (
    <div className="space-y-6">
      {/* Hero Zone: Readiness Badges + Stat Cards */}
      {funding && (
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1.5 text-xs font-black border border-black ${scoreClass(funding.readinessScore)}`}>
            Readiness {funding.readinessScore}
          </span>
          <span className={`px-3 py-1.5 text-xs font-black border border-black ${scoreClass(funding.trustScore)}`}>
            Trust {funding.trustScore}
          </span>
          <span className="px-3 py-1.5 text-xs font-black border border-black bg-white">
            Checklist {funding.checklist.filter(c => c.complete).length}/{funding.checklist.length}
          </span>
          {empathyLedger && (
            <span className="px-3 py-1.5 text-xs font-black border border-black bg-purple-50 text-purple-800">
              Empathy Ledger: {empathyLedger.storyCount} stories, {empathyLedger.storytellerCount} storytellers
            </span>
          )}
        </div>
      )}
      {!funding && empathyLedger && (
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 text-xs font-black border border-black bg-purple-50 text-purple-800">
            Empathy Ledger: {empathyLedger.storyCount} stories, {empathyLedger.storytellerCount} storytellers
          </span>
        </div>
      )}

      {/* Empathy Ledger Sync */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => runAgentAction('el-sync', setElSyncLoading, setElSyncResult)}
          disabled={elSyncLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold border-2 border-black bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {elSyncLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : empathyLedger?.linked ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            <Link2 className="w-4 h-4" />
          )}
          {empathyLedger?.linked ? 'Sync People to EL' : 'Connect to Empathy Ledger'}
        </button>
        {elSyncResult && (
          <span className={`text-sm font-medium ${elSyncResult.success !== false ? 'text-green-700' : 'text-red-700'}`}>
            {elSyncResult.message}
          </span>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard icon={DollarSign} iconBg="bg-green-100" iconColor="text-green-700" label="Active Grants" value={String(grants.count)} sub={formatCurrency(grants.totalAwarded)} onClick={() => navigateTab('grants')} />
        <StatCard icon={ShieldCheck} iconBg="bg-blue-100" iconColor="text-blue-700" label="Compliance" value={String(compCurrent)} sub={compExpiring > 0 || compExpired > 0 ? `${compExpiring} expiring, ${compExpired} expired` : 'All current'} onClick={() => navigateTab('compliance')} />
        <StatCard icon={Users} iconBg="bg-indigo-100" iconColor="text-indigo-700" label="People" value={String(people.count)} onClick={() => navigateTab('people')} />
        <StatCard icon={Layers} iconBg="bg-teal-100" iconColor="text-teal-700" label="Programs" value={String(programs.count)} onClick={() => navigateTab('programs')} />
        <StatCard icon={Calendar} iconBg="bg-purple-100" iconColor="text-purple-700" label="Sessions" value={String(sessions.thisMonth)} sub="this month" />
        <StatCard icon={AlertTriangle} iconBg="bg-red-100" iconColor="text-red-700" label="Open Actions" value={String(totalActions)} sub={actionsHigh > 0 ? `${actionsHigh} high priority` : undefined} onClick={() => navigateTab('inbox')} />
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Problem Digest */}
          <div className={`border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${alerts.length > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
            <div className="flex items-center gap-2 mb-3">
              <CircleAlert className="w-5 h-5" />
              <h3 className="text-lg font-black">{alerts.length > 0 ? 'Attention Required' : 'All Clear'}</h3>
            </div>
            {alerts.length === 0 ? (
              <p className="text-sm text-emerald-800 font-medium">No urgent issues. Keep up the good work.</p>
            ) : (
              <ul className="space-y-2">
                {alerts.map((alert) => (
                  <li key={alert} className="flex items-start gap-2 text-sm font-medium text-amber-900">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {alert}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Budget & Grants Summary */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-lg font-black">Budget & Grants</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Budget bars */}
              <div className="space-y-3">
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
                      className={`h-full ${burnRate > 90 ? 'bg-red-500' : burnRate > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(burnRate, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-600">Burn Rate</span>
                    <span className={`px-2 py-1 text-xs font-bold ${burnRate > 90 ? 'bg-red-100 text-red-800' : burnRate > 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {burnRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Upcoming deadlines */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-bold">Upcoming Deadlines</span>
                  <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-600">Next 30 days</span>
                </div>
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-gray-500 text-sm font-medium py-2 text-center">No upcoming deadlines</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {upcomingDeadlines.map((d) => {
                      const days = Math.ceil((new Date(d.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={d.id} className="flex items-center gap-2 p-2 border border-gray-200 hover:border-black transition-colors text-sm">
                          {d.type === 'grant_acquittal' ? <DollarSign className="w-3.5 h-3.5 text-green-700" /> : <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />}
                          <span className="font-bold truncate flex-1">{d.title}</span>
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${days <= 7 ? 'bg-red-100 text-red-800' : days <= 14 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>
                            {days}d
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Funding pipeline if available */}
            {funding && funding.applications.length > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-blue-700" />
                  <span className="text-sm font-bold">Funding Pipeline</span>
                </div>
                <div className="space-y-2">
                  {funding.applications.map((app) => (
                    <div key={app.id} className="flex items-center gap-3 p-2 border border-gray-200 bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{app.name}</p>
                        <p className="text-[11px] text-gray-500">
                          Requested {formatCurrency(app.amountRequested)}
                          {app.amountAwarded > 0 && <> · Awarded {formatCurrency(app.amountAwarded)}</>}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-[10px] font-black border border-black bg-white">{app.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Readiness Checklist (if funding data) */}
          {funding && (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <h3 className="text-lg font-black">Submission Readiness</h3>
              </div>
              <div className="space-y-2">
                {funding.checklist.map((item) => (
                  <div key={item.key} className={`border p-3 ${item.complete ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <span className="text-sm font-black">{item.label}</span>
                      <span className="px-2 py-0.5 text-[10px] font-black border border-black bg-white whitespace-nowrap">
                        {item.complete ? 'ready' : 'needs work'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700">{item.detail}</p>
                  </div>
                ))}
              </div>
              {funding.supportNeeds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-xs font-bold uppercase text-gray-500 mb-2 block">Support Needs</span>
                  <div className="space-y-2">
                    {funding.supportNeeds.map((need) => (
                      <div key={need} className="border border-amber-200 bg-amber-50 p-2 text-sm text-gray-800">{need}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Outcome Commitments (if funding data) */}
          {funding && funding.commitments.length > 0 && (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-orange-700" />
                <h3 className="text-lg font-black">Outcome Commitments</h3>
              </div>
              <div className="space-y-3">
                {funding.commitments.map((c) => (
                  <div key={c.id} className="border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-black">{c.name}</span>
                      <span className="px-2 py-0.5 text-[10px] font-black border border-black bg-white">{c.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div className="border border-gray-200 bg-white p-2">
                        <div className="font-bold text-gray-500">Baseline</div>
                        <div className="font-black text-black">{c.baseline ?? '—'}</div>
                      </div>
                      <div className="border border-gray-200 bg-white p-2">
                        <div className="font-bold text-gray-500">Current</div>
                        <div className="font-black text-black">{c.current ?? '—'}</div>
                      </div>
                      <div className="border border-gray-200 bg-white p-2">
                        <div className="font-bold text-gray-500">Target</div>
                        <div className="font-black text-black">{c.target ?? '—'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          {/* Next Actions */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <CircleAlert className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-black">Next Actions</h3>
            </div>
            {funding && funding.nextActions.length > 0 ? (
              <div className="space-y-2">
                {funding.nextActions.map((action) => (
                  <div key={action} className="border border-amber-200 bg-amber-50 p-3 text-sm text-gray-800">{action}</div>
                ))}
              </div>
            ) : actionItems.items && actionItems.items.length > 0 ? (
              <div className="space-y-2">
                {actionItems.items.slice(0, 4).map((item) => (
                  <div key={item.id} className="border border-gray-200 p-2 text-sm">
                    <span className="font-bold">{item.title}</span>
                    {item.due_date && <span className="text-xs text-gray-500 ml-2">Due {formatDate(item.due_date)}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No pending actions. Everything is on track.</p>
            )}
          </div>

          {/* Agent Actions */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5" />
              <h3 className="text-lg font-black">Agent Actions</h3>
            </div>
            <div className="space-y-3">
              <AgentButton
                label="Run Pulse Check"
                icon={Search}
                className="bg-ochre-600 hover:bg-ochre-700"
                loading={pulseLoading}
                result={pulseResult}
                onClick={() => runAgentAction('pulse', setPulseLoading, setPulseResult)}
              />
              <AgentButton
                label="Compliance Scan"
                icon={ShieldCheck}
                className="bg-blue-600 hover:bg-blue-700"
                loading={complianceLoading}
                result={complianceResult}
                onClick={() => runAgentAction('compliance-check', setComplianceLoading, setComplianceResult)}
              />
              <AgentButton
                label="Grant Match"
                icon={FileText}
                className="bg-green-600 hover:bg-green-700"
                loading={grantMatchLoading}
                result={grantMatchResult}
                onClick={() => runAgentAction('grant-match', setGrantMatchLoading, setGrantMatchResult)}
              />
            </div>
          </div>

          {/* Quick Add */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5" />
              <h3 className="text-lg font-black">Quick Add</h3>
            </div>
            <div className="flex flex-col gap-2">
              <QuickAddButton icon={DollarSign} label="New Grant" onClick={() => navigateTab('grants')} />
              <QuickAddButton icon={ShieldCheck} label="New Compliance Item" onClick={() => navigateTab('compliance')} />
              <QuickAddButton icon={Calendar} label="New Session" onClick={() => navigateTab('programs')} />
              <QuickAddButton icon={ArrowRightLeft} label="New Referral" onClick={() => navigateTab('referrals')} />
              <QuickAddButton icon={BookOpen} label="New Story" onClick={() => navigateTab('stories')} />
              <QuickAddButton icon={MessageSquare} label="New Communication" onClick={() => navigateTab('communications')} />
            </div>
          </div>

          {/* Working Links */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink className="w-5 h-5" />
              <h3 className="text-lg font-black">Working Links</h3>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href={`/admin/organizations/${orgSlug}`}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold border-2 border-black hover:bg-gray-100 transition-colors"
              >
                Org Admin <ChevronRight className="w-3.5 h-3.5 ml-auto" />
              </Link>
              {funding && (
                <>
                  <Link
                    href={`/funding/workspace/${funding.organizationId}`}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold bg-emerald-700 text-white border-2 border-black hover:bg-emerald-800 transition-colors"
                  >
                    Funding Workspace <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </Link>
                  <Link
                    href={`/funding/discovery/${funding.organizationId}`}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold border-2 border-black hover:bg-gray-100 transition-colors"
                  >
                    Discovery Detail <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </Link>
                </>
              )}
              {empathyLedger && (
                <button
                  onClick={() => navigateTab('analysis')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold border-2 border-black hover:bg-gray-100 transition-colors text-left"
                >
                  <BookOpenCheck className="w-4 h-4" />
                  Empathy Ledger Analysis <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              )}
            </div>
          </div>

          {/* Match Signals */}
          {funding && funding.topMatches.length > 0 && (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
              <h3 className="text-lg font-black mb-4">Match Signals</h3>
              <div className="space-y-3">
                {funding.topMatches.map((match) => (
                  <div key={match.id} className="border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-black truncate">{match.name}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-black border border-black ${scoreClass(match.matchScore)}`}>
                        {match.matchScore}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600">{match.funder}</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {match.deadline && <>Deadline {formatDate(match.deadline)} · </>}
                      {match.maxAmount && <>Max {formatCurrency(match.maxAmount)}</>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
  onClick,
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 text-left ${onClick ? 'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`${iconBg} p-1.5 border border-black`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-black">{value}</p>
      {sub && <p className="text-xs font-medium text-gray-500 mt-0.5">{sub}</p>}
    </Wrapper>
  );
}

function AgentButton({
  label,
  icon: Icon,
  className: btnClass,
  loading,
  result,
  onClick,
}: {
  label: string;
  icon: any;
  className: string;
  loading: boolean;
  result: AgentResult | null;
  onClick: () => void;
}) {
  return (
    <div>
      <button
        onClick={onClick}
        disabled={loading}
        className={`w-full px-4 py-2 font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 ${btnClass}`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
        {label}
      </button>
      {result && (
        <div className={`mt-2 p-2 text-sm font-medium border ${result.success ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
}

function QuickAddButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-2 font-bold border-2 border-black hover:bg-gray-100 transition-colors text-sm text-left"
    >
      <Icon className="w-4 h-4" />
      {label}
      <ChevronRight className="w-3.5 h-3.5 ml-auto" />
    </button>
  );
}
