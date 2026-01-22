'use client';

import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Basecamp {
  id: string;
  name: string;
  location: string;
  state: string;
  lat: number;
  lng: number;
  status: string;
  keyImpact: string;
  description: string;
  programs: string[];
  metrics: {
    primaryStat: string;
    primaryLabel: string;
    secondaryStat: string;
    secondaryLabel: string;
  };
}

interface FutureCommunity {
  name: string;
  location: string;
  lat: number;
  lng: number;
  status: string;
}

interface GrassrootsActivationMapProps {
  basecamps: Basecamp[];
  futureCommunities: {
    core: FutureCommunity[];
    network: FutureCommunity[];
  };
  onBasecampSelect?: (b: Basecamp) => void;
}

export default function GrassrootsActivationMap({
  basecamps,
  futureCommunities,
  onBasecampSelect
}: GrassrootsActivationMapProps) {
  const [showBasecamps, setShowBasecamps] = useState(true);
  const [showCore, setShowCore] = useState(true);
  const [showNetwork, setShowNetwork] = useState(true);

  return (
    <div className="relative w-full h-full">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[400] bg-white rounded-lg border shadow-lg p-4 w-56">
        <h4 className="font-bold text-sm mb-3">Map Layers</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showBasecamps}
              onChange={() => setShowBasecamps(!showBasecamps)}
              className="w-4 h-4 rounded border-gray-300 accent-emerald-600"
            />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm">Basecamps ({basecamps.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCore}
              onChange={() => setShowCore(!showCore)}
              className="w-4 h-4 rounded border-gray-300 accent-amber-600"
            />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm">CORE ({futureCommunities.core.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showNetwork}
              onChange={() => setShowNetwork(!showNetwork)}
              className="w-4 h-4 rounded border-gray-300 accent-purple-600"
            />
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm">NETWORK ({futureCommunities.network.length})</span>
          </label>
        </div>
      </div>

      <MapContainer
        center={[-25, 134]}
        zoom={4}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Basecamps Layer */}
        {showBasecamps && (
          <LayerGroup>
            {basecamps.map((b) => (
              <CircleMarker
                key={b.id}
                center={[b.lat, b.lng]}
                radius={14}
                pathOptions={{
                  color: '#065f46',
                  weight: 3,
                  fillColor: '#10b981',
                  fillOpacity: 0.9,
                  className: 'cursor-pointer'
                }}
                eventHandlers={{
                  click: () => onBasecampSelect?.(b),
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} sticky>
                  <div className="text-center">
                    <div className="font-bold text-sm">{b.name}</div>
                    <div className="text-xs text-gray-600">{b.location}</div>
                    <div className="text-xs text-emerald-600 font-medium mt-1">{b.metrics.primaryStat}</div>
                    <div className="text-xs text-emerald-500 mt-1">Click for details</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </LayerGroup>
        )}

        {/* CORE Partners Layer */}
        {showCore && (
          <LayerGroup>
            {futureCommunities.core.map((c, i) => (
              <CircleMarker
                key={`core-${i}`}
                center={[c.lat, c.lng]}
                radius={10}
                pathOptions={{
                  color: '#b45309',
                  weight: 2,
                  fillColor: '#f59e0b',
                  fillOpacity: 0.8,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <div className="text-center">
                    <div className="font-bold text-xs">{c.name}</div>
                    <div className="text-xs text-amber-600">CORE Partner</div>
                    <div className="text-xs text-gray-500">{c.location}</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </LayerGroup>
        )}

        {/* NETWORK Partners Layer */}
        {showNetwork && (
          <LayerGroup>
            {futureCommunities.network.map((c, i) => (
              <CircleMarker
                key={`network-${i}`}
                center={[c.lat, c.lng]}
                radius={8}
                pathOptions={{
                  color: '#7c3aed',
                  weight: 2,
                  fillColor: '#a855f7',
                  fillOpacity: 0.7,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <div className="text-center">
                    <div className="font-bold text-xs">{c.name}</div>
                    <div className="text-xs text-purple-600">NETWORK Partner</div>
                    <div className="text-xs text-gray-500">{c.location}</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </LayerGroup>
        )}
      </MapContainer>
    </div>
  );
}
