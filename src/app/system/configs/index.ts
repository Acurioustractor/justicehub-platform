import type { SystemConfig } from '../types';
import { qldConfig } from './qld';
import { nswConfig } from './nsw';
import { vicConfig } from './vic';
import { ntConfig } from './nt';

// Registry of all state configs
// Add new states here as they're built
export const STATE_CONFIGS: Record<string, SystemConfig> = {
  qld: qldConfig,
  nsw: nswConfig,
  vic: vicConfig,
  nt: ntConfig,
  // wa: waConfig,
  // sa: saConfig,
  // tas: tasConfig,
  // act: actConfig,
  // national: nationalConfig,
};

export function getStateConfig(slug: string): SystemConfig | null {
  return STATE_CONFIGS[slug.toLowerCase()] ?? null;
}

export function getAllStateSlugs(): string[] {
  return Object.keys(STATE_CONFIGS);
}
