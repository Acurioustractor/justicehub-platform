import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

interface GeoPoint {
  id: string;
  name: string;
  type: string | null;
  evidence_level: string | null;
  lat: number;
  lng: number;
  org: string | null;
  state: string | null;
  approximate?: boolean; // true for state-only programs jittered across state bbox
}

// State bounding boxes — for honest "somewhere in <state>" jitter when geography is state-only.
const STATE_BBOXES: Record<string, { latMin: number; latMax: number; lngMin: number; lngMax: number }> = {
  NSW: { latMin: -37.0, latMax: -28.5, lngMin: 141.0, lngMax: 153.5 },
  VIC: { latMin: -39.0, latMax: -34.0, lngMin: 141.0, lngMax: 150.0 },
  QLD: { latMin: -29.0, latMax: -11.0, lngMin: 138.0, lngMax: 153.5 },
  SA:  { latMin: -38.0, latMax: -26.5, lngMin: 129.5, lngMax: 141.0 },
  WA:  { latMin: -35.0, latMax: -14.0, lngMin: 113.5, lngMax: 129.0 },
  TAS: { latMin: -43.5, latMax: -41.0, lngMin: 144.0, lngMax: 148.5 },
  NT:  { latMin: -26.0, latMax: -11.5, lngMin: 129.0, lngMax: 138.0 },
  ACT: { latMin: -35.7, latMax: -35.1, lngMin: 148.9, lngMax: 149.5 },
};

// Seeded random — stable across requests for the same id.
function seededRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

function jitterIntoState(id: string, stateCode: string): { lat: number; lng: number } | null {
  const bbox = STATE_BBOXES[stateCode];
  if (!bbox) return null;
  const r1 = seededRandom(id + ':lat');
  const r2 = seededRandom(id + ':lng');
  return {
    lat: bbox.latMin + (bbox.latMax - bbox.latMin) * r1,
    lng: bbox.lngMin + (bbox.lngMax - bbox.lngMin) * r2,
  };
}

// 5,000 row supabase cap; we have 929 with coords so fits in one query.
//
// Known geocoder fallback centroids — when only a state was on file the geocoder
// dropped the program at the state capital GPO. These stacks (66 programs at
// Brisbane CBD, 16 at Alice Springs etc.) are meaningless as points. We strip
// them and report the count separately so the map is honest.
const STATE_CENTROIDS: Array<{ lat: number; lng: number; tolerance: number; label: string }> = [
  { lat: -27.47, lng: 153.03, tolerance: 0.02, label: 'Brisbane CBD' },
  { lat: -33.87, lng: 151.21, tolerance: 0.02, label: 'Sydney CBD' },
  { lat: -37.81, lng: 144.96, tolerance: 0.02, label: 'Melbourne CBD' },
  { lat: -34.93, lng: 138.60, tolerance: 0.02, label: 'Adelaide CBD' },
  { lat: -31.95, lng: 115.86, tolerance: 0.02, label: 'Perth CBD' },
  { lat: -42.88, lng: 147.33, tolerance: 0.02, label: 'Hobart CBD' },
  { lat: -35.28, lng: 149.13, tolerance: 0.02, label: 'Canberra CBD' },
  { lat: -12.46, lng: 130.84, tolerance: 0.05, label: 'Darwin CBD' },
  { lat: -23.70, lng: 133.88, tolerance: 0.05, label: 'Alice Springs CBD' },
];

function isCentroidFallback(lat: number, lng: number): string | null {
  for (const c of STATE_CENTROIDS) {
    if (Math.abs(lat - c.lat) < c.tolerance && Math.abs(lng - c.lng) < c.tolerance) {
      return c.label;
    }
  }
  return null;
}

/**
 * State-only geography signal. If geography is just a state code with no
 * city/locality, the lat/lng was a fallback centroid (centre of QLD, WA, etc.)
 * and the precise pin is meaningless.
 */
const STATE_CODES = new Set(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT', 'AUSTRALIA', 'NATIONAL']);

function isStateOnlyGeography(geography: unknown): boolean {
  if (!Array.isArray(geography)) return false;
  if (geography.length === 0) return false;
  // If any geography entry is a city/region/locality (not just a state code),
  // we trust the lat/lng. Otherwise it's a state-only fallback.
  return geography.every((g) => typeof g === 'string' && STATE_CODES.has(g.trim().toUpperCase()));
}

export async function GET() {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('alma_interventions')
      .select('id, name, type, evidence_level, latitude, longitude, operating_organization, geography')
      .neq('verification_status', 'ai_generated')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gte('latitude', -45)
      .lte('latitude', -10)
      .gte('longitude', 110)
      .lte('longitude', 155)
      .range(0, 4999);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const allRows = data ?? [];
    const points: GeoPoint[] = [];
    const droppedByCentroid: Record<string, number> = {};

    // State-by-state count of dropped state-only programs (for the honest subtitle).
    const droppedByState: Record<string, number> = {};

    // Build a "geocoder fallback" detector: bucket lat/lng to 0.1° (~10km) and
    // if ≥3 programs with DIFFERENT geographies share a bucket, treat as fallback.
    // Real programs in different suburbs would land in adjacent buckets, not the
    // exact same one. The geocoder fallback piles unrelated cities at the state
    // centroid (Mossman + Wynnum + Warwick all at -21.9, 144.8, etc).
    const stackedFallback = new Map<string, Set<string>>();
    for (const r of allRows) {
      const key = `${Number(r.latitude).toFixed(1)}:${Number(r.longitude).toFixed(1)}`;
      const geoStr = JSON.stringify(r.geography ?? []);
      if (!stackedFallback.has(key)) stackedFallback.set(key, new Set());
      stackedFallback.get(key)!.add(geoStr);
    }
    const fallbackKeys = new Set<string>();
    for (const [key, geoSet] of stackedFallback) {
      // 2+ different geographies in the same 0.1° bucket = geocoder fallback.
      // (Real programs in adjacent suburbs of the same locality typically share
      // a geography string like "{QLD, Brisbane}" so they wouldn't trigger this.)
      if (geoSet.size >= 2) fallbackKeys.add(key);
    }
    let droppedFallbackCluster = 0;

    for (const r of allRows) {
      const origLat = Number(r.latitude);
      const origLng = Number(r.longitude);
      const stateCode = Array.isArray(r.geography) && r.geography.length > 0
        ? String(r.geography[0]).toUpperCase()
        : null;

      // Drop capital-city centroid fallbacks (66+ programs piled at Brisbane GPO etc.).
      const centroid = isCentroidFallback(origLat, origLng);
      if (centroid) {
        droppedByCentroid[centroid] = (droppedByCentroid[centroid] ?? 0) + 1;
        continue;
      }

      // Drop state-only programs entirely. Random jitter would invent locations
      // we don't have. Honest map = only programs with real addresses.
      if (isStateOnlyGeography(r.geography)) {
        const key = stateCode ?? 'UNKNOWN';
        droppedByState[key] = (droppedByState[key] ?? 0) + 1;
        continue;
      }

      // Drop "stacked-fallback" coordinates: if multiple programs with different
      // localities (Mossman + Innisfail + Charleville) all share a 0.1° bucket
      // (~10km), that's a geocoder failure that fell back to a state interior centroid.
      const stackKey = `${origLat.toFixed(1)}:${origLng.toFixed(1)}`;
      if (fallbackKeys.has(stackKey)) {
        droppedFallbackCluster++;
        continue;
      }

      // Address-precise point.
      points.push({
        id: r.id,
        name: r.name,
        type: r.type,
        evidence_level: r.evidence_level,
        lat: origLat,
        lng: origLng,
        org: r.operating_organization,
        state: stateCode,
      });
    }

    const droppedCentroid = Object.values(droppedByCentroid).reduce((a, b) => a + b, 0);
    const droppedState = Object.values(droppedByState).reduce((a, b) => a + b, 0);
    const droppedTotal = droppedCentroid + droppedState + droppedFallbackCluster;

    return NextResponse.json({
      points,
      total: points.length,
      droppedTotal,
      droppedCentroid,
      droppedState,
      droppedFallbackCluster,
      droppedByCentroid,
      droppedByState,
      note: 'Map shows only programs with credible address-level coordinates. Excluded: capital-city GPO fallbacks, state-only geographies, and stacked-fallback clusters (multiple programs with different localities sharing the same lat/lng).',
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
