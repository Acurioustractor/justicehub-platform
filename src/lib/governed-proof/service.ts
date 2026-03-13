import { createServiceClient } from '@/lib/supabase/service';
import type {
  GovernedProofBundle,
  GovernedProofBundleRecord,
  GovernedProofPromotionStatus,
  GovernedProofReviewStatus,
  GovernedProofRun,
  GovernedProofRunResult,
  GovernedProofSystem,
  GovernedProofTask,
} from './contracts';

type JsonObject = Record<string, unknown>;

export interface CreateGovernedProofTaskInput {
  taskType: GovernedProofTask['taskType'];
  queueLane?: GovernedProofTask['queueLane'];
  priority?: GovernedProofTask['priority'];
  ownerSystem?: GovernedProofSystem;
  systemScope?: GovernedProofSystem[];
  targetType: string;
  targetId: string;
  valueScore?: number;
  confidenceRequired?: number;
  inputPayload?: JsonObject;
  acceptanceChecks?: string[];
  reviewStatus?: GovernedProofReviewStatus;
  promotionStatus?: GovernedProofPromotionStatus;
}

export interface LogGovernedProofRunInput {
  taskId: string;
  agentRole: string;
  provider: string;
  model?: string;
  promptVersion?: string;
  strategyVersion?: string;
  inputHash: string;
  outputHash?: string;
  resultStatus?: GovernedProofRunResult;
  evalScore?: number;
  confidenceDelta?: number;
  costUsd?: number;
  durationMs?: number;
  notes?: string;
  runPayload?: JsonObject;
}

export interface UpsertGovernedProofBundleInput {
  bundleKey: string;
  subjectType: GovernedProofBundle['subjectType'];
  subjectId: string;
  ownerSystem?: GovernedProofSystem;
  lifecycleStatus?: GovernedProofBundle['lifecycleStatus'];
  reviewStatus?: GovernedProofReviewStatus;
  promotionStatus?: GovernedProofPromotionStatus;
  overallConfidence?: number;
  capitalConfidence?: number;
  evidenceConfidence?: number;
  voiceConfidence?: number;
  governanceConfidence?: number;
  capitalContext?: JsonObject;
  evidenceContext?: JsonObject;
  voiceContext?: JsonObject;
  governanceContext?: JsonObject;
  outputContext?: JsonObject;
  freshnessAt?: string;
  lastValidatedAt?: string;
  publishedAt?: string;
}

export interface AttachGovernedProofBundleRecordInput {
  bundleId: string;
  recordSystem: GovernedProofBundleRecord['recordSystem'];
  recordType: string;
  recordId: string;
  linkRole: string;
  confidenceScore?: number;
  provenancePayload?: JsonObject;
}

export interface QueueRepairRefreshTaskInput {
  targetType: string;
  targetId: string;
  actorId?: string;
  bundleId?: string;
  overallConfidence?: number;
  currentReviewStatus?: GovernedProofReviewStatus;
  reason?: string;
}

type DensitySummaryRow = {
  subject_type: string;
  lifecycle_status: string;
  promotion_status: string;
  bundle_count: number;
  high_confidence_count: number;
  fresh_count: number;
  avg_confidence: number | null;
};

export type DensitySummary = {
  subjectType: string;
  lifecycleStatus: string;
  promotionStatus: string;
  bundleCount: number;
  highConfidenceCount: number;
  freshCount: number;
  avgConfidence: number | null;
};

function getClient(): any {
  return createServiceClient() as any;
}

function mapTask(row: any): GovernedProofTask {
  return {
    id: row.id,
    taskType: row.task_type,
    status: row.status,
    queueLane: row.queue_lane,
    priority: row.priority,
    ownerSystem: row.owner_system,
    systemScope: row.system_scope ?? [],
    targetType: row.target_type,
    targetId: row.target_id,
    valueScore: Number(row.value_score ?? 0),
    confidenceRequired: Number(row.confidence_required ?? 0),
    inputPayload: row.input_payload ?? {},
    acceptanceChecks: row.acceptance_checks ?? [],
    reviewStatus: row.review_status,
    promotionStatus: row.promotion_status,
    attemptCount: row.attempt_count ?? 0,
    claimedBy: row.claimed_by,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRun(row: any): GovernedProofRun {
  return {
    id: row.id,
    taskId: row.task_id,
    agentRole: row.agent_role,
    provider: row.provider,
    model: row.model,
    promptVersion: row.prompt_version,
    strategyVersion: row.strategy_version,
    inputHash: row.input_hash,
    outputHash: row.output_hash,
    resultStatus: row.result_status,
    evalScore: row.eval_score != null ? Number(row.eval_score) : null,
    confidenceDelta:
      row.confidence_delta != null ? Number(row.confidence_delta) : null,
    costUsd: row.cost_usd != null ? Number(row.cost_usd) : null,
    durationMs: row.duration_ms != null ? Number(row.duration_ms) : null,
    notes: row.notes,
    runPayload: row.run_payload ?? {},
    createdAt: row.created_at,
  };
}

function mapBundle(row: any): GovernedProofBundle {
  return {
    id: row.id,
    bundleKey: row.bundle_key,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    ownerSystem: row.owner_system,
    lifecycleStatus: row.lifecycle_status,
    reviewStatus: row.review_status,
    promotionStatus: row.promotion_status,
    overallConfidence: Number(row.overall_confidence ?? 0),
    capitalConfidence:
      row.capital_confidence != null ? Number(row.capital_confidence) : null,
    evidenceConfidence:
      row.evidence_confidence != null ? Number(row.evidence_confidence) : null,
    voiceConfidence:
      row.voice_confidence != null ? Number(row.voice_confidence) : null,
    governanceConfidence:
      row.governance_confidence != null ? Number(row.governance_confidence) : null,
    capitalContext: row.capital_context ?? {},
    evidenceContext: row.evidence_context ?? {},
    voiceContext: row.voice_context ?? {},
    governanceContext: row.governance_context ?? {},
    outputContext: row.output_context ?? {},
    freshnessAt: row.freshness_at,
    lastValidatedAt: row.last_validated_at,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBundleRecord(row: any): GovernedProofBundleRecord {
  return {
    id: row.id,
    bundleId: row.bundle_id,
    recordSystem: row.record_system,
    recordType: row.record_type,
    recordId: row.record_id,
    linkRole: row.link_role,
    confidenceScore: Number(row.confidence_score ?? 0),
    provenancePayload: row.provenance_payload ?? {},
    createdAt: row.created_at,
  };
}

function mapDensitySummary(row: DensitySummaryRow): DensitySummary {
  return {
    subjectType: row.subject_type,
    lifecycleStatus: row.lifecycle_status,
    promotionStatus: row.promotion_status,
    bundleCount: Number(row.bundle_count ?? 0),
    highConfidenceCount: Number(row.high_confidence_count ?? 0),
    freshCount: Number(row.fresh_count ?? 0),
    avgConfidence: row.avg_confidence != null ? Number(row.avg_confidence) : null,
  };
}

export class GovernedProofService {
  private readonly supabase = getClient();

  async createTask(input: CreateGovernedProofTaskInput): Promise<GovernedProofTask> {
    const { data, error } = await this.supabase
      .from('governed_proof_tasks')
      .insert({
        task_type: input.taskType,
        queue_lane: input.queueLane ?? 'core',
        priority: input.priority ?? 'medium',
        owner_system: input.ownerSystem ?? 'SHARED',
        system_scope: input.systemScope ?? ['SHARED'],
        target_type: input.targetType,
        target_id: input.targetId,
        value_score: input.valueScore ?? 0,
        confidence_required: input.confidenceRequired ?? 0.8,
        input_payload: input.inputPayload ?? {},
        acceptance_checks: input.acceptanceChecks ?? [],
        review_status: input.reviewStatus ?? 'not_required',
        promotion_status: input.promotionStatus ?? 'draft',
      })
      .select('*')
      .single();

    if (error) throw error;
    return mapTask(data);
  }

  async completeTask(input: {
    taskId: string;
    reviewStatus?: GovernedProofReviewStatus;
    promotionStatus?: GovernedProofPromotionStatus;
  }): Promise<GovernedProofTask> {
    const { data, error } = await this.supabase
      .from('governed_proof_tasks')
      .update({
        status: 'completed',
        review_status: input.reviewStatus,
        promotion_status: input.promotionStatus,
        completed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', input.taskId)
      .select('*')
      .single();

    if (error) throw error;
    return mapTask(data);
  }

  async failTask(taskId: string, lastError: string): Promise<GovernedProofTask> {
    const { data: existing, error: existingError } = await this.supabase
      .from('governed_proof_tasks')
      .select('attempt_count')
      .eq('id', taskId)
      .single();

    if (existingError) throw existingError;

    const { data, error } = await this.supabase
      .from('governed_proof_tasks')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        last_error: lastError,
        attempt_count: (existing?.attempt_count ?? 0) + 1,
      })
      .eq('id', taskId)
      .select('*')
      .single();

    if (error) throw error;
    return mapTask(data);
  }

  async logRun(input: LogGovernedProofRunInput): Promise<GovernedProofRun> {
    const { data, error } = await this.supabase
      .from('governed_proof_runs')
      .insert({
        task_id: input.taskId,
        agent_role: input.agentRole,
        provider: input.provider,
        model: input.model,
        prompt_version: input.promptVersion,
        strategy_version: input.strategyVersion,
        input_hash: input.inputHash,
        output_hash: input.outputHash,
        result_status: input.resultStatus ?? 'success',
        eval_score: input.evalScore,
        confidence_delta: input.confidenceDelta,
        cost_usd: input.costUsd,
        duration_ms: input.durationMs,
        notes: input.notes,
        run_payload: input.runPayload ?? {},
      })
      .select('*')
      .single();

    if (error) throw error;
    return mapRun(data);
  }

  async upsertBundle(input: UpsertGovernedProofBundleInput): Promise<GovernedProofBundle> {
    const { data, error } = await this.supabase
      .from('governed_proof_bundles')
      .upsert(
        {
          bundle_key: input.bundleKey,
          subject_type: input.subjectType,
          subject_id: input.subjectId,
          owner_system: input.ownerSystem ?? 'SHARED',
          lifecycle_status: input.lifecycleStatus ?? 'raw',
          review_status: input.reviewStatus ?? 'not_required',
          promotion_status: input.promotionStatus ?? 'draft',
          overall_confidence: input.overallConfidence ?? 0,
          capital_confidence: input.capitalConfidence,
          evidence_confidence: input.evidenceConfidence,
          voice_confidence: input.voiceConfidence,
          governance_confidence: input.governanceConfidence,
          capital_context: input.capitalContext ?? {},
          evidence_context: input.evidenceContext ?? {},
          voice_context: input.voiceContext ?? {},
          governance_context: input.governanceContext ?? {},
          output_context: input.outputContext ?? {},
          freshness_at: input.freshnessAt,
          last_validated_at: input.lastValidatedAt,
          published_at: input.publishedAt,
        },
        { onConflict: 'bundle_key' }
      )
      .select('*')
      .single();

    if (error) throw error;
    return mapBundle(data);
  }

  async attachBundleRecords(
    inputs: AttachGovernedProofBundleRecordInput[]
  ): Promise<GovernedProofBundleRecord[]> {
    if (inputs.length === 0) return [];

    const { data, error } = await this.supabase
      .from('governed_proof_bundle_records')
      .upsert(
        inputs.map((input) => ({
          bundle_id: input.bundleId,
          record_system: input.recordSystem,
          record_type: input.recordType,
          record_id: input.recordId,
          link_role: input.linkRole,
          confidence_score: input.confidenceScore ?? 0.7,
          provenance_payload: input.provenancePayload ?? {},
        })),
        { onConflict: 'bundle_id,record_system,record_type,record_id,link_role' }
      )
      .select('*');

    if (error) throw error;
    return (data ?? []).map(mapBundleRecord);
  }

  async getBundleByKey(bundleKey: string): Promise<GovernedProofBundle | null> {
    const { data, error } = await this.supabase
      .from('governed_proof_bundles')
      .select('*')
      .eq('bundle_key', bundleKey)
      .maybeSingle();

    if (error) throw error;
    return data ? mapBundle(data) : null;
  }

  async updateBundleStatus(input: {
    bundleId: string;
    reviewStatus?: GovernedProofReviewStatus;
    promotionStatus?: GovernedProofPromotionStatus;
    lifecycleStatus?: GovernedProofBundle['lifecycleStatus'];
  }): Promise<GovernedProofBundle> {
    const updatePayload: Record<string, unknown> = {};
    if (input.reviewStatus) updatePayload.review_status = input.reviewStatus;
    if (input.promotionStatus) updatePayload.promotion_status = input.promotionStatus;
    if (input.lifecycleStatus) updatePayload.lifecycle_status = input.lifecycleStatus;

    const { data, error } = await this.supabase
      .from('governed_proof_bundles')
      .update(updatePayload)
      .eq('id', input.bundleId)
      .select('*')
      .single();

    if (error) throw error;
    return mapBundle(data);
  }

  async listBundleRecords(bundleId: string): Promise<GovernedProofBundleRecord[]> {
    const { data, error } = await this.supabase
      .from('governed_proof_bundle_records')
      .select('*')
      .eq('bundle_id', bundleId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapBundleRecord);
  }

  async queueRepairRefreshTask(
    input: QueueRepairRefreshTaskInput
  ): Promise<{ task: GovernedProofTask; reusedExistingTask: boolean }> {
    const { data: existingTask, error: existingTaskError } = await this.supabase
      .from('governed_proof_tasks')
      .select('*')
      .eq('task_type', 'refresh_bundle')
      .eq('queue_lane', 'repair')
      .eq('target_type', input.targetType)
      .eq('target_id', input.targetId)
      .in('status', ['queued', 'claimed', 'running', 'blocked'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingTaskError) throw existingTaskError;

    if (existingTask) {
      return {
        task: mapTask(existingTask),
        reusedExistingTask: true,
      };
    }

    const valueScore =
      input.overallConfidence != null
        ? Number((1 - Math.min(Math.max(input.overallConfidence, 0), 1)).toFixed(3))
        : 0.5;

    const task = await this.createTask({
      taskType: 'refresh_bundle',
      queueLane: 'repair',
      priority: valueScore >= 0.25 ? 'high' : 'medium',
      ownerSystem: 'SHARED',
      systemScope: ['GS', 'JH', 'EL', 'SHARED'],
      targetType: input.targetType,
      targetId: input.targetId,
      valueScore,
      confidenceRequired: 0.85,
      inputPayload: {
        bundleId: input.bundleId ?? null,
        currentReviewStatus: input.currentReviewStatus ?? null,
        requestedBy: input.actorId ?? null,
        requestedAt: new Date().toISOString(),
        requestedVia: 'justicehub-admin',
        reason:
          input.reason ??
          'Operator requested repair refresh for low-confidence or review-pending governed-proof bundle.',
      },
      acceptanceChecks: [
        'bundle_refreshed',
        'confidence_recomputed',
        'review_state_reassessed',
      ],
      reviewStatus: 'pending',
      promotionStatus: 'internal',
    });

    return {
      task,
      reusedExistingTask: false,
    };
  }

  async listHotLaneTasks(): Promise<GovernedProofTask[]> {
    const { data, error } = await this.supabase
      .from('v_governed_proof_hot_lane')
      .select('*');

    if (error) throw error;
    return (data ?? []).map(mapTask);
  }

  async listDensitySummary(): Promise<DensitySummary[]> {
    const { data, error } = await this.supabase
      .from('v_governed_proof_density_summary')
      .select('*');

    if (error) throw error;
    return ((data ?? []) as DensitySummaryRow[]).map(mapDensitySummary);
  }
}

export function createGovernedProofService() {
  return new GovernedProofService();
}
