'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Building2, Heart, Briefcase, Users, MapPin, AlertCircle } from 'lucide-react';

// ============================================
// Types
// ============================================

interface DetentionFacility {
  id: string;
  name: string;
  slug: string;
  facility_type: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  capacity_beds: number;
  operational_status: string;
  partnership_count?: number;
}

interface CommunityProgram {
  id: string;
  name: string;
  organization: string;
  location: string;
  state: string;
  latitude?: number;
  longitude?: number;
  approach?: string;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  location_city?: string;
  location_state?: string;
  latitude?: number;
  longitude?: number;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export interface EcosystemData {
  facilities: DetentionFacility[];
  programs: CommunityProgram[];
  services: Service[];
  organizations: Organization[];
}

interface EcosystemMapProps {
  data: EcosystemData;
  selectedState?: string;
  onFacilityClick?: (facility: DetentionFacility) => void;
  onProgramClick?: (program: CommunityProgram) => void;
  onServiceClick?: (service: Service) => void;
  height?: string;
}

// ============================================
// Layer Configuration
// ============================================

const LAYER_CONFIG = {
  facilities: {
    color: '#dc2626', // red-600
    icon: Building2,
    label: 'Detention Centres',
    enabled: true,
  },
  programs: {
    color: '#16a34a', // green-600
    icon: Heart,
    label: 'Community Programs',
    enabled: true,
  },
  services: {
    color: '#2563eb', // blue-600
    icon: Briefcase,
    label: 'Support Services',
    enabled: true,
  },
  organizations: {
    color: '#9333ea', // purple-600
    icon: Users,
    label: 'Organizations',
    enabled: false, // Off by default
  },
};

// ============================================
// Component
// ============================================

export function EcosystemMap({
  data,
  selectedState,
  onFacilityClick,
  onProgramClick,
  onServiceClick,
  height = '600px',
}: EcosystemMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [layers, setLayers] = useState(LAYER_CONFIG);
  const [hoveredItem, setHoveredItem] = useState<{ type: string; data: unknown } | null>(null);

  // State centers for flying to state
  const STATE_CENTERS: Record<string, [number, number]> = {
    NSW: [151.2093, -33.8688],
    VIC: [144.9631, -37.8136],
    QLD: [153.0251, -27.4698],
    SA: [138.6007, -34.9285],
    WA: [115.8575, -31.9505],
    TAS: [147.3257, -42.8821],
    NT: [130.8456, -12.4634],
    ACT: [149.1300, -35.2809],
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Ensure container has dimensions before initializing
    const container = mapContainer.current;
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      // Wait for container to have dimensions
      const timer = setTimeout(() => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          initializeMap();
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    initializeMap();

    function initializeMap() {
      if (!container || map.current) return;

      map.current = new maplibregl.Map({
        container: container,
        style: {
          version: 8,
          sources: {
            'carto-light': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            },
          },
          layers: [
            {
              id: 'carto-light-layer',
              type: 'raster',
              source: 'carto-light',
              minzoom: 0,
              maxzoom: 22,
            },
          ],
        },
        center: [133.7751, -25.2744], // Australia center
        zoom: 4,
        attributionControl: true,
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

      map.current.on('load', () => {
        setMapLoaded(true);
        // Trigger resize to ensure proper rendering
        map.current?.resize();
      });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Resize map when height changes
  useEffect(() => {
    if (map.current && mapLoaded) {
      setTimeout(() => {
        map.current?.resize();
      }, 100);
    }
  }, [height, mapLoaded]);

  // Fly to selected state
  useEffect(() => {
    if (!map.current || !selectedState || !STATE_CENTERS[selectedState]) return;

    map.current.flyTo({
      center: STATE_CENTERS[selectedState],
      zoom: 6,
      duration: 1500,
    });
  }, [selectedState]);

  // Create marker element
  const createMarker = useCallback(
    (
      color: string,
      size: 'small' | 'medium' | 'large',
      type: string,
      itemData: unknown,
    ): HTMLDivElement => {
      const sizes = { small: 10, medium: 14, large: 18 };
      const el = document.createElement('div');
      el.className = `ecosystem-marker marker-${type}`;
      el.style.width = `${sizes[size]}px`;
      el.style.height = `${sizes[size]}px`;
      el.style.borderRadius = type === 'facilities' ? '4px' : '50%';
      el.style.backgroundColor = color;
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.transition = 'box-shadow 0.15s ease';

      // Use box-shadow for hover instead of transform to avoid marker jumping
      el.addEventListener('mouseenter', () => {
        el.style.boxShadow = `0 0 0 3px ${color}66, 0 2px 6px rgba(0,0,0,0.4)`;
        setHoveredItem({ type, data: itemData });
      });

      el.addEventListener('mouseleave', () => {
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        setHoveredItem(null);
      });

      return el;
    },
    [],
  );

  // Add markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add facility markers (squares - always on top)
    if (layers.facilities.enabled && data.facilities) {
      data.facilities.forEach((facility) => {
        if (!facility.latitude || !facility.longitude) return;
        if (selectedState && facility.state !== selectedState) return;

        const el = createMarker(layers.facilities.color, 'large', 'facilities', facility);

        const popup = new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(`
          <div class="p-3 max-w-xs">
            <div class="flex items-center gap-2 mb-2">
              <span class="w-3 h-3 rounded" style="background-color: ${layers.facilities.color}"></span>
              <span class="text-xs font-bold uppercase text-gray-500">Detention Centre</span>
            </div>
            <h3 class="font-bold text-sm mb-1">${facility.name}</h3>
            <p class="text-xs text-gray-600 mb-2">${facility.city}, ${facility.state}</p>
            <div class="flex gap-2 text-xs">
              <span class="px-2 py-1 bg-red-50 text-red-700 rounded">
                ${facility.capacity_beds || '?'} beds
              </span>
              ${facility.partnership_count ? `<span class="px-2 py-1 bg-green-50 text-green-700 rounded">${facility.partnership_count} partners</span>` : ''}
            </div>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([facility.longitude, facility.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        el.addEventListener('click', () => {
          if (onFacilityClick) onFacilityClick(facility);
        });

        markersRef.current.push(marker);
      });
    }

    // Add community program markers
    if (layers.programs.enabled && data.programs) {
      data.programs.forEach((program) => {
        if (!program.latitude || !program.longitude) return;
        if (selectedState && program.state !== selectedState) return;

        const el = createMarker(layers.programs.color, 'medium', 'programs', program);

        const popup = new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(`
          <div class="p-3 max-w-xs">
            <div class="flex items-center gap-2 mb-2">
              <span class="w-3 h-3 rounded-full" style="background-color: ${layers.programs.color}"></span>
              <span class="text-xs font-bold uppercase text-gray-500">Community Program</span>
            </div>
            <h3 class="font-bold text-sm mb-1">${program.name}</h3>
            <p class="text-xs text-gray-600 mb-2">${program.organization}</p>
            <p class="text-xs text-gray-500">${program.location}, ${program.state}</p>
            ${program.approach ? `<span class="inline-block mt-2 px-2 py-1 bg-green-50 text-green-700 text-xs rounded">${program.approach}</span>` : ''}
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([program.longitude, program.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        el.addEventListener('click', () => {
          if (onProgramClick) onProgramClick(program);
        });

        markersRef.current.push(marker);
      });
    }

    // Add service markers
    if (layers.services.enabled && data.services) {
      data.services.forEach((service) => {
        if (!service.latitude || !service.longitude) return;
        if (selectedState && service.location_state !== selectedState) return;

        const el = createMarker(layers.services.color, 'small', 'services', service);

        const popup = new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(`
          <div class="p-3 max-w-xs">
            <div class="flex items-center gap-2 mb-2">
              <span class="w-3 h-3 rounded-full" style="background-color: ${layers.services.color}"></span>
              <span class="text-xs font-bold uppercase text-gray-500">Service</span>
            </div>
            <h3 class="font-bold text-sm mb-1">${service.name}</h3>
            <p class="text-xs text-gray-600">${service.location_city || ''}, ${service.location_state || ''}</p>
            ${service.category ? `<span class="inline-block mt-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">${service.category}</span>` : ''}
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([service.longitude, service.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        el.addEventListener('click', () => {
          if (onServiceClick) onServiceClick(service);
        });

        markersRef.current.push(marker);
      });
    }

    // Add organization markers
    if (layers.organizations.enabled && data.organizations) {
      data.organizations.forEach((org) => {
        if (!org.latitude || !org.longitude) return;
        if (selectedState && org.state !== selectedState) return;

        const el = createMarker(layers.organizations.color, 'small', 'organizations', org);

        const popup = new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(`
          <div class="p-3 max-w-xs">
            <div class="flex items-center gap-2 mb-2">
              <span class="w-3 h-3 rounded-full" style="background-color: ${layers.organizations.color}"></span>
              <span class="text-xs font-bold uppercase text-gray-500">Organization</span>
            </div>
            <h3 class="font-bold text-sm mb-1">${org.name}</h3>
            <p class="text-xs text-gray-600">${org.city || ''}, ${org.state || ''}</p>
            ${org.type ? `<span class="inline-block mt-2 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">${org.type}</span>` : ''}
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([org.longitude, org.latitude])
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    }
  }, [
    data,
    mapLoaded,
    layers,
    selectedState,
    createMarker,
    onFacilityClick,
    onProgramClick,
    onServiceClick,
  ]);

  // Toggle layer visibility
  const toggleLayer = (layerKey: keyof typeof LAYER_CONFIG) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        enabled: !prev[layerKey].enabled,
      },
    }));
  };

  // Ensure height is a valid value - use 100% for flex containers, pixels otherwise
  const mapHeight = height === '100%' ? '100%' : (height || '500px');

  return (
    <div
      className="relative w-full h-full"
      style={{
        height: mapHeight,
        minHeight: '400px',
        // Ensure the container fills parent when height is 100%
        ...(height === '100%' ? { position: 'absolute', inset: 0 } : {})
      }}
    >
      <div
        ref={mapContainer}
        className="absolute inset-0"
      />

      {/* Layer Controls */}
      <div className="absolute top-4 left-4 bg-white border-2 border-black p-4 rounded-lg shadow-lg">
        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Map Layers
        </h4>
        <div className="space-y-2">
          {Object.entries(layers).map(([key, config]) => {
            const Icon = config.icon;
            const count =
              key === 'facilities'
                ? data.facilities?.length || 0
                : key === 'programs'
                  ? data.programs?.filter((p) => p.latitude && p.longitude).length || 0
                  : key === 'services'
                    ? data.services?.filter((s) => s.latitude && s.longitude).length || 0
                    : data.organizations?.filter((o) => o.latitude && o.longitude).length || 0;

            return (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={() => toggleLayer(key as keyof typeof LAYER_CONFIG)}
                  className="w-4 h-4 rounded"
                />
                <span
                  className={`w-3 h-3 ${key === 'facilities' ? 'rounded' : 'rounded-full'}`}
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-xs flex-1">{config.label}</span>
                <span className="text-xs text-gray-500">({count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Stats Panel */}
      <div className="absolute bottom-4 left-4 bg-white border-2 border-black p-4 rounded-lg shadow-lg">
        <h4 className="font-bold text-sm mb-3">Ecosystem Overview</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-red-600" />
            <span>
              <strong>{data.facilities?.length || 0}</strong> Facilities
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-green-600" />
            <span>
              <strong>{data.programs?.length || 0}</strong> Programs
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span>
              <strong>{data.services?.length || 0}</strong> Services
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span>
              <strong>{data.organizations?.length || 0}</strong> Orgs
            </span>
          </div>
        </div>
      </div>

      {/* Hover Info */}
      {hoveredItem && (
        <div className="absolute top-4 right-16 bg-black text-white px-3 py-2 rounded text-xs">
          Click for details
        </div>
      )}

      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading ecosystem map...</p>
          </div>
        </div>
      )}

      {/* No Data Warning */}
      {mapLoaded &&
        !data.facilities?.length &&
        !data.programs?.length &&
        !data.services?.length && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white border-2 border-black p-6 rounded-lg text-center max-w-sm">
              <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="font-bold mb-2">No Ecosystem Data</h3>
              <p className="text-sm text-gray-600">
                Run the database migration to populate youth detention facilities and link them to
                community programs.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}
