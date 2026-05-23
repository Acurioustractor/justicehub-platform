import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

// Mirrors scripts/civic/seed-claim-evidence.mjs RULES — keep in sync.
const RULES: Array<{ pattern: RegExp; sources: Array<{ source_table: string; confidence: number; note: string }> }> = [
  { pattern: /^access\.cost\.detention_/, sources: [
    { source_table: 'rogs_justice_spending', confidence: 1.0, note: 'ROGS Table 17A.20: PC Report on Government Services.' },
    { source_table: 'youth_detention_facilities', confidence: 0.95, note: '19 canonical facilities with capacity_beds.' },
    { source_table: 'aihw_youth_justice_stats', confidence: 0.9, note: 'AIHW independently reports detention figures.' },
  ]},
  { pattern: /^access\.cost\.community_/, sources: [
    { source_table: 'rogs_justice_spending', confidence: 1.0, note: 'ROGS Table 17A.21.' },
    { source_table: 'aihw_youth_justice_stats', confidence: 0.85, note: 'AIHW supervision context.' },
  ]},
  { pattern: /^access\.count\.detention_beds/, sources: [
    { source_table: 'youth_detention_facilities', confidence: 1.0, note: '19 canonical facilities.' },
    { source_table: 'organizations', confidence: 0.95, note: 'type=detention_centre rows.' },
  ]},
  { pattern: /^access\.count\.detention_avg_daily_pop/, sources: [
    { source_table: 'rogs_justice_spending', confidence: 1.0, note: 'ROGS 17A.20 daily pop.' },
    { source_table: 'aihw_youth_justice_stats', confidence: 0.9, note: 'AIHW daily pop independently.' },
  ]},
  { pattern: /^access\.ratio\.detention_vs_community_cost/, sources: [
    { source_table: 'rogs_justice_spending', confidence: 1.0, note: 'ROGS 17A.20/17A.21.' },
    { source_table: 'aihw_youth_justice_stats', confidence: 0.85, note: 'AIHW cross-check.' },
  ]},
  { pattern: /^access\.count\.tier_1_orgs/, sources: [
    { source_table: 'civic_org_classifications', confidence: 1.0, note: 'Tier 1 universe definition.' },
    { source_table: 'alma_interventions', confidence: 0.9, note: 'Bottom-up corroboration.' },
  ]},
  { pattern: /^access\.indigenous_share/, sources: [
    { source_table: 'civic_org_classifications', confidence: 1.0, note: 'Tier 1 universe.' },
    { source_table: 'oric_corporations', confidence: 0.95, note: 'Authoritative ACCO check.' },
    { source_table: 'organizations', confidence: 0.9, note: 'is_indigenous_org heuristic.' },
  ]},
  { pattern: /^access\.sum\.tier_1|^access\.median\.tier_1|^access\.indigenous_funding_share\.tier_1/, sources: [
    { source_table: 'justice_funding', confidence: 1.0, note: '157K rows of YJ-tagged funding.' },
    { source_table: 'civic_org_classifications', confidence: 1.0, note: 'Tier 1 recipient set.' },
    { source_table: 'organizations', confidence: 0.95, note: 'acco_certified flag.' },
  ]},
  { pattern: /^access\.(ratio|sum)\.consultancy/, sources: [
    { source_table: 'justice_funding', confidence: 0.95, note: 'Underlying funding records.' },
    { source_table: 'civic_funding_yj_classifications', confidence: 0.9, note: 'is_yj_relevant flags.' },
    { source_table: 'civic_consultancy_spending', confidence: 0.9, note: 'Dedicated consultancy dataset.' },
  ]},
  { pattern: /^access\.ratio\.dept_vs_frontline_meetings/, sources: [
    { source_table: 'civic_ministerial_diaries', confidence: 1.0, note: '1,728 ministerial diary entries.' },
    { source_table: 'civic_meeting_tags', confidence: 0.95, note: 'LLM-tagged sector. HUMAN REVIEW PENDING.' },
  ]},
  { pattern: /^access\.share\.foundation_dollars_to_acco/, sources: [
    { source_table: 'foundation_grantees', confidence: 0.85, note: '179 of ~9K grant-makers tracked.' },
    { source_table: 'oric_corporations', confidence: 0.95, note: 'ACCO test via grantee_abn match.' },
    { source_table: 'organizations', confidence: 0.95, note: 'acco_certified flag.' },
  ]},
  { pattern: /^access\.count\.(yj_supervision|community)_avg_daily/, sources: [
    { source_table: 'aihw_youth_justice_stats', confidence: 1.0, note: 'AIHW YJ in Australia annual.' },
    { source_table: 'rogs_justice_spending', confidence: 0.9, note: 'ROGS daily supervision counts.' },
  ]},
  { pattern: /^oversight\.ratio\.indigenous_overrep/, sources: [
    { source_table: 'aihw_youth_justice_stats', confidence: 1.0, note: 'AIHW rate per 10K.' },
    { source_table: 'oric_corporations', confidence: 0.8, note: 'ACCO universe.' },
    { source_table: 'aihw_child_protection', confidence: 0.85, note: 'OOHC pipeline.' },
  ]},
  { pattern: /^oversight\.rate\.return_to_supervision/, sources: [
    { source_table: 'rogs_justice_spending', confidence: 1.0, note: 'ROGS Table 17A.26.' },
    { source_table: 'civic_hansard', confidence: 0.7, note: 'Hansard cites recidivism.' },
  ]},
  { pattern: /^oversight\.count/, sources: [
    { source_table: 'oversight_recommendations', confidence: 1.0, note: 'Direct row count.' },
    { source_table: 'civic_charter_commitments', confidence: 0.85, note: 'Charter pledges.' },
    { source_table: 'civic_hansard', confidence: 0.65, note: 'Hansard citations.' },
  ]},
  { pattern: /^promises\.count/, sources: [
    { source_table: 'civic_charter_commitments', confidence: 1.0, note: '75 charter pledges.' },
    { source_table: 'civic_hansard', confidence: 1.0, note: '525 Hansard statements.' },
    { source_table: 'civic_ministerial_statements', confidence: 0.9, note: '649 ministerial statements.' },
  ]},
];

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const supabase = createServiceClient() as any;
  const { data: claims, error } = await supabase
    .from('civic_intelligence_claims')
    .select('claim_id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let upserted = 0;
  let errors = 0;
  const unmatched: string[] = [];
  for (const c of claims || []) {
    const rule = RULES.find((r) => r.pattern.test(c.claim_id));
    if (!rule) { unmatched.push(c.claim_id); continue; }
    for (const src of rule.sources) {
      const { error: insErr } = await supabase
        .from('civic_claim_evidence')
        .upsert(
          {
            claim_id: c.claim_id,
            source_table: src.source_table,
            supports: true,
            confidence: src.confidence,
            methodology_note: src.note,
            contributed_by: 'cron_seed_claim_evidence',
            reviewer_status: 'auto_high_confidence',
          },
          { onConflict: 'claim_id,source_table' }
        );
      if (insErr) errors++;
      else upserted++;
    }
  }

  const { data: summary } = await supabase
    .from('v_claim_evidence_summary')
    .select('triangulation_tier');
  const tally: Record<string, number> = {};
  for (const r of summary || []) tally[r.triangulation_tier] = (tally[r.triangulation_tier] || 0) + 1;

  return NextResponse.json({ upserted, errors, unmatched, tally });
}
