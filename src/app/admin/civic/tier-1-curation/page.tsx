'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Clock, AlertCircle, Building2, ExternalLink, MapPin, DollarSign, Users } from 'lucide-react';

interface Row {
  id: string;
  organization_id: string;
  tier: 1 | 2 | 3 | null;
  sector_category: string | null;
  llm_proposed_tier: 1 | 2 | 3 | null;
  llm_proposed_sector: string | null;
  llm_confidence: number | null;
  llm_evidence_snippet: string | null;
  llm_model: string | null;
  llm_proposed_at: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  override_reason: string | null;
  notes: string | null;
  organizations: {
    id: string;
    name: string;
    slug: string;
    abn: string | null;
    state: string;
    is_indigenous_org: boolean | null;
    description: string | null;
    website: string | null;
    gs_entity_id: string | null;
  } | null;
  registry: {
    sector: string | null;
    sub_sector: string | null;
    lga_name: string | null;
    remoteness: string | null;
    website: string | null;
    latest_revenue: number | null;
    is_community_controlled: boolean | null;
    community_controlled_tier: string | null;
  } | null;
  interventions: Array<{
    id: string;
    name: string | null;
    service_role: string | null;
    type: string | null;
    target_cohort: string | null;
  }>;
  acnc: {
    purposes: string[] | string | null;
    beneficiaries: string[] | string | null;
    ben_aboriginal_tsi: boolean | null;
    ben_youth: boolean | null;
    ben_pre_post_release: boolean | null;
    charity_size: string | null;
    registration_date: string | null;
  } | null;
}

const SECTORS = [
  'primary_frontline', 'peak_body', 'consultancy', 'government',
  'research_academic', 'legal_service', 'advocacy', 'funder', 'media', 'other',
];

const TIER_COLOR = (t: number | null) =>
  t === 1 ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
  : t === 2 ? 'bg-amber-100 text-amber-900 border-amber-300'
  : t === 3 ? 'bg-slate-100 text-slate-700 border-slate-300'
  : 'bg-rose-100 text-rose-900 border-rose-300';

export default function TierOneCurationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, confirmed: 0, tier_1_pending: 0 });
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<'NT' | 'QLD' | ''>('');
  const [confirmation, setConfirmation] = useState<'pending' | 'confirmed' | 'all'>('pending');
  const [tierFilter, setTierFilter] = useState<'' | '1' | '2' | '3'>('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (state) qs.set('state', state);
    if (confirmation) qs.set('confirmation', confirmation);
    if (tierFilter) qs.set('tier', tierFilter);
    const res = await fetch(`/api/admin/civic/tier-1-curation?${qs}`);
    const data = await res.json();
    setRows(data.rows || []);
    setCounts(data.counts || { total: 0, pending: 0, confirmed: 0, tier_1_pending: 0 });
    setLoading(false);
  }, [state, confirmation, tierFilter]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  async function confirmRow(row: Row, tier: number | null, sector: string | null, overrideReason?: string) {
    setActionBusy(row.id);
    try {
      const res = await fetch('/api/admin/civic/tier-1-curation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, tier, sector_category: sector, override_reason: overrideReason || null }),
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
    if (!confirm(`Bulk-accept all pending proposals with confidence >= ${minConf}${state ? ` in ${state}` : ''}?`)) return;
    setBulkBusy(true);
    try {
      const res = await fetch('/api/admin/civic/tier-1-curation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_accept_high_confidence', min_confidence: minConf, state: state || undefined }),
      });
      const data = await res.json();
      alert(`Accepted ${data.accepted} of ${data.considered} candidates`);
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
          <h1 className="text-3xl font-bold text-stone-900">Tier 1 curation</h1>
          <p className="mt-2 text-stone-700">
            Sweep agent-proposed tier and sector classifications. Confirmed rows feed the access ratio on <code>/intelligence/civic</code>.
          </p>
        </header>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <Stat label="Total" value={counts.total} />
          <Stat label="Pending" value={counts.pending} icon={<Clock className="w-4 h-4 text-amber-600" />} />
          <Stat label="Confirmed" value={counts.confirmed} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
          <Stat label="Tier 1 pending" value={counts.tier_1_pending} icon={<AlertCircle className="w-4 h-4 text-rose-600" />} />
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-white border border-stone-200 rounded-lg">
          <Field label="State">
            <select value={state} onChange={(e) => setState(e.target.value as any)} className="px-3 py-2 border border-stone-300 rounded text-sm">
              <option value="">All (NT+QLD)</option>
              <option value="NT">NT</option>
              <option value="QLD">QLD</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={confirmation} onChange={(e) => setConfirmation(e.target.value as any)} className="px-3 py-2 border border-stone-300 rounded text-sm">
              <option value="pending">Pending sweep</option>
              <option value="confirmed">Confirmed</option>
              <option value="all">All</option>
            </select>
          </Field>
          <Field label="Proposed tier">
            <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value as any)} className="px-3 py-2 border border-stone-300 rounded text-sm">
              <option value="">All</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
            </select>
          </Field>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => bulkAccept(0.9)}
              disabled={bulkBusy}
              className="px-4 py-2 bg-stone-900 text-white text-sm rounded hover:bg-stone-700 disabled:opacity-50"
            >
              Bulk-accept ≥ 0.90
            </button>
            <button
              onClick={() => bulkAccept(0.85)}
              disabled={bulkBusy}
              className="px-4 py-2 bg-stone-700 text-white text-sm rounded hover:bg-stone-600 disabled:opacity-50"
            >
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

function RowCard({ row, busy, onConfirm }: { row: Row; busy: boolean; onConfirm: (row: Row, tier: number | null, sector: string | null, reason?: string) => void }) {
  const [tier, setTier] = useState<number | null>(row.tier ?? row.llm_proposed_tier);
  const [sector, setSector] = useState<string | null>(row.sector_category ?? row.llm_proposed_sector);
  const [reason, setReason] = useState(row.override_reason || '');

  const overridden = tier !== row.llm_proposed_tier || sector !== row.llm_proposed_sector;
  const conf = row.llm_confidence ?? 0;
  const org = row.organizations;

  return (
    <div className={`p-4 bg-white border rounded-lg ${row.confirmed_at ? 'border-emerald-200' : 'border-stone-200'}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Building2 className="w-5 h-5 text-stone-400 mt-1" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold text-stone-900 truncate">{org?.name || '—'}</h3>
            {org?.state && <span className="px-2 py-0.5 text-xs font-mono bg-stone-100 text-stone-700 rounded">{org.state}</span>}
            {org?.is_indigenous_org && <span className="px-2 py-0.5 text-xs font-mono bg-amber-100 text-amber-900 rounded">Indigenous</span>}
            {row.confirmed_at && <span className="px-2 py-0.5 text-xs font-mono bg-emerald-100 text-emerald-900 rounded">Confirmed</span>}
          </div>

          <div className="mt-2 text-sm text-stone-700 space-y-2">
            <p className="font-mono text-xs text-stone-500">
              ABN {org?.abn || 'n/a'} · proposed T{row.llm_proposed_tier ?? '?'} / {row.llm_proposed_sector || '?'} · confidence {conf.toFixed(2)} · {row.llm_model}
            </p>

            {/* Website + registry signals */}
            {(org?.website || row.registry?.website || row.registry?.lga_name || row.registry?.sector) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {(row.registry?.website || org?.website) && (
                  <a
                    href={(row.registry?.website || org?.website) as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-stone-700 underline underline-offset-2 hover:text-stone-900 font-medium"
                  >
                    {(row.registry?.website || org?.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {row.registry?.sector && <span className="font-mono text-stone-500">sector: {row.registry.sector}</span>}
                {row.registry?.lga_name && (
                  <span className="inline-flex items-center gap-0.5 font-mono text-stone-500">
                    <MapPin className="w-3 h-3" /> {row.registry.lga_name}
                  </span>
                )}
                {row.registry?.remoteness && <span className="font-mono text-stone-500">{row.registry.remoteness}</span>}
                {row.registry?.is_community_controlled && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-emerald-50 text-emerald-900 rounded border border-emerald-200">
                    community-controlled {row.registry.community_controlled_tier ? `· ${row.registry.community_controlled_tier}` : ''}
                  </span>
                )}
                {row.registry?.latest_revenue != null && (
                  <span className="inline-flex items-center gap-0.5 font-mono text-stone-500">
                    <DollarSign className="w-3 h-3" /> {Math.round(Number(row.registry.latest_revenue)).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Programs they run */}
            {row.interventions && row.interventions.length > 0 && (
              <div className="text-xs">
                <p className="font-mono uppercase tracking-widest text-stone-500 mb-1 inline-flex items-center gap-1"><Users className="w-3 h-3" /> Programs ({row.interventions.length})</p>
                <ul className="space-y-0.5 pl-1">
                  {row.interventions.map((i) => (
                    <li key={i.id} className="text-stone-700">
                      <span className="font-medium">{i.name}</span>
                      {i.service_role && <span className="ml-1.5 text-[10px] font-mono uppercase tracking-widest bg-stone-100 text-stone-600 px-1 py-0.5 rounded">{i.service_role}</span>}
                      {i.target_cohort && <span className="ml-1.5 text-stone-500">· cohort: {i.target_cohort}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ACNC beneficiary flags */}
            {row.acnc && (row.acnc.ben_aboriginal_tsi || row.acnc.ben_youth || row.acnc.ben_pre_post_release || row.acnc.purposes) && (
              <div className="text-xs flex flex-wrap items-center gap-1.5">
                <span className="font-mono uppercase tracking-widest text-stone-500">ACNC:</span>
                {row.acnc.ben_aboriginal_tsi && <span className="px-1.5 py-0.5 text-[10px] font-mono bg-amber-50 text-amber-900 rounded border border-amber-200">Aboriginal/TSI beneficiaries</span>}
                {row.acnc.ben_youth && <span className="px-1.5 py-0.5 text-[10px] font-mono bg-rose-50 text-rose-900 rounded border border-rose-200">Youth beneficiaries</span>}
                {row.acnc.ben_pre_post_release && <span className="px-1.5 py-0.5 text-[10px] font-mono bg-violet-50 text-violet-900 rounded border border-violet-200">Pre/post-release</span>}
                {row.acnc.charity_size && <span className="font-mono text-stone-500">{row.acnc.charity_size}</span>}
              </div>
            )}

            {row.llm_evidence_snippet && (
              <p className="italic text-stone-600">"{row.llm_evidence_snippet}"</p>
            )}
            {org?.description && (
              <p className="text-stone-600 text-xs line-clamp-2">{org.description}</p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Field label="Tier">
              <div className="flex gap-1">
                {[1, 2, 3].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    className={`px-3 py-1.5 text-sm border rounded ${tier === t ? TIER_COLOR(t) : 'bg-white text-stone-700 border-stone-300'}`}
                  >
                    T{t}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Sector">
              <select
                value={sector || ''}
                onChange={(e) => setSector(e.target.value || null)}
                className="px-3 py-1.5 border border-stone-300 rounded text-sm min-w-[180px]"
              >
                <option value="">—</option>
                {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            {overridden && (
              <Field label="Override reason (optional)">
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why override?"
                  className="px-3 py-1.5 border border-stone-300 rounded text-sm min-w-[280px]"
                />
              </Field>
            )}
            <button
              onClick={() => onConfirm(row, tier, sector, overridden ? reason : undefined)}
              disabled={busy || !tier || !sector}
              className="px-4 py-1.5 bg-stone-900 text-white text-sm rounded hover:bg-stone-700 disabled:opacity-50"
            >
              {busy ? 'Saving...' : row.confirmed_at ? 'Re-confirm' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
