/**
 * Tests for CivicScope Bridge — pulls parliamentary data into ALMA evidence graph
 *
 * TDD Phase 1: These tests define expected behavior for:
 * 1. YOUTH_JUSTICE_KEYWORDS constant
 * 2. findYouthJusticeMentions() — keyword search in civic tables
 * 3. createResearchFindings() — dedup + insert into alma_research_findings
 * 4. linkToOrgsAndPrograms() — best-effort org/program matching
 * 5. runCivicScopeBridge() — full orchestration
 */

jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: jest.fn(),
}));

import {
  YOUTH_JUSTICE_KEYWORDS,
  findYouthJusticeMentions,
  createResearchFindings,
  linkToOrgsAndPrograms,
  runCivicScopeBridge,
  type CivicMention,
} from '@/lib/cron/civicscope-bridge';

// ---------------------------------------------------------------------------
// Keywords
// ---------------------------------------------------------------------------

describe('YOUTH_JUSTICE_KEYWORDS', () => {
  it('is a non-empty array of strings', () => {
    expect(Array.isArray(YOUTH_JUSTICE_KEYWORDS)).toBe(true);
    expect(YOUTH_JUSTICE_KEYWORDS.length).toBeGreaterThan(5);
    for (const kw of YOUTH_JUSTICE_KEYWORDS) {
      expect(typeof kw).toBe('string');
    }
  });

  it('includes key terms from the spec', () => {
    const required = ['youth justice', 'youth detention', 'raising the age', 'Don Dale', 'Banksia Hill'];
    for (const term of required) {
      expect(YOUTH_JUSTICE_KEYWORDS).toContain(term);
    }
  });
});

// ---------------------------------------------------------------------------
// findYouthJusticeMentions
// ---------------------------------------------------------------------------

describe('findYouthJusticeMentions', () => {
  function makeMockSupabase(statementsData: any[], hansardData: any[]) {
    const mock: any = {
      from: jest.fn((table: string) => {
        const isStatements = table === 'civic_ministerial_statements';
        const data = isStatements ? statementsData : hansardData;
        return {
          select: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data, error: null }),
              }),
            }),
            textSearch: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data, error: null }),
              }),
            }),
          }),
        };
      }),
    };
    return mock;
  }

  it('returns empty array when both tables are empty', async () => {
    const sb = makeMockSupabase([], []);
    const mentions = await findYouthJusticeMentions(sb);
    expect(mentions).toEqual([]);
  });

  it('returns mentions from ministerial statements', async () => {
    const statements = [
      {
        id: 'stmt-1',
        headline: 'New youth justice reforms announced',
        body_text: 'The government will invest in youth detention alternatives.',
        minister_name: 'Minister Smith',
        published_at: '2026-03-01',
        source_url: 'https://example.com/stmt-1',
      },
    ];
    const sb = makeMockSupabase(statements, []);
    const mentions = await findYouthJusticeMentions(sb);
    expect(mentions.length).toBeGreaterThanOrEqual(1);
    expect(mentions[0].source_table).toBe('civic_ministerial_statements');
    expect(mentions[0].source_id).toBe('stmt-1');
  });

  it('returns mentions from hansard', async () => {
    const hansard = [
      {
        id: 'hans-1',
        subject: 'Youth crime debate',
        body_text: 'Mr Speaker, youth detention numbers are rising.',
        speaker_name: 'Member Jones',
        sitting_date: '2026-02-15',
        source_url: 'https://example.com/hans-1',
      },
    ];
    const sb = makeMockSupabase([], hansard);
    const mentions = await findYouthJusticeMentions(sb);
    expect(mentions.length).toBeGreaterThanOrEqual(1);
    expect(mentions[0].source_table).toBe('civic_hansard');
  });

  it('handles query errors gracefully', async () => {
    const sb: any = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: null, error: { message: 'timeout' } }),
            }),
          }),
        }),
      })),
    };
    const mentions = await findYouthJusticeMentions(sb);
    expect(mentions).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// createResearchFindings
// ---------------------------------------------------------------------------

describe('createResearchFindings', () => {
  const sampleMentions: CivicMention[] = [
    {
      source_table: 'civic_ministerial_statements',
      source_id: 'stmt-1',
      title: 'Youth justice reforms announced',
      body_snippet: 'The government will invest in youth detention alternatives and raising the age of criminal responsibility.',
      speaker: 'Minister Smith',
      date: '2026-03-01',
      source_url: 'https://example.com/stmt-1',
    },
    {
      source_table: 'civic_hansard',
      source_id: 'hans-1',
      title: 'Youth crime debate',
      body_snippet: 'Member for Cairns spoke about youth diversion programs and bail support.',
      speaker: 'Member Jones',
      date: '2026-02-15',
      source_url: 'https://example.com/hans-1',
    },
  ];

  function makeMockSupabase(existingValidationSources: string[] = []) {
    const mock: any = {
      from: jest.fn(() => {
        const chainObj: any = {};
        chainObj.select = jest.fn().mockReturnValue({
          eq: jest.fn().mockImplementation((_col: string, val: string) => {
            const exists = existingValidationSources.includes(val);
            return Promise.resolve({ count: exists ? 1 : 0, error: null });
          }),
        });
        chainObj.insert = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'new-' + Math.random() }, error: null }),
          }),
        });
        return chainObj;
      }),
    };
    return mock;
  }

  it('creates findings for new mentions', async () => {
    const sb = makeMockSupabase([]);
    const result = await createResearchFindings(sb, sampleMentions);
    expect(result.inserted).toBe(2);
    expect(result.duplicates).toBe(0);
  });

  it('skips duplicates based on validation_source', async () => {
    const sb = makeMockSupabase(['civicscope:civic_ministerial_statements:stmt-1']);
    const result = await createResearchFindings(sb, sampleMentions);
    expect(result.inserted).toBe(1);
    expect(result.duplicates).toBe(1);
  });

  it('handles empty mentions array', async () => {
    const sb = makeMockSupabase([]);
    const result = await createResearchFindings(sb, []);
    expect(result.inserted).toBe(0);
    expect(result.duplicates).toBe(0);
  });

  it('sets finding_type to parliamentary', async () => {
    let insertedData: any = null;
    const sb: any = {
      from: jest.fn(() => {
        const chainObj: any = {};
        // For dedup check: .select().eq() -> { count }
        chainObj.select = jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
        });
        // For insert: .insert().select().single() -> { data }
        chainObj.insert = jest.fn().mockImplementation((data: any) => {
          insertedData = data;
          return {
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'new-1' }, error: null }),
            }),
          };
        });
        return chainObj;
      }),
    };
    await createResearchFindings(sb, [sampleMentions[0]]);
    expect(insertedData).not.toBeNull();
    expect(insertedData?.finding_type).toBe('parliamentary');
  });

  it('continues on insert error for individual items', async () => {
    let insertCallCount = 0;
    const sb: any = {
      from: jest.fn(() => {
        const chainObj: any = {};
        chainObj.select = jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
        });
        chainObj.insert = jest.fn().mockImplementation(() => {
          insertCallCount++;
          if (insertCallCount === 1) {
            // First insert fails
            return {
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { message: 'constraint violation' } }),
              }),
            };
          }
          // Second insert succeeds
          return {
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'new-2' }, error: null }),
            }),
          };
        });
        return chainObj;
      }),
    };
    const result = await createResearchFindings(sb, sampleMentions);
    expect(result.inserted).toBe(1);
    expect(result.errors).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// linkToOrgsAndPrograms
// ---------------------------------------------------------------------------

describe('linkToOrgsAndPrograms', () => {
  it('attempts to match org names from body text', async () => {
    const findingIds = ['finding-1'];
    const mentions: CivicMention[] = [
      {
        source_table: 'civic_ministerial_statements',
        source_id: 'stmt-1',
        title: 'Funding for Maranguka Justice Reinvestment',
        body_snippet: 'The Maranguka program in Bourke has shown great results.',
        speaker: 'Minister Smith',
        date: '2026-03-01',
        source_url: 'https://example.com/stmt-1',
      },
    ];

    const sb: any = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'org-123', name: 'Maranguka' },
                error: null,
              }),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      })),
    };

    const result = await linkToOrgsAndPrograms(sb, mentions, findingIds);
    expect(result.linked).toBeGreaterThanOrEqual(0);
    // Should not throw
  });

  it('handles empty inputs gracefully', async () => {
    const sb: any = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
      })),
    };
    const result = await linkToOrgsAndPrograms(sb, [], []);
    expect(result.linked).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// runCivicScopeBridge (integration orchestrator)
// ---------------------------------------------------------------------------

describe('runCivicScopeBridge', () => {
  it('returns a stats object with expected shape', async () => {
    // Mock createServiceClient to return a mock supabase
    const { createServiceClient } = require('@/lib/supabase/service');
    const mockSb: any = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
      })),
    };
    createServiceClient.mockReturnValue(mockSb);

    const result = await runCivicScopeBridge();
    expect(result).toHaveProperty('mentions_found');
    expect(result).toHaveProperty('findings_created');
    expect(result).toHaveProperty('duplicates_skipped');
    expect(result).toHaveProperty('links_made');
    expect(typeof result.mentions_found).toBe('number');
  });
});
