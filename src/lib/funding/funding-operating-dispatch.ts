export type FundingOperatingRouteClass = 'pipeline' | 'reporting' | 'finance' | 'general';

export type FundingOperatingDispatchAgent = {
  id: string;
  name?: string | null;
  domain?: string | null;
  currentTaskId?: string | null;
};

export type FundingOperatingDispatchTask = {
  id: string;
  title?: string | null;
  assignedAgentId?: string | null;
  routingClass?: string | null;
  status?: string | null;
  slaState?: 'healthy' | 'warning' | 'breach' | 'met' | 'unknown';
  ageHours?: number | null;
};

export type FundingOperatingRebalanceRecommendation = {
  routeClass: FundingOperatingRouteClass;
  taskId: string;
  taskTitle?: string | null;
  toOwner: string;
  toOwnerId: string;
  toOwnerDomain?: string | null;
  targetRouteLoad: number;
  targetRouteBreached: number;
};

const ROUTE_TOKENS: Record<FundingOperatingRouteClass, string[]> = {
  pipeline: ['fund', 'grant', 'match', 'partner'],
  reporting: ['community', 'report', 'impact', 'ops', 'operat'],
  finance: ['finance', 'reconcil', 'fund', 'ops'],
  general: ['funding', 'operations', 'ops'],
};

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function normalizeFundingOperatingRouteClass(
  routeClass?: string | null
): FundingOperatingRouteClass {
  if (
    routeClass === 'pipeline' ||
    routeClass === 'reporting' ||
    routeClass === 'finance' ||
    routeClass === 'general'
  ) {
    return routeClass;
  }

  return 'general';
}

export function scoreFundingOperatingAgentForRoute(
  agent: FundingOperatingDispatchAgent,
  routeClass: FundingOperatingRouteClass,
  options?: {
    preferOrganizationContext?: boolean;
  }
) {
  const haystack = `${agent.name || ''} ${agent.domain || ''}`.toLowerCase();
  const preferredTokens = ROUTE_TOKENS[routeClass];
  const routeMatch = includesAny(haystack, preferredTokens);

  let score = 0;
  if (routeMatch) {
    score += 6;
  }

  if (routeClass !== 'general' && includesAny(haystack, ROUTE_TOKENS.general)) {
    score += 2;
  }

  if (!agent.currentTaskId) {
    score += 1;
  }

  if (options?.preferOrganizationContext && includesAny(haystack, ['community', 'partner', 'place'])) {
    score += 1;
  }

  return {
    score,
    routeMatch,
  };
}

export function pickFundingOperatingAutoAssignee(
  agents: FundingOperatingDispatchAgent[],
  routeClass: FundingOperatingRouteClass,
  options?: {
    preferOrganizationContext?: boolean;
    minimumScore?: number;
  }
) {
  const minimumScore = Math.max(1, options?.minimumScore ?? 4);

  const best = agents
    .map((agent) => {
      const ranking = scoreFundingOperatingAgentForRoute(agent, routeClass, options);
      return {
        agent,
        ...ranking,
      };
    })
    .sort((left, right) => {
      if (Number(right.routeMatch) !== Number(left.routeMatch)) {
        return Number(right.routeMatch) - Number(left.routeMatch);
      }
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.agent.id.localeCompare(right.agent.id);
    })[0];

  if (!best || !best.routeMatch || best.score < minimumScore) {
    return null;
  }

  return {
    agentId: best.agent.id,
    score: best.score,
  };
}

export function buildFundingOperatingRebalanceRecommendation(options: {
  agents: FundingOperatingDispatchAgent[];
  tasks: FundingOperatingDispatchTask[];
  ownerId: string;
  routeClass: FundingOperatingRouteClass;
}) {
  const routeClass = normalizeFundingOperatingRouteClass(options.routeClass);
  const ownerBreachedTasks = options.tasks
    .filter(
      (task) =>
        task.assignedAgentId === options.ownerId &&
        normalizeFundingOperatingRouteClass(task.routingClass) === routeClass &&
        task.slaState === 'breach' &&
        task.status !== 'completed'
    )
    .sort((left, right) => (right.ageHours || 0) - (left.ageHours || 0));

  const candidateTask = ownerBreachedTasks[0];
  if (!candidateTask) {
    return null;
  }

  const target = options.agents
    .filter((agent) => agent.id !== options.ownerId)
    .map((agent) => {
      const compatibility = scoreFundingOperatingAgentForRoute(agent, routeClass).score;
      const routeTasks = options.tasks.filter(
        (task) =>
          task.assignedAgentId === agent.id &&
          normalizeFundingOperatingRouteClass(task.routingClass) === routeClass &&
          task.status !== 'completed'
      );
      const routeBreached = routeTasks.filter((task) => task.slaState === 'breach').length;

      return {
        agent,
        compatibility,
        routeLoad: routeTasks.length,
        routeBreached,
      };
    })
    .filter((entry) => entry.compatibility >= 4)
    .sort((left, right) => {
      if (left.routeBreached !== right.routeBreached) {
        return left.routeBreached - right.routeBreached;
      }
      if (left.routeLoad !== right.routeLoad) {
        return left.routeLoad - right.routeLoad;
      }
      if (right.compatibility !== left.compatibility) {
        return right.compatibility - left.compatibility;
      }
      return String(left.agent.name || left.agent.id).localeCompare(
        String(right.agent.name || right.agent.id)
      );
    })[0];

  if (!target) {
    return null;
  }

  return {
    routeClass,
    taskId: candidateTask.id,
    taskTitle: candidateTask.title || null,
    toOwner: String(target.agent.name || target.agent.id),
    toOwnerId: target.agent.id,
    toOwnerDomain: target.agent.domain || null,
    targetRouteLoad: target.routeLoad,
    targetRouteBreached: target.routeBreached,
  } satisfies FundingOperatingRebalanceRecommendation;
}
