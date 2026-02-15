#!/usr/bin/env node
/**
 * Geocode Community Programs
 *
 * This script adds latitude/longitude coordinates to community programs
 * based on their location and state information, enabling map-based discovery.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Australian city and region coordinates
const LOCATION_COORDINATES = {
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
  'woodridge': { lat: -27.6310, lng: 153.1104 },
  'inala': { lat: -27.5853, lng: 152.9736 },
  'beaudesert': { lat: -27.9889, lng: 152.9956 },
  'palm island': { lat: -18.7333, lng: 146.5833 },
  'mornington island': { lat: -16.6667, lng: 139.5000 },
  'pormpuraaw': { lat: -14.8961, lng: 141.6056 },
  'aurukun': { lat: -13.3533, lng: 141.7283 },
  'weipa': { lat: -12.6269, lng: 141.8763 },
  'normanton': { lat: -17.6710, lng: 141.0744 },
  'doomadgee': { lat: -17.9333, lng: 138.8333 },
  'woorabinda': { lat: -24.1333, lng: 149.4500 },
  'cherbourg': { lat: -26.2842, lng: 151.9492 },

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
  'parramatta': { lat: -33.8151, lng: 151.0011 },
  'penrith': { lat: -33.7507, lng: 150.6871 },
  'lismore': { lat: -28.8134, lng: 153.2769 },
  'tamworth': { lat: -31.0833, lng: 150.9167 },
  'orange': { lat: -33.2833, lng: 149.1000 },
  'albury': { lat: -36.0808, lng: 146.9158 },
  'coffs harbour': { lat: -30.2963, lng: 153.1135 },
  'bathurst': { lat: -33.4200, lng: 149.5778 },
  'port macquarie': { lat: -31.4308, lng: 152.9089 },
  'grafton': { lat: -29.6767, lng: 152.9370 },
  'armidale': { lat: -30.5150, lng: 151.6672 },
  'broken hill': { lat: -31.9505, lng: 141.4502 },
  'walgett': { lat: -30.0239, lng: 148.1181 },
  'wilcannia': { lat: -31.5569, lng: 143.3792 },
  'brewarrina': { lat: -29.9569, lng: 146.8536 },
  'kempsey': { lat: -31.0833, lng: 152.8333 },

  // Victoria
  'melbourne': { lat: -37.8136, lng: 144.9631 },
  'geelong': { lat: -38.1499, lng: 144.3617 },
  'ballarat': { lat: -37.5622, lng: 143.8503 },
  'bendigo': { lat: -36.7570, lng: 144.2794 },
  'shepparton': { lat: -36.3806, lng: 145.3986 },
  'melton': { lat: -37.6833, lng: 144.5833 },
  'frankston': { lat: -38.1443, lng: 145.1265 },
  'mildura': { lat: -34.2075, lng: 142.1394 },
  'wodonga': { lat: -36.1217, lng: 146.8879 },
  'warrnambool': { lat: -38.3819, lng: 142.4824 },
  'horsham': { lat: -36.7108, lng: 142.2010 },
  'echuca': { lat: -36.1389, lng: 144.7517 },
  'bairnsdale': { lat: -37.8228, lng: 147.6108 },
  'traralgon': { lat: -38.1953, lng: 146.5411 },
  'dandenong': { lat: -37.9872, lng: 145.2144 },
  'sunshine': { lat: -37.7825, lng: 144.8325 },

  // South Australia
  'adelaide': { lat: -34.9285, lng: 138.6007 },
  'port adelaide': { lat: -34.8458, lng: 138.5056 },
  'port augusta': { lat: -32.4931, lng: 137.7658 },
  'ceduna': { lat: -32.1264, lng: 133.6758 },
  'port lincoln': { lat: -34.7289, lng: 135.8597 },
  'whyalla': { lat: -33.0333, lng: 137.5167 },
  'mount gambier': { lat: -37.8294, lng: 140.7828 },
  'murray bridge': { lat: -35.1211, lng: 139.2756 },
  'coober pedy': { lat: -29.0133, lng: 134.7544 },
  'port pirie': { lat: -33.1858, lng: 138.0172 },

  // Western Australia
  'perth': { lat: -31.9505, lng: 115.8605 },
  'halls creek': { lat: -18.2301, lng: 127.7694 },
  'roebourne': { lat: -20.7781, lng: 117.1372 },
  'warburton': { lat: -26.1333, lng: 126.5833 },
  'fitzroy crossing': { lat: -18.1981, lng: 125.5692 },
  'broome': { lat: -17.9614, lng: 122.2359 },
  'kununurra': { lat: -15.7736, lng: 128.7381 },
  'albany': { lat: -35.0269, lng: 117.8837 },
  'bunbury': { lat: -33.3270, lng: 115.6381 },
  'geraldton': { lat: -28.7744, lng: 114.6147 },
  'kalgoorlie': { lat: -30.7489, lng: 121.4658 },
  'mandurah': { lat: -32.5269, lng: 115.7472 },
  'fremantle': { lat: -32.0569, lng: 115.7439 },
  'midland': { lat: -31.8881, lng: 116.0111 },
  'armadale': { lat: -32.1531, lng: 116.0147 },
  'rockingham': { lat: -32.2803, lng: 115.7331 },
  'carnarvon': { lat: -24.8844, lng: 113.6594 },
  'newman': { lat: -23.3578, lng: 119.7394 },

  // Northern Territory
  'darwin': { lat: -12.4634, lng: 130.8456 },
  'alice springs': { lat: -23.6980, lng: 133.8807 },
  'groote eylandt': { lat: -13.9806, lng: 136.4603 },
  'lajamanu': { lat: -18.3333, lng: 130.6500 },
  'maningrida': { lat: -12.0558, lng: 134.2339 },
  'ntaria': { lat: -23.9333, lng: 132.7667 },
  'hermannsburg': { lat: -23.9333, lng: 132.7667 },
  'tennant creek': { lat: -19.6497, lng: 134.1911 },
  'katherine': { lat: -14.4650, lng: 132.2636 },
  'nhulunbuy': { lat: -12.1842, lng: 136.7767 },
  'wadeye': { lat: -14.2333, lng: 129.5333 },
  'yuendumu': { lat: -22.2567, lng: 131.7986 },
  'papunya': { lat: -23.2167, lng: 131.9000 },
  'ali curung': { lat: -21.0000, lng: 134.3667 },

  // Tasmania
  'hobart': { lat: -42.8821, lng: 147.3272 },
  'launceston': { lat: -41.4332, lng: 147.1441 },
  'devonport': { lat: -41.1803, lng: 146.3486 },
  'burnie': { lat: -41.0556, lng: 145.9031 },

  // ACT
  'canberra': { lat: -35.2809, lng: 149.1300 },

  // State centers (fallback)
  'queensland': { lat: -20.9176, lng: 142.7028 },
  'new south wales': { lat: -31.2532, lng: 146.9211 },
  'victoria': { lat: -37.4713, lng: 144.7852 },
  'south australia': { lat: -30.0002, lng: 136.2092 },
  'western australia': { lat: -27.6728, lng: 121.6283 },
  'northern territory': { lat: -19.4914, lng: 132.5510 },
  'tasmania': { lat: -41.4545, lng: 145.9707 },
  'australian capital territory': { lat: -35.2809, lng: 149.1300 },

  // Special location types
  'statewide': null,  // Will use state center
  'national': { lat: -25.2744, lng: 133.7751 },  // Australia center
  'regional': null,   // Will try to extract region
  'multiple': null,   // Will use state center
  'various': null     // Will use state center
};

// State abbreviation to full name mapping
const STATE_MAP = {
  'qld': 'queensland',
  'nsw': 'new south wales',
  'vic': 'victoria',
  'sa': 'south australia',
  'wa': 'western australia',
  'nt': 'northern territory',
  'tas': 'tasmania',
  'act': 'australian capital territory'
};

function geocodeProgram(program) {
  const location = program.location?.toLowerCase().trim();
  const state = program.state?.toLowerCase().trim();

  // Try exact location match first
  if (location && LOCATION_COORDINATES[location]) {
    return LOCATION_COORDINATES[location];
  }

  // Try partial location match (e.g., "Brisbane Metro" -> "brisbane")
  if (location) {
    for (const [knownLocation, coords] of Object.entries(LOCATION_COORDINATES)) {
      if (coords && (location.includes(knownLocation) || knownLocation.includes(location.split(' ')[0]))) {
        return coords;
      }
    }

    // Check for special location types that should use state center
    const specialTypes = ['statewide', 'state-wide', 'regional', 'multiple', 'various', 'across', 'throughout'];
    if (specialTypes.some(t => location.includes(t))) {
      // Use state center
      if (state) {
        const fullStateName = STATE_MAP[state] || state;
        return LOCATION_COORDINATES[fullStateName] || null;
      }
    }
  }

  // Fallback to state center
  if (state) {
    const fullStateName = STATE_MAP[state] || state;
    if (LOCATION_COORDINATES[fullStateName]) {
      // Add slight randomization to prevent markers stacking
      const baseCoords = LOCATION_COORDINATES[fullStateName];
      return {
        lat: baseCoords.lat + (Math.random() - 0.5) * 0.5,
        lng: baseCoords.lng + (Math.random() - 0.5) * 0.5
      };
    }
  }

  return null;
}

async function main() {
  console.log('============================================================');
  console.log('GEOCODING COMMUNITY PROGRAMS');
  console.log('============================================================\n');

  // Get programs without coordinates
  const { data: programs, error } = await supabase
    .from('community_programs')
    .select('id, name, location, state, latitude, longitude')
    .is('latitude', null);

  if (error) {
    console.error('Error fetching programs:', error);
    return;
  }

  if (!programs || programs.length === 0) {
    console.log('All programs already have coordinates!');

    // Show stats
    const { count } = await supabase
      .from('community_programs')
      .select('*', { count: 'exact', head: true })
      .not('latitude', 'is', null);

    console.log(`\n${count} programs with coordinates`);
    return;
  }

  console.log(`Found ${programs.length} programs needing geocoding\n`);

  let geocoded = 0;
  let failed = 0;

  for (const program of programs) {
    const coords = geocodeProgram(program);

    if (coords) {
      const { error: updateError } = await supabase
        .from('community_programs')
        .update({
          latitude: coords.lat,
          longitude: coords.lng
        })
        .eq('id', program.id);

      if (updateError) {
        console.log(`  X ${program.name}: Failed to update`);
        failed++;
      } else {
        console.log(`  + ${program.name}: ${program.location || program.state} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
        geocoded++;
      }
    } else {
      console.log(`  ? ${program.name}: No coordinates found (${program.location}, ${program.state})`);
      failed++;
    }
  }

  console.log('\n============================================================');
  console.log('GEOCODING SUMMARY');
  console.log('============================================================');
  console.log(`Total programs: ${programs.length}`);
  console.log(`Geocoded: ${geocoded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${Math.round(geocoded / programs.length * 100)}%`);

  // Show distribution by state
  const { data: stats } = await supabase
    .from('community_programs')
    .select('state')
    .not('latitude', 'is', null);

  if (stats) {
    const byState = {};
    stats.forEach(p => {
      byState[p.state] = (byState[p.state] || 0) + 1;
    });
    console.log('\nPrograms by state:');
    Object.entries(byState).sort((a, b) => b[1] - a[1]).forEach(([state, count]) => {
      console.log(`  ${state}: ${count}`);
    });
  }

  console.log('\nCommunity programs are now ready for map visualization!');
}

main().catch(console.error);
