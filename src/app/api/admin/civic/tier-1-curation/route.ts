import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';

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
  const state = params.get('state');
  const confirmation = params.get('confirmation'); // 'pending' | 'confirmed' | 'all'
  const tier = params.get('tier');

  let q = supabase
    .from('civic_org_classifications')
    .select(`
      id, organization_id, tier, sector_category,
      llm_proposed_tier, llm_proposed_sector, llm_confidence, llm_evidence_snippet, llm_model, llm_proposed_at,
      confirmed_at, confirmed_by, override_reason, notes,
      organizations:organization_id(id, name, slug, abn, state, is_indigenous_org, description, website, gs_entity_id)
    `)
    .order('llm_confidence', { ascending: true, nullsFirst: false });

  if (confirmation === 'pending') q = q.is('confirmed_at', null);
  if (confirmation === 'confirmed') q = q.not('confirmed_at', 'is', null);
  if (tier) q = q.eq('llm_proposed_tier', parseInt(tier, 10));

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let rows = (data || []) as any[];
  if (state) rows = rows.filter((r) => r.organizations?.state === state);

  // ── Enrichment passes ─────────────────────────────────────────
  const orgIds = rows.map((r) => r.organization_id).filter(Boolean);
  const entityIds = rows.map((r) => r.organizations?.gs_entity_id).filter(Boolean);
  const abns = rows.map((r) => r.organizations?.abn).filter(Boolean);

  // gs_entities registry data (sector, LGA, remoteness, website)
  const gsById = new Map<string, any>();
  for (let i = 0; i < entityIds.length; i += 100) {
    const chunk = entityIds.slice(i, i + 100);
    const { data: gs } = await supabase
      .from('gs_entities')
      .select('id, sector, sub_sector, lga_name, remoteness, website, latest_revenue, is_community_controlled, community_controlled_tier')
      .in('id', chunk);
    for (const e of gs || []) gsById.set(e.id, e);
  }

  // Top 5 alma_interventions per org (verified only)
  const interventionsByOrg = new Map<string, any[]>();
  for (let i = 0; i < orgIds.length; i += 100) {
    const chunk = orgIds.slice(i, i + 100);
    const { data: ints } = await supabase
      .from('alma_interventions')
      .select('id, name, service_role, type, target_cohort, operating_organization_id')
      .in('operating_organization_id', chunk)
      .neq('verification_status', 'ai_generated')
      .limit(500);
    for (const it of ints || []) {
      const arr = interventionsByOrg.get(it.operating_organization_id) || [];
      if (arr.length < 5) arr.push(it);
      interventionsByOrg.set(it.operating_organization_id, arr);
    }
  }

  // ACNC purposes + beneficiary flags (by ABN)
  const acncByAbn = new Map<string, any>();
  for (let i = 0; i < abns.length; i += 100) {
    const chunk = abns.slice(i, i + 100);
    const { data: acnc } = await supabase
      .from('acnc_charities')
      .select('abn, purposes, beneficiaries, ben_aboriginal_tsi, ben_youth, ben_pre_post_release, charity_size, registration_date')
      .in('abn', chunk);
    for (const c of acnc || []) acncByAbn.set(c.abn, c);
  }

  const enriched = rows.map((r) => ({
    ...r,
    registry: gsById.get(r.organizations?.gs_entity_id) || null,
    interventions: interventionsByOrg.get(r.organization_id) || [],
    acnc: acncByAbn.get(r.organizations?.abn) || null,
  }));

  return NextResponse.json({
    rows: enriched,
    counts: {
      total: enriched.length,
      pending: enriched.filter((r: any) => !r.confirmed_at).length,
      confirmed: enriched.filter((r: any) => r.confirmed_at).length,
      tier_1_pending: enriched.filter((r: any) => !r.confirmed_at && r.llm_proposed_tier === 1).length,
    },
  });
}

export async function PUT(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient() as any;
  const body = await request.json();
  const { id, tier, sector_category, override_reason, notes } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (tier != null && ![1, 2, 3].includes(tier)) {
    return NextResponse.json({ error: 'tier must be 1, 2, or 3' }, { status: 400 });
  }
  if (sector_category && !VALID_SECTORS.includes(sector_category as SectorCategory)) {
    return NextResponse.json({ error: 'invalid sector_category' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('civic_org_classifications')
    .update({
      tier: tier ?? null,
      sector_category: sector_category ?? null,
      override_reason: override_reason || null,
      notes: notes || null,
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
  const { action, min_confidence, state } = body;

  if (action !== 'bulk_accept_high_confidence') {
    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  }

  const minConf = typeof min_confidence === 'number' ? min_confidence : 0.85;

  let q = supabase
    .from('civic_org_classifications')
    .select('id, llm_proposed_tier, llm_proposed_sector, llm_confidence, organization_id, organizations:organization_id(state)')
    .is('confirmed_at', null)
    .gte('llm_confidence', minConf);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let rows = (data || []) as any[];
  if (state) rows = rows.filter((r) => r.organizations?.state === state);

  const now = new Date().toISOString();
  let accepted = 0;
  for (const row of rows) {
    const { error: updErr } = await supabase
      .from('civic_org_classifications')
      .update({
        tier: row.llm_proposed_tier,
        sector_category: row.llm_proposed_sector,
        confirmed_at: now,
        confirmed_by: admin.user.id,
        override_reason: `bulk-accepted at confidence >= ${minConf}`,
      })
      .eq('id', row.id);
    if (!updErr) accepted++;
  }

  return NextResponse.json({ accepted, considered: rows.length, min_confidence: minConf });
}
