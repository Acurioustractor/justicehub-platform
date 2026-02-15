#!/usr/bin/env node
/**
 * Geocode services to add latitude/longitude coordinates
 *
 * This script adds geographic coordinates to services based on their
 * city and state information, enabling map-based service discovery.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Australian city coordinates (major cities)
const CITY_COORDINATES: Record<string, { lat: number, lng: number }> = {
  // Queensland
  'brisbane': { lat: -27.4705, lng: 153.0260 },
  'gold coast': { lat: -28.0167, lng: 153.4000 },
  'sunshine coast': { lat: -26.6500, lng: 153.0667 },
  'townsville': { lat: -19.2590, lng: 146.8169 },
  'cairns': { lat: -16.9186, lng: 145.7781 },
  'toowoomba': { lat: -27.5598, lng: 151.9507 },
  'rockhampton': { lat: -23.3781, lng: 150.5136 },
  'mackay': { lat: -21.1450, lng: 149.1669 },
  'bundaberg': { lat: -24.8661, lng: 152.3489 },
  'hervey bay': { lat: -25.2897, lng: 152.8715 },
  'gladstone': { lat: -23.8478, lng: 151.2569 },
  'ipswich': { lat: -27.6144, lng: 152.7599 },
  'logan': { lat: -27.6397, lng: 153.1092 },
  'mount isa': { lat: -20.7256, lng: 139.4927 },
  'charters towers': { lat: -20.0772, lng: 146.2620 },
  'beenleigh': { lat: -27.7165, lng: 153.2029 },
  'south brisbane': { lat: -27.4803, lng: 153.0210 },
  'st lucia': { lat: -27.4988, lng: 153.0124 },
  'cleveland': { lat: -27.5278, lng: 153.2594 },

  // NSW
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'newcastle': { lat: -32.9283, lng: 151.7817 },
  'wollongong': { lat: -34.4278, lng: 150.8931 },
  'dubbo': { lat: -32.2571, lng: 148.6058 },
  'wagga wagga': { lat: -35.1082, lng: 147.3598 },
  'bourke': { lat: -30.0914, lng: 145.9370 },
  'moree': { lat: -29.4639, lng: 149.8386 },
  'cowra': { lat: -33.8269, lng: 148.6875 },
  'nowra': { lat: -34.8817, lng: 150.6005 },
  'mount druitt': { lat: -33.7684, lng: 150.8205 },

  // Victoria
  'melbourne': { lat: -37.8136, lng: 144.9631 },
  'geelong': { lat: -38.1499, lng: 144.3617 },
  'ballarat': { lat: -37.5622, lng: 143.8503 },
  'bendigo': { lat: -36.7570, lng: 144.2794 },
  'shepparton': { lat: -36.3806, lng: 145.3986 },
  'melton': { lat: -37.6833, lng: 144.5833 },

  // South Australia
  'adelaide': { lat: -34.9285, lng: 138.6007 },
  'port adelaide': { lat: -34.8458, lng: 138.5056 },
  'port augusta': { lat: -32.4931, lng: 137.7658 },
  'ceduna': { lat: -32.1264, lng: 133.6758 },

  // Western Australia
  'perth': { lat: -31.9505, lng: 115.8605 },
  'halls creek': { lat: -18.2301, lng: 127.7694 },
  'roebourne': { lat: -20.7781, lng: 117.1372 },
  'warburton': { lat: -26.1333, lng: 126.5833 },
  'fitzroy crossing': { lat: -18.1981, lng: 125.5692 },
  'broome': { lat: -17.9614, lng: 122.2359 },

  // Northern Territory
  'darwin': { lat: -12.4634, lng: 130.8456 },
  'alice springs': { lat: -23.6980, lng: 133.8807 },
  'groote eylandt': { lat: -13.9806, lng: 136.4603 },
  'lajamanu': { lat: -18.3333, lng: 130.6500 },
  'maningrida': { lat: -12.0558, lng: 134.2339 },
  'ntaria': { lat: -23.9333, lng: 132.7667 },
  'hermannsburg': { lat: -23.9333, lng: 132.7667 },

  // Tasmania
  'hobart': { lat: -42.8821, lng: 147.3272 },
  'launceston': { lat: -41.4332, lng: 147.1441 },

  // ACT
  'canberra': { lat: -35.2809, lng: 149.1300 },

  // Generic state centers (fallback)
  'queensland': { lat: -20.9176, lng: 142.7028 },
  'new south wales': { lat: -31.2532, lng: 146.9211 },
  'victoria': { lat: -37.4713, lng: 144.7852 },
  'south australia': { lat: -30.0002, lng: 136.2092 },
  'western australia': { lat: -27.6728, lng: 121.6283 },
  'northern territory': { lat: -19.4914, lng: 132.5510 },
  'tasmania': { lat: -41.4545, lng: 145.9707 },
  'australian capital territory': { lat: -35.2809, lng: 149.1300 }
};

async function geocodeService(service: any): Promise<{ lat: number, lng: number } | null> {
  const city = service.location_city?.toLowerCase().trim();
  const state = service.location_state?.toLowerCase().trim();

  // Try exact city match first
  if (city && CITY_COORDINATES[city]) {
    return CITY_COORDINATES[city];
  }

  // Try partial city match (e.g., "Brisbane Metro" -> "brisbane")
  if (city) {
    for (const [knownCity, coords] of Object.entries(CITY_COORDINATES)) {
      if (city.includes(knownCity) || knownCity.includes(city.split(' ')[0])) {
        return coords;
      }
    }
  }

  // Fallback to state center
  if (state) {
    const stateMap: Record<string, string> = {
      'qld': 'queensland',
      'nsw': 'new south wales',
      'vic': 'victoria',
      'sa': 'south australia',
      'wa': 'western australia',
      'nt': 'northern territory',
      'tas': 'tasmania',
      'act': 'australian capital territory'
    };

    const fullStateName = stateMap[state] || state;
    if (CITY_COORDINATES[fullStateName]) {
      return CITY_COORDINATES[fullStateName];
    }
  }

  return null;
}

async function main() {
  console.log('============================================================');
  console.log('📍 GEOCODING SERVICES');
  console.log('============================================================\n');

  // Get services without coordinates
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name, location_city, location_state, location_latitude, location_longitude')
    .is('location_latitude', null);

  if (error) {
    console.error('❌ Error fetching services:', error);
    return;
  }

  if (!services || services.length === 0) {
    console.log('✅ All services already have coordinates!');
    return;
  }

  console.log(`Found ${services.length} services needing geocoding\n`);

  let geocoded = 0;
  let failed = 0;

  for (const service of services) {
    const coords = await geocodeService(service);

    if (coords) {
      const { error: updateError } = await supabase
        .from('services')
        .update({
          location_latitude: coords.lat,
          location_longitude: coords.lng
        })
        .eq('id', service.id);

      if (updateError) {
        console.log(`❌ ${service.name}: Failed to update`);
        failed++;
      } else {
        console.log(`✅ ${service.name}: ${service.location_city || service.location_state} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
        geocoded++;
      }
    } else {
      console.log(`⚠️  ${service.name}: No coordinates found (${service.location_city}, ${service.location_state})`);
      failed++;
    }
  }

  console.log('\n============================================================');
  console.log('📊 GEOCODING SUMMARY');
  console.log('============================================================');
  console.log(`Total services: ${services.length}`);
  console.log(`✅ Geocoded: ${geocoded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success rate: ${Math.round(geocoded/services.length*100)}%`);

  console.log('\n💡 Services are now ready for map-based discovery!');
}

main().catch(console.error);
