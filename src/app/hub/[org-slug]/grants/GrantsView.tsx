'use client';

import { useState } from 'react';
import { DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import type { BGFitGrantHealth } from '@/lib/bgfit/types';
import { formatCurrency, getSpendPercentage, getHealthStatus } from '@/lib/bgfit/utils';
import { GrantDetail } from './GrantDetail';

interface GrantsViewProps {
  grants: BGFitGrantHealth[];
}

export function GrantsView({ grants }: GrantsViewProps) {
  const [expandedGrant, setExpandedGrant] = useState<string | null>(null);

  const totalBudget = grants.reduce((s, g) => s + Number(g.approved_amount), 0);
  const totalSpent = grants.reduce((s, g) => s + Number(g.total_spent), 0);
  const totalRemaining = grants.reduce((s, g) => s + Number(g.remaining_budget), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Grants</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {grants.length} grant{grants.length !== 1 ? 's' : ''} totalling {formatCurrency(totalBudget)}
          </p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Total Budget</p>
            <p className="text-xl font-black font-mono">{formatCurrency(totalBudget)}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Spent</p>
            <p className="text-xl font-black font-mono text-orange-600">{formatCurrency(totalSpent)}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Remaining</p>
            <p className="text-xl font-black font-mono text-green-600">{formatCurrency(totalRemaining)}</p>
          </div>
        </div>
      </div>

      {/* Grant cards */}
      <div className="space-y-4">
        {grants.map((grant) => {
          const pct = getSpendPercentage(Number(grant.total_spent), Number(grant.approved_amount));
          const health = getHealthStatus(Number(grant.total_spent), Number(grant.approved_amount));
          const isExpanded = expandedGrant === grant.id;

          return (
            <div key={grant.id} className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg overflow-hidden">
              {/* Card header — clickable */}
              <button
                onClick={() => setExpandedGrant(isExpanded ? null : grant.id)}
                className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 bg-ochre-100 rounded-lg border border-ochre-200 shrink-0">
                      <DollarSign className="h-5 w-5 text-ochre-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black truncate">{grant.grant_name}</p>
                      <p className="text-xs text-gray-500">{grant.funder_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-bold ${health.color}`}>{health.label}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="mt-4 grid grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-gray-500 block">Awarded</span>
                    <span className="font-bold">{formatCurrency(Number(grant.approved_amount))}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Spent</span>
                    <span className="font-bold">{formatCurrency(Number(grant.total_spent))}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Remaining</span>
                    <span className="font-bold text-green-600">{formatCurrency(Number(grant.remaining_budget))}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Issues</span>
                    <span className={`font-bold ${Number(grant.issues_count) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {grant.issues_count}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5 border border-black/10">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-orange-400' : 'bg-green-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{pct}% spent</p>
              </button>

              {/* Expanded budget detail */}
              {isExpanded && (
                <div className="border-t-2 border-black">
                  <GrantDetail grantId={grant.id} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
