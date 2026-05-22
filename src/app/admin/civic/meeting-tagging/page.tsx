'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react';

interface Row {
  id: string;
  diary_id: string;
  sector_category: string | null;
  is_yj_relevant: boolean;
  llm_proposed_sector: string | null;
  llm_confidence: number | null;
  llm_evidence_snippet: string | null;
  llm_model: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  override_reason: string | null;
  diary: {
    id: string;
    minister_name: string | null;
    portfolio: string | null;
    meeting_date: string | null;
    who_met: string | null;
    organisation: string | null;
    purpose: string | null;
    jurisdiction: string | null;
    source_url: string | null;
  } | null;
}

const SECTORS = [
  'primary_frontline', 'peak_body', 'consultancy', 'government',
  'research_academic', 'legal_service', 'advocacy', 'funder', 'media', 'other',
];

const SECTOR_COLOR: Record<string, string> = {
  primary_frontline: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  peak_body: 'bg-blue-100 text-blue-900 border-blue-300',
  consultancy: 'bg-rose-100 text-rose-900 border-rose-300',
  government: 'bg-stone-100 text-stone-700 border-stone-300',
  research_academic: 'bg-violet-100 text-violet-900 border-violet-300',
  legal_service: 'bg-amber-100 text-amber-900 border-amber-300',
  advocacy: 'bg-cyan-100 text-cyan-900 border-cyan-300',
  funder: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  media: 'bg-pink-100 text-pink-900 border-pink-300',
  other: 'bg-stone-50 text-stone-600 border-stone-200',
};

export default function MeetingTaggingPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, confirmed: 0, consultancy_pending: 0, primary_frontline_pending: 0 });
  const [loading, setLoading] = useState(true);
  const [confirmation, setConfirmation] = useState<'pending' | 'confirmed' | 'all'>('pending');
  const [sectorFilter, setSectorFilter] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (confirmation) qs.set('confirmation', confirmation);
    if (sectorFilter) qs.set('sector', sectorFilter);
    const res = await fetch(`/api/admin/civic/meeting-tagging?${qs}`);
    const data = await res.json();
    setRows(data.rows || []);
    setCounts(data.counts || { total: 0, pending: 0, confirmed: 0, consultancy_pending: 0, primary_frontline_pending: 0 });
    setLoading(false);
  }, [confirmation, sectorFilter]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  async function confirmRow(row: Row, sector: string | null, isYj: boolean, overrideReason?: string) {
    setActionBusy(row.id);
    try {
      const res = await fetch('/api/admin/civic/meeting-tagging', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, sector_category: sector, is_yj_relevant: isYj, override_reason: overrideReason || null }),
      });
      if (!res.ok) {
        const e = await res.json();
        alert(`Failed: ${e.error}`);
        return;
      }
      await fetchRows();
    } finally {
      setActionBusy(null);
    }
  }

  async function bulkAccept(minConf: number) {
    if (!confirm(`Bulk-accept all pending meeting tags with confidence >= ${minConf}?`)) return;
    setBulkBusy(true);
    try {
      const res = await fetch('/api/admin/civic/meeting-tagging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_accept_high_confidence', min_confidence: minConf }),
      });
      const data = await res.json();
      alert(`Accepted ${data.accepted} of ${data.considered} meetings`);
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
          <h1 className="text-3xl font-bold text-stone-900">Meeting tagging</h1>
          <p className="mt-2 text-stone-700">
            Sweep agent-proposed sector tags on YJ-relevant ministerial diary entries. Confirmed rows feed the access ratio numerator / denominator.
          </p>
        </header>

        <div className="grid grid-cols-5 gap-3 mb-6">
          <Stat label="Total" value={counts.total} />
          <Stat label="Pending" value={counts.pending} icon={<Clock className="w-4 h-4 text-amber-600" />} />
          <Stat label="Confirmed" value={counts.confirmed} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
          <Stat label="Consultancy pending" value={counts.consultancy_pending} icon={<AlertCircle className="w-4 h-4 text-rose-600" />} />
          <Stat label="Frontline pending" value={counts.primary_frontline_pending} icon={<AlertCircle className="w-4 h-4 text-emerald-600" />} />
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-white border border-stone-200 rounded-lg">
          <Field label="Status">
            <select value={confirmation} onChange={(e) => setConfirmation(e.target.value as any)} className="px-3 py-2 border border-stone-300 rounded text-sm">
              <option value="pending">Pending sweep</option>
              <option value="confirmed">Confirmed</option>
              <option value="all">All</option>
            </select>
          </Field>
          <Field label="Proposed sector">
            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="px-3 py-2 border border-stone-300 rounded text-sm">
              <option value="">All</option>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div className="ml-auto flex gap-2">
            <button onClick={() => bulkAccept(0.95)} disabled={bulkBusy} className="px-4 py-2 bg-stone-900 text-white text-sm rounded hover:bg-stone-700 disabled:opacity-50">
              Bulk-accept ≥ 0.95
            </button>
            <button onClick={() => bulkAccept(0.85)} disabled={bulkBusy} className="px-4 py-2 bg-stone-700 text-white text-sm rounded hover:bg-stone-600 disabled:opacity-50">
              Bulk-accept ≥ 0.85
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-stone-600">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-stone-600 italic">No rows match these filters.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <RowCard key={row.id} row={row} busy={actionBusy === row.id} onConfirm={confirmRow} />
            ))}
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
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-1 text-3xl font-bold text-stone-900">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-stone-500 font-mono">
      {label}
      {children}
    </label>
  );
}

function RowCard({ row, busy, onConfirm }: { row: Row; busy: boolean; onConfirm: (row: Row, sector: string | null, isYj: boolean, reason?: string) => void }) {
  const [sector, setSector] = useState<string | null>(row.sector_category ?? row.llm_proposed_sector);
  const [isYj, setIsYj] = useState<boolean>(row.is_yj_relevant ?? true);
  const [reason, setReason] = useState(row.override_reason || '');

  const overridden = sector !== row.llm_proposed_sector;
  const conf = row.llm_confidence ?? 0;
  const d = row.diary;

  return (
    <div className={`p-4 bg-white border rounded-lg ${row.confirmed_at ? 'border-emerald-200' : 'border-stone-200'}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Calendar className="w-5 h-5 text-stone-400 mt-1" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-base font-semibold text-stone-900">{d?.minister_name || '—'}</h3>
            <span className="text-xs font-mono text-stone-500">{d?.meeting_date || '—'}</span>
            {d?.jurisdiction && <span className="px-2 py-0.5 text-xs font-mono bg-stone-100 text-stone-700 rounded">{d.jurisdiction}</span>}
            {row.confirmed_at && <span className="px-2 py-0.5 text-xs font-mono bg-emerald-100 text-emerald-900 rounded">Confirmed</span>}
          </div>

          <div className="mt-1 text-sm text-stone-700">
            <p className="font-medium">Met: <span className="font-normal">{d?.organisation || d?.who_met || '—'}</span></p>
            {d?.purpose && <p className="text-stone-600 text-xs italic">Purpose: {d.purpose}</p>}
            <p className="font-mono text-xs text-stone-500 mt-1">
              Portfolio: {d?.portfolio || '—'} · proposed {row.llm_proposed_sector || '?'} · conf {conf.toFixed(2)}
            </p>
            {row.llm_evidence_snippet && (
              <p className="text-stone-600 italic text-xs mt-1">"{row.llm_evidence_snippet}"</p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Field label="Sector">
              <select value={sector || ''} onChange={(e) => setSector(e.target.value || null)} className="px-3 py-1.5 border border-stone-300 rounded text-sm min-w-[180px]">
                <option value="">—</option>
                {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="YJ-relevant?">
              <div className="flex gap-1">
                <button onClick={() => setIsYj(true)} className={`px-3 py-1.5 text-sm border rounded ${isYj ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-white text-stone-700 border-stone-300'}`}>Yes</button>
                <button onClick={() => setIsYj(false)} className={`px-3 py-1.5 text-sm border rounded ${!isYj ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-white text-stone-700 border-stone-300'}`}>No</button>
              </div>
            </Field>
            {sector && (
              <span className={`px-2 py-0.5 text-xs font-mono rounded border ${SECTOR_COLOR[sector] || 'bg-stone-100 border-stone-300'}`}>{sector}</span>
            )}
            {overridden && (
              <Field label="Override reason">
                <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why override?" className="px-3 py-1.5 border border-stone-300 rounded text-sm min-w-[280px]" />
              </Field>
            )}
            <button
              onClick={() => onConfirm(row, sector, isYj, overridden ? reason : undefined)}
              disabled={busy || !sector}
              className="px-4 py-1.5 bg-stone-900 text-white text-sm rounded hover:bg-stone-700 disabled:opacity-50"
            >
              {busy ? 'Saving...' : row.confirmed_at ? 'Re-confirm' : 'Confirm'}
            </button>
            {d?.source_url && (
              <a href={d.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-stone-500 underline hover:text-stone-900">source ↗</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
