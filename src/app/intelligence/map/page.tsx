'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { LngLatBounds } from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Link from 'next/link';
import {
  MapPin,
  Layers,
  Filter,
  Building2,
  Users,
  BookOpen,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

interface MapLocation {
  id: string;
  name: string;
  description?: string;
  type: string;
  category: 'detention' | 'program' | 'service';
  latitude: number;
  longitude: number;
  geography: string[];
  evidenceLevel?: string;
  url: string;
}

const CATEGORY_COLORS = {
  detention: '#dc2626', // Red
  program: '#059669',   // Green
  service: '#2563eb',   // Blue
};

const CATEGORY_LABELS = {
  detention: 'Detention Centre',
  program: 'Program/Intervention',
  service: 'Service',
};

const FALLBACK_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm-tiles',
    },
  ],
};

function createPopupHTML(location: MapLocation) {
  const color = CATEGORY_COLORS[location.category];
  return `
    <div style="max-width: 280px; font-family: 'Inter', system-ui, sans-serif;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="display: inline-block; padding: 2px 8px; background: ${color}; color: white; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
          ${CATEGORY_LABELS[location.category]}
        </span>
      </div>
      <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 6px;">${location.name}</h3>
      ${location.description ? `<p style="font-size: 13px; color: #4b5563; line-height: 1.45; margin-bottom: 8px;">${location.description.substring(0, 150)}${location.description.length > 150 ? '...' : ''}</p>` : ''}
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
        <strong>Type:</strong> ${location.type}<br/>
        <strong>Location:</strong> ${location.geography.join(', ')}
        ${location.evidenceLevel ? `<br/><strong>Evidence:</strong> ${location.evidenceLevel}` : ''}
      </div>
      <a href="${location.url}" style="font-size: 12px; font-weight: 600; color: ${color}; text-decoration: none;">
        View Details →
      </a>
    </div>
  `;
}

export default function ALMAMapPage() {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(['detention', 'program', 'service'])
  );
  const [selectedState, setSelectedState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapReady, setMapReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Fetch locations from API
  useEffect(() => {
    async function fetchLocations() {
      try {
        console.log('Fetching map locations...');
        const response = await fetch('/api/intelligence/map-locations');
        if (!response.ok) throw new Error('Failed to fetch locations');
        const data = await response.json();
        console.log('Map locations loaded:', data.locations?.length || 0);
        setLocations(data.locations || []);
      } catch (err) {
        console.error('Map fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    }
    fetchLocations();
  }, []);

  // Filter locations
  const filteredLocations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return locations.filter((loc) => {
      // Category filter
      if (!selectedCategories.has(loc.category)) return false;

      // State filter
      if (selectedState !== 'all') {
        const hasState = loc.geography.some(
          (g) => g.toUpperCase() === selectedState.toUpperCase()
        );
        if (!hasState) return false;
      }

      // Search filter
      if (query) {
        const haystack = [
          loc.name,
          loc.description || '',
          loc.type,
          ...loc.geography,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [locations, selectedCategories, selectedState, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const byCategory: Record<string, number> = { detention: 0, program: 0, service: 0 };
    const byState: Record<string, number> = {};

    locations.forEach((loc) => {
      byCategory[loc.category] = (byCategory[loc.category] || 0) + 1;
      loc.geography.forEach((g) => {
        const state = g.toUpperCase();
        if (['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].includes(state)) {
          byState[state] = (byState[state] || 0) + 1;
        }
      });
    });

    return { byCategory, byState };
  }, [locations]);

  // Initialize map
  useEffect(() => {
    console.log('Map init effect running', {
      hasContainer: !!mapContainerRef.current,
      hasMap: !!mapRef.current,
      loading
    });

    if (!mapContainerRef.current) {
      console.log('No map container yet');
      return;
    }
    if (mapRef.current) {
      console.log('Map already initialized');
      return;
    }

    // SSR guard
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const initMap = async () => {
      console.log('initMap called');
      // Style fallback chain
      const styleAttempts = [
        { url: '/map-style.json', label: 'Local style' },
        { url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', label: 'Carto Positron' },
        { url: 'https://demotiles.maplibre.org/style.json', label: 'MapLibre demo' },
        { style: FALLBACK_RASTER_STYLE, label: 'OpenStreetMap raster' }
      ];

      let mapStyle: StyleSpecification | string = FALLBACK_RASTER_STYLE;

      for (const attempt of styleAttempts) {
        if (attempt.style) {
          mapStyle = attempt.style;
          break;
        }
        if (!attempt.url) continue;

        try {
          const response = await fetch(attempt.url, { cache: 'no-store' });
          if (response.ok) {
            mapStyle = await response.json();
            console.log(`Map using ${attempt.label}`);
            break;
          }
        } catch {
          console.warn(`Map style ${attempt.label} failed`);
        }
      }

      if (cancelled) return;

      console.log('Creating map with container:', mapContainerRef.current);

      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current!,
        style: mapStyle,
        center: [134, -26], // Center on Australia
        zoom: 4,
        attributionControl: false,
      });

      mapRef.current.on('error', (e) => {
        console.error('MapLibre error:', e);
      });

      mapRef.current.once('load', () => {
        console.log('Map loaded successfully!');
        if (!cancelled) setMapReady(true);
      });

      // Also log if style loads
      mapRef.current.once('style.load', () => {
        console.log('Map style loaded');
        // Force resize in case container dimensions weren't ready
        setTimeout(() => {
          mapRef.current?.resize();
          console.log('Map resized');
        }, 100);
      });

      mapRef.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
      mapRef.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
      mapRef.current.addControl(
        new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }),
        'bottom-left'
      );
    };

    initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [loading]); // Re-run when loading changes so container exists

  // Update markers when filter changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (filteredLocations.length === 0) return;

    const bounds = new LngLatBounds();

    filteredLocations.forEach((location) => {
      const color = CATEGORY_COLORS[location.category];
      const popup = new maplibregl.Popup({ offset: 16, closeButton: true }).setHTML(
        createPopupHTML(location)
      );

      const marker = new maplibregl.Marker({ color })
        .setLngLat([location.longitude, location.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
      bounds.extend([location.longitude, location.latitude]);
    });

    // Fit bounds with padding
    if (filteredLocations.length > 1 && !bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 8, duration: 500 });
    } else if (filteredLocations.length === 1) {
      mapRef.current.flyTo({
        center: [filteredLocations[0].longitude, filteredLocations[0].latitude],
        zoom: 8,
        speed: 0.9,
      });
    }
  }, [filteredLocations, mapReady]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const resetFilters = () => {
    setSelectedCategories(new Set(['detention', 'program', 'service']));
    setSelectedState('all');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Navigation />

      <main className="page-content bg-gray-50 min-h-screen">
        {/* Hero */}
        <section className="border-b-2 border-black bg-gradient-to-br from-red-50 via-white to-green-50">
          <div className="container-justice py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
              <div>
                <Link
                  href="/intelligence/dashboard"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black mb-4"
                >
                  ← Back to ALMA Dashboard
                </Link>
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-8 h-8" />
                  <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                    Geographic Intelligence
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4">
                  ALMA System Map
                </h1>
                <p className="text-xl max-w-2xl text-gray-700">
                  Geographic view of Australia's youth justice infrastructure.
                  Detention centres, programs, and services with coordinates.
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block bg-gray-100 border border-black px-4 py-2">
                  <div className="text-3xl font-mono font-bold">{locations.length}</div>
                  <div className="text-xs uppercase tracking-widest text-gray-600">
                    Locations Mapped
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-2 border-red-600 bg-red-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-xs font-bold uppercase text-red-800">Detention</span>
                </div>
                <div className="text-3xl font-mono font-bold text-red-700">
                  {stats.byCategory.detention}
                </div>
              </div>
              <div className="border-2 border-green-600 bg-green-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-xs font-bold uppercase text-green-800">Programs</span>
                </div>
                <div className="text-3xl font-mono font-bold text-green-700">
                  {stats.byCategory.program}
                </div>
              </div>
              <div className="border-2 border-blue-600 bg-blue-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-bold uppercase text-blue-800">Services</span>
                </div>
                <div className="text-3xl font-mono font-bold text-blue-700">
                  {stats.byCategory.service}
                </div>
              </div>
              <div className="border-2 border-black bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase">With Evidence</span>
                </div>
                <div className="text-3xl font-mono font-bold">
                  {locations.filter((l) => l.evidenceLevel).length}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b-2 border-black bg-gray-50">
          <div className="container-justice py-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search locations..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Category Toggles */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-widest text-gray-600 mr-2">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Show:
                </span>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => toggleCategory(key)}
                    className={`px-3 py-1 text-xs font-bold uppercase tracking-wide border-2 transition-colors ${
                      selectedCategories.has(key)
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-black'
                    }`}
                    style={{
                      borderColor: selectedCategories.has(key)
                        ? CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS]
                        : undefined,
                      backgroundColor: selectedCategories.has(key)
                        ? CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS]
                        : undefined,
                    }}
                  >
                    {label.split('/')[0]}
                  </button>
                ))}
              </div>

              {/* State Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold uppercase tracking-widest text-gray-600">
                  State:
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="border-2 border-black px-3 py-1 font-mono text-sm focus:outline-none"
                >
                  <option value="all">All States</option>
                  <option value="NSW">NSW</option>
                  <option value="VIC">VIC</option>
                  <option value="QLD">QLD</option>
                  <option value="WA">WA</option>
                  <option value="SA">SA</option>
                  <option value="TAS">TAS</option>
                  <option value="ACT">ACT</option>
                  <option value="NT">NT</option>
                </select>
              </div>

              {/* Reset */}
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors text-sm font-bold"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Showing <strong>{filteredLocations.length}</strong> of{' '}
              <strong>{locations.length}</strong> locations
            </div>
          </div>
        </section>

        {/* Map */}
        <section className="border-b-2 border-black">
          <div className="container-justice py-8">
            {loading ? (
              <div className="h-[600px] border-2 border-black bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-mono text-sm">Loading map data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="h-[600px] border-2 border-red-600 bg-red-50 flex items-center justify-center">
                <div className="text-center text-red-700">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                  <p className="font-bold">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 border-2 border-red-600 hover:bg-red-600 hover:text-white transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-black h-[600px] w-full bg-gray-100">
                <div ref={mapContainerRef} className="w-full h-full" />
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 border-2 border-black bg-gray-50 p-4">
              <div className="flex items-center gap-3 mb-3">
                <Layers className="w-5 h-5" />
                <span className="font-bold uppercase tracking-widest text-sm">Map Legend</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS.detention }}
                  />
                  <span>
                    <strong>Detention Centres</strong> — Youth justice facilities
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS.program }}
                  />
                  <span>
                    <strong>Programs</strong> — Interventions & alternatives
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS.service }}
                  />
                  <span>
                    <strong>Services</strong> — Support & legal services
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Location List */}
        <section className="bg-white">
          <div className="container-justice py-12">
            <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">
              All Mapped Locations
            </h2>

            {filteredLocations.length === 0 ? (
              <div className="border-2 border-black p-12 text-center">
                <p className="text-lg font-semibold mb-2">No locations match your filters</p>
                <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLocations.map((location) => (
                  <article
                    key={location.id}
                    className="border-2 border-black bg-white p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span
                          className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white mb-2"
                          style={{ backgroundColor: CATEGORY_COLORS[location.category] }}
                        >
                          {CATEGORY_LABELS[location.category]}
                        </span>
                        <h3 className="font-bold text-lg leading-tight">{location.name}</h3>
                      </div>
                      <Link
                        href={location.url}
                        className="text-gray-400 hover:text-black transition-colors"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                    </div>
                    {location.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {location.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-100 border border-gray-200">
                        {location.type}
                      </span>
                      {location.geography.slice(0, 2).map((g) => (
                        <span key={g} className="px-2 py-1 bg-gray-100 border border-gray-200">
                          {g}
                        </span>
                      ))}
                      {location.evidenceLevel && (
                        <span className="px-2 py-1 bg-green-50 border border-green-200 text-green-700">
                          {location.evidenceLevel}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
