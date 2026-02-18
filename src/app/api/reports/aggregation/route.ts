import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const systemTypes = searchParams.get('system_type')?.split(',').filter(Boolean);
    const useDetailed = systemTypes && systemTypes.length > 0;

    const supabase = createServiceClient();

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
      error instanceof Error ? error.message : 'Unknown'
    );
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
