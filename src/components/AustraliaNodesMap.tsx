'use client';

import type { StyleSpecification } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import maplibregl, { LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface JusticeHubNode {
  id: string;
  name: string;
  node_type: 'state' | 'territory' | 'international';
  state_code: string | null;
  country: string;
  description: string;
  status: 'active' | 'forming' | 'planned';
  latitude: number;
  longitude: number;
  contact_email?: string;
  website_url?: string;
  lead_organization?: {
    id: string;
    name: string;
  };
  upcoming_events?: number;
  intervention_count?: number;
}

interface AustraliaNodesMapProps {
  nodes: JusticeHubNode[];
  height?: string;
  onNodeSelect?: (node: JusticeHubNode) => void;
  selectedNodeId?: string;
}

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

const statusColors: Record<string, string> = {
  active: '#059669', // green
  forming: '#d97706', // amber
  planned: '#6b7280', // gray
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  forming: 'Forming',
  planned: 'Planned',
};

function createPopupHTML(node: JusticeHubNode) {
  const lines = [
    `<div style="max-width: 280px; font-family: 'Inter', system-ui, sans-serif;">`,
    `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">`,
    `<div style="width: 10px; height: 10px; border-radius: 50%; background: ${statusColors[node.status]};"></div>`,
    `<span style="font-size: 11px; font-weight: 600; color: ${statusColors[node.status]}; text-transform: uppercase;">${statusLabels[node.status]}</span>`,
    `</div>`,
    `<h3 style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 6px;">${node.name}</h3>`,
  ];

  if (node.description) {
    lines.push(`<p style="font-size: 13px; color: #4b5563; line-height: 1.45; margin-bottom: 8px;">${node.description}</p>`);
  }

  // Stats row
  lines.push(`<div style="display: flex; gap: 16px; margin-bottom: 8px;">`);
  if (node.intervention_count !== undefined) {
    lines.push(`<div style="font-size: 12px;"><span style="font-weight: 700; color: #b45309;">${node.intervention_count}</span> <span style="color: #6b7280;">interventions</span></div>`);
  }
  if (node.upcoming_events !== undefined && node.upcoming_events > 0) {
    lines.push(`<div style="font-size: 12px;"><span style="font-weight: 700; color: #059669;">${node.upcoming_events}</span> <span style="color: #6b7280;">events</span></div>`);
  }
  lines.push(`</div>`);

  if (node.lead_organization) {
    lines.push(`<div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Led by: <strong>${node.lead_organization.name}</strong></div>`);
  }

  // Links
  lines.push(`<div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px;">`);
  if (node.state_code) {
    lines.push(
      `<a href="/youth-justice-report/interventions?state=${node.state_code}" style="font-size: 12px; font-weight: 600; color: #b45309; text-decoration: none;">View Interventions →</a>`
    );
  }
  if (node.website_url) {
    lines.push(
      `<a href="${node.website_url}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; font-weight: 600; color: #2563eb; text-decoration: none;">Website ↗</a>`
    );
  }
  lines.push(`</div>`);

  lines.push('</div>');
  return lines.join('');
}

export default function AustraliaNodesMap({
  nodes,
  height = '600px',
  onNodeSelect,
  selectedNodeId,
}: AustraliaNodesMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Australia center coordinates
  const australiaCenter: [number, number] = [134.0, -28.0];
  const initialZoom = 3.5;

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
      let mapStyle: StyleSpecification | string = FALLBACK_RASTER_STYLE;

      // Try to load Carto style
      try {
        const response = await fetch('https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', { cache: 'no-store' });
        if (response.ok) {
          mapStyle = await response.json();
        }
      } catch {
        console.warn('Using fallback map style');
      }

      if (cancelled) return;

      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current!,
        style: mapStyle,
        center: australiaCenter,
        zoom: initialZoom,
        attributionControl: false,
        maxBounds: [
          [100, -50], // Southwest
          [180, 0],   // Northeast
        ],
      });

      mapRef.current.once('load', () => {
        if (!cancelled) {
          setMapReady(true);
        }
      });

      mapRef.current.scrollZoom.setWheelZoomRate(1 / 400);
      mapRef.current.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');
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
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapReady || nodes.length === 0) {
      return;
    }

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    nodes.forEach((node) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'node-marker';
      el.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${statusColors[node.status]};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      `;

      if (selectedNodeId === node.id) {
        el.style.transform = 'scale(1.3)';
        el.style.border = '3px solid #111827';
      }

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });

      el.addEventListener('mouseleave', () => {
        if (selectedNodeId !== node.id) {
          el.style.transform = 'scale(1)';
        }
      });

      el.addEventListener('click', () => {
        if (onNodeSelect) {
          onNodeSelect(node);
        }
      });

      const popup = new maplibregl.Popup({ offset: 16, closeButton: true })
        .setHTML(createPopupHTML(node));

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([node.longitude, node.latitude])
        .setPopup(popup)
        .addTo(mapRef.current as maplibregl.Map);

      markersRef.current.push(marker);
    });
  }, [nodes, mapReady, selectedNodeId, onNodeSelect]);

  return (
    <div className="relative">
      <div className="border-2 border-black bg-gray-100" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white border-2 border-black p-3 shadow-lg">
        <div className="text-xs font-bold uppercase tracking-wider text-earth-600 mb-2">
          Node Status
        </div>
        <div className="space-y-1">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: color }}
              />
              <span className="text-earth-700">{statusLabels[status]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
