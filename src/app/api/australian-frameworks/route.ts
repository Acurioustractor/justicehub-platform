import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');

    let query = supabase
      .from('australian_frameworks')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Apply state filter if provided
    if (state) {
      query = query.eq('state', state);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to match frontend interface
    const frameworks = data.map((framework: any) => ({
      id: framework.slug,
      name: framework.name,
      state: framework.state,
      tagline: framework.tagline,
      overview: framework.overview,
      keyFeatures: framework.key_features || [],
      outcomes: framework.outcomes || [],
      strengths: framework.strengths || [],
      challenges: framework.challenges || [],
      resources: framework.resources || [],
      color: framework.color,
      latitude: framework.latitude,
      longitude: framework.longitude,
    }));

    return NextResponse.json({ frameworks, count: frameworks.length });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
