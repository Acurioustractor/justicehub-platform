'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowRightLeft,
  Plus,
  X,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface Referral {
  id: string;
  organization_id: string;
  direction: 'inbound' | 'outbound';
  referral_type: 'formal' | 'informal' | 'warm_handover';
  source_org_name: string;
  target_org_name: string;
  participant_ref: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  referral_date: string;
  outcome: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800',
};

const DIRECTION_COLORS: Record<string, string> = {
  inbound: 'bg-blue-100 text-blue-800',
  outbound: 'bg-purple-100 text-purple-800',
};

const REFERRAL_TYPE_LABELS: Record<string, string> = {
  formal: 'Formal',
  informal: 'Informal',
  warm_handover: 'Warm Handover',
};

interface ReferralForm {
  direction: string;
  referral_type: string;
  source_org_name: string;
  target_org_name: string;
  participant_ref: string;
  status: string;
  referral_date: string;
  notes: string;
}

const EMPTY_FORM: ReferralForm = {
  direction: 'inbound',
  referral_type: 'formal',
  source_org_name: '',
  target_org_name: '',
  participant_ref: '',
  status: 'pending',
  referral_date: new Date().toISOString().split('T')[0],
  notes: '',
};

export function ReferralsTab({ orgId }: { orgId: string }) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org-hub/${orgId}?section=referrals`);
      if (!res.ok) throw new Error('Failed to load referrals');
      const json = await res.json();
      setReferrals(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/org-hub/${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'referrals',
          action: 'create',
          data: form,
        }),
      });
      if (!res.ok) throw new Error('Failed to create referral');
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchReferrals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const filtered = referrals.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (typeFilter !== 'all' && r.referral_type !== typeFilter) return false;
    return true;
  });

  const inbound = filtered.filter((r) => r.direction === 'inbound');
  const outbound = filtered.filter((r) => r.direction === 'outbound');

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
          onClick={fetchReferrals}
          className="mt-3 px-4 py-2 font-bold bg-black text-white hover:bg-gray-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5" />
          <h2 className="text-xl font-black">Referrals</h2>
          <span className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-700">
            {referrals.length} total
          </span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Referral
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-wrap items-center gap-4">
        <Filter className="w-4 h-4 text-gray-500" />
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-gray-600">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-2 border-black p-2 text-sm font-bold focus:ring-2 focus:ring-ochre-600 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-gray-600">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border-2 border-black p-2 text-sm font-bold focus:ring-2 focus:ring-ochre-600 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="formal">Formal</option>
            <option value="informal">Informal</option>
            <option value="warm_handover">Warm Handover</option>
          </select>
        </div>
      </div>

      {/* Two columns: Inbound / Outbound */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inbound */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownLeft className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-black">Inbound</h3>
            <span className="px-2 py-1 text-xs font-bold bg-blue-100 text-blue-800">
              {inbound.length}
            </span>
          </div>
          {inbound.length === 0 ? (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
              <p className="text-gray-500 text-sm font-medium">No inbound referrals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inbound.map((r) => (
                <ReferralCard key={r.id} referral={r} />
              ))}
            </div>
          )}
        </div>

        {/* Outbound */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-black">Outbound</h3>
            <span className="px-2 py-1 text-xs font-bold bg-purple-100 text-purple-800">
              {outbound.length}
            </span>
          </div>
          {outbound.length === 0 ? (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
              <p className="text-gray-500 text-sm font-medium">No outbound referrals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {outbound.map((r) => (
                <ReferralCard key={r.id} referral={r} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Referral Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b-2 border-black">
              <h3 className="text-lg font-black">Add Referral</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Direction */}
              <div>
                <label className="block text-sm font-bold mb-1">Direction</label>
                <select
                  value={form.direction}
                  onChange={(e) => setForm({ ...form, direction: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                >
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </div>

              {/* Referral Type */}
              <div>
                <label className="block text-sm font-bold mb-1">Referral Type</label>
                <select
                  value={form.referral_type}
                  onChange={(e) => setForm({ ...form, referral_type: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                >
                  <option value="formal">Formal</option>
                  <option value="informal">Informal</option>
                  <option value="warm_handover">Warm Handover</option>
                </select>
              </div>

              {/* Source Org */}
              <div>
                <label className="block text-sm font-bold mb-1">Source Organisation</label>
                <input
                  type="text"
                  value={form.source_org_name}
                  onChange={(e) => setForm({ ...form, source_org_name: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  placeholder="Referring organisation name"
                />
              </div>

              {/* Target Org */}
              <div>
                <label className="block text-sm font-bold mb-1">Target Organisation</label>
                <input
                  type="text"
                  value={form.target_org_name}
                  onChange={(e) => setForm({ ...form, target_org_name: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  placeholder="Receiving organisation name"
                />
              </div>

              {/* Participant Ref */}
              <div>
                <label className="block text-sm font-bold mb-1">Participant Reference</label>
                <input
                  type="text"
                  value={form.participant_ref}
                  onChange={(e) => setForm({ ...form, participant_ref: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  placeholder="e.g. REF-001 or initials"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-bold mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="declined">Declined</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Referral Date */}
              <div>
                <label className="block text-sm font-bold mb-1">Referral Date</label>
                <input
                  type="date"
                  value={form.referral_date}
                  onChange={(e) => setForm({ ...form, referral_date: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none resize-none"
                  placeholder="Additional context..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t-2 border-black">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 font-bold border-2 border-black hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.participant_ref}
                className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Referral
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReferralCard({ referral }: { referral: Referral }) {
  const orgName =
    referral.direction === 'inbound'
      ? referral.source_org_name
      : referral.target_org_name;

  return (
    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-1 text-xs font-bold ${DIRECTION_COLORS[referral.direction]}`}>
            {referral.direction === 'inbound' ? 'Inbound' : 'Outbound'}
          </span>
          <span className={`px-2 py-1 text-xs font-bold ${STATUS_COLORS[referral.status]}`}>
            {referral.status}
          </span>
        </div>
        <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
          {REFERRAL_TYPE_LABELS[referral.referral_type] || referral.referral_type}
        </span>
      </div>

      <p className="text-sm font-black mb-1">{orgName || 'Unknown organisation'}</p>
      <p className="text-xs font-bold text-gray-500 mb-2">Ref: {referral.participant_ref}</p>

      <div className="text-xs text-gray-600 font-medium">
        {new Date(referral.referral_date).toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </div>

      {referral.outcome && (
        <p className="text-sm text-gray-700 mt-2 pt-2 border-t border-gray-200">
          {referral.outcome}
        </p>
      )}
    </div>
  );
}
