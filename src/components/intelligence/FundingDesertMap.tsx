'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LgaPoint {
  lga_name: string;
  state: string;
  tier: string;
  population: number | null;
  indigenous_pct: number | null;
  jh_funding_tracked: number | null;
  fundingPerCapita: number | null;
  fundingGap: number | null;
  desertSeverity: string | null;
}

const TIER_COLORS: Record<string, string> = {
  desert: '#DC2626',
  underfunded: '#F59E0B',
  moderate: '#059669',
  'well-funded': '#0D9488',
};

const TIER_LABELS: Record<string, string> = {
  desert: 'Funding Desert',
  underfunded: 'Underfunded',
  moderate: 'Moderate',
  'well-funded': 'Well Funded',
};

// Approximate centroids for Australian LGAs by state
// (real GeoJSON boundaries would be better but this works for bubbles)
const STATE_CENTERS: Record<string, [number, number]> = {
  NSW: [-33.0, 147.0],
  VIC: [-37.0, 144.5],
  QLD: [-22.0, 148.0],
  WA: [-28.0, 122.0],
  SA: [-32.0, 137.0],
  TAS: [-42.0, 146.5],
  NT: [-20.0, 134.0],
  ACT: [-35.3, 149.1],
};

// Jitter positions within a state so dots don't overlap
function jitterPosition(
  state: string,
  index: number,
  total: number
): [number, number] {
  const center = STATE_CENTERS[state] || [-25.0, 135.0];
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const radius = Math.min(total * 0.04, 3);
  const jitterLat = Math.sin(angle) * radius * (0.5 + Math.random() * 0.5);
  const jitterLng = Math.cos(angle) * radius * (0.5 + Math.random() * 0.5);
  return [center[0] + jitterLat, center[1] + jitterLng];
}

function formatDollars(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default function FundingDesertMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [data, setData] = useState<LgaPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch('/api/intelligence/funding-map')
      .then(r => r.json())
      .then(json => {
        setData(json.classified || []);
        setSummary(json.summary || null);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (loading || !mapRef.current || data.length === 0) return;
    if (mapInstanceRef.current) return; // Already initialized

    // Dynamic import Leaflet (client-only)
    import('leaflet').then(L => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: [-28, 135],
        zoom: 4,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 12,
      }).addTo(map);

      mapInstanceRef.current = map;
      renderMarkers(L, map, data, null);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading, data]);

  // Re-render markers when filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || data.length === 0) return;
    import('leaflet').then(L => {
      renderMarkers(L, mapInstanceRef.current, data, filterTier);
    });
  }, [filterTier, data]);

  function renderMarkers(L: any, map: any, allData: LgaPoint[], tier: string | null) {
    // Clear existing markers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker) map.removeLayer(layer);
    });

    const filtered = tier ? allData.filter(d => d.tier === tier) : allData;

    // Group by state for jittering
    const byState: Record<string, LgaPoint[]> = {};
    for (const lga of filtered) {
      if (!byState[lga.state]) byState[lga.state] = [];
      byState[lga.state].push(lga);
    }

    for (const [state, lgas] of Object.entries(byState)) {
      lgas.forEach((lga, i) => {
        const [lat, lng] = jitterPosition(state, i, lgas.length);
        const pop = lga.population || 1;
        const radius = Math.max(3, Math.min(20, Math.sqrt(pop / 1000)));
        const color = TIER_COLORS[lga.tier] || '#666';

        const marker = L.circleMarker([lat, lng], {
          radius,
          fillColor: color,
          fillOpacity: 0.7,
          color: '#000',
          weight: 1,
          opacity: 0.5,
        }).addTo(map);

        const funding = lga.jh_funding_tracked
          ? formatDollars(lga.jh_funding_tracked)
          : 'No data';
        const perCapita = lga.fundingPerCapita
          ? formatDollars(lga.fundingPerCapita) + '/person'
          : 'N/A';
        const gap = lga.fundingGap
          ? formatDollars(Math.abs(lga.fundingGap))
          : 'N/A';

        marker.bindPopup(`
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; min-width: 200px;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; font-family: 'Space Grotesk', sans-serif;">
              ${lga.lga_name}, ${lga.state}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              <span style="color: #666;">Tier:</span>
              <span style="font-weight: 600; color: ${color};">${TIER_LABELS[lga.tier] || lga.tier}</span>
              <span style="color: #666;">Population:</span>
              <span>${(lga.population || 0).toLocaleString()}</span>
              <span style="color: #666;">Indigenous:</span>
              <span>${lga.indigenous_pct || 'N/A'}%</span>
              <span style="color: #666;">Funding:</span>
              <span>${funding}</span>
              <span style="color: #666;">Per Capita:</span>
              <span>${perCapita}</span>
              ${lga.tier === 'desert' ? `<span style="color: #666;">Gap:</span><span style="color: #DC2626; font-weight: 600;">${gap}</span>` : ''}
            </div>
          </div>
        `, { maxWidth: 280 });
      });
    }
  }

  if (loading) {
    return (
      <div className="w-full h-[600px] bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[600px] bg-[#0A0A0A] flex items-center justify-center text-red-500 font-mono text-sm">
        Map error: {error}
      </div>
    );
  }

  const tierCounts = {
    desert: data.filter(d => d.tier === 'desert').length,
    underfunded: data.filter(d => d.tier === 'underfunded').length,
    moderate: data.filter(d => d.tier === 'moderate').length,
    'well-funded': data.filter(d => d.tier === 'well-funded').length,
  };

  return (
    <div>
      {/* Filter controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilterTier(null)}
          className={`px-3 py-1.5 text-xs font-bold font-mono border transition-colors ${
            !filterTier ? 'bg-white text-[#0A0A0A] border-white' : 'bg-transparent text-white/60 border-white/20 hover:border-white/40'
          }`}
        >
          All ({data.length})
        </button>
        {Object.entries(TIER_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilterTier(filterTier === key ? null : key)}
            className={`px-3 py-1.5 text-xs font-bold font-mono border transition-colors ${
              filterTier === key
                ? 'text-white border-current'
                : 'text-white/60 border-white/20 hover:border-white/40'
            }`}
            style={filterTier === key ? { borderColor: TIER_COLORS[key], color: TIER_COLORS[key] } : undefined}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-1.5"
              style={{ backgroundColor: TIER_COLORS[key] }}
            />
            {label} ({tierCounts[key as keyof typeof tierCounts]})
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="border-2 border-white/10 overflow-hidden">
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <div ref={mapRef} className="w-full h-[600px]" />
      </div>
    </div>
  );
}
