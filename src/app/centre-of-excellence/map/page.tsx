'use client';

import type { ComponentType } from 'react';
import type { StyleSpecification } from 'maplibre-gl';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import maplibregl, { LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Link from 'next/link';
import {
  Globe2,
  Layers,
  MapPin,
  Scale,
  Search,
  Compass,
  BookOpen,
  Target,
  Filter,
  Home,
  Mountain
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  ExcellenceCategory,
  allExcellenceLocations,
  ExcellenceLocation,
  excellenceCategoryColors,
  internationalModels,
  australianFrameworks,
  researchSources,
  basecampLocations
} from '@/content/excellence-map-locations';

type CategoryOption = {
  id: 'all' | ExcellenceCategory;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const categoryOptions: CategoryOption[] = [
  {
    id: 'all',
    label: 'All Resources',
    description: 'Complete global view',
    icon: Layers
  },
  {
    id: 'basecamp',
    label: 'Founding Basecamps',
    description: 'JusticeHub network hubs',
    icon: Mountain
  },
  {
    id: 'international-model',
    label: 'International Models',
    description: 'Global best practice',
    icon: Globe2
  },
  {
    id: 'australian-framework',
    label: 'Australian Frameworks',
    description: 'State-by-state approaches',
    icon: Home
  },
  {
    id: 'research-source',
    label: 'Research Sources',
    description: 'Evidence institutions',
    icon: BookOpen
  }
];

const VECTOR_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const MAPLIBRE_DEMO_STYLE_URL = 'https://demotiles.maplibre.org/style.json';
const LOCAL_STYLE_URL = '/map-style.json';

// Valid category options for URL param validation
const VALID_CATEGORIES: Array<'all' | ExcellenceCategory> = ['all', 'basecamp', 'international-model', 'australian-framework', 'research-source', 'training-hub'];

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
    location.keyStats.forEach(stat => {
      lines.push(`<div style="font-size: 12px; color: #059669; margin-bottom: 2px;">✓ ${stat}</div>`);
    });
    lines.push(`</div>`);
  }

  // Links
  lines.push(`<div style="display: flex; gap: 12px; flex-wrap: wrap;">`);
  lines.push(
    `<a href="${location.detailUrl}" style="font-size: 12px; font-weight: 600; color: #2563eb; text-decoration: none;">View Details →</a>`
  );
  if (location.externalUrl) {
    lines.push(
      `<a href="${location.externalUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; font-weight: 600; color: #7c3aed; text-decoration: none;">External Link ↗</a>`
    );
  }
  lines.push(`</div>`);

  lines.push('</div>');
  return lines.join('');
}

function ExcellenceMapContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  // Validate category param against valid options
  const initialCategory = categoryParam && VALID_CATEGORIES.includes(categoryParam as ExcellenceCategory)
    ? (categoryParam as ExcellenceCategory)
    : 'all';

  const [selectedCategory, setSelectedCategory] = useState<'all' | ExcellenceCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Sync category from URL params
  useEffect(() => {
    if (categoryParam && VALID_CATEGORIES.includes(categoryParam as ExcellenceCategory)) {
      setSelectedCategory(categoryParam as ExcellenceCategory);
    }
  }, [categoryParam]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const markerMapRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  const filteredLocations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allExcellenceLocations.filter((location) => {
      if (selectedCategory !== 'all' && location.category !== selectedCategory) {
        return false;
      }
      if (query.length > 0) {
        const haystack = [
          location.name,
          location.description,
          location.country,
          location.city || '',
          location.state || '',
          location.tags.join(' '),
          location.keyStats.join(' ')
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

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

      // Center on global view showing both Australia and international locations
      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: [25, 10], // Between Australia and Europe
        zoom: 1.8,
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
    if (!mapRef.current || !mapReady) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    markerMapRef.current = new Map();

    if (filteredLocations.length === 0) {
      return;
    }

    const bounds = new LngLatBounds();

    filteredLocations.forEach((location) => {
      const popup = new maplibregl.Popup({ offset: 16, closeButton: true }).setHTML(createPopupHTML(location));
      const marker = new maplibregl.Marker({ color: excellenceCategoryColors[location.category] || '#111827' })
        .setLngLat([location.coordinates.lng, location.coordinates.lat])
        .setPopup(popup)
        .addTo(mapRef.current as maplibregl.Map);

      markersRef.current.push(marker);
      markerMapRef.current.set(location.id, marker);
      bounds.extend([location.coordinates.lng, location.coordinates.lat]);
    });

    if (filteredLocations.length === 1) {
      const single = filteredLocations[0];
      mapRef.current.flyTo({
        center: [single.coordinates.lng, single.coordinates.lat],
        zoom: 5,
        speed: 0.9
      });
    } else if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 4, duration: 1000 });
    }
  }, [filteredLocations, mapReady]);

  const handleLocationFocus = (location: ExcellenceLocation) => {
    setSelectedLocationId(location.id);
    const marker = markerMapRef.current.get(location.id);
    if (marker && mapRef.current) {
      markerMapRef.current.forEach((otherMarker, id) => {
        if (id !== location.id) {
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
        center: [location.coordinates.lng, location.coordinates.lat],
        zoom: 5,
        speed: 0.9
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="border-b-2 border-black bg-gradient-to-br from-blue-100 via-white to-purple-100">
          <div className="container-justice py-16">
            <div className="text-center mb-12">
              <Link
                href="/centre-of-excellence"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black mb-4"
              >
                ← Back to Centre of Excellence
              </Link>
              <h1 className="headline-truth mb-6">
                GLOBAL EXCELLENCE MAP
              </h1>
              <p className="text-xl max-w-3xl mx-auto mb-8">
                Explore international best practice models, Australian state frameworks, and leading research
                institutions shaping youth justice globally.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="border-2 border-black bg-white p-6">
                <div className="text-3xl font-bold mb-2" style={{ color: excellenceCategoryColors['basecamp'] }}>
                  {basecampLocations.length}
                </div>
                <div className="text-sm font-semibold uppercase tracking-wide mb-2">Founding Basecamps</div>
                <p className="text-xs text-gray-600">JusticeHub network hubs across Australia</p>
              </div>
              <div className="border-2 border-black bg-white p-6">
                <div className="text-3xl font-bold mb-2" style={{ color: excellenceCategoryColors['international-model'] }}>
                  {internationalModels.length}
                </div>
                <div className="text-sm font-semibold uppercase tracking-wide mb-2">International Models</div>
                <p className="text-xs text-gray-600">Spain, NZ, Scotland, Nordic countries, USA</p>
              </div>
              <div className="border-2 border-black bg-white p-6">
                <div className="text-3xl font-bold mb-2" style={{ color: excellenceCategoryColors['australian-framework'] }}>
                  {australianFrameworks.length}
                </div>
                <div className="text-sm font-semibold uppercase tracking-wide mb-2">Australian Frameworks</div>
                <p className="text-xs text-gray-600">NSW, Victoria, Queensland, WA innovations</p>
              </div>
              <div className="border-2 border-black bg-white p-6">
                <div className="text-3xl font-bold mb-2" style={{ color: excellenceCategoryColors['research-source'] }}>
                  {researchSources.length}
                </div>
                <div className="text-sm font-semibold uppercase tracking-wide mb-2">Research Sources</div>
                <p className="text-xs text-gray-600">AIFS, BOCSAR, Lowitja, Annie E. Casey</p>
              </div>
            </div>
          </div>
        </section>

        {/* Filters and Map */}
        <section className="border-b-2 border-black bg-white">
          <div className="container-justice py-12 space-y-8">
            {/* Search and Filter Controls */}
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, country, keyword..."
                      className="w-full pl-12 pr-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-gray-700">
                    <Filter className="h-4 w-4 mr-2" />
                    {filteredLocations.length} locations
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                      setSelectedLocationId(null);
                    }}
                    className="px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white font-bold transition-colors text-sm"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Category Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {categoryOptions.map((category) => {
                  const Icon = category.icon;
                  const active = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
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
                                ? excellenceCategoryColors[category.id as ExcellenceCategory]
                                : '#ffffff',
                            color: active ? '#ffffff' : '#111827'
                          }}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="font-bold text-sm">{category.label}</div>
                          <div className="text-xs text-gray-600">{category.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Map */}
            <div className="border-2 border-black h-[600px] w-full bg-gray-100">
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>

            {/* Map Legend */}
            <div className="border-2 border-black bg-gray-50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-5 w-5 text-black" />
                <div className="font-bold uppercase tracking-wide text-sm">Map Legend</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: excellenceCategoryColors['basecamp'] }}
                  />
                  <span>Founding Basecamps</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: excellenceCategoryColors['international-model'] }}
                  />
                  <span>International Models</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: excellenceCategoryColors['australian-framework'] }}
                  />
                  <span>Australian Frameworks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: excellenceCategoryColors['research-source'] }}
                  />
                  <span>Research Sources</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-4">
                Click markers to view details and links to research. Use filters above to focus on specific types of excellence.
              </p>
            </div>
          </div>
        </section>

        {/* Location Cards */}
        <section className="border-b-2 border-black bg-gray-50">
          <div className="container-justice py-16 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Excellence Resources</h2>
              <div className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                {filteredLocations.length} of {allExcellenceLocations.length} displayed
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLocations.map((location) => (
                <article
                  key={location.id}
                  className={`border-2 border-black bg-white p-6 flex flex-col gap-4 transition-shadow ${
                    selectedLocationId === location.id ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-widest text-white"
                          style={{ backgroundColor: excellenceCategoryColors[location.category] }}
                        >
                          {location.type.replace('-', ' ')}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold leading-snug mb-2">{location.name}</h3>
                      <p className="text-sm text-gray-600">
                        {location.city && `${location.city}, `}{location.country}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLocationFocus(location)}
                      className="inline-flex items-center gap-2 px-3 py-2 border border-black text-xs uppercase tracking-wide font-bold hover:bg-black hover:text-white transition-colors"
                    >
                      Focus
                    </button>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed">{location.description}</p>

                  <div className="bg-gray-100 border border-gray-200 p-4 space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Key Stats</div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {location.keyStats.map((stat, idx) => (
                        <li key={idx}>✓ {stat}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={location.detailUrl}
                      className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-blue-700 hover:text-blue-500"
                    >
                      View Details →
                    </Link>
                    {location.externalUrl && (
                      <a
                        href={location.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-purple-700 hover:text-purple-500"
                      >
                        External ↗
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {filteredLocations.length === 0 && (
              <div className="border-2 border-black bg-white p-10 text-center">
                <p className="text-lg font-semibold mb-4">No locations match those filters</p>
                <p className="text-sm text-gray-600 mb-6">Try clearing filters or using different search terms</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="px-6 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function ExcellenceMapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-bold">Loading Map...</p>
        </div>
      </div>
    }>
      <ExcellenceMapContent />
    </Suspense>
  );
}
