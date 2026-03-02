'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, ExternalLink, ShieldCheck, X } from 'lucide-react';

interface ComplianceDoc {
  id: string;
  category: string;
  title: string;
  holder_name: string | null;
  reference_number: string | null;
  status: string;
  expiry_date: string | null;
  issued_date: string | null;
  document_url: string | null;
  reminder_days: number | null;
  notes: string | null;
}

interface ComplianceCheckResult {
  summary: string;
  issues: string[];
  score: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  blue_cards: 'Blue Cards',
  oric: 'ORIC',
  insurance: 'Insurance',
  child_safety: 'Child Safety',
  abn: 'ABN',
  other: 'Other',
};

const STATUS_COLORS: Record<string, string> = {
  current: 'bg-green-100 text-green-800',
  expiring: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-800',
  not_started: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
};

const STATUS_OPTIONS = [
  { value: 'current', label: 'Current' },
  { value: 'expiring', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
];

const EMPTY_FORM = {
  category: 'blue_cards',
  title: '',
  holder_name: '',
  reference_number: '',
  expiry_date: '',
  issued_date: '',
  reminder_days: '30',
  document_url: '',
  notes: '',
  status: 'not_started',
};

export function ComplianceTab({ orgId }: { orgId: string }) {
  const [docs, setDocs] = useState<ComplianceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [checkResult, setCheckResult] = useState<ComplianceCheckResult | null>(null);
  const [checking, setChecking] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/org-hub/${orgId}?section=compliance`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data.items || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/org-hub/${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'compliance',
          action: 'create',
          data: {
            ...form,
            reminder_days: form.reminder_days ? parseInt(form.reminder_days, 10) : null,
            expiry_date: form.expiry_date || null,
            issued_date: form.issued_date || null,
            document_url: form.document_url || null,
            holder_name: form.holder_name || null,
            reference_number: form.reference_number || null,
            notes: form.notes || null,
          },
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm(EMPTY_FORM);
        fetchDocs();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const runComplianceCheck = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch(`/api/org-hub/${orgId}/compliance-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setCheckResult(data);
      }
    } catch {
      // silently fail
    } finally {
      setChecking(false);
    }
  };

  const grouped = docs.reduce<Record<string, ComplianceDoc[]>>((acc, doc) => {
    const cat = doc.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Compliance Documents</h2>
        <div className="flex gap-3">
          <button
            onClick={runComplianceCheck}
            disabled={checking}
            className="px-4 py-2 font-bold bg-earth-700 text-white hover:bg-earth-800 disabled:opacity-50 flex items-center gap-2"
          >
            {checking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Run Compliance Check
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Document
          </button>
        </div>
      </div>

      {/* Compliance check result */}
      {checkResult && (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">Compliance Check Result</h3>
            <span className="px-3 py-1 text-sm font-bold bg-earth-100 text-earth-800">
              Score: {checkResult.score}%
            </span>
          </div>
          <p className="text-gray-700 mb-3">{checkResult.summary}</p>
          {checkResult.issues.length > 0 && (
            <ul className="space-y-1">
              {checkResult.issues.map((issue, i) => (
                <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">*</span>
                  {issue}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Grouped documents */}
      {Object.keys(CATEGORY_LABELS).map((catKey) => {
        const catDocs = grouped[catKey];
        if (!catDocs || catDocs.length === 0) return null;
        return (
          <div key={catKey}>
            <h3 className="text-lg font-bold mb-3">{CATEGORY_LABELS[catKey]}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-sm">{doc.title}</h4>
                    <span
                      className={`px-2 py-1 text-xs font-bold ${STATUS_COLORS[doc.status] || STATUS_COLORS.not_started}`}
                    >
                      {doc.status.replace('_', ' ')}
                    </span>
                  </div>
                  {doc.holder_name && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Holder:</span> {doc.holder_name}
                    </p>
                  )}
                  {doc.reference_number && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Ref:</span> {doc.reference_number}
                    </p>
                  )}
                  {doc.expiry_date && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Expires:</span>{' '}
                      {new Date(doc.expiry_date).toLocaleDateString()}
                    </p>
                  )}
                  {doc.document_url && (
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-ochre-600 hover:text-ochre-800 font-medium mt-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Document
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {docs.length === 0 && (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No compliance documents yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first document to get started</p>
        </div>
      )}

      {/* Add Document Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b-2 border-black">
              <h3 className="text-lg font-black">Add Document</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  placeholder="e.g. Working with Children Check"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Holder Name</label>
                <input
                  type="text"
                  value={form.holder_name}
                  onChange={(e) => setForm({ ...form, holder_name: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Reference Number</label>
                <input
                  type="text"
                  value={form.reference_number}
                  onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Issued Date</label>
                  <input
                    type="date"
                    value={form.issued_date}
                    onChange={(e) => setForm({ ...form, issued_date: e.target.value })}
                    className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                    className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Reminder Days Before Expiry</label>
                <input
                  type="number"
                  value={form.reminder_days}
                  onChange={(e) => setForm({ ...form, reminder_days: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Document URL</label>
                <input
                  type="url"
                  value={form.document_url}
                  onChange={(e) => setForm({ ...form, document_url: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t-2 border-black">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 font-bold border-2 border-black hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title}
                className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
