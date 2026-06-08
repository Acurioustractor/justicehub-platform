'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  ArrowRight,
  Crosshair,
  Filter,
  LocateFixed,
  MapPinned,
  Megaphone,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { MatrixGeoPrecision } from '@/lib/justice-matrix/geo';

type LeafletModule = typeof import('leaflet');

export type MatrixMapKind = 'case' | 'campaign' | 'evidence';
export type MatrixMapSurface = 'refugee' | 'youth' | 'general';

export interface MatrixMapRecord {
  id: string;
  kind: MatrixMapKind;
  title: string;
  href: string;
  year: number | null;
  status: string | null;
  geoText: string;
  region: string;
  countryCode: string | null;
  lat: number;
  lng: number;
  precision: MatrixGeoPrecision;
  precisionLabel: string;
  geoLabel: string;
  geoReason: string;
  categories: string[];
  surface: MatrixMapSurface;
  excerpt: string | null;
  source: string | null;
  verified: boolean | null;
  humanConfirmed: boolean | null;
}

export interface MatrixMapFacetSeed {
  categories: Array<[string, number]>;
  regions: string[];
  totals: Record<MatrixMapKind, number>;
  mappedCount: number;
  unmappedCount: number;
  recordedCount: number;
  inferredCount: number;
}

type KindFilter = 'all' | MatrixMapKind;
type SurfaceFilter = 'all' | MatrixMapSurface;
type SortMode = 'newest' | 'nearest' | 'title';

const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const C = {
  surface: '#ffffff',
  border: '#e4e4e7',
  ink: '#18181b',
  body: '#3f3f46',
  muted: '#71717a',
  accent: '#4a2560',
  teal: '#1f6f78',
  amber: '#a96a1c',
  green: '#256c42',
  gold: '#d3b583',
};

const KIND_META: Record<MatrixMapKind, { label: string; color: string; icon: typeof Scale }> = {
  case: { label: 'Cases', color: C.accent, icon: Scale },
  campaign: { label: 'Campaigns', color: C.amber, icon: Megaphone },
  evidence: { label: 'Evidence', color: C.teal, icon: Sparkles },
};

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function norm(value: string): string {
  return value.trim().toLowerCase();
}

function recordText(record: MatrixMapRecord): string {
  return norm(
    [
      record.title,
      record.excerpt,
      record.source,
      record.geoText,
      record.geoLabel,
      record.region,
      record.countryCode,
      record.status,
      record.kind,
      record.surface,
      ...record.categories,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * r * Math.asin(Math.sqrt(h));
}

function jitter(record: MatrixMapRecord, index: number): [number, number] {
  if (index === 0) return [record.lat, record.lng];
  const angle = index * 2.39996323;
  const radius = Math.min(1.1, 0.045 * Math.sqrt(index));
  return [record.lat + Math.sin(angle) * radius, record.lng + Math.cos(angle) * radius];
}

function precisionRank(precision: MatrixGeoPrecision): number {
  return precision === 'recorded' ? 0 : precision === 'court' || precision === 'city' ? 1 : 2;
}

function makeMarkerIcon(L: LeafletModule, record: MatrixMapRecord, countAtPoint: number) {
  const color = KIND_META[record.kind].color;
  const count = countAtPoint > 1 ? `<span style="font-size:9px;line-height:1;font-weight:800;color:#fff;">${countAtPoint}</span>` : '';
  return L.divIcon({
    className: 'justice-matrix-marker',
    html: `
      <div style="
        position:relative;
        width:34px;
        height:34px;
        border-radius:999px;
        border:2px solid white;
        background:${color};
        box-shadow:0 10px 24px rgba(24,24,27,0.24);
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <span style="
          width:9px;
          height:9px;
          border-radius:999px;
          background:white;
          display:block;
        "></span>
        ${count ? `<span style="position:absolute;right:-5px;top:-5px;width:18px;height:18px;border-radius:999px;background:#18181b;display:flex;align-items:center;justify-content:center;border:1px solid white;">${count}</span>` : ''}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function popupHtml(record: MatrixMapRecord): string {
  const meta = KIND_META[record.kind];
  const year = record.year ? `<span>${record.year}</span>` : '';
  const status = record.status ? `<span>${escapeHtml(record.status)}</span>` : '';
  const excerpt = record.excerpt
    ? `<p style="margin:8px 0 0;color:#52525b;font-size:12px;line-height:1.45;">${escapeHtml(record.excerpt)}</p>`
    : '';
  return `
    <div style="min-width:240px;max-width:310px;font-family:Inter,system-ui,sans-serif;">
      <div style="display:flex;align-items:center;gap:6px;color:${meta.color};font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;margin-bottom:6px;">
        ${meta.label.slice(0, -1)}
      </div>
      <a href="${record.href}" style="font-size:14px;line-height:1.35;font-weight:800;color:#18181b;text-decoration:none;">${escapeHtml(record.title)}</a>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:7px;color:#71717a;font-size:11px;">
        ${year}${status}<span>${escapeHtml(record.geoLabel)}</span>
      </div>
      ${excerpt}
      <div style="margin-top:9px;padding-top:8px;border-top:1px solid #e4e4e7;color:#71717a;font-size:11px;line-height:1.35;">
        ${escapeHtml(record.precisionLabel)} · ${escapeHtml(record.geoReason)}
      </div>
      <a href="${record.href}" style="display:inline-flex;margin-top:9px;color:${meta.color};font-size:12px;font-weight:800;text-decoration:none;">Open profile →</a>
    </div>
  `;
}

function profileActionLabel(kind: MatrixMapKind) {
  if (kind === 'case') return 'Open case';
  if (kind === 'campaign') return 'Open campaign';
  return 'Open evidence';
}

export default function JusticeMatrixMapClient({
  records,
  facets,
}: {
  records: MatrixMapRecord[];
  facets: MatrixMapFacetSeed;
}) {
  const leafletRef = useRef<LeafletModule | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerLayerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [surface, setSurface] = useState<SurfaceFilter>('all');
  const [region, setRegion] = useState('all');
  const [category, setCategory] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);
  const [recordedOnly, setRecordedOnly] = useState(false);
  const [sort, setSort] = useState<SortMode>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const terms = norm(query)
      .split(/\s+/)
      .filter(Boolean);
    const rows = records.filter((record) => {
      if (kind !== 'all' && record.kind !== kind) return false;
      if (surface !== 'all' && record.surface !== surface) return false;
      if (region !== 'all' && record.region !== region) return false;
      if (category !== 'all' && !record.categories.includes(category)) return false;
      if (verifiedOnly && record.kind === 'case' && !(record.verified || record.humanConfirmed)) return false;
      if (activeOnly && record.kind === 'campaign' && record.status !== 'active') return false;
      if (recordedOnly && record.precision !== 'recorded') return false;
      if (terms.length) {
        const haystack = recordText(record);
        if (!terms.every((term) => haystack.includes(term))) return false;
      }
      return true;
    });

    rows.sort((a, b) => {
      if (sort === 'nearest' && userLocation) {
        return haversineKm(userLocation, a) - haversineKm(userLocation, b);
      }
      if (sort === 'title') return a.title.localeCompare(b.title);
      const yearDiff = (b.year ?? 0) - (a.year ?? 0);
      if (yearDiff !== 0) return yearDiff;
      const precisionDiff = precisionRank(a.precision) - precisionRank(b.precision);
      return precisionDiff || a.title.localeCompare(b.title);
    });
    return rows;
  }, [activeOnly, category, kind, query, recordedOnly, records, region, sort, surface, userLocation, verifiedOnly]);

  const selected = useMemo(
    () => filtered.find((record) => record.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  );

  const counts = useMemo(() => {
    const next: Record<MatrixMapKind, number> = { case: 0, campaign: 0, evidence: 0 };
    for (const record of filtered) next[record.kind] += 1;
    return next;
  }, [filtered]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapContainerRef.current || mapRef.current) return;
      const leaflet = await import('leaflet');
      if (cancelled || !mapContainerRef.current) return;

      leafletRef.current = leaflet;
      const map = leaflet.map(mapContainerRef.current, {
        center: [15, 15],
        zoom: 2,
        minZoom: 2,
        scrollWheelZoom: false,
        worldCopyJump: true,
      });

      leaflet
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        })
        .addTo(map);

      mapRef.current = map;
      markerLayerRef.current = leaflet.layerGroup().addTo(map);
      setLeafletReady(true);
    }

    void initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      leafletRef.current = null;
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!L || !map || !layer || !leafletReady) return;

    layer.clearLayers();
    const pointCounts = new Map<string, number>();
    const pointIndex = new Map<string, number>();
    for (const record of filtered) {
      const key = `${record.lat.toFixed(3)},${record.lng.toFixed(3)}`;
      pointCounts.set(key, (pointCounts.get(key) ?? 0) + 1);
    }

    const bounds: [number, number][] = [];
    for (const record of filtered) {
      const key = `${record.lat.toFixed(3)},${record.lng.toFixed(3)}`;
      const nextIndex = pointIndex.get(key) ?? 0;
      pointIndex.set(key, nextIndex + 1);
      const coords = jitter(record, nextIndex);
      const marker = L.marker(coords, {
        icon: makeMarkerIcon(L, record, pointCounts.get(key) ?? 1),
        title: record.title,
      });
      marker.bindPopup(popupHtml(record), { closeButton: true, maxWidth: 340 });
      marker.on('click', () => setSelectedId(record.id));
      marker.addTo(layer);
      bounds.push(coords);
    }

    if (bounds.length === 1) map.setView(bounds[0], 5);
    else if (bounds.length > 1) map.fitBounds(bounds, { padding: [42, 42], maxZoom: 7 });
  }, [filtered, leafletReady]);

  useEffect(() => {
    if (!selected || !mapRef.current) return;
    mapRef.current.flyTo([selected.lat, selected.lng], Math.max(mapRef.current.getZoom(), 4), { duration: 0.55 });
  }, [selected]);

  function resetFilters() {
    setQuery('');
    setKind('all');
    setSurface('all');
    setRegion('all');
    setCategory('all');
    setVerifiedOnly(false);
    setActiveOnly(false);
    setRecordedOnly(false);
    setSort('newest');
    setSelectedId(null);
    setLocationError(null);
  }

  function useCurrentLocation() {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Browser location is not available.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setSort('nearest');
      },
      () => setLocationError('Location permission was not granted.'),
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 },
    );
  }

  const visibleTotal = filtered.length;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-4">
        <section className="rounded-lg border p-4" style={{ background: C.surface, borderColor: C.border }}>
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <label className="block min-w-0">
              <span className="mb-1.5 block uppercase" style={{ color: C.muted, fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em' }}>
                Search all mapped records
              </span>
              <span className="relative block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: C.muted }} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-11 w-full rounded-md border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-zinc-500"
                  style={{ borderColor: C.border, color: C.ink }}
                  placeholder="Try non-refoulement, Raise the Age, Canada, detention..."
                />
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={useCurrentLocation}
                className="inline-flex h-11 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors hover:border-zinc-400"
                style={{ background: '#fff8ef', borderColor: '#eadbc5', color: C.ink }}
              >
                <LocateFixed className="h-4 w-4" />
                Near me
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-11 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors hover:border-zinc-400"
                style={{ background: '#fff', borderColor: C.border, color: C.body }}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FacetSelect label="Type" value={kind} onChange={(value) => setKind(value as KindFilter)}>
              <option value="all">All types</option>
              <option value="case">Cases</option>
              <option value="campaign">Campaigns</option>
              <option value="evidence">Evidence</option>
            </FacetSelect>
            <FacetSelect label="Surface" value={surface} onChange={(value) => setSurface(value as SurfaceFilter)}>
              <option value="all">All surfaces</option>
              <option value="refugee">Refugee & asylum</option>
              <option value="youth">Youth justice</option>
              <option value="general">Other strategic work</option>
            </FacetSelect>
            <FacetSelect label="Region" value={region} onChange={setRegion}>
              <option value="all">All regions</option>
              {facets.regions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FacetSelect>
            <FacetSelect label="Sort" value={sort} onChange={(value) => setSort(value as SortMode)}>
              <option value="newest">Newest first</option>
              <option value="title">A to Z</option>
              <option value="nearest" disabled={!userLocation}>
                Nearest to me
              </option>
            </FacetSelect>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Chip selected={category === 'all'} onClick={() => setCategory('all')}>
              All topics
            </Chip>
            {facets.categories.slice(0, 14).map(([item, count]) => (
              <Chip key={item} selected={category === item} onClick={() => setCategory(category === item ? 'all' : item)}>
                {item} <span style={{ color: category === item ? 'rgba(255,255,255,.70)' : C.muted }}>{count}</span>
              </Chip>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Toggle checked={verifiedOnly} onChange={setVerifiedOnly} label="Verified cases" />
            <Toggle checked={activeOnly} onChange={setActiveOnly} label="Active campaigns" />
            <Toggle checked={recordedOnly} onChange={setRecordedOnly} label="Recorded GPS only" />
          </div>

          {locationError && (
            <p className="mt-3 text-sm" style={{ color: '#9f1239' }}>
              {locationError}
            </p>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border" style={{ background: C.surface, borderColor: C.border }}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: C.border }}>
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <MapPinned className="h-4 w-4" style={{ color: C.accent }} />
                {visibleTotal.toLocaleString()} mapped records
              </div>
              <div className="mt-1 text-xs" style={{ color: C.muted }}>
                {counts.case.toLocaleString()} cases · {counts.campaign.toLocaleString()} campaigns · {counts.evidence.toLocaleString()} evidence
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Pill color={C.accent}>Cases</Pill>
              <Pill color={C.amber}>Campaigns</Pill>
              <Pill color={C.teal}>Evidence</Pill>
            </div>
          </div>
          <div ref={mapContainerRef} className="h-[520px] w-full md:h-[640px]" style={{ zIndex: 0 }} />
        </section>
      </div>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
        <section className="rounded-lg border p-4" style={{ background: C.surface, borderColor: C.border }}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="uppercase" style={{ color: C.muted, fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em' }}>
                Selected
              </div>
              <h2 className="mt-1 text-lg font-semibold leading-tight">{selected?.title ?? 'No record selected'}</h2>
            </div>
            <Crosshair className="h-5 w-5 shrink-0" style={{ color: C.accent }} />
          </div>
          {selected ? (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                <KindBadge kind={selected.kind} />
                {selected.year && <SmallBadge>{selected.year}</SmallBadge>}
                {selected.precision === 'recorded' && <SmallBadge>GPS</SmallBadge>}
                {selected.verified && <SmallBadge>verified</SmallBadge>}
              </div>
              <p className="mb-3 text-[13px] leading-6" style={{ color: C.body }}>
                {selected.excerpt ?? 'Open the profile for the full source record and related strategy.'}
              </p>
              <div className="mb-4 rounded-md px-3 py-2 text-xs leading-5" style={{ background: '#f4f4f5', color: C.muted }}>
                <strong style={{ color: C.ink }}>{selected.geoLabel}</strong>
                <br />
                {selected.precisionLabel}. {selected.geoReason}
              </div>
              <Link href={selected.href} className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: C.accent }}>
                {profileActionLabel(selected.kind)} <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <p className="text-sm" style={{ color: C.body }}>
              Change the filters to bring mapped records back into view.
            </p>
          )}
        </section>

        <section className="rounded-lg border" style={{ background: C.surface, borderColor: C.border }}>
          <div className="border-b px-4 py-3" style={{ borderColor: C.border }}>
            <div className="flex items-center gap-2 font-semibold">
              <Filter className="h-4 w-4" style={{ color: C.accent }} />
              Results
            </div>
            <div className="mt-1 text-xs" style={{ color: C.muted }}>
              Showing first {Math.min(filtered.length, 28).toLocaleString()} of {filtered.length.toLocaleString()}.
            </div>
          </div>
          <div className="max-h-[680px] overflow-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-sm" style={{ color: C.body }}>
                No mapped records match these filters.
              </div>
            ) : (
              filtered.slice(0, 28).map((record) => (
                <article
                  key={record.id}
                  className="border-b px-4 py-3 transition-colors hover:bg-zinc-50"
                  style={{
                    borderColor: C.border,
                    background: selected?.id === record.id ? '#faf5ff' : C.surface,
                  }}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <KindBadge kind={record.kind} />
                    {record.year && <SmallBadge>{record.year}</SmallBadge>}
                    <SmallBadge>{record.precisionLabel}</SmallBadge>
                  </div>
                  <Link href={record.href} className="mb-1 block text-sm font-semibold leading-snug hover:underline" style={{ color: C.ink }}>
                    {record.title}
                  </Link>
                  <div className="text-xs leading-5" style={{ color: C.muted }}>
                    {record.geoText}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={record.href} className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-white" style={{ background: C.accent }}>
                      {profileActionLabel(record.kind)} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSelectedId(record.id)}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-md border bg-white px-3 text-xs font-semibold transition-colors hover:border-zinc-400"
                      style={{ borderColor: C.border, color: C.body }}
                    >
                      Show on map <Crosshair className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border p-4" style={{ background: '#f8fafc', borderColor: '#dbe4ee' }}>
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-4 w-4" style={{ color: C.green }} />
            Data note
          </div>
          <p className="text-[13px] leading-6" style={{ color: C.body }}>
            {facets.recordedCount.toLocaleString()} records have stored lat/lng. {facets.inferredCount.toLocaleString()} are
            mapped from jurisdiction text. {facets.unmappedCount.toLocaleString()} records could not be placed.
          </p>
        </section>
      </aside>
    </div>
  );
}

function FacetSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block uppercase" style={{ color: C.muted, fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:border-zinc-500"
        style={{ borderColor: C.border, color: C.ink }}
      >
        {children}
      </select>
    </label>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:border-zinc-400"
      style={{
        background: selected ? C.accent : '#fff',
        borderColor: selected ? C.accent : C.border,
        color: selected ? '#fff' : C.ink,
      }}
    >
      {children}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold" style={{ borderColor: C.border, color: C.body }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[#4a2560]"
      />
      {label}
    </label>
  );
}

function KindBadge({ kind }: { kind: MatrixMapKind }) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold" style={{ background: `${meta.color}14`, color: meta.color }}>
      <Icon className="h-3 w-3" />
      {meta.label.slice(0, -1)}
    </span>
  );
}

function SmallBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full px-2 py-1 text-[11px] font-semibold" style={{ background: '#f4f4f5', color: C.muted }}>
      {children}
    </span>
  );
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold" style={{ background: `${color}14`, color }}>
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}
