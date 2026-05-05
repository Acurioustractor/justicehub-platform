import { NextResponse } from 'next/server';
import { tourStops as staticTourStops } from '@/content/campaign';

export const revalidate = 300; // 5 min cache

/**
 * GET /api/contained/tour-stops
 * Returns canonical tour stops from campaign.ts.
 * The DB table can lag while the route is being reshaped with partners, so the
 * public tour uses campaign.ts as the source of truth.
 */
export async function GET() {
  return NextResponse.json(staticTourStops);
}
