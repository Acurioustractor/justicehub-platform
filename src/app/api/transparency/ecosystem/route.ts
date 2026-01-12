import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');

  const supabase = createServiceClient();

  try {
    // Fetch detention facilities
    let facilitiesQuery = supabase
      .from('youth_detention_facilities')
      .select('id, name, slug, facility_type, city, state, latitude, longitude, capacity_beds, operational_status')
      .eq('operational_status', 'operational')
      .order('state')
      .order('name');

    if (state) {
      facilitiesQuery = facilitiesQuery.eq('state', state);
    }

    const { data: facilities, error: facilitiesError } = await facilitiesQuery;

    if (facilitiesError) {
      console.error('Error fetching facilities:', facilitiesError);
    }

    // Fetch partnership counts for each facility
    const facilityIds = facilities?.map(f => f.id) || [];
    let facilitiesWithPartners = facilities || [];

    if (facilityIds.length > 0) {
      const { data: partnerships } = await supabase
        .from('facility_partnerships')
        .select('facility_id')
        .in('facility_id', facilityIds)
        .eq('is_active', true);

      const partnershipCounts: Record<string, number> = {};
      partnerships?.forEach(p => {
        partnershipCounts[p.facility_id] = (partnershipCounts[p.facility_id] || 0) + 1;
      });

      facilitiesWithPartners = facilities?.map(f => ({
        ...f,
        partnership_count: partnershipCounts[f.id] || 0,
      })) || [];
    }

    // Fetch community programs with coordinates
    let programsQuery = supabase
      .from('community_programs')
      .select('id, name, organization, location, state, latitude, longitude, approach')
      .not('latitude', 'is', null)
      .order('name');

    if (state) {
      programsQuery = programsQuery.eq('state', state);
    }

    const { data: programs, error: programsError } = await programsQuery;

    if (programsError) {
      console.error('Error fetching programs:', programsError);
    }

    // Fetch services with coordinates
    let servicesQuery = supabase
      .from('services')
      .select('id, name, slug, category, location_city, location_state, latitude, longitude')
      .not('latitude', 'is', null)
      .order('name');

    if (state) {
      servicesQuery = servicesQuery.eq('location_state', state);
    }

    const { data: services, error: servicesError } = await servicesQuery;

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
    }

    // Fetch organizations with coordinates
    let orgsQuery = supabase
      .from('organizations')
      .select('id, name, slug, type, city, state, latitude, longitude')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .order('name');

    if (state) {
      orgsQuery = orgsQuery.eq('state', state);
    }

    const { data: organizations, error: orgsError } = await orgsQuery;

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
    }

    // Calculate state summary
    const stateSummary = state ? {
      state,
      facilities: facilitiesWithPartners?.length || 0,
      totalCapacity: facilitiesWithPartners?.reduce((sum, f) => sum + (f.capacity_beds || 0), 0) || 0,
      programs: programs?.length || 0,
      services: services?.length || 0,
      organizations: organizations?.length || 0,
    } : null;

    return NextResponse.json({
      facilities: facilitiesWithPartners || [],
      programs: programs || [],
      services: services || [],
      organizations: organizations || [],
      stateSummary,
      meta: {
        timestamp: new Date().toISOString(),
        stateFilter: state || 'all',
      },
    });
  } catch (error) {
    console.error('Ecosystem API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch ecosystem data',
        facilities: [],
        programs: [],
        services: [],
        organizations: [],
      },
      { status: 500 }
    );
  }
}
