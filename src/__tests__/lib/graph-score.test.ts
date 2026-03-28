/**
 * Tests for Graph Score computation
 *
 * TDD Phase 1: Define expected behavior for:
 * 1. computeGraphScore — pure scoring function
 * 2. runGraphScoring — batch processing with DB queries
 */

import {
  computeGraphScore,
  type OrgGraphData,
} from '@/lib/cron/graph-score';

// ---------------------------------------------------------------------------
// computeGraphScore — pure function tests
// ---------------------------------------------------------------------------

describe('computeGraphScore', () => {
  it('returns 0 for org with nothing', () => {
    const data: OrgGraphData = {
      has_abn: false,
      funding_count: 0,
      program_count: 0,
      evidence_count: 0,
      media_count: 0,
      story_count: 0,
      has_cost_data: false,
    };
    expect(computeGraphScore(data)).toBe(0);
  });

  it('returns 10 for org with just ABN', () => {
    const data: OrgGraphData = {
      has_abn: true,
      funding_count: 0,
      program_count: 0,
      evidence_count: 0,
      media_count: 0,
      story_count: 0,
      has_cost_data: false,
    };
    expect(computeGraphScore(data)).toBe(10);
  });

  it('returns 100 for fully connected org', () => {
    const data: OrgGraphData = {
      has_abn: true,
      funding_count: 5,
      program_count: 3,
      evidence_count: 2,
      media_count: 1,
      story_count: 1,
      has_cost_data: true,
    };
    expect(computeGraphScore(data)).toBe(100);
  });

  it('returns 55 for org with ABN + funding + programs', () => {
    const data: OrgGraphData = {
      has_abn: true,
      funding_count: 2,
      program_count: 1,
      evidence_count: 0,
      media_count: 0,
      story_count: 0,
      has_cost_data: false,
    };
    expect(computeGraphScore(data)).toBe(55);
  });

  it('returns 30 for org with funding + ABN but no programs', () => {
    const data: OrgGraphData = {
      has_abn: true,
      funding_count: 3,
      program_count: 0,
      evidence_count: 0,
      media_count: 0,
      story_count: 0,
      has_cost_data: false,
    };
    expect(computeGraphScore(data)).toBe(30);
  });

  it('returns 45 for org with programs + evidence (no ABN)', () => {
    const data: OrgGraphData = {
      has_abn: false,
      funding_count: 0,
      program_count: 2,
      evidence_count: 4,
      media_count: 0,
      story_count: 0,
      has_cost_data: false,
    };
    expect(computeGraphScore(data)).toBe(45);
  });

  it('counts > 0 treated as boolean true', () => {
    // 1 funding record = same score as 100 funding records
    const oneRecord: OrgGraphData = {
      has_abn: false,
      funding_count: 1,
      program_count: 0,
      evidence_count: 0,
      media_count: 0,
      story_count: 0,
      has_cost_data: false,
    };
    const manyRecords: OrgGraphData = {
      has_abn: false,
      funding_count: 100,
      program_count: 0,
      evidence_count: 0,
      media_count: 0,
      story_count: 0,
      has_cost_data: false,
    };
    expect(computeGraphScore(oneRecord)).toBe(computeGraphScore(manyRecords));
  });

  it('score is always between 0 and 100', () => {
    // Even with extreme values
    const extreme: OrgGraphData = {
      has_abn: true,
      funding_count: 99999,
      program_count: 99999,
      evidence_count: 99999,
      media_count: 99999,
      story_count: 99999,
      has_cost_data: true,
    };
    const score = computeGraphScore(extreme);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// runGraphScoring — integration-style tests with mocked Supabase
// ---------------------------------------------------------------------------

jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: jest.fn(),
}));

import { createServiceClient } from '@/lib/supabase/service';
import { runGraphScoring } from '@/lib/cron/graph-score';

describe('runGraphScoring', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Build a chainable mock
    const chainable = () => {
      const chain: any = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.neq = jest.fn().mockReturnValue(chain);
      chain.gt = jest.fn().mockReturnValue(chain);
      chain.not = jest.fn().mockReturnValue(chain);
      chain.is = jest.fn().mockReturnValue(chain);
      chain.in = jest.fn().mockReturnValue(chain);
      chain.order = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockReturnValue(chain);
      chain.range = jest.fn().mockReturnValue(chain);
      chain.update = jest.fn().mockReturnValue(chain);
      // Default resolves
      chain.then = undefined; // not a thenable by default
      return chain;
    };

    const fromChains: Record<string, any> = {};
    mockSupabase = {
      from: jest.fn((table: string) => {
        if (!fromChains[table]) {
          fromChains[table] = chainable();
        }
        return fromChains[table];
      }),
      _chains: fromChains,
    };

    (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('returns stats object with expected shape', async () => {
    // Setup: orgs query returns 2 orgs
    const orgsChain = mockSupabase.from('organizations');
    orgsChain.select.mockReturnValue(orgsChain);
    orgsChain.not.mockReturnValue(orgsChain);
    orgsChain.range.mockResolvedValue({
      data: [
        { id: 'org-1', abn: '12345678901' },
        { id: 'org-2', abn: null },
      ],
      error: null,
    });

    // Counts: all return 0
    const fundingChain = mockSupabase.from('justice_funding');
    fundingChain.select.mockReturnValue(fundingChain);
    fundingChain.in.mockResolvedValue({ data: [], error: null });

    const programsChain = mockSupabase.from('alma_interventions');
    programsChain.select.mockReturnValue(programsChain);
    programsChain.neq.mockReturnValue(programsChain);
    programsChain.in.mockResolvedValue({ data: [], error: null });

    const evidenceChain = mockSupabase.from('alma_evidence');
    evidenceChain.select.mockReturnValue(evidenceChain);
    evidenceChain.in.mockResolvedValue({ data: [], error: null });

    const mediaChain = mockSupabase.from('alma_media_articles');
    mediaChain.select.mockReturnValue(mediaChain);
    mediaChain.in.mockResolvedValue({ data: [], error: null });

    const storiesChain = mockSupabase.from('alma_stories');
    storiesChain.select.mockReturnValue(storiesChain);
    storiesChain.in.mockResolvedValue({ data: [], error: null });

    const costChain = mockSupabase.from('alma_interventions');
    // Already set above — will be reused

    // Update chain
    const updateOrgsChain = mockSupabase.from('organizations');
    updateOrgsChain.update.mockReturnValue(updateOrgsChain);
    updateOrgsChain.eq.mockResolvedValue({ error: null });

    const result = await runGraphScoring();
    expect(result).toHaveProperty('orgs_scored');
    expect(result).toHaveProperty('avg_score');
    expect(result).toHaveProperty('max_score');
    expect(result).toHaveProperty('min_score');
  });
});
