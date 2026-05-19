/**
 * Profile completeness scoring for organisations on the Australian Living
 * Map of Alternatives. The score (0-1) drives the "Exemplar profiles" toggle
 * on /alma and the priority queue for outreach.
 *
 * Threshold: featured_on_map = true when score >= 0.6.
 *
 * Per-field weights live in WEIGHTS below. Add a field by extending both
 * WEIGHTS and the breakdown record, then re-run scripts/alma-rescore.mjs.
 */

export type CompletenessBreakdown = {
  has_logo: boolean;
  has_website: boolean;
  has_tagline_or_description: boolean;
  has_history: boolean;
  has_annual_report: boolean;
  has_photos: boolean;
  has_evidence: boolean;
  has_media_coverage: boolean;
  is_claimed: boolean;
  has_named_contact: boolean;
};

const WEIGHTS: Record<keyof CompletenessBreakdown, number> = {
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
};

// Threshold for auto-featuring on the Map. Calibrated against the current
// data state on 2026-05-20: Oonchiumpa = 0.55 (the only org meeting any
// reasonable bar). When enrichment lifts the average, raise this to 0.6+.
export const FEATURED_THRESHOLD = 0.5;

export interface OrgCompletenessInput {
  logo_url?: string | null;
  website_url?: string | null;
  website?: string | null;
  tagline?: string | null;
  description?: string | null;
  history_summary?: string | null;
  annual_report_url?: string | null;
  el_gallery_ids?: string[] | null;
  evidence_count?: number;
  media_count?: number;
  claim_status?: string | null;
  claim_contact_name?: string | null;
}

export function buildBreakdown(input: OrgCompletenessInput): CompletenessBreakdown {
  return {
    has_logo: !!(input.logo_url && input.logo_url.trim()),
    has_website: !!((input.website_url && input.website_url.trim()) || (input.website && input.website.trim())),
    has_tagline_or_description: !!(
      (input.tagline && input.tagline.trim().length > 0) ||
      (input.description && input.description.trim().length > 30)
    ),
    has_history: !!(input.history_summary && input.history_summary.trim().length > 30),
    has_annual_report: !!(input.annual_report_url && input.annual_report_url.trim()),
    has_photos: !!(input.el_gallery_ids && input.el_gallery_ids.length > 0),
    has_evidence: (input.evidence_count || 0) > 0,
    has_media_coverage: (input.media_count || 0) > 0,
    is_claimed: input.claim_status === 'verified' || input.claim_status === 'community_verified',
    has_named_contact: !!(input.claim_contact_name && input.claim_contact_name.trim()),
  };
}

export function scoreOrg(input: OrgCompletenessInput): {
  score: number;
  breakdown: CompletenessBreakdown;
  missing: Array<keyof CompletenessBreakdown>;
} {
  const breakdown = buildBreakdown(input);
  let score = 0;
  const missing: Array<keyof CompletenessBreakdown> = [];
  (Object.keys(WEIGHTS) as Array<keyof CompletenessBreakdown>).forEach((key) => {
    if (breakdown[key]) {
      score += WEIGHTS[key];
    } else {
      missing.push(key);
    }
  });
  return {
    score: Math.round(score * 100) / 100,
    breakdown,
    missing,
  };
}

export function isExemplar(score: number | null | undefined): boolean {
  return typeof score === 'number' && score >= FEATURED_THRESHOLD;
}

export function describeMissing(key: keyof CompletenessBreakdown): string {
  const labels: Record<keyof CompletenessBreakdown, string> = {
    has_logo: 'logo',
    has_website: 'website',
    has_tagline_or_description: 'description',
    has_history: 'history',
    has_annual_report: 'annual report link',
    has_photos: 'photos',
    has_evidence: 'evidence links',
    has_media_coverage: 'media coverage',
    is_claimed: 'verified claim',
    has_named_contact: 'named contact',
  };
  return labels[key];
}
