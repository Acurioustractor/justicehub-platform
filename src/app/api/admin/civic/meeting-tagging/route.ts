import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

const VALID_SECTORS = [
  'primary_frontline', 'peak_body', 'consultancy', 'government',
  'research_academic', 'legal_service', 'advocacy', 'funder', 'media', 'other',
] as const;

type SectorCategory = typeof VALID_SECTORS[number];

export async function GET(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient() as any;
  const params = request.nextUrl.searchParams;
  const confirmation = params.get('confirmation');
  const sector = params.get('sector');

  let q = supabase
    .from('civic_meeting_tags')
    .select(`
      id, diary_id, sector_category, is_yj_relevant,
      llm_proposed_sector, llm_confidence, llm_evidence_snippet, llm_model, llm_proposed_at,
      confirmed_at, confirmed_by, override_reason
    `)
    .order('llm_confidence', { ascending: true, nullsFirst: false });

  if (confirmation === 'pending') q = q.is('confirmed_at', null);
  if (confirmation === 'confirmed') q = q.not('confirmed_at', 'is', null);
  if (sector) q = q.eq('llm_proposed_sector', sector);

  const { data: tagRows, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tags = tagRows || [];
  const diaryIds = tags.map((t: any) => t.diary_id);
  const diaryById = new Map<string, any>();
  if (diaryIds.length) {
    const { data: diaries, error: diaryErr } = await supabase
      .from('civic_ministerial_diaries')
      .select('id, minister_name, portfolio, meeting_date, who_met, organisation, purpose, jurisdiction, source_url')
      .in('id', diaryIds);
    if (diaryErr) return NextResponse.json({ error: diaryErr.message }, { status: 500 });
    for (const d of diaries || []) diaryById.set((d as any).id, d);
  }
  const rows = tags.map((t: any) => ({ ...t, diary: diaryById.get(t.diary_id) || null }));
  return NextResponse.json({
    rows,
    counts: {
      total: rows.length,
      pending: rows.filter((r: any) => !r.confirmed_at).length,
      confirmed: rows.filter((r: any) => r.confirmed_at).length,
      consultancy_pending: rows.filter((r: any) => !r.confirmed_at && r.llm_proposed_sector === 'consultancy').length,
      primary_frontline_pending: rows.filter((r: any) => !r.confirmed_at && r.llm_proposed_sector === 'primary_frontline').length,
    },
  });
}

export async function PUT(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient() as any;
  const body = await request.json();
  const { id, sector_category, is_yj_relevant, override_reason } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (sector_category && !VALID_SECTORS.includes(sector_category as SectorCategory)) {
    return NextResponse.json({ error: 'invalid sector_category' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('civic_meeting_tags')
    .update({
      sector_category: sector_category ?? null,
      is_yj_relevant: is_yj_relevant ?? true,
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

  const minConf = typeof min_confidence === 'number' ? min_confidence : 0.85;

  const { data, error } = await supabase
    .from('civic_meeting_tags')
    .select('id, llm_proposed_sector, llm_confidence')
    .is('confirmed_at', null)
    .gte('llm_confidence', minConf);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date().toISOString();
  let accepted = 0;
  for (const row of data || []) {
    const { error: updErr } = await supabase
      .from('civic_meeting_tags')
      .update({
        sector_category: (row as any).llm_proposed_sector,
        confirmed_at: now,
        confirmed_by: admin.user.id,
        override_reason: `bulk-accepted at confidence >= ${minConf}`,
      })
      .eq('id', (row as any).id);
    if (!updErr) accepted++;
  }

  return NextResponse.json({ accepted, considered: (data || []).length, min_confidence: minConf });
}
