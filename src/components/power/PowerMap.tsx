'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet tile misalignment on initial render
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Multiple invalidations to handle dynamic import + layout settling
    const timers = [100, 300, 600, 1000].map(ms =>
      setTimeout(() => map.invalidateSize(), ms)
    );
    // Also watch for container resize
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
    };
  }, [map]);
  return null;
}

interface MapLocation {
  location: string;
  org_count: number;
  total_dollars: number;
  indigenous_org_count: number;
  alma_org_count: number;
}

function formatDollars(n: number): string {
  if (n == null) return '$0';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

// Major Australian location coordinates
const LOCATION_COORDS: Record<string, [number, number]> = {
  brisbane: [-27.47, 153.03], sydney: [-33.87, 151.21], melbourne: [-37.81, 144.96],
  perth: [-31.95, 115.86], adelaide: [-34.93, 138.60], hobart: [-42.88, 147.33],
  darwin: [-12.46, 130.84], canberra: [-35.28, 149.13], townsville: [-19.26, 146.82],
  cairns: [-16.92, 145.77], toowoomba: [-27.56, 151.95], rockhampton: [-23.38, 150.51],
  mackay: [-21.14, 149.19], bundaberg: [-24.87, 152.35], gladstone: [-23.85, 151.26],
  hervey_bay: [-25.29, 152.85], maroochydore: [-26.65, 153.10], caboolture: [-27.08, 152.95],
  ipswich: [-27.62, 152.76], logan: [-27.64, 153.11], gold_coast: [-28.02, 153.43],
  mount_isa: [-20.73, 139.49], alice_springs: [-23.70, 133.88], katherine: [-14.47, 132.27],
  wollongong: [-34.42, 150.89], newcastle: [-32.93, 151.78], geelong: [-38.15, 144.36],
  ballarat: [-37.56, 143.85], bendigo: [-36.76, 144.28], shepparton: [-36.38, 145.40],
  launceston: [-41.43, 147.14], wagga_wagga: [-35.12, 147.37], dubbo: [-32.24, 148.60],
  tamworth: [-31.08, 150.93], lismore: [-28.81, 153.28], coffs_harbour: [-30.30, 153.11],
  mildura: [-34.18, 142.16], mount_gambier: [-37.83, 140.77], geraldton: [-28.77, 114.61],
  kalgoorlie: [-30.75, 121.47], broome: [-17.96, 122.24], karratha: [-20.74, 116.85],
  bunbury: [-33.33, 115.64], albany: [-35.02, 117.88], palm_island: [-18.73, 146.58],
  redfern: [-33.89, 151.21], blacktown: [-33.77, 150.91], parramatta: [-33.82, 151.00],
  penrith: [-33.75, 150.69], campbelltown: [-34.06, 150.81], liverpool: [-33.92, 150.93],
  gosford: [-33.43, 151.34], bathurst: [-33.42, 149.58], orange: [-33.28, 149.10],
  port_macquarie: [-31.43, 152.91], grafton: [-29.69, 152.93], armidale: [-30.51, 151.67],
  broken_hill: [-31.95, 141.47], queanbeyan: [-35.35, 149.23], albury: [-36.08, 146.92],
  warwick: [-28.21, 152.03], dalby: [-27.18, 151.27], emerald: [-23.53, 148.16],
  longreach: [-23.44, 144.25], roma: [-26.57, 148.79], charleville: [-26.40, 146.24],
  charters_towers: [-20.08, 146.26], innisfail: [-17.52, 146.03], atherton: [-17.27, 145.47],
  bowen: [-20.01, 148.24], ayr: [-19.57, 147.41], clermont: [-22.83, 147.64],
  blackall: [-24.42, 145.47], winton: [-22.39, 143.04], birdsville: [-25.90, 139.35],
  weipa: [-12.63, 141.88], thursday_island: [-10.58, 142.22], aurukun: [-13.37, 141.73],
  cooktown: [-15.47, 145.25], mossman: [-16.46, 145.37], mareeba: [-16.99, 145.42],
  tully: [-17.93, 145.92], cardwell: [-18.27, 146.02], proserpine: [-20.40, 148.58],
  sarina: [-21.42, 149.22], yeppoon: [-23.13, 150.74], biloela: [-24.40, 150.51],
  kingaroy: [-26.54, 151.84], gympie: [-26.19, 152.67], nambour: [-26.63, 152.96],
  noosa: [-26.39, 153.09], beaudesert: [-27.99, 153.00], gatton: [-27.56, 152.28],
  laidley: [-27.63, 152.39], stanthorpe: [-28.66, 151.93], goondiwindi: [-28.55, 150.31],
  cunnamulla: [-28.07, 145.69], st_george: [-28.04, 148.57], miles: [-26.66, 150.18],
  chinchilla: [-26.74, 150.63], wondai: [-26.32, 151.87], murgon: [-26.24, 151.94],
  cherbourg: [-26.29, 151.95], palm_beach: [-28.11, 153.47],
  // Generic normalization
  'gold coast': [-28.02, 153.43], 'sunshine coast': [-26.65, 153.10],
  'fraser coast': [-25.29, 152.85], 'moreton bay': [-27.08, 152.95],
};

function getCoords(location: string): [number, number] | null {
  const normalized = location.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '_');
  return LOCATION_COORDS[normalized] || LOCATION_COORDS[location.toLowerCase()] || null;
}

type FilterMode = 'all' | 'indigenous' | 'alma';

export default function PowerMap({ state }: { state: string }) {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/power-page?view=map&state=${state}`)
      .then(r => r.json())
      .then(d => {
        setLocations(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [state]);

  if (loading) return <div className="h-[500px] bg-gray-50 animate-pulse border border-gray-200 flex items-center justify-center text-gray-400 font-mono text-sm">LOADING MAP...</div>;
  if (!locations.length) return <div className="h-[500px] bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 font-mono text-sm">NO MAP DATA</div>;

  // Only show locations we can geocode
  const geocoded = locations
    .map(loc => ({ ...loc, coords: getCoords(loc.location) }))
    .filter((loc): loc is typeof loc & { coords: [number, number] } => loc.coords !== null);

  const filtered = geocoded.filter(loc => {
    if (filter === 'indigenous') return loc.indigenous_org_count > 0;
    if (filter === 'alma') return loc.alma_org_count > 0;
    return true;
  });

  const maxDollars = Math.max(...filtered.map(l => l.total_dollars || 1), 1);

  return (
    <div className="w-full h-[500px] border border-gray-200 relative z-0">
      {/* Filter controls */}
      <div className="absolute top-4 right-4 z-[400] bg-white border border-gray-200 p-2 shadow-sm">
        <div className="flex gap-1">
          {(['all', 'indigenous', 'alma'] as FilterMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${
                filter === mode ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {mode === 'all' ? `All (${geocoded.length})` : mode === 'indigenous' ? 'Indigenous orgs' : 'ALMA-linked'}
            </button>
          ))}
        </div>
      </div>

      <MapContainer
        center={[-25.2744, 133.7751]}
        zoom={4}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: '#f8f9fa' }}
      >
        <MapResizer />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {filtered.map((loc) => {
          const radius = Math.max(5, Math.min(25, (loc.total_dollars / maxDollars) * 25));
          const hasIndigenous = loc.indigenous_org_count > 0;
          return (
            <CircleMarker
              key={loc.location}
              center={loc.coords}
              pathOptions={{
                color: hasIndigenous ? '#059669' : '#000',
                weight: hasIndigenous ? 2 : 1,
                fillColor: hasIndigenous ? '#059669' : '#1e293b',
                fillOpacity: 0.6,
              }}
              radius={radius}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="font-bold text-sm capitalize">{loc.location.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                    <div className="flex justify-between"><span>Funding:</span> <span className="font-bold">{formatDollars(loc.total_dollars)}</span></div>
                    <div className="flex justify-between"><span>Organisations:</span> <span>{loc.org_count}</span></div>
                    {loc.indigenous_org_count > 0 && (
                      <div className="flex justify-between"><span>Indigenous orgs:</span> <span className="text-emerald-700 font-bold">{loc.indigenous_org_count}</span></div>
                    )}
                    {loc.alma_org_count > 0 && (
                      <div className="flex justify-between"><span>ALMA-linked:</span> <span className="text-blue-700 font-bold">{loc.alma_org_count}</span></div>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[400] bg-white/90 border border-gray-200 px-3 py-2 text-[10px] text-gray-500">
        {geocoded.length} of {locations.length} locations mapped | Circle size = funding amount
      </div>
    </div>
  );
}
