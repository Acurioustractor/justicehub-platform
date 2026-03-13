/**
 * Tests for LLM output Zod schemas
 *
 * Validates that the schemas correctly accept good data and reject bad data,
 * preventing malformed LLM responses from entering the database.
 */

import {
  OutcomeSchema,
  OutcomesExtractionResponseSchema,
  EvidenceItemSchema,
  EvidenceDiscoveryResponseSchema,
  InterventionClassificationSchema,
  validateLLMOutput,
} from '@/lib/ai/llm-schemas';

describe('OutcomeSchema', () => {
  it('accepts a valid outcome', () => {
    const result = OutcomeSchema.safeParse({
      name: 'Reduction in youth reoffending rates',
      outcome_type: 'Reduced recidivism',
      measurement: 'Pre/post recidivism data from justice system records over 12 months',
    });
    expect(result.success).toBe(true);
  });

  it('rejects generic placeholder names', () => {
    const placeholders = ['Unnamed outcome', 'Unknown', 'N/A', 'TBD', 'Outcome 1', 'General improvement'];
    for (const name of placeholders) {
      const result = OutcomeSchema.safeParse({
        name,
        outcome_type: 'Reduced recidivism',
        measurement: 'Some measurement method here',
      });
      expect(result.success).toBe(false);
    }
  });

  it('rejects names shorter than 5 characters', () => {
    const result = OutcomeSchema.safeParse({
      name: 'Hi',
      outcome_type: 'Reduced recidivism',
      measurement: 'Some measurement method',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid outcome_type', () => {
    const result = OutcomeSchema.safeParse({
      name: 'Reduction in youth reoffending rates',
      outcome_type: 'Made things better',
      measurement: 'Some measurement method',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null measurement', () => {
    const result = OutcomeSchema.safeParse({
      name: 'Improved school attendance rates',
      outcome_type: 'Educational engagement',
      measurement: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('OutcomesExtractionResponseSchema', () => {
  it('accepts a well-formed extraction response', () => {
    const result = OutcomesExtractionResponseSchema.safeParse({
      results: [
        {
          idx: 1,
          outcomes: [
            {
              name: 'Reduced youth detention rates',
              outcome_type: 'Reduced detention/incarceration',
              measurement: 'Comparison of detention rates before and after program',
            },
          ],
        },
        {
          idx: 2,
          outcomes: [],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects response without results array', () => {
    const result = OutcomesExtractionResponseSchema.safeParse({
      data: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative idx', () => {
    const result = OutcomesExtractionResponseSchema.safeParse({
      results: [{ idx: -1, outcomes: [] }],
    });
    expect(result.success).toBe(false);
  });
});

describe('EvidenceItemSchema', () => {
  it('accepts a valid evidence item', () => {
    const result = EvidenceItemSchema.safeParse({
      title: 'Evaluation of Youth Justice Programs in Queensland',
      evidence_type: 'Program evaluation',
      url: 'https://example.com/report.pdf',
      findings: 'The program showed a 30% reduction in recidivism over 2 years.',
      methodology: 'Quasi-experimental with matched controls',
      author: 'Queensland Government',
      year: 2023,
      relevance_score: 0.85,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL', () => {
    const result = EvidenceItemSchema.safeParse({
      title: 'Some Report',
      evidence_type: 'Case study',
      url: 'not-a-url',
      findings: 'Some findings about the program.',
      relevance_score: 0.5,
    });
    expect(result.success).toBe(false);
  });

  it('falls back to Case study for unknown evidence_type', () => {
    const result = EvidenceItemSchema.safeParse({
      title: 'Some Report Title Here',
      evidence_type: 'Blog post',
      url: 'https://example.com/blog',
      findings: 'Some findings about the program evaluation.',
      relevance_score: 0.5,
    });
    // .catch('Case study') means it should succeed with fallback
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.evidence_type).toBe('Case study');
    }
  });

  it('rejects relevance_score > 1', () => {
    const result = EvidenceItemSchema.safeParse({
      title: 'Some Report Title',
      evidence_type: 'Case study',
      url: 'https://example.com/report',
      findings: 'Some relevant findings here.',
      relevance_score: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects future years', () => {
    const result = EvidenceItemSchema.safeParse({
      title: 'Future Report Title',
      evidence_type: 'Case study',
      url: 'https://example.com/future',
      findings: 'Findings from the future program.',
      relevance_score: 0.5,
      year: 2099,
    });
    expect(result.success).toBe(false);
  });
});

describe('EvidenceDiscoveryResponseSchema', () => {
  it('accepts empty results', () => {
    const result = EvidenceDiscoveryResponseSchema.safeParse({ results: [] });
    expect(result.success).toBe(true);
  });
});

describe('InterventionClassificationSchema', () => {
  it('accepts a valid intervention', () => {
    const result = InterventionClassificationSchema.safeParse({
      name: 'Maranguka Justice Reinvestment',
      type: 'Justice reinvestment',
      description: 'A community-led justice reinvestment initiative in Bourke, NSW focusing on reducing incarceration.',
      operating_organization: 'Just Reinvest NSW',
      state: 'NSW',
      evidence_level: 'Strong',
      harm_risk_level: 'Low',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = InterventionClassificationSchema.safeParse({
      name: '',
      type: 'Program',
    });
    expect(result.success).toBe(false);
  });
});

describe('validateLLMOutput', () => {
  it('returns success with valid data', () => {
    const result = validateLLMOutput(
      { results: [] },
      OutcomesExtractionResponseSchema
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.results).toEqual([]);
    }
  });

  it('returns errors with invalid data', () => {
    const result = validateLLMOutput(
      { wrong_key: true },
      OutcomesExtractionResponseSchema
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
