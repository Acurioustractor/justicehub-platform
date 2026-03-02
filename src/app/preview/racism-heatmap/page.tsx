'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { usePreviewAuth } from '@/lib/hooks/use-preview-auth';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const SYSTEM_FILTERS = [
  { label: 'Education', key: 'education', color: '#e74c3c' },
  { label: 'Health', key: 'health', color: '#f1c40f' },
  { label: 'Policing', key: 'policing', color: '#e67e22' },
  { label: 'Housing', key: 'housing', color: '#9b59b6' },
  { label: 'Employment', key: 'employment', color: '#3498db' },
  { label: 'Anti-discrimination', key: 'anti-discrimination', color: '#1abc9c' },
  { label: 'Other', key: 'other', color: '#7f8c8d' },
];

interface RegionData {
  sa3_code: string;
  sa3_name: string;
  state: string;
  total: number;
  breakdown: { system_type: string; count: number }[];
}

export default function RacismHeatmapPreviewPage() {
  const { isAuthenticated, isLoading, password, setPassword, error, handleSubmit } = usePreviewAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-orange-500" />
            <h1 className="text-3xl font-bold mb-2 text-white">Racism Heatmap</h1>
            <p className="text-gray-400">Call It Out data overlay on Community Map</p>
            <p className="text-gray-500 text-sm mt-2">This preview is password protected</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 focus:border-orange-500 focus:outline-none text-white rounded-lg"
                placeholder="Enter password"
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
            <button type="submit" className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-orange-600 transition-colors">
              View Preview
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <HeatmapView />;
}

function HeatmapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(SYSTEM_FILTERS.map((f) => f.key))
  );
  const [totalReports, setTotalReports] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'all' | '6m' | '30d'>('all');
  const dataMapRef = useRef<Map<string, RegionData>>(new Map());
  const rawDataRef = useRef<any[]>([]);

  const toggleFilter = useCallback((key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Fetch data independently of map
  useEffect(() => {
    const loadData = async () => {
      try {

        const [totalsRes, detailedRes] = await Promise.all([
          fetch('/api/reports/aggregation'),
          fetch('/api/reports/aggregation?system_type=education,health,policing,housing,employment,anti-discrimination,other'),
        ]);

        const totalsJson = await totalsRes.json();
        const detailedJson = await detailedRes.json();

        const dataMap = new Map<string, RegionData>();

        if (totalsJson.success && totalsJson.data) {
          let total = 0;
          rawDataRef.current = totalsJson.data;
          for (const row of totalsJson.data) {
            total += row.total_reports;
            dataMap.set(row.sa3_code, {
              sa3_code: row.sa3_code,
              sa3_name: row.sa3_name,
              state: row.sa3_state || '',
              total: row.total_reports,
              breakdown: [],
            });
          }
          setTotalReports(total);

        } else {

        }

        if (detailedJson.success && detailedJson.data) {
          for (const row of detailedJson.data) {
            const entry = dataMap.get(row.sa3_code);
            if (entry) {
              entry.breakdown.push({ system_type: row.system_type, count: row.report_count });
            }
          }
        }

        dataMapRef.current = dataMap;
        setDataLoaded(true);
      } catch (err) {
        console.error('Failed to load heatmap data:', err);

      }
    };

    loadData();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;


    const style: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
          ],
          tileSize: 256,
          attribution: '&copy; CARTO',
        },
      },
      layers: [{ id: 'carto-dark', type: 'raster', source: 'carto-dark' }],
    };

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style,
      center: [133.7751, -26.2744],
      zoom: 3.6,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    mapRef.current = map;

    map.on('zoomend', () => {
      setIsZoomed(map.getZoom() > 4.5);
    });

    map.once('load', () => {
      setMapReady(true);

    });

    // Fallback: if load doesn't fire within 3s, force ready
    const timeout = setTimeout(() => {
      if (!mapRef.current) return;
      setMapReady(true);

    }, 3000);

    return () => {
      clearTimeout(timeout);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add/update markers when map ready, data loaded, or filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filtersKey = [...activeFilters].sort().join(',');

  useEffect(() => {
    if (!mapRef.current || !mapReady || !dataLoaded) return;
    const map = mapRef.current;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Calculate time cutoff
    const now = new Date();
    const cutoff = timePeriod === '30d'
      ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      : timePeriod === '6m'
        ? new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        : null;

    const rows = rawDataRef.current;
    let added = 0;
    let filteredTotal = 0;

    for (const row of rows) {
      if (!row.centroid_lng || !row.centroid_lat || row.total_reports <= 0) continue;

      // Time filter: skip regions whose latest report is older than cutoff
      if (cutoff && row.latest_report) {
        const latest = new Date(row.latest_report);
        if (latest < cutoff) continue;
      }

      // Calculate filtered count for this region
      const entry = dataMapRef.current.get(row.sa3_code);
      let count = 0;
      if (entry && entry.breakdown.length > 0) {
        count = entry.breakdown
          .filter((b) => activeFilters.has(b.system_type))
          .reduce((sum, b) => sum + b.count, 0);
      } else {
        // No breakdown data — show total if all filters are active
        count = activeFilters.size === SYSTEM_FILTERS.length ? row.total_reports : 0;
      }

      if (count <= 0) continue;

      filteredTotal += count;
      const size = count >= 8 ? 52 : count >= 5 ? 42 : count >= 3 ? 34 : 28;
      const color = count >= 8 ? '#9b59b6' : count >= 5 ? '#e74c3c' : count >= 3 ? '#e67e22' : '#f39c12';

      // Outer wrapper for MapLibre positioning (don't touch its transform!)
      const el = document.createElement('div');
      el.style.cssText = `width: ${size}px; height: ${size}px; cursor: pointer;`;
      el.title = `${row.sa3_name}: ${count} reports`;

      // Inner circle for visuals + hover effect
      const inner = document.createElement('div');
      inner.style.cssText = `
        width: 100%; height: 100%; border-radius: 50%;
        background: ${color}; border: 2px solid #e2725b;
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-weight: 700; font-size: ${size > 40 ? 15 : 13}px;
        box-shadow: 0 0 ${size / 2}px ${color}66, 0 2px 8px rgba(0,0,0,.5);
        transition: transform 0.15s;
      `;
      inner.textContent = String(count);
      el.appendChild(inner);

      // Animate in with stagger delay
      inner.style.opacity = '0';
      inner.style.transform = 'scale(0)';
      setTimeout(() => {
        inner.style.opacity = '1';
        inner.style.transform = 'scale(1)';
      }, 100 + added * 60);

      // Hover: scale + popup tooltip
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: [0, -(size / 2 + 4)],
        className: 'heatmap-tooltip',
      }).setHTML(`<strong>${row.sa3_name}</strong> <span style="color:#e2725b">${count}</span> reports`);

      el.addEventListener('mouseenter', () => {
        inner.style.transform = 'scale(1.15)';
        popup.setLngLat([row.centroid_lng, row.centroid_lat]).addTo(map);
      });
      el.addEventListener('mouseleave', () => {
        inner.style.transform = 'scale(1)';
        popup.remove();
      });

      el.addEventListener('click', (evt) => {
        evt.stopPropagation();
        // Fly map to clicked region
        map.flyTo({ center: [row.centroid_lng, row.centroid_lat], zoom: 8, duration: 1200 });
        // Build filtered breakdown for the detail panel
        const filteredBreakdown = (entry?.breakdown || [])
          .filter((b) => activeFilters.has(b.system_type));
        setSelectedRegion({
          sa3_code: row.sa3_code,
          sa3_name: row.sa3_name,
          state: entry?.state || row.sa3_state || '',
          total: count,
          breakdown: filteredBreakdown,
        });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([row.centroid_lng, row.centroid_lat])
        .addTo(map);

      markersRef.current.push(marker);
      added++;
    }

    setTotalReports(filteredTotal);
  }, [mapReady, dataLoaded, filtersKey, timePeriod]);

  const maxBreakdown = selectedRegion
    ? Math.max(...selectedRegion.breakdown.map((b) => b.count), 1)
    : 1;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1a1a2e', color: '#e0e0e0', fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column', zIndex: 40 }}>
      <style>{`
        .heatmap-tooltip .maplibregl-popup-content {
          background: #16213e; color: #e0e0e0; padding: 6px 10px;
          border-radius: 6px; font-size: 12px; border: 1px solid #2a2a4a;
          box-shadow: 0 4px 12px rgba(0,0,0,.4);
        }
        .heatmap-tooltip .maplibregl-popup-tip {
          border-top-color: #16213e;
        }
      `}</style>
      {/* Header */}
      <header style={{ background: '#16213e', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #e2725b', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
            Justice<span style={{ color: '#e2725b' }}>Hub</span>
          </div>
          <span style={{ color: '#2a2a4a' }}>|</span>
          <span style={{ color: '#e2725b', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Racism Heatmap
          </span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/preview" style={{ color: '#8a8aa0', textDecoration: 'none', fontSize: 13 }}>
            &larr; Previews
          </Link>
          <Link href="/community-map" style={{ color: '#8a8aa0', textDecoration: 'none', fontSize: 14 }}>Community Map</Link>
          <Link href="/call-it-out" style={{ color: '#e2725b', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Call It Out</Link>
        </nav>
      </header>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ width: 280, background: '#16213e', padding: 20, borderRight: '1px solid #2a2a4a', overflowY: 'auto', flexShrink: 0 }}>
          <h3 style={{ fontSize: 12, color: '#8a8aa0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>
            Discrimination Reports
          </h3>
          <p style={{ fontSize: 13, color: '#8a8aa0', marginBottom: 20, lineHeight: 1.5 }}>
            Call It Out data overlaid on Community Map. Aggregated by SA3 region. Click a region to explore.
          </p>

          <h3 style={{ fontSize: 12, color: '#8a8aa0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
            Time Period
          </h3>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as 'all' | '6m' | '30d')}
            style={{
              width: '100%', padding: '8px 12px', marginBottom: 20,
              background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #2a2a4a',
              borderRadius: 6, fontSize: 13, cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="all">All time</option>
            <option value="6m">Last 6 months</option>
            <option value="30d">Last 30 days</option>
          </select>

          <h3 style={{ fontSize: 12, color: '#8a8aa0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
            Filter by System
          </h3>

          {SYSTEM_FILTERS.map((f) => {
            const active = activeFilters.has(f.key);
            return (
              <div key={f.key} style={{ marginBottom: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 14, background: active ? 'rgba(226,114,91,.08)' : 'transparent', transition: 'background 0.15s' }}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleFilter(f.key)}
                    style={{ accentColor: f.color, width: 16, height: 16 }}
                  />
                  <span style={{ color: active ? '#e0e0e0' : '#666' }}>{f.label}</span>
                </label>
              </div>
            );
          })}

          <div style={{ marginTop: 20, padding: 14, background: 'rgba(226,114,91,.08)', borderRadius: 8, fontSize: 13, color: '#c8c8e0', border: '1px solid rgba(226,114,91,.15)' }}>
            <strong style={{ color: '#e2725b', fontSize: 18 }}>{totalReports}</strong>
            <span style={{ display: 'block', marginTop: 4 }}>
              approved reports across Australia. Data from Call It Out submissions.
            </span>
          </div>

          {/* Legend */}
          <div style={{ marginTop: 20 }}>
            <h4 style={{ fontSize: 11, color: '#8a8aa0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Report Density</h4>
            {[
              { color: '#9b59b6', size: 20, label: '8+ reports' },
              { color: '#e74c3c', size: 16, label: '5-7 reports' },
              { color: '#e67e22', size: 13, label: '3-4 reports' },
              { color: '#f39c12', size: 10, label: '1-2 reports' },
            ].map((l) => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 12 }}>
                <div style={{ width: 24, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: l.size, height: l.size, borderRadius: '50%', background: l.color, border: '2px solid #e2725b' }} />
                </div>
                <span style={{ color: '#c8c8e0' }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* How It Works */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #2a2a4a' }}>
            <h4 style={{ fontSize: 11, color: '#8a8aa0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>How It Works</h4>
            {[
              { step: '1', text: 'Someone submits a discrimination report via Call It Out' },
              { step: '2', text: 'Their postcode maps to an SA3 statistical region' },
              { step: '3', text: 'Reports are reviewed, then aggregated anonymously' },
              { step: '4', text: 'Region counts appear here — no individual data exposed' },
            ].map((s) => (
              <div key={s.step} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#e2725b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {s.step}
                </div>
                <span style={{ fontSize: 12, color: '#8a8aa0', lineHeight: 1.4 }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />
          {isZoomed && (
            <button
              onClick={() => {
                setSelectedRegion(null);
                mapRef.current?.flyTo({ center: [133.7751, -26.2744], zoom: 3.6, duration: 1000 });
              }}
              style={{
                position: 'absolute', top: 16, left: 16, zIndex: 20,
                background: '#16213e', color: '#e0e0e0', border: '1px solid #2a2a4a',
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                boxShadow: '0 4px 12px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              &larr; All of Australia
            </button>
          )}

          {!mapReady && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8aa0', fontSize: 14, zIndex: 5 }}>
              Loading map...
            </div>
          )}


          {/* Region detail panel */}
          {selectedRegion && (
            <div style={{
              position: 'absolute', right: 16, top: 16, width: 340,
              background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 12,
              padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,.5)',
              maxHeight: 'calc(100% - 32px)', overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, color: '#fff', marginBottom: 4 }}>{selectedRegion.sa3_name}</h2>
                  <div style={{ color: '#e2725b', fontSize: 13 }}>SA3 Region — {selectedRegion.state}</div>
                </div>
                <button
                  onClick={() => setSelectedRegion(null)}
                  style={{ background: 'none', border: '1px solid #2a2a4a', color: '#8a8aa0', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, fontSize: 14 }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #2a2a4a' }}>
                <span style={{ fontSize: 13, color: '#8a8aa0' }}>Total reports</span>
                <span style={{ fontSize: 16, color: '#fff', fontWeight: 700 }}>{selectedRegion.total}</span>
              </div>

              {selectedRegion.breakdown.length > 0 && (
                <div style={{ margin: '16px 0' }}>
                  <h4 style={{ fontSize: 12, color: '#8a8aa0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                    Breakdown by Type
                  </h4>
                  {selectedRegion.breakdown
                    .sort((a, b) => b.count - a.count)
                    .map((b) => {
                      const filterInfo = SYSTEM_FILTERS.find((f) => f.key === b.system_type);
                      return (
                        <div key={b.system_type} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: '#c8c8e0', width: 100, flexShrink: 0 }}>
                            {filterInfo?.label || b.system_type}
                          </span>
                          <div style={{ height: 8, borderRadius: 4, background: '#2a2a4a', flex: 1, position: 'relative', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 4,
                              width: `${(b.count / maxBreakdown) * 100}%`,
                              background: filterInfo?.color || '#7f8c8d',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#8a8aa0', width: 28, textAlign: 'right' }}>{b.count}</span>
                        </div>
                      );
                    })}
                </div>
              )}

              {selectedRegion.total === 0 && (
                <div style={{ padding: '16px 0', color: '#8a8aa0', fontSize: 13 }}>
                  No approved reports in this region yet.
                </div>
              )}

              <Link
                href={`/call-it-out?region=${encodeURIComponent(selectedRegion.sa3_name)}&state=${encodeURIComponent(selectedRegion.state)}`}
                style={{
                  display: 'block', textAlign: 'center', background: '#e2725b',
                  color: '#fff', padding: 12, borderRadius: 8, textDecoration: 'none',
                  fontWeight: 600, fontSize: 14, marginTop: 16,
                }}
              >
                Report an Incident in {selectedRegion.sa3_name}
              </Link>

              <button
                onClick={() => {
                  setSelectedRegion(null);
                  mapRef.current?.flyTo({ center: [133.7751, -26.2744], zoom: 3.6, duration: 1000 });
                }}
                style={{
                  display: 'block', width: '100%', textAlign: 'center', background: 'none',
                  border: '1px solid #2a2a4a', color: '#8a8aa0', padding: 10, borderRadius: 8,
                  cursor: 'pointer', fontSize: 13, marginTop: 8,
                }}
              >
                &larr; Zoom Out to Australia
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
