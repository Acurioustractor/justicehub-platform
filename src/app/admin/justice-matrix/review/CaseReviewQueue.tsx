'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

// Pro bono legal-review queue (second step of dual-control). Lists cases that are
// live but not yet human-confirmed and lets a reviewer sign off after checking
// the authoritative source. Sign-off sets human_confirmed + verified, clearing
// the "AI-extracted, unconfirmed" badge on the public matrix.

interface ReviewCase {
  id: string;
  case_citation: string | null;
  jurisdiction: string | null;
  court: string | null;
  year: number | null;
  source: string | null;
  authoritative_link: string | null;
  strategic_issue: string | null;
  key_holding: string | null;
  verified: boolean | null;
  human_confirmed: boolean | null;
  case_type: string | null;
}

const sourceLabel = (s: string | null) =>
  s === 'seed_data' ? 'seed' : s === 'ai_scraped' ? 'AI-extracted' : s === 'partner_contribution' ? 'partner' : s ?? 'unknown';

export function CaseReviewQueue({ reviewerEmail }: { reviewerEmail: string }) {
  const [cases, setCases] = useState<ReviewCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/justice-matrix/cases?needs_review=true&limit=400');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load');
      // Confirmable rows (have a source of record) first; then seeds before
      // AI-extracted; then newest. So a reviewer works the highest-signal rows.
      const rows = (json.data as ReviewCase[]).sort((a, b) => {
        const la = a.authoritative_link ? 0 : 1;
        const lb = b.authoritative_link ? 0 : 1;
        if (la !== lb) return la - lb;
        const sa = a.source === 'seed_data' ? 0 : 1;
        const sb = b.source === 'seed_data' ? 0 : 1;
        if (sa !== sb) return sa - sb;
        return (b.year ?? 0) - (a.year ?? 0);
      });
      setCases(rows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirm = useCallback(
    async (c: ReviewCase) => {
      setBusy((prev) => new Set(prev).add(c.id));
      setRowError((prev) => { const n = { ...prev }; delete n[c.id]; return n; });
      try {
        const res = await fetch(`/api/justice-matrix/cases/${c.id}/confirm-review`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ reviewed_by: reviewerEmail }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
        setCases((prev) => prev.filter((x) => x.id !== c.id));
        setConfirmedCount((n) => n + 1);
      } catch (e) {
        setRowError((prev) => ({ ...prev, [c.id]: (e as Error).message }));
      } finally {
        setBusy((prev) => { const n = new Set(prev); n.delete(c.id); return n; });
      }
    },
    [reviewerEmail],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter(
      (c) =>
        (c.case_citation ?? '').toLowerCase().includes(q) ||
        (c.jurisdiction ?? '').toLowerCase().includes(q) ||
        (c.court ?? '').toLowerCase().includes(q),
    );
  }, [cases, search]);

  const confirmable = cases.filter((c) => c.authoritative_link).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Justice Matrix — legal review</h1>
        <p className="mt-1 text-sm text-gray-600">
          Dual-control sign-off. Open the source, confirm the facts, then sign off. Confirming sets the case to
          human-confirmed and clears the &ldquo;AI-extracted, unconfirmed&rdquo; badge on the public matrix.
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Reviewer: <span className="font-mono">{reviewerEmail}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-1.5 text-sm text-amber-800">
          <strong>{cases.length}</strong> awaiting review
          <span className="text-amber-600"> · {confirmable} with a source link (confirmable)</span>
        </div>
        {confirmedCount > 0 && (
          <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-sm text-emerald-800">
            <strong>{confirmedCount}</strong> confirmed this session
          </div>
        )}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by citation, court, jurisdiction…"
          className="ml-auto rounded-md border border-gray-300 px-3 py-1.5 text-sm w-64"
        />
        <button onClick={load} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
          Refresh
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 mb-4">{error}</div>}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">Nothing awaiting review. 🎉</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {filtered.map((c) => {
            const isBusy = busy.has(c.id);
            const noLink = !c.authoritative_link;
            return (
              <li key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 leading-snug">{c.case_citation}</div>
                    <div className="mt-0.5 text-xs text-gray-500 font-mono">
                      {[c.court, c.jurisdiction, c.year].filter(Boolean).join('  ·  ')}
                      <span className="ml-2 inline-block rounded bg-gray-100 px-1.5 py-0.5">{sourceLabel(c.source)}</span>
                      {c.verified && <span className="ml-1 inline-block rounded bg-emerald-100 text-emerald-700 px-1.5 py-0.5">link-verified</span>}
                    </div>
                    {c.strategic_issue && <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">{c.strategic_issue}</p>}
                    {rowError[c.id] && <p className="mt-1 text-xs text-red-600">{rowError[c.id]}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {c.authoritative_link ? (
                      <a
                        href={c.authoritative_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                      >
                        Open source ↗
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 whitespace-nowrap">no source link</span>
                    )}
                    <button
                      onClick={() => confirm(c)}
                      disabled={isBusy || noLink}
                      title={noLink ? 'Add an authoritative source link before sign-off' : 'Confirm legal review'}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
                        noLink
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isBusy ? 'Confirming…' : 'Confirm legal review'}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
