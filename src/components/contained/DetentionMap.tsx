'use client';

import { useState, Component, type ReactNode } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Facility {
  name: string;
  city: string;
  state: string;
  capacity_beds: number;
  latitude: number;
  longitude: number;
  indigenous_population_percentage: number | null;
}

interface YJService {
  name: string;
  organization: string;
  latitude: number;
  longitude: number;
  evidence_level: string;
  service_role: string;
  capacity: number | null;
  state?: string;
}

interface DetentionMapProps {
  facilities: Facility[];
  services?: YJService[];
  selectedState?: string | null;
}

const STATE_VIEWS: Record<string, { center: [number, number]; zoom: number }> = {
  NSW: { center: [-33.0, 147.5], zoom: 6 },
  VIC: { center: [-37.0, 145.5], zoom: 7 },
  QLD: { center: [-22.0, 148.0], zoom: 5 },
  WA:  { center: [-28.0, 122.0], zoom: 5 },
  SA:  { center: [-31.0, 136.5], zoom: 6 },
  TAS: { center: [-42.0, 146.5], zoom: 7 },
  NT:  { center: [-19.5, 134.0], zoom: 6 },
  ACT: { center: [-35.3, 149.1], zoom: 10 },
};

const DEFAULT_CENTER: [number, number] = [-27, 134];
const DEFAULT_ZOOM = 4;

class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn('Map render error (suppressed):', error.message);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[500px] border border-gray-800 flex items-center justify-center bg-gray-950 text-gray-500">
          Map loading...
        </div>
      );
    }
    return this.props.children;
  }
}

const ROLE_COLORS: Record<string, string> = {
  diversion: '#22c55e',
  bail_support: '#3b82f6',
  post_release: '#a855f7',
  residential_therapeutic: '#ec4899',
  family_support: '#f59e0b',
  legal_aid: '#06b6d4',
  community_program: '#4ade80',
  justice_reinvestment: '#8b5cf6',
  prevention: '#94a3b8',
  other: '#6b7280',
};

const ROLE_LABELS: Record<string, string> = {
  diversion: 'Diversion',
  bail_support: 'Bail Support',
  post_release: 'Post-Release',
  residential_therapeutic: 'Therapeutic',
  family_support: 'Family Support',
  legal_aid: 'Legal Aid',
  community_program: 'Community Program',
  justice_reinvestment: 'Justice Reinvestment',
  prevention: 'Prevention',
  other: 'Other',
};

type Layer = 'facilities' | 'services';

export default function DetentionMap(props: DetentionMapProps) {
  const allFacilities = Array.isArray(props.facilities) ? props.facilities : [];
  const allServices = Array.isArray(props.services) ? props.services : [];
  const selectedState = props.selectedState || null;

  // Filter by selected state
  const facilities = selectedState
    ? allFacilities.filter(f => f.state === selectedState)
    : allFacilities;
  const services = selectedState
    ? allServices.filter(s => s.state === selectedState)
    : allServices;

  const [activeLayers, setActiveLayers] = useState<Set<Layer>>(
    () => new Set(allServices.length > 0 ? ['facilities', 'services'] : ['facilities'])
  );

  const toggleLayer = (layer: Layer) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  };

  const totalBeds = facilities.reduce((s, f) => s + (f.capacity_beds || 0), 0);

  const roleCounts: Record<string, number> = {};
  for (const svc of services) {
    if (svc.service_role) {
      roleCounts[svc.service_role] = (roleCounts[svc.service_role] || 0) + 1;
    }
  }

  return (
    <div className="relative w-full">
      <div className="w-full h-[500px] border border-gray-800">
        <MapErrorBoundary>
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={false}
            className="w-full h-full z-0"
            style={{ background: '#1a1a2e' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {activeLayers.has('services') && services.map((svc, i) => {
              const color = ROLE_COLORS[svc.service_role] || '#6b7280';
              const capRadius = svc.capacity ? Math.max(3, Math.min(8, Math.log10(svc.capacity) * 2)) : 4;
              return (
                <CircleMarker
                  key={`svc-${i}`}
                  center={[svc.latitude, svc.longitude]}
                  radius={capRadius}
                  pathOptions={{
                    color: 'transparent',
                    fillColor: color,
                    fillOpacity: 0.7,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -6]}>
                    <div className="text-xs max-w-[200px]">
                      <div className="font-bold">{svc.name}</div>
                      {svc.organization && <div className="text-gray-500">{svc.organization}</div>}
                      <div style={{ color }}>{ROLE_LABELS[svc.service_role] || svc.service_role}</div>
                      {svc.capacity && <div className="text-gray-500">~{svc.capacity} young people/yr</div>}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}

            {activeLayers.has('facilities') && facilities.map(fac => (
              <CircleMarker
                key={`glow-${fac.name}`}
                center={[fac.latitude, fac.longitude]}
                radius={Math.max(14, (fac.capacity_beds || 0) / 8)}
                pathOptions={{
                  color: 'transparent',
                  fillColor: '#ef4444',
                  fillOpacity: 0.12,
                }}
              />
            ))}

            {activeLayers.has('facilities') && facilities.map(fac => {
              const radius = Math.max(6, Math.min(14, (fac.capacity_beds || 0) / 15));
              const indigenousPct = fac.indigenous_population_percentage ?? 0;
              return (
                <CircleMarker
                  key={`fac-${fac.name}`}
                  center={[fac.latitude, fac.longitude]}
                  radius={radius}
                  pathOptions={{
                    color: '#7f1d1d',
                    weight: 2,
                    fillColor: '#ef4444',
                    fillOpacity: 0.9,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]}>
                    <div className="text-xs min-w-[140px]">
                      <div className="font-bold text-sm">{fac.name}</div>
                      <div className="text-gray-500 mb-1">{fac.city}, {fac.state}</div>
                      <div className="flex justify-between">
                        <span>Capacity</span>
                        <span className="font-bold">{fac.capacity_beds} beds</span>
                      </div>
                      {indigenousPct > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Indigenous</span>
                          <span className="font-bold">{indigenousPct}%</span>
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </MapErrorBoundary>
      </div>

      <div className="absolute top-3 right-3 z-[400] bg-gray-900/95 border border-gray-700 p-3 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Layers</div>
        <button
          onClick={() => toggleLayer('facilities')}
          className={`flex items-center gap-2 text-xs w-full text-left transition-opacity ${activeLayers.has('facilities') ? 'opacity-100' : 'opacity-40'}`}
        >
          <span className="w-3 h-3 rounded-full bg-red-500 border border-red-900 flex-shrink-0" />
          <span className="text-white">Detention ({facilities.length})</span>
          <span className="text-gray-500 ml-auto">{totalBeds.toLocaleString()} beds</span>
        </button>
        {allServices.length > 0 && (
          <button
            onClick={() => toggleLayer('services')}
            className={`flex items-center gap-2 text-xs w-full text-left transition-opacity ${activeLayers.has('services') ? 'opacity-100' : 'opacity-40'}`}
          >
            <span className="w-3 h-3 rounded-full bg-green-500 border border-green-900 flex-shrink-0" />
            <span className="text-white">YJ Services ({services.length}){selectedState ? ` in ${selectedState}` : ''}</span>
          </button>
        )}
      </div>

      {services.length > 0 && activeLayers.has('services') && (
        <div className="absolute bottom-3 left-3 z-[400] bg-gray-900/95 border border-gray-700 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Service Type</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(roleCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([role, count]) => (
                <span key={role} className="flex items-center gap-1.5 text-[10px] text-gray-300">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ROLE_COLORS[role] || '#6b7280' }} />
                  {ROLE_LABELS[role] || role} ({count})
                </span>
              ))}
          </div>
        </div>
      )}

      {(!services.length || !activeLayers.has('services')) && (
        <div className="absolute bottom-3 left-3 z-[400] bg-gray-900/95 border border-gray-700 px-3 py-2 text-xs text-white">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 border border-red-900 inline-block shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
              Detention centre
            </span>
            <span className="text-gray-500">Size = bed capacity</span>
          </div>
        </div>
      )}
    </div>
  );
}
