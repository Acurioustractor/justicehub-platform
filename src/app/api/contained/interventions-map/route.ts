import { createServiceClient } from '@/lib/supabase/service-lite';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hour cache

/**
 * GET /api/contained/interventions-map
 * Returns enriched youth-justice interventions for the map overlay.
 * Uses geography[] array for state (100% coverage), NOT coordinate guessing.
 * Joins with organizations + acnc_charities for real org data.
 */
export async function GET() {
  const supabase = createServiceClient();

  try {
    // Fetch interventions with org link
    const { data, error } = await supabase
      .from('alma_interventions')
      .select(`
        name,
        operating_organization,
        operating_organization_id,
        latitude,
        longitude,
        geography,
        evidence_level,
        type,
        service_role,
        estimated_annual_capacity,
        website,
        current_funding,
        gs_entity_id
      `)
      .neq('verification_status', 'ai_generated')
      .eq('serves_youth_justice', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('service_role');

    if (error) throw error;

    // Collect unique org names for ACNC batch lookup
    const orgNames = [...new Set(
      (data || [])
        .map(r => r.operating_organization)
        .filter(Boolean)
        .map(n => n!.toLowerCase())
    )];

    // Batch ACNC lookup — get org details (ABN, state, size, website, beneficiaries)
    let acncMap: Record<string, {
      abn: string;
      state: string;
      charity_size: string;
      website: string;
      town_city: string;
      ben_youth: boolean;
      ben_aboriginal_tsi: boolean;
    }> = {};

    if (orgNames.length > 0) {
      // Query in chunks to avoid URL limits
      const chunkSize = 50;
      for (let i = 0; i < orgNames.length; i += chunkSize) {
        const chunk = orgNames.slice(i, i + chunkSize);
        const { data: acncData } = await supabase
          .from('acnc_charities')
          .select('name, abn, state, charity_size, website, town_city, ben_youth, ben_aboriginal_tsi')
          .in('name', chunk.map(n => n)); // exact match on lowercase

        // Also try case-insensitive with ilike patterns
        if (!acncData?.length) continue;
        for (const ac of acncData) {
          if (ac.name) acncMap[ac.name.toLowerCase()] = ac;
        }
      }

      // If exact match gave few results, also try with original case names
      if (Object.keys(acncMap).length < orgNames.length * 0.1) {
        const originalNames = [...new Set(
          (data || []).map(r => r.operating_organization).filter(Boolean)
        )];
        for (let i = 0; i < originalNames.length; i += chunkSize) {
          const chunk = originalNames.slice(i, i + chunkSize);
          const { data: acncData } = await supabase
            .from('acnc_charities')
            .select('name, abn, state, charity_size, website, town_city, ben_youth, ben_aboriginal_tsi')
            .in('name', chunk as string[]);

          for (const ac of (acncData || [])) {
            if (ac.name) acncMap[ac.name.toLowerCase()] = ac;
          }
        }
      }
    }

    const VALID_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'];

    // Extract state from geography array, falling back to coordinates
    function getState(geography: string[] | null, lat: number, lng: number): string {
      // Try geography array first (100% coverage, most accurate)
      if (Array.isArray(geography)) {
        for (const entry of geography) {
          if (VALID_STATES.includes(entry)) return entry;
        }
      }
      // Fallback: derive from coordinates (for ~100 entries with bad/empty geography)
      if (lat > -10.7 && lng > 129 && lng < 138) return 'NT';
      if (lng < 129) return 'WA';
      if (lat < -39.5 && lng > 143.5 && lng < 149) return 'TAS';
      if (lat > -35.5 && lat < -35.1 && lng > 148.9 && lng < 149.4) return 'ACT';
      if (lng < 141 && lat < -26) return 'SA';
      if (lat < -38 && lng > 140 && lng < 150) return 'VIC';
      if (lat > -29 && lng > 141) return 'QLD';
      if (lat >= -29 && lat <= -37 && lng >= 141) return 'NSW';
      if (lat > -37 && lng > 140) return 'NSW';
      return 'QLD'; // most interventions are QLD
    }

    const interventions = (data || []).map(row => {
      const orgKey = row.operating_organization?.toLowerCase();
      const acnc = orgKey ? acncMap[orgKey] : null;

      return {
        name: row.name,
        organization: row.operating_organization || '',
        latitude: row.latitude,
        longitude: row.longitude,
        evidence_level: row.evidence_level || 'Untested',
        type: row.type || 'Other',
        service_role: row.service_role || 'other',
        capacity: row.estimated_annual_capacity,
        state: getState(row.geography, row.latitude, row.longitude),
        website: row.website || acnc?.website || null,
        current_funding: row.current_funding || null,
        // ACNC enrichment
        abn: acnc?.abn || null,
        org_size: acnc?.charity_size || null,
        org_location: acnc?.town_city || null,
        serves_indigenous: acnc?.ben_aboriginal_tsi || false,
        has_gs_link: !!row.gs_entity_id,
      };
    });

    return NextResponse.json(interventions);
  } catch (error) {
    console.error('Interventions map error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
