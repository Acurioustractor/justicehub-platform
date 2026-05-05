'use client';

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export interface CommunityPoint {
  city: string;
  lat: number;
  lng: number;
  people: number;
  status: 'confirmed' | 'demand';
}

interface Props {
  points: CommunityPoint[];
}

export default function CommunityDemandMap({ points }: Props) {
  return (
    <div className="relative w-full" style={{ height: 480 }}>
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

        {points.map((p) => {
          const radius = Math.max(8, Math.sqrt(p.people) * 6);
          const isConfirmed = p.status === 'confirmed';
          const fill = isConfirmed ? '#059669' : '#DC2626';
          const glow = isConfirmed ? '#22c55e' : '#f87171';
          return (
            <span key={p.city}>
              {/* Glow */}
              <CircleMarker
                center={[p.lat, p.lng]}
                radius={radius + 8}
                pathOptions={{ color: 'transparent', fillColor: glow, fillOpacity: 0.18 }}
              />
              {/* Core */}
              <CircleMarker
                center={[p.lat, p.lng]}
                radius={radius}
                pathOptions={{ color: '#0a0a0a', weight: 2, fillColor: fill, fillOpacity: 0.9 }}
              >
                <Tooltip direction="top" offset={[0, -radius]}>
                  <div className="text-center">
                    <div className="font-bold">{p.city}</div>
                    <div className="text-xs text-gray-600">
                      {p.people} {p.people === 1 ? 'person' : 'people'} · {isConfirmed ? 'Confirmed stop' : 'Community asking'}
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            </span>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-black/85 border border-white/15 px-3 py-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        <div className="flex items-center gap-4 text-xs text-white">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            Confirmed stop
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
            Community asking
          </span>
        </div>
      </div>
    </div>
  );
}
