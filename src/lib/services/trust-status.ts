export type ServiceTrustTone = 'review' | 'source' | 'fresh' | 'strong' | 'community';

export interface ServiceTrustInput {
  verified?: boolean | null;
  verificationStatus?: string | null;
  source?: string | null;
  lastVerifiedAt?: string | null;
  lastUpdated?: string | null;
  cost?: string | null;
  location?: string | null;
}

export interface ServiceTrustStatus {
  label: string;
  shortLabel: string;
  description: string;
  tone: ServiceTrustTone;
}

const FRESH_SOURCE_DAYS = 90;

function normalizedStatus(status?: string | null): string {
  return (status || '').trim().toLowerCase();
}

export function isHumanVerifiedStatus(status?: string | null, verified?: boolean | null): boolean {
  const normalized = normalizedStatus(status);
  return Boolean(verified) || normalized === 'verified' || normalized === 'human_verified';
}

export function isCommunityVerifiedStatus(status?: string | null): boolean {
  return normalizedStatus(status) === 'community_verified';
}

export function isFreshSourceChecked(lastVerifiedAt?: string | null, now = Date.now()): boolean {
  if (!lastVerifiedAt) return false;
  const checkedAt = new Date(lastVerifiedAt).getTime();
  if (!Number.isFinite(checkedAt)) return false;
  const diffDays = (now - checkedAt) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= FRESH_SOURCE_DAYS;
}

export function getServiceTrustStatus(input: ServiceTrustInput): ServiceTrustStatus {
  if (isHumanVerifiedStatus(input.verificationStatus, input.verified)) {
    return {
      label: 'Human verified',
      shortLabel: 'Human verified',
      description: 'A reviewer has confirmed the record. Still check availability before referring.',
      tone: 'strong',
    };
  }

  if (isCommunityVerifiedStatus(input.verificationStatus)) {
    return {
      label: 'Community verified',
      shortLabel: 'Community verified',
      description: 'A community or sector reviewer has confirmed the record.',
      tone: 'community',
    };
  }

  if (input.source && isFreshSourceChecked(input.lastVerifiedAt)) {
    return {
      label: 'Fresh source check',
      shortLabel: 'Fresh source',
      description: 'A public source is linked and was recently checked.',
      tone: 'fresh',
    };
  }

  if (input.source) {
    return {
      label: 'Source linked, freshness pending',
      shortLabel: 'Source linked',
      description: 'A public source exists. Open it before relying on this record.',
      tone: 'source',
    };
  }

  return {
    label: 'Catalogue lead, source needed',
    shortLabel: 'Catalogue lead',
    description: 'Useful as a lead, not a referral. Confirm details before sharing.',
    tone: 'review',
  };
}

export function serviceTrustScore(input: ServiceTrustInput): number {
  let score = 0;
  if (isHumanVerifiedStatus(input.verificationStatus, input.verified)) score += 100;
  else if (isCommunityVerifiedStatus(input.verificationStatus)) score += 90;
  else if (input.source && isFreshSourceChecked(input.lastVerifiedAt)) score += 70;
  else if (input.source) score += 45;
  else score += 5;

  if (input.location && !input.location.toLowerCase().includes('unknown')) score += 6;
  if (input.cost && input.cost !== 'unknown') score += 4;
  if (input.lastUpdated) score += 2;

  return score;
}
