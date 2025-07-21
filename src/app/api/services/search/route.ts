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
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!query && !location) {
      return NextResponse.json({
        success: false,
        error: 'Search query or location is required'
      }, { status: 400 });
    }

    let supabaseQuery = supabase
      .from('services')
      .select(`
        *,
        organizations(*),
        locations(*),
        contacts(*)
      `)
      .eq('project', 'youth-justice-service-finder')
      .limit(limit);

    // Build search conditions
    const searchConditions = [];
    
    if (query) {
      searchConditions.push(`name.ilike.%${query}%`);
      searchConditions.push(`description.ilike.%${query}%`);
      searchConditions.push(`keywords.ilike.%${query}%`);
      searchConditions.push(`categories.cs.{${query}}`);
    }

    if (location) {
      searchConditions.push(`locations.locality.ilike.%${location}%`);
      searchConditions.push(`locations.region.ilike.%${location}%`);
      searchConditions.push(`locations.state.ilike.%${location}%`);
      searchConditions.push(`locations.postcode.ilike.%${location}%`);
    }

    if (searchConditions.length > 0) {
      supabaseQuery = supabaseQuery.or(searchConditions.join(','));
    }

    const { data, error } = await supabaseQuery;
    
    if (error) {
      console.error('Supabase search error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to search services',
        message: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      query,
      location,
      count: data?.length || 0
    });
    
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to search services',
      message: error.message
    }, { status: 500 });
  }
}