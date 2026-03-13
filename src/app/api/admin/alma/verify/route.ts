import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const params = request.nextUrl.searchParams;

    const status = params.get('status') || '';
    const page = Math.max(1, parseInt(params.get('page') || '1', 10));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(params.get('limit') || String(DEFAULT_LIMIT), 10)));
    const offset = (page - 1) * limit;

    // Get status breakdown counts
    const { data: allInterventions, error: countError } = await supabase
      .from('alma_interventions')
      .select('verification_status');

    if (countError) throw countError;

    const statusCounts = {
      unverified: 0,
      needs_review: 0,
      verified: 0,
      ai_generated: 0,
    };

    for (const row of allInterventions || []) {
      const s = row.verification_status as keyof typeof statusCounts;
      if (s in statusCounts) {
        statusCounts[s]++;
      } else {
        statusCounts.unverified++;
      }
    }

    // Get interventions with evidence counts via junction table
    let query = supabase
      .from('alma_interventions')
      .select(
        'id, name, type, operating_organization, description, website, verification_status, source_documents, reviewed_by, reviewed_at, created_at',
        { count: 'exact' }
      );

    if (status) {
      query = query.eq('verification_status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: interventions, count: totalCount, error: queryError } = await query;

    if (queryError) throw queryError;

    // Get evidence counts for the returned interventions
    const ids = (interventions || []).map((i) => i.id);
    let evidenceCounts: Record<string, number> = {};

    if (ids.length > 0) {
      const { data: evidenceRows, error: evidenceError } = await supabase
        .from('alma_intervention_evidence')
        .select('intervention_id');

      if (!evidenceError && evidenceRows) {
        // Filter to our IDs and count
        for (const row of evidenceRows) {
          if (ids.includes(row.intervention_id)) {
            evidenceCounts[row.intervention_id] = (evidenceCounts[row.intervention_id] || 0) + 1;
          }
        }
      }
    }

    // Merge evidence counts and sort by evidence count descending
    const enriched = (interventions || []).map((i) => ({
      ...i,
      evidence_count: evidenceCounts[i.id] || 0,
    }));

    enriched.sort((a, b) => b.evidence_count - a.evidence_count);

    return NextResponse.json({
      interventions: enriched,
      statusCounts,
      total: totalCount || 0,
      page,
      limit,
      totalPages: Math.ceil((totalCount || 0) / limit),
    });
  } catch (error) {
    console.error('ALMA verify API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const body = await request.json();
    const { id, action, notes } = body as {
      id?: string;
      action?: string;
      notes?: string;
    };

    if (!id || !action) {
      return NextResponse.json(
        { error: 'id and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['verify', 'reject', 'needs_review'] as const;
    if (!validActions.includes(action as typeof validActions[number])) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const statusMap: Record<string, string> = {
      verify: 'verified',
      reject: 'ai_generated',
      needs_review: 'needs_review',
    };

    const newStatus = statusMap[action];

    const { data, error } = await supabase
      .from('alma_interventions')
      .update({
        verification_status: newStatus,
        reviewed_by: admin.user.id || admin.user.email || 'admin',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, name, verification_status, reviewed_by, reviewed_at')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      intervention: data,
      message: `Intervention ${action === 'verify' ? 'verified' : action === 'reject' ? 'rejected' : 'flagged for review'}`,
    });
  } catch (error) {
    console.error('ALMA verify POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
