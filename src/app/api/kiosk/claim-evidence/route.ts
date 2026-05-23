import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * Kiosk-side evidence trail fetcher for the "Backed by N sources" drill.
 *
 * Returns: claim + tier summary + evidence rows + named entities referenced.
 * Same shape as the data /intelligence/civic/claim/[id] composes, but as a
 * single JSON payload so the kiosk modal can render without a route change.
 *
 * Public endpoint (read-only). No auth required.
 */

export const dynamic = 'force-dynamic';

interface EvidenceRow {
  source_table: string;
  source_record_ids: any;
  supports: boolean;
  confidence: number | string | null;
  methodology_note: string | null;
}

interface NamedEntity {
  id: string;
  name: string;
  state: string | null;
  slug: string | null;
}

const SOURCE_TABLE_HUMAN: Record<string, string> = {
  organizations: 'Organisations register',
  civic_org_classifications: 'Civic Tier classifications',
  civic_intelligence_claims: 'Cross-claim derivation',
  aihw_youth_justice_stats: 'AIHW Youth Justice in Australia',
  rogs_justice_spending: 'Productivity Commission RoGS',
  oversight_recommendations: 'Independent oversight bodies',
  justice_funding: 'Justice funding ledger',
  foundation_grantees: 'Foundation grantee ledger',
  auditor_general_audits: 'Auditor-General audits',
  children_commissioner_reports: 'Children’s Commissioner reports',
  civic_charter_commitments: 'Government charter commitments',
  civic_meeting_tags: 'Government meeting register',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get('id') || '').trim();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = createServiceClient() as any;

  const [claimRes, summaryRes, evidenceRes] = await Promise.all([
    supabase
      .from('civic_intelligence_claims')
      .select('claim_id, display_label, value_text, value_numeric, unit, region, source_year, methodology, methodology_url, source_doc_urls')
      .eq('claim_id', id)
      .maybeSingle(),
    supabase
      .from('v_claim_evidence_summary')
      .select('triangulation_tier, supporting_sources')
      .eq('claim_id', id)
      .maybeSingle(),
    supabase
      .from('civic_claim_evidence')
      .select('source_table, source_record_ids, supports, confidence, methodology_note')
      .eq('claim_id', id)
      .order('confidence', { ascending: false, nullsFirst: false }),
  ]);

  if (claimRes.error || !claimRes.data) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }

  const evidence = (evidenceRes.data || []) as EvidenceRow[];

  // Collect any referenced org IDs across the org-bearing keys
  const orgIdSet = new Set<string>();
  for (const ev of evidence) {
    if (!ev.source_record_ids) continue;
    for (const k of ['organization_ids', 'detention_centre_ids', 'indigenous_org_ids', 'tier1_org_ids']) {
      const ids = ev.source_record_ids[k];
      if (Array.isArray(ids)) ids.forEach((i: string) => orgIdSet.add(i));
    }
  }
  const orgIds = Array.from(orgIdSet);

  const namedEntities: NamedEntity[] = [];
  if (orgIds.length > 0) {
    for (let i = 0; i < orgIds.length; i += 100) {
      const chunk = orgIds.slice(i, i + 100);
      const { data } = await supabase
        .from('organizations')
        .select('id, name, state, slug')
        .in('id', chunk);
      for (const o of data || []) namedEntities.push(o);
    }
  }

  return NextResponse.json({
    claim: claimRes.data,
    summary: summaryRes.data || null,
    evidence: evidence.map((e) => ({
      source_table: e.source_table,
      source_human: SOURCE_TABLE_HUMAN[e.source_table] || e.source_table,
      supports: e.supports,
      confidence: e.confidence,
      methodology_note: e.methodology_note,
      source_record_ids: e.source_record_ids,
    })),
    namedEntities,
  });
}
