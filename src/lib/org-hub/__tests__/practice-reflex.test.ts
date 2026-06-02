import {
  PRACTICE_REFLEX_SOURCE,
  buildPracticeReflexState,
  type PracticeReflexCounts,
  type PracticeReflexOrganization,
} from '../practice-reflex';

const baseOrg: PracticeReflexOrganization = {
  id: 'org-1',
  name: 'River Justice Collective',
  slug: 'river-justice',
  abn: null,
  description: null,
  plan: 'community',
  type: null,
  partnerTier: null,
  trialEndsAt: null,
  billingStatus: null,
};

const emptyCounts: PracticeReflexCounts = {
  programs: 0,
  people: 0,
  proof: 0,
  referralsTotal: 0,
  referralsPending: 0,
  sessionsTotal: 0,
  recentSessions: 0,
  milestones: 0,
  grants: 0,
  budgetIssues: 0,
  deadlinesActive: 0,
  deadlinesDueSoon: 0,
  deadlinesOverdue: 0,
  complianceDocs: 0,
  complianceExpiring: 0,
  complianceExpired: 0,
  actionItemsOpen: 0,
  fundingProfileCount: 0,
  fundingReadinessScore: 0,
  deliveryConfidenceScore: 0,
  evidenceMaturityScore: 0,
  activeAwards: 0,
  outcomeCommitments: 0,
  outcomeUpdates: 0,
  communityValidations: 0,
};

function build(counts: Partial<PracticeReflexCounts> = {}, org: Partial<PracticeReflexOrganization> = {}) {
  return buildPracticeReflexState({
    organization: { ...baseOrg, ...org },
    counts: { ...emptyCounts, ...counts },
  });
}

function laneStatus(state: ReturnType<typeof buildPracticeReflexState>, key: string) {
  return state.lanes.find((lane) => lane.key === key)?.status;
}

describe('Practice Reflex state builder', () => {
  it('returns all lanes as open or needs work for an empty organisation', () => {
    const state = build();

    expect(state.lanes).toHaveLength(9);
    expect(state.summary.essentialStepsReady).toBe(0);
    expect(laneStatus(state, 'identity')).toBe('needs_work');
    expect(laneStatus(state, 'programs')).toBe('needs_work');
    expect(laneStatus(state, 'people')).toBe('open');
    expect(laneStatus(state, 'proof')).toBe('open');
    expect(laneStatus(state, 'referrals')).toBe('open');
    expect(laneStatus(state, 'practice_learning')).toBe('open');
    expect(laneStatus(state, 'funding')).toBe('needs_work');
    expect(laneStatus(state, 'compliance')).toBe('open');
    expect(laneStatus(state, 'outcomes')).toBe('open');
    expect(state.suggestedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ lane: 'programs', title: 'Add delivery records' }),
        expect.objectContaining({ lane: 'people', title: 'Add people context' }),
        expect.objectContaining({ lane: 'proof', title: 'Attach proof' }),
      ])
    );
  });

  it('marks populated operating signals as ready', () => {
    const state = build(
      {
        programs: 3,
        people: 2,
        proof: 4,
        referralsTotal: 2,
        sessionsTotal: 5,
        recentSessions: 2,
        milestones: 1,
        grants: 2,
        deadlinesActive: 2,
        complianceDocs: 2,
        fundingProfileCount: 1,
        fundingReadinessScore: 84,
        deliveryConfidenceScore: 78,
        evidenceMaturityScore: 82,
        activeAwards: 1,
        outcomeCommitments: 1,
        outcomeUpdates: 2,
        communityValidations: 1,
      },
      {
        abn: '11111111111',
        description: 'Community-led early intervention and justice practice.',
        plan: 'organisation',
      }
    );

    expect(state.lanes.every((lane) => lane.status === 'ready')).toBe(true);
    expect(state.summary.essentialStepsReady).toBe(9);
    expect(state.summary.proofStrength).toBeGreaterThanOrEqual(80);
    expect(state.summary.fundingReadiness).toBe(84);
  });

  it('surfaces overdue compliance, stale learning, budget issues, and missing outcome commitments', () => {
    const state = build(
      {
        programs: 1,
        people: 1,
        proof: 1,
        sessionsTotal: 3,
        recentSessions: 0,
        grants: 1,
        budgetIssues: 1,
        deadlinesActive: 1,
        deadlinesOverdue: 1,
        complianceDocs: 1,
        complianceExpired: 1,
        fundingProfileCount: 1,
        fundingReadinessScore: 92,
        activeAwards: 1,
        outcomeCommitments: 0,
      },
      {
        abn: '22222222222',
        description: 'A staffed local justice program.',
      }
    );

    expect(laneStatus(state, 'practice_learning')).toBe('needs_work');
    expect(laneStatus(state, 'funding')).toBe('needs_work');
    expect(laneStatus(state, 'compliance')).toBe('needs_work');
    expect(laneStatus(state, 'outcomes')).toBe('needs_work');
    expect(state.suggestedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ lane: 'funding', priority: 'high', title: 'Review grant budget issues' }),
        expect.objectContaining({ lane: 'compliance', priority: 'urgent', title: 'Review deadlines' }),
        expect.objectContaining({ lane: 'outcomes', priority: 'high', title: 'Update outcome evidence' }),
      ])
    );
  });

  it('keeps generated suggestions idempotent per lane', () => {
    const state = build();
    const lanes = state.suggestedActions.map((action) => action.lane);

    expect(new Set(lanes).size).toBe(lanes.length);
    expect(state.suggestedActions.every((action) => action.sourceAgent === PRACTICE_REFLEX_SOURCE)).toBe(true);
  });

  it('does not include individual prediction or surveillance language', () => {
    const state = build({ activeAwards: 1 });
    const serialized = JSON.stringify(state).toLowerCase();

    expect(serialized).not.toContain('risk score');
    expect(serialized).not.toContain('risk scoring');
    expect(serialized).not.toContain('youth prediction');
    expect(serialized).not.toContain('ranked community');
    expect(serialized).not.toContain('case surveillance');
  });
});
