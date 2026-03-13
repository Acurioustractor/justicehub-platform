'use client';

import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { TourStop } from '@/content/campaign';

interface TourMapProps {
  stops: TourStop[];
  onStopClick?: (eventSlug: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#16a34a',
  planning: '#d97706',
  tentative: '#9ca3af',
  exploring: '#3b82f6',
};

const GLOW_COLORS: Record<string, string> = {
  confirmed: '#22c55e',
  planning: '#f59e0b',
  tentative: '#d1d5db',
  exploring: '#60a5fa',
};

export default function TourMap({ stops, onStopClick }: TourMapProps) {
  const positions: [number, number][] = stops.map((s) => [s.lat, s.lng]);

  return (
    <div className="relative w-full h-[400px] border-2 border-gray-800">
      <MapContainer
        center={[-27, 134]}
        zoom={4}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
        style={{ background: '#1a1a2e' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Dashed route line */}
        <Polyline
          positions={positions}
          pathOptions={{
            color: '#4ade80',
            weight: 2,
            dashArray: '8 6',
            opacity: 0.4,
          }}
        />

        {/* Glow markers (larger, behind) */}
        {stops.map((stop) => (
          <CircleMarker
            key={`glow-${stop.eventSlug}`}
            center={[stop.lat, stop.lng]}
            radius={18}
            pathOptions={{
              color: 'transparent',
              fillColor: GLOW_COLORS[stop.status] || '#d1d5db',
              fillOpacity: 0.2,
            }}
          />
        ))}

        {/* Tour stop markers */}
        {stops.map((stop) => (
          <CircleMarker
            key={stop.eventSlug}
            center={[stop.lat, stop.lng]}
            radius={10}
            pathOptions={{
              color: '#1f2937',
              weight: 2,
              fillColor: STATUS_COLORS[stop.status] || '#9ca3af',
              fillOpacity: 0.9,
            }}
            eventHandlers={{
              click: () => {
                onStopClick?.(stop.eventSlug);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -12]}>
              <div className="text-center">
                <div className="font-bold">{stop.city}</div>
                <div className="text-xs text-gray-600">
                  {new Date(stop.date + 'T00:00:00').toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-xs text-gray-500">{stop.partner.split('+')[0].trim()}</div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend — dark theme */}
      <div className="absolute bottom-3 left-3 z-[400] bg-gray-900/95 border border-gray-700 px-3 py-2 text-xs text-white">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300 inline-block shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
            Planning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-300 inline-block shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
            In Conversation
          </span>
        </div>
      </div>
    </div>
  );
}
