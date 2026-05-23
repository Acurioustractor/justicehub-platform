'use client';

import { useEffect, useState } from 'react';

/**
 * Coverage drill for a WHAT WORKS category. Opens an in-place modal showing
 * the breakdown of programs in this category by evidence level + the named
 * operating orgs. Not a triangulation drill (no civic_claim_evidence row),
 * just a transparency surface for what data we hold per category.
 */

interface CategorySummary {
  type: string;
  totalPrograms: number;
  byEvidence: { level: string; count: number }[];
  namedOrgs: { name: string; slug: string | null; state: string | null; evidence_level: string | null }[];
}

export function CategoryEvidenceButton({ type, totalPrograms, evidenceCount }: { type: string; totalPrograms: number; evidenceCount: number }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CategorySummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || data) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/kiosk/category-evidence?type=${encodeURIComponent(type)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, type, data]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-700 border border-emerald-300 px-3 py-2 rounded hover:bg-emerald-50"
      >
        Backed by {evidenceCount} of {totalPrograms} programs · tap to see
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
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-500 mb-1">Category coverage</p>
                <h2 className="text-xl font-bold text-white">{type}</h2>
                <p className="mt-1 text-xs font-mono uppercase tracking-[0.2em] text-emerald-300">
                  {totalPrograms} programs · {evidenceCount} evidence-backed
                </p>
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

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {loading && <p className="text-stone-500 text-sm">Loading…</p>}

              {data && data.byEvidence.length > 0 && (
                <section>
                  <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2">Programs by evidence level</p>
                  <ul className="space-y-1">
                    {data.byEvidence.map((row) => (
                      <li key={row.level} className="flex items-baseline justify-between text-sm border-b border-stone-800 pb-1">
                        <span className="text-stone-200">{row.level}</span>
                        <span className="font-mono text-stone-400">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data && data.namedOrgs.length > 0 && (
                <section>
                  <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2">
                    Operating organisations ({data.namedOrgs.length})
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {data.namedOrgs.map((o, i) => (
                      <li
                        key={`${o.name}-${i}`}
                        className="border border-stone-800 bg-stone-900 px-3 py-2 rounded"
                      >
                        <p className="text-sm font-semibold text-white truncate">{o.name}</p>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-stone-500 mt-0.5">
                          {o.state && <span>{o.state}</span>}
                          {o.evidence_level && <span> · {o.evidence_level}</span>}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data && data.namedOrgs.length === 0 && !loading && (
                <p className="text-stone-500 italic text-sm">No named operating organisations on record yet.</p>
              )}
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
