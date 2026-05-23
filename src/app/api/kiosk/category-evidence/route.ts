import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * Per-category coverage payload for the WHAT WORKS modal. Returns:
 *   - totalPrograms: count of alma_interventions in this category
 *   - byEvidence: distribution by evidence_level (ordered)
 *   - namedOrgs: up to 30 distinct operating orgs with their evidence level
 *
 * Public, read-only.
 */

export const dynamic = 'force-dynamic';

const EVIDENCE_ORDER = [
  'High Quality Evidence',
  'Strong Evidence',
  'Promising Evidence',
  'Preliminary Evidence',
  'Untested',
  null,
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get('type') || '').trim();
  if (!type) return NextResponse.json({ error: 'type required' }, { status: 400 });

  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('alma_interventions')
    .select('id, name, type, operating_organization, operating_organization_id, evidence_level')
    .eq('type', type)
    .eq('serves_youth_justice', true)
    .neq('verification_status', 'ai_generated')
    .limit(3000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data || [];

  // Evidence distribution
  const evCounts = new Map<string, number>();
  for (const r of rows) {
    const lv = (r.evidence_level || 'No evidence level recorded').toString();
    evCounts.set(lv, (evCounts.get(lv) || 0) + 1);
  }
  const byEvidence = [...evCounts.entries()]
    .map(([level, count]) => ({ level, count }))
    .sort((a, b) => {
      const ai = EVIDENCE_ORDER.indexOf(a.level as any);
      const bi = EVIDENCE_ORDER.indexOf(b.level as any);
      const aRank = ai === -1 ? 99 : ai;
      const bRank = bi === -1 ? 99 : bi;
      return aRank - bRank;
    });

  // Named orgs (dedupe by operating_organization name, prefer evidence-backed)
  const seen = new Set<string>();
  const ranked = [...rows].sort((a, b) => {
    const aE = a.evidence_level && !String(a.evidence_level).toLowerCase().startsWith('untested') ? 0 : 1;
    const bE = b.evidence_level && !String(b.evidence_level).toLowerCase().startsWith('untested') ? 0 : 1;
    return aE - bE;
  });

  const orgIdsForLookup: string[] = [];
  for (const r of ranked) {
    const name = r.operating_organization;
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    if (r.operating_organization_id) orgIdsForLookup.push(r.operating_organization_id);
  }

  const orgStateMap = new Map<string, string>();
  const orgSlugMap = new Map<string, string>();
  if (orgIdsForLookup.length > 0) {
    for (let i = 0; i < orgIdsForLookup.length; i += 100) {
      const chunk = orgIdsForLookup.slice(i, i + 100);
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, slug, state')
        .in('id', chunk);
      for (const o of orgs || []) {
        if (o.slug) orgSlugMap.set(o.id, o.slug);
        if (o.state) orgStateMap.set(o.id, o.state);
      }
    }
  }

  const namedOrgs: any[] = [];
  const seen2 = new Set<string>();
  for (const r of ranked) {
    if (namedOrgs.length >= 30) break;
    const name = r.operating_organization;
    if (!name || seen2.has(name.toLowerCase())) continue;
    seen2.add(name.toLowerCase());
    namedOrgs.push({
      name,
      slug: r.operating_organization_id ? orgSlugMap.get(r.operating_organization_id) || null : null,
      state: r.operating_organization_id ? orgStateMap.get(r.operating_organization_id) || null : null,
      evidence_level: r.evidence_level,
    });
  }

  return NextResponse.json({
    type,
    totalPrograms: rows.length,
    byEvidence,
    namedOrgs,
  });
}
