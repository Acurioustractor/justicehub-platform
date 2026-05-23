/**
 * Citation format helpers for Civic Intelligence claims.
 *
 * Every snapshot stat carries a CopyCitationButton. Clicking it produces a
 * citation string the reader can paste into their report or article.
 */

export interface CivicClaim {
  claim_id: string;
  display_label: string;
  value_numeric: number | null;
  value_text: string | null;
  unit: string | null;
  tier: number | null;
  region: string;
  chapter: string;
  methodology: string;
  methodology_url: string | null;
  source_record_ids: Record<string, unknown>;
  source_doc_urls: string[];
  computed_at: string;
  verification_status: 'snapshot' | 'verified' | 'retired';
  notes: string | null;
  source_year: string | null;
}

const SITE_ORIGIN = 'https://justicehub.com.au';

export function formatCitation(claim: CivicClaim): string {
  const date = claim.computed_at.slice(0, 10);
  const value = claim.value_text || (claim.value_numeric != null ? String(claim.value_numeric) : 'unavailable');
  const url = `${SITE_ORIGIN}${claim.methodology_url || '/intelligence/civic/methodology'}#${claim.claim_id}`;
  return `${value}. Source: JusticeHub Civic Intelligence, computed ${date}. Methodology: ${url}`;
}

export function formatShortCitation(claim: CivicClaim): string {
  const date = claim.computed_at.slice(0, 10);
  return `JusticeHub Civic Intelligence, ${date}`;
}

export function tierLabel(tier: number | null): string {
  if (tier === 1) return 'Tier 1';
  if (tier === 2) return 'Tier 2';
  if (tier === 3) return 'Tier 3';
  return 'n/a';
}

export function regionLabel(region: string): string {
  if (region === 'national') return 'National';
  if (region === 'NT+QLD') return 'NT + QLD';
  return region;
}
