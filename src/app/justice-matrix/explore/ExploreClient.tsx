'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Scale,
  Megaphone,
  BookOpen,
  X,
  Sparkles,
  ArrowRight,
  Globe,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
  LayoutList,
  LayoutGrid,
  Layers,
  Map as MapIcon,
  ChevronRight,
} from 'lucide-react';
import { bucketJurisdiction, compareRegions } from '@/lib/justice-matrix/jurisdiction';

// ---------------------------------------------------------------------------
// Local "research tool" design tokens. Scoped to this experience only — the
// global JusticeHub editorial system (Cormorant / cream) is intentionally NOT
// used or modified here. Neutral surfaces + one brand-thread accent (JH purple)
// + mono labels for a dense, functional, search-first feel.
// ---------------------------------------------------------------------------
const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const C = {
  page: '#fafafa',
  surface: '#ffffff',
  border: '#e4e4e7',
  borderStrong: '#d4d4d8',
  ink: '#18181b',
  body: '#3f3f46',
  muted: '#71717a',
  accent: '#4a2560',
  accentSoft: 'rgba(74,37,96,0.08)',
  barBg: '#1c1420',
};
const KIND = {
  case: { label: 'Case', color: '#4a2560', soft: 'rgba(74,37,96,0.10)', border: '#c8b2d4', Icon: Scale },
  campaign: { label: 'Campaign', color: '#a96a1c', soft: 'rgba(169,106,28,0.10)', border: '#dbbf90', Icon: Megaphone },
  evidence: { label: 'Evidence', color: '#1f6f78', soft: 'rgba(31,111,120,0.10)', border: '#9cc3c8', Icon: BookOpen },
} as const;

// ---------------------------------------------------------------------------
// Types (match /api/justice-matrix/search)
// ---------------------------------------------------------------------------
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
  verified: boolean | null;
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
interface EvidenceHit {
  kind: 'evidence';
  id: string;
  title: string;
  jurisdiction: string;
  country_code: string | null;
  region: string | null;
  year: number | null;
  evidence_type: string | null;
  excerpt: string | null;
  organization: string | null;
  author: string | null;
  source_url: string | null;
  consent_level: string | null;
  cultural_safety: string | null;
  restricted: boolean;
  distance: number | null;
}
type Hit = CaseHit | CampaignHit | EvidenceHit;

type Mode = 'keyword' | 'semantic';
type TypeFilter = 'all' | 'case' | 'campaign' | 'evidence';
type Scope = 'all' | 'au' | 'global';
type Sort = 'relevance' | 'newest' | 'oldest' | 'az' | 'jurisdiction';
type View = 'list' | 'cards' | 'grouped' | 'jurisdiction';

interface Counts {
  case: number;
  campaign: number;
  evidence: number;
}
interface SearchResponse {
  mode: Mode;
  q: string;
  type: TypeFilter;
  cases: CaseHit[];
  campaigns: CampaignHit[];
  evidence: EvidenceHit[];
  counts: Counts;
  total: number;
}

export interface FacetSeed {
  topCategories: Array<[string, number]>;
  totals: { cases: number; campaigns: number; evidence: number };
}
export interface ExploreClientProps {
  facetSeed: FacetSeed;
  initial: SearchResponse;
  initialState: {
    q: string;
    mode: Mode;
    type: TypeFilter;
    scope: Scope;
    sort: Sort;
    view: View;
    cats: string[];
    outcome: string;
    strength: string;
  };
}

// ---------------------------------------------------------------------------
// Hit helpers
// ---------------------------------------------------------------------------
function hitHref(h: Hit): string {
  return `/justice-matrix/${h.kind === 'campaign' ? 'campaigns' : h.kind === 'evidence' ? 'evidence' : 'cases'}/${h.id}`;
}
function hitJurisdictionText(h: Hit): string {
  return h.kind === 'campaign' ? h.region ?? '' : h.jurisdiction ?? '';
}
function hitYear(h: Hit): number {
  return h.kind === 'campaign' ? h.start_year ?? 0 : h.year ?? 0;
}

const PAGE_STEP = 25;

export function ExploreClient({ facetSeed, initial, initialState }: ExploreClientProps) {
  const [q, setQ] = useState(initialState.q);
  const [mode, setMode] = useState<Mode>(initialState.mode);
  const [type, setType] = useState<TypeFilter>(initialState.type);
  const [scope, setScope] = useState<Scope>(initialState.scope);
  const [sort, setSort] = useState<Sort>(initialState.sort);
  const [view, setView] = useState<View>(initialState.view);
  const [cats, setCats] = useState<string[]>(initialState.cats);
  const [outcome, setOutcome] = useState<string>(initialState.outcome);
  const [strength, setStrength] = useState<string>(initialState.strength);
  const [region, setRegion] = useState<string | null>(null);

  const [results, setResults] = useState<SearchResponse>(initial);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(PAGE_STEP);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const hasFilter = Boolean(
    q || cats.length || outcome || strength || type !== 'all' || scope !== 'all' || region || mode !== 'keyword',
  );

  // --- URL sync (shareable state) ------------------------------------------
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (mode !== 'keyword') p.set('mode', mode);
    if (type !== 'all') p.set('type', type);
    if (scope !== 'all') p.set('scope', scope);
    if (cats.length) p.set('cat', cats.join(','));
    if (outcome) p.set('outcome', outcome);
    if (strength) p.set('strength', strength);
    return p.toString();
  }, [q, mode, type, scope, cats, outcome, strength]);

  const fullQuery = useMemo(() => {
    // What the UI reflects in the address bar (adds view/sort/region which are
    // client-only display concerns, not sent to the API fetch).
    const p = new URLSearchParams(queryString);
    if (sort !== 'newest') p.set('sort', sort);
    if (view !== 'list') p.set('view', view);
    return p.toString();
  }, [queryString, sort, view]);

  useEffect(() => {
    const url = fullQuery ? `?${fullQuery}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [fullQuery]);

  // --- fetch (debounced). Loads a generous working set; sort/group/region
  // bucketing happen client-side over it. ------------------------------------
  useEffect(() => {
    const ctrl = new AbortController();
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const sep = queryString ? '&' : '';
        const res = await fetch(`/api/justice-matrix/search?${queryString}${sep}limit=200`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        setResults((await res.json()) as SearchResponse);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') console.error(e);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(handle);
      ctrl.abort();
    };
  }, [queryString]);

  // Reset pagination whenever the displayed set changes shape.
  useEffect(() => setVisible(PAGE_STEP), [results, sort, region, view, type]);

  // --- keyboard: "/" focuses, Esc clears focus ------------------------------
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

  const toggleCat = useCallback((c: string) => {
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }, []);
  const clearAll = useCallback(() => {
    setQ('');
    setCats([]);
    setOutcome('');
    setStrength('');
    setType('all');
    setScope('all');
    setMode('keyword');
    setRegion(null);
  }, []);

  // --- derived: merge → region-filter → sort -------------------------------
  const all: Hit[] = useMemo(
    () => [...(results.cases ?? []), ...(results.campaigns ?? []), ...(results.evidence ?? [])],
    [results],
  );

  const regionFiltered = useMemo(() => {
    if (!region) return all;
    return all.filter((h) => bucketJurisdiction(hitJurisdictionText(h)).region === region);
  }, [all, region]);

  const sorted = useMemo(() => {
    const items = [...regionFiltered];
    if (sort === 'relevance') items.sort((a, b) => (a.distance ?? 1) - (b.distance ?? 1));
    else if (sort === 'az') items.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
    else if (sort === 'jurisdiction')
      items.sort((a, b) => {
        const ra = bucketJurisdiction(hitJurisdictionText(a)).region;
        const rb = bucketJurisdiction(hitJurisdictionText(b)).region;
        return compareRegions(ra, rb) || hitJurisdictionText(a).localeCompare(hitJurisdictionText(b));
      });
    else items.sort((a, b) => (sort === 'newest' ? hitYear(b) - hitYear(a) : hitYear(a) - hitYear(b)));
    return items;
  }, [regionFiltered, sort]);

  // Jurisdiction buckets for the browser view (cases+campaigns loaded fully;
  // evidence is all Australia → add its true count to the Australia tile).
  const regionBuckets = useMemo(() => {
    const map = new Map<string, number>();
    const bump = (text: string, n = 1) => {
      const { region: r } = bucketJurisdiction(text);
      map.set(r, (map.get(r) ?? 0) + n);
    };
    (results.cases ?? []).forEach((c) => bump(c.jurisdiction));
    (results.campaigns ?? []).forEach((m) => bump(m.region ?? ''));
    if ((results.counts?.evidence ?? 0) > 0) bump('Australia', results.counts.evidence);
    return Array.from(map.entries())
      .map(([r, count]) => ({ region: r, count }))
      .sort((a, b) => compareRegions(a.region, b.region));
  }, [results]);

  const counts = results.counts ?? { case: 0, campaign: 0, evidence: 0 };
  const totalShown = region ? regionFiltered.length : counts.case + counts.campaign + counts.evidence;
  const pageItems = sorted.slice(0, visible);

  // --- render ---------------------------------------------------------------
  return (
    <main style={{ background: C.page, color: C.ink, fontFamily: SANS }} className="min-h-screen">
      {/* STICKY SEARCH BAR */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{ background: C.barBg, borderColor: '#000' }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <Link
            href="/justice-matrix"
            className="hidden sm:flex items-center gap-2 shrink-0"
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', color: '#d3b583' }}
          >
            JUSTICE MATRIX
          </Link>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.muted }} />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search cases, campaigns, evidence…  (press /)"
              aria-label="Search the Justice Matrix"
              className="w-full rounded-md pl-9 pr-3 py-2 text-[15px] focus:outline-none"
              style={{ background: '#ffffff', color: C.ink, border: `1px solid ${C.borderStrong}` }}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-black/5"
                style={{ color: C.muted }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm shrink-0"
            style={{ background: '#ffffff', color: C.ink }}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* CONTROL STRIP */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Tabs
            value={type}
            onChange={setType}
            options={[
              { value: 'all', label: 'All', n: counts.case + counts.campaign + counts.evidence },
              { value: 'case', label: 'Cases', n: counts.case },
              { value: 'campaign', label: 'Campaigns', n: counts.campaign },
              { value: 'evidence', label: 'Evidence', n: counts.evidence },
            ]}
          />
          <div className="h-5 w-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <Seg
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            options={[
              { value: 'keyword', label: 'Keyword' },
              { value: 'semantic', label: 'Semantic', icon: <Sparkles className="w-3 h-3" /> },
            ]}
          />
          <Seg
            value={scope}
            onChange={(v) => setScope(v as Scope)}
            options={[
              { value: 'all', label: 'Everywhere' },
              { value: 'au', label: 'AU', icon: <MapPin className="w-3 h-3" /> },
              { value: 'global', label: 'Global', icon: <Globe className="w-3 h-3" /> },
            ]}
          />
          <div className="ml-auto flex items-center gap-3">
            {loading && (
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', color: '#d3b583' }} className="animate-pulse">
                SEARCHING…
              </span>
            )}
            <label className="flex items-center gap-1.5 text-xs" style={{ color: '#cbb8d6' }}>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em' }}>SORT</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="rounded px-2 py-1 text-xs"
                style={{ background: '#ffffff', color: C.ink, border: `1px solid ${C.borderStrong}` }}
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="az">A–Z</option>
                <option value="jurisdiction">Jurisdiction</option>
              </select>
            </label>
            <ViewSwitch value={view} onChange={setView} />
          </div>
        </div>
      </header>

      {/* APPLIED FILTERS + COUNT */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 flex flex-wrap items-center gap-2">
        <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
          <strong style={{ color: C.ink }}>{totalShown.toLocaleString()}</strong> result{totalShown === 1 ? '' : 's'}
          {results.mode === 'semantic' && ' · semantic'}
          {region && ` · ${region}`}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {region && <AppliedChip label={region} onRemove={() => setRegion(null)} />}
          {cats.map((c) => (
            <AppliedChip key={c} label={c} onRemove={() => toggleCat(c)} />
          ))}
          {outcome && <AppliedChip label={`outcome: ${outcome}`} onRemove={() => setOutcome('')} />}
          {strength && <AppliedChip label={`${strength} precedent`} onRemove={() => setStrength('')} />}
          {scope !== 'all' && <AppliedChip label={scope === 'au' ? 'Australia' : 'Global'} onRemove={() => setScope('all')} />}
        </div>
        {hasFilter && (
          <button type="button" onClick={clearAll} className="text-xs underline ml-1" style={{ color: C.accent }}>
            clear all
          </button>
        )}
      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 grid lg:grid-cols-[230px_1fr] gap-6">
        {/* Facet rail (desktop) */}
        <aside className="hidden lg:block">
          <FacetRail
            facetSeed={facetSeed}
            cats={cats}
            toggleCat={toggleCat}
            outcome={outcome}
            setOutcome={setOutcome}
            strength={strength}
            setStrength={setStrength}
          />
        </aside>

        {/* Results */}
        <section>
          {view === 'jurisdiction' ? (
            <JurisdictionView buckets={regionBuckets} active={region} onPick={(r) => { setRegion(r); setView('list'); }} />
          ) : sorted.length === 0 ? (
            <Empty />
          ) : view === 'grouped' ? (
            <GroupedView items={sorted} counts={counts} />
          ) : view === 'cards' ? (
            <ul className="grid sm:grid-cols-2 gap-3">
              {pageItems.map((h) => (
                <ResultCard key={`${h.kind}-${h.id}`} hit={h} />
              ))}
            </ul>
          ) : (
            <ul className="divide-y rounded-lg border" style={{ borderColor: C.border, background: C.surface }}>
              {pageItems.map((h) => (
                <ListRow key={`${h.kind}-${h.id}`} hit={h} />
              ))}
            </ul>
          )}

          {view !== 'jurisdiction' && visible < sorted.length && (
            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_STEP)}
                className="rounded-md px-4 py-2 text-sm font-medium border"
                style={{ background: C.surface, borderColor: C.borderStrong, color: C.ink }}
              >
                Show more ({sorted.length - visible} more)
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="w-[80%] max-w-xs overflow-y-auto p-5" style={{ background: C.page }}>
            <div className="flex items-center justify-between mb-4">
              <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.16em', color: C.muted }}>FILTERS</span>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close filters">
                <X className="w-5 h-5" style={{ color: C.ink }} />
              </button>
            </div>
            <FacetRail
              facetSeed={facetSeed}
              cats={cats}
              toggleCat={toggleCat}
              outcome={outcome}
              setOutcome={setOutcome}
              strength={strength}
              setStrength={setStrength}
            />
          </div>
        </div>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Control widgets
// ---------------------------------------------------------------------------
function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string; n: number }>;
}) {
  return (
    <div className="flex items-center gap-1">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[13px] font-medium transition-colors"
            style={
              active
                ? { background: '#f8f1e6', color: C.ink }
                : { background: 'transparent', color: '#e6dcea' }
            }
          >
            {o.label}
            <span style={{ fontFamily: MONO, fontSize: 10, opacity: 0.7 }}>{o.n.toLocaleString()}</span>
          </button>
        );
      })}
    </div>
  );
}

function Seg<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string; icon?: React.ReactNode }>;
}) {
  return (
    <div className="inline-flex rounded-md overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.18)' }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors"
            style={active ? { background: '#f8f1e6', color: C.ink } : { background: 'transparent', color: '#cbb8d6' }}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ViewSwitch({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  const opts: Array<{ v: View; label: string; Icon: typeof LayoutList }> = [
    { v: 'list', label: 'List', Icon: LayoutList },
    { v: 'cards', label: 'Cards', Icon: LayoutGrid },
    { v: 'grouped', label: 'Grouped', Icon: Layers },
    { v: 'jurisdiction', label: 'Map', Icon: MapIcon },
  ];
  return (
    <div className="inline-flex rounded-md overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.18)' }}>
      {opts.map(({ v, label, Icon }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            title={label}
            aria-label={label}
            className="p-1.5 transition-colors"
            style={active ? { background: '#f8f1e6', color: C.ink } : { background: 'transparent', color: '#cbb8d6' }}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}

function AppliedChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full pl-2.5 pr-1.5 py-0.5 text-xs"
      style={{ background: C.accentSoft, color: C.accent, border: `1px solid ${C.border}` }}
    >
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className="rounded-full hover:bg-black/10 p-0.5">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Facet rail
// ---------------------------------------------------------------------------
function FacetRail({
  facetSeed,
  cats,
  toggleCat,
  outcome,
  setOutcome,
  strength,
  setStrength,
}: {
  facetSeed: FacetSeed;
  cats: string[];
  toggleCat: (c: string) => void;
  outcome: string;
  setOutcome: (v: string) => void;
  strength: string;
  setStrength: (v: string) => void;
}) {
  return (
    <div className="space-y-6 lg:sticky lg:top-32">
      <FacetGroup title="Issue areas">
        <div className="flex flex-wrap gap-1.5">
          {facetSeed.topCategories.map(([c, n]) => (
            <FacetChip key={c} active={cats.includes(c)} onClick={() => toggleCat(c)}>
              {c}
              <span style={{ fontFamily: MONO, fontSize: 10, opacity: 0.6 }} className="ml-1">
                {n}
              </span>
            </FacetChip>
          ))}
        </div>
      </FacetGroup>
      <FacetGroup title="Outcome · cases">
        <div className="flex flex-wrap gap-1.5">
          {(['favorable', 'adverse', 'pending'] as const).map((o) => (
            <FacetChip key={o} active={outcome === o} onClick={() => setOutcome(outcome === o ? '' : o)}>
              {o}
            </FacetChip>
          ))}
        </div>
      </FacetGroup>
      <FacetGroup title="Precedent strength">
        <div className="flex flex-wrap gap-1.5">
          {(['high', 'medium', 'low'] as const).map((s) => (
            <FacetChip key={s} active={strength === s} onClick={() => setStrength(strength === s ? '' : s)}>
              {s}
            </FacetChip>
          ))}
        </div>
      </FacetGroup>
    </div>
  );
}

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: C.muted }} className="uppercase mb-2.5">
        {title}
      </div>
      {children}
    </div>
  );
}
function FacetChip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded px-2 py-1 text-xs font-medium transition-colors border"
      style={
        active
          ? { background: C.accent, borderColor: C.accent, color: '#fff' }
          : { background: C.surface, borderColor: C.border, color: C.body }
      }
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Result renderers
// ---------------------------------------------------------------------------
function MetaRow({ hit }: { hit: Hit }) {
  const k = KIND[hit.kind];
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1" style={{ fontFamily: MONO, fontSize: 10.5 }}>
      <span
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 uppercase tracking-wider"
        style={{ background: k.soft, color: k.color, border: `1px solid ${k.border}` }}
      >
        {k.label}
      </span>
      {hit.kind === 'evidence' && hit.restricted && (
        <span className="rounded px-1.5 py-0.5 uppercase" style={{ background: 'rgba(169,106,28,0.10)', border: '1px solid #dbbf90', color: '#a96a1c' }}>
          community controlled
        </span>
      )}
      {hit.kind === 'case' && hit.verified && (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5" style={{ background: 'rgba(61,111,74,0.12)', border: '1px solid #9fc3a6', color: '#3d6f4a' }}>
          <ShieldCheck className="w-3 h-3" /> verified
        </span>
      )}
      {hit.kind === 'case' && hit.outcome && (
        <span style={{ color: hit.outcome === 'favorable' ? '#3d6f4a' : hit.outcome === 'adverse' ? '#8a2a2a' : '#a96a1c' }}>{hit.outcome}</span>
      )}
      <span style={{ color: C.muted }}>{hitJurisdictionText(hit) || (hit.kind === 'evidence' ? 'Australia' : '')}</span>
      {hitYear(hit) > 0 && <span style={{ color: C.muted }}>· {hitYear(hit)}</span>}
      {hit.distance !== null && <span style={{ color: C.muted, opacity: 0.7 }}>· {(1 - hit.distance).toFixed(2)}</span>}
    </span>
  );
}

function ListRow({ hit }: { hit: Hit }) {
  const k = KIND[hit.kind];
  return (
    <li>
      <Link href={hitHref(hit)} className="group flex items-start gap-3 px-4 py-3 hover:bg-black/[0.02] transition-colors">
        <k.Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: k.color }} />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-[15px] leading-snug truncate" style={{ color: C.ink }}>
            {hit.title}
          </div>
          <div className="mt-1">
            <MetaRow hit={hit} />
          </div>
        </div>
        <ChevronRight className="w-4 h-4 self-center opacity-0 group-hover:opacity-50 shrink-0" style={{ color: C.accent }} />
      </Link>
    </li>
  );
}

function ResultCard({ hit }: { hit: Hit }) {
  const k = KIND[hit.kind];
  return (
    <li className="rounded-lg border p-4 transition-colors hover:border-zinc-300" style={{ background: C.surface, borderColor: C.border }}>
      <Link href={hitHref(hit)} className="group block">
        <MetaRow hit={hit} />
        <h3 className="mt-2 font-semibold text-[16px] leading-snug" style={{ color: C.ink }}>
          {hit.title}
        </h3>
        {hit.excerpt && (
          <p className="mt-1.5 text-sm leading-6 line-clamp-3" style={{ color: C.body }}>
            {hit.excerpt}
          </p>
        )}
        {hit.kind === 'evidence' && hit.cultural_safety && (
          <p className="mt-2 text-xs italic" style={{ color: '#1f6f78' }}>{hit.cultural_safety}</p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: k.color }}>
          <span className="inline-flex items-center gap-1 group-hover:underline">
            Open <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </Link>
    </li>
  );
}

function GroupedView({ items, counts }: { items: Hit[]; counts: Counts }) {
  const groups: Array<{ kind: Hit['kind']; total: number }> = [
    { kind: 'case', total: counts.case },
    { kind: 'campaign', total: counts.campaign },
    { kind: 'evidence', total: counts.evidence },
  ];
  return (
    <div className="space-y-8">
      {groups.map(({ kind, total }) => {
        const rows = items.filter((h) => h.kind === kind);
        if (!rows.length) return null;
        const k = KIND[kind];
        return (
          <div key={kind}>
            <div className="flex items-center gap-2 mb-2">
              <k.Icon className="w-4 h-4" style={{ color: k.color }} />
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', color: C.ink }} className="uppercase">
                {k.label}s
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{total.toLocaleString()}</span>
            </div>
            <ul className="divide-y rounded-lg border" style={{ borderColor: C.border, background: C.surface }}>
              {rows.slice(0, 8).map((h) => (
                <ListRow key={`${h.kind}-${h.id}`} hit={h} />
              ))}
            </ul>
            {rows.length > 8 && (
              <p className="mt-1.5 text-xs" style={{ color: C.muted }}>
                +{rows.length - 8} more — switch to List view or filter to this type.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function JurisdictionView({
  buckets,
  active,
  onPick,
}: {
  buckets: Array<{ region: string; count: number }>;
  active: string | null;
  onPick: (r: string) => void;
}) {
  if (!buckets.length) return <Empty />;
  const max = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div>
      <p className="text-sm mb-4" style={{ color: C.muted }}>
        Browse by jurisdiction. Australian evidence is grounded locally; cases and campaigns span international courts.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {buckets.map((b) => (
          <button
            key={b.region}
            type="button"
            onClick={() => onPick(b.region)}
            className="text-left rounded-lg border p-4 transition-colors hover:border-zinc-300"
            style={{
              background: active === b.region ? C.accentSoft : C.surface,
              borderColor: active === b.region ? C.accent : C.border,
            }}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-[15px]" style={{ color: C.ink }}>
                {b.region}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: C.accent }}>{b.count.toLocaleString()}</span>
            </div>
            <div className="mt-2 h-1 rounded-full" style={{ background: C.border }}>
              <div className="h-1 rounded-full" style={{ width: `${Math.max(6, (b.count / max) * 100)}%`, background: C.accent }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-lg border p-10 text-center" style={{ background: C.surface, borderColor: C.border }}>
      <p className="text-base mb-1" style={{ color: C.ink }}>
        No results.
      </p>
      <p className="text-sm" style={{ color: C.muted }}>
        Try a different term, switch to semantic mode, widen the scope, or clear filters.
      </p>
    </div>
  );
}
