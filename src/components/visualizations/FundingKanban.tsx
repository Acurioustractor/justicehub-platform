'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Clock,
  Calendar,
  Building2,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export interface FundingOpportunity {
  id: string;
  name: string;
  funder_name: string;
  source_type: 'government' | 'philanthropy' | 'corporate' | 'community';
  max_grant_amount?: number;
  deadline?: string;
  status: string;
  jurisdictions?: string[];
  relevance_score?: number;
  days_until_deadline?: number;
  application_url?: string;
}

interface FundingKanbanProps {
  opportunities: FundingOpportunity[];
  onOpportunityClick?: (opportunity: FundingOpportunity) => void;
  maxPerColumn?: number;
}

const COLUMN_CONFIG = [
  {
    id: 'closing_soon',
    title: 'Closing Soon',
    subtitle: '< 14 days',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-600',
    badgeColor: 'bg-red-600',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
  },
  {
    id: 'open',
    title: 'Open',
    subtitle: 'Active opportunities',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-600',
    badgeColor: 'bg-green-600',
    icon: DollarSign,
    iconColor: 'text-green-600',
  },
  {
    id: 'upcoming',
    title: 'Upcoming',
    subtitle: 'Opening soon',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-600',
    badgeColor: 'bg-blue-600',
    icon: Calendar,
    iconColor: 'text-blue-600',
  },
  {
    id: 'closed',
    title: 'Recently Closed',
    subtitle: 'For reference',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-400',
    badgeColor: 'bg-gray-500',
    icon: Clock,
    iconColor: 'text-gray-500',
  },
];

const SOURCE_TYPE_BADGES: Record<string, { bg: string; text: string }> = {
  government: { bg: 'bg-blue-100', text: 'text-blue-700' },
  philanthropy: { bg: 'bg-purple-100', text: 'text-purple-700' },
  corporate: { bg: 'bg-green-100', text: 'text-green-700' },
  community: { bg: 'bg-orange-100', text: 'text-orange-700' },
};

export function FundingKanban({
  opportunities,
  onOpportunityClick,
  maxPerColumn = 5,
}: FundingKanbanProps) {
  // Group opportunities by status
  const columnData = useMemo(() => {
    const grouped: Record<string, FundingOpportunity[]> = {
      closing_soon: [],
      open: [],
      upcoming: [],
      closed: [],
    };

    for (const opp of opportunities) {
      if (opp.status === 'closing_soon') {
        grouped.closing_soon.push(opp);
      } else if (opp.status === 'open') {
        grouped.open.push(opp);
      } else if (opp.status === 'upcoming') {
        grouped.upcoming.push(opp);
      } else if (opp.status === 'closed') {
        grouped.closed.push(opp);
      }
    }

    // Sort each column
    grouped.closing_soon.sort(
      (a, b) => (a.days_until_deadline || 99) - (b.days_until_deadline || 99)
    );
    grouped.open.sort(
      (a, b) => (b.relevance_score || 0) - (a.relevance_score || 0)
    );

    return grouped;
  }, [opportunities]);

  // Calculate totals
  const totalActive =
    columnData.closing_soon.length + columnData.open.length;
  const totalAvailable = opportunities
    .filter((o) => ['open', 'closing_soon'].includes(o.status))
    .reduce((sum, o) => sum + (o.max_grant_amount || 0), 0);

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'TBA';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const formatDeadline = (deadline?: string, daysLeft?: number) => {
    if (!deadline) return 'Ongoing';
    if (daysLeft !== undefined && daysLeft !== null) {
      if (daysLeft < 0) return 'Closed';
      if (daysLeft === 0) return 'Today!';
      if (daysLeft <= 7) return `${daysLeft}d left`;
      return `${daysLeft} days`;
    }
    return new Date(deadline).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-sm text-gray-600">Active Opportunities</div>
            <div className="text-3xl font-black text-black">{totalActive}</div>
          </div>
          <div className="h-12 w-px bg-gray-200" />
          <div>
            <div className="text-sm text-gray-600">Total Available</div>
            <div className="text-3xl font-black text-green-600">
              {formatCurrency(totalAvailable)}
            </div>
          </div>
        </div>

        <Link
          href="/admin/funding"
          className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
        >
          Full Pipeline
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMN_CONFIG.map((column) => {
          const items = columnData[column.id] || [];
          const Icon = column.icon;

          return (
            <div
              key={column.id}
              className={`border-2 ${column.borderColor} rounded-none`}
            >
              {/* Column Header */}
              <div
                className={`${column.bgColor} border-b-2 ${column.borderColor} p-3`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${column.iconColor}`} />
                    <span className="font-bold text-sm">{column.title}</span>
                  </div>
                  <span
                    className={`${column.badgeColor} text-white text-xs font-bold px-2 py-0.5`}
                  >
                    {items.length}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {column.subtitle}
                </div>
              </div>

              {/* Column Items */}
              <div className="p-3 space-y-3 bg-white min-h-[200px]">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No opportunities
                  </div>
                ) : (
                  <>
                    {items.slice(0, maxPerColumn).map((opp) => {
                      const sourceStyle =
                        SOURCE_TYPE_BADGES[opp.source_type] ||
                        SOURCE_TYPE_BADGES.community;

                      return (
                        <div
                          key={opp.id}
                          className="p-3 bg-gray-50 border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer"
                          onClick={() => onOpportunityClick?.(opp)}
                        >
                          {/* Title & Type */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-sm text-gray-800 line-clamp-2 flex-1">
                              {opp.name}
                            </h4>
                            {opp.relevance_score && opp.relevance_score >= 70 && (
                              <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            )}
                          </div>

                          {/* Funder */}
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                            <Building2 className="w-3 h-3" />
                            <span className="line-clamp-1">{opp.funder_name}</span>
                          </div>

                          {/* Source Type Badge */}
                          <div className="mt-2">
                            <span
                              className={`text-xs font-medium px-1.5 py-0.5 ${sourceStyle.bg} ${sourceStyle.text}`}
                            >
                              {opp.source_type}
                            </span>
                          </div>

                          {/* Amount & Deadline */}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
                            <span className="text-sm font-bold text-green-600">
                              {formatCurrency(opp.max_grant_amount)}
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                opp.days_until_deadline !== undefined &&
                                opp.days_until_deadline <= 7
                                  ? 'text-red-600'
                                  : 'text-gray-500'
                              }`}
                            >
                              {formatDeadline(opp.deadline, opp.days_until_deadline)}
                            </span>
                          </div>

                          {/* Jurisdictions */}
                          {opp.jurisdictions && opp.jurisdictions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {opp.jurisdictions.slice(0, 3).map((j) => (
                                <span
                                  key={j}
                                  className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs"
                                >
                                  {j}
                                </span>
                              ))}
                              {opp.jurisdictions.length > 3 && (
                                <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 text-xs">
                                  +{opp.jurisdictions.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Show More Link */}
                    {items.length > maxPerColumn && (
                      <Link
                        href={`/admin/funding?status=${column.id}`}
                        className="block text-center text-sm font-bold text-blue-600 hover:underline py-2"
                      >
                        +{items.length - maxPerColumn} more →
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-200">
        {[
          { label: 'Government', type: 'government' },
          { label: 'Philanthropy', type: 'philanthropy' },
          { label: 'Corporate', type: 'corporate' },
          { label: 'Community', type: 'community' },
        ].map(({ label, type }) => {
          const count = opportunities.filter(
            (o) =>
              o.source_type === type &&
              ['open', 'closing_soon'].includes(o.status)
          ).length;
          const style = SOURCE_TYPE_BADGES[type];

          return (
            <div key={type} className="text-center">
              <div className="text-2xl font-black text-gray-800">{count}</div>
              <div
                className={`text-xs font-medium ${style.text} ${style.bg} inline-block px-2 py-0.5 mt-1`}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FundingKanban;
