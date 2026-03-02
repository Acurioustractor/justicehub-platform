import {
  buildFundingOperatingRebalanceRecommendation,
  normalizeFundingOperatingRouteClass,
  pickFundingOperatingAutoAssignee,
  scoreFundingOperatingAgentForRoute,
} from '@/lib/funding/funding-operating-dispatch';

describe('funding-operating-dispatch', () => {
  test('normalizes unknown route classes to general', () => {
    expect(normalizeFundingOperatingRouteClass('pipeline')).toBe('pipeline');
    expect(normalizeFundingOperatingRouteClass('weird')).toBe('general');
    expect(normalizeFundingOperatingRouteClass(null)).toBe('general');
  });

  test('scores route-compatible agents above generic agents', () => {
    const reportingAgent = {
      id: 'agent-report',
      name: 'Community Reporting Lead',
      domain: 'reporting-ops',
      currentTaskId: null,
    };
    const genericAgent = {
      id: 'agent-generic',
      name: 'General Funding Worker',
      domain: 'operations',
      currentTaskId: 'task-1',
    };

    const reportingScore = scoreFundingOperatingAgentForRoute(reportingAgent, 'reporting');
    const genericScore = scoreFundingOperatingAgentForRoute(genericAgent, 'reporting');

    expect(reportingScore.routeMatch).toBe(true);
    expect(reportingScore.score).toBeGreaterThan(genericScore.score);
  });

  test('picks the strongest compatible agent for a route', () => {
    const result = pickFundingOperatingAutoAssignee(
      [
        {
          id: 'agent-1',
          name: 'Pipeline and Grants',
          domain: 'funding',
          currentTaskId: null,
        },
        {
          id: 'agent-2',
          name: 'Community Reporting',
          domain: 'impact',
          currentTaskId: null,
        },
      ],
      'pipeline'
    );

    expect(result).not.toBeNull();
    expect(result?.agentId).toBe('agent-1');
    expect(result?.score).toBeGreaterThanOrEqual(4);
  });

  test('returns null when no agent meaningfully matches the route', () => {
    const result = pickFundingOperatingAutoAssignee(
      [
        {
          id: 'agent-1',
          name: 'Archive Custodian',
          domain: 'records',
          currentTaskId: 'task-1',
        },
      ],
      'finance'
    );

    expect(result).toBeNull();
  });

  test('builds a rebalance recommendation for the oldest breached task in lane', () => {
    const recommendation = buildFundingOperatingRebalanceRecommendation({
      agents: [
        {
          id: 'agent-overloaded',
          name: 'Pipeline Ops',
          domain: 'funding',
          currentTaskId: 'active-task',
        },
        {
          id: 'agent-free',
          name: 'Grant Match Backup',
          domain: 'funding',
          currentTaskId: null,
        },
        {
          id: 'agent-busy',
          name: 'Grant Match Busy',
          domain: 'funding',
          currentTaskId: null,
        },
      ],
      tasks: [
        {
          id: 'task-oldest',
          title: 'Oldest pipeline breach',
          assignedAgentId: 'agent-overloaded',
          routingClass: 'pipeline',
          status: 'queued',
          slaState: 'breach',
          ageHours: 40,
        },
        {
          id: 'task-newer',
          title: 'Newer pipeline breach',
          assignedAgentId: 'agent-overloaded',
          routingClass: 'pipeline',
          status: 'queued',
          slaState: 'breach',
          ageHours: 12,
        },
        {
          id: 'task-target-breached',
          assignedAgentId: 'agent-busy',
          routingClass: 'pipeline',
          status: 'queued',
          slaState: 'breach',
          ageHours: 10,
        },
        {
          id: 'task-target-healthy',
          assignedAgentId: 'agent-busy',
          routingClass: 'pipeline',
          status: 'queued',
          slaState: 'healthy',
          ageHours: 2,
        },
      ],
      ownerId: 'agent-overloaded',
      routeClass: 'pipeline',
    });

    expect(recommendation).not.toBeNull();
    expect(recommendation?.taskId).toBe('task-oldest');
    expect(recommendation?.toOwnerId).toBe('agent-free');
    expect(recommendation?.targetRouteLoad).toBe(0);
    expect(recommendation?.targetRouteBreached).toBe(0);
  });

  test('does not rebalance when no compatible alternate owner exists', () => {
    const recommendation = buildFundingOperatingRebalanceRecommendation({
      agents: [
        {
          id: 'agent-overloaded',
          name: 'Pipeline Ops',
          domain: 'funding',
          currentTaskId: 'active-task',
        },
        {
          id: 'agent-archive',
          name: 'Archive Custodian',
          domain: 'records',
          currentTaskId: null,
        },
      ],
      tasks: [
        {
          id: 'task-oldest',
          title: 'Oldest pipeline breach',
          assignedAgentId: 'agent-overloaded',
          routingClass: 'pipeline',
          status: 'queued',
          slaState: 'breach',
          ageHours: 40,
        },
      ],
      ownerId: 'agent-overloaded',
      routeClass: 'pipeline',
    });

    expect(recommendation).toBeNull();
  });
});
