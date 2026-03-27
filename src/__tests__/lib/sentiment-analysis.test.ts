/**
 * Tests for Sentiment Analysis schema and analysis logic
 *
 * TDD Phase 1: These tests define expected behavior for:
 * 1. SentimentAnalysisSchema validation (accept/reject)
 * 2. analyzeSentiment function (prompt construction, LLM call, Zod validation)
 * 3. processSentimentBatch function (batch processing, error handling, stats)
 */

import {
  SentimentAnalysisSchema,
  validateLLMOutput,
} from '@/lib/ai/llm-schemas';

// ---------------------------------------------------------------------------
// Schema validation tests
// ---------------------------------------------------------------------------

describe('SentimentAnalysisSchema', () => {
  const validSentiment = {
    sentiment: 'fear_narrative',
    sentiment_score: -0.7,
    framing: {
      punitive_language: true,
      community_voice: false,
      evidence_cited: false,
      political_framing: true,
    },
    organizations_mentioned: ['Queensland Police Service'],
    programs_mentioned: [],
    key_claims: [
      {
        claim: 'Youth crime has increased 30% in the past year',
        type: 'statistic',
        verifiable: true,
      },
    ],
  };

  it('accepts a valid fear_narrative analysis', () => {
    const result = SentimentAnalysisSchema.safeParse(validSentiment);
    expect(result.success).toBe(true);
  });

  it('accepts a valid solutions_focused analysis', () => {
    const result = SentimentAnalysisSchema.safeParse({
      sentiment: 'solutions_focused',
      sentiment_score: 0.8,
      framing: {
        punitive_language: false,
        community_voice: true,
        evidence_cited: true,
        political_framing: false,
      },
      organizations_mentioned: ['Just Reinvest NSW', 'Maranguka'],
      programs_mentioned: ['Justice Reinvestment'],
      key_claims: [
        {
          claim: 'The program reduced recidivism by 18% over two years',
          type: 'statistic',
          verifiable: true,
        },
        {
          claim: 'Elder Mary said the program saved her grandchildren',
          type: 'anecdote',
          verifiable: false,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts neutral and mixed sentiment types', () => {
    for (const sentiment of ['neutral', 'mixed'] as const) {
      const result = SentimentAnalysisSchema.safeParse({
        ...validSentiment,
        sentiment,
        sentiment_score: 0,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid sentiment type', () => {
    const result = SentimentAnalysisSchema.safeParse({
      ...validSentiment,
      sentiment: 'angry',
    });
    expect(result.success).toBe(false);
  });

  it('rejects sentiment_score below -1', () => {
    const result = SentimentAnalysisSchema.safeParse({
      ...validSentiment,
      sentiment_score: -1.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects sentiment_score above 1', () => {
    const result = SentimentAnalysisSchema.safeParse({
      ...validSentiment,
      sentiment_score: 1.1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts boundary scores -1 and 1', () => {
    for (const score of [-1, 1]) {
      const result = SentimentAnalysisSchema.safeParse({
        ...validSentiment,
        sentiment_score: score,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects missing framing fields', () => {
    const result = SentimentAnalysisSchema.safeParse({
      ...validSentiment,
      framing: { punitive_language: true },
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid claim type', () => {
    const result = SentimentAnalysisSchema.safeParse({
      ...validSentiment,
      key_claims: [
        { claim: 'Some claim about youth crime', type: 'rumor', verifiable: false },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects claim text shorter than 5 chars', () => {
    const result = SentimentAnalysisSchema.safeParse({
      ...validSentiment,
      key_claims: [
        { claim: 'Hi', type: 'statistic', verifiable: true },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('defaults empty arrays for organizations and programs', () => {
    const result = SentimentAnalysisSchema.safeParse({
      sentiment: 'neutral',
      sentiment_score: 0,
      framing: {
        punitive_language: false,
        community_voice: false,
        evidence_cited: false,
        political_framing: false,
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.organizations_mentioned).toEqual([]);
      expect(result.data.programs_mentioned).toEqual([]);
      expect(result.data.key_claims).toEqual([]);
    }
  });

  it('works with validateLLMOutput helper', () => {
    const valid = validateLLMOutput(validSentiment, SentimentAnalysisSchema);
    expect(valid.success).toBe(true);

    const invalid = validateLLMOutput(
      { sentiment: 'bad', sentiment_score: 99 },
      SentimentAnalysisSchema
    );
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.errors.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Sentiment analysis function tests (unit tests with mocks)
// ---------------------------------------------------------------------------

// We test the core logic by importing and mocking dependencies
jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: jest.fn(),
}));

jest.mock('@/lib/ai/model-router', () => ({
  LLMClient: {
    getBackgroundInstance: jest.fn(() => ({
      call: jest.fn(),
    })),
  },
}));

import { buildSentimentPrompt, processSentimentBatch } from '@/lib/cron/sentiment-analysis';
import { LLMClient } from '@/lib/ai/model-router';

describe('buildSentimentPrompt', () => {
  it('includes headline, source, and content in the prompt', () => {
    const prompt = buildSentimentPrompt({
      headline: 'Youth crime wave hits Brisbane',
      source: 'Courier Mail',
      content: 'Police say youth crime is out of control...',
    });
    expect(prompt).toContain('Youth crime wave hits Brisbane');
    expect(prompt).toContain('Courier Mail');
    expect(prompt).toContain('Police say youth crime is out of control');
  });

  it('handles missing content gracefully', () => {
    const prompt = buildSentimentPrompt({
      headline: 'Test headline for article',
      source: 'ABC News',
      content: null,
    });
    expect(prompt).toContain('Test headline for article');
    expect(prompt).toContain('ABC News');
    // Should not crash on null content
    expect(typeof prompt).toBe('string');
  });

  it('truncates very long content', () => {
    const longContent = 'x'.repeat(10000);
    const prompt = buildSentimentPrompt({
      headline: 'Test Headline',
      source: 'Test Source',
      content: longContent,
    });
    // Prompt should be reasonable length (not 10k chars of content)
    expect(prompt.length).toBeLessThan(6000);
  });
});

describe('processSentimentBatch', () => {
  const mockArticles = [
    {
      id: 'art-1',
      headline: 'Youth crime surge in Queensland',
      source: 'Courier Mail',
      content: 'Police are struggling with rising youth crime...',
      state: 'QLD',
      source_url: 'https://example.com/1',
    },
    {
      id: 'art-2',
      headline: 'New diversion program shows promise',
      source: 'ABC News',
      content: 'A community-led program in Bourke has reduced reoffending...',
      state: 'NSW',
      source_url: 'https://example.com/2',
    },
  ];

  const mockLLMResponse = JSON.stringify({
    sentiment: 'fear_narrative',
    sentiment_score: -0.6,
    framing: {
      punitive_language: true,
      community_voice: false,
      evidence_cited: false,
      political_framing: true,
    },
    organizations_mentioned: ['Queensland Police Service'],
    programs_mentioned: [],
    key_claims: [
      {
        claim: 'Youth crime has surged 25% in the past year',
        type: 'statistic',
        verifiable: true,
      },
    ],
  });

  let mockSupabase: any;
  let mockLLM: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };
    // Default: return articles on first call, then succeed on updates
    mockSupabase.limit.mockResolvedValueOnce({ data: mockArticles, error: null });
    mockSupabase.eq.mockResolvedValue({ error: null });
    mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

    mockLLM = {
      call: jest.fn().mockResolvedValue(mockLLMResponse),
    };
  });

  it('returns stats with sentiment breakdown', async () => {
    const result = await processSentimentBatch(mockSupabase, mockLLM, 20);
    expect(result).toHaveProperty('analyzed');
    expect(result).toHaveProperty('fear_narrative');
    expect(result).toHaveProperty('solutions_focused');
    expect(result).toHaveProperty('mixed');
    expect(result).toHaveProperty('neutral');
    expect(result).toHaveProperty('avg_score');
    expect(result.analyzed).toBe(2);
  });

  it('calls LLM once per article', async () => {
    await processSentimentBatch(mockSupabase, mockLLM, 20);
    expect(mockLLM.call).toHaveBeenCalledTimes(2);
  });

  it('returns zero stats when no articles need analysis', async () => {
    // Override the limit mock to return empty
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    const result = await processSentimentBatch(mockSupabase, mockLLM, 20);
    expect(result.analyzed).toBe(0);
    expect(result.avg_score).toBe(0);
  });

  it('skips articles with no headline and continues', async () => {
    const articlesWithBadOne = [
      { id: 'bad-1', headline: null, source: null, content: null, state: 'QLD', source_url: null },
      ...mockArticles,
    ];
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValueOnce({ data: articlesWithBadOne, error: null }),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
      ilike: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    };
    const result = await processSentimentBatch(mockSupabase, mockLLM, 20);
    expect(result.skipped).toBe(1);
    expect(result.analyzed).toBe(2);
  });

  it('does not crash when LLM returns invalid JSON for one article', async () => {
    mockLLM.call = jest.fn()
      .mockResolvedValueOnce('not valid json at all')
      .mockResolvedValueOnce(mockLLMResponse);

    const result = await processSentimentBatch(mockSupabase, mockLLM, 20);
    // Should still process the second article
    expect(result.analyzed).toBe(1);
    expect(result.errors).toBe(1);
  });

  it('does not crash when LLM returns schema-invalid data', async () => {
    const badSchema = JSON.stringify({
      sentiment: 'angry', // invalid enum
      sentiment_score: 99, // out of range
    });
    mockLLM.call = jest.fn()
      .mockResolvedValueOnce(badSchema)
      .mockResolvedValueOnce(mockLLMResponse);

    const result = await processSentimentBatch(mockSupabase, mockLLM, 20);
    expect(result.analyzed).toBe(1);
    expect(result.errors).toBe(1);
  });

  it('computes state_breakdown from analyzed articles', async () => {
    const solutionsResponse = JSON.stringify({
      sentiment: 'solutions_focused',
      sentiment_score: 0.7,
      framing: {
        punitive_language: false,
        community_voice: true,
        evidence_cited: true,
        political_framing: false,
      },
      organizations_mentioned: [],
      programs_mentioned: ['Justice Reinvestment'],
      key_claims: [],
    });
    mockLLM.call = jest.fn()
      .mockResolvedValueOnce(mockLLMResponse) // QLD, -0.6
      .mockResolvedValueOnce(solutionsResponse); // NSW, 0.7

    const result = await processSentimentBatch(mockSupabase, mockLLM, 20);
    expect(result.state_breakdown).toBeDefined();
    expect(result.state_breakdown['QLD']).toBeCloseTo(-0.6, 1);
    expect(result.state_breakdown['NSW']).toBeCloseTo(0.7, 1);
  });
});
