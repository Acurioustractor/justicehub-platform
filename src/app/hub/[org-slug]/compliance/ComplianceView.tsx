'use client';

import { useState } from 'react';
import { ShieldCheck, FileText, CalendarClock, CheckCircle2 } from 'lucide-react';
import type { BGFitDeadline } from '@/lib/bgfit/types';
import { formatDate, getUrgencyColor } from '@/lib/bgfit/utils';

type Filter = 'all' | 'overdue' | 'urgent' | 'soon';

interface ComplianceViewProps {
  deadlines: BGFitDeadline[];
}

const FILTERS: { key: Filter; label: string; color: string }[] = [
  { key: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800 border-red-300' },
  { key: 'urgent', label: 'This Week', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { key: 'soon', label: 'This Month', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

function getDeadlineIcon(type: string) {
  switch (type) {
    case 'acquittal':
    case 'final_report':
      return FileText;
    case 'progress_report':
      return CalendarClock;
    case 'bas':
    case 'oric_annual':
      return ShieldCheck;
    default:
      return FileText;
  }
}

export function ComplianceView({ deadlines }: ComplianceViewProps) {
  const [filter, setFilter] = useState<Filter>('all');

  const activeDl = deadlines.filter((d) => d.urgency !== 'done');
  const completedDl = deadlines.filter((d) => d.urgency === 'done');

  const counts = {
    overdue: activeDl.filter((d) => d.urgency === 'overdue').length,
    urgent: activeDl.filter((d) => d.urgency === 'urgent').length,
    soon: activeDl.filter((d) => d.urgency === 'soon').length,
    all: activeDl.length,
  };

  const filtered = filter === 'all' ? activeDl : activeDl.filter((d) => d.urgency === filter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black">Compliance</h2>
        <p className="text-sm text-gray-500 font-medium mt-1">
          {activeDl.length} active deadline{activeDl.length !== 1 ? 's' : ''}, {completedDl.length} completed
        </p>
      </div>

      {/* Filter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              filter === f.key
                ? 'border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ' + f.color
                : 'border-gray-200 bg-white hover:border-gray-400'
            }`}
          >
            <p className="text-2xl font-black font-mono">{counts[f.key]}</p>
            <p className="text-xs font-bold mt-1">{f.label}</p>
          </button>
        ))}
      </div>

      {/* Deadline list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-8 text-center text-gray-500">
            No deadlines in this category.
          </div>
        ) : (
          filtered.map((deadline) => {
            const Icon = getDeadlineIcon(deadline.deadline_type);
            const colors = getUrgencyColor(deadline.urgency);

            return (
              <div
                key={deadline.id}
                className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg border ${colors.border} ${colors.bg} shrink-0`}>
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black truncate">{deadline.title}</p>
                    </div>
                    {deadline.grant_name && (
                      <p className="text-xs text-gray-500 truncate">{deadline.grant_name}</p>
                    )}
                    {deadline.requirements && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{deadline.requirements}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{formatDate(deadline.due_date)}</p>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold mt-1 px-2 py-0.5 rounded-full border ${colors.border} ${colors.bg} ${colors.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      {deadline.days_until_due < 0
                        ? `${Math.abs(deadline.days_until_due)}d overdue`
                        : deadline.days_until_due === 0
                          ? 'Today'
                          : `${deadline.days_until_due}d`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Completed section */}
      {completedDl.length > 0 && (
        <div>
          <h3 className="text-lg font-black mb-3 text-gray-400">Completed</h3>
          <div className="space-y-2">
            {completedDl.map((deadline) => (
              <div
                key={deadline.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3"
              >
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 line-through truncate">{deadline.title}</p>
                  {deadline.grant_name && (
                    <p className="text-xs text-gray-400 truncate">{deadline.grant_name}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400">{formatDate(deadline.submitted_date)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
