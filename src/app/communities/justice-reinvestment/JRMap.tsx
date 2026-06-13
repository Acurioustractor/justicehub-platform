'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type {
  JrSiteDetailIndex,
  JrConnectionIndex,
} from '@/lib/communities/justice-reinvestment';
import JRSidebar from './JRSidebar';

type LeafletModule = typeof import('leaflet');

export interface JrSite {
  matchName: string;
  displayName: string;
  org: string;
  state: string;
  town: string;
  lat: number | null;
  lng: number | null;
  website: string | null;
  logoUrl: string | null;
  blurb: string;
  /** Anchor profile slug when this site maps to a founding profile, else null. */
  profileSlug: string | null;
  /** Per-site detail-page slug for /communities/justice-reinvestment/[siteSlug]. */
  siteSlug: string;
}

const C = {
  cream: '#f8f1e6',
  surface: '#fff8ef',
  border: '#eadfce',
  ink: '#2b2530',
  body: '#584b40',
  muted: '#8d6a44',
  purple: '#4a2560',
};

const SERIF = "'Cormorant Garamond', Georgia, serif";

const SIDEBAR_WIDTH = 420;

const STATE_CHIPS = ['All', 'NSW', 'NT', 'QLD', 'SA', 'WA', 'VIC', 'ACT'] as const;
type StateChip = (typeof STATE_CHIPS)[number];

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Two-letter initials from a display name, for the fallback identity mark. */
function initialsOf(name: string): string {
  const words = name
    .replace(/[(),]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 'JR';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Identity mark markup: a real logo with initials onError fallback, or initials. */
function identityMarkHtml(site: JrSite): string {
  const initials = escapeHtml(initialsOf(site.displayName));
  const avatar = `
    <span style="
      display:inline-flex;align-items:center;justify-content:center;
      width:40px;height:40px;border-radius:999px;flex:0 0 auto;
      background:${C.purple};color:#f1e6f7;font-family:'IBM Plex Mono',ui-monospace,monospace;
      font-size:13px;font-weight:600;letter-spacing:.04em;
    ">${initials}</span>`;
  if (site.logoUrl) {
    return `
      <img src="${escapeHtml(site.logoUrl)}" alt="" width="40" height="40"
        style="width:40px;height:40px;border-radius:999px;object-fit:cover;flex:0 0 auto;"
        onerror="this.outerHTML='${avatar.replace(/'/g, "\\'").replace(/\n/g, '')}'" />`;
  }
  return avatar;
}

function jitter(lat: number, lng: number, index: number): [number, number] {
  if (index === 0) return [lat, lng];
  const angle = index * 2.39996323;
  const radius = Math.min(0.5, 0.04 * Math.sqrt(index));
  return [lat + Math.sin(angle) * radius, lng + Math.cos(angle) * radius];
}

function makeMarkerIcon(L: LeafletModule, initials: string) {
  return L.divIcon({
    className: 'jr-network-marker',
    html: `
      <div style="
        width:34px;height:34px;border-radius:999px;border:2px solid #fff;
        background:${C.purple};box-shadow:0 8px 20px rgba(49,31,15,0.28);
        display:flex;align-items:center;justify-content:center;
        font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;
        font-weight:600;color:#f1e6f7;letter-spacing:.02em;
      ">${escapeHtml(initials)}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function popupHtml(site: JrSite): string {
  const place = [site.town, site.state].filter(Boolean).join(', ');
  const website = site.website
    ? `<a href="${escapeHtml(site.website)}" target="_blank" rel="noopener noreferrer"
        style="display:inline-flex;margin-top:8px;color:${C.purple};font-size:12px;font-weight:600;text-decoration:none;">Visit website &rarr;</a>`
    : '';
  const profile = site.profileSlug
    ? `<a href="/communities/${escapeHtml(site.profileSlug)}"
        style="display:inline-flex;margin-top:8px;margin-left:14px;color:${C.muted};font-size:12px;font-weight:600;text-decoration:none;">View profile &rarr;</a>`
    : '';
  return `
    <div style="min-width:230px;max-width:300px;font-family:Inter,system-ui,sans-serif;">
      <div style="display:flex;align-items:center;gap:10px;">
        ${identityMarkHtml(site)}
        <div style="min-width:0;">
          <div style="font-size:14px;line-height:1.3;font-weight:700;color:${C.ink};">${escapeHtml(site.displayName)}</div>
          <div style="margin-top:2px;color:${C.muted};font-size:11px;">${escapeHtml(place)}</div>
        </div>
      </div>
      <p style="margin:8px 0 0;color:${C.body};font-size:12px;line-height:1.5;">${escapeHtml(site.org)}</p>
      <p style="margin:8px 0 0;color:#6b5d50;font-size:12px;line-height:1.5;">${escapeHtml(site.blurb)}</p>
      <div style="display:flex;flex-wrap:wrap;align-items:center;margin-top:2px;">
        ${website}${profile}
      </div>
    </div>`;
}

/** Shared state-filter chips, used both embedded and floating in full-screen. */
function StateChips({
  activeState,
  counts,
  total,
  onSelect,
  floating,
}: {
  activeState: StateChip;
  counts: Map<string, number>;
  total: number;
  onSelect: (next: StateChip) => void;
  floating?: boolean;
}) {
  return (
    <div
      className={
        floating
          ? 'flex flex-wrap gap-2 rounded-[18px] border p-2 shadow-[0_10px_30px_rgba(49,31,15,0.14)]'
          : 'flex flex-wrap gap-2'
      }
      style={floating ? { borderColor: C.border, background: C.cream } : undefined}
    >
      {STATE_CHIPS.map((chip) => {
        const selected = activeState === chip;
        const count = chip === 'All' ? total : counts.get(chip) ?? 0;
        return (
          <button
            key={chip}
            type="button"
            onClick={() => onSelect(chip)}
            className="rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors"
            style={{
              background: selected ? C.purple : C.surface,
              borderColor: selected ? C.purple : C.border,
              color: selected ? '#f1e6f7' : C.body,
            }}
          >
            {chip}
            <span
              className="ml-2 text-[11px]"
              style={{ color: selected ? '#cbb1dc' : C.muted }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * A self-contained Leaflet map instance bound to its own container. Used twice:
 * once embedded (popups, no sidebar), once in the full-screen overlay (sidebar,
 * no popups). The `mode` prop switches click behaviour.
 */
function LeafletCanvas({
  sites,
  activeState,
  mode,
  selectedMatchName,
  onMarkerClick,
}: {
  sites: JrSite[];
  activeState: StateChip;
  mode: 'embedded' | 'fullscreen';
  selectedMatchName: string | null;
  onMarkerClick: (matchName: string) => void;
}) {
  const leafletRef = useRef<LeafletModule | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const layerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerByName = useRef<Map<string, import('leaflet').Marker>>(new Map());
  const clickRef = useRef(onMarkerClick);
  clickRef.current = onMarkerClick;
  const [ready, setReady] = useState(false);

  const mappable = useMemo(
    () => sites.filter((s) => s.lat !== null && s.lng !== null),
    [sites],
  );

  const filtered = useMemo(() => {
    if (activeState === 'All') return mappable;
    return mappable.filter((s) => s.state === activeState);
  }, [mappable, activeState]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!containerRef.current || mapRef.current) return;
      const leaflet = await import('leaflet');
      if (cancelled || !containerRef.current) return;

      leafletRef.current = leaflet;
      const map = leaflet.map(containerRef.current, {
        center: [-26.5, 134],
        zoom: 4,
        minZoom: 3,
        scrollWheelZoom: mode === 'fullscreen',
      });

      leaflet
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        })
        .addTo(map);

      mapRef.current = map;
      layerRef.current = leaflet.layerGroup().addTo(map);
      setReady(true);
    }

    void initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      leafletRef.current = null;
      mapRef.current = null;
      layerRef.current = null;
      markerByName.current.clear();
    };
  }, [mode]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer || !ready) return;

    layer.clearLayers();
    markerByName.current.clear();
    const pointIndex = new Map<string, number>();
    const bounds: [number, number][] = [];

    for (const site of filtered) {
      if (site.lat === null || site.lng === null) continue;
      const key = `${site.lat.toFixed(2)},${site.lng.toFixed(2)}`;
      const idx = pointIndex.get(key) ?? 0;
      pointIndex.set(key, idx + 1);
      const coords = jitter(site.lat, site.lng, idx);
      const marker = L.marker(coords, {
        icon: makeMarkerIcon(L, initialsOf(site.displayName)),
        title: site.displayName,
      });
      if (mode === 'embedded') {
        marker.bindPopup(popupHtml(site), { closeButton: true, maxWidth: 320 });
      } else {
        marker.on('click', () => clickRef.current(site.matchName));
      }
      marker.addTo(layer);
      markerByName.current.set(site.matchName, marker);
      bounds.push(coords);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 6);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 7 });
    } else {
      map.setView([-26.5, 134], 4);
    }
  }, [filtered, ready, mode]);

  // Full-screen: keep the selected marker visible left of the sidebar by
  // panning so its pixel falls in the visible map area (left of the panel).
  useEffect(() => {
    if (mode !== 'fullscreen' || !ready || !selectedMatchName) return;
    const map = mapRef.current;
    const marker = markerByName.current.get(selectedMatchName);
    if (!map || !marker) return;
    const targetZoom = Math.max(map.getZoom(), 7);
    map.flyTo(marker.getLatLng(), targetZoom, { duration: 0.6 });
    const t = setTimeout(() => {
      map.panBy([SIDEBAR_WIDTH / 2, 0], { animate: true });
      marker.openPopup?.();
    }, 650);
    return () => clearTimeout(t);
  }, [selectedMatchName, mode, ready]);

  // Full-screen container resizes when the overlay mounts; tell Leaflet.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 60);
    return () => clearTimeout(t);
  }, [ready, mode]);

  return (
    <div ref={containerRef} className="h-full w-full" style={{ zIndex: 0 }} />
  );
}

export default function JRMap({
  sites,
  detailIndex,
  connectionIndex,
  onStateChange,
}: {
  sites: JrSite[];
  detailIndex: JrSiteDetailIndex;
  connectionIndex: JrConnectionIndex;
  /** Lets the page list below the map filter in step with the chips. */
  onStateChange?: (state: StateChip) => void;
}) {
  const [activeState, setActiveState] = useState<StateChip>('All');
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedMatchName, setSelectedMatchName] = useState<string | null>(null);

  const mappable = useMemo(
    () => sites.filter((s) => s.lat !== null && s.lng !== null),
    [sites],
  );

  const nationalBodies = useMemo(
    () => sites.filter((s) => s.lat === null || s.lng === null),
    [sites],
  );

  const filtered = useMemo(() => {
    if (activeState === 'All') return mappable;
    return mappable.filter((s) => s.state === activeState);
  }, [mappable, activeState]);

  const stateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of mappable) counts.set(s.state, (counts.get(s.state) ?? 0) + 1);
    return counts;
  }, [mappable]);

  const siteByMatchName = useMemo(() => {
    const m = new Map<string, JrSite>();
    for (const s of sites) m.set(s.matchName, s);
    return m;
  }, [sites]);

  const relatedDisplayNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of sites) m[s.matchName] = s.displayName;
    return m;
  }, [sites]);

  const selectedSite = selectedMatchName
    ? siteByMatchName.get(selectedMatchName) ?? null
    : null;

  function selectState(next: StateChip) {
    setActiveState(next);
    onStateChange?.(next);
  }

  const openFullscreen = useCallback(() => setFullscreen(true), []);
  const closeFullscreen = useCallback(() => {
    setFullscreen(false);
    setSelectedMatchName(null);
  }, []);

  const handleMarkerClick = useCallback((matchName: string) => {
    setSelectedMatchName(matchName);
  }, []);

  const handleSelectRelated = useCallback(
    (matchName: string) => {
      if (siteByMatchName.has(matchName)) setSelectedMatchName(matchName);
    },
    [siteByMatchName],
  );

  // Escape closes the full-screen overlay; lock body scroll while open.
  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (selectedMatchName) setSelectedMatchName(null);
        else closeFullscreen();
      }
    }
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [fullscreen, selectedMatchName, closeFullscreen]);

  return (
    <div>
      <StateChips
        activeState={activeState}
        counts={stateCounts}
        total={mappable.length}
        onSelect={selectState}
      />

      <div
        className="mt-5 overflow-hidden rounded-[22px] border"
        style={{ borderColor: C.border, background: C.surface }}
      >
        <div className="relative">
          <div className="h-[460px] w-full md:h-[560px]">
            <LeafletCanvas
              sites={sites}
              activeState={activeState}
              mode="embedded"
              selectedMatchName={null}
              onMarkerClick={handleMarkerClick}
            />
          </div>
          <button
            type="button"
            onClick={openFullscreen}
            className="absolute right-3 top-3 z-[500] rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] shadow-[0_8px_20px_rgba(49,31,15,0.16)] transition-colors duration-150"
            style={{ borderColor: C.border, background: C.cream, color: C.body }}
          >
            Expand map &nearr;
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6" style={{ color: C.body }}>
        Showing {filtered.length}{' '}
        {filtered.length === 1 ? 'placed site' : 'placed sites'}
        {activeState === 'All' ? '' : ` in ${activeState}`}. Each marker carries
        the lead organisation, the place it serves, and a link to its own site.
        Expand the map to open a full-screen view with a profile panel for every
        site.
      </p>

      {nationalBodies.length > 0 ? (
        <div
          className="mt-6 rounded-[20px] border p-5"
          style={{ borderColor: C.border, background: '#f3eadb' }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.muted }}
          >
            National bodies
          </p>
          <p className="mt-2 text-sm leading-6" style={{ color: C.body }}>
            These sit across the whole country rather than one place, so they
            hold the network together off the map.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {nationalBodies.map((body) => (
              <div
                key={body.matchName}
                className="rounded-[16px] border bg-[#fffaf3] p-4"
                style={{ borderColor: C.border }}
              >
                <h4
                  className="text-lg leading-6"
                  style={{ fontFamily: SERIF, fontWeight: 500, color: C.ink }}
                >
                  {body.displayName}
                </h4>
                <p className="mt-2 text-sm leading-6" style={{ color: C.body }}>
                  {body.blurb}
                </p>
                {body.website ? (
                  <Link
                    href={body.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex text-xs font-semibold"
                    style={{ color: C.purple }}
                  >
                    Visit website &rarr;
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Full-screen immersive layer */}
      {fullscreen ? (
        <div
          className="fixed inset-0 z-[1000]"
          style={{ background: C.cream }}
          role="dialog"
          aria-modal="true"
          aria-label="Justice reinvestment network, full screen map"
        >
          <div className="absolute inset-0">
            <LeafletCanvas
              sites={sites}
              activeState={activeState}
              mode="fullscreen"
              selectedMatchName={selectedMatchName}
              onMarkerClick={handleMarkerClick}
            />
          </div>

          {/* Floating filter chips, top-left */}
          <div className="absolute left-4 top-4 z-[1100] max-w-[calc(100%-120px)]">
            <StateChips
              activeState={activeState}
              counts={stateCounts}
              total={mappable.length}
              onSelect={selectState}
              floating
            />
          </div>

          {/* Close button, top-right */}
          <button
            type="button"
            onClick={closeFullscreen}
            aria-label="Close full screen map"
            className="absolute right-4 top-4 z-[1200] flex h-11 w-11 items-center justify-center rounded-full border text-xl font-semibold shadow-[0_10px_30px_rgba(49,31,15,0.18)] transition-colors duration-150"
            style={{ borderColor: C.border, background: C.cream, color: C.body }}
          >
            &times;
          </button>

          {/* Sliding sidebar */}
          <div
            className="absolute inset-y-0 right-0 z-[1150] transform overflow-hidden border-l shadow-[-20px_0_50px_rgba(49,31,15,0.18)] transition-transform duration-300 ease-out"
            style={{
              width: `min(${SIDEBAR_WIDTH}px, 100%)`,
              borderColor: C.border,
              transform: selectedSite ? 'translateX(0)' : 'translateX(100%)',
            }}
            aria-hidden={!selectedSite}
          >
            {selectedSite ? (
              <JRSidebar
                site={selectedSite}
                detail={detailIndex[selectedSite.matchName] ?? null}
                connection={connectionIndex[selectedSite.matchName] ?? null}
                relatedDisplayNames={relatedDisplayNames}
                onClose={() => setSelectedMatchName(null)}
                onSelectRelated={handleSelectRelated}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
