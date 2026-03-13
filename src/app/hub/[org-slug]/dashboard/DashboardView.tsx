'use client';

import { Activity, DollarSign, AlertTriangle, CalendarClock, Clock } from 'lucide-react';
import type { BGFitDashboardSummary } from '@/lib/bgfit/types';
import {
  formatCurrency,
  formatDate,
  getUrgencyColor,
  getSpendPercentage,
  getHealthStatus,
  getIssueSeverityColor,
} from '@/lib/bgfit/utils';

interface DashboardViewProps {
  summary: BGFitDashboardSummary;
}

export function DashboardView({ summary }: DashboardViewProps) {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-black">This Week</h2>
        <p className="text-sm text-gray-500 font-medium mt-1">Your grants at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label="Active Grants"
          value={String(summary.activeGrants)}
          color="bg-green-50"
        />
        <StatCard
          icon={DollarSign}
          label="Total Spent"
          value={formatCurrency(summary.totalSpent)}
          sub={`of ${formatCurrency(summary.totalBudget)} budget`}
          color="bg-blue-50"
        />
        <StatCard
          icon={CalendarClock}
          label="Due This Week"
          value={String(summary.deadlinesDueThisWeek)}
          color={summary.deadlinesDueThisWeek > 0 ? 'bg-orange-50' : 'bg-gray-50'}
        />
        <StatCard
          icon={AlertTriangle}
          label="Flagged Issues"
          value={String(summary.flaggedIssues.length)}
          color={summary.flaggedIssues.length > 0 ? 'bg-red-50' : 'bg-gray-50'}
        />
      </div>

      {/* Two-column layout: issues + deadlines */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Flagged issues */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-6">
          <h3 className="text-lg font-black flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Flagged Issues
          </h3>
          {summary.flaggedIssues.length === 0 ? (
            <p className="text-sm text-gray-500">No issues flagged. Looking good!</p>
          ) : (
            <div className="space-y-3">
              {summary.flaggedIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3 rounded-lg border ${getIssueSeverityColor(issue.issue_severity)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm">{issue.item_name}</p>
                      <p className="text-xs mt-0.5">{issue.category}</p>
                    </div>
                    {issue.issue_severity && (
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded">
                        {issue.issue_severity}
                      </span>
                    )}
                  </div>
                  {issue.issue_description && (
                    <p className="text-xs mt-2">{issue.issue_description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming deadlines */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-6">
          <h3 className="text-lg font-black flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-ochre-600" />
            Upcoming Deadlines
          </h3>
          {summary.upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming deadlines.</p>
          ) : (
            <div className="space-y-3">
              {summary.upcomingDeadlines.map((deadline) => {
                const colors = getUrgencyColor(deadline.urgency);
                return (
                  <div
                    key={deadline.id}
                    className={`p-3 rounded-lg border ${colors.border} ${colors.bg}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`font-bold text-sm ${colors.text}`}>{deadline.title}</p>
                        {deadline.grant_name && (
                          <p className="text-xs text-gray-600 truncate">{deadline.grant_name}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold">{formatDate(deadline.due_date)}</p>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${colors.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                          {deadline.days_until_due < 0
                            ? `${Math.abs(deadline.days_until_due)}d overdue`
                            : `${deadline.days_until_due}d`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grant health cards */}
      <div>
        <h3 className="text-lg font-black mb-4">Grant Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.grantHealth.map((grant) => {
            const pct = getSpendPercentage(Number(grant.total_spent), Number(grant.approved_amount));
            const health = getHealthStatus(Number(grant.total_spent), Number(grant.approved_amount));
            return (
              <div
                key={grant.id}
                className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-black">{grant.grant_name}</p>
                    <p className="text-xs text-gray-500">{grant.funder_name}</p>
                  </div>
                  <span className={`text-xs font-bold ${health.color}`}>{health.label}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2 border border-black/10">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-orange-400' : 'bg-green-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span>{formatCurrency(Number(grant.total_spent))} spent</span>
                  <span>{pct}% of {formatCurrency(Number(grant.approved_amount))}</span>
                </div>

                {Number(grant.issues_count) > 0 && (
                  <div className="mt-2 text-xs text-red-600 font-bold">
                    {grant.issues_count} issue{Number(grant.issues_count) !== 1 ? 's' : ''} flagged
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`${color} border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-5`}>
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-black/60" />
        <div>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-black font-mono">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
