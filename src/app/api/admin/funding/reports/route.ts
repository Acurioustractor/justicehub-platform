import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List reports or get a specific report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const report_type = searchParams.get('report_type');
    const week_start = searchParams.get('week_start');
    const latest = searchParams.get('latest') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (id) {
      // Get specific report
      const { data, error } = await supabase
        .from('alma_weekly_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    if (latest) {
      // Get latest report of each type
      const { data, error } = await supabase
        .from('v_latest_reports')
        .select('*');

      if (error) {
        console.error('Error fetching latest reports:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    // List reports with filters
    let query = supabase
      .from('alma_weekly_reports')
      .select('*', { count: 'exact' });

    if (report_type) {
      query = query.eq('report_type', report_type);
    }

    if (week_start) {
      query = query.eq('week_start', week_start);
    }

    query = query
      .order('week_start', { ascending: false })
      .limit(limit);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, total: count });
  } catch (error) {
    console.error('Error in reports GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST - Generate a new weekly report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      report_type = 'comprehensive',
      week_start,
      organization_id,
    } = body;

    // Default to current week's Monday
    const reportWeekStart = week_start || getWeekStart(new Date());

    const startTime = Date.now();

    // Generate report data using the database function
    const { data: reportData, error: rpcError } = await supabase.rpc(
      'generate_weekly_report_data',
      {
        p_week_start: reportWeekStart,
        p_organization_id: organization_id || null,
      }
    );

    if (rpcError) {
      console.error('Error generating report data:', rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    // Generate executive summary and highlights
    const { summary, highlights, alerts, actions } = generateReportSummary(reportData);

    // Create the report record
    const weekEnd = new Date(reportWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const { data: report, error: insertError } = await supabase
      .from('alma_weekly_reports')
      .insert([
        {
          week_start: reportWeekStart,
          week_end: weekEnd.toISOString().split('T')[0],
          report_type,
          organization_id,
          title: `ALMA Weekly Intelligence - Week of ${formatDate(reportWeekStart)}`,
          executive_summary: summary,
          funding_section: reportData.funding,
          research_section: reportData.research,
          stats_snapshot: reportData.stats,
          highlights,
          alerts,
          recommended_actions: actions,
          generation_duration_ms: Date.now() - startTime,
          data_sources_used: ['alma_funding_opportunities', 'alma_evidence', 'services', 'organizations'],
          status: 'draft',
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating report:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error in reports POST:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// PUT - Update/publish a report
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Auto-set published_at when publishing
    if (updates.status === 'published' && !updates.published_at) {
      updates.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('alma_weekly_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating report:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in reports PUT:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

// Helper functions
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface ReportData {
  funding: {
    new_opportunities: Array<{ name: string; funder: string; deadline: string }>;
    closing_soon: Array<{ name: string; days_left: number }>;
    total_available: number;
    count_open: number;
  };
  research: {
    new_evidence: Array<{ title: string }>;
    total_evidence: number;
  };
  stats: {
    total_services: number;
    total_interventions: number;
    total_organizations: number;
  };
}

function generateReportSummary(data: ReportData): {
  summary: string;
  highlights: string[];
  alerts: string[];
  actions: string[];
} {
  const funding = data.funding || {};
  const research = data.research || {};
  const stats = data.stats || {};

  const newOpps = funding.new_opportunities?.length || 0;
  const closingSoon = funding.closing_soon?.length || 0;
  const totalAvailable = funding.total_available || 0;
  const newEvidence = research.new_evidence?.length || 0;

  // Generate summary
  const summary = `This week: ${newOpps} new funding opportunities identified${
    closingSoon > 0 ? `, ${closingSoon} closing soon` : ''
  }. ${
    totalAvailable > 0
      ? `Total available funding pool: $${(totalAvailable / 1000000).toFixed(1)}M. `
      : ''
  }${newEvidence > 0 ? `${newEvidence} new research items indexed. ` : ''}Coverage across ${stats.total_services || 0} services and ${stats.total_organizations || 0} organizations.`;

  // Generate highlights
  const highlights: string[] = [];
  if (newOpps > 0) {
    highlights.push(`${newOpps} new funding opportunities added to pipeline`);
  }
  if (newEvidence > 0) {
    highlights.push(`${newEvidence} new research items added to evidence library`);
  }
  if (funding.new_opportunities?.[0]) {
    highlights.push(
      `Notable: ${funding.new_opportunities[0].name} from ${funding.new_opportunities[0].funder}`
    );
  }

  // Generate alerts
  const alerts: string[] = [];
  if (closingSoon > 0) {
    alerts.push(`${closingSoon} funding opportunities closing within 14 days`);
    funding.closing_soon?.slice(0, 3).forEach((opp) => {
      alerts.push(`- ${opp.name}: ${opp.days_left} days remaining`);
    });
  }

  // Generate recommended actions
  const actions: string[] = [];
  if (closingSoon > 0) {
    actions.push('Review closing-soon opportunities and prioritize applications');
  }
  if (newOpps > 0) {
    actions.push('Assess new opportunities for basecamp alignment');
  }
  actions.push('Share relevant opportunities with partner organizations');

  return { summary, highlights, alerts, actions };
}
