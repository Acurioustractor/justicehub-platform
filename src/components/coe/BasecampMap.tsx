'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface BasecampLocation {
  slug: string;
  name: string;
  region: string;
  description: string;
  coordinates: { lat: number; lng: number };
  stats?: { label: string; value: string }[];
  image?: string;
}

interface BasecampMapProps {
  locations: BasecampLocation[];
  height?: string;
}

export default function BasecampMap({ locations, height = '400px' }: BasecampMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    if (!Array.isArray(locations) || locations.length === 0) return;

    // Initialize map centered on Australia
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        scrollWheelZoom: false, // Disable scroll zoom for better UX
      }).setView([-25, 134], 4);

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

      // Add markers for basecamps
      const bounds: [number, number][] = [];

      locations.forEach((basecamp) => {
        const coords: [number, number] = [basecamp.coordinates.lat, basecamp.coordinates.lng];

        const marker = L.marker(coords, {
          icon: L.divIcon({
            className: 'basecamp-marker',
            html: `
              <div style="
                width: 36px;
                height: 36px;
                background-color: #d97706;
                border: 3px solid #000;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 3px 3px 0px 0px rgba(0,0,0,1);
                cursor: pointer;
                transition: transform 0.2s ease;
              " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3" fill="#d97706"></circle>
                </svg>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          }),
        });

        // Build stats HTML
        const statsHtml = basecamp.stats?.slice(0, 2).map(stat =>
          `<div style="font-size: 11px; color: #059669; margin-bottom: 2px;">✓ ${stat.value}</div>`
        ).join('') || '';

        marker.bindPopup(`
          <div style="min-width: 220px; font-family: 'Inter', system-ui, sans-serif;">
            <div style="font-size: 10px; color: #d97706; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">${basecamp.region}</div>
            <h3 style="font-size: 16px; font-weight: 800; color: #111827; margin: 0 0 6px 0;">${basecamp.name}</h3>
            <p style="font-size: 12px; color: #4b5563; line-height: 1.4; margin: 0 0 8px 0;">${basecamp.description}</p>
            ${statsHtml ? `<div style="margin-bottom: 8px;">${statsHtml}</div>` : ''}
            <a href="/organizations/${basecamp.slug}" style="font-size: 12px; font-weight: 700; color: #d97706; text-decoration: none;">View profile →</a>
          </div>
        `, {
          closeButton: true,
          className: 'basecamp-popup'
        });

        marker.addTo(mapRef.current!);
        bounds.push(coords);
      });

      // Fit bounds to show all markers with padding
      if (bounds.length > 0 && mapRef.current) {
        mapRef.current.fitBounds(bounds, { padding: [60, 60] });
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [locations]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      style={{ height, zIndex: 0 }}
    />
  );
}
