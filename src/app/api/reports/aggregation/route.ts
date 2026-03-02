import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const systemTypes = searchParams.get('system_type')?.split(',').filter(Boolean);
    const useDetailed = systemTypes && systemTypes.length > 0;

    const supabase = getSupabaseClient();

    if (useDetailed) {
      // Return per-system-type breakdown, filtered
      const { data, error } = await supabase
        .from('discrimination_aggregations_v')
        .select('*')
        .in('system_type', systemTypes);

      if (error) {
        console.error('Aggregation query error:', error.message);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
      }

      return NextResponse.json(
        { success: true, data: data || [] },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
          },
        }
      );
    }

    // Default: return SA3 totals (collapsed across types)
    const { data, error } = await supabase
      .from('discrimination_sa3_totals_v')
      .select('*');

    if (error) {
      console.error('Totals query error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, data: data || [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
        },
      }
    );
  } catch (error) {
    console.error(
      'Aggregation API error:',
      error instanceof Error ? error.stack : error
    );
    return NextResponse.json(
      { error: 'An unexpected error occurred', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
