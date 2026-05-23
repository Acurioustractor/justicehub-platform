'use client';

import { useEffect, useState } from 'react';

/**
 * "Backed by N sources" pill that opens a modal with the evidence trail
 * inline instead of navigating to /intelligence/civic/claim/[id].
 *
 * Keeps the visitor in kiosk context. Modal lists every civic_claim_evidence
 * row by source, plus the named entities (orgs, detention centres) when
 * present in source_record_ids.
 */

interface Evidence {
  source_table: string;
  source_human: string;
  supports: boolean;
  confidence: number | string | null;
  methodology_note: string | null;
  source_record_ids: any;
}

interface NamedEntity {
  id: string;
  name: string;
  state: string | null;
  slug: string | null;
}

interface ClaimDetail {
  claim: {
    claim_id: string;
    display_label: string;
    value_text: string | null;
    region: string;
    source_year: string | null;
    methodology: string | null;
    methodology_url: string | null;
    source_doc_urls: string[] | null;
  };
  summary: {
    triangulation_tier: 'triangulated' | 'corroborated' | 'single_source' | 'no_evidence';
    supporting_sources: number;
  } | null;
  evidence: Evidence[];
  namedEntities: NamedEntity[];
}

export function TrustDrillButton({
  claimId,
  initialSources,
  variant = 'dark',
}: {
  claimId: string;
  initialSources?: number;
  variant?: 'dark' | 'light';
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || data) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/kiosk/claim-evidence?id=${encodeURIComponent(claimId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
      })
      .catch(() => !cancelled && setError('Could not load evidence.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, claimId, data]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const pillClass =
    variant === 'dark'
      ? 'text-emerald-300 border-emerald-700 hover:bg-emerald-950 hover:text-emerald-100'
      : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50';
  const count = data?.summary?.supporting_sources ?? initialSources ?? null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-block text-xs sm:text-sm font-mono uppercase tracking-[0.3em] border px-4 py-3 rounded transition-colors ${pillClass}`}
      >
        Backed by {count != null ? count : '…'} independent {count === 1 ? 'source' : 'sources'} · tap to see
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start justify-center p-4 sm:p-8"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-stone-950 text-white border-2 border-stone-700 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="border-b border-stone-700 p-5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-500 mb-1">Evidence trail</p>
                <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  {data?.claim?.display_label || 'Loading…'}
                </h2>
                {data?.summary && (
                  <p className="mt-2 text-xs sm:text-sm font-mono uppercase tracking-[0.2em] text-emerald-300">
                    {data.summary.supporting_sources} independent {data.summary.supporting_sources === 1 ? 'source' : 'sources'}
                    {data.claim?.source_year ? ` · ${data.claim.source_year}` : ''}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="min-h-[48px] min-w-[48px] text-stone-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loading && <p className="text-stone-500 text-sm">Loading sources…</p>}
              {error && <p className="text-rose-400 text-sm">{error}</p>}

              {data && data.claim?.source_doc_urls && data.claim.source_doc_urls.length > 0 && (
                <section className="border border-emerald-900 bg-emerald-950/30 rounded p-4">
                  <p className="text-xs font-mono uppercase tracking-widest text-emerald-300 mb-2">
                    Primary source documents
                  </p>
                  <ul className="space-y-1">
                    {data.claim.source_doc_urls.map((u, i) => (
                      <li key={i}>
                        <a
                          href={u}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-emerald-200 underline break-all hover:text-white"
                        >
                          {u}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data && data.evidence.length === 0 && (
                <p className="text-stone-500 text-sm italic">No evidence rows registered for this claim.</p>
              )}
              {data?.evidence.map((e, i) => {
                const referencedOrgIds: string[] = [];
                if (e.source_record_ids) {
                  for (const k of ['organization_ids', 'detention_centre_ids', 'indigenous_org_ids', 'tier1_org_ids']) {
                    const ids = e.source_record_ids[k];
                    if (Array.isArray(ids)) ids.forEach((id: string) => referencedOrgIds.push(id));
                  }
                }
                const refdOrgs = referencedOrgIds
                  .map((id) => data.namedEntities.find((o) => o.id === id))
                  .filter(Boolean) as NamedEntity[];
                return (
                  <article
                    key={i}
                    className={`border rounded p-4 ${
                      e.supports ? 'border-emerald-900 bg-emerald-950/30' : 'border-rose-900 bg-rose-950/30'
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline gap-2 mb-2">
                      <span className="text-xs font-mono uppercase tracking-widest text-stone-200">
                        {e.source_human}
                      </span>
                      {e.confidence != null && (
                        <span className="text-xs font-mono text-stone-500">
                          confidence {Number(e.confidence).toFixed(2)}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${
                          e.supports
                            ? 'text-emerald-300 bg-emerald-950 border-emerald-700'
                            : 'text-rose-300 bg-rose-950 border-rose-700'
                        }`}
                      >
                        {e.supports ? 'supports' : 'contradicts'}
                      </span>
                    </div>
                    {e.methodology_note && (
                      <p className="text-sm text-stone-200 leading-relaxed mb-2">{e.methodology_note}</p>
                    )}
                    {refdOrgs.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {refdOrgs.map((o) => (
                          <li
                            key={o.id}
                            className="text-xs font-mono uppercase tracking-widest text-stone-200 bg-stone-900 border border-stone-700 px-2 py-1 rounded"
                          >
                            {o.name}
                            {o.state && <span className="text-stone-500"> · {o.state}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>

            <footer className="border-t border-stone-700 p-4 text-center">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-[48px] px-6 bg-stone-800 hover:bg-stone-700 text-white text-sm font-mono uppercase tracking-widest rounded"
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
