'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, { LngLatBounds, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Maximize2, Minimize2, Building2, Heart, Briefcase, Users, X } from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  slug?: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  capacity_beds?: number;
  partnership_count?: number;
  operational_status?: string;
}

interface Program {
  id: string;
  name: string;
  slug?: string;
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
  slug?: string;
  category?: string;
  location_city?: string;
  location_state?: string;
  latitude?: number;
  longitude?: number;
}

interface Organization {
  id: string;
  name: string;
  slug?: string;
  type?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

interface EcosystemData {
  facilities: Facility[];
  programs: Program[];
  services: Service[];
  organizations: Organization[];
}

interface SimpleEcosystemMapProps {
  height?: string;
  data?: EcosystemData;
  selectedState?: string;
  onStateChange?: (state: string) => void;
  showControls?: boolean;
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

// Layer visibility state
interface LayerVisibility {
  facilities: boolean;
  programs: boolean;
  services: boolean;
  organizations: boolean;
}

export function SimpleEcosystemMap({
  height = '520px',
  data,
  selectedState: externalState,
  onStateChange,
  showControls = true
}: SimpleEcosystemMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [mapReady, setMapReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [internalState, setInternalState] = useState('');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(!data);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    facilities: true,
    programs: true,
    services: true,
    organizations: true
  });

  // Use external state if provided, otherwise internal
  const selectedState = externalState !== undefined ? externalState : internalState;
  const setSelectedState = onStateChange || setInternalState;

  // Use provided data or fetch
  useEffect(() => {
    if (data) {
      setFacilities(data.facilities || []);
      setPrograms(data.programs || []);
      setServices(data.services || []);
      setOrganizations(data.organizations || []);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const url = selectedState
          ? `/api/transparency/ecosystem?state=${selectedState}`
          : '/api/transparency/ecosystem';
        const response = await fetch(url);
        const result = await response.json();
        setFacilities(result.facilities || []);
        setPrograms(result.programs || []);
        setServices(result.services || []);
        setOrganizations(result.organizations || []);
      } catch (error) {
        console.error('Failed to fetch ecosystem data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedState, data]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: FALLBACK_STYLE,
      center: [133.7751, -26.2744],
      zoom: 3.5,
      attributionControl: false
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current.addControl(new maplibregl.ScaleControl({ maxWidth: 120 }), 'bottom-left');

    mapRef.current.once('load', () => {
      setMapReady(true);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Add markers when data or visibility changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = new LngLatBounds();
    let hasMarkers = false;

    // Add facility markers (red squares)
    if (layerVisibility.facilities) {
      facilities.forEach(facility => {
        if (!facility.latitude || !facility.longitude) return;

        const el = document.createElement('div');
        el.className = 'facility-marker';
        el.style.cssText = `
          width: 18px;
          height: 18px;
          background-color: #dc2626;
          border: 2px solid white;
          border-radius: 3px;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          transition: box-shadow 0.15s ease, border-color 0.15s ease;
        `;
        el.onmouseenter = () => { el.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.4), 0 2px 6px rgba(0,0,0,0.35)'; };
        el.onmouseleave = () => { el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.35)'; };

        const facilityUrl = facility.slug ? `/facilities/${facility.slug}` : `/facilities/${facility.id}`;
        const popup = new maplibregl.Popup({ offset: 18, closeButton: true, maxWidth: '280px' }).setHTML(`
          <div style="padding: 12px;">
            <div style="font-size: 10px; color: #dc2626; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
              🔴 Detention Centre
            </div>
            <div style="font-size: 15px; font-weight: 700; margin-bottom: 6px; line-height: 1.3;">${facility.name}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${facility.city}, ${facility.state}</div>
            <div style="display: flex; gap: 12px; margin-bottom: 10px;">
              ${facility.capacity_beds ? `<div style="font-size: 11px;"><strong>${facility.capacity_beds}</strong> beds</div>` : ''}
              ${facility.partnership_count ? `<div style="font-size: 11px;"><strong>${facility.partnership_count}</strong> partners</div>` : ''}
            </div>
            <a href="${facilityUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 6px 12px; font-size: 11px; font-weight: 600; text-decoration: none; border-radius: 3px;">
              View Details →
            </a>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([facility.longitude, facility.latitude])
          .setPopup(popup)
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
        bounds.extend([facility.longitude, facility.latitude]);
        hasMarkers = true;
      });
    }

    // Add program markers (green circles)
    if (layerVisibility.programs) {
      programs.forEach(program => {
        if (!program.latitude || !program.longitude) return;

        const el = document.createElement('div');
        el.className = 'program-marker';
        el.style.cssText = `
          width: 14px;
          height: 14px;
          background-color: #16a34a;
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          transition: box-shadow 0.15s ease;
        `;
        el.onmouseenter = () => { el.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.4), 0 2px 6px rgba(0,0,0,0.35)'; };
        el.onmouseleave = () => { el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.35)'; };

        const programUrl = program.slug ? `/community-programs/${program.slug}` : `/community-programs/${program.id}`;
        const popup = new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '280px' }).setHTML(`
          <div style="padding: 12px;">
            <div style="font-size: 10px; color: #16a34a; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
              🟢 Community Program
            </div>
            <div style="font-size: 15px; font-weight: 700; margin-bottom: 6px; line-height: 1.3;">${program.name}</div>
            <div style="font-size: 12px; color: #666;">${program.organization}</div>
            <div style="font-size: 11px; color: #888; margin-top: 4px; margin-bottom: 8px;">${program.location}, ${program.state}</div>
            ${program.approach ? `<div style="font-size: 11px; margin-bottom: 10px; padding: 6px 10px; background: #f0fdf4; border-radius: 4px; border-left: 3px solid #16a34a;">${program.approach}</div>` : ''}
            <a href="${programUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 6px 12px; font-size: 11px; font-weight: 600; text-decoration: none; border-radius: 3px;">
              View Program →
            </a>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([program.longitude, program.latitude])
          .setPopup(popup)
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
        bounds.extend([program.longitude, program.latitude]);
        hasMarkers = true;
      });
    }

    // Add service markers (blue diamonds)
    if (layerVisibility.services) {
      services.forEach(service => {
        if (!service.latitude || !service.longitude) return;

        const el = document.createElement('div');
        el.className = 'service-marker';
        el.style.cssText = `
          width: 12px;
          height: 12px;
          background-color: #2563eb;
          border: 2px solid white;
          border-radius: 2px;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          transition: box-shadow 0.15s ease;
        `;
        el.onmouseenter = () => { el.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.4), 0 2px 6px rgba(0,0,0,0.35)'; };
        el.onmouseleave = () => { el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.35)'; };

        const serviceUrl = service.slug ? `/services/${service.slug}` : `/services/${service.id}`;
        const popup = new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '280px' }).setHTML(`
          <div style="padding: 12px;">
            <div style="font-size: 10px; color: #2563eb; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
              🔷 Support Service
            </div>
            <div style="font-size: 15px; font-weight: 700; margin-bottom: 6px; line-height: 1.3;">${service.name}</div>
            ${service.category ? `<div style="font-size: 11px; color: #666; margin-bottom: 4px;">${service.category}</div>` : ''}
            <div style="font-size: 11px; color: #888; margin-bottom: 10px;">${service.location_city || ''}, ${service.location_state || ''}</div>
            <a href="${serviceUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 6px 12px; font-size: 11px; font-weight: 600; text-decoration: none; border-radius: 3px;">
              View Service →
            </a>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([service.longitude, service.latitude])
          .setPopup(popup)
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
        bounds.extend([service.longitude, service.latitude]);
        hasMarkers = true;
      });
    }

    // Add organization markers (purple triangles)
    if (layerVisibility.organizations) {
      organizations.forEach(org => {
        if (!org.latitude || !org.longitude) return;

        const el = document.createElement('div');
        el.className = 'org-marker';
        el.style.cssText = `
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 14px solid #9333ea;
          cursor: pointer;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));
          transition: filter 0.15s ease;
        `;
        el.onmouseenter = () => { el.style.filter = 'drop-shadow(0 0 4px rgba(147,51,234,0.6)) drop-shadow(0 2px 3px rgba(0,0,0,0.35))'; };
        el.onmouseleave = () => { el.style.filter = 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))'; };

        const orgUrl = org.slug ? `/organizations/${org.slug}` : `/organizations/${org.id}`;
        const popup = new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '280px' }).setHTML(`
          <div style="padding: 12px;">
            <div style="font-size: 10px; color: #9333ea; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
              🟣 Organization
            </div>
            <div style="font-size: 15px; font-weight: 700; margin-bottom: 6px; line-height: 1.3;">${org.name}</div>
            ${org.type ? `<div style="font-size: 11px; color: #666; margin-bottom: 4px;">${org.type}</div>` : ''}
            <div style="font-size: 11px; color: #888; margin-bottom: 10px;">${org.city || ''}, ${org.state || ''}</div>
            <a href="${orgUrl}" style="display: inline-block; background: #9333ea; color: white; padding: 6px 12px; font-size: 11px; font-weight: 600; text-decoration: none; border-radius: 3px;">
              View Organization →
            </a>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([org.longitude, org.latitude])
          .setPopup(popup)
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
        bounds.extend([org.longitude, org.latitude]);
        hasMarkers = true;
      });
    }

    // Fit bounds if we have markers
    if (hasMarkers && !bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 7, duration: 1000 });
    }
  }, [facilities, programs, services, organizations, mapReady, layerVisibility]);

  // Handle fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Resize map when fullscreen changes
  useEffect(() => {
    if (mapRef.current && mapReady) {
      setTimeout(() => mapRef.current?.resize(), 100);
    }
  }, [isFullscreen, mapReady]);

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setLayerVisibility(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Counts with visibility
  const visibleFacilitiesCount = layerVisibility.facilities ? facilities.filter(f => f.latitude).length : 0;
  const visibleProgramsCount = layerVisibility.programs ? programs.filter(p => p.latitude).length : 0;
  const visibleServicesCount = layerVisibility.services ? services.filter(s => s.latitude).length : 0;
  const visibleOrgsCount = layerVisibility.organizations ? organizations.filter(o => o.latitude).length : 0;

  const ControlsBar = () => (
    <div className="bg-white border-2 border-black border-b-0 p-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {showControls && (
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-2 border-2 border-black font-bold text-sm bg-white"
          >
            <option value="">All States</option>
            <option value="NSW">New South Wales</option>
            <option value="VIC">Victoria</option>
            <option value="QLD">Queensland</option>
            <option value="SA">South Australia</option>
            <option value="WA">Western Australia</option>
            <option value="TAS">Tasmania</option>
            <option value="NT">Northern Territory</option>
            <option value="ACT">ACT</option>
          </select>
        )}
      </div>

      {/* Layer toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => toggleLayer('facilities')}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold border-2 transition-all ${
            layerVisibility.facilities
              ? 'border-red-600 bg-red-50 text-red-700'
              : 'border-gray-300 bg-gray-100 text-gray-400'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Detention</span>
          <span className="font-mono">({facilities.filter(f => f.latitude).length})</span>
        </button>
        <button
          onClick={() => toggleLayer('programs')}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold border-2 transition-all ${
            layerVisibility.programs
              ? 'border-green-600 bg-green-50 text-green-700'
              : 'border-gray-300 bg-gray-100 text-gray-400'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Programs</span>
          <span className="font-mono">({programs.filter(p => p.latitude).length})</span>
        </button>
        <button
          onClick={() => toggleLayer('services')}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold border-2 transition-all ${
            layerVisibility.services
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-300 bg-gray-100 text-gray-400'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Services</span>
          <span className="font-mono">({services.filter(s => s.latitude).length})</span>
        </button>
        <button
          onClick={() => toggleLayer('organizations')}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold border-2 transition-all ${
            layerVisibility.organizations
              ? 'border-purple-600 bg-purple-50 text-purple-700'
              : 'border-gray-300 bg-gray-100 text-gray-400'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Orgs</span>
          <span className="font-mono">({organizations.filter(o => o.latitude).length})</span>
        </button>
      </div>

      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="flex items-center gap-2 px-3 py-2 border-2 border-black font-bold text-sm bg-white hover:bg-gray-100"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
      </button>
    </div>
  );

  const Legend = () => (
    <div className="absolute bottom-4 left-4 bg-white border-2 border-black p-3 z-10 shadow-lg">
      <div className="text-xs font-bold mb-2 text-gray-600 uppercase tracking-wide">Legend</div>
      <div className="space-y-1.5 text-xs">
        {layerVisibility.facilities && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-sm border border-white shadow"></div>
            <span>Detention Centres ({visibleFacilitiesCount})</span>
          </div>
        )}
        {layerVisibility.programs && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded-full border border-white shadow"></div>
            <span>Community Programs ({visibleProgramsCount})</span>
          </div>
        )}
        {layerVisibility.services && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 border border-white shadow rounded-sm"></div>
            <span>Support Services ({visibleServicesCount})</span>
          </div>
        )}
        {layerVisibility.organizations && (
          <div className="flex items-center gap-2">
            <div className="w-0 h-0" style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '9px solid #9333ea' }}></div>
            <span>Organizations ({visibleOrgsCount})</span>
          </div>
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500">
        Click markers for details & links
      </div>
    </div>
  );

  // Use CSS-based fullscreen to keep the same DOM structure - this prevents map from unmounting
  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-white flex flex-col' : ''}>
      {/* Fullscreen header - only shows in fullscreen */}
      {isFullscreen && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b-2 border-black">
          <h2 className="font-bold text-lg">Youth Justice Ecosystem Map</h2>
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-2 hover:bg-gray-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <ControlsBar />

      <div
        className={`border-2 border-black bg-gray-100 relative ${isFullscreen ? 'flex-1' : ''}`}
        style={isFullscreen ? undefined : { height }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" />
        <Legend />
      </div>
    </div>
  );
}
