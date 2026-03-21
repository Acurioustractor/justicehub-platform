'use client';

import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Stop {
  id: string;
  city: string;
  stateCode: string;
  lat: number;
  lng: number;
  status: 'confirmed' | 'planning' | 'exploring' | 'demand';
  date: string;
  cost: string;
  stats: {
    detentionSpend: string;
    indigenousOverrep: string;
    orgs: number;
    interventions: number;
  };
  demandSignals: Array<{ name: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#059669',
  planning: '#d97706',
  exploring: '#3b82f6',
  demand: '#DC2626',
};

const GLOW_COLORS: Record<string, string> = {
  confirmed: '#22c55e',
  planning: '#f59e0b',
  exploring: '#60a5fa',
  demand: '#f87171',
};

export default function IntelMap({
  stops,
  activeId,
  onStopClick,
}: {
  stops: Stop[];
  activeId: string | null;
  onStopClick: (id: string) => void;
}) {
  const positions: [number, number][] = stops.map((s) => [s.lat, s.lng]);

  return (
    <MapContainer
      center={[-28, 134]}
      zoom={4}
      scrollWheelZoom={true}
      className="w-full h-full z-0"
      style={{ background: '#0d1117' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Route polyline */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#DC2626',
          weight: 1.5,
          dashArray: '8 8',
          opacity: 0.3,
        }}
      />

      {/* Outer glow for active stop */}
      {stops.map((stop) => {
        const isActive = stop.id === activeId;
        if (!isActive) return null;
        return (
          <CircleMarker
            key={`active-glow-${stop.id}`}
            center={[stop.lat, stop.lng]}
            radius={30}
            pathOptions={{
              color: 'transparent',
              fillColor: STATUS_COLORS[stop.status] || '#DC2626',
              fillOpacity: 0.15,
            }}
          />
        );
      })}

      {/* Glow markers */}
      {stops.map((stop) => (
        <CircleMarker
          key={`glow-${stop.id}`}
          center={[stop.lat, stop.lng]}
          radius={stop.id === activeId ? 22 : 16}
          pathOptions={{
            color: 'transparent',
            fillColor: GLOW_COLORS[stop.status] || '#f87171',
            fillOpacity: stop.id === activeId ? 0.3 : 0.15,
          }}
        />
      ))}

      {/* Main markers */}
      {stops.map((stop) => {
        const isActive = stop.id === activeId;
        const color = STATUS_COLORS[stop.status] || '#DC2626';
        return (
          <CircleMarker
            key={stop.id}
            center={[stop.lat, stop.lng]}
            radius={isActive ? 12 : 8}
            pathOptions={{
              color: isActive ? '#F5F0E8' : '#1f2937',
              weight: isActive ? 2.5 : 2,
              fillColor: color,
              fillOpacity: 0.9,
            }}
            eventHandlers={{
              click: () => onStopClick(stop.id),
            }}
          >
            <Tooltip direction="top" offset={[0, -14]} className="intel-map-tooltip">
              <div className="text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <div className="font-bold text-sm">{stop.city}</div>
                <div className="text-[10px] text-gray-500" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {stop.date} &middot; {stop.cost}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {stop.stats.orgs} orgs &middot; {stop.stats.interventions} programs
                </div>
                {stop.demandSignals.length > 0 && (
                  <div className="text-[10px] mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#DC2626' }}>
                    {stop.demandSignals.length} demand signal{stop.demandSignals.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}

      {/* City labels (below markers) */}
      {stops.map((stop) => (
        <CircleMarker
          key={`label-${stop.id}`}
          center={[stop.lat - 0.8, stop.lng]}
          radius={0}
          pathOptions={{ color: 'transparent', fillOpacity: 0 }}
        >
          <Tooltip permanent direction="center" className="intel-city-label">
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: stop.id === activeId ? '#F5F0E8' : '#F5F0E880',
              fontWeight: stop.id === activeId ? 700 : 400,
            }}>
              {stop.city}
            </span>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
