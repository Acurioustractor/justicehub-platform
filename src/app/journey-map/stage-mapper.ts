/**
 * Journey Map Stage Mapper
 *
 * Maps programs, funding, contracts, and commitments to journey stages
 * using keyword matching. Extracted for testability.
 */

export type StageKey =
  | 'child_protection'
  | 'education'
  | 'first_contact'
  | 'bail_courts'
  | 'detention'
  | 'post_detention'
  | 'employment_healing';

export type Stage = {
  key: StageKey;
  number: number;
  title: string;
  description: string;
};

export const STAGES: Stage[] = [
  {
    key: 'child_protection',
    number: 1,
    title: 'Child Protection',
    description: 'Early life, family circumstances, out-of-home care, and the systems that shape a young person before they ever encounter the justice system.',
  },
  {
    key: 'education',
    number: 2,
    title: 'Education',
    description: 'School attendance, exclusion, disengagement, and the programs trying to keep young people connected to learning.',
  },
  {
    key: 'first_contact',
    number: 3,
    title: 'First Contact',
    description: 'Police encounters, cautions, diversionary programs, and community-based early interventions.',
  },
  {
    key: 'bail_courts',
    number: 4,
    title: 'Bail & Courts',
    description: 'Bail support, legal aid, court processes, community justice groups, and sentencing.',
  },
  {
    key: 'detention',
    number: 5,
    title: 'Detention',
    description: 'Youth detention centres, watch houses, and the experience of custody in North Queensland.',
  },
  {
    key: 'post_detention',
    number: 6,
    title: 'Post-Detention',
    description: 'Reintegration support, transition services, supervision, and the challenge of returning to community.',
  },
  {
    key: 'employment_healing',
    number: 7,
    title: 'Employment & Healing',
    description: 'Jobs, cultural programs, elder mentoring, and pathways to long-term wellbeing and community return.',
  },
];

export const STAGE_KEYWORDS: Record<StageKey, string[]> = {
  child_protection: [
    'child protection', 'child safety', 'out of home care', 'foster',
    'kinship', 'family support', 'placement', 'family services',
    'child and family', 'family intervention',
  ],
  education: [
    'education', 'school', 'attendance', 'training', 'learning',
    'literacy', 'flexi school', 'alternative education',
  ],
  first_contact: [
    'diversion', 'caution', 'early intervention', 'prevention',
    'police', 'first contact', 'community program', 'restorative',
    'youth program', 'community safety',
  ],
  bail_courts: [
    'bail', 'court', 'legal', 'sentencing', 'justice group',
    'legal aid', 'magistrate', 'youth justice conferencing',
  ],
  detention: [
    'detention', 'watch house', 'corrective', 'custody', 'secure',
    'cleveland', 'remand',
  ],
  post_detention: [
    'reintegration', 'transition', 'aftercare', 'post-release',
    'supervision', 'parole', 'probation', 'community service order',
  ],
  employment_healing: [
    'employment', 'job', 'healing', 'cultural', 'wellbeing',
    'naidoc', 'country', 'elder', 'mentor', 'social enterprise',
    'traineeship', 'apprentice',
  ],
};

/**
 * Classify a text string to the most relevant journey stage.
 * Returns the first matching stage key, or null if no match.
 */
export function classifyToStage(text: string): StageKey | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  for (const [stageKey, keywords] of Object.entries(STAGE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return stageKey as StageKey;
      }
    }
  }

  return null;
}

/**
 * Classify an array of items into stage buckets using a text extractor function.
 */
export function classifyItemsToStages<T>(
  items: T[],
  textExtractor: (item: T) => string
): Record<StageKey, T[]> {
  const result: Record<StageKey, T[]> = {
    child_protection: [],
    education: [],
    first_contact: [],
    bail_courts: [],
    detention: [],
    post_detention: [],
    employment_healing: [],
  };

  for (const item of items) {
    const text = textExtractor(item);
    const stage = classifyToStage(text);
    if (stage) {
      result[stage].push(item);
    }
  }

  return result;
}

/**
 * Format a dollar amount for display.
 */
export function formatCurrency(amount: number): string {
  if (!amount) return '$0';
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${Math.round(amount / 1_000)}K`;
  }
  return `$${Math.round(amount)}`;
}
