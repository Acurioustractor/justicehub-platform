const SYSTEM0_POLICY_KEY = 'default';

export interface System0Policy {
  policyKey: string;
  schedulerEnabled: boolean;
  autoStart: boolean;
  runMode: 'incremental' | 'full';
  workerBatchSize: number;
  staleAfterMinutes: number;
  drainEnabled: boolean;
  drainBatchSize: number;
  drainMaxBatches: number;
  autoProcessEnabled: boolean;
  autoProcessIntervalSec: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

export type System0PolicyInput = Partial<Omit<System0Policy, 'policyKey' | 'updatedAt' | 'updatedBy'>>;

export const DEFAULT_SYSTEM0_POLICY: Omit<System0Policy, 'updatedAt' | 'updatedBy'> = {
  policyKey: SYSTEM0_POLICY_KEY,
  schedulerEnabled: true,
  autoStart: true,
  runMode: 'incremental',
  workerBatchSize: 4,
  staleAfterMinutes: 45,
  drainEnabled: false,
  drainBatchSize: 5,
  drainMaxBatches: 20,
  autoProcessEnabled: false,
  autoProcessIntervalSec: 30,
};

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function normalizePolicyInput(input: System0PolicyInput = {}): Omit<System0Policy, 'policyKey' | 'updatedAt' | 'updatedBy'> {
  return {
    ...DEFAULT_SYSTEM0_POLICY,
    schedulerEnabled: input.schedulerEnabled ?? DEFAULT_SYSTEM0_POLICY.schedulerEnabled,
    autoStart: input.autoStart ?? DEFAULT_SYSTEM0_POLICY.autoStart,
    runMode: input.runMode === 'full' ? 'full' : 'incremental',
    workerBatchSize: clampInt(input.workerBatchSize, DEFAULT_SYSTEM0_POLICY.workerBatchSize, 1, 20),
    staleAfterMinutes: clampInt(input.staleAfterMinutes, DEFAULT_SYSTEM0_POLICY.staleAfterMinutes, 5, 24 * 60),
    drainEnabled: input.drainEnabled ?? DEFAULT_SYSTEM0_POLICY.drainEnabled,
    drainBatchSize: clampInt(input.drainBatchSize, DEFAULT_SYSTEM0_POLICY.drainBatchSize, 1, 20),
    drainMaxBatches: clampInt(input.drainMaxBatches, DEFAULT_SYSTEM0_POLICY.drainMaxBatches, 1, 50),
    autoProcessEnabled: input.autoProcessEnabled ?? DEFAULT_SYSTEM0_POLICY.autoProcessEnabled,
    autoProcessIntervalSec: clampInt(input.autoProcessIntervalSec, DEFAULT_SYSTEM0_POLICY.autoProcessIntervalSec, 10, 300),
  };
}

function mapPolicyRow(row: Record<string, unknown> | null | undefined): System0Policy {
  if (!row) {
    return {
      ...DEFAULT_SYSTEM0_POLICY,
      updatedAt: null,
      updatedBy: null,
    };
  }

  return {
    policyKey: typeof row.policy_key === 'string' ? row.policy_key : SYSTEM0_POLICY_KEY,
    schedulerEnabled: row.scheduler_enabled !== false,
    autoStart: row.auto_start !== false,
    runMode: row.run_mode === 'full' ? 'full' : 'incremental',
    workerBatchSize: clampInt(row.worker_batch_size, DEFAULT_SYSTEM0_POLICY.workerBatchSize, 1, 20),
    staleAfterMinutes: clampInt(row.stale_after_minutes, DEFAULT_SYSTEM0_POLICY.staleAfterMinutes, 5, 24 * 60),
    drainEnabled: row.drain_enabled === true,
    drainBatchSize: clampInt(row.drain_batch_size, DEFAULT_SYSTEM0_POLICY.drainBatchSize, 1, 20),
    drainMaxBatches: clampInt(row.drain_max_batches, DEFAULT_SYSTEM0_POLICY.drainMaxBatches, 1, 50),
    autoProcessEnabled: row.auto_process_enabled === true,
    autoProcessIntervalSec: clampInt(row.auto_process_interval_sec, DEFAULT_SYSTEM0_POLICY.autoProcessIntervalSec, 10, 300),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
    updatedBy: typeof row.updated_by === 'string' ? row.updated_by : null,
  };
}

async function ensureSystem0PolicyRow(serviceClient: any): Promise<System0Policy> {
  const seed = normalizePolicyInput();
  const { data, error } = await serviceClient
    .from('funding_system0_policy')
    .upsert(
      {
        policy_key: SYSTEM0_POLICY_KEY,
        scheduler_enabled: seed.schedulerEnabled,
        auto_start: seed.autoStart,
        run_mode: seed.runMode,
        worker_batch_size: seed.workerBatchSize,
        stale_after_minutes: seed.staleAfterMinutes,
        drain_enabled: seed.drainEnabled,
        drain_batch_size: seed.drainBatchSize,
        drain_max_batches: seed.drainMaxBatches,
        auto_process_enabled: seed.autoProcessEnabled,
        auto_process_interval_sec: seed.autoProcessIntervalSec,
      },
      { onConflict: 'policy_key' }
    )
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapPolicyRow(data as Record<string, unknown>);
}

export async function getSystem0Policy(serviceClient: any): Promise<System0Policy> {
  const { data, error } = await serviceClient
    .from('funding_system0_policy')
    .select('*')
    .eq('policy_key', SYSTEM0_POLICY_KEY)
    .maybeSingle();

  if (error) {
    // Graceful fallback keeps scheduler/worker running even before migration is applied.
    if (String(error.message || '').toLowerCase().includes('relation')) {
      return {
        ...DEFAULT_SYSTEM0_POLICY,
        updatedAt: null,
        updatedBy: null,
      };
    }
    throw new Error(error.message);
  }

  if (!data) {
    return ensureSystem0PolicyRow(serviceClient);
  }

  return mapPolicyRow(data as Record<string, unknown>);
}

export async function upsertSystem0Policy(
  serviceClient: any,
  input: System0PolicyInput,
  updatedBy?: string | null
): Promise<System0Policy> {
  const merged = normalizePolicyInput(input);
  const { data, error } = await serviceClient
    .from('funding_system0_policy')
    .upsert(
      {
        policy_key: SYSTEM0_POLICY_KEY,
        scheduler_enabled: merged.schedulerEnabled,
        auto_start: merged.autoStart,
        run_mode: merged.runMode,
        worker_batch_size: merged.workerBatchSize,
        stale_after_minutes: merged.staleAfterMinutes,
        drain_enabled: merged.drainEnabled,
        drain_batch_size: merged.drainBatchSize,
        drain_max_batches: merged.drainMaxBatches,
        auto_process_enabled: merged.autoProcessEnabled,
        auto_process_interval_sec: merged.autoProcessIntervalSec,
        updated_by: updatedBy || null,
      },
      { onConflict: 'policy_key' }
    )
    .select('*')
    .single();

  if (error) {
    if (String(error.message || '').toLowerCase().includes('relation')) {
      throw new Error('System 0 policy table is missing. Run latest Supabase migrations.');
    }
    throw new Error(error.message);
  }

  return mapPolicyRow(data as Record<string, unknown>);
}
