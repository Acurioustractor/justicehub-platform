'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Scale, Megaphone, BookOpen, X, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';

const DISPLAY = "'Cormorant Garamond', Georgia, serif";

interface CaseHit {
  kind: 'case';
  id: string;
  title: string;
  jurisdiction: string;
  year: number | null;
  court: string | null;
  excerpt: string | null;
  region: string | null;
  country_code: string | null;
  categories: string[] | null;
  outcome: string | null;
  precedent_strength: string | null;
  case_type: string | null;
  authoritative_link: string | null;
  distance: number | null;
}

interface CampaignHit {
  kind: 'campaign';
  id: string;
  title: string;
  region: string | null;
  start_year: number | null;
  is_ongoing: boolean | null;
  excerpt: string | null;
  country_code: string | null;
  categories: string[] | null;
  lead_organizations: string | null;
  campaign_link: string | null;
  distance: number | null;
}

// ALMA evidence — Australia-only youth-justice research/evaluations, surfaced
// as a DISTINCT third kind so it is never confused with the (global) cases.
interface EvidenceHit {
  kind: 'evidence';
  id: string;
  title: string;
  jurisdiction: string; // always 'Australia'
  country_code: string | null; // always 'AU'
  region: string | null;
  year: number | null;
  evidence_type: string | null;
  excerpt: string | null;
  organization: string | null;
  author: string | null;
  source_url: string | null;
  consent_level: string | null;
  cultural_safety: string | null;
  // 'Community Controlled' → title + provenance only, "access on request".
  restricted: boolean;
  distance: number | null;
}

type Hit = CaseHit | CampaignHit | EvidenceHit;

interface SearchResponse {
  mode: 'keyword' | 'semantic';
  q: string;
  type: 'all' | 'case' | 'campaign' | 'evidence';
  cases: CaseHit[];
  campaigns: CampaignHit[];
  evidence: EvidenceHit[];
  total: number;
}

export interface FacetSeed {
  topCategories: Array<[string, number]>;
  totals: { cases: number; campaigns: number; evidence: number };
}

export interface ExploreClientProps {
  facetSeed: FacetSeed;
  /** Initial keyword response so the page is useful without JS-driven search yet. */
  initial: SearchResponse;
  /** Optional initial state from URL search params. */
  initialState: {
    q: string;
    mode: 'keyword' | 'semantic';
    type: 'all' | 'case' | 'campaign' | 'evidence';
    cats: string[];
    outcome: string;
    strength: string;
  };
}

export function ExploreClient({ facetSeed, initial, initialState }: ExploreClientProps) {
  // --- state ----------------------------------------------------------------
  const [q, setQ] = useState(initialState.q);
  const [mode, setMode] = useState<'keyword' | 'semantic'>(initialState.mode);
  const [type, setType] = useState<'all' | 'case' | 'campaign' | 'evidence'>(initialState.type);
  const [cats, setCats] = useState<string[]>(initialState.cats);
  const [outcome, setOutcome] = useState<string>(initialState.outcome);
  const [strength, setStrength] = useState<string>(initialState.strength);
  const [results, setResults] = useState<SearchResponse>(initial);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const hasFilter = Boolean(
    q || cats.length || outcome || strength || type !== 'all' || mode !== 'keyword',
  );

  // --- url sync (shareable state) ------------------------------------------
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (mode !== 'keyword') p.set('mode', mode);
    if (type !== 'all') p.set('type', type);
    if (cats.length) p.set('cat', cats.join(','));
    if (outcome) p.set('outcome', outcome);
    if (strength) p.set('strength', strength);
    return p.toString();
  }, [q, mode, type, cats, outcome, strength]);

  useEffect(() => {
    const url = queryString ? `?${queryString}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [queryString]);

  // --- debounced fetch -----------------------------------------------------
  useEffect(() => {
    const ctrl = new AbortController();
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `/api/justice-matrix/search${queryString ? `?${queryString}` : ''}`;
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) return;
        const json = (await res.json()) as SearchResponse;
        setResults(json);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') console.error(e);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(handle);
      ctrl.abort();
    };
  }, [queryString]);

  // --- keyboard shortcuts (/ focuses, Esc clears) ---------------------------
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        searchRef.current?.blur();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // --- helpers --------------------------------------------------------------
  const toggleCat = useCallback((c: string) => {
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }, []);

  const clearAll = useCallback(() => {
    setQ('');
    setCats([]);
    setOutcome('');
    setStrength('');
    setType('all');
    setMode('keyword');
  }, []);

  const merged: Hit[] = useMemo(() => {
    // Interleave all kinds by relevance (semantic distance asc, else by year desc).
    const sortYear = (h: Hit) => (h.kind === 'campaign' ? h.start_year ?? 0 : h.year ?? 0);
    const items: Hit[] = [
      ...results.cases,
      ...results.campaigns,
      ...(results.evidence ?? []),
    ];
    items.sort((a, b) => {
      if (results.mode === 'semantic') {
        const ad = a.distance ?? 1;
        const bd = b.distance ?? 1;
        return ad - bd;
      }
      return sortYear(b) - sortYear(a);
    });
    return items;
  }, [results]);

  // --- render ---------------------------------------------------------------
  return (
    <main style={{ background: '#f8f1e6', color: '#2b2530' }} className="min-h-screen">
      {/* HERO */}
      <section
        style={{ background: 'radial-gradient(circle at 30% 0%, #5a2d74, #38184d 60%, #2c1240)' }}
        className="relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 md:px-10 pt-14 md:pt-20 pb-10 md:pb-14">
          <div className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#d3b583] mb-4">
            Justice Matrix · Explore
          </div>
          <h1
            style={{ fontFamily: DISPLAY, fontWeight: 500, lineHeight: 1.02 }}
            className="text-5xl md:text-6xl text-white max-w-4xl mb-5"
          >
            One search across cases, campaigns, and evidence.
          </h1>
          <p className="text-[#eadff2] text-base md:text-lg max-w-2xl mb-8">
            {facetSeed.totals.cases.toLocaleString()} strategic cases ·{' '}
            {facetSeed.totals.campaigns.toLocaleString()} advocacy campaigns ·{' '}
            {facetSeed.totals.evidence.toLocaleString()} Australian evidence studies. Type to
            filter instantly, switch to semantic mode for related-ideas search.
          </p>

          {/* Search input */}
          <div className="relative max-w-3xl">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: '#8d6a44' }}
            />
            <input
              ref={searchRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try: Bugmy · refugee non-refoulement · Mabo · detention conditions..."
              className="w-full rounded-full pl-14 pr-32 py-4 text-base md:text-lg border-2 focus:outline-none placeholder:text-[#7d5f3d]/60"
              style={{
                background: '#fff8ef',
                borderColor: '#d3b583',
                color: '#2b2530',
                fontFamily: DISPLAY,
              }}
              aria-label="Search the Justice Matrix"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {q && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  className="rounded-full p-1.5 hover:bg-black/5"
                  style={{ color: '#8d6a44' }}
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd
                className="hidden md:inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-mono"
                style={{ background: 'rgba(45,18,64,0.08)', color: '#4a2560' }}
              >
                press /
              </kbd>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <SegmentedToggle
              value={mode}
              onChange={(v) => setMode(v as 'keyword' | 'semantic')}
              options={[
                { value: 'keyword', label: 'Keyword' },
                { value: 'semantic', label: 'Semantic', icon: <Sparkles className="w-3 h-3" /> },
              ]}
            />
            <SegmentedToggle
              value={type}
              onChange={(v) => setType(v as 'all' | 'case' | 'campaign' | 'evidence')}
              options={[
                { value: 'all', label: 'All' },
                { value: 'case', label: 'Cases', icon: <Scale className="w-3 h-3" /> },
                { value: 'campaign', label: 'Campaigns', icon: <Megaphone className="w-3 h-3" /> },
                { value: 'evidence', label: 'Evidence', icon: <BookOpen className="w-3 h-3" /> },
              ]}
            />
            {loading && (
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#d3b583] animate-pulse">
                searching…
              </span>
            )}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-14">
        <div className="grid lg:grid-cols-[240px_1fr] gap-10">
          {/* Sidebar */}
          <aside className="space-y-7 lg:sticky lg:top-6 lg:self-start">
            <FacetGroup title="Issue areas">
              <div className="flex flex-wrap gap-1.5">
                {facetSeed.topCategories.map(([c, n]) => (
                  <FacetChip key={c} active={cats.includes(c)} onClick={() => toggleCat(c)}>
                    {c}
                    <span className="ml-1 opacity-60">{n}</span>
                  </FacetChip>
                ))}
              </div>
            </FacetGroup>

            <FacetGroup title="Outcome (cases)">
              <div className="flex flex-wrap gap-1.5">
                {(['favorable', 'adverse', 'pending'] as const).map((o) => (
                  <FacetChip
                    key={o}
                    active={outcome === o}
                    onClick={() => setOutcome((cur) => (cur === o ? '' : o))}
                  >
                    {o}
                  </FacetChip>
                ))}
              </div>
            </FacetGroup>

            <FacetGroup title="Precedent strength">
              <div className="flex flex-wrap gap-1.5">
                {(['high', 'medium', 'low'] as const).map((s) => (
                  <FacetChip
                    key={s}
                    active={strength === s}
                    onClick={() => setStrength((cur) => (cur === s ? '' : s))}
                  >
                    {s}
                  </FacetChip>
                ))}
              </div>
            </FacetGroup>

            {hasFilter && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[12px] font-semibold underline"
                style={{ color: '#7d5f3d' }}
              >
                clear all filters
              </button>
            )}
          </aside>

          {/* Results column */}
          <div>
            <div className="flex items-baseline justify-between mb-6">
              <div className="text-sm" style={{ color: '#5e5145' }}>
                <strong style={{ color: '#2b2530' }}>{results.total.toLocaleString()}</strong>{' '}
                {results.total === 1 ? 'result' : 'results'}
                {results.mode === 'semantic' && ' · semantic'}
                {q && ` for "${q}"`}
              </div>
              {hasFilter && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-semibold inline-flex items-center gap-1.5"
                  style={{ color: '#4a2560' }}
                >
                  reset <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {merged.length === 0 ? (
              <div
                className="rounded-[22px] border p-10 text-center"
                style={{ background: '#fff8ef', borderColor: '#e6d7c1' }}
              >
                <p style={{ color: '#584b40' }} className="text-base mb-2">
                  Nothing yet.
                </p>
                <p className="text-xs" style={{ color: '#7d5f3d' }}>
                  Try a different word, switch to semantic mode, or clear the filters above.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {merged.map((hit) =>
                  hit.kind === 'case' ? (
                    <CaseCard key={`c-${hit.id}`} hit={hit} />
                  ) : hit.kind === 'campaign' ? (
                    <CampaignCard key={`m-${hit.id}`} hit={hit} />
                  ) : (
                    <EvidenceCard key={`e-${hit.id}`} hit={hit} />
                  ),
                )}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Result cards
// ---------------------------------------------------------------------------

function CaseCard({ hit }: { hit: CaseHit }) {
  return (
    <li>
      <Link
        href={`/justice-matrix/cases/${hit.id}`}
        className="block rounded-[18px] border p-5 transition-colors hover:bg-white group"
        style={{
          background: '#fff8ef',
          borderColor: '#e6d7c1',
          boxShadow: '0 12px 28px rgba(49,31,15,0.05)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="hidden md:flex h-9 w-9 shrink-0 rounded-full items-center justify-center"
            style={{ background: '#f3eadb', color: '#4a2560' }}
            aria-hidden
          >
            <Scale className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5 text-[11px]">
              <KindBadge kind="case" />
              <span
                className="font-semibold uppercase tracking-[0.2em]"
                style={{ color: '#8d6a44' }}
              >
                {hit.jurisdiction}
              </span>
              {hit.year && <span style={{ color: '#5e5145' }}>· {hit.year}</span>}
              {hit.court && <span style={{ color: '#5e5145' }}>· {hit.court}</span>}
              {hit.outcome && <OutcomeBadge outcome={hit.outcome} />}
              {hit.precedent_strength === 'high' && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] border"
                  style={{ background: '#faf5ec', borderColor: '#dbc7a9', color: '#7d5f3d' }}
                >
                  high precedent
                </span>
              )}
              {hit.distance !== null && (
                <span className="opacity-50" style={{ color: '#5e5145' }}>
                  · {(1 - hit.distance).toFixed(2)}
                </span>
              )}
            </div>
            <h3
              style={{ fontFamily: DISPLAY, fontWeight: 500, color: '#2b2530' }}
              className="text-xl md:text-2xl leading-tight mb-1.5"
            >
              {hit.title}
            </h3>
            {hit.excerpt && (
              <p className="text-sm leading-6 line-clamp-2" style={{ color: '#584b40' }}>
                {hit.excerpt}
              </p>
            )}
            {hit.categories && hit.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {hit.categories.slice(0, 5).map((c) => (
                  <span
                    key={c}
                    className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{ background: '#f3eadb', color: '#5e5145', border: '1px solid #eadfce' }}
                  >
                    {c}
                  </span>
                ))}
                {hit.categories.length > 5 && (
                  <span className="text-[10px] self-center" style={{ color: '#7d5f3d' }}>
                    +{hit.categories.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>
          <ArrowRight
            className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity self-center"
            style={{ color: '#4a2560' }}
          />
        </div>
      </Link>
    </li>
  );
}

function CampaignCard({ hit }: { hit: CampaignHit }) {
  return (
    <li>
      <Link
        href={`/justice-matrix/campaigns/${hit.id}`}
        className="block rounded-[18px] border p-5 transition-colors hover:bg-white group"
        style={{
          background: '#fff8ef',
          borderColor: '#e6d7c1',
          boxShadow: '0 12px 28px rgba(49,31,15,0.05)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="hidden md:flex h-9 w-9 shrink-0 rounded-full items-center justify-center"
            style={{ background: '#f3eadb', color: '#a96a1c' }}
            aria-hidden
          >
            <Megaphone className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5 text-[11px]">
              <KindBadge kind="campaign" />
              {hit.region && (
                <span
                  className="font-semibold uppercase tracking-[0.2em]"
                  style={{ color: '#8d6a44' }}
                >
                  {hit.region}
                </span>
              )}
              {hit.start_year && <span style={{ color: '#5e5145' }}>· {hit.start_year}</span>}
              {hit.is_ongoing && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] border"
                  style={{ background: 'rgba(61,111,74,0.14)', borderColor: '#9fc3a6', color: '#3d6f4a' }}
                >
                  active
                </span>
              )}
              {hit.distance !== null && (
                <span className="opacity-50" style={{ color: '#5e5145' }}>
                  · {(1 - hit.distance).toFixed(2)}
                </span>
              )}
            </div>
            <h3
              style={{ fontFamily: DISPLAY, fontWeight: 500, color: '#2b2530' }}
              className="text-xl md:text-2xl leading-tight mb-1.5"
            >
              {hit.title}
            </h3>
            {hit.excerpt && (
              <p className="text-sm leading-6 line-clamp-2" style={{ color: '#584b40' }}>
                {hit.excerpt}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px]" style={{ color: '#7d5f3d' }}>
              {hit.lead_organizations && (
                <span>Led by {hit.lead_organizations.split(',').slice(0, 2).join(', ')}</span>
              )}
              {hit.campaign_link && (
                <a
                  href={hit.campaign_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 underline"
                  style={{ color: '#4a2560' }}
                >
                  <ExternalLink className="w-3 h-3" />
                  source
                </a>
              )}
            </div>
            {hit.categories && hit.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {hit.categories.slice(0, 5).map((c) => (
                  <span
                    key={c}
                    className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{ background: '#f3eadb', color: '#5e5145', border: '1px solid #eadfce' }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
          <ArrowRight
            className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity self-center"
            style={{ color: '#4a2560' }}
          />
        </div>
      </Link>
    </li>
  );
}

function EvidenceCard({ hit }: { hit: EvidenceHit }) {
  // No internal detail route for evidence — link out to the source when present,
  // otherwise render as a static card. Either way it is badged "Evidence" and
  // labelled Australia so it never reads as a litigation precedent.
  const inner = (
    <div className="flex items-start gap-4">
      <div
        className="hidden md:flex h-9 w-9 shrink-0 rounded-full items-center justify-center"
        style={{ background: '#e3efee', color: '#1f6f78' }}
        aria-hidden
      >
        <BookOpen className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5 text-[11px]">
          <KindBadge kind="evidence" />
          {hit.restricted && <ConsentBadge />}
          <span className="font-semibold uppercase tracking-[0.2em]" style={{ color: '#8d6a44' }}>
            {hit.jurisdiction}
          </span>
          {hit.evidence_type && <span style={{ color: '#5e5145' }}>· {hit.evidence_type}</span>}
          {hit.year && <span style={{ color: '#5e5145' }}>· {hit.year}</span>}
          {hit.distance !== null && (
            <span className="opacity-50" style={{ color: '#5e5145' }}>
              · {(1 - hit.distance).toFixed(2)}
            </span>
          )}
        </div>
        <h3
          style={{ fontFamily: DISPLAY, fontWeight: 500, color: '#2b2530' }}
          className="text-xl md:text-2xl leading-tight mb-1.5"
        >
          {hit.title}
        </h3>
        {hit.excerpt && (
          <p className="text-sm leading-6 line-clamp-2" style={{ color: '#584b40' }}>
            {hit.excerpt}
          </p>
        )}
        {hit.cultural_safety && (
          <p className="text-[11px] mt-2 italic" style={{ color: '#1f6f78' }}>
            {hit.cultural_safety}
          </p>
        )}
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px]"
          style={{ color: '#7d5f3d' }}
        >
          {hit.organization && <span>{hit.organization}</span>}
          {hit.author && <span>· {hit.author}</span>}
          {hit.restricted ? (
            <span className="italic" style={{ color: '#a96a1c' }}>
              · Community controlled — access on request
            </span>
          ) : (
            hit.source_url && (
              <span
                className="inline-flex items-center gap-1 underline"
                style={{ color: '#1f6f78' }}
              >
                <ExternalLink className="w-3 h-3" />
                source
              </span>
            )
          )}
        </div>
      </div>
      {hit.source_url && (
        <ArrowRight
          className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity self-center"
          style={{ color: '#1f6f78' }}
        />
      )}
    </div>
  );

  const cardStyle = {
    background: '#fff8ef',
    borderColor: '#e6d7c1',
    boxShadow: '0 12px 28px rgba(49,31,15,0.05)',
  } as const;

  return (
    <li>
      {hit.source_url ? (
        <a
          href={hit.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-[18px] border p-5 transition-colors hover:bg-white group"
          style={cardStyle}
        >
          {inner}
        </a>
      ) : (
        <div className="block rounded-[18px] border p-5 group" style={cardStyle}>
          {inner}
        </div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Small UI bits
// ---------------------------------------------------------------------------

function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string; icon?: React.ReactNode }>;
}) {
  return (
    <div
      className="inline-flex rounded-full p-1 border"
      style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)' }}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition-colors"
            style={
              active
                ? { background: '#f8f1e6', color: '#2b2530' }
                : { background: 'transparent', color: '#eadff2' }
            }
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-2.5"
        style={{ color: '#8d6a44' }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function FacetChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold border transition-colors"
      style={
        active
          ? { background: '#4a2560', borderColor: '#4a2560', color: '#f8f1e6' }
          : { background: '#fff8ef', borderColor: '#e6d7c1', color: '#4a2560' }
      }
    >
      {children}
    </button>
  );
}

function KindBadge({ kind }: { kind: 'case' | 'campaign' | 'evidence' }) {
  const palette =
    kind === 'case'
      ? { background: 'rgba(74,37,96,0.08)', borderColor: '#c8b2d4', color: '#4a2560' }
      : kind === 'campaign'
      ? { background: 'rgba(169,106,28,0.08)', borderColor: '#dbbf90', color: '#a96a1c' }
      : { background: 'rgba(31,111,120,0.10)', borderColor: '#9cc3c8', color: '#1f6f78' };
  const label = kind === 'case' ? 'Case' : kind === 'campaign' ? 'Campaign' : 'Evidence';
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] border"
      style={palette}
    >
      {label}
    </span>
  );
}

function ConsentBadge() {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] border"
      style={{ background: 'rgba(169,106,28,0.10)', borderColor: '#dbbf90', color: '#a96a1c' }}
      title="Community controlled — title and provenance shown; full study available on request"
    >
      Community controlled
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const palette =
    outcome === 'favorable'
      ? { bg: 'rgba(61,111,74,0.15)', color: '#3d6f4a', border: '#9fc3a6' }
      : outcome === 'adverse'
      ? { bg: 'rgba(138,42,42,0.12)', color: '#8a2a2a', border: '#d6a0a0' }
      : { bg: 'rgba(169,106,28,0.12)', color: '#a96a1c', border: '#dbbf90' };
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] border"
      style={{ background: palette.bg, color: palette.color, borderColor: palette.border }}
    >
      {outcome}
    </span>
  );
}
