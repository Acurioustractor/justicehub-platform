import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.YJSF_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.YJSF_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export async function GET(request: NextRequest) {
  try {
    // Return mock stats if Supabase is not configured
    if (!supabaseUrl || !supabaseKey) {
      console.log('Returning mock stats - Supabase not configured');
      return NextResponse.json({
        success: true,
        stats: {
          total_services: 0,
          total_organizations: 0,
          total_locations: 0,
          total_contacts: 0,
          by_region: {},
          by_category: {}
        },
        generated_at: new Date().toISOString()
      });
    }

    const [servicesCount, orgsCount, locationsCount, contactsCount] = await Promise.all([
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('project', 'youth-justice-service-finder'),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('project', 'youth-justice-service-finder'),
      supabase.from('locations').select('id', { count: 'exact', head: true }).eq('project', 'youth-justice-service-finder'),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('project', 'youth-justice-service-finder')
    ]);

    // Get region breakdown
    const { data: regionData } = await supabase
      .from('services')
      .select('locations(region)')
      .eq('project', 'youth-justice-service-finder');

    const regionStats: Record<string, number> = {};
    regionData?.forEach((service: any) => {
      if (service.locations?.region) {
        regionStats[service.locations.region] = (regionStats[service.locations.region] || 0) + 1;
      }
    });

    // Get service type breakdown
    const { data: typeData } = await supabase
      .from('services')
      .select('categories')
      .eq('project', 'youth-justice-service-finder');

    const categoryStats: Record<string, number> = {};
    typeData?.forEach((service: any) => {
      if (service.categories && Array.isArray(service.categories)) {
        service.categories.forEach((category: string) => {
          categoryStats[category] = (categoryStats[category] || 0) + 1;
        });
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        total_services: servicesCount.count || 0,
        total_organizations: orgsCount.count || 0,
        total_locations: locationsCount.count || 0,
        total_contacts: contactsCount.count || 0,
        by_region: regionStats,
        by_category: categoryStats
      },
      generated_at: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Stats API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    }, { status: 500 });
  }
}