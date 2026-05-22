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

// Mirrors scripts/alma-rescore.mjs. Keep weights in sync with
// src/lib/alma/profile-completeness.ts.
const WEIGHTS = {
  has_logo: 0.10,
  has_website: 0.10,
  has_tagline_or_description: 0.08,
  has_history: 0.10,
  has_annual_report: 0.08,
  has_photos: 0.10,
  has_evidence: 0.10,
  has_media_coverage: 0.07,
  is_claimed: 0.15,
  has_named_contact: 0.12,
} as const;

function buildBreakdown(input: any) {
  return {
    has_logo: !!(input.logo_url && input.logo_url.trim()),
    has_website: !!(
      (input.website_url && input.website_url.trim()) ||
      (input.website && input.website.trim())
    ),
    has_tagline_or_description: !!(
      (input.tagline && input.tagline.trim().length > 0) ||
      (input.description && input.description.trim().length > 30)
    ),
    has_history: !!(input.history_summary && input.history_summary.trim().length > 30),
    has_annual_report: !!(input.annual_report_url && input.annual_report_url.trim()),
    has_photos: !!(input.el_gallery_ids && input.el_gallery_ids.length > 0),
    has_evidence: (input.evidence_count || 0) > 0,
    has_media_coverage: (input.media_count || 0) > 0,
    is_claimed:
      input.claim_status === 'verified' || input.claim_status === 'community_verified',
    has_named_contact: !!(input.claim_contact_name && input.claim_contact_name.trim()),
  };
}

function scoreOrg(input: any) {
  const breakdown = buildBreakdown(input);
  let score = 0;
  for (const k of Object.keys(WEIGHTS)) {
    if ((breakdown as any)[k]) score += (WEIGHTS as any)[k];
  }
  return { score: Math.round(score * 100) / 100, breakdown };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  // Default to 5000 — gives Vercel cron room within its 5min timeout while
  // chewing through the long tail over several days. Use --all-equivalent
  // (?limit=200000) when running ad-hoc from the script.
  const target = Math.min(parseInt(searchParams.get('limit') || '5000', 10), 200000);
  const onlyMissing = searchParams.get('only_missing') === 'true';

  const supabase = createServiceClient() as any;

  // Page eligible orgs via .range — Supabase caps each fetch at 1000 rows
  // regardless of .limit().
  const pageSize = 1000;
  const orgs: any[] = [];
  let offset = 0;
  while (orgs.length < target) {
    const remaining = target - orgs.length;
    const upper = offset + Math.min(pageSize, remaining) - 1;
    let q = supabase
      .from('organizations')
      .select(
        'id, name, slug, logo_url, website_url, website, tagline, description, history_summary, annual_report_url, el_gallery_ids, profile_completeness_score'
      )
      .neq('archived', true)
      .order('id', { ascending: true })
      .range(offset, upper);
    if (onlyMissing) q = q.is('profile_completeness_score', null);
    const { data: page, error } = await q;
    if (error) {
      return NextResponse.json({ error: error.message, written: 0 }, { status: 500 });
    }
    if (!page || page.length === 0) break;
    orgs.push(...page);
    offset += page.length;
    if (page.length < pageSize) break;
  }

  if (orgs.length === 0) {
    return NextResponse.json({ written: 0, reason: 'no_orgs' });
  }

  // Hydrate claim + evidence + media counts per 100-org chunk
  const orgIds = orgs.map((o) => o.id);
  const claimByOrg = new Map<string, any>();
  const evidenceCountByOrg = new Map<string, number>();
  const mediaCountByOrg = new Map<string, number>();

  for (let i = 0; i < orgIds.length; i += 100) {
    const slice = orgIds.slice(i, i + 100);
    const [claims, interventions, mediaArticles] = await Promise.all([
      supabase
        .from('organization_claims')
        .select('organization_id, status, contact_name, created_at')
        .in('organization_id', slice)
        .order('created_at', { ascending: false }),
      supabase
        .from('alma_interventions')
        .select('id, operating_organization_id')
        .in('operating_organization_id', slice),
      supabase
        .from('alma_media_articles')
        .select('id, organizations_mentioned')
        .or(slice.map((id: string) => `organizations_mentioned.cs.["${id}"]`).join(',')),
    ]);
    for (const c of claims.data || []) {
      if (!claimByOrg.has(c.organization_id)) claimByOrg.set(c.organization_id, c);
    }
    const interventionsByOrg = new Map<string, number>();
    for (const i2 of interventions.data || []) {
      if (!i2.operating_organization_id) continue;
      interventionsByOrg.set(
        i2.operating_organization_id,
        (interventionsByOrg.get(i2.operating_organization_id) || 0) + 1
      );
    }
    if (interventionsByOrg.size > 0) {
      const ivIds = (interventions.data || []).map((x: any) => x.id);
      for (let j = 0; j < ivIds.length; j += 100) {
        const ivSlice = ivIds.slice(j, j + 100);
        const { data: links } = await supabase
          .from('alma_intervention_evidence')
          .select('intervention_id')
          .in('intervention_id', ivSlice);
        const seenIv = new Set((links || []).map((l: any) => l.intervention_id));
        for (const iv of (interventions.data || []).filter((x: any) => ivSlice.includes(x.id))) {
          if (seenIv.has(iv.id)) {
            evidenceCountByOrg.set(
              iv.operating_organization_id,
              (evidenceCountByOrg.get(iv.operating_organization_id) || 0) + 1
            );
          }
        }
      }
    }
    for (const m of mediaArticles.data || []) {
      const mentions = Array.isArray(m.organizations_mentioned) ? m.organizations_mentioned : [];
      for (const oid of mentions) {
        if (slice.includes(oid)) {
          mediaCountByOrg.set(oid, (mediaCountByOrg.get(oid) || 0) + 1);
        }
      }
    }
  }

  // Score + write
  let written = 0;
  let unchanged = 0;
  let failed = 0;
  for (const o of orgs) {
    const claim = claimByOrg.get(o.id);
    const { score, breakdown } = scoreOrg({
      logo_url: o.logo_url,
      website_url: o.website_url,
      website: o.website,
      tagline: o.tagline,
      description: o.description,
      history_summary: o.history_summary,
      annual_report_url: o.annual_report_url,
      el_gallery_ids: o.el_gallery_ids,
      evidence_count: evidenceCountByOrg.get(o.id) || 0,
      media_count: mediaCountByOrg.get(o.id) || 0,
      claim_status: claim?.status,
      claim_contact_name: claim?.contact_name,
    });
    if (
      o.profile_completeness_score !== null &&
      Math.abs(Number(o.profile_completeness_score) - score) < 0.005
    ) {
      unchanged++;
      continue;
    }
    const { error: updErr } = await supabase
      .from('organizations')
      .update({
        profile_completeness_score: score,
        profile_completeness_breakdown: breakdown,
      })
      .eq('id', o.id);
    if (updErr) failed++;
    else written++;
  }

  return NextResponse.json({
    written,
    unchanged,
    failed,
    scanned: orgs.length,
    target,
  });
}
