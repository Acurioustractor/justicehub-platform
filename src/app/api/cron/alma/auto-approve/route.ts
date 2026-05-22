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

// Mirrors scripts/alma-auto-approve.mjs. Keep in sync when one side changes.
const FIELD_MAP = {
  email: { from: 'contact_email', to: 'contact_email' },
  phone: { from: 'contact_phone', to: 'phone' },
  logo: { from: 'logo_url', to: 'logo_url' },
  annual_report: { from: 'annual_report_url', to: 'annual_report_url' },
  history: { from: 'history_summary', to: 'history_summary' },
} as const;

const AUTO_APPROVE_MARKER = 'cron/alma/auto-approve';

function shouldAutoApprove(candidate: any, org: any, minConfidence: number) {
  const reasons: string[] = [];
  if ((candidate.confidence ?? 0) < minConfidence) {
    reasons.push(`confidence ${candidate.confidence} < ${minConfidence}`);
  }
  const ext = candidate.extracted_fields || {};
  const im = ext.identity_match || {};
  if (im.represents_named_org === false) {
    reasons.push('identity mismatch');
  }
  const ev = ext.email_validation || null;
  const emailValidated =
    !!ext.contact_email && ev && ev.kind === 'valid' && ev.generic === true;

  const fieldsToApply: string[] = [];
  for (const [key, { from, to }] of Object.entries(FIELD_MAP)) {
    const val = ext[from];
    if (!val || typeof val !== 'string' || !val.trim()) continue;
    if (key === 'email') {
      if (!emailValidated) continue;
      if (org.contact_email || org.email) continue;
    } else if (org[to]) {
      continue;
    }
    fieldsToApply.push(key);
  }
  if (fieldsToApply.length === 0) {
    reasons.push('no fields to apply');
  }
  return { eligible: reasons.length === 0, reasons, fieldsToApply };
}

async function autoApprove(supabase: any, candidate: any, org: any) {
  const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
  const applied: string[] = [];
  const ext = candidate.extracted_fields || {};
  const ev = ext.email_validation || null;
  const emailValidated =
    !!ext.contact_email && ev && ev.kind === 'valid' && ev.generic === true;

  for (const [key, { from, to }] of Object.entries(FIELD_MAP)) {
    const val = ext[from];
    if (!val || typeof val !== 'string' || !val.trim()) continue;
    if (key === 'email' && !emailValidated) continue;
    if (key === 'email' && (org.contact_email || org.email)) continue;
    if (key !== 'email' && org[to]) continue;
    updatePayload[to] = val.trim();
    applied.push(key);
  }
  if (applied.length === 0) return { applied: [], status: 'no_changes' };

  const { error: orgErr } = await supabase
    .from('organizations')
    .update(updatePayload)
    .eq('id', org.id);
  if (orgErr) throw new Error(`org update failed: ${orgErr.message}`);

  const provenance = {
    ...(candidate.provenance || {}),
    auto_approved_by: AUTO_APPROVE_MARKER,
    auto_approved_at: new Date().toISOString(),
    auto_applied_fields: applied,
  };
  const { error: candErr } = await supabase
    .from('alma_org_enrichment_candidates')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      provenance,
    })
    .eq('id', candidate.id);
  if (candErr) throw new Error(`candidate mark failed: ${candErr.message}`);

  return { applied, status: 'approved' };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 600);
  const minConfidence = parseFloat(searchParams.get('min_confidence') || '0.95');

  // Cast to any — stale database.types.ts doesn't know about
  // organizations.annual_report_url, history_summary, etc.
  const supabase = createServiceClient() as any;

  const { data: candidates, error } = await supabase
    .from('alma_org_enrichment_candidates')
    .select('id, organization_id, extracted_fields, confidence, provenance')
    .eq('source', 'website_scrape')
    .eq('status', 'pending_review')
    .gte('confidence', minConfidence)
    .order('confidence', { ascending: false, nullsFirst: false })
    .limit(limit * 3);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ approved: 0, skipped: 0, reason: 'no_candidates' });
  }

  const orgIds = Array.from(new Set(candidates.map((c: any) => c.organization_id)));
  const orgsById: Record<string, any> = {};
  for (let i = 0; i < orgIds.length; i += 100) {
    const slice = orgIds.slice(i, i + 100);
    const { data: orgs } = await supabase
      .from('organizations')
      .select(
        'id, name, slug, contact_email, email, phone, logo_url, annual_report_url, history_summary, is_indigenous_org, archived'
      )
      .in('id', slice);
    for (const o of orgs || []) orgsById[o.id] = o;
  }

  let approved = 0;
  let fieldsApplied = 0;
  let skipped = 0;
  let errors = 0;
  const samples: Array<{ name: string; fields: string[] }> = [];

  for (const c of candidates) {
    const org = orgsById[c.organization_id];
    if (!org || org.archived || org.is_indigenous_org) {
      skipped++;
      continue;
    }
    const check = shouldAutoApprove(c, org, minConfidence);
    if (!check.eligible) {
      skipped++;
      continue;
    }
    try {
      const r = await autoApprove(supabase, c, org);
      if (r.status === 'approved') {
        approved++;
        fieldsApplied += r.applied.length;
        if (samples.length < 10) samples.push({ name: org.name, fields: r.applied });
      }
    } catch {
      errors++;
    }
    if (approved >= limit) break;
  }

  return NextResponse.json({
    approved,
    fieldsApplied,
    skipped,
    errors,
    minConfidence,
    samples,
  });
}
