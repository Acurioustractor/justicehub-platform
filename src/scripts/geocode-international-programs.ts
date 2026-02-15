#!/usr/bin/env node
/**
 * Geocode International Programs
 * Adds latitude/longitude coordinates to all international programs
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

interface Coordinates {
  lat: number;
  lng: number;
}

// Approximate coordinates for major cities/countries
const locationCoordinates: { [key: string]: Coordinates } = {
  // North America
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'Chicago': { lat: 41.8781, lng: -87.6298 },
  'New York': { lat: 40.7128, lng: -74.0060 },
  'United States': { lat: 37.0902, lng: -95.7129 },
  'Canada': { lat: 56.1304, lng: -106.3468 },

  // Europe
  'United Kingdom': { lat: 51.5074, lng: -0.1278 },
  'London': { lat: 51.5074, lng: -0.1278 },
  'Iceland': { lat: 64.9631, lng: -19.0208 },
  'Online': { lat: 51.5074, lng: -0.1278 }, // Default to London for online programs

  // Africa
  'South Africa': { lat: -30.5595, lng: 22.9375 },
  'Kenya': { lat: -0.0236, lng: 37.9062 },
  'Uganda': { lat: 1.3733, lng: 32.2903 },

  // Latin America
  'Brazil': { lat: -14.2350, lng: -51.9253 },
  'Argentina': { lat: -38.4161, lng: -63.6167 },
  'Colombia': { lat: 4.5709, lng: -74.2973 },

  // Asia Pacific
  'New Zealand': { lat: -40.9006, lng: 174.8860 },
  'Auckland': { lat: -36.8485, lng: 174.7633 },

  // More specific cities
  'Birmingham': { lat: 52.4862, lng: -1.8904 },
  'Enfield': { lat: 51.6523, lng: -0.0810 },
  'North Yorkshire': { lat: 54.2766, lng: -1.8258 },
  'Boston': { lat: 42.3601, lng: -71.0589 },
  'Kansas City': { lat: 39.0997, lng: -94.5786 },
  'Dallas': { lat: 32.7767, lng: -96.7970 },
  'Pittsburgh': { lat: 40.4406, lng: -79.9959 },
  'Seattle': { lat: 47.6062, lng: -122.3321 },
  'Illinois': { lat: 40.6331, lng: -89.3985 },
};

function getCoordinates(location: string, country: string): Coordinates | null {
  // Try exact location match first
  if (locationCoordinates[location]) {
    return locationCoordinates[location];
  }

  // Try country
  if (locationCoordinates[country]) {
    return locationCoordinates[country];
  }

  // Try partial matches
  for (const [key, coords] of Object.entries(locationCoordinates)) {
    if (location.includes(key) || country.includes(key)) {
      return coords;
    }
  }

  return null;
}

async function geocodePrograms() {
  console.log('🗺️  Geocoding international programs...\n');

  // Get all programs without coordinates
  const { data: programs, error } = await supabase
    .from('international_programs')
    .select('id, name, city_location, country')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching programs:', error);
    return;
  }

  console.log(`Found ${programs.length} programs to geocode\n`);

  let updated = 0;
  let skipped = 0;

  for (const program of programs) {
    const coords = getCoordinates(
      program.city_location || '',
      program.country || ''
    );

    if (coords) {
      const { error: updateError } = await supabase
        .from('international_programs')
        .update({
          latitude: coords.lat,
          longitude: coords.lng
        })
        .eq('id', program.id);

      if (updateError) {
        console.error(`❌ Failed to update ${program.name}:`, updateError.message);
      } else {
        console.log(`✅ ${program.name} → ${coords.lat}, ${coords.lng}`);
        updated++;
      }
    } else {
      console.log(`⚠️  No coordinates for ${program.name} (${program.city_location}, ${program.country})`);
      skipped++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`📍 Total: ${programs.length}`);
  console.log(`${'='.repeat(50)}\n`);
}

geocodePrograms().catch(console.error);
