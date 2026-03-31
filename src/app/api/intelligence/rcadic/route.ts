import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * RCADIC Recommendation Tracker API
 *
 * Returns Royal Commission into Aboriginal Deaths in Custody (1991)
 * recommendations with implementation status tracking.
 *
 * Query params:
 *   - status: filter by status (partially_implemented | not_implemented | rejected | implemented | all)
 *   - cluster: filter by metadata.cluster (juvenile_justice | sentencing_reform | deaths_in_custody | self_determination)
 *   - domain: filter by domain (default: all)
 *
 * Response includes:
 *   - recommendations: array of recommendation records
 *   - summary: status breakdown counts
 *   - provenance: data source metadata
 */

interface StatusSummary {
  total: number;
  implemented: number;
  partially_implemented: number;
  not_implemented: number;
  rejected: number;
  years_since_report: number;
}

function buildProvenance() {
  return {
    mode: 'authoritative' as const,
    summary:
      'RCADIC recommendations from the 1991 Royal Commission into Aboriginal Deaths in Custody. Implementation status sourced from Deloitte 2018 review, OICS WA reports, ALRC Report 133, and Change the Record Coalition.',
    sources: [
      {
        table: 'oversight_recommendations',
        role: 'primary',
        classification: 'canonical',
        filter: 'oversight_body = Royal Commission into Aboriginal Deaths in Custody',
      },
    ],
    references: [
      'Royal Commission into Aboriginal Deaths in Custody (1991) Final Report',
      'Deloitte (2018) Review of the implementation of RCADIC recommendations',
      'OICS WA (2023) Status of RCADIC recommendations',
      'ALRC Report 133 - Pathways to Justice',
      'Change the Record Coalition Annual Reports',
    ],
    generated_at: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get('status')?.trim() || null;
    const cluster = searchParams.get('cluster')?.trim() || null;
    const domain = searchParams.get('domain')?.trim() || null;

    // Build query
    let query = supabase
      .from('oversight_recommendations')
      .select('*')
      .eq(
        'oversight_body',
        'Royal Commission into Aboriginal Deaths in Custody'
      );

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (domain && domain !== 'all') {
      query = query.eq('domain', domain);
    }

    // Cluster filtering uses metadata JSONB
    if (cluster && cluster !== 'all') {
      query = query.eq('metadata->>cluster', cluster);
    }

    const { data, error } = await query.order('recommendation_number');

    if (error) {
      console.error('[RCADIC API] Query error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch RCADIC recommendations', detail: error.message },
        { status: 500 }
      );
    }

    const recommendations = data || [];

    // Build status summary from ALL RCADIC recs (unfiltered) for context
    let allQuery = supabase
      .from('oversight_recommendations')
      .select('status')
      .eq(
        'oversight_body',
        'Royal Commission into Aboriginal Deaths in Custody'
      );

    const { data: allData } = await allQuery;
    const allRecs = allData || [];

    const summary: StatusSummary = {
      total: allRecs.length,
      implemented: allRecs.filter((r) => r.status === 'implemented').length,
      partially_implemented: allRecs.filter(
        (r) => r.status === 'partially_implemented'
      ).length,
      not_implemented: allRecs.filter((r) => r.status === 'not_implemented')
        .length,
      rejected: allRecs.filter((r) => r.status === 'rejected').length,
      years_since_report: new Date().getFullYear() - 1991,
    };

    return NextResponse.json({
      recommendations,
      count: recommendations.length,
      summary,
      provenance: buildProvenance(),
    });
  } catch (err) {
    console.error('[RCADIC API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
