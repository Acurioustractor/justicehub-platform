'use client';

import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, LayerGroup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Layers, Activity, AlertCircle } from 'lucide-react';

// Mock Data for the Map (simulating 'Alpha' clusters)
const LOCATIONS = [
    { id: 1, name: 'Redfern / Waterloo', lat: -33.893, lng: 151.205, alpha: 9.2, programs: 12, dividend: '$4.5M' },
    { id: 2, name: 'Alice Springs (Mparntwe)', lat: -23.698, lng: 133.880, alpha: 8.9, programs: 8, dividend: '$3.2M' },
    { id: 3, name: 'Fitzroy Valley', lat: -18.194, lng: 125.567, alpha: 9.5, programs: 5, dividend: '$2.8M' },
    { id: 4, name: 'Western Sydney (Mt Druitt)', lat: -33.770, lng: 150.820, alpha: 8.5, programs: 24, dividend: '$8.1M' },
    { id: 5, name: 'Logan City', lat: -27.639, lng: 153.109, alpha: 8.1, programs: 15, dividend: '$5.4M' },
    { id: 6, name: 'Shepparton', lat: -36.383, lng: 145.400, alpha: 7.8, programs: 6, dividend: '$1.9M' },
    { id: 7, name: 'Palm Island', lat: -18.730, lng: 146.577, alpha: 9.1, programs: 4, dividend: '$2.1M' },
    { id: 8, name: 'Broome', lat: -17.961, lng: 122.235, alpha: 8.7, programs: 7, dividend: '$3.0M' },
];

// Mock 'Justice Needs' Data (High incarceration catchment areas)
const NEEDS_ZONES = [
    { id: 1, name: 'Central Desert Region', lat: -22.0, lng: 132.0, radius: 400000, intensity: 'High' },
    { id: 2, name: 'North Queensland Corridor', lat: -19.0, lng: 146.0, radius: 250000, intensity: 'Medium' },
];

export default function EquityMapClient() {
    const [viewMode, setViewMode] = useState<'nodes' | 'heat'>('nodes');
    const [showNeeds, setShowNeeds] = useState(false);

    return (
        <Card className="w-full h-[600px] overflow-hidden border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-0 bg-gray-50">
            {/* Map Controls */}
            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
                <div className="bg-white border-2 border-black p-4 shadow-md w-64">
                    <h4 className="font-black text-sm uppercase mb-3 flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Map Layers
                    </h4>

                    <div className="space-y-3">
                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-100 p-1 border border-gray-300 rounded-sm">
                            <button
                                onClick={() => setViewMode('nodes')}
                                className={`flex-1 py-1 text-xs font-bold uppercase transition-colors ${viewMode === 'nodes' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                            >
                                Nodes
                            </button>
                            <button
                                onClick={() => setViewMode('heat')}
                                className={`flex-1 py-1 text-xs font-bold uppercase transition-colors ${viewMode === 'heat' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                            >
                                Heat
                            </button>
                        </div>

                        {/* Needs Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-4 h-4 border-2 border-black flex items-center justify-center transition-colors ${showNeeds ? 'bg-black' : 'bg-white'}`}>
                                {showNeeds && <div className="w-2 h-2 bg-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={showNeeds} onChange={() => setShowNeeds(!showNeeds)} />
                            <span className="text-xs font-bold uppercase group-hover:text-emerald-700">Overlay Justice Needs</span>
                        </label>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                        {viewMode === 'nodes' ? (
                            <p><span className="text-emerald-600 font-bold">Green Nodes</span> = Validated Alpha Assets.</p>
                        ) : (
                            <p><span className="text-red-600 font-bold">Red Zones</span> = High Investment Yield.</p>
                        )}
                    </div>
                </div>
            </div>

            <MapContainer
                center={[-25.2744, 133.7751]}
                zoom={4}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', background: '#F8F9FA' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {/* Justice Needs Layer */}
                {showNeeds && (
                    <LayerGroup>
                        {NEEDS_ZONES.map(zone => (
                            <Circle
                                key={zone.id}
                                center={[zone.lat, zone.lng]}
                                radius={zone.radius}
                                pathOptions={{
                                    color: 'transparent',
                                    fillColor: '#ef4444',
                                    fillOpacity: 0.1
                                }}
                            >
                                <Tooltip sticky>
                                    <div className="font-bold text-xs uppercase">{zone.name}</div>
                                    <div className="text-xs text-red-600">High Unmet Need</div>
                                </Tooltip>
                            </Circle>
                        ))}
                    </LayerGroup>
                )}

                {/* Locations Grid */}
                {LOCATIONS.map((loc) => (
                    viewMode === 'nodes' ? (
                        <CircleMarker
                            key={loc.id}
                            center={[loc.lat, loc.lng]}
                            pathOptions={{
                                color: '#000000',
                                weight: 2,
                                fillColor: '#10B981', // Emerald 500
                                fillOpacity: 1,
                            }}
                            radius={typeof window !== 'undefined' && window.innerWidth < 768 ? 6 : (loc.alpha * 0.8) + (loc.programs / 4)}
                        >
                            <Popup className="custom-popup p-0 border-0 rounded-none overflow-hidden">
                                <div className="border-2 border-black bg-white min-w-[200px]">
                                    <div className="bg-black text-white p-2 font-bold text-sm uppercase tracking-wider">
                                        {loc.name}
                                    </div>
                                    <div className="p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-emerald-100 text-emerald-900 border border-emerald-900 text-[10px] font-bold px-2 py-0.5 uppercase">
                                                Alpha: {loc.alpha}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-xs font-mono">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">PROGRAMS</span>
                                                <span className="font-bold">{loc.programs}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-gray-100 pt-1 mt-1">
                                                <span className="text-gray-500">DIVIDEND</span>
                                                <span className="font-bold text-emerald-700">{loc.dividend}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ) : (
                        // Heat View Simulation
                        <CircleMarker
                            key={loc.id}
                            center={[loc.lat, loc.lng]}
                            pathOptions={{
                                stroke: false,
                                fillColor: '#ef4444', // Red-500
                                fillOpacity: 0.3,
                            }}
                            radius={40} // Large radius for 'blob' effect
                        />
                    )
                ))}
            </MapContainer>
        </Card>
    );
}
