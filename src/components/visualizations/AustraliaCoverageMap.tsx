'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Layers, ZoomIn, ZoomOut } from 'lucide-react';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('react-leaflet').then((mod) => mod.Tooltip),
  { ssr: false }
);

// Australian state/territory centroids and boundaries
const AUSTRALIA_REGIONS: Record<string, {
  name: string;
  center: [number, number];
  color: string;
}> = {
  NSW: { name: 'New South Wales', center: [-32.0, 147.0], color: '#3B82F6' },
  VIC: { name: 'Victoria', center: [-37.0, 145.0], color: '#8B5CF6' },
  QLD: { name: 'Queensland', center: [-22.0, 145.0], color: '#EC4899' },
  WA: { name: 'Western Australia', center: [-25.0, 122.0], color: '#F59E0B' },
  SA: { name: 'South Australia', center: [-30.0, 136.0], color: '#10B981' },
  TAS: { name: 'Tasmania', center: [-42.0, 146.5], color: '#06B6D4' },
  NT: { name: 'Northern Territory', center: [-19.5, 133.0], color: '#EF4444' },
  ACT: { name: 'Australian Capital Territory', center: [-35.3, 149.1], color: '#6366F1' },
};

// Australia map bounds
const AUSTRALIA_BOUNDS: [[number, number], [number, number]] = [
  [-44.0, 112.0],
  [-10.0, 154.0],
];

const AUSTRALIA_CENTER: [number, number] = [-25.5, 134.5];

export interface ServiceLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  state: string;
  service_type?: string;
  organization?: string;
}

export interface CoverageData {
  state: string;
  services_count: number;
  interventions_count: number;
  funding_opportunities: number;
  coverage_score: number; // 0-100
}

interface AustraliaCoverageMapProps {
  services?: ServiceLocation[];
  coverageData?: CoverageData[];
  height?: string;
  showLegend?: boolean;
  onRegionClick?: (state: string) => void;
  selectedState?: string;
}

export function AustraliaCoverageMap({
  services = [],
  coverageData = [],
  height = '500px',
  showLegend = true,
  onRegionClick,
  selectedState,
}: AustraliaCoverageMapProps) {
  const [mounted, setMounted] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'services' | 'coverage'>('services');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate coverage by state
  const coverageByState = useMemo(() => {
    const map: Record<string, CoverageData> = {};

    for (const data of coverageData) {
      map[data.state] = data;
    }

    // Also calculate from services if no coverage data provided
    if (coverageData.length === 0 && services.length > 0) {
      for (const service of services) {
        if (!service.state) continue;
        if (!map[service.state]) {
          map[service.state] = {
            state: service.state,
            services_count: 0,
            interventions_count: 0,
            funding_opportunities: 0,
            coverage_score: 0,
          };
        }
        map[service.state].services_count++;
      }

      // Calculate coverage scores based on service density
      const maxServices = Math.max(...Object.values(map).map((d) => d.services_count));
      for (const state of Object.keys(map)) {
        map[state].coverage_score = Math.round(
          (map[state].services_count / maxServices) * 100
        );
      }
    }

    return map;
  }, [services, coverageData]);

  // Get coverage color based on score
  const getCoverageColor = (score: number): string => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#3B82F6'; // Blue
    if (score >= 40) return '#F59E0B'; // Amber
    if (score >= 20) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  // Get marker size based on services count
  const getMarkerRadius = (count: number): number => {
    if (count >= 100) return 25;
    if (count >= 50) return 20;
    if (count >= 20) return 15;
    if (count >= 10) return 12;
    return 8;
  };

  if (!mounted) {
    return (
      <div
        className="bg-gray-100 border-2 border-black flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-gray-500 flex items-center gap-2">
          <MapPin className="w-5 h-5 animate-pulse" />
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      {/* Layer Toggle */}
      <div className="absolute top-4 right-4 z-[1000] bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex">
          <button
            onClick={() => setActiveLayer('services')}
            className={`px-3 py-2 text-sm font-bold flex items-center gap-2 ${
              activeLayer === 'services'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Services
          </button>
          <button
            onClick={() => setActiveLayer('coverage')}
            className={`px-3 py-2 text-sm font-bold flex items-center gap-2 border-l-2 border-black ${
              activeLayer === 'coverage'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            Coverage
          </button>
        </div>
      </div>

      <MapContainer
        center={AUSTRALIA_CENTER}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        maxBounds={AUSTRALIA_BOUNDS}
        minZoom={3}
        maxZoom={10}
        className="border-2 border-black"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Coverage Layer - State circles */}
        {activeLayer === 'coverage' &&
          Object.entries(AUSTRALIA_REGIONS).map(([code, region]) => {
            const data = coverageByState[code];
            const score = data?.coverage_score || 0;
            const servicesCount = data?.services_count || 0;

            return (
              <CircleMarker
                key={code}
                center={region.center}
                radius={getMarkerRadius(servicesCount)}
                pathOptions={{
                  fillColor: getCoverageColor(score),
                  fillOpacity: 0.7,
                  color: selectedState === code ? '#000' : '#fff',
                  weight: selectedState === code ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => onRegionClick?.(code),
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} permanent={servicesCount > 10}>
                  <div className="text-center">
                    <div className="font-bold">{code}</div>
                    <div className="text-xs">{servicesCount} services</div>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{region.name}</h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Services:</span>
                        <span className="font-bold">{servicesCount}</span>
                      </div>
                      {data?.interventions_count !== undefined && (
                        <div className="flex justify-between">
                          <span>Interventions:</span>
                          <span className="font-bold">{data.interventions_count}</span>
                        </div>
                      )}
                      {data?.funding_opportunities !== undefined && (
                        <div className="flex justify-between">
                          <span>Funding Opps:</span>
                          <span className="font-bold">{data.funding_opportunities}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t">
                        <span>Coverage Score:</span>
                        <span
                          className="font-bold"
                          style={{ color: getCoverageColor(score) }}
                        >
                          {score}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* Services Layer - Individual service markers */}
        {activeLayer === 'services' &&
          services
            .filter((s) => s.latitude && s.longitude)
            .map((service) => (
              <CircleMarker
                key={service.id}
                center={[service.latitude, service.longitude]}
                radius={6}
                pathOptions={{
                  fillColor: AUSTRALIA_REGIONS[service.state]?.color || '#6B7280',
                  fillOpacity: 0.8,
                  color: '#fff',
                  weight: 1,
                }}
              >
                <Popup>
                  <div className="p-1">
                    <h4 className="font-bold">{service.name}</h4>
                    {service.organization && (
                      <p className="text-xs text-gray-600">{service.organization}</p>
                    )}
                    {service.service_type && (
                      <p className="text-xs text-gray-500 mt-1">
                        {service.service_type}
                      </p>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
      </MapContainer>

      {/* Legend */}
      {showLegend && activeLayer === 'coverage' && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-3">
          <div className="text-xs font-bold mb-2">Coverage Score</div>
          <div className="space-y-1">
            {[
              { label: 'Excellent (80%+)', color: '#10B981' },
              { label: 'Good (60-79%)', color: '#3B82F6' },
              { label: 'Fair (40-59%)', color: '#F59E0B' },
              { label: 'Low (20-39%)', color: '#F97316' },
              { label: 'Critical (<20%)', color: '#EF4444' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AustraliaCoverageMap;
