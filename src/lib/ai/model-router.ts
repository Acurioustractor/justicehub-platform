import { env } from '@/lib/env';

export type ModelProvider = 'openai' | 'anthropic';
export type ModelTask =
  | 'entity_extraction'
  | 'contact_enrichment'
  | 'grant_matching'
  | 'notification_drafting'
  | 'general';

export interface ModelCandidate {
  provider: ModelProvider;
  model: string;
  reason: string;
}

export interface ModelRoutePlan {
  task: ModelTask;
  primary: ModelCandidate;
  fallbacks: ModelCandidate[];
  policy: {
    maxRetries: number;
    timeoutMs: number;
  };
}

function hasProvider(provider: ModelProvider): boolean {
  if (provider === 'openai') return Boolean(env.OPENAI_API_KEY);
  return Boolean(env.ANTHROPIC_API_KEY);
}

function getTaskCandidates(task: ModelTask): ModelCandidate[] {
  switch (task) {
    case 'entity_extraction':
      return [
        { provider: 'openai', model: 'gpt-5.2', reason: 'Strong structured extraction quality' },
        { provider: 'anthropic', model: 'claude-sonnet-4-5', reason: 'Robust fallback for long context extraction' },
        { provider: 'openai', model: 'gpt-5-mini', reason: 'Cost fallback for high volume extraction' },
      ];
    case 'contact_enrichment':
      return [
        { provider: 'openai', model: 'gpt-5-mini', reason: 'Fast, cost-effective summarization and tagging' },
        { provider: 'openai', model: 'gpt-5.2', reason: 'Higher quality fallback for ambiguous profiles' },
        { provider: 'anthropic', model: 'claude-sonnet-4-5', reason: 'Cross-provider resilience' },
      ];
    case 'grant_matching':
      return [
        { provider: 'openai', model: 'gpt-5.2', reason: 'Reasoning-heavy fit assessment' },
        { provider: 'anthropic', model: 'claude-sonnet-4-5', reason: 'Fallback for explainable ranking' },
      ];
    case 'notification_drafting':
      return [
        { provider: 'openai', model: 'gpt-5-mini', reason: 'Fast concise drafting' },
        { provider: 'anthropic', model: 'claude-sonnet-4-5', reason: 'Fallback for quality and tone control' },
      ];
    default:
      return [
        { provider: 'openai', model: 'gpt-5-mini', reason: 'Default balanced model' },
        { provider: 'anthropic', model: 'claude-sonnet-4-5', reason: 'Default fallback model' },
      ];
  }
}

export function routeModel(task: ModelTask): ModelRoutePlan {
  const candidates = getTaskCandidates(task).filter((c) => hasProvider(c.provider));
  if (candidates.length === 0) {
    throw new Error('No AI providers configured for model routing');
  }

  return {
    task,
    primary: candidates[0],
    fallbacks: candidates.slice(1),
    policy: {
      maxRetries: 3,
      timeoutMs: task === 'entity_extraction' ? 90000 : 60000,
    },
  };
}
