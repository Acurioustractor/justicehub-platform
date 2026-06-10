'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

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

export default function JRMap({
  sites,
  onStateChange,
}: {
  sites: JrSite[];
  /** Lets the page list below the map filter in step with the chips. */
  onStateChange?: (state: StateChip) => void;
}) {
  const leafletRef = useRef<LeafletModule | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const layerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [activeState, setActiveState] = useState<StateChip>('All');

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

  function selectState(next: StateChip) {
    setActiveState(next);
    onStateChange?.(next);
  }

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
        scrollWheelZoom: false,
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
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer || !ready) return;

    layer.clearLayers();
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
      marker.bindPopup(popupHtml(site), { closeButton: true, maxWidth: 320 });
      marker.addTo(layer);
      bounds.push(coords);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 6);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 7 });
    } else {
      map.setView([-26.5, 134], 4);
    }
  }, [filtered, ready]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {STATE_CHIPS.map((chip) => {
          const selected = activeState === chip;
          const count =
            chip === 'All' ? mappable.length : stateCounts.get(chip) ?? 0;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => selectState(chip)}
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

      <div
        className="mt-5 overflow-hidden rounded-[22px] border"
        style={{ borderColor: C.border, background: C.surface }}
      >
        <div
          ref={containerRef}
          className="h-[460px] w-full md:h-[560px]"
          style={{ zIndex: 0 }}
        />
        {!ready ? (
          <p
            className="px-5 py-3 text-xs"
            style={{ color: C.muted, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Loading the national map...
          </p>
        ) : null}
      </div>

      <p className="mt-4 text-sm leading-6" style={{ color: C.body }}>
        Showing {filtered.length}{' '}
        {filtered.length === 1 ? 'placed site' : 'placed sites'}
        {activeState === 'All' ? '' : ` in ${activeState}`}. Each marker carries
        the lead organisation, the place it serves, and a link to its own site.
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
    </div>
  );
}
