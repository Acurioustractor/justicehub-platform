import { scoreOrg } from './profile-completeness';
import { migrateLogo } from './migrate-logo';
import type { LooseSupabaseClient } from '@/lib/supabase/service-lite';

export const FIELD_MAP: Record<string, { from: string; to: string }> = {
  email: { from: 'contact_email', to: 'contact_email' },
  phone: { from: 'contact_phone', to: 'phone' },
  logo: { from: 'logo_url', to: 'logo_url' },
  annual_report: { from: 'annual_report_url', to: 'annual_report_url' },
  history: { from: 'history_summary', to: 'history_summary' },
};

export const ALLOWED_FIELDS = Object.keys(FIELD_MAP);

export type ApproveResult =
  | {
      ok: true;
      candidateId: string;
      orgId: string;
      status: 'approved';
      applied: string[];
      skipped: Array<{ field: string; reason: string }>;
      completeness: { score: number; delta: number };
    }
  | {
      ok: false;
      candidateId: string;
      orgId: string | null;
      status: 'no_changes' | 'already_actioned' | 'candidate_missing' | 'org_missing' | 'error';
      message: string;
      skipped?: Array<{ field: string; reason: string }>;
    };

interface ApproveOptions {
  candidateId: string;
  fields: string[];
  overwrite: boolean;
  reviewerId: string;
}

/**
 * Approve a single candidate. Idempotent and safe to call from both the
 * single-row [id] route and the bulk approval route. Never overwrites a
 * populated org field unless `overwrite=true`.
 */
export async function approveCandidate(
  supabase: LooseSupabaseClient,
  opts: ApproveOptions
): Promise<ApproveResult> {
  const { candidateId, fields, overwrite, reviewerId } = opts;
  const filteredFields = fields.filter((f) => ALLOWED_FIELDS.includes(f));
  if (filteredFields.length === 0) {
    return {
      ok: false,
      candidateId,
      orgId: null,
      status: 'error',
      message: 'fields[] must contain at least one of: ' + ALLOWED_FIELDS.join(', '),
    };
  }

  const { data: candidate, error: candidateErr } = await supabase
    .from('alma_org_enrichment_candidates')
    .select('id, organization_id, extracted_fields, status')
    .eq('id', candidateId)
    .single();

  if (candidateErr || !candidate) {
    return {
      ok: false,
      candidateId,
      orgId: null,
      status: 'candidate_missing',
      message: candidateErr?.message || 'candidate not found',
    };
  }

  if (candidate.status === 'approved' || candidate.status === 'rejected') {
    return {
      ok: false,
      candidateId,
      orgId: candidate.organization_id,
      status: 'already_actioned',
      message: `candidate already ${candidate.status}`,
    };
  }

  const extracted = (candidate.extracted_fields || {}) as Record<string, any>;

  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select(
      'id, slug, contact_email, email, phone, logo_url, annual_report_url, history_summary, website_url, website, tagline, description, profile_completeness_score'
    )
    .eq('id', candidate.organization_id)
    .single();

  if (orgErr || !org) {
    return {
      ok: false,
      candidateId,
      orgId: candidate.organization_id,
      status: 'org_missing',
      message: orgErr?.message || 'organisation not found',
    };
  }

  const updatePayload: Record<string, unknown> = {};
  const appliedFields: string[] = [];
  const skippedFields: Array<{ field: string; reason: string }> = [];

  for (const f of filteredFields) {
    const { from, to } = FIELD_MAP[f];
    const newVal = extracted[from];
    if (!newVal || typeof newVal !== 'string' || !newVal.trim()) {
      skippedFields.push({ field: f, reason: 'extraction empty' });
      continue;
    }
    if (f === 'email') {
      const existing = (org as any).contact_email || (org as any).email;
      if (existing && !overwrite) {
        skippedFields.push({ field: f, reason: 'already has email' });
        continue;
      }
    } else if ((org as any)[to] && !overwrite) {
      skippedFields.push({ field: f, reason: 'already populated' });
      continue;
    }
    updatePayload[to] = newVal.trim();
    appliedFields.push(f);
  }

  if (Object.keys(updatePayload).length === 0) {
    return {
      ok: false,
      candidateId,
      orgId: candidate.organization_id,
      status: 'no_changes',
      message: 'No fields applied — org already has values. Pass overwrite=true to replace.',
      skipped: skippedFields,
    };
  }

  updatePayload.updated_at = new Date().toISOString();

  const { error: orgUpdateErr } = await supabase
    .from('organizations')
    .update(updatePayload)
    .eq('id', candidate.organization_id);
  if (orgUpdateErr) {
    return {
      ok: false,
      candidateId,
      orgId: candidate.organization_id,
      status: 'error',
      message: orgUpdateErr.message,
    };
  }

  // If a logo URL just landed, copy it into Supabase Storage so the
  // org page never breaks when the source host goes down. Best-effort —
  // a failed copy keeps the remote URL on the row.
  if (appliedFields.includes('logo') && updatePayload.logo_url) {
    const orgSlug = ((org as any).slug as string) || candidate.organization_id;
    const remoteUrl = updatePayload.logo_url as string;
    const migration = await migrateLogo(supabase, { orgSlug, remoteUrl });
    if (migration.ok && migration.storageUrl && migration.storageUrl !== remoteUrl) {
      await supabase
        .from('organizations')
        .update({ logo_url: migration.storageUrl })
        .eq('id', candidate.organization_id);
      updatePayload.logo_url = migration.storageUrl;
    }
  }

  // Recompute completeness — see [id] route comment for why we skip evidence/media here.
  const projected = { ...org, ...updatePayload } as Record<string, any>;
  const [claimRes, galleryRes] = await Promise.all([
    supabase
      .from('organization_claims')
      .select('status, contact_name')
      .eq('organization_id', candidate.organization_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('organizations')
      .select('el_gallery_ids')
      .eq('id', candidate.organization_id)
      .single(),
  ]);

  const scored = scoreOrg({
    logo_url: projected.logo_url,
    website_url: projected.website_url,
    website: projected.website,
    tagline: projected.tagline,
    description: projected.description,
    history_summary: projected.history_summary,
    annual_report_url: projected.annual_report_url,
    el_gallery_ids: ((galleryRes.data as any)?.el_gallery_ids as string[]) || [],
    evidence_count: 0,
    media_count: 0,
    claim_status: (claimRes.data as any)?.status,
    claim_contact_name: (claimRes.data as any)?.contact_name,
  });

  await supabase
    .from('organizations')
    .update({
      profile_completeness_score: scored.score,
      profile_completeness_breakdown: scored.breakdown,
    })
    .eq('id', candidate.organization_id);

  await supabase
    .from('alma_org_enrichment_candidates')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', candidateId);

  return {
    ok: true,
    candidateId,
    orgId: candidate.organization_id,
    status: 'approved',
    applied: appliedFields,
    skipped: skippedFields,
    completeness: {
      score: scored.score,
      delta: scored.score - ((org as any).profile_completeness_score || 0),
    },
  };
}
