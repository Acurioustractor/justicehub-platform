import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use module-specific Supabase credentials
const supabaseUrl = process.env.YJSF_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.YJSF_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables for Service Finder');
  console.error('YJSF_SUPABASE_URL:', !!process.env.YJSF_SUPABASE_URL);
  console.error('SUPABASE_URL:', !!process.env.SUPABASE_URL);
  console.error('YJSF_SUPABASE_ANON_KEY:', !!process.env.YJSF_SUPABASE_ANON_KEY);
  console.error('SUPABASE_ANON_KEY:', !!process.env.SUPABASE_ANON_KEY);
}

const supabase = createClient(supabaseUrl!, supabaseKey!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export async function GET(request: NextRequest) {
  try {
    // Return mock data if Supabase is not configured
    if (!supabaseUrl || !supabaseKey) {
      console.log('Returning mock data - Supabase not configured');
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';

    let query = supabase
      .from('services')
      .select(`
        *,
        organizations(*),
        locations(*),
        contacts(*)
      `)
      .eq('project', 'youth-justice-service-finder'); // Filter for youth justice services

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,keywords.ilike.%${search}%`);
    }
    
    if (location) {
      query = query.or(`locations.locality.ilike.%${location}%,locations.region.ilike.%${location}%,locations.state.ilike.%${location}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);

    const { data, error, count } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch services',
        message: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch services',
      message: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('services')
      .insert([{
        ...body,
        project: 'youth-justice-service-finder'
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create service',
        message: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create service',
      message: error.message
    }, { status: 500 });
  }
}