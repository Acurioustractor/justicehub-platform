export interface MatchEvaluationInput {
  score: number;
  reasons: string[];
  hasEligibilityRisk: boolean;
  daysToDeadline: number | null;
}

export interface MatchEvaluationResult {
  confidence: number;
  needsHumanReview: boolean;
  notifyEligible: boolean;
}

export const MATCH_THRESHOLDS = {
  minScore: 35,
  minScoreForNotify: 60,
  minConfidenceForNotify: 0.68,
  maxUrgencyDays: 14,
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function evaluateGrantMatch(input: MatchEvaluationInput): MatchEvaluationResult {
  const reasonCoverage = clamp(input.reasons.length / 6);
  const scoreComponent = clamp(input.score / 100);
  const urgencyComponent =
    input.daysToDeadline === null
      ? 0.35
      : clamp(1 - input.daysToDeadline / 45);

  let confidence =
    scoreComponent * 0.55 +
    reasonCoverage * 0.25 +
    urgencyComponent * 0.2;

  if (input.hasEligibilityRisk) {
    confidence -= 0.2;
  }
  if (input.daysToDeadline !== null && input.daysToDeadline < 0) {
    confidence = 0;
  }

  confidence = clamp(confidence);

  const needsHumanReview =
    input.hasEligibilityRisk ||
    confidence < 0.55 ||
    input.score < MATCH_THRESHOLDS.minScore;

  const notifyEligible =
    input.score >= MATCH_THRESHOLDS.minScoreForNotify &&
    confidence >= MATCH_THRESHOLDS.minConfidenceForNotify &&
    !needsHumanReview &&
    (input.daysToDeadline === null || input.daysToDeadline <= 120);

  return {
    confidence,
    needsHumanReview,
    notifyEligible,
  };
}
