import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

const VALID_CATEGORIES = [
  'direct_yj_service', 'yj_research_or_review', 'yj_advisory_consultancy',
  'yj_infrastructure_or_capital', 'broader_justice_includes_yj', 'not_yj_related',
] as const;

type Category = typeof VALID_CATEGORIES[number];

export async function GET(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient() as any;
  const params = request.nextUrl.searchParams;
  const confirmation = params.get('confirmation');
  const category = params.get('category');
  const state = params.get('state');
  const yjOnly = params.get('yj_only') === '1';

  let q = supabase
    .from('civic_funding_yj_classifications')
    .select(`
      id, funding_id, is_yj_relevant, yj_relevance_category,
      llm_proposed_yj, llm_proposed_category, llm_confidence, llm_evidence_snippet, llm_model, llm_proposed_at,
      confirmed_at, confirmed_by, override_reason
    `)
    .order('llm_confidence', { ascending: true, nullsFirst: false });

  if (confirmation === 'pending') q = q.is('confirmed_at', null);
  if (confirmation === 'confirmed') q = q.not('confirmed_at', 'is', null);
  if (category) q = q.eq('llm_proposed_category', category);
  if (yjOnly) q = q.eq('llm_proposed_yj', true);

  const { data: classRows, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const cls = classRows || [];
  const fundingIds = cls.map((r: any) => r.funding_id);
  const fundingById = new Map<string, any>();
  for (let i = 0; i < fundingIds.length; i += 100) {
    const chunk = fundingIds.slice(i, i + 100);
    const { data: funds, error: fErr } = await supabase
      .from('justice_funding')
      .select('id, recipient_name, recipient_abn, program_name, project_description, amount_dollars, state, funding_type, sector, source, source_url, financial_year')
      .in('id', chunk);
    if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 });
    for (const f of funds || []) fundingById.set((f as any).id, f);
  }

  let rows = cls.map((c: any) => ({ ...c, funding: fundingById.get(c.funding_id) || null }));
  if (state) rows = rows.filter((r: any) => r.funding?.state === state);

  return NextResponse.json({
    rows,
    counts: {
      total: rows.length,
      pending: rows.filter((r: any) => !r.confirmed_at).length,
      confirmed: rows.filter((r: any) => r.confirmed_at).length,
      yj_proposed: rows.filter((r: any) => r.llm_proposed_yj === true).length,
      yj_confirmed: rows.filter((r: any) => r.confirmed_at && r.is_yj_relevant === true).length,
      pending_yj_proposed: rows.filter((r: any) => !r.confirmed_at && r.llm_proposed_yj === true).length,
    },
  });
}

export async function PUT(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient() as any;
  const body = await request.json();
  const { id, is_yj_relevant, yj_relevance_category, override_reason } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (yj_relevance_category && !VALID_CATEGORIES.includes(yj_relevance_category as Category)) {
    return NextResponse.json({ error: 'invalid yj_relevance_category' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('civic_funding_yj_classifications')
    .update({
      is_yj_relevant: is_yj_relevant ?? null,
      yj_relevance_category: yj_relevance_category ?? null,
      override_reason: override_reason || null,
      confirmed_at: new Date().toISOString(),
      confirmed_by: admin.user.id,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ row: data });
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient() as any;
  const body = await request.json();
  const { action, min_confidence } = body;

  if (action !== 'bulk_accept_high_confidence') {
    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  }

  const minConf = typeof min_confidence === 'number' ? min_confidence : 0.9;

  const { data, error } = await supabase
    .from('civic_funding_yj_classifications')
    .select('id, llm_proposed_yj, llm_proposed_category, llm_confidence')
    .is('confirmed_at', null)
    .gte('llm_confidence', minConf);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date().toISOString();
  let accepted = 0;
  for (const row of data || []) {
    const { error: updErr } = await supabase
      .from('civic_funding_yj_classifications')
      .update({
        is_yj_relevant: (row as any).llm_proposed_yj,
        yj_relevance_category: (row as any).llm_proposed_category,
        confirmed_at: now,
        confirmed_by: admin.user.id,
        override_reason: `bulk-accepted at confidence >= ${minConf}`,
      })
      .eq('id', (row as any).id);
    if (!updErr) accepted++;
  }

  return NextResponse.json({ accepted, considered: (data || []).length, min_confidence: minConf });
}
