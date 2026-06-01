export type MatrixGeoPrecision =
  | 'recorded'
  | 'court'
  | 'city'
  | 'state'
  | 'country'
  | 'regional'
  | 'global'
  | 'estimated';

export interface MatrixGeoPoint {
  lat: number;
  lng: number;
  label: string;
  precision: MatrixGeoPrecision;
  reason: string;
}

type Coord = [lat: number, lng: number];

const AUSTRALIA: Array<[RegExp, string, Coord]> = [
  [/new south wales|\bnsw\b|australia\s*-\s*nsw/i, 'New South Wales', [-33.8688, 151.2093]],
  [/australian capital territory|\bact\b|canberra/i, 'Australian Capital Territory', [-35.2809, 149.13]],
  [/\bvictoria\b|\bvic\b|melbourne/i, 'Victoria', [-37.8136, 144.9631]],
  [/queensland|\bqld\b|brisbane/i, 'Queensland', [-27.4698, 153.0251]],
  [/western australia|\bwa\b|perth/i, 'Western Australia', [-31.9523, 115.8613]],
  [/south australia|\bsa\b|adelaide/i, 'South Australia', [-34.9285, 138.6007]],
  [/tasmania|\btas\b|hobart/i, 'Tasmania', [-42.8821, 147.3272]],
  [/northern territory|\bnt\b|darwin/i, 'Northern Territory', [-12.4634, 130.8456]],
];

const COURTS: Array<[RegExp, string, Coord, MatrixGeoPrecision]> = [
  [/european court of human rights|\becthr\b|council of europe/i, 'European Court of Human Rights, Strasbourg', [48.5846, 7.7507], 'court'],
  [/court of justice|cjeu|european court of justice/i, 'Court of Justice of the European Union, Luxembourg', [49.6116, 6.1319], 'court'],
  [/european union|\beu\b|pan-european/i, 'European Union, Brussels', [50.8503, 4.3517], 'regional'],
  [/united nations|\bun\b|international\s*-\s*geneva|geneva/i, 'International / Geneva', [46.2044, 6.1432], 'regional'],
  [/upper tribunal|united kingdom|tribunal.*immigration|britain|\buk\b/i, 'United Kingdom, London', [51.5074, -0.1278], 'court'],
  [/high court of australia|australia \(national\)|australia national/i, 'Australia, national', [-25.2744, 133.7751], 'country'],
  [/federal court.*canada|immigration and refugee board.*canada|canada/i, 'Canada, Ottawa', [45.4215, -75.6972], 'court'],
  [/d\.?d\.?c\.?|d\.c\. circuit|district of columbia|board of immigration appeals/i, 'United States, Washington DC', [38.9072, -77.0369], 'court'],
  [/first circuit|1st circuit/i, 'United States First Circuit, Boston', [42.3601, -71.0589], 'court'],
  [/second circuit|2nd circuit/i, 'United States Second Circuit, New York', [40.7128, -74.006], 'court'],
  [/third circuit|3rd circuit/i, 'United States Third Circuit, Philadelphia', [39.9526, -75.1652], 'court'],
  [/sixth circuit|6th circuit/i, 'United States Sixth Circuit, Cincinnati', [39.1031, -84.512], 'court'],
  [/eighth circuit|8th circuit/i, 'United States Eighth Circuit, St. Louis', [38.627, -90.1994], 'court'],
  [/ninth circuit|9th circuit|9th cir/i, 'United States Ninth Circuit, San Francisco', [37.7749, -122.4194], 'court'],
];

const COUNTRY_COORDS: Record<string, { label: string; coords: Coord; precision?: MatrixGeoPrecision }> = {
  AU: { label: 'Australia', coords: [-25.2744, 133.7751], precision: 'country' },
  CA: { label: 'Canada', coords: [56.1304, -106.3468], precision: 'country' },
  CH: { label: 'Switzerland', coords: [46.8182, 8.2275], precision: 'country' },
  FR: { label: 'France', coords: [46.2276, 2.2137], precision: 'country' },
  GB: { label: 'United Kingdom', coords: [55.3781, -3.436], precision: 'country' },
  UK: { label: 'United Kingdom', coords: [55.3781, -3.436], precision: 'country' },
  US: { label: 'United States', coords: [39.8283, -98.5795], precision: 'country' },
  ZA: { label: 'South Africa', coords: [-30.5595, 22.9375], precision: 'country' },
  HK: { label: 'Hong Kong', coords: [22.3193, 114.1694], precision: 'city' },
  TH: { label: 'Thailand', coords: [15.87, 100.9925], precision: 'country' },
  MY: { label: 'Malaysia', coords: [4.2105, 101.9758], precision: 'country' },
  ID: { label: 'Indonesia', coords: [-0.7893, 113.9213], precision: 'country' },
  NZ: { label: 'New Zealand', coords: [-40.9006, 174.886], precision: 'country' },
  GR: { label: 'Greece', coords: [39.0742, 21.8243], precision: 'country' },
  IT: { label: 'Italy', coords: [41.8719, 12.5674], precision: 'country' },
  HU: { label: 'Hungary', coords: [47.1625, 19.5033], precision: 'country' },
  NL: { label: 'Netherlands', coords: [52.1326, 5.2913], precision: 'country' },
  SE: { label: 'Sweden', coords: [60.1282, 18.6435], precision: 'country' },
  IE: { label: 'Ireland', coords: [53.1424, -7.6921], precision: 'country' },
  BE: { label: 'Belgium', coords: [50.5039, 4.4699], precision: 'country' },
  LU: { label: 'Luxembourg', coords: [49.8153, 6.1296], precision: 'country' },
  EU: { label: 'European Union', coords: [50.8503, 4.3517], precision: 'regional' },
};

const TEXT_PLACES: Array<[RegExp, string, Coord, MatrixGeoPrecision]> = [
  [/south africa|pretoria/i, 'South Africa', [-30.5595, 22.9375], 'country'],
  [/hong kong/i, 'Hong Kong', [22.3193, 114.1694], 'city'],
  [/thailand/i, 'Thailand', [15.87, 100.9925], 'country'],
  [/malaysia/i, 'Malaysia', [4.2105, 101.9758], 'country'],
  [/indonesia/i, 'Indonesia', [-0.7893, 113.9213], 'country'],
  [/new zealand/i, 'New Zealand', [-40.9006, 174.886], 'country'],
  [/united states|usa|\bu\.s\./i, 'United States', [39.8283, -98.5795], 'country'],
  [/france|douai/i, 'France', [46.2276, 2.2137], 'country'],
  [/switzerland|federal administrative tribunal/i, 'Switzerland', [46.8182, 8.2275], 'country'],
  [/greece/i, 'Greece', [39.0742, 21.8243], 'country'],
  [/italy/i, 'Italy', [41.8719, 12.5674], 'country'],
  [/hungary/i, 'Hungary', [47.1625, 19.5033], 'country'],
  [/netherlands/i, 'Netherlands', [52.1326, 5.2913], 'country'],
  [/sweden/i, 'Sweden', [60.1282, 18.6435], 'country'],
  [/ireland/i, 'Ireland', [53.1424, -7.6921], 'country'],
  [/belgium/i, 'Belgium', [50.5039, 4.4699], 'country'],
  [/malta/i, 'Malta', [35.9375, 14.3754], 'country'],
  [/romania/i, 'Romania', [45.9432, 24.9668], 'country'],
  [/ukraine/i, 'Ukraine', [48.3794, 31.1656], 'country'],
  [/slovenia/i, 'Slovenia', [46.1512, 14.9955], 'country'],
  [/austria/i, 'Austria', [47.5162, 14.5501], 'country'],
  [/moldova/i, 'Moldova', [47.4116, 28.3699], 'country'],
  [/macedonia|north macedonia/i, 'North Macedonia', [41.6086, 21.7453], 'country'],
  [/asia pacific/i, 'Asia Pacific', [13.7563, 100.5018], 'regional'],
  [/global|worldwide/i, 'Global', [20, 0], 'global'],
];

function validNumber(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(n) ? n : null;
}

function makePoint(label: string, coords: Coord, precision: MatrixGeoPrecision, reason: string): MatrixGeoPoint {
  return { lat: coords[0], lng: coords[1], label, precision, reason };
}

export function resolveMatrixGeo(opts: {
  raw?: string | null;
  countryCode?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
}): MatrixGeoPoint | null {
  const lat = validNumber(opts.lat);
  const lng = validNumber(opts.lng);
  const raw = (opts.raw ?? '').trim();

  if (lat !== null && lng !== null) {
    return {
      lat,
      lng,
      label: raw || 'Recorded coordinates',
      precision: 'recorded',
      reason: 'Stored lat/lng on the Matrix record.',
    };
  }

  for (const [pattern, label, coords] of AUSTRALIA) {
    if (pattern.test(raw)) return makePoint(label, coords, 'state', 'Resolved from Australian state or territory text.');
  }

  if (/australia/i.test(raw)) {
    return makePoint('Australia', [-25.2744, 133.7751], 'country', 'Resolved from Australia jurisdiction text.');
  }

  for (const [pattern, label, coords, precision] of COURTS) {
    if (pattern.test(raw)) return makePoint(label, coords, precision, 'Resolved from court or regional institution text.');
  }

  for (const [pattern, label, coords, precision] of TEXT_PLACES) {
    if (pattern.test(raw)) return makePoint(label, coords, precision, 'Resolved from jurisdiction or region text.');
  }

  const code = (opts.countryCode ?? '').trim().toUpperCase();
  const byCountry = COUNTRY_COORDS[code];
  if (byCountry) {
    return makePoint(
      byCountry.label,
      byCountry.coords,
      byCountry.precision ?? 'country',
      'Resolved from Matrix country code.',
    );
  }

  return null;
}

export function precisionLabel(precision: MatrixGeoPrecision): string {
  switch (precision) {
    case 'recorded':
      return 'recorded coordinates';
    case 'court':
      return 'court city';
    case 'city':
      return 'city';
    case 'state':
      return 'state centroid';
    case 'country':
      return 'country centroid';
    case 'regional':
      return 'regional centroid';
    case 'global':
      return 'global marker';
    case 'estimated':
      return 'estimated';
  }
}
