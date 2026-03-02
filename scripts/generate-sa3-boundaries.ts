#!/usr/bin/env npx tsx
/**
 * Generate simplified SA3 boundary GeoJSON from centroid data.
 *
 * In production, replace with real ABS ASGS SA3 boundaries
 * (download from https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/access-and-downloads/digital-boundary-files)
 * and simplify with mapshaper:
 *   mapshaper SA3_2021_AUST_GDA2020.shp -simplify 5% -o sa3_boundaries.geojson
 *
 * This script creates approximate hexagonal regions around each centroid
 * for demonstration purposes.
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

// SA3 regions from the seed migration
const SA3_REGIONS: Array<{ code: string; name: string; state: string; lng: number; lat: number }> = [
  // NSW
  { code: '11601', name: 'Canterbury', state: 'NSW', lng: 151.10, lat: -33.92 },
  { code: '11602', name: 'Hurstville', state: 'NSW', lng: 151.10, lat: -33.97 },
  { code: '11603', name: 'Kogarah - Rockdale', state: 'NSW', lng: 151.13, lat: -33.96 },
  { code: '11701', name: 'Bankstown', state: 'NSW', lng: 151.03, lat: -33.92 },
  { code: '11702', name: 'Fairfield', state: 'NSW', lng: 150.96, lat: -33.87 },
  { code: '11703', name: 'Liverpool', state: 'NSW', lng: 150.93, lat: -33.92 },
  { code: '11801', name: 'Bringelly - Green Valley', state: 'NSW', lng: 150.82, lat: -33.92 },
  { code: '11802', name: 'Camden', state: 'NSW', lng: 150.70, lat: -34.05 },
  { code: '11803', name: 'Campbelltown', state: 'NSW', lng: 150.81, lat: -34.07 },
  { code: '11804', name: 'Wollondilly', state: 'NSW', lng: 150.58, lat: -34.15 },
  { code: '11901', name: 'Blacktown', state: 'NSW', lng: 150.87, lat: -33.77 },
  { code: '11902', name: 'Blacktown - North', state: 'NSW', lng: 150.87, lat: -33.72 },
  { code: '11903', name: 'Mount Druitt', state: 'NSW', lng: 150.82, lat: -33.77 },
  { code: '12001', name: 'Auburn', state: 'NSW', lng: 151.03, lat: -33.85 },
  { code: '12002', name: 'Granville - Parramatta', state: 'NSW', lng: 151.00, lat: -33.82 },
  { code: '12003', name: 'Merrylands - Guildford', state: 'NSW', lng: 150.98, lat: -33.83 },
  { code: '12004', name: 'Carlingford', state: 'NSW', lng: 151.05, lat: -33.78 },
  { code: '12101', name: 'Pennant Hills - Epping', state: 'NSW', lng: 151.08, lat: -33.75 },
  { code: '12102', name: 'Ryde - Hunters Hill', state: 'NSW', lng: 151.11, lat: -33.82 },
  { code: '12201', name: 'Baulkham Hills', state: 'NSW', lng: 150.98, lat: -33.75 },
  { code: '12301', name: 'Hornsby', state: 'NSW', lng: 151.10, lat: -33.70 },
  { code: '12401', name: 'Ku-ring-gai', state: 'NSW', lng: 151.15, lat: -33.72 },
  { code: '12501', name: 'North Sydney - Mosman', state: 'NSW', lng: 151.20, lat: -33.83 },
  { code: '12502', name: 'Manly', state: 'NSW', lng: 151.28, lat: -33.80 },
  { code: '12503', name: 'Warringah', state: 'NSW', lng: 151.25, lat: -33.75 },
  { code: '12504', name: 'Pittwater', state: 'NSW', lng: 151.30, lat: -33.63 },
  { code: '12601', name: 'Chatswood - Lane Cove', state: 'NSW', lng: 151.18, lat: -33.80 },
  { code: '12701', name: 'Strathfield - Burwood - Ashfield', state: 'NSW', lng: 151.10, lat: -33.88 },
  { code: '12702', name: 'Canada Bay - Five Dock', state: 'NSW', lng: 151.12, lat: -33.86 },
  { code: '12801', name: 'Botany', state: 'NSW', lng: 151.20, lat: -33.94 },
  { code: '12802', name: 'Marrickville - Sydenham - Petersham', state: 'NSW', lng: 151.15, lat: -33.91 },
  { code: '12803', name: 'Sydney Inner City', state: 'NSW', lng: 151.21, lat: -33.87 },
  { code: '12804', name: 'Eastern Suburbs - North', state: 'NSW', lng: 151.23, lat: -33.87 },
  { code: '12805', name: 'Eastern Suburbs - South', state: 'NSW', lng: 151.25, lat: -33.90 },
  { code: '12901', name: 'Cronulla - Miranda - Caringbah', state: 'NSW', lng: 151.13, lat: -34.05 },
  { code: '12902', name: 'Sutherland - Menai - Heathcote', state: 'NSW', lng: 151.05, lat: -34.07 },
  { code: '13001', name: 'Penrith', state: 'NSW', lng: 150.70, lat: -33.75 },
  { code: '13002', name: 'St Marys', state: 'NSW', lng: 150.77, lat: -33.76 },
  { code: '13003', name: 'Blue Mountains', state: 'NSW', lng: 150.45, lat: -33.72 },
  { code: '13101', name: 'Richmond - Windsor', state: 'NSW', lng: 150.75, lat: -33.60 },
  { code: '13201', name: 'Gosford', state: 'NSW', lng: 151.34, lat: -33.43 },
  { code: '13202', name: 'Wyong', state: 'NSW', lng: 151.43, lat: -33.28 },
  { code: '13301', name: 'Lake Macquarie - East', state: 'NSW', lng: 151.63, lat: -33.00 },
  { code: '13302', name: 'Lake Macquarie - West', state: 'NSW', lng: 151.55, lat: -32.98 },
  { code: '13401', name: 'Newcastle', state: 'NSW', lng: 151.78, lat: -32.93 },
  { code: '13402', name: 'Maitland', state: 'NSW', lng: 151.55, lat: -32.73 },
  { code: '13403', name: 'Port Stephens', state: 'NSW', lng: 151.85, lat: -32.72 },
  { code: '13501', name: 'Cessnock', state: 'NSW', lng: 151.35, lat: -32.83 },
  { code: '13601', name: 'Wollongong', state: 'NSW', lng: 150.89, lat: -34.42 },
  { code: '13602', name: 'Shellharbour', state: 'NSW', lng: 150.85, lat: -34.58 },
  { code: '13603', name: 'Kiama - Shoalhaven', state: 'NSW', lng: 150.70, lat: -34.83 },
  { code: '14001', name: 'Coffs Harbour', state: 'NSW', lng: 153.11, lat: -30.30 },
  { code: '14101', name: 'Lismore', state: 'NSW', lng: 153.28, lat: -28.81 },
  { code: '14102', name: 'Richmond Valley - Coastal', state: 'NSW', lng: 153.43, lat: -28.87 },
  { code: '14201', name: 'Tweed Valley', state: 'NSW', lng: 153.50, lat: -28.33 },
  { code: '14301', name: 'Port Macquarie', state: 'NSW', lng: 152.91, lat: -31.43 },
  { code: '14401', name: 'Tamworth', state: 'NSW', lng: 150.93, lat: -31.08 },
  { code: '14501', name: 'Dubbo', state: 'NSW', lng: 148.61, lat: -32.25 },
  { code: '14601', name: 'Orange', state: 'NSW', lng: 149.10, lat: -33.28 },
  { code: '14701', name: 'Wagga Wagga', state: 'NSW', lng: 147.37, lat: -35.12 },
  { code: '14801', name: 'Albury', state: 'NSW', lng: 146.91, lat: -36.08 },
];

// Add more states... (abbreviated for script, full data comes from DB)

function createHexagon(lng: number, lat: number, radiusDeg: number): number[][] {
  const coords: number[][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    coords.push([
      Math.round((lng + radiusDeg * Math.cos(angle)) * 10000) / 10000,
      Math.round((lat + radiusDeg * 0.8 * Math.sin(angle)) * 10000) / 10000,
    ]);
  }
  coords.push(coords[0]); // Close the ring
  return coords;
}

const features = SA3_REGIONS.map((region) => ({
  type: 'Feature' as const,
  properties: {
    SA3_CODE: region.code,
    SA3_NAME: region.name,
    STATE: region.state,
  },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [createHexagon(region.lng, region.lat, 0.06)],
  },
}));

const geojson = {
  type: 'FeatureCollection' as const,
  features,
};

const outPath = join(__dirname, '..', 'public', 'data', 'sa3_boundaries.geojson');
writeFileSync(outPath, JSON.stringify(geojson));
console.log(`Wrote ${features.length} SA3 boundaries to ${outPath}`);
