'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Clock, DollarSign } from 'lucide-react';

interface Row {
  id: string;
  funding_id: string;
  is_yj_relevant: boolean | null;
  yj_relevance_category: string | null;
  llm_proposed_yj: boolean | null;
  llm_proposed_category: string | null;
  llm_confidence: number | null;
  llm_evidence_snippet: string | null;
  llm_model: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  override_reason: string | null;
  funding: {
    id: string;
    recipient_name: string | null;
    recipient_abn: string | null;
    program_name: string | null;
    project_description: string | null;
    amount_dollars: number | null;
    state: string | null;
    funding_type: string | null;
    sector: string | null;
    source: string | null;
    source_url: string | null;
    financial_year: string | null;
  } | null;
}

const CATEGORIES = [
  'direct_yj_service', 'yj_research_or_review', 'yj_advisory_consultancy',
  'yj_infrastructure_or_capital', 'broader_justice_includes_yj', 'not_yj_related',
];

const dollar = (n: number | null) => n == null ? '—' : `$${Math.round(Number(n)).toLocaleString()}`;

export default function FundingCurationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, confirmed: 0, yj_proposed: 0, yj_confirmed: 0, pending_yj_proposed: 0 });
  const [loading, setLoading] = useState(true);
  const [confirmation, setConfirmation] = useState<'pending' | 'confirmed' | 'all'>('pending');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [yjOnly, setYjOnly] = useState(false);
  const [state, setState] = useState<'QLD' | 'NT' | ''>('QLD');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (confirmation) qs.set('confirmation', confirmation);
    if (categoryFilter) qs.set('category', categoryFilter);
    if (state) qs.set('state', state);
    if (yjOnly) qs.set('yj_only', '1');
    const res = await fetch(`/api/admin/civic/funding-curation?${qs}`);
    const data = await res.json();
    setRows(data.rows || []);
    setCounts(data.counts || { total: 0, pending: 0, confirmed: 0, yj_proposed: 0, yj_confirmed: 0, pending_yj_proposed: 0 });
    setLoading(false);
  }, [confirmation, categoryFilter, state, yjOnly]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  async function confirmRow(row: Row, yj: boolean, cat: string | null, overrideReason?: string) {
    setActionBusy(row.id);
    try {
      const res = await fetch('/api/admin/civic/funding-curation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, is_yj_relevant: yj, yj_relevance_category: cat, override_reason: overrideReason || null }),
      });
      if (!res.ok) { const e = await res.json(); alert(`Failed: ${e.error}`); return; }
      await fetchRows();
    } finally {
      setActionBusy(null);
    }
  }

  async function bulkAccept(minConf: number) {
    if (!confirm(`Bulk-accept all pending classifications with confidence >= ${minConf}?`)) return;
    setBulkBusy(true);
    try {
      const res = await fetch('/api/admin/civic/funding-curation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_accept_high_confidence', min_confidence: minConf }),
      });
      const data = await res.json();
      alert(`Accepted ${data.accepted} of ${data.considered} classifications`);
      await fetchRows();
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-stone-500 mb-1 font-mono">Civic Intelligence v1</p>
          <h1 className="text-3xl font-bold text-stone-900">Funding YJ-relevance curation</h1>
          <p className="mt-2 text-stone-700">
            Sweep agent-proposed YJ-relevance + category classifications for justice_funding rows. Confirmed YJ-relevant consultancy spend feeds the headline access ratio on <code>/intelligence/civic</code>.
          </p>
        </header>

        <div className="grid grid-cols-6 gap-3 mb-6">
          <Stat label="Total" value={counts.total} />
          <Stat label="Pending" value={counts.pending} icon={<Clock className="w-4 h-4 text-amber-600" />} />
          <Stat label="Confirmed" value={counts.confirmed} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
          <Stat label="LLM says YJ" value={counts.yj_proposed} icon={<DollarSign className="w-4 h-4 text-rose-600" />} />
          <Stat label="Confirmed YJ" value={counts.yj_confirmed} icon={<DollarSign className="w-4 h-4 text-emerald-700" />} />
          <Stat label="Pending YJ" value={counts.pending_yj_proposed} icon={<DollarSign className="w-4 h-4 text-amber-700" />} />
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-white border border-stone-200 rounded-lg">
          <Field label="State">
            <select value={state} onChange={(e) => setState(e.target.value as any)} className="px-3 py-2 border border-stone-300 rounded text-sm">
              <option value="QLD">QLD</option>
              <option value="NT">NT</option>
              <option value="">All</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={confirmation} onChange={(e) => setConfirmation(e.target.value as any)} className="px-3 py-2 border border-stone-300 rounded text-sm">
              <option value="pending">Pending sweep</option>
              <option value="confirmed">Confirmed</option>
              <option value="all">All</option>
            </select>
          </Field>
          <Field label="Proposed category">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-stone-300 rounded text-sm">
              <option value="">All</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={yjOnly} onChange={(e) => setYjOnly(e.target.checked)} />
              LLM-flagged YJ only
            </label>
          </Field>
          <div className="ml-auto flex gap-2">
            <button onClick={() => bulkAccept(0.95)} disabled={bulkBusy} className="px-4 py-2 bg-stone-900 text-white text-sm rounded hover:bg-stone-700 disabled:opacity-50">Bulk-accept ≥ 0.95</button>
            <button onClick={() => bulkAccept(0.9)} disabled={bulkBusy} className="px-4 py-2 bg-stone-700 text-white text-sm rounded hover:bg-stone-600 disabled:opacity-50">Bulk-accept ≥ 0.90</button>
          </div>
        </div>

        {loading ? (
          <p className="text-stone-600">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-stone-600 italic">No rows match these filters.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => <RowCard key={row.id} row={row} busy={actionBusy === row.id} onConfirm={confirmRow} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="p-4 bg-white border border-stone-200 rounded-lg">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-stone-500 font-mono">
        <span>{label}</span>{icon}
      </div>
      <div className="mt-1 text-3xl font-bold text-stone-900">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-stone-500 font-mono">
      {label}{children}
    </label>
  );
}

function RowCard({ row, busy, onConfirm }: { row: Row; busy: boolean; onConfirm: (row: Row, yj: boolean, cat: string | null, reason?: string) => void }) {
  const [yj, setYj] = useState<boolean>(row.is_yj_relevant ?? row.llm_proposed_yj ?? false);
  const [cat, setCat] = useState<string | null>(row.yj_relevance_category ?? row.llm_proposed_category);
  const [reason, setReason] = useState(row.override_reason || '');

  const overridden = yj !== row.llm_proposed_yj || cat !== row.llm_proposed_category;
  const conf = row.llm_confidence ?? 0;
  const f = row.funding;

  return (
    <div className={`p-4 bg-white border rounded-lg ${row.confirmed_at ? 'border-emerald-200' : 'border-stone-200'}`}>
      <div className="flex items-start gap-4">
        <DollarSign className="w-5 h-5 text-stone-400 mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-base font-semibold text-stone-900 truncate">{f?.recipient_name || '—'}</h3>
            <span className="px-2 py-0.5 text-sm font-mono bg-stone-100 text-stone-900 rounded">{dollar(f?.amount_dollars ?? null)}</span>
            {f?.state && <span className="px-2 py-0.5 text-xs font-mono bg-stone-100 text-stone-700 rounded">{f.state}</span>}
            {f?.financial_year && <span className="text-xs font-mono text-stone-500">{f.financial_year}</span>}
            {row.confirmed_at && <span className="px-2 py-0.5 text-xs font-mono bg-emerald-100 text-emerald-900 rounded">Confirmed</span>}
          </div>

          <div className="mt-1 text-sm text-stone-700">
            {f?.program_name && <p><strong>Program:</strong> {f.program_name}</p>}
            {f?.project_description && <p className="text-xs text-stone-600 line-clamp-3">{f.project_description}</p>}
            <p className="font-mono text-xs text-stone-500 mt-1">
              ABN {f?.recipient_abn || '—'} · proposed YJ={row.llm_proposed_yj === true ? 'YES' : 'no'} ({row.llm_proposed_category}) · conf {conf.toFixed(2)}
            </p>
            {row.llm_evidence_snippet && <p className="text-stone-600 italic text-xs mt-1">"{row.llm_evidence_snippet}"</p>}
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Field label="YJ-relevant?">
              <div className="flex gap-1">
                <button onClick={() => setYj(true)} className={`px-3 py-1.5 text-sm border rounded ${yj ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-white text-stone-700 border-stone-300'}`}>Yes</button>
                <button onClick={() => setYj(false)} className={`px-3 py-1.5 text-sm border rounded ${!yj ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-white text-stone-700 border-stone-300'}`}>No</button>
              </div>
            </Field>
            <Field label="Category">
              <select value={cat || ''} onChange={(e) => setCat(e.target.value || null)} className="px-3 py-1.5 border border-stone-300 rounded text-sm min-w-[220px]">
                <option value="">—</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            {overridden && (
              <Field label="Override reason">
                <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why override?" className="px-3 py-1.5 border border-stone-300 rounded text-sm min-w-[280px]" />
              </Field>
            )}
            <button
              onClick={() => onConfirm(row, yj, cat, overridden ? reason : undefined)}
              disabled={busy || !cat}
              className="px-4 py-1.5 bg-stone-900 text-white text-sm rounded hover:bg-stone-700 disabled:opacity-50"
            >
              {busy ? 'Saving...' : row.confirmed_at ? 'Re-confirm' : 'Confirm'}
            </button>
            {f?.source_url && <a href={f.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-stone-500 underline hover:text-stone-900">source ↗</a>}
          </div>
        </div>
      </div>
    </div>
  );
}
