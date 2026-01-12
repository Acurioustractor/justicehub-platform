'use client';

import type { ComponentType } from 'react';
import type { StyleSpecification } from 'maplibre-gl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Brain,
  Compass,
  Filter,
  Globe2,
  Home,
  Layers,
  MapPin,
  Scale,
  Search,
  Sparkles,
  Users
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  CommunityMapCategory,
  communityMapServices as staticServices,
  CommunityMapService
} from '@/content/community-map-services';

type CategoryOption = {
  id: 'all' | CommunityMapCategory;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const categoryColors: Record<CommunityMapCategory, string> = {
  justice: '#1d4ed8',
  healing: '#047857',
  skills: '#92400e',
  housing: '#dc2626',
  mental_health: '#7c3aed',
  education: '#0f766e',
  family: '#d97706',
  emergency: '#ea580c'
};

const categoryOptions: CategoryOption[] = [
  {
    id: 'all',
    label: 'All pathways',
    description: 'Complete national view',
    icon: Layers
  },
  {
    id: 'justice',
    label: 'Justice & Legal',
    description: 'Court support, bail, advocacy',
    icon: Scale
  },
  {
    id: 'healing',
    label: 'Healing on Country',
    description: 'Cultural camps, restorative justice',
    icon: Compass
  },
  {
    id: 'skills',
    label: 'Skills & Vocational',
    description: 'Employment pathways and training',
    icon: Sparkles
  },
  {
    id: 'housing',
    label: 'Housing & Stability',
    description: 'Foyer models and crisis accommodation',
    icon: Home
  },
  {
    id: 'mental_health',
    label: 'Health & Wellbeing',
    description: 'AOD support and therapeutic hubs',
    icon: Brain
  },
  {
    id: 'family',
    label: 'Family Strengthening',
    description: 'Whole-of-family justice responses',
    icon: Users
  }
];

const VECTOR_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const MAPLIBRE_DEMO_STYLE_URL = 'https://demotiles.maplibre.org/style.json';
const LOCAL_STYLE_URL = '/map-style.json';
const CUSTOM_STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL;

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

const STYLE_ERROR_COPY =
  'Unable to load map tiles from public providers. Check your connection or configure NEXT_PUBLIC_MAP_STYLE_URL to a reachable style.';

type StyleSource = 'local' | 'custom' | 'carto' | 'maplibre-demo' | 'fallback';

function createPopupHTML(service: CommunityMapService) {
  const lines = [
    `<div style="max-width: 260px; font-family: 'Inter', system-ui, sans-serif;">`,
    `<h3 style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 6px;">${service.name}</h3>`,
    `<p style="font-size: 13px; color: #4b5563; line-height: 1.45; margin-bottom: 8px;">${service.description}</p>`,
    `<p style="font-size: 12px; color: #111827; font-weight: 600; margin-bottom: 4px;">${service.city}, ${service.state}</p>`,
    `<p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${service.highlight}</p>`
  ];

  if (service.website) {
    lines.push(
      `<a href="${service.website}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; font-weight: 600; color: #2563eb; text-decoration: none;">Visit website ↗</a>`
    );
  }

  lines.push('</div>');
  return lines.join('');
}

// Map database service categories to map categories
function mapCategoryToMapCategory(categories: string[] | null): CommunityMapCategory {
  if (!categories || categories.length === 0) return 'justice';

  const cat = categories[0]?.toLowerCase() || '';

  if (cat.includes('legal') || cat.includes('justice') || cat.includes('court')) return 'justice';
  if (cat.includes('heal') || cat.includes('cultur') || cat.includes('country')) return 'healing';
  if (cat.includes('skill') || cat.includes('employ') || cat.includes('vocation') || cat.includes('train')) return 'skills';
  if (cat.includes('hous') || cat.includes('accommod') || cat.includes('shelter')) return 'housing';
  if (cat.includes('mental') || cat.includes('health') || cat.includes('aod') || cat.includes('drug') || cat.includes('alcohol')) return 'mental_health';
  if (cat.includes('educ') || cat.includes('school') || cat.includes('learn')) return 'education';
  if (cat.includes('family') || cat.includes('parent') || cat.includes('child')) return 'family';
  if (cat.includes('emergency') || cat.includes('crisis')) return 'emergency';

  return 'justice';
}

// Transform database service to CommunityMapService format
function transformDbService(dbService: any): CommunityMapService | null {
  // Skip services without valid coordinates
  const lat = dbService.location_latitude || dbService.latitude;
  const lng = dbService.location_longitude || dbService.longitude;

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  const state = dbService.location?.state || dbService.state || 'Unknown';
  const city = dbService.location?.suburb || dbService.suburb || dbService.location?.city || 'Unknown';

  return {
    id: dbService.id,
    name: dbService.name || 'Unknown Service',
    category: mapCategoryToMapCategory(dbService.categories),
    description: dbService.description || 'Community service supporting young people.',
    focusAreas: dbService.categories || [],
    coordinates: {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    },
    city,
    state,
    regions: [state],
    highlight: dbService.description?.substring(0, 100) || '',
    impactStats: [],
    website: dbService.website || undefined,
    phone: dbService.phone || undefined,
    email: dbService.email || undefined,
    serviceModel: dbService.indigenous_specific ? 'community' : 'nonprofit',
    tags: [
      ...(dbService.indigenous_specific ? ['First Nations-led'] : []),
      ...(dbService.youth_specific ? ['Youth-focused'] : []),
      ...(state !== 'Unknown' ? [state] : [])
    ]
  };
}

export default function CommunityMapPage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | CommunityMapCategory>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [styleSource, setStyleSource] = useState<StyleSource>('local');
  const [styleError, setStyleError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [services, setServices] = useState<CommunityMapService[]>(staticServices);
  const [isLoading, setIsLoading] = useState(true);
  const styleErrorTimeout = useRef<NodeJS.Timeout | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const markerMapRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  // Fetch services from database on mount
  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch('/api/services?limit=1000');
        const result = await response.json();

        if (result.success && result.data) {
          const transformedServices = result.data
            .map(transformDbService)
            .filter((s: CommunityMapService | null): s is CommunityMapService => s !== null);

          if (transformedServices.length > 0) {
            setServices(transformedServices);
          }
        }
      } catch (error) {
        console.error('Failed to fetch services, using static data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchServices();
  }, []);

  const regionOptions = useMemo(() => {
    const regions = new Set<string>();
    services.forEach((service) => {
      service.regions.forEach((region) => regions.add(region));
    });
    return ['all', ...Array.from(regions).sort()];
  }, [services]);

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return services.filter((service) => {
      if (selectedCategory !== 'all' && service.category !== selectedCategory) {
        return false;
      }
      if (selectedRegion !== 'all' && !service.regions.includes(selectedRegion)) {
        return false;
      }
      if (query.length > 0) {
        const haystack = [
          service.name,
          service.description,
          service.city,
          service.state,
          service.focusAreas.join(' '),
          service.tags.join(' ')
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, selectedCategory, selectedRegion, services]);

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
        key: StyleSource;
        url?: string;
        style?: StyleSpecification;
        label: string;
      }> = [];

      if (CUSTOM_STYLE_URL) {
        styleAttempts.push({
          key: 'custom',
          url: CUSTOM_STYLE_URL,
          label: 'Custom style URL'
        });
      }

      styleAttempts.push({
        key: 'local',
        url: LOCAL_STYLE_URL,
        label: 'Local JusticeHub style'
      });

      styleAttempts.push(
        {
          key: 'carto',
          url: VECTOR_STYLE_URL,
          label: 'Carto Positron'
        },
        {
          key: 'maplibre-demo',
          url: MAPLIBRE_DEMO_STYLE_URL,
          label: 'MapLibre demo style'
        },
        {
          key: 'fallback',
          style: FALLBACK_RASTER_STYLE,
          label: 'OpenStreetMap raster'
        }
      );

      let mapStyle: StyleSpecification | string = FALLBACK_RASTER_STYLE;
      let resolvedStyleSource: StyleSource = 'fallback';
      let encounteredError: string | null = null;

      for (const attempt of styleAttempts) {
        if (attempt.style) {
          mapStyle = attempt.style;
          resolvedStyleSource = attempt.key;
          break;
        }

        if (!attempt.url) {
          continue;
        }

        try {
          const response = await fetch(attempt.url, { cache: 'no-store' });
          if (response.ok) {
            mapStyle = await response.json();
            resolvedStyleSource = attempt.key;
            encounteredError = null;
            break;
          }

          encounteredError = `${attempt.label} unavailable (${response.status})`;
          console.warn(`JusticeHub Community Map – ${attempt.label} request failed:`, response.statusText);
        } catch (error) {
          encounteredError = `${attempt.label} request failed`;
          console.warn(`JusticeHub Community Map – ${attempt.label} fetch error:`, error);
        }
      }

      if (cancelled) {
        return;
      }

      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: [133.7751, -26.2744],
        zoom: 3.4,
        attributionControl: false
      });

      mapRef.current.once('load', () => {
        if (!cancelled) {
          setMapReady(true);
        }
      });

      setStyleSource(resolvedStyleSource);

      if (encounteredError) {
        setStyleError(STYLE_ERROR_COPY);
      } else {
        setStyleError(null);
      }

      mapRef.current.scrollZoom.setWheelZoomRate(1 / 400);
      mapRef.current.scrollZoom.setZoomRate(1 / 400);
      mapRef.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
      mapRef.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
      mapRef.current.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');
    };

    initialiseMap();

    return () => {
      cancelled = true;
      setMapReady(false);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (styleError && !styleErrorTimeout.current) {
      styleErrorTimeout.current = setTimeout(() => {
        setStyleError(null);
        styleErrorTimeout.current = null;
      }, 8000);
    }

    return () => {
      if (styleErrorTimeout.current) {
        clearTimeout(styleErrorTimeout.current);
        styleErrorTimeout.current = null;
      }
    };
  }, [styleError]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    markerMapRef.current = new Map();

    if (filteredServices.length === 0) {
      return;
    }

    const bounds = new LngLatBounds();

    filteredServices.forEach((service) => {
      const popup = new maplibregl.Popup({ offset: 16, closeButton: true }).setHTML(createPopupHTML(service));
      const marker = new maplibregl.Marker({ color: categoryColors[service.category] || '#111827' })
        .setLngLat([service.coordinates.lng, service.coordinates.lat])
        .setPopup(popup)
        .addTo(mapRef.current as maplibregl.Map);

      markersRef.current.push(marker);
      markerMapRef.current.set(service.id, marker);
      bounds.extend([service.coordinates.lng, service.coordinates.lat]);
    });

    if (filteredServices.length === 1) {
      const single = filteredServices[0];
      mapRef.current.flyTo({
        center: [single.coordinates.lng, single.coordinates.lat],
        zoom: 7,
        speed: 0.9
      });
    } else if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 6.2, duration: 1000 });
    }
  }, [filteredServices, mapReady]);

  const totalServices = services.length;
  const firstNationsLed = useMemo(
    () => services.filter((service) => service.tags.includes('First Nations-led')).length,
    [services]
  );
  const regionalServices = useMemo(
    () => services.filter((service) => service.regions.includes('Regional') || service.regions.includes('Remote')).length,
    [services]
  );

  const handleServiceFocus = (service: CommunityMapService) => {
    setSelectedServiceId(service.id);
    const marker = markerMapRef.current.get(service.id);
    if (marker && mapRef.current) {
      markerMapRef.current.forEach((otherMarker, id) => {
        if (id !== service.id) {
          const otherPopup = otherMarker.getPopup();
          if (otherPopup && otherPopup.isOpen()) {
            otherPopup.remove();
          }
        }
      });
      const popup = marker.getPopup();
      if (popup && !popup.isOpen()) {
        popup.addTo(mapRef.current);
      }
      mapRef.current.flyTo({
        center: [service.coordinates.lng, service.coordinates.lat],
        zoom: 7,
        speed: 0.9
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="page-content">
        <section className="border-b-2 border-black bg-gradient-to-br from-blue-100 via-white to-purple-100">
          <div className="container-justice py-16">
            <p className="font-mono uppercase tracking-[0.4em] text-xs text-gray-600 mb-4 text-center md:text-left">
              Community Intelligence • Justice Navigation
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="headline-truth mb-6">
                  COMMUNITY MAP
                  <span className="block text-3xl md:text-4xl text-black mt-2">
                    Find the services that keep young people strong, safe, and home.
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8">
                  National network of justice innovation proven on the ground. Explore First Nations-led diversion,
                  housing-first foyers, healing centres, and programs getting real results for young people.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border-2 border-black bg-white p-4">
                    <div className="text-3xl font-bold text-black">{isLoading ? '...' : totalServices}</div>
                    <div className="text-sm font-semibold uppercase tracking-wide">Services mapped</div>
                    <p className="text-xs text-gray-600 mt-2">Curated from national justice innovators and community leaders.</p>
                  </div>
                  <div className="border-2 border-black bg-white p-4">
                    <div className="text-3xl font-bold text-black">{isLoading ? '...' : firstNationsLed}</div>
                    <div className="text-sm font-semibold uppercase tracking-wide">First Nations led</div>
                    <p className="text-xs text-gray-600 mt-2">Delivering cultural authority and justice reinvestment on Country.</p>
                  </div>
                  <div className="border-2 border-black bg-white p-4">
                    <div className="text-3xl font-bold text-black">{isLoading ? '...' : regionalServices}</div>
                    <div className="text-sm font-semibold uppercase tracking-wide">Regional & Remote</div>
                    <p className="text-xs text-gray-600 mt-2">Programs reaching beyond capital cities with wraparound support.</p>
                  </div>
                </div>
              </div>
              <div className="border-2 border-black bg-white p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Globe2 className="h-10 w-10 text-blue-700" />
                  <div>
                    <div className="font-bold uppercase tracking-wide text-sm text-black">Built with communities</div>
                    <p className="text-sm text-gray-600">
                      Each location is verified with program teams and community partners. Want to add your service?
                      Scroll to the end to learn how to nominate.
                    </p>
                  </div>
                </div>
                <ul className="text-sm space-y-2 text-gray-700">
                  <li>• Live map syncing with JusticeHub service intelligence</li>
                  <li>• Filter by justice focus, region and program type</li>
                  <li>• Popups share evidence, cultural approach, and contact info</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-black bg-white">
          <div className="container-justice py-12 space-y-10">
            <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-10">
              <div className="space-y-6">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                  <div className="flex-1">
                    <label htmlFor="map-search" className="sr-only">
                      Search services
                    </label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input
                        id="map-search"
                        type="text"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search by service name, focus area, or location..."
                        className="w-full pl-12 pr-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black text-base"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-gray-700">
                      <Filter className="h-4 w-4 mr-2" />
                      {filteredServices.length} services showing
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedRegion('all');
                        setSearchQuery('');
                        setSelectedServiceId(null);
                      }}
                      className="px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white font-bold tracking-wide transition-colors text-sm"
                    >
                      Reset filters
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {categoryOptions.map((category) => {
                    const Icon = category.icon;
                    const active = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        className={`text-left border-2 border-black px-4 py-4 transition-all ${
                          active ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-flex items-center justify-center rounded-full border border-current"
                            style={{
                              width: '2.5rem',
                              height: '2.5rem',
                              backgroundColor:
                                active && category.id !== 'all'
                                  ? categoryColors[category.id as CommunityMapCategory]
                                  : '#ffffff',
                              color: active ? '#ffffff' : '#111827'
                            }}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <div className="font-bold uppercase tracking-wide text-sm">{category.label}</div>
                            <div className="text-xs text-gray-600">{category.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-3">
                  {regionOptions.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => setSelectedRegion(region)}
                      className={`px-4 py-2 border-2 border-black text-sm font-bold tracking-wide transition-colors ${
                        selectedRegion === region ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      {region === 'all' ? 'Whole country' : region}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-2 border-black bg-gray-50 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-black" />
                  <div>
                    <div className="font-bold uppercase tracking-wide text-sm text-black">Live map insights</div>
                    <p className="text-xs text-gray-600">
                      Categories are curated for justice outcomes: legal pathways, housing stabilisation, healing on
                      Country, and skill-building transitions.
                    </p>
                  </div>
                </div>
                <ul className="text-sm space-y-2 text-gray-700">
                  <li>• Click a card below to focus the map and open the service evidence</li>
                  <li>• Colours represent program focus – see legend above</li>
                  <li>• Remote programs stay centred on Country even when zoomed in</li>
                </ul>
              </div>
            </div>

            <div className="border-2 border-black h-[520px] w-full bg-gray-100">
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>
            {styleError && (
              <div className="border-2 border-yellow-500 bg-yellow-50 text-yellow-900 px-4 py-3 text-sm font-medium">
                {styleError}
              </div>
            )}
          </div>
        </section>

        <section className="border-b-2 border-black bg-gray-50">
          <div className="container-justice py-16 space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-black">Programs with evidence of impact</h2>
                <p className="text-sm text-gray-600 mt-2">
                  These services meet JusticeHub&apos;s inclusion criteria: measurable outcomes, cultural safety, and
                  community endorsement.
                </p>
              </div>
              <div className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                {filteredServices.length} of {totalServices} services displayed
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <article
                  key={service.id}
                  className={`border-2 border-black bg-white p-6 flex flex-col gap-4 transition-shadow ${
                    selectedServiceId === service.id ? 'shadow-lg shadow-black/20' : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="inline-flex items-center justify-center text-white text-xs font-bold uppercase tracking-widest px-3 py-1"
                          style={{ backgroundColor: categoryColors[service.category] }}
                        >
                          {service.category.replace('_', ' ')}
                        </span>
                        {service.tags.includes('First Nations-led') && (
                          <span className="inline-flex items-center px-2 py-1 border border-black text-[11px] uppercase tracking-wide">
                            First Nations led
                          </span>
                        )}
                        {service.regions.includes('Remote') && (
                          <span className="inline-flex items-center px-2 py-1 border border-black text-[11px] uppercase tracking-wide">
                            Remote
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-black leading-snug">{service.name}</h3>
                      <p className="text-sm text-gray-600">
                        {service.city} • {service.state}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleServiceFocus(service)}
                      className="inline-flex items-center gap-2 px-3 py-2 border border-black text-xs uppercase tracking-wide font-bold hover:bg-black hover:text-white transition-colors"
                    >
                      Focus map
                    </button>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed">{service.description}</p>

                  <div className="space-y-2">
                    <div className="font-semibold text-xs uppercase tracking-wide text-gray-700">Focus areas</div>
                    <div className="flex flex-wrap gap-2">
                      {service.focusAreas.map((focus) => (
                        <span
                          key={focus}
                          className="inline-flex items-center px-3 py-1 bg-gray-100 border border-gray-300 text-xs uppercase tracking-wide font-semibold text-gray-700"
                        >
                          {focus}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-100 border border-gray-200 p-4 space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Evidence & outcomes
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {service.impactStats.map((stat) => (
                        <li key={stat}>• {stat}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-600 uppercase tracking-wide">
                    {service.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 border border-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {service.website && (
                    <a
                      href={service.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-blue-700 hover:text-blue-500"
                    >
                      Visit website ↗
                    </a>
                  )}
                </article>
              ))}
            </div>

            {filteredServices.length === 0 && (
              <div className="border-2 border-black bg-white p-10 text-center">
                <p className="text-lg font-semibold text-black mb-4">No services match those filters yet.</p>
                <p className="text-sm text-gray-600">
                  Try clearing a filter or search term. If we&apos;re missing a service you work with, follow the steps
                  below to nominate it for the map.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white border-b-2 border-black">
          <div className="container-justice py-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="border-2 border-black bg-gray-50 p-8">
              <h3 className="text-2xl font-bold text-black mb-4">How we choose services for the Community Map</h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-6">
                JusticeHub uses clear evidence and community endorsement criteria. Each program mapped here delivers
                measurable justice outcomes, centres culture and safety, and is actively operating in community.
              </p>
              <ul className="space-y-4 text-sm text-gray-700">
                <li>
                  <span className="font-semibold uppercase tracking-wide text-xs text-black block">Evidence of impact</span>
                  <span>Documented outcomes, evaluation, or strong practice evidence from partners and communities.</span>
                </li>
                <li>
                  <span className="font-semibold uppercase tracking-wide text-xs text-black block">Cultural authority</span>
                  <span>First Nations governance or demonstrated cultural safety for the communities being served.</span>
                </li>
                <li>
                  <span className="font-semibold uppercase tracking-wide text-xs text-black block">Active service delivery</span>
                  <span>Program is currently operating and accepting referrals or participants.</span>
                </li>
              </ul>
            </div>
            <div className="border-2 border-black bg-white p-8 space-y-6">
              <h3 className="text-2xl font-bold text-black">Nominate a service to add</h3>
              <p className="text-sm text-gray-700">
                We want this map to reflect the full strength of grassroots justice work. Share services that should be
                here and we&apos;ll follow up to verify the details.
              </p>
              <ol className="space-y-4 text-sm text-gray-700 list-decimal list-inside">
                <li>
                  Email <span className="font-semibold">map@justicehub.au</span> with program name, website, contact, and
                  why it works.
                </li>
                <li>
                  Our team will confirm impact evidence with the organisation and community partners.
                </li>
                <li>
                  Once verified, we will add the program with geo-coordinates, focus tags, and impact notes.
                </li>
              </ol>
              <p className="text-xs text-gray-500">
                Prefer a form? Use <a href="https://justicehub.au/nominate" className="underline">justicehub.au/nominate</a>{' '}
                to upload supporting evidence, evaluation reports, or letters of support.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
