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
    const region = searchParams.get('region');
    const programType = searchParams.get('type');
    const evidenceStrength = searchParams.get('evidence');

    let query = supabase
      .from('international_programs')
      .select('*')
      .eq('status', 'published')
      .order('recidivism_rate', { ascending: true, nullsLast: true });

    // Apply filters
    if (region) {
      query = query.eq('region', region);
    }

    if (programType) {
      query = query.contains('program_type', [programType]);
    }

    if (evidenceStrength) {
      query = query.eq('evidence_strength', evidenceStrength);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse JSON fields
    const programs = data.map((program: any) => ({
      ...program,
      key_outcomes:
        typeof program.key_outcomes === 'string'
          ? JSON.parse(program.key_outcomes)
          : program.key_outcomes,
    }));

    return NextResponse.json({ programs, count: programs.length });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
