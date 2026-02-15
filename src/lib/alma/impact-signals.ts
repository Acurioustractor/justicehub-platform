/**
 * ALMA Impact Signals
 *
 * ALMA SACRED BOUNDARIES:
 * - Uses SIGNALS (direction indicators), not SCORES (rankings)
 * - Never profiles individual youth
 * - Community Authority weighted highest
 *
 * This module converts legacy numeric scores to categorical impact levels
 * for display purposes, following ALMA's signals-based approach.
 */

export type ImpactLevel = 'high' | 'growing' | 'emerging';

export interface ImpactSignal {
  level: ImpactLevel;
  label: string;
  description: string;
  color: string;
}

/**
 * Convert a numeric score (0-10) to a categorical impact level
 * This preserves backward compatibility while moving to signals-based display
 */
export function getImpactLevel(score: number | undefined): ImpactLevel {
  if (score === undefined || score === null) return 'emerging';
  if (score >= 8) return 'high';
  if (score >= 5) return 'growing';
  return 'emerging';
}

/**
 * Get the display information for an impact level
 * Uses growth-framing language instead of competitive rankings
 */
export function getImpactSignal(level: ImpactLevel): ImpactSignal {
  switch (level) {
    case 'high':
      return {
        level: 'high',
        label: 'High Impact',
        description: 'This story is creating meaningful change',
        color: 'text-green-600 bg-green-50 border-green-200',
      };
    case 'growing':
      return {
        level: 'growing',
        label: 'Growing Impact',
        description: 'This story is building momentum',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
      };
    case 'emerging':
      return {
        level: 'emerging',
        label: 'Emerging Impact',
        description: 'This story is beginning its journey',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
      };
  }
}

/**
 * Convert legacy numeric score to signal for display
 * Provides both the level and full signal info
 */
export function scoreToSignal(score: number | undefined): ImpactSignal {
  const level = getImpactLevel(score);
  return getImpactSignal(level);
}

/**
 * ImpactIndicator component props
 */
export interface ImpactIndicatorProps {
  /** Legacy numeric score (0-10) - will be converted to signal */
  score?: number;
  /** Direct impact level - preferred over score */
  level?: ImpactLevel;
  /** Show description tooltip */
  showDescription?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}
