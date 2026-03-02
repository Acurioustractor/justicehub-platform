'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, X, Clock, AlertTriangle } from 'lucide-react';

interface ActionItem {
  id: string;
  org_id: string;
  item_type: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  source_agent: string | null;
  snoozed_until: string | null;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  compliance: 'bg-blue-100 text-blue-800',
  grant: 'bg-green-100 text-green-800',
  reporting: 'bg-purple-100 text-purple-800',
  session: 'bg-cyan-100 text-cyan-800',
  referral: 'bg-pink-100 text-pink-800',
  general: 'bg-gray-100 text-gray-800',
  inquiry: 'bg-orange-100 text-orange-800',
};

const PRIORITY_DOTS: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-gray-400',
};

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'grant', label: 'Grant' },
  { value: 'reporting', label: 'Reporting' },
  { value: 'session', label: 'Session' },
  { value: 'referral', label: 'Referral' },
  { value: 'general', label: 'General' },
  { value: 'inquiry', label: 'Inquiry' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active (Open + In Progress)' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'snoozed', label: 'Snoozed' },
];

function sortItems(items: ActionItem[]): ActionItem[] {
  return [...items].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 4;
    const pb = PRIORITY_ORDER[b.priority] ?? 4;
    if (pa !== pb) return pa - pb;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });
}

export function InboxTab({ orgId }: { orgId: string }) {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org-hub/${orgId}?section=action_items`);
      if (!res.ok) throw new Error('Failed to fetch action items');
      const data = await res.json();
      setItems(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function updateItemStatus(id: string, status: string, extra?: Record<string, unknown>) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/org-hub/${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'action_items',
          action: 'update',
          id,
          data: { status, ...extra },
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status, ...extra } as ActionItem : item
        )
      );
    } catch {
      // Silently handle — could add toast later
    } finally {
      setUpdatingId(null);
    }
  }

  function handleDone(id: string) {
    updateItemStatus(id, 'done');
  }

  function handleDismiss(id: string) {
    updateItemStatus(id, 'dismissed');
  }

  function handleSnooze(id: string) {
    const snoozedUntil = new Date();
    snoozedUntil.setDate(snoozedUntil.getDate() + 7);
    updateItemStatus(id, 'snoozed', { snoozed_until: snoozedUntil.toISOString() });
  }

  // Apply filters
  const filtered = items.filter((item) => {
    if (typeFilter !== 'all' && item.item_type !== typeFilter) return false;
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
    if (statusFilter === 'active') {
      return item.status === 'open' || item.status === 'in_progress';
    }
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });

  const sorted = sortItems(filtered);

  // Priority counts (from unfiltered active items)
  const activeItems = items.filter((i) => i.status === 'open' || i.status === 'in_progress');
  const priorityCounts = {
    urgent: activeItems.filter((i) => i.priority === 'urgent').length,
    high: activeItems.filter((i) => i.priority === 'high').length,
    medium: activeItems.filter((i) => i.priority === 'medium').length,
    low: activeItems.filter((i) => i.priority === 'low').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={fetchItems} className="mt-3 px-4 py-2 font-bold bg-black text-white hover:bg-gray-800">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Priority count badges */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(priorityCounts).map(([priority, count]) => (
          <div
            key={priority}
            className="inline-flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <span className={`w-3 h-3 rounded-full ${PRIORITY_DOTS[priority]}`} />
            <span className="text-sm font-bold capitalize">{priority}</span>
            <span className="text-sm font-bold text-gray-500">{count}</span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border-2 border-black p-2 text-sm font-bold focus:ring-2 focus:ring-ochre-600 focus:outline-none"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border-2 border-black p-2 text-sm font-bold focus:ring-2 focus:ring-ochre-600 focus:outline-none"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-2 border-black p-2 text-sm font-bold focus:ring-2 focus:ring-ochre-600 focus:outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items list */}
      {sorted.length === 0 ? (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 text-center">
          <p className="text-gray-500 font-medium">No action items match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item) => (
            <div
              key={item.id}
              className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4"
            >
              <div className="flex items-start gap-3">
                {/* Priority dot */}
                <span
                  className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOTS[item.priority] || 'bg-gray-400'}`}
                />

                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm">{item.title}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs font-bold ${TYPE_COLORS[item.item_type] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {item.item_type}
                    </span>
                    {item.source_agent && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-ochre-100 text-ochre-800">
                        {item.source_agent}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {item.due_date && (
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Due {new Date(item.due_date).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    {item.status === 'snoozed' && item.snoozed_until && (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                        <Clock className="w-3 h-3" />
                        Snoozed until{' '}
                        {new Date(item.snoozed_until).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 shrink-0">
                  {(item.status === 'open' || item.status === 'in_progress') && (
                    <>
                      <button
                        onClick={() => handleDone(item.id)}
                        disabled={updatingId === item.id}
                        className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-1"
                        title="Mark done"
                      >
                        {updatingId === item.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Done
                      </button>
                      <button
                        onClick={() => handleDismiss(item.id)}
                        disabled={updatingId === item.id}
                        className="px-3 py-1.5 text-xs font-bold border-2 border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 inline-flex items-center gap-1"
                        title="Dismiss"
                      >
                        <X className="w-3 h-3" />
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleSnooze(item.id)}
                        disabled={updatingId === item.id}
                        className="px-3 py-1.5 text-xs font-bold border-2 border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50 inline-flex items-center gap-1"
                        title="Snooze 7 days"
                      >
                        <Clock className="w-3 h-3" />
                        Snooze 7d
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
