export type DirectoryQualityDimension =
  | 'identity'
  | 'source'
  | 'freshness'
  | 'evidence'
  | 'locality'
  | 'review';

export type DirectoryQualityGrade =
  | 'publish_ready'
  | 'strong'
  | 'usable_with_caveats'
  | 'needs_enrichment'
  | 'high_review';

export type DirectoryQualityResult = {
  score: number;
  grade: DirectoryQualityGrade;
  label: string;
  completed: DirectoryQualityDimension[];
  missing: DirectoryQualityDimension[];
  risks: string[];
  nextAction: string;
};

type OrgQualityInput = {
  abn?: string | null;
  gs_entity_id?: string | null;
  verification_status?: string | null;
  website?: string | null;
  website_url?: string | null;
  city?: string | null;
  state?: string | null;
  location?: string | null;
  postcode?: string | null;
  updated_at?: string | null;
  has_valid_gs_link?: boolean | null;
  has_source_linked_service?: boolean | null;
  has_intervention?: boolean | null;
  has_funding?: boolean | null;
};

type ServiceQualityInput = {
  organization_id?: string | null;
  data_source_url?: string | null;
  verification_status?: string | null;
  category?: string | null;
  location_state?: string | null;
  state?: string | null;
  suburb?: string | null;
  cost?: string | null;
  last_verified_at?: string | null;
  updated_at?: string | null;
};

const HUMAN_REVIEW_STATUSES = new Set([
  'verified',
  'human_verified',
  'human verified',
  'community_verified',
  'community verified',
  'approved',
]);

function clean(value?: string | null) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isFresh(value?: string | null, maxAgeDays = 90) {
  const date = clean(value);
  if (!date) return false;
  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) return false;
  return Date.now() - timestamp <= maxAgeDays * 24 * 60 * 60 * 1000;
}

function hasHumanReview(status?: string | null) {
  const normalized = clean(status)?.toLowerCase().replace(/[-_]+/g, ' ');
  return normalized ? HUMAN_REVIEW_STATUSES.has(normalized) : false;
}

function gradeQuality(score: number): Pick<DirectoryQualityResult, 'grade' | 'label'> {
  if (score >= 85) return { grade: 'publish_ready', label: 'Publish-ready' };
  if (score >= 70) return { grade: 'strong', label: 'Strong' };
  if (score >= 50) return { grade: 'usable_with_caveats', label: 'Usable with caveats' };
  if (score >= 30) return { grade: 'needs_enrichment', label: 'Needs enrichment' };
  return { grade: 'high_review', label: 'High review' };
}

function nextActionForMissing(missing: DirectoryQualityDimension[], risks: string[]) {
  if (risks.length) return risks[0];
  if (missing.includes('identity')) return 'Confirm identity link first';
  if (missing.includes('source')) return 'Add a public source URL';
  if (missing.includes('freshness')) return 'Refresh or re-check the source';
  if (missing.includes('evidence')) return 'Link evidence, programs, funding, or models';
  if (missing.includes('locality')) return 'Add place, state, or service-area data';
  if (missing.includes('review')) return 'Send to human/community review';
  return 'Ready for public use';
}

function buildResult(
  score: number,
  completed: DirectoryQualityDimension[],
  missing: DirectoryQualityDimension[],
  risks: string[],
): DirectoryQualityResult {
  const boundedScore = Math.max(0, Math.min(100, Math.round(score - risks.length * 8)));
  return {
    score: boundedScore,
    ...gradeQuality(boundedScore),
    completed,
    missing,
    risks,
    nextAction: nextActionForMissing(missing, risks),
  };
}

export function scoreOrganizationQuality(input: OrgQualityInput): DirectoryQualityResult {
  const completed: DirectoryQualityDimension[] = [];
  const missing: DirectoryQualityDimension[] = [];
  const risks: string[] = [];
  let score = 0;

  const hasAbn = Boolean(clean(input.abn));
  const hasCivicGraph = Boolean(clean(input.gs_entity_id));
  const hasValidCivicGraph = Boolean(input.has_valid_gs_link);
  const hasWebsite = Boolean(clean(input.website) || clean(input.website_url));
  const hasPlace = Boolean(clean(input.state) || clean(input.city) || clean(input.location) || clean(input.postcode));
  const hasEvidence = Boolean(input.has_source_linked_service || input.has_intervention || input.has_funding);

  if (hasAbn && hasValidCivicGraph) {
    completed.push('identity');
    score += 25;
  } else if (hasAbn || hasCivicGraph) {
    missing.push('identity');
    score += 12;
    if (hasCivicGraph && !hasValidCivicGraph) risks.push('Review CivicGraph identity before displaying strong trust badges');
  } else {
    missing.push('identity');
  }

  if (hasWebsite || input.has_source_linked_service) {
    completed.push('source');
    score += 15;
  } else {
    missing.push('source');
  }

  if (isFresh(input.updated_at)) {
    completed.push('freshness');
    score += 10;
  } else {
    missing.push('freshness');
  }

  if (hasEvidence) {
    completed.push('evidence');
    score += 20;
  } else {
    missing.push('evidence');
  }

  if (hasPlace) {
    completed.push('locality');
    score += 10;
  } else {
    missing.push('locality');
  }

  if (hasHumanReview(input.verification_status)) {
    completed.push('review');
    score += 20;
  } else {
    missing.push('review');
  }

  return buildResult(score, completed, missing, risks);
}

export function scoreServiceQuality(input: ServiceQualityInput): DirectoryQualityResult {
  const completed: DirectoryQualityDimension[] = [];
  const missing: DirectoryQualityDimension[] = [];
  const risks: string[] = [];
  let score = 0;

  if (clean(input.organization_id)) {
    completed.push('identity');
    score += 20;
  } else {
    missing.push('identity');
  }

  if (clean(input.data_source_url)) {
    completed.push('source');
    score += 25;
  } else {
    missing.push('source');
    risks.push('Do not treat as verified until a public source URL is attached');
  }

  if (isFresh(input.last_verified_at)) {
    completed.push('freshness');
    score += 15;
  } else {
    missing.push('freshness');
  }

  if (clean(input.category) || clean(input.cost)) {
    completed.push('evidence');
    score += 10;
  } else {
    missing.push('evidence');
  }

  if (clean(input.location_state) || clean(input.state) || clean(input.suburb)) {
    completed.push('locality');
    score += 10;
  } else {
    missing.push('locality');
  }

  if (hasHumanReview(input.verification_status)) {
    completed.push('review');
    score += 20;
  } else {
    missing.push('review');
  }

  return buildResult(score, completed, missing, risks);
}
