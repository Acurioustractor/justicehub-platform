'use client';

import type { StyleSpecification } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import maplibregl, { LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  ExcellenceLocation,
  excellenceCategoryColors
} from '@/content/excellence-map-locations';

interface ExcellenceMapProps {
  locations: ExcellenceLocation[];
  height?: string;
  initialZoom?: number;
  initialCenter?: [number, number];
}

const VECTOR_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const MAPLIBRE_DEMO_STYLE_URL = 'https://demotiles.maplibre.org/style.json';
const LOCAL_STYLE_URL = '/map-style.json';

const FALLBACK_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'justicehub-osm': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'justicehub-osm',
      type: 'raster',
      source: 'justicehub-osm'
    }
  ]
};

function createPopupHTML(location: ExcellenceLocation) {
  const lines = [
    `<div style="max-width: 280px; font-family: 'Inter', system-ui, sans-serif;">`,
    `<h3 style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 6px;">${location.name}</h3>`,
    `<p style="font-size: 13px; color: #4b5563; line-height: 1.45; margin-bottom: 8px;">${location.description}</p>`,
    `<div style="font-size: 12px; color: #111827; font-weight: 600; margin-bottom: 8px;">`
  ];

  if (location.city) {
    lines.push(`${location.city}${location.state ? `, ${location.state}` : ''}, ${location.country}`);
  } else {
    lines.push(location.country);
  }
  lines.push(`</div>`);

  // Key stats
  if (location.keyStats.length > 0) {
    lines.push(`<div style="margin-bottom: 8px;">`);
    location.keyStats.slice(0, 2).forEach(stat => {
      lines.push(`<div style="font-size: 12px; color: #059669; margin-bottom: 2px;">✓ ${stat}</div>`);
    });
    lines.push(`</div>`);
  }

  // Links
  lines.push(`<div style="display: flex; gap: 12px; flex-wrap: wrap;">`);
  if (location.externalUrl) {
    lines.push(
      `<a href="${location.externalUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; font-weight: 600; color: #2563eb; text-decoration: none;">Learn More ↗</a>`
    );
  }
  lines.push(`</div>`);

  lines.push('</div>');
  return lines.join('');
}

export default function ExcellenceMap({
  locations,
  height = '500px',
  initialZoom = 2,
  initialCenter = [25, 10]
}: ExcellenceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const isBrowser = typeof window !== 'undefined';
    if (!isBrowser) {
      return;
    }

    let cancelled = false;

    const initialiseMap = async () => {
      const styleAttempts: Array<{
        url?: string;
        style?: StyleSpecification;
        label: string;
      }> = [
        { url: LOCAL_STYLE_URL, label: 'Local style' },
        { url: VECTOR_STYLE_URL, label: 'Carto Positron' },
        { url: MAPLIBRE_DEMO_STYLE_URL, label: 'MapLibre demo' },
        { style: FALLBACK_RASTER_STYLE, label: 'OpenStreetMap raster' }
      ];

      let mapStyle: StyleSpecification | string = FALLBACK_RASTER_STYLE;

      for (const attempt of styleAttempts) {
        if (attempt.style) {
          mapStyle = attempt.style;
          break;
        }

        if (!attempt.url) {
          continue;
        }

        try {
          const response = await fetch(attempt.url, { cache: 'no-store' });
          if (response.ok) {
            mapStyle = await response.json();
            break;
          }
        } catch (error) {
          console.warn(`Map style ${attempt.label} fetch error:`, error);
        }
      }

      if (cancelled) {
        return;
      }

      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false
      });

      mapRef.current.once('load', () => {
        if (!cancelled) {
          setMapReady(true);
        }
      });

      mapRef.current.scrollZoom.setWheelZoomRate(1 / 400);
      mapRef.current.scrollZoom.setZoomRate(1 / 400);
      mapRef.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
      mapRef.current.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');
    };

    initialiseMap();

    return () => {
      cancelled = true;
      setMapReady(false);
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [initialCenter, initialZoom]);

  useEffect(() => {
    if (!mapRef.current || !mapReady || locations.length === 0) {
      return;
    }

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const bounds = new LngLatBounds();

    locations.forEach((location) => {
      const popup = new maplibregl.Popup({ offset: 16, closeButton: true }).setHTML(createPopupHTML(location));
      const marker = new maplibregl.Marker({ color: excellenceCategoryColors[location.category] || '#111827' })
        .setLngLat([location.coordinates.lng, location.coordinates.lat])
        .setPopup(popup)
        .addTo(mapRef.current as maplibregl.Map);

      markersRef.current.push(marker);
      bounds.extend([location.coordinates.lng, location.coordinates.lat]);
    });

    if (locations.length === 1) {
      const single = locations[0];
      mapRef.current.flyTo({
        center: [single.coordinates.lng, single.coordinates.lat],
        zoom: 5,
        speed: 0.9
      });
    } else if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 5, duration: 1000 });
    }
  }, [locations, mapReady]);

  return (
    <div className="border-2 border-black bg-gray-100" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
