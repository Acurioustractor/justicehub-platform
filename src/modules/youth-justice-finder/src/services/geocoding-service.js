import pino from 'pino';

const logger = pino({ name: 'geocoding-service' });

// Australian postal code ranges by state
const australianPostcodes = {
  'NSW': { min: 1000, max: 2999 },
  'ACT': { min: 2600, max: 2618 },
  'VIC': { min: 3000, max: 3999 },
  'QLD': { min: 4000, max: 4999 },
  'SA': { min: 5000, max: 5999 },
  'WA': { min: 6000, max: 6999 },
  'TAS': { min: 7000, max: 7999 },
  'NT': { min: 800, max: 999 }
};

// Comprehensive Australian city coordinates database
const australianCities = {
  // Queensland
  'Brisbane': { lat: -27.4678, lng: 153.0281, state: 'QLD', postcode: 4000 },
  'Gold Coast': { lat: -28.0167, lng: 153.4000, state: 'QLD', postcode: 4217 },
  'Sunshine Coast': { lat: -26.6500, lng: 153.0667, state: 'QLD', postcode: 4558 },
  'Townsville': { lat: -19.2576, lng: 146.8178, state: 'QLD', postcode: 4810 },
  'Cairns': { lat: -16.9186, lng: 145.7781, state: 'QLD', postcode: 4870 },
  'Toowoomba': { lat: -27.5598, lng: 151.9507, state: 'QLD', postcode: 4350 },
  'Rockhampton': { lat: -23.3781, lng: 150.5047, state: 'QLD', postcode: 4700 },
  'Mackay': { lat: -21.1555, lng: 149.1863, state: 'QLD', postcode: 4740 },
  'Bundaberg': { lat: -24.8661, lng: 152.3489, state: 'QLD', postcode: 4670 },
  'Hervey Bay': { lat: -25.2986, lng: 152.8535, state: 'QLD', postcode: 4655 },
  'Gladstone': { lat: -23.8449, lng: 151.2560, state: 'QLD', postcode: 4680 },
  'Ipswich': { lat: -27.6177, lng: 152.7600, state: 'QLD', postcode: 4305 },
  'Logan': { lat: -27.6386, lng: 153.1094, state: 'QLD', postcode: 4114 },
  'Redland': { lat: -27.5264, lng: 153.2850, state: 'QLD', postcode: 4165 },
  'Mount Isa': { lat: -20.7256, lng: 139.4927, state: 'QLD', postcode: 4825 },
  
  // New South Wales
  'Sydney': { lat: -33.8688, lng: 151.2093, state: 'NSW', postcode: 2000 },
  'Newcastle': { lat: -32.9267, lng: 151.7789, state: 'NSW', postcode: 2300 },
  'Wollongong': { lat: -34.4278, lng: 150.8931, state: 'NSW', postcode: 2500 },
  'Central Coast': { lat: -33.4307, lng: 151.3428, state: 'NSW', postcode: 2250 },
  'Wagga Wagga': { lat: -35.1082, lng: 147.3598, state: 'NSW', postcode: 2650 },
  'Albury': { lat: -36.0737, lng: 146.9135, state: 'NSW', postcode: 2640 },
  'Maitland': { lat: -32.7335, lng: 151.5529, state: 'NSW', postcode: 2320 },
  'Orange': { lat: -33.2845, lng: 149.0988, state: 'NSW', postcode: 2800 },
  'Dubbo': { lat: -32.2426, lng: 148.6017, state: 'NSW', postcode: 2830 },
  'Tamworth': { lat: -31.0927, lng: 150.9279, state: 'NSW', postcode: 2340 },
  'Bathurst': { lat: -33.4194, lng: 149.5806, state: 'NSW', postcode: 2795 },
  'Lismore': { lat: -28.8142, lng: 153.2782, state: 'NSW', postcode: 2480 },
  'Broken Hill': { lat: -31.9505, lng: 141.4339, state: 'NSW', postcode: 2880 },
  'Coffs Harbour': { lat: -30.2963, lng: 153.1185, state: 'NSW', postcode: 2450 },
  'Port Macquarie': { lat: -31.4287, lng: 152.9063, state: 'NSW', postcode: 2444 },
  
  // Victoria
  'Melbourne': { lat: -37.8136, lng: 144.9631, state: 'VIC', postcode: 3000 },
  'Geelong': { lat: -38.1499, lng: 144.3617, state: 'VIC', postcode: 3220 },
  'Ballarat': { lat: -37.5622, lng: 143.8503, state: 'VIC', postcode: 3350 },
  'Bendigo': { lat: -36.7570, lng: 144.2794, state: 'VIC', postcode: 3550 },
  'Shepparton': { lat: -36.3820, lng: 145.3990, state: 'VIC', postcode: 3630 },
  'Latrobe': { lat: -38.2167, lng: 146.4167, state: 'VIC', postcode: 3842 },
  'Warrnambool': { lat: -38.3830, lng: 142.4851, state: 'VIC', postcode: 3280 },
  'Horsham': { lat: -36.7113, lng: 142.1993, state: 'VIC', postcode: 3400 },
  'Mildura': { lat: -34.1889, lng: 142.1547, state: 'VIC', postcode: 3500 },
  'Wodonga': { lat: -36.1217, lng: 146.8881, state: 'VIC', postcode: 3690 },
  
  // Western Australia
  'Perth': { lat: -31.9505, lng: 115.8605, state: 'WA', postcode: 6000 },
  'Fremantle': { lat: -32.0569, lng: 115.7439, state: 'WA', postcode: 6160 },
  'Rockingham': { lat: -32.2767, lng: 115.7299, state: 'WA', postcode: 6168 },
  'Mandurah': { lat: -32.5269, lng: 115.7218, state: 'WA', postcode: 6210 },
  'Bunbury': { lat: -33.3267, lng: 115.6414, state: 'WA', postcode: 6230 },
  'Geraldton': { lat: -28.7774, lng: 114.6140, state: 'WA', postcode: 6530 },
  'Albany': { lat: -35.0275, lng: 117.8840, state: 'WA', postcode: 6330 },
  'Kalgoorlie': { lat: -30.7494, lng: 121.4665, state: 'WA', postcode: 6430 },
  'Broome': { lat: -17.9644, lng: 122.2304, state: 'WA', postcode: 6725 },
  'Port Hedland': { lat: -20.3106, lng: 118.5717, state: 'WA', postcode: 6721 },
  
  // South Australia
  'Adelaide': { lat: -34.9285, lng: 138.6007, state: 'SA', postcode: 5000 },
  'Mount Gambier': { lat: -37.8284, lng: 140.7831, state: 'SA', postcode: 5290 },
  'Whyalla': { lat: -33.0339, lng: 137.5845, state: 'SA', postcode: 5600 },
  'Murray Bridge': { lat: -35.1197, lng: 139.2756, state: 'SA', postcode: 5253 },
  'Port Lincoln': { lat: -34.7282, lng: 135.8735, state: 'SA', postcode: 5606 },
  'Port Augusta': { lat: -32.4911, lng: 137.7669, state: 'SA', postcode: 5700 },
  'Victor Harbor': { lat: -35.5529, lng: 138.6218, state: 'SA', postcode: 5211 },
  
  // Tasmania
  'Hobart': { lat: -42.8821, lng: 147.3272, state: 'TAS', postcode: 7000 },
  'Launceston': { lat: -41.4332, lng: 147.1441, state: 'TAS', postcode: 7250 },
  'Devonport': { lat: -41.1789, lng: 146.3540, state: 'TAS', postcode: 7310 },
  'Burnie': { lat: -41.0545, lng: 145.9155, state: 'TAS', postcode: 7320 },
  
  // Australian Capital Territory
  'Canberra': { lat: -35.2809, lng: 149.1300, state: 'ACT', postcode: 2600 },
  
  // Northern Territory
  'Darwin': { lat: -12.4634, lng: 130.8456, state: 'NT', postcode: 800 },
  'Alice Springs': { lat: -23.6980, lng: 133.8807, state: 'NT', postcode: 870 },
  'Katherine': { lat: -14.4669, lng: 132.2646, state: 'NT', postcode: 850 }
};

// Helper function to determine state from postcode
function getStateFromPostcode(postcode) {
  if (!postcode) return null;
  const code = parseInt(postcode.toString());
  
  for (const [state, range] of Object.entries(australianPostcodes)) {
    if (code >= range.min && code <= range.max) {
      return state;
    }
  }
  return null;
}

// Helper function to find closest city in a state
function findClosestCityInState(state, suburb = null) {
  const stateCities = Object.entries(australianCities)
    .filter(([, data]) => data.state === state);
  
  if (stateCities.length === 0) return null;
  
  // If suburb provided, try to find a match
  if (suburb) {
    const suburbMatch = stateCities.find(([city]) => 
      city.toLowerCase().includes(suburb.toLowerCase()) ||
      suburb.toLowerCase().includes(city.toLowerCase())
    );
    if (suburbMatch) return suburbMatch[1];
  }
  
  // Return capital city or first city in state
  const capitals = {
    'NSW': 'Sydney', 'VIC': 'Melbourne', 'QLD': 'Brisbane',
    'WA': 'Perth', 'SA': 'Adelaide', 'TAS': 'Hobart',
    'ACT': 'Canberra', 'NT': 'Darwin'
  };
  
  const capital = capitals[state];
  const capitalCity = stateCities.find(([city]) => city === capital);
  return capitalCity ? capitalCity[1] : stateCities[0][1];
}

// Enhanced geocoding service with Australian address intelligence
export async function geocodeAddress(address) {
  logger.info({ address }, 'Geocoding Australian address');
  
  if (!address) {
    logger.warn('No address provided');
    return null;
  }
  
  // Handle different address formats
  let addressString = '';
  let suburb = null;
  let state = null;
  let postcode = null;
  
  if (typeof address === 'string') {
    addressString = address;
  } else if (typeof address === 'object') {
    // Extract components from address object
    const parts = [];
    if (address.address_1) parts.push(address.address_1);
    if (address.address_2) parts.push(address.address_2);
    if (address.suburb) parts.push(address.suburb);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postcode) parts.push(address.postcode);
    
    addressString = parts.join(', ');
    suburb = address.suburb || address.city;
    state = address.state;
    postcode = address.postcode;
  }
  
  // Extract postcode from address string if not already provided
  if (!postcode) {
    const postcodeMatch = addressString.match(/\b(\d{4})\b/);
    if (postcodeMatch) {
      postcode = postcodeMatch[1];
    }
  }
  
  // Extract state from address string if not already provided
  if (!state) {
    const stateMatch = addressString.match(/\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b/i);
    if (stateMatch) {
      state = stateMatch[1].toUpperCase();
    }
  }
  
  // Determine state from postcode if still not found
  if (!state && postcode) {
    state = getStateFromPostcode(postcode);
  }
  
  // Try to match exact city/suburb names first
  const addressLower = addressString.toLowerCase();
  for (const [cityName, cityData] of Object.entries(australianCities)) {
    if (addressLower.includes(cityName.toLowerCase())) {
      // Prefer matches that also match the state if we know it
      if (!state || cityData.state === state) {
        logger.info({ city: cityName, coordinates: cityData }, 'Found exact city match');
        return {
          lat: cityData.lat,
          lng: cityData.lng,
          formatted_address: `${addressString}`,
          city: cityName,
          state: cityData.state,
          postcode: cityData.postcode,
          confidence: 'high',
          geocoding_method: 'exact_city_match'
        };
      }
    }
  }
  
  // If we have a state, find the closest major city
  if (state) {
    const closestCity = findClosestCityInState(state, suburb);
    if (closestCity) {
      logger.info({ state, city: closestCity }, 'Using closest city in state');
      return {
        lat: closestCity.lat,
        lng: closestCity.lng,
        formatted_address: addressString || `${suburb || 'Unknown'}, ${state}`,
        city: Object.keys(australianCities).find(name => australianCities[name] === closestCity),
        state: closestCity.state,
        postcode: postcode || closestCity.postcode,
        confidence: 'medium',
        geocoding_method: 'state_approximation'
      };
    }
  }
  
  // Last resort: Use Brisbane as default for Australian addresses
  logger.warn({ address: addressString }, 'Using default Brisbane coordinates');
  return {
    lat: -27.4678,
    lng: 153.0281,
    formatted_address: addressString || 'Unknown Address, Australia',
    city: 'Brisbane',
    state: 'QLD',
    postcode: 4000,
    confidence: 'low',
    geocoding_method: 'default_fallback'
  };
}

// Batch geocode multiple addresses efficiently
export async function batchGeocodeAddresses(addresses) {
  logger.info({ count: addresses.length }, 'Batch geocoding addresses');
  
  const results = [];
  for (const address of addresses) {
    try {
      const result = await geocodeAddress(address);
      results.push(result);
    } catch (error) {
      logger.error({ address, error: error.message }, 'Failed to geocode address');
      results.push(null);
    }
  }
  
  return results;
}

// Get statistics about geocoding results
export function getGeocodingStats(results) {
  const total = results.length;
  const successful = results.filter(r => r !== null).length;
  const highConfidence = results.filter(r => r && r.confidence === 'high').length;
  const mediumConfidence = results.filter(r => r && r.confidence === 'medium').length;
  const lowConfidence = results.filter(r => r && r.confidence === 'low').length;
  
  const byState = {};
  results.forEach(result => {
    if (result && result.state) {
      byState[result.state] = (byState[result.state] || 0) + 1;
    }
  });
  
  return {
    total,
    successful,
    failed: total - successful,
    success_rate: total > 0 ? (successful / total * 100).toFixed(1) + '%' : '0%',
    confidence_breakdown: {
      high: highConfidence,
      medium: mediumConfidence,
      low: lowConfidence
    },
    by_state: byState
  };
}