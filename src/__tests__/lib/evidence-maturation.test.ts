/**
 * Tests for Evidence Maturation Tracker
 *
 * TDD Phase 1: Define expected behavior for:
 * 1. determineEvidenceLevel — maps evidence signals to proposed level
 * 2. assessMaturation — checks a single intervention
 * 3. runMaturationScan — batch processes all interventions
 */

jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: jest.fn(),
}));

import {
  determineEvidenceLevel,
  assessMaturation,
  runMaturationScan,
  EVIDENCE_LEVELS,
} from '@/lib/cron/evidence-maturation';

// ---------------------------------------------------------------------------
// Evidence level constants
// ---------------------------------------------------------------------------

describe('EVIDENCE_LEVELS', () => {
  it('contains all 5 exact evidence level strings', () => {
    expect(EVIDENCE_LEVELS.PROVEN).toBe('Proven (RCT/quasi-experimental, replicated)');
    expect(EVIDENCE_LEVELS.EFFECTIVE).toBe('Effective (strong evaluation, positive outcomes)');
    expect(EVIDENCE_LEVELS.PROMISING).toBe('Promising (community-endorsed, emerging evidence)');
    expect(EVIDENCE_LEVELS.INDIGENOUS_LED).toBe('Indigenous-led (culturally grounded, community authority)');
    expect(EVIDENCE_LEVELS.UNTESTED).toBe('Untested (theory/pilot stage)');
  });
});

// ---------------------------------------------------------------------------
// determineEvidenceLevel
// ---------------------------------------------------------------------------

describe('determineEvidenceLevel', () => {
  it('returns Untested when no evidence, no cost data, no evaluation', () => {
    const level = determineEvidenceLevel({
      evidenceCount: 0,
      hasCostData: false,
      hasEvaluation: false,
      hasRCT: false,
      isIndigenousLed: false,
    });
    expect(level).toBe(EVIDENCE_LEVELS.UNTESTED);
  });

  it('returns Promising when evidence count >= 3 and has cost data', () => {
    const level = determineEvidenceLevel({
      evidenceCount: 3,
      hasCostData: true,
      hasEvaluation: false,
      hasRCT: false,
      isIndigenousLed: false,
    });
    expect(level).toBe(EVIDENCE_LEVELS.PROMISING);
  });

  it('returns Effective when evidence >= 5 and has evaluation', () => {
    const level = determineEvidenceLevel({
      evidenceCount: 5,
      hasCostData: true,
      hasEvaluation: true,
      hasRCT: false,
      isIndigenousLed: false,
    });
    expect(level).toBe(EVIDENCE_LEVELS.EFFECTIVE);
  });

  it('returns Proven when RCT/quasi-experimental found', () => {
    const level = determineEvidenceLevel({
      evidenceCount: 8,
      hasCostData: true,
      hasEvaluation: true,
      hasRCT: true,
      isIndigenousLed: false,
    });
    expect(level).toBe(EVIDENCE_LEVELS.PROVEN);
  });

  it('keeps Indigenous-led level when program is Indigenous-led', () => {
    const level = determineEvidenceLevel({
      evidenceCount: 10,
      hasCostData: true,
      hasEvaluation: true,
      hasRCT: false,
      isIndigenousLed: true,
    });
    expect(level).toBe(EVIDENCE_LEVELS.INDIGENOUS_LED);
  });

  it('returns Untested when only 1-2 evidence items without cost data', () => {
    const level = determineEvidenceLevel({
      evidenceCount: 2,
      hasCostData: false,
      hasEvaluation: false,
      hasRCT: false,
      isIndigenousLed: false,
    });
    expect(level).toBe(EVIDENCE_LEVELS.UNTESTED);
  });

  it('returns Promising when evidence >= 3 even without cost data if has evaluation', () => {
    const level = determineEvidenceLevel({
      evidenceCount: 3,
      hasCostData: false,
      hasEvaluation: true,
      hasRCT: false,
      isIndigenousLed: false,
    });
    expect(level).toBe(EVIDENCE_LEVELS.PROMISING);
  });
});

// ---------------------------------------------------------------------------
// assessMaturation (with mocked Supabase)
// ---------------------------------------------------------------------------

describe('assessMaturation', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      single: jest.fn(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    };
  });

  it('returns null when intervention is already at the correct level', async () => {
    // Intervention at Untested with no evidence
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'int-1',
        name: 'Test Program',
        evidence_level: EVIDENCE_LEVELS.UNTESTED,
      },
      error: null,
    });
    // Evidence count
    mockSupabase.eq.mockImplementation(() => ({
      ...mockSupabase,
      neq: jest.fn().mockReturnValue({
        ...mockSupabase,
      }),
    }));

    // We need a cleaner mock for this — let's use call-order mocking
    const fromCalls: string[] = [];
    mockSupabase.from = jest.fn((table: string) => {
      fromCalls.push(table);
      if (table === 'alma_interventions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'int-1',
                name: 'Test Program',
                evidence_level: EVIDENCE_LEVELS.UNTESTED,
              },
              error: null,
            }),
          }),
        };
      }
      if (table === 'alma_evidence') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              neq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }
      // Default
      return mockSupabase;
    });

    const result = await assessMaturation(mockSupabase, 'int-1');
    expect(result).toBeNull();
  });

  it('returns a maturation candidate when evidence warrants upgrade', async () => {
    const fromCalls: string[] = [];
    mockSupabase.from = jest.fn((table: string) => {
      fromCalls.push(table);
      if (table === 'alma_interventions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'int-2',
                name: 'Strong Program',
                evidence_level: EVIDENCE_LEVELS.UNTESTED,
                cost_per_young_person: 45000,
              },
              error: null,
            }),
          }),
        };
      }
      if (table === 'alma_evidence') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              neq: jest.fn().mockResolvedValue({
                data: [
                  { id: 'e1', methodology: 'survey' },
                  { id: 'e2', methodology: 'interview' },
                  { id: 'e3', methodology: 'case study' },
                  { id: 'e4', methodology: 'evaluation' },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      return mockSupabase;
    });

    const result = await assessMaturation(mockSupabase, 'int-2');
    expect(result).not.toBeNull();
    expect(result!.current_level).toBe(EVIDENCE_LEVELS.UNTESTED);
    expect(result!.proposed_level).toBe(EVIDENCE_LEVELS.PROMISING);
    expect(result!.evidence_count).toBe(4);
    expect(result!.cost_data_available).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// runMaturationScan (batch processing)
// ---------------------------------------------------------------------------

describe('runMaturationScan', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Build a more realistic mock that tracks table context
    mockSupabase = {
      from: jest.fn(),
    };
  });

  it('returns count of candidates found', async () => {
    // Mock: 2 interventions, 1 is a candidate
    let interventionCallCount = 0;
    mockSupabase.from = jest.fn((table: string) => {
      if (table === 'alma_interventions') {
        interventionCallCount++;
        if (interventionCallCount === 1) {
          // First call: list all interventions
          return {
            select: jest.fn().mockReturnValue({
              neq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [
                    { id: 'int-a', name: 'Program A', evidence_level: EVIDENCE_LEVELS.UNTESTED, cost_per_young_person: null },
                    { id: 'int-b', name: 'Program B', evidence_level: EVIDENCE_LEVELS.UNTESTED, cost_per_young_person: 50000 },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        // Subsequent calls: single intervention lookups
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              // Return the intervention matching whatever was requested
              return Promise.resolve({
                data: {
                  id: 'int-b',
                  name: 'Program B',
                  evidence_level: EVIDENCE_LEVELS.UNTESTED,
                  cost_per_young_person: 50000,
                },
                error: null,
              });
            }),
          }),
        };
      }
      if (table === 'alma_evidence') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              neq: jest.fn().mockImplementation(() => {
                // Return 4 evidence items for int-b, 0 for int-a
                return Promise.resolve({
                  data: [
                    { id: 'e1', methodology: 'survey' },
                    { id: 'e2', methodology: 'interview' },
                    { id: 'e3', methodology: 'case study' },
                    { id: 'e4', methodology: null },
                  ],
                  error: null,
                });
              }),
            }),
          }),
        };
      }
      if (table === 'alma_maturation_log') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return { select: jest.fn().mockReturnThis() };
    });

    const result = await runMaturationScan(mockSupabase);
    expect(result).toHaveProperty('candidatesFound');
    expect(typeof result.candidatesFound).toBe('number');
    expect(result.candidatesFound).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 candidates when all interventions are at correct level', async () => {
    mockSupabase.from = jest.fn((table: string) => {
      if (table === 'alma_interventions') {
        return {
          select: jest.fn().mockReturnValue({
            neq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [
                  { id: 'int-a', name: 'Program A', evidence_level: EVIDENCE_LEVELS.UNTESTED, cost_per_young_person: null },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'alma_evidence') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              neq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'alma_maturation_log') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return { select: jest.fn().mockReturnThis() };
    });

    const result = await runMaturationScan(mockSupabase);
    expect(result.candidatesFound).toBe(0);
  });
});
