'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Program {
  id: string;
  name: string;
  country: string;
  city_location: string;
  description: string;
  program_type: string[];
  latitude?: number;
  longitude?: number;
}

interface MapProps {
  programs: Program[];
  onProgramClick: (program: Program) => void;
}

// Geocoded coordinates for locations
const LOCATION_COORDS: { [key: string]: [number, number] } = {
  // North America
  'Los Angeles': [34.0522, -118.2437],
  'Chicago': [41.8781, -87.6298],
  'New York': [40.7128, -74.0060],
  'Boston': [42.3601, -71.0589],
  'Kansas City': [39.0997, -94.5786],
  'Dallas': [32.7767, -96.7970],
  'Pittsburgh': [40.4406, -79.9959],
  'Seattle': [47.6062, -122.3321],
  'Illinois': [40.6331, -89.3985],
  'United States': [37.0902, -95.7129],
  'National': [37.0902, -95.7129],
  'Global': [20, 0],

  // Europe
  'United Kingdom': [51.5074, -0.1278],
  'London': [51.5074, -0.1278],
  'Birmingham': [52.4862, -1.8904],
  'Enfield': [51.6523, -0.0810],
  'North Yorkshire': [54.2766, -1.8258],
  'Online': [51.5074, -0.1278],
  'Iceland': [64.9631, -19.0208],

  // Africa
  'South Africa': [-30.5595, 22.9375],
  'Kenya': [-0.0236, 37.9062],
  'Uganda': [1.3733, 32.2903],

  // Latin America
  'Brazil': [-14.2350, -51.9253],
  'Argentina': [-38.4161, -63.6167],
  'Colombia': [4.5709, -74.2973],

  // Asia Pacific
  'New Zealand': [-40.9006, 174.8860],
  'Auckland': [-36.8485, 174.7633],
};

function getCoordinates(location: string, country: string): [number, number] | null {
  // Try exact location match
  if (LOCATION_COORDS[location]) {
    return LOCATION_COORDS[location];
  }

  // Try country
  if (LOCATION_COORDS[country]) {
    return LOCATION_COORDS[country];
  }

  // Try partial matches
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (location?.includes(key) || country?.includes(key)) {
      return coords;
    }
  }

  return null;
}

export default function InternationalProgramsMap({ programs, onProgramClick }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    if (!Array.isArray(programs) || programs.length === 0) return;

    // Initialize map
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([20, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;
    }

    // Clear existing markers
    if (mapRef.current) {
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapRef.current?.removeLayer(layer);
        }
      });

      // Add markers for programs
      const bounds: [number, number][] = [];

      programs.forEach((program) => {
        const coords = getCoordinates(program.city_location || '', program.country || '');

        if (coords) {
          const marker = L.marker(coords, {
            icon: L.divIcon({
              className: 'custom-marker',
              html: `
                <div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg cursor-pointer hover:bg-blue-700 transition-colors">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                  </svg>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 32],
            }),
          });

          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-sm mb-1">${program.name}</h3>
              <p class="text-xs text-gray-600 mb-2">${program.city_location}, ${program.country}</p>
              <button
                class="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                onclick="window.selectProgram('${program.id}')"
              >
                View Details
              </button>
            </div>
          `);

          marker.on('click', () => {
            onProgramClick(program);
          });

          marker.addTo(mapRef.current!);
          bounds.push(coords);
        }
      });

      // Fit bounds to show all markers
      if (bounds.length > 0 && mapRef.current) {
        mapRef.current.fitBounds(bounds, {padding: [50, 50]});
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [programs, onProgramClick]);

  return (
    <div
      ref={mapContainerRef}
      className="h-[600px] w-full rounded-lg"
      style={{ zIndex: 0 }}
    />
  );
}
