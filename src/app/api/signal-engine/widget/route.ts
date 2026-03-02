import { NextRequest, NextResponse } from 'next/server';
import { createSignalEngineClient } from '@/lib/supabase/signal-engine';

/**
 * Widget API — Postcode data lookup
 * GET /api/signal-engine/widget?postcode=2200
 *
 * Returns local data card: discrimination stats, alerts, nearest services.
 * Designed for the embeddable postcode widget.
 */

// Simple postcode → SA3 lookup (subset for demo; full lookup via sa3-lookup.ts)
const POSTCODE_SA3_MAP: Record<string, { sa3_code: string; sa3_name: string; state: string }> = {
  '2200': { sa3_code: '11701', sa3_name: 'Bankstown', state: 'NSW' },
  '2166': { sa3_code: '11901', sa3_name: 'Blacktown', state: 'NSW' },
  '2170': { sa3_code: '11601', sa3_name: 'Liverpool', state: 'NSW' },
  '2000': { sa3_code: '11703', sa3_name: 'Sydney Inner City', state: 'NSW' },
  '2010': { sa3_code: '11703', sa3_name: 'Sydney Inner City', state: 'NSW' },
  '3000': { sa3_code: '20601', sa3_name: 'Melbourne City', state: 'VIC' },
  '4000': { sa3_code: '30101', sa3_name: 'Brisbane Inner', state: 'QLD' },
  '5000': { sa3_code: '40101', sa3_name: 'Adelaide City', state: 'SA' },
  '6000': { sa3_code: '50101', sa3_name: 'Perth City', state: 'WA' },
  '0870': { sa3_code: '70201', sa3_name: 'Alice Springs', state: 'NT' },
  '0800': { sa3_code: '70101', sa3_name: 'Darwin City', state: 'NT' },
  '2600': { sa3_code: '80101', sa3_name: 'Canberra East', state: 'ACT' },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const postcode = searchParams.get('postcode')?.trim();

    if (!postcode || !/^\d{4}$/.test(postcode)) {
      return NextResponse.json(
        { error: 'Provide a valid 4-digit Australian postcode' },
        { status: 400 }
      );
    }

    // Resolve postcode to SA3
    const region = POSTCODE_SA3_MAP[postcode];
    if (!region) {
      // Try loading from full SA3 lookup if available
      return NextResponse.json({
        region: null,
        state: null,
        sa3_code: null,
        message: 'Postcode not yet mapped. We are expanding coverage.',
        stats: null,
        alerts: [],
        services: [],
      });
    }

    const supabase = createSignalEngineClient();

    // Fetch region stats, alerts, and services in parallel
    const [totalsResult, aggregationsResult, alertsResult, servicesResult] = await Promise.all([
      supabase
        .from('discrimination_sa3_totals_v')
        .select('*')
        .eq('sa3_code', region.sa3_code)
        .single(),
      supabase
        .from('discrimination_aggregations_v')
        .select('*')
        .eq('sa3_code', region.sa3_code),
      supabase
        .from('signal_widget_alerts')
        .select('*')
        .eq('region_code', region.sa3_code)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('services_complete')
        .select('name, phone, state, service_types')
        .eq('state', region.state)
        .limit(3),
    ]);

    const totals = totalsResult.data;
    const aggregations = aggregationsResult.data || [];
    const alerts = alertsResult.data || [];
    const services = servicesResult.data || [];

    // Find top system type
    let topSystem = null;
    let topSystemPct = 0;
    if (aggregations.length > 0 && totals) {
      const sorted = [...aggregations].sort((a, b) => Number(b.report_count) - Number(a.report_count));
      topSystem = sorted[0]?.system_type;
      topSystemPct = totals.total_reports > 0
        ? Math.round((Number(sorted[0]?.report_count) / Number(totals.total_reports)) * 100)
        : 0;
    }

    const response = {
      region: region.sa3_name,
      state: region.state,
      sa3_code: region.sa3_code,
      stats: totals ? {
        total_reports: Number(totals.total_reports),
        system_types_reported: Number(totals.system_types_reported),
        top_system: topSystem,
        top_system_pct: topSystemPct,
      } : {
        total_reports: 0,
        system_types_reported: 0,
        top_system: null,
        top_system_pct: 0,
      },
      alerts: alerts.map(a => ({
        type: 'alert',
        message: a.message,
        priority: a.priority,
      })),
      services: services.map(s => ({
        name: s.name,
        phone: s.phone,
        types: s.service_types,
      })),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=900',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Widget API error:', error);
    return NextResponse.json(
      { error: 'Widget data unavailable' },
      { status: 500 }
    );
  }
}
