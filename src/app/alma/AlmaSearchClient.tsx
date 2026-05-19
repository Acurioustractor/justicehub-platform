'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Star,
  Heart,
  Beaker,
  X,
  Navigation as NavIcon,
  BookOpen,
} from 'lucide-react';
import { STATE_NAMES } from '@/lib/constants';
import { stateFromPostcode } from '@/lib/sa3-lookup';

export interface AlmaSearchModel {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  evidenceLevel: string | null;
  costPerYoungPerson: number | null;
  updatedAt: string | null;
  org: {
    name: string;
    slug: string;
    state: string;
    isIndigenousOrg: boolean;
  } | null;
}

interface Props {
  models: AlmaSearchModel[];
  totalCount: number;
}

const EVIDENCE_KEYS = ['Proven', 'Effective', 'Promising', 'Indigenous-led'] as const;

const EVIDENCE_STYLES: Record<
  string,
  { bg: string; text: string; icon: typeof CheckCircle; order: number }
> = {
  Proven: { bg: 'bg-[#059669]/10', text: 'text-[#059669]', icon: CheckCircle, order: 1 },
  Effective: { bg: 'bg-[#059669]/10', text: 'text-[#059669]', icon: TrendingUp, order: 2 },
  'Indigenous-led': { bg: 'bg-purple-500/10', text: 'text-purple-600', icon: Heart, order: 3 },
  Promising: { bg: 'bg-amber-500/10', text: 'text-amber-600', icon: Star, order: 4 },
  Untested: { bg: 'bg-[#0A0A0A]/5', text: 'text-[#0A0A0A]/40', icon: Beaker, order: 5 },
};

function getEvidenceKey(level: string | null): string {
  if (!level) return 'Untested';
  if (level.startsWith('Proven')) return 'Proven';
  if (level.startsWith('Effective')) return 'Effective';
  if (level.startsWith('Promising')) return 'Promising';
  if (level.startsWith('Indigenous')) return 'Indigenous-led';
  return 'Untested';
}

// Orgs with a known polished story landing point (otherwise card links to /sites/<slug>).
const STORY_LINKS: Record<string, { href: string; label: string }> = {
  oonchiumpa: { href: '/judges-on-country', label: 'Read the Judges on Country stories' },
};

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
    });
  } catch {
    return null;
  }
}

export function AlmaSearchClient({ models, totalCount }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [postcode, setPostcode] = useState('');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [indigenousOnly, setIndigenousOnly] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'pending' | 'denied' | 'unsupported' | 'done'>(
    'idle'
  );

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 150);
    return () => clearTimeout(t);
  }, [query]);

  // Postcode → state derivation
  useEffect(() => {
    if (postcode.length === 4 && /^\d{4}$/.test(postcode)) {
      const derived = stateFromPostcode(postcode);
      if (derived) setSelectedState(derived);
    }
  }, [postcode]);

  // Build filtered set
  const filtered = useMemo(() => {
    return models.filter((m) => {
      if (selectedState && m.org?.state !== selectedState) return false;
      if (indigenousOnly && !m.org?.isIndigenousOrg) return false;
      if (selectedEvidence && getEvidenceKey(m.evidenceLevel) !== selectedEvidence) return false;
      if (debouncedQuery) {
        const hay = `${m.name} ${m.org?.name || ''} ${m.description || ''} ${m.type || ''}`.toLowerCase();
        if (!hay.includes(debouncedQuery)) return false;
      }
      return true;
    });
  }, [models, selectedState, indigenousOnly, selectedEvidence, debouncedQuery]);

  // Recommended: when a state/postcode is set, surface 5 strongest-evidence orgs
  // in that state, prioritising Indigenous-led + Proven/Effective.
  const recommended = useMemo(() => {
    if (!selectedState) return [];
    const inState = models.filter((m) => m.org?.state === selectedState);
    return inState
      .slice()
      .sort((a, b) => {
        const aOrder = EVIDENCE_STYLES[getEvidenceKey(a.evidenceLevel)].order;
        const bOrder = EVIDENCE_STYLES[getEvidenceKey(b.evidenceLevel)].order;
        if (aOrder !== bOrder) return aOrder - bOrder;
        const aInd = a.org?.isIndigenousOrg ? 0 : 1;
        const bInd = b.org?.isIndigenousOrg ? 0 : 1;
        if (aInd !== bInd) return aInd - bInd;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5);
  }, [models, selectedState]);

  // Available states (only show chips for states that have at least one model)
  const availableStates = useMemo(() => {
    const seen = new Set<string>();
    for (const m of models) if (m.org?.state) seen.add(m.org.state);
    return Array.from(seen).sort();
  }, [models]);

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('unsupported');
      return;
    }
    setGeoStatus('pending');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.postcodes.io/postcodes?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&radius=2000`
          );
          // postcodes.io is UK-only; fail gracefully and ask user to enter postcode
          if (!res.ok) throw new Error('no_result');
          // Australian fallback: we cannot resolve without a server-side reverse geocoder.
          // Instead, surface a "could not resolve" state and prompt manual entry.
          throw new Error('no_au_reverse');
        } catch {
          setGeoStatus('done');
        }
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: false, timeout: 5000 }
    );
  };

  const hasFilters =
    !!debouncedQuery || !!selectedState || !!selectedEvidence || indigenousOnly || !!postcode;

  const clearAll = () => {
    setQuery('');
    setPostcode('');
    setSelectedState(null);
    setSelectedEvidence(null);
    setIndigenousOnly(false);
  };

  return (
    <>
      {/* Hero + search */}
      <section className="bg-[#0A0A0A] text-white pt-16 pb-12">
        <div className="max-w-5xl mx-auto px-6 sm:px-12">
          <p
            className="text-xs uppercase tracking-[0.3em] text-[#059669] mb-4"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Australian Living Map of Alternatives
          </p>
          <h1
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Search the Map.
          </h1>
          <p className="text-base text-white/70 max-w-2xl mb-8">
            {totalCount.toLocaleString()} community-led models across Australia. Search by name,
            place, or practice. Enter a postcode to see what is near you.
          </p>

          {/* Search bar */}
          <div className="bg-white rounded-xl shadow-lg p-2 flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-[#F5F0E8] rounded-lg">
              <Search className="w-5 h-5 text-[#0A0A0A]/40 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try 'mentoring', 'on-country', or an organisation name"
                className="flex-1 bg-transparent text-[#0A0A0A] placeholder:text-[#0A0A0A]/40 focus:outline-none text-base"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-[#F5F0E8] rounded-lg md:w-56">
              <MapPin className="w-5 h-5 text-[#0A0A0A]/40 shrink-0" />
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Postcode"
                className="flex-1 bg-transparent text-[#0A0A0A] placeholder:text-[#0A0A0A]/40 focus:outline-none text-base w-full"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              />
              {postcode && (
                <button
                  onClick={() => {
                    setPostcode('');
                    setSelectedState(null);
                  }}
                  className="text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
                  aria-label="Clear postcode"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Location + permission */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/60">
            <button
              onClick={useMyLocation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              <NavIcon className="w-3 h-3" />
              {geoStatus === 'pending' ? 'Locating…' : 'Use my location'}
            </button>
            {geoStatus === 'denied' && (
              <span className="text-white/50">Location declined. Enter a postcode instead.</span>
            )}
            {geoStatus === 'unsupported' && (
              <span className="text-white/50">Location not supported on this device.</span>
            )}
            {geoStatus === 'done' && (
              <span className="text-white/50">
                We could not auto-resolve your area. Enter your postcode and we will take it from
                there.
              </span>
            )}
            <span className="text-white/30">·</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              We do not store your location. Permission asked once, per device.
            </span>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap gap-2">
            {/* State chips */}
            {availableStates.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedState(selectedState === s ? null : s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  selectedState === s
                    ? 'bg-[#059669] text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {s}
              </button>
            ))}
            <span className="text-white/20 px-1">·</span>
            {/* Evidence chips */}
            {EVIDENCE_KEYS.map((e) => (
              <button
                key={e}
                onClick={() => setSelectedEvidence(selectedEvidence === e ? null : e)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  selectedEvidence === e
                    ? 'bg-white text-[#0A0A0A]'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {e}
              </button>
            ))}
            <span className="text-white/20 px-1">·</span>
            <button
              onClick={() => setIndigenousOnly((v) => !v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                indigenousOnly
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Indigenous-led only
            </button>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="ml-auto px-3 py-1.5 rounded-full text-xs font-semibold text-white/60 hover:text-white"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Recommended */}
      {recommended.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 sm:px-12 py-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#DC2626]" />
            <h2
              className="text-sm uppercase tracking-[0.2em] text-[#0A0A0A]/60"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Recommended in {STATE_NAMES[selectedState!] || selectedState}
            </h2>
          </div>
          <p className="text-sm text-[#0A0A0A]/60 mb-5 max-w-2xl">
            Strongest-evidence models in this state, with Indigenous-led organisations
            surfaced first.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((m) => (
              <ModelCard key={m.id} model={m} compact />
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      <section className="max-w-5xl mx-auto px-6 sm:px-12 py-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {filtered.length === totalCount
              ? `All ${totalCount.toLocaleString()} models`
              : `${filtered.length.toLocaleString()} of ${totalCount.toLocaleString()} models`}
          </h2>
          <span
            className="text-xs text-[#0A0A0A]/40"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {hasFilters ? 'filtered' : 'no filters applied'}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-8 text-center">
            <p className="text-lg font-semibold mb-2">No models match those filters.</p>
            <p className="text-sm text-[#0A0A0A]/60 mb-5 max-w-md mx-auto">
              The Map grows when communities add their own work. If you run a program that should
              be here, add it.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={clearAll}
                className="px-4 py-2 rounded-lg border border-[#0A0A0A]/20 text-sm font-semibold hover:bg-[#0A0A0A]/5"
              >
                Clear filters
              </button>
              <Link
                href="/join"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-semibold hover:bg-[#0A0A0A]/90"
              >
                Add your organisation <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.slice(0, 200).map((m) => (
              <ModelCard key={m.id} model={m} />
            ))}
          </div>
        )}
        {filtered.length > 200 && (
          <p
            className="text-xs text-[#0A0A0A]/40 text-center mt-6"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Showing first 200 results. Refine filters to narrow further.
          </p>
        )}
      </section>

      {/* Add your org */}
      <section className="max-w-5xl mx-auto px-6 sm:px-12 pb-16">
        <div className="bg-[#0A0A0A] text-white rounded-xl p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <p
                className="text-xs uppercase tracking-[0.2em] text-[#059669] mb-2"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Living Map
              </p>
              <h2
                className="text-xl font-bold tracking-tight mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Working on something that should be here?
              </h2>
              <p className="text-sm text-white/70 max-w-xl">
                The Map is community-owned. Adding your organisation takes two minutes. We verify
                with name and ABN before the entry goes public.
              </p>
            </div>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#059669]/90 transition-colors text-sm whitespace-nowrap"
            >
              Add your organisation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function ModelCard({ model, compact = false }: { model: AlmaSearchModel; compact?: boolean }) {
  const evidenceKey = getEvidenceKey(model.evidenceLevel);
  const style = EVIDENCE_STYLES[evidenceKey];
  const EvidenceIcon = style.icon;
  const storyLink = model.org ? STORY_LINKS[model.org.slug] : null;
  const updatedLabel = fmtDate(model.updatedAt);

  return (
    <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-base leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {model.name}
        </h3>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.bg} ${style.text} shrink-0`}
        >
          <EvidenceIcon className="w-3 h-3" />
          {evidenceKey}
        </span>
      </div>

      {model.org && (
        <p className="text-xs text-[#0A0A0A]/50 mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          {model.org.name} · {model.org.state}
          {model.org.isIndigenousOrg && (
            <span className="text-purple-600"> · Indigenous-led</span>
          )}
        </p>
      )}

      {!compact && model.description && (
        <p className="text-sm text-[#0A0A0A]/70 mb-3 line-clamp-2 leading-relaxed">
          {model.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {model.type && (
            <span className="text-[#0A0A0A]/50">{model.type}</span>
          )}
          {model.costPerYoungPerson && model.costPerYoungPerson < 500000 && (
            <span
              className="font-semibold text-[#059669]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {fmtCurrency(model.costPerYoungPerson)}/YP
            </span>
          )}
        </div>
        {updatedLabel && (
          <span
            className="text-[10px] text-[#0A0A0A]/30"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Verified {updatedLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#0A0A0A]/5">
        {model.org && (
          <Link
            href={`/sites/${model.org.slug}`}
            className="text-xs font-semibold text-[#0A0A0A] hover:underline inline-flex items-center gap-1"
          >
            Visit organisation <ArrowRight className="w-3 h-3" />
          </Link>
        )}
        {storyLink && (
          <>
            <span className="text-[#0A0A0A]/20">·</span>
            <Link
              href={storyLink.href}
              className="text-xs font-semibold text-[#DC2626] hover:underline inline-flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              {storyLink.label}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
