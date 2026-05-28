'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Scale,
  Users,
  AlertTriangle,
  Copy,
  RefreshCw,
  ChevronRight,
  Save,
  FileWarning,
} from 'lucide-react';
// reviewerEmail is passed in by the server-side admin guard so the queue
// always renders with the real identity from the first paint.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Discovery {
  id: string;
  source_id: string | null;
  source_url: string;
  item_type: 'case' | 'campaign' | 'resource';
  raw_data: Record<string, unknown>;
  extracted_title: string | null;
  extracted_jurisdiction: string | null;
  extracted_year: number | null;
  extracted_categories: string[] | null;
  extracted_summary: string | null;
  extracted_lat: number | null;
  extracted_lng: number | null;
  extracted_country_code: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'duplicate';
  review_notes: string | null;
  reviewed_by: string | null;
  extraction_confidence: number | null;
  similarity_score: number | null;
  potential_duplicate_id: string | null;
  discovered_at: string;
  source?: { name: string; source_type: string; region: string } | null;
}

// Editable fields, per item type. Pre-filled from the extracted_* values and
// passed through to the approve action so what you publish is what you saw.
interface EditFormCase {
  jurisdiction: string;
  case_citation: string;
  year: number | '';
  court: string;
  strategic_issue: string;
  key_holding: string;
  region: string;
  country_code: string;
  categories: string; // comma-separated for the input
  outcome: 'favorable' | 'adverse' | 'pending' | '';
  precedent_strength: 'high' | 'medium' | 'low' | '';
}
interface EditFormCampaign {
  country_region: string;
  campaign_name: string;
  lead_organizations: string;
  goals: string;
  notable_tactics: string;
  outcome_status: string;
  start_year: number | '';
  is_ongoing: boolean;
  country_code: string;
  categories: string;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function DiscoveriesQueue({ reviewerEmail }: { reviewerEmail: string }) {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'duplicate' | 'all'>('pending');
  const [typeFilter, setTypeFilter] = useState<'' | 'case' | 'campaign'>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const reviewer = reviewerEmail;
  const [actionPanel, setActionPanel] = useState<'idle' | 'rejecting' | 'duplicating' | 'bulkRejecting'>('idle');
  const [actionInput, setActionInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [editCase, setEditCase] = useState<EditFormCase | null>(null);
  const [editCampaign, setEditCampaign] = useState<EditFormCampaign | null>(null);

  const fetchDiscoveries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: pagination.page.toString(),
        limit: '25',
      });
      if (typeFilter) params.set('item_type', typeFilter);
      const res = await fetch(`/api/justice-matrix/discovered?${params}`);
      const json = await res.json();
      if (json.success) {
        setDiscoveries(json.data || []);
        setPagination((p) => ({ ...p, total: json.pagination.total, totalPages: json.pagination.totalPages }));
        // Clear selection when the underlying list changes.
        setBulkSelected(new Set());
        if (selectedId && !json.data?.some((d: Discovery) => d.id === selectedId)) setSelectedId(null);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, pagination.page, selectedId]);

  useEffect(() => { fetchDiscoveries(); }, [fetchDiscoveries]);

  const filtered = useMemo(() => {
    if (!searchQuery) return discoveries;
    const q = searchQuery.toLowerCase();
    return discoveries.filter(
      (d) =>
        d.extracted_title?.toLowerCase().includes(q) ||
        d.extracted_jurisdiction?.toLowerCase().includes(q) ||
        d.source?.name?.toLowerCase().includes(q),
    );
  }, [discoveries, searchQuery]);

  const selected = useMemo(() => filtered.find((d) => d.id === selectedId) ?? null, [filtered, selectedId]);

  // Seed the edit form from the selected discovery whenever it changes.
  useEffect(() => {
    if (!selected) {
      setEditCase(null);
      setEditCampaign(null);
      setActionPanel('idle');
      setActionInput('');
      return;
    }
    if (selected.item_type === 'case') {
      setEditCase({
        jurisdiction: selected.extracted_jurisdiction ?? '',
        case_citation: selected.extracted_title ?? '',
        year: selected.extracted_year ?? '',
        court: '',
        strategic_issue: selected.extracted_summary ?? '',
        key_holding: '',
        region: selected.source?.region ?? '',
        country_code: selected.extracted_country_code ?? '',
        categories: (selected.extracted_categories ?? []).join(', '),
        outcome: '',
        precedent_strength: '',
      });
      setEditCampaign(null);
    } else if (selected.item_type === 'campaign') {
      setEditCampaign({
        country_region: selected.extracted_jurisdiction ?? '',
        campaign_name: selected.extracted_title ?? '',
        lead_organizations: '',
        goals: selected.extracted_summary ?? '',
        notable_tactics: '',
        outcome_status: '',
        start_year: selected.extracted_year ?? '',
        is_ongoing: true,
        country_code: selected.extracted_country_code ?? '',
        categories: (selected.extracted_categories ?? []).join(', '),
      });
      setEditCase(null);
    }
    setActionPanel('idle');
    setActionInput('');
  }, [selected]);

  async function callAction(
    id: string,
    body: Record<string, unknown>,
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/justice-matrix/discovered/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, reviewed_by: reviewer }),
      });
      const json = await res.json();
      return json.success ? { ok: true } : { ok: false, error: json.error };
    } catch (e: unknown) {
      return { ok: false, error: (e as Error)?.message ?? 'unknown error' };
    }
  }

  function categoriesArray(input: string): string[] {
    return input.split(',').map((s) => s.trim()).filter(Boolean);
  }

  async function doApprove() {
    if (!selected) return;
    setSaving(true);
    let body: Record<string, unknown> = { action: 'approve' };
    if (selected.item_type === 'case' && editCase) {
      body = {
        ...body,
        jurisdiction: editCase.jurisdiction || null,
        case_citation: editCase.case_citation,
        year: editCase.year === '' ? null : editCase.year,
        court: editCase.court || null,
        strategic_issue: editCase.strategic_issue || null,
        key_holding: editCase.key_holding || null,
        region: editCase.region || null,
        country_code: editCase.country_code || null,
        categories: categoriesArray(editCase.categories),
        outcome: editCase.outcome || null,
        precedent_strength: editCase.precedent_strength || null,
      };
    } else if (selected.item_type === 'campaign' && editCampaign) {
      body = {
        ...body,
        country_region: editCampaign.country_region || null,
        campaign_name: editCampaign.campaign_name,
        lead_organizations: editCampaign.lead_organizations || null,
        goals: editCampaign.goals || null,
        notable_tactics: editCampaign.notable_tactics || null,
        outcome_status: editCampaign.outcome_status || null,
        start_year: editCampaign.start_year === '' ? null : editCampaign.start_year,
        is_ongoing: editCampaign.is_ongoing,
        country_code: editCampaign.country_code || null,
        categories: categoriesArray(editCampaign.categories),
      };
    }
    const r = await callAction(selected.id, body);
    setSaving(false);
    if (!r.ok) { alert(`Approve failed: ${r.error}`); return; }
    fetchDiscoveries();
  }

  async function doSaveEditsOnly() {
    if (!selected) return;
    setSaving(true);
    const body =
      selected.item_type === 'case' && editCase
        ? {
            extracted_title: editCase.case_citation,
            extracted_jurisdiction: editCase.jurisdiction,
            extracted_year: editCase.year === '' ? null : editCase.year,
            extracted_summary: editCase.strategic_issue,
            extracted_country_code: editCase.country_code,
            extracted_categories: categoriesArray(editCase.categories),
          }
        : selected.item_type === 'campaign' && editCampaign
        ? {
            extracted_title: editCampaign.campaign_name,
            extracted_jurisdiction: editCampaign.country_region,
            extracted_year: editCampaign.start_year === '' ? null : editCampaign.start_year,
            extracted_summary: editCampaign.goals,
            extracted_country_code: editCampaign.country_code,
            extracted_categories: categoriesArray(editCampaign.categories),
          }
        : {};
    const r = await callAction(selected.id, body);
    setSaving(false);
    if (!r.ok) { alert(`Save failed: ${r.error}`); return; }
    fetchDiscoveries();
  }

  async function doReject() {
    if (!selected) return;
    setSaving(true);
    const r = await callAction(selected.id, { action: 'reject', review_notes: actionInput.trim() || null });
    setSaving(false);
    if (!r.ok) { alert(`Reject failed: ${r.error}`); return; }
    fetchDiscoveries();
  }

  async function doDuplicate() {
    if (!selected) return;
    const id = actionInput.trim();
    if (!id) { alert('Enter the id of the existing item this duplicates.'); return; }
    setSaving(true);
    const r = await callAction(selected.id, { action: 'duplicate', duplicate_of_id: id });
    setSaving(false);
    if (!r.ok) { alert(`Mark duplicate failed: ${r.error}`); return; }
    fetchDiscoveries();
  }

  async function doBulkReject() {
    const ids = Array.from(bulkSelected);
    if (!ids.length) return;
    setSaving(true);
    const notes = actionInput.trim() || null;
    // Sequential to keep error reporting simple; queue sizes here are small.
    let failed = 0;
    for (const id of ids) {
      const r = await callAction(id, { action: 'reject', review_notes: notes });
      if (!r.ok) failed++;
    }
    setSaving(false);
    if (failed) alert(`${failed} of ${ids.length} failed.`);
    fetchDiscoveries();
  }

  function toggleBulk(id: string) {
    setBulkSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/justice-matrix" className="flex items-center gap-2 text-gray-600 hover:text-black">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="w-px h-6 bg-gray-300" />
            <div>
              <h1 className="text-2xl font-black text-black">Discovery Review Queue</h1>
              <p className="text-sm text-gray-600">
                {pagination.total} {statusFilter === 'all' ? 'total' : statusFilter} · reviewing as <span className="font-mono">{reviewer}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchDiscoveries()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-2 border-gray-300 hover:bg-gray-200 font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Filters */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPagination((p) => ({ ...p, page: 1 })); setSelectedId(null); }}
              className="border-2 border-gray-300 px-3 py-2 font-medium focus:border-black focus:outline-none"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="duplicate">Duplicates</option>
              <option value="all">All</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as typeof typeFilter); setPagination((p) => ({ ...p, page: 1 })); }}
              className="border-2 border-gray-300 px-3 py-2 font-medium focus:border-black focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="case">Cases</option>
              <option value="campaign">Campaigns</option>
            </select>
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search title, jurisdiction, or source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 focus:border-black focus:outline-none"
              />
            </div>
          </div>
          {bulkSelected.size > 0 && (
            <div className="mt-3 flex items-center gap-3 border-t-2 border-gray-200 pt-3">
              <span className="font-bold text-sm">{bulkSelected.size} selected</span>
              {actionPanel === 'bulkRejecting' ? (
                <>
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 border-2 border-gray-300 focus:border-black focus:outline-none text-sm"
                  />
                  <button
                    disabled={saving}
                    onClick={async () => { await doBulkReject(); setActionPanel('idle'); setActionInput(''); }}
                    className="px-3 py-1.5 bg-red-600 text-white font-bold border-2 border-black disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Rejecting...' : `Reject ${bulkSelected.size}`}
                  </button>
                  <button
                    onClick={() => { setActionPanel('idle'); setActionInput(''); }}
                    className="px-3 py-1.5 border-2 border-gray-300 font-bold text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActionPanel('bulkRejecting')}
                    className="px-3 py-1.5 bg-white text-red-600 font-bold border-2 border-red-600 hover:bg-red-50 text-sm"
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    Reject selected
                  </button>
                  <button
                    onClick={() => setBulkSelected(new Set())}
                    className="px-3 py-1.5 border-2 border-gray-300 font-bold text-sm"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Split layout: list | detail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LIST */}
          <div className="lg:col-span-5">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 text-center">
                <Clock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">No {statusFilter === 'all' ? '' : statusFilter} items</h3>
                <p className="text-sm text-gray-600">
                  Scans are run via <code className="bg-gray-100 px-1">npx tsx scripts/scan-justice-matrix.ts --apply</code>. No scheduled cron yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((d) => {
                  const isSelected = d.id === selectedId;
                  const isChecked = bulkSelected.has(d.id);
                  const dup = !!d.potential_duplicate_id || (d.similarity_score ?? 0) > 70;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedId(d.id)}
                      className={`w-full text-left bg-white border-2 ${isSelected ? 'border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-gray-300 hover:border-gray-500'} p-3 transition-all`}
                    >
                      <div className="flex items-start gap-2">
                        {d.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => { e.stopPropagation(); toggleBulk(d.id); }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 w-4 h-4 accent-black"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {d.item_type === 'case' ? (
                              <Scale className="w-4 h-4 text-blue-700 shrink-0" />
                            ) : (
                              <Users className="w-4 h-4 text-green-700 shrink-0" />
                            )}
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold ${d.item_type === 'case' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {d.item_type.toUpperCase()}
                            </span>
                            {d.extraction_confidence != null && (
                              <span className={`px-1.5 py-0.5 text-[10px] font-bold ${d.extraction_confidence >= 0.8 ? 'bg-green-100 text-green-700' : d.extraction_confidence >= 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {Math.round(d.extraction_confidence * 100)}%
                              </span>
                            )}
                            {dup && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                dup
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-sm text-black line-clamp-2">{d.extracted_title || 'Untitled'}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                            {d.source?.name ?? 'unknown source'}
                            {d.extracted_jurisdiction ? ` · ${d.extracted_jurisdiction}` : ''}
                            {d.extracted_year ? ` · ${d.extracted_year}` : ''}
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-black translate-x-0.5' : 'text-gray-400'}`} />
                      </div>
                    </button>
                  );
                })}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                      onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1.5 bg-white border-2 border-black font-bold disabled:opacity-50 text-sm"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm font-medium">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1.5 bg-white border-2 border-black font-bold disabled:opacity-50 text-sm"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DETAIL */}
          <div className="lg:col-span-7">
            {!selected ? (
              <div className="bg-white border-2 border-dashed border-gray-300 p-12 text-center text-gray-500">
                <ChevronRight className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                Select a discovery on the left to review it.
              </div>
            ) : (
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 space-y-5">
                {/* Title + provenance */}
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {selected.item_type === 'case' ? (
                      <Scale className="w-5 h-5 text-blue-700" />
                    ) : (
                      <Users className="w-5 h-5 text-green-700" />
                    )}
                    <span className={`px-2 py-0.5 text-xs font-bold ${selected.item_type === 'case' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {selected.item_type.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-bold ${selected.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : selected.status === 'approved' ? 'bg-green-100 text-green-700' : selected.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {selected.status.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-black mb-1">{selected.extracted_title || 'Untitled'}</h2>
                  <div className="text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                    <span><strong>Source:</strong> {selected.source?.name ?? '—'} ({selected.source?.source_type ?? '—'})</span>
                    <span><strong>Region:</strong> {selected.source?.region ?? '—'}</span>
                    <span><strong>Discovered:</strong> {new Date(selected.discovered_at).toLocaleString()}</span>
                    {selected.extraction_confidence != null && (
                      <span><strong>Confidence:</strong> {Math.round(selected.extraction_confidence * 100)}%</span>
                    )}
                    {typeof selected.raw_data?.scanner === 'string' && (
                      <span><strong>Scanner:</strong> {String(selected.raw_data.scanner)}</span>
                    )}
                    {typeof selected.raw_data?.model === 'string' && (
                      <span><strong>Model:</strong> {String(selected.raw_data.model)}</span>
                    )}
                  </div>
                  <a
                    href={selected.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-blue-700 hover:underline text-sm break-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {selected.source_url}
                  </a>
                </div>

                {/* Duplicate flag */}
                {(selected.potential_duplicate_id || (selected.similarity_score ?? 0) > 70) && (
                  <div className="bg-orange-50 border-2 border-orange-300 p-3 text-sm">
                    <div className="flex items-center gap-2 font-bold text-orange-800 mb-1">
                      <FileWarning className="w-4 h-4" />
                      Possible duplicate flagged by scanner
                    </div>
                    {selected.similarity_score != null && (
                      <div>Similarity score: <strong>{selected.similarity_score}</strong></div>
                    )}
                    {selected.potential_duplicate_id && (
                      <div>Duplicate-of id: <code className="bg-white px-1">{selected.potential_duplicate_id}</code></div>
                    )}
                  </div>
                )}

                {/* Edit form */}
                {selected.item_type === 'case' && editCase && (
                  <div className="space-y-3">
                    <FormSection title="Case fields">
                      <Field label="Citation" value={editCase.case_citation} onChange={(v) => setEditCase({ ...editCase, case_citation: v })} required />
                      <Field label="Jurisdiction" value={editCase.jurisdiction} onChange={(v) => setEditCase({ ...editCase, jurisdiction: v })} />
                      <Field label="Court" value={editCase.court} onChange={(v) => setEditCase({ ...editCase, court: v })} placeholder="e.g. ECtHR (Grand Chamber)" />
                      <FieldNum label="Year" value={editCase.year} onChange={(v) => setEditCase({ ...editCase, year: v })} />
                      <Field label="Region" value={editCase.region} onChange={(v) => setEditCase({ ...editCase, region: v })} placeholder="Europe / Americas / Asia-Pacific / Africa / global" />
                      <Field label="Country code" value={editCase.country_code} onChange={(v) => setEditCase({ ...editCase, country_code: v })} placeholder="ISO 2-letter" />
                      <Select label="Outcome" value={editCase.outcome} onChange={(v) => setEditCase({ ...editCase, outcome: v as EditFormCase['outcome'] })} options={['', 'favorable', 'adverse', 'pending']} />
                      <Select label="Precedent strength" value={editCase.precedent_strength} onChange={(v) => setEditCase({ ...editCase, precedent_strength: v as EditFormCase['precedent_strength'] })} options={['', 'high', 'medium', 'low']} />
                    </FormSection>
                    <FormSection title="Substance">
                      <Textarea label="Strategic issue" value={editCase.strategic_issue} onChange={(v) => setEditCase({ ...editCase, strategic_issue: v })} />
                      <Textarea label="Key holding" value={editCase.key_holding} onChange={(v) => setEditCase({ ...editCase, key_holding: v })} />
                      <Field label="Categories (comma-separated)" value={editCase.categories} onChange={(v) => setEditCase({ ...editCase, categories: v })} />
                    </FormSection>
                  </div>
                )}

                {selected.item_type === 'campaign' && editCampaign && (
                  <div className="space-y-3">
                    <FormSection title="Campaign fields">
                      <Field label="Campaign name" value={editCampaign.campaign_name} onChange={(v) => setEditCampaign({ ...editCampaign, campaign_name: v })} required />
                      <Field label="Country / Region" value={editCampaign.country_region} onChange={(v) => setEditCampaign({ ...editCampaign, country_region: v })} />
                      <Field label="Country code" value={editCampaign.country_code} onChange={(v) => setEditCampaign({ ...editCampaign, country_code: v })} placeholder="ISO 2-letter" />
                      <FieldNum label="Start year" value={editCampaign.start_year} onChange={(v) => setEditCampaign({ ...editCampaign, start_year: v })} />
                      <label className="flex items-center gap-2 text-xs font-bold col-span-2">
                        <input
                          type="checkbox"
                          checked={editCampaign.is_ongoing}
                          onChange={(e) => setEditCampaign({ ...editCampaign, is_ongoing: e.target.checked })}
                          className="w-4 h-4 accent-black"
                        />
                        Ongoing
                      </label>
                    </FormSection>
                    <FormSection title="Substance">
                      <Field label="Lead organizations" value={editCampaign.lead_organizations} onChange={(v) => setEditCampaign({ ...editCampaign, lead_organizations: v })} />
                      <Textarea label="Goals" value={editCampaign.goals} onChange={(v) => setEditCampaign({ ...editCampaign, goals: v })} />
                      <Textarea label="Notable tactics" value={editCampaign.notable_tactics} onChange={(v) => setEditCampaign({ ...editCampaign, notable_tactics: v })} />
                      <Textarea label="Outcome / status" value={editCampaign.outcome_status} onChange={(v) => setEditCampaign({ ...editCampaign, outcome_status: v })} />
                      <Field label="Categories (comma-separated)" value={editCampaign.categories} onChange={(v) => setEditCampaign({ ...editCampaign, categories: v })} />
                    </FormSection>
                  </div>
                )}

                {/* Action bar */}
                {selected.status === 'pending' && (
                  <div className="border-t-2 border-gray-200 pt-4">
                    {actionPanel === 'rejecting' ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Rejection reason (optional)"
                          value={actionInput}
                          onChange={(e) => setActionInput(e.target.value)}
                          className="flex-1 px-3 py-2 border-2 border-gray-300 focus:border-black focus:outline-none text-sm"
                        />
                        <button disabled={saving} onClick={doReject} className="px-3 py-2 bg-red-600 text-white font-bold border-2 border-black disabled:opacity-50 text-sm">
                          {saving ? '...' : 'Confirm reject'}
                        </button>
                        <button onClick={() => { setActionPanel('idle'); setActionInput(''); }} className="px-3 py-2 border-2 border-gray-300 font-bold text-sm">Cancel</button>
                      </div>
                    ) : actionPanel === 'duplicating' ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Existing case/campaign UUID"
                          value={actionInput}
                          onChange={(e) => setActionInput(e.target.value)}
                          className="flex-1 px-3 py-2 border-2 border-gray-300 focus:border-black focus:outline-none text-sm font-mono"
                        />
                        <button disabled={saving} onClick={doDuplicate} className="px-3 py-2 bg-orange-600 text-white font-bold border-2 border-black disabled:opacity-50 text-sm">
                          {saving ? '...' : 'Mark duplicate'}
                        </button>
                        <button onClick={() => { setActionPanel('idle'); setActionInput(''); }} className="px-3 py-2 border-2 border-gray-300 font-bold text-sm">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          disabled={saving}
                          onClick={doApprove}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {saving ? 'Approving...' : 'Approve with edits'}
                        </button>
                        <button
                          disabled={saving}
                          onClick={doSaveEditsOnly}
                          className="flex items-center gap-2 px-3 py-2 bg-white text-black font-bold border-2 border-black hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          Save edits only
                        </button>
                        <button
                          onClick={() => { setActionPanel('rejecting'); setActionInput(''); }}
                          className="flex items-center gap-2 px-3 py-2 bg-white text-red-600 font-bold border-2 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => { setActionPanel('duplicating'); setActionInput(selected.potential_duplicate_id ?? ''); }}
                          className="flex items-center gap-2 px-3 py-2 bg-white text-orange-600 font-bold border-2 border-orange-600 hover:bg-orange-50"
                        >
                          <Copy className="w-4 h-4" />
                          Mark duplicate
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Already-reviewed banner */}
                {selected.status !== 'pending' && (
                  <div className={`border-t-2 pt-4 text-sm ${selected.status === 'approved' ? 'border-green-200 text-green-700' : selected.status === 'rejected' ? 'border-red-200 text-red-700' : 'border-orange-200 text-orange-700'}`}>
                    <strong className="capitalize">{selected.status}</strong>
                    {selected.reviewed_by && <> by <span className="font-mono">{selected.reviewed_by}</span></>}
                    {selected.review_notes && <> · {selected.review_notes}</>}
                  </div>
                )}

                {/* Raw data, collapsed-friendly */}
                <details className="border-t-2 border-gray-200 pt-3">
                  <summary className="text-xs font-bold text-gray-500 uppercase cursor-pointer">Raw scanner output</summary>
                  <pre className="mt-2 text-[11px] bg-gray-900 text-green-400 p-3 overflow-x-auto max-h-60">
{JSON.stringify(selected.raw_data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small form primitives (kept inline; the page is the only consumer)
// ---------------------------------------------------------------------------

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <label className="block text-xs">
      <span className="font-bold text-gray-700">{label}{required && <span className="text-red-600"> *</span>}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-2 py-1.5 border-2 border-gray-300 focus:border-black focus:outline-none text-sm"
      />
    </label>
  );
}

function FieldNum({ label, value, onChange }: { label: string; value: number | ''; onChange: (v: number | '') => void }) {
  return (
    <label className="block text-xs">
      <span className="font-bold text-gray-700">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
        className="mt-1 w-full px-2 py-1.5 border-2 border-gray-300 focus:border-black focus:outline-none text-sm"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block text-xs">
      <span className="font-bold text-gray-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-2 py-1.5 border-2 border-gray-300 focus:border-black focus:outline-none text-sm bg-white"
      >
        {options.map((o) => <option key={o} value={o}>{o || '— none —'}</option>)}
      </select>
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs col-span-2">
      <span className="font-bold text-gray-700">{label}</span>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-2 py-1.5 border-2 border-gray-300 focus:border-black focus:outline-none text-sm"
      />
    </label>
  );
}
