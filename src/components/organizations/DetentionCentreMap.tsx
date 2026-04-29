'use client';

import dynamic from 'next/dynamic';
import { Building2, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';

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
const Tooltip = dynamic(
  () => import('react-leaflet').then((mod) => mod.Tooltip),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface DetentionFacility {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity_beds: number | null;
  operational_status: string | null;
  government_department: string | null;
  security_level: string | null;
  partnership_count?: number;
}

interface DetentionCentreMapProps {
  facilities: DetentionFacility[];
  height?: string;
  showControls?: boolean;
}

const AUSTRALIA_CENTER: [number, number] = [-25.5, 134.5];
const AUSTRALIA_BOUNDS: [[number, number], [number, number]] = [
  [-44, 112],
  [-10, 154],
];

const STATE_VIEWS: Record<string, { label: string; center: [number, number]; zoom: number }> = {
  ACT: { label: 'Australian Capital Territory', center: [-35.28, 149.13], zoom: 10 },
  NSW: { label: 'New South Wales', center: [-32.8, 147.2], zoom: 6 },
  NT: { label: 'Northern Territory', center: [-19.5, 134], zoom: 6 },
  QLD: { label: 'Queensland', center: [-22.2, 144.8], zoom: 5 },
  SA: { label: 'South Australia', center: [-30.2, 136.5], zoom: 6 },
  TAS: { label: 'Tasmania', center: [-42, 146.6], zoom: 7 },
  VIC: { label: 'Victoria', center: [-37, 145.1], zoom: 7 },
  WA: { label: 'Western Australia', center: [-27.8, 122.5], zoom: 5 },
};

function hasCoordinates(facility: DetentionFacility) {
  return Number.isFinite(facility.latitude) && Number.isFinite(facility.longitude);
}

function markerRadius(capacityBeds: number | null) {
  if (!capacityBeds) return 7;
  return Math.max(7, Math.min(16, Math.round(capacityBeds / 12)));
}

export function DetentionCentreMap({ facilities, height = '500px', showControls = true }: DetentionCentreMapProps) {
  const [selectedState, setSelectedState] = useState('');
  const mappedFacilities = useMemo(
    () => facilities.filter(hasCoordinates),
    [facilities]
  );
  const visibleFacilities = useMemo(
    () => mappedFacilities.filter((facility) => !selectedState || facility.state === selectedState),
    [mappedFacilities, selectedState]
  );
  const stateCounts = useMemo(() => {
    return mappedFacilities.reduce<Record<string, number>>((counts, facility) => {
      const state = facility.state || 'Unknown';
      counts[state] = (counts[state] || 0) + 1;
      return counts;
    }, {});
  }, [mappedFacilities]);
  const selectedView = selectedState ? STATE_VIEWS[selectedState] : undefined;
  const singleFacilityCenter = visibleFacilities.length === 1
    ? [visibleFacilities[0].latitude as number, visibleFacilities[0].longitude as number] as [number, number]
    : undefined;
  const mapBounds = visibleFacilities.length > 1
    ? visibleFacilities.map((facility) => [facility.latitude as number, facility.longitude as number] as [number, number])
    : undefined;

  return (
    <div className="border-2 border-black bg-white">
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black bg-white p-3">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedState}
              onChange={(event) => setSelectedState(event.target.value)}
              className="border-2 border-black bg-white px-3 py-2 text-sm font-bold"
              aria-label="Filter detention centre map by state"
            >
              <option value="">All states</option>
              {Object.entries(STATE_VIEWS).map(([code, view]) => (
                <option key={code} value={code}>{view.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 text-sm font-bold">
              <Building2 className="h-4 w-4 text-red-600" />
              {visibleFacilities.length} centre{visibleFacilities.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide text-earth-500">
            Pan, zoom, and click markers for details
          </div>
        </div>
      )}

      {!showControls && (
        <div className="flex items-center gap-2 border-b-2 border-black bg-white p-3 text-sm font-bold">
          <Building2 className="h-4 w-4 text-red-600" />
          Centre location
        </div>
      )}

      <div className="relative" style={{ height }}>
        <MapContainer
          key={selectedState || 'all-states'}
          center={singleFacilityCenter || selectedView?.center || AUSTRALIA_CENTER}
          zoom={singleFacilityCenter ? 9 : selectedView?.zoom || 4}
          bounds={mapBounds || (selectedState || singleFacilityCenter ? undefined : AUSTRALIA_BOUNDS)}
          boundsOptions={{ padding: [42, 42], maxZoom: selectedState ? 8 : 5 }}
          maxBounds={AUSTRALIA_BOUNDS}
          minZoom={3}
          maxZoom={11}
          scrollWheelZoom={false}
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {visibleFacilities.map((facility) => {
            const radius = markerRadius(facility.capacity_beds);
            const isOperational = facility.operational_status === 'operational';
            const color = isOperational ? '#dc2626' : '#6b7280';

            return (
              <CircleMarker
                key={facility.id}
                center={[facility.latitude as number, facility.longitude as number]}
                radius={radius}
                pathOptions={{
                  color: '#111827',
                  weight: 2,
                  fillColor: color,
                  fillOpacity: 0.9,
                }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  <div className="min-w-[160px] text-xs">
                    <div className="font-bold">{facility.name}</div>
                    <div>{facility.city || 'Unknown'}, {facility.state || 'AU'}</div>
                    <div>{facility.capacity_beds || 0} beds · {facility.partnership_count || 0} partners</div>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="min-w-[190px] p-1 text-sm">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
                      Detention centre
                    </div>
                    <div className="font-bold leading-tight">{facility.name}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {facility.city || 'Unknown'}, {facility.state || 'AU'}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="border border-gray-300 p-2">
                        <div className="font-bold">{facility.capacity_beds || 0}</div>
                        <div>beds</div>
                      </div>
                      <div className="border border-gray-300 p-2">
                        <div className="font-bold">{facility.partnership_count || 0}</div>
                        <div>partners</div>
                      </div>
                    </div>
                    {facility.government_department && (
                      <div className="mt-2 text-xs text-gray-600">{facility.government_department}</div>
                    )}
                    <a
                      href={`/centres/${facility.slug || facility.id}`}
                      className="mt-3 inline-block border border-black bg-black px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Open centre profile
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="absolute bottom-4 left-4 z-[400] border-2 border-black bg-white p-3 text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-2 font-bold uppercase tracking-wide">Legend</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-black bg-red-600" />
              Operational centre
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-black bg-gray-500" />
              Closed / other status
            </div>
            <div className="text-gray-500">Marker size follows bed capacity</div>
          </div>
        </div>

        {showControls && (
          <div className="absolute right-4 top-4 z-[400] hidden max-w-[220px] border-2 border-black bg-white p-3 text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] md:block">
          <div className="mb-2 font-bold uppercase tracking-wide">State count</div>
          <div className="space-y-1">
            {Object.entries(stateCounts).sort().map(([state, count]) => (
              <div key={state} className="flex justify-between gap-6">
                <span className="font-bold">{state}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
