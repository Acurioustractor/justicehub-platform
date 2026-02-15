'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, { LngLatBounds, StyleSpecification } from 'maplibre-gl';
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

interface SimpleNodesMapProps {
  nodes: JusticeHubNode[];
  height?: string;
  onNodeSelect?: (node: JusticeHubNode) => void;
  selectedNodeId?: string;
}

const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm-tiles'
    }
  ]
};

const statusColors: Record<string, string> = {
  active: '#059669',
  forming: '#d97706',
  planned: '#6b7280',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  forming: 'Forming',
  planned: 'Planned',
};

export default function SimpleNodesMap({
  nodes,
  height = '400px',
  onNodeSelect,
  selectedNodeId
}: SimpleNodesMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: FALLBACK_STYLE,
      center: [133.7751, -26.2744], // Center of Australia
      zoom: 3.5,
      attributionControl: false
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    mapRef.current.once('load', () => {
      setMapReady(true);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Add markers when nodes change
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = new LngLatBounds();
    let hasMarkers = false;

    nodes.forEach(node => {
      if (!node.latitude || !node.longitude) return;

      const color = statusColors[node.status] || statusColors.planned;
      const isSelected = node.id === selectedNodeId;

      // Create marker element
      const el = document.createElement('div');
      el.className = 'node-marker';
      el.style.cssText = `
        width: ${isSelected ? '22px' : '18px'};
        height: ${isSelected ? '22px' : '18px'};
        background-color: ${color};
        border: ${isSelected ? '3px solid #111827' : '2px solid white'};
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        transition: box-shadow 0.15s ease;
      `;
      el.onmouseenter = () => {
        el.style.boxShadow = `0 0 0 4px ${color}40, 0 2px 6px rgba(0,0,0,0.4)`;
      };
      el.onmouseleave = () => {
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';
      };

      // Create popup
      const popup = new maplibregl.Popup({
        offset: 18,
        closeButton: true,
        maxWidth: '280px'
      }).setHTML(`
        <div style="padding: 12px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${color}; letter-spacing: 0.5px;">
              ${statusLabels[node.status]}
            </span>
          </div>
          <div style="font-size: 15px; font-weight: 700; margin-bottom: 6px; line-height: 1.3;">
            ${node.name}
          </div>
          ${node.description ? `
            <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
              ${node.description.substring(0, 100)}${node.description.length > 100 ? '...' : ''}
            </div>
          ` : ''}
          ${node.lead_organization ? `
            <div style="font-size: 11px; color: #888; margin-bottom: 8px;">
              <strong>Lead:</strong> ${node.lead_organization.name}
            </div>
          ` : ''}
          <a href="/network/${node.id}" style="display: inline-block; background: ${color}; color: white; padding: 6px 12px; font-size: 11px; font-weight: 600; text-decoration: none; border-radius: 3px;">
            View Details →
          </a>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([node.longitude, node.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);

      // Add click handler for selection
      el.addEventListener('click', () => {
        onNodeSelect?.(node);
      });

      markersRef.current.push(marker);
      bounds.extend([node.longitude, node.latitude]);
      hasMarkers = true;
    });

    // Fit bounds if we have markers
    if (hasMarkers && !bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 5, duration: 1000 });
    }
  }, [nodes, mapReady, selectedNodeId, onNodeSelect]);

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full border-2 border-black" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white border-2 border-black p-3 shadow-lg z-10">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
          Node Status
        </div>
        <div className="space-y-1">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: color }}
              />
              <span className="text-gray-700">{statusLabels[status]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
