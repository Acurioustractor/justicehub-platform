'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Service {
  id: string;
  name: string;
  description: string;
  location: {
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  };
  categories: string[];
}

interface ServicesMapProps {
  services: Service[];
  selectedService?: Service;
  onServiceClick?: (service: Service) => void;
}

// Category colors for map markers
const CATEGORY_COLORS: Record<string, string> = {
  mental_health: '#8b5cf6',   // purple
  housing: '#f59e0b',          // orange
  legal_aid: '#3b82f6',        // blue
  advocacy: '#10b981',         // green
  cultural_support: '#ef4444', // red
  family_support: '#ec4899',   // pink
  education_training: '#6366f1', // indigo
  court_support: '#3b82f6',    // blue
  substance_abuse: '#8b5cf6',  // purple
  employment: '#10b981',       // green
  health: '#8b5cf6',           // purple
  disability_support: '#f59e0b', // orange
  recreation: '#10b981',       // green
  life_skills: '#6366f1',      // indigo
  support: '#6b7280'           // gray
};

export function ServicesMap({ services, selectedService, onServiceClick }: ServicesMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-light': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }
        },
        layers: [
          {
            id: 'carto-light-layer',
            type: 'raster',
            source: 'carto-light',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: [133.7751, -25.2744], // Australia center
      zoom: 4,
      attributionControl: true
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add markers for services
  useEffect(() => {
    if (!map.current || !mapLoaded || services.length === 0) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.maplibregl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add markers for services with coordinates
    services.forEach(service => {
      if (!service.location?.latitude || !service.location?.longitude) return;

      // Determine marker color based on primary category
      const primaryCategory = service.categories?.[0] || 'support';
      const color = CATEGORY_COLORS[primaryCategory] || CATEGORY_COLORS.support;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundColor = color;
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.zIndex = '1000';
      });
      el.addEventListener('mouseleave', () => {
        el.style.width = '12px';
        el.style.height = '12px';
      });

      // Create popup
      const popup = new maplibregl.Popup({ offset: 15, closeButton: false })
        .setHTML(`
          <div class="p-3">
            <h3 class="font-bold text-sm mb-1">${service.name}</h3>
            <p class="text-xs text-gray-600 mb-2">${service.description?.substring(0, 100)}...</p>
            <div class="flex items-center gap-2 text-xs">
              <span class="px-2 py-1 rounded" style="background-color: ${color}20; color: ${color}">
                ${primaryCategory.replace(/_/g, ' ')}
              </span>
              <span class="text-gray-500">${service.location.city || service.location.state}</span>
            </div>
          </div>
        `);

      // Add marker
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([service.location.longitude, service.location.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      // Click handler
      el.addEventListener('click', () => {
        if (onServiceClick) {
          onServiceClick(service);
        }
      });
    });
  }, [services, mapLoaded, onServiceClick]);

  // Fly to selected service
  useEffect(() => {
    if (!map.current || !selectedService?.location?.latitude || !selectedService?.location?.longitude) return;

    map.current.flyTo({
      center: [selectedService.location.longitude, selectedService.location.latitude],
      zoom: 12,
      duration: 1500
    });
  }, [selectedService]);

  return (
    <div className="relative w-full h-full min-h-[600px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg border-2 border-black" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white border-2 border-black p-4 rounded-lg shadow-lg max-w-xs">
        <h4 className="font-bold text-sm mb-2">Service Categories</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(CATEGORY_COLORS).slice(0, 8).map(([category, color]) => (
            <div key={category} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: color }} />
              <span className="text-gray-700">{category.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
