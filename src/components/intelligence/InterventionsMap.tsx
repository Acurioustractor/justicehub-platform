'use client';

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { OrgDetailPanel } from './OrgDetailPanel';

interface OrgPoint {
  id: string;
  name: string;
  abn: string | null;
  state: string | null;
  postcode: string | null;
  locality: string | null;
  lga: string | null;
  remoteness: string | null;
  sector: string | null;
  community_controlled: boolean;
  cc_tier: string | null;
  program_count: number;
  lat: number;
  lng: number;
  confidence: string;
}

interface UnmappableBreakdown {
  no_gs_entity_link: number;
  no_postcode_in_gs_entity: number;
  postcode_not_geocoded: number;
}

const REMOTENESS_COLORS: Record<string, string> = {
  'Major Cities of Australia': '#3b82f6',
  'Inner Regional Australia': '#10b981',
  'Outer Regional Australia': '#f59e0b',
  'Remote Australia': '#ef4444',
  'Very Remote Australia': '#dc2626',
};

const REMOTENESS_LEGEND = [
  { key: 'Major Cities of Australia', label: 'Major Cities' },
  { key: 'Inner Regional Australia', label: 'Inner Regional' },
  { key: 'Outer Regional Australia', label: 'Outer Regional' },
  { key: 'Remote Australia', label: 'Remote' },
  { key: 'Very Remote Australia', label: 'Very Remote' },
];

function radiusForCount(n: number): number {
  return 4 + Math.min(16, Math.sqrt(n) * 3);
}

export default function InterventionsMap() {
  const [points, setPoints] = useState<OrgPoint[]>([]);
  const [unmappableTotal, setUnmappableTotal] = useState(0);
  const [unmappableBreakdown, setUnmappableBreakdown] = useState<UnmappableBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnlyCC, setShowOnlyCC] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/intelligence/orgs/geo', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setPoints(d.points ?? []);
        setUnmappableTotal(d.unmappable_total ?? 0);
        setUnmappableBreakdown(d.unmappable_breakdown ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredPoints = useMemo(
    () => (showOnlyCC ? points.filter((p) => p.community_controlled) : points),
    [points, showOnlyCC],
  );

  const ccCount = useMemo(() => points.filter((p) => p.community_controlled).length, [points]);

  return (
    <section className="border-b-2 border-black bg-black">
      <div className="container-justice py-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-400 font-bold mb-1">
              Where the orgs are
            </p>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
              {filteredPoints.length} youth-justice organisations on the map
            </h2>
            <div className="text-sm mt-2 font-mono leading-relaxed" style={{ color: '#9ca3af' }}>
              <span style={{ color: '#e5e7eb' }} className="font-bold">{points.length}</span> orgs plotted at postcode-centroid coordinates from the canonical Grantscope registry.
              {unmappableBreakdown && (
                <>
                  <br />
                  <span style={{ color: '#fbbf24' }}>
                    {unmappableTotal} orgs need data fixes:{' '}
                    {unmappableBreakdown.no_gs_entity_link} need name-match to gs_entities ·{' '}
                    {unmappableBreakdown.no_postcode_in_gs_entity} have no postcode ·{' '}
                    {unmappableBreakdown.postcode_not_geocoded} need postcode geocoding
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowOnlyCC((s) => !s)}
              className={`px-3 py-1.5 border-2 text-xs font-bold uppercase tracking-widest font-mono transition-all ${
                showOnlyCC
                  ? 'border-red-500 text-red-400 bg-red-500/10'
                  : 'border-gray-700 text-gray-500 hover:border-gray-500'
              }`}
            >
              {showOnlyCC ? '✓' : '○'} Community-controlled only ({ccCount})
            </button>
          </div>
        </div>

        <div className="border-2 border-white/20 bg-[#0a0a0a]" style={{ height: 540 }}>
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-xs">
              Loading map...
            </div>
          ) : (
            <MapContainer
              center={[-27, 134]}
              zoom={4}
              scrollWheelZoom={false}
              className="w-full h-full z-0"
              style={{ background: '#0a0a0a' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {filteredPoints.map((p) => {
                const color = (p.remoteness && REMOTENESS_COLORS[p.remoteness]) || '#6b7280';
                const radius = radiusForCount(p.program_count);
                return (
                  <CircleMarker
                    key={p.id}
                    center={[p.lat, p.lng]}
                    radius={radius}
                    pathOptions={{
                      color: p.community_controlled ? '#fb7185' : '#000',
                      weight: p.community_controlled ? 2 : 1,
                      fillColor: color,
                      fillOpacity: 0.85,
                    }}
                    eventHandlers={{
                      click: () => setActiveOrgId(p.id),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -radius]}>
                      <div className="text-xs">
                        <div className="font-bold text-sm">{p.name}</div>
                        <div className="text-gray-700 text-[11px] mt-0.5">
                          {p.locality && `${p.locality}, `}{p.state} {p.postcode}
                        </div>
                        {p.lga && <div className="text-gray-600 text-[11px]">LGA · {p.lga}</div>}
                        {p.remoteness && (
                          <div className="text-[11px] mt-1" style={{ color }}>
                            {p.remoteness}
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-[11px]">
                          <span className="font-bold text-emerald-700">{p.program_count} programs</span>
                          {p.community_controlled && (
                            <span className="text-red-700 font-bold">★ Community-controlled</span>
                          )}
                        </div>
                        <div className="text-emerald-700 text-[11px] font-bold mt-1">Click for full detail →</div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-3 text-[11px] font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-gray-500 uppercase tracking-widest">Remoteness:</span>
            {REMOTENESS_LEGEND.map((it) => (
              <span key={it.key} className="flex items-center gap-1.5 text-gray-400">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: REMOTENESS_COLORS[it.key] }}
                />
                {it.label}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full inline-block bg-emerald-500" style={{ boxShadow: '0 0 0 2px #fb7185' }} />
              Community-controlled
            </span>
          </div>
          <Link href="/intelligence/funding-map" className="text-emerald-400 hover:text-emerald-300 underline">
            View the LGA funding desert map →
          </Link>
        </div>

        <p className="text-[10px] text-gray-600 mt-3 font-mono leading-relaxed">
          Data chain: <span className="text-gray-400">alma_interventions → organizations → gs_entities → postcode_geo</span>.
          Each dot represents one delivery organisation, sized by number of indexed YJ programs and coloured by ABS remoteness classification (2021).
          Community-controlled orgs (Aboriginal community-controlled, Indigenous-led, OR-flagged) carry a red stroke.
          <span className="text-emerald-400"> Click any dot for full ACNC + ABN detail.</span>
        </p>
      </div>

      {/* Side panel — slides in when an org is clicked */}
      <OrgDetailPanel orgId={activeOrgId} onClose={() => setActiveOrgId(null)} />
    </section>
  );
}
