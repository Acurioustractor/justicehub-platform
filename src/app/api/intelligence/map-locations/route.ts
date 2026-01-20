/**
 * ALMA Map Locations API
 *
 * GET /api/intelligence/map-locations - Get all geo-located interventions and services
 *
 * Returns locations with coordinates for the ALMA System Map.
 * Categories:
 * - detention: Youth detention centres
 * - program: Interventions and programs with coordinates
 * - service: Services with coordinates
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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

export async function GET() {
  try {
    const supabase = await createClient();
    const locations: MapLocation[] = [];

    // Fetch interventions with coordinates
    const { data: interventions, error: interventionsError } = await supabase
      .from('alma_interventions')
      .select('id, name, description, type, geography, latitude, longitude, evidence_level')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (interventionsError) {
      console.error('Error fetching interventions:', interventionsError);
    } else if (interventions) {
      interventions.forEach((item) => {
        // Categorize based on name/type
        const nameLower = (item.name || '').toLowerCase();
        const isDetention =
          nameLower.includes('detention') ||
          nameLower.includes('youth justice centre') ||
          nameLower.includes('youth detention');

        locations.push({
          id: item.id,
          name: item.name,
          description: item.description,
          type: item.type || 'Unknown',
          category: isDetention ? 'detention' : 'program',
          latitude: item.latitude,
          longitude: item.longitude,
          geography: Array.isArray(item.geography) ? item.geography : [item.geography].filter(Boolean),
          evidenceLevel: item.evidence_level,
          url: `/intelligence/interventions/${item.id}`,
        });
      });
    }

    // Fetch services with coordinates (if they exist)
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, description, category, latitude, longitude, location_state')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
    } else if (services) {
      services.forEach((item) => {
        locations.push({
          id: item.id,
          name: item.name,
          description: item.description,
          type: item.category || 'Service',
          category: 'service',
          latitude: item.latitude,
          longitude: item.longitude,
          geography: item.location_state ? [item.location_state] : [],
          url: `/services/${item.id}`,
        });
      });
    }

    // Sort by category (detention first), then name
    locations.sort((a, b) => {
      const categoryOrder = { detention: 0, program: 1, service: 2 };
      const catDiff = categoryOrder[a.category] - categoryOrder[b.category];
      if (catDiff !== 0) return catDiff;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      locations,
      stats: {
        total: locations.length,
        byCategory: {
          detention: locations.filter((l) => l.category === 'detention').length,
          program: locations.filter((l) => l.category === 'program').length,
          service: locations.filter((l) => l.category === 'service').length,
        },
      },
    });
  } catch (error) {
    console.error('Map locations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map locations' },
      { status: 500 }
    );
  }
}
