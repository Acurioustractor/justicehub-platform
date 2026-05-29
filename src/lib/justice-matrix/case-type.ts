/**
 * Case-type normalizer for the Justice Matrix.
 *
 * The justice_matrix_cases.case_type column is free text and has drifted: ~19
 * distinct values (court_decision, report, royal_commission, ngo_report,
 * statistical_report, legislative_reform, ...), a pile of singletons, 38 nulls,
 * and some rows mis-typed (an NGO position paper stored as court_decision). The
 * UI must not let a report masquerade as litigation.
 *
 * This is the single rollup both the classify backfill and the explore overlay
 * use, so "what kind is this row" is decided in exactly one place. Four kinds:
 *   decision     a court / tribunal / coronial ruling (carries outcome + precedent)
 *   report       reports, statistics, evaluations, annual reports, position papers
 *   inquiry      royal commissions, inquiries, investigations, rapporteur visits
 *   legislation  acts, bills, age-of-responsibility reforms
 *
 * classifyCase() is intentionally text-signal-first so it CORRECTS a wrong stored
 * type (the citation says "Position Paper" -> report, regardless of a stored
 * court_decision), and falls back to the stored type, then to court jurisdiction.
 */

export type CaseKind = 'decision' | 'report' | 'inquiry' | 'legislation';

// Stored raw case_type -> kind. Anything not here falls through to text/jurisdiction.
const RAW_TO_KIND: Record<string, CaseKind> = {
  court_decision: 'decision',
  inquest: 'decision',
  report: 'report',
  statistical_report: 'report',
  statistics: 'report',
  ngo_report: 'report',
  inspection_report: 'report',
  government_review: 'report',
  national_agreement: 'report',
  inquiry: 'inquiry',
  commission_of_inquiry: 'inquiry',
  royal_commission: 'inquiry',
  senate_inquiry: 'inquiry',
  law_reform_inquiry: 'inquiry',
  national_inquiry: 'inquiry',
  human_rights_investigation: 'inquiry',
  investigation: 'inquiry',
  legislation: 'legislation',
  legislative_reform: 'legislation',
};

// A canonical stored value per kind, used when the backfill writes a type back.
export const CANONICAL_TYPE: Record<CaseKind, string> = {
  decision: 'court_decision',
  report: 'report',
  inquiry: 'inquiry',
  legislation: 'legislation',
};

// Strong title/citation signals. Order matters: most specific first. These
// OVERRIDE a stored type so a mislabelled row displays correctly.
function kindFromText(citation: string): CaseKind | null {
  const t = ` ${citation.toLowerCase()} `;
  // Decision FIRST — a party-v-party / judicial-review / inquest citation is the
  // strongest signal and must beat an incidental "review"/"act" word elsewhere in
  // the title (e.g. "...v Secretary (Administrative Review Gateways)" is a case).
  if (/\bv\.?\s/.test(t) || /\br \(on the application of/.test(t) || /\binquest\b|coronial/.test(t))
    return 'decision';
  // Inquiry — commissions, inquiries, oversight visits, law-reform bodies.
  if (/royal commission|commission of inquiry|\binquiry\b|senate (inquiry|committee|standing)|special rapporteur|rapporteur|\bvisit to\b|law reform|board of inquiry|\binvestigation\b/.test(t))
    return 'inquiry';
  // Report — a study / evaluation / paper. "review"/"evaluation" here beats a
  // stray "Act" mention, so "...Act 2016 Review" is a report, not legislation.
  if (/position paper|annual report|\bevaluation\b|\breview\b|out-of-home care|closing the gap|\bdashboard\b|\bframework\b|\bstatistics\b|\bdata\b|\breport\b/.test(t))
    return 'report';
  // Legislation — the instrument itself or an age-of-responsibility reform.
  if (/\bbill\b|\bact\b|minimum age|raises? the age|lowers? the age|age of criminal responsibility|\blegislative\b/.test(t))
    return 'legislation';
  return null;
}

// Court / tribunal jurisdictions strongly imply a decision when nothing else fires.
function isCourtJurisdiction(jurisdiction: string): boolean {
  return /court of human rights|cjeu|european union|court of justice|circuit|high court|supreme court|federal court|court of appeal|house of lords|hudoc|tribunal|magistrat|district court/i.test(
    jurisdiction || '',
  );
}

/**
 * Decide the kind of a case row. Pure + deterministic.
 * Precedence: strong title signal > stored raw type > court jurisdiction > report.
 */
export function classifyCase(
  citation: string | null | undefined,
  rawType: string | null | undefined,
  jurisdiction: string | null | undefined,
): CaseKind {
  const fromText = kindFromText(citation || '');
  if (fromText) return fromText;
  const fromRaw = rawType ? RAW_TO_KIND[rawType] ?? null : null;
  if (fromRaw) return fromRaw;
  if (isCourtJurisdiction(jurisdiction || '')) return 'decision';
  // Unknown and no court signal: treat as a record/report, never assert litigation.
  return 'report';
}

// The kind a STORED raw value rolls up to (ignoring title signals). Lets the
// backfill distinguish "fill a null" from "the citation contradicts the stored
// type" (classifyCase != rawKind means a title signal overrode it).
export function rawKind(rawType: string | null | undefined): CaseKind | null {
  return rawType ? RAW_TO_KIND[rawType] ?? null : null;
}

const KIND_LABEL: Record<CaseKind, string> = {
  decision: 'Decision',
  report: 'Report',
  inquiry: 'Inquiry',
  legislation: 'Legislation',
};

export function caseKindLabel(kind: CaseKind): string {
  return KIND_LABEL[kind];
}
