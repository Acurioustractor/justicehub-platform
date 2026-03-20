/**
 * Shared pipeline stage definitions used by:
 * - /api/admin/partner-pipeline (server)
 * - /api/admin/campaign-alignment/momentum (server)
 * - /admin/campaign-engine page (client)
 *
 * Single source of truth for status ↔ stage mapping.
 */

export const PIPELINE_STAGES = [
  'cold',
  'warm',
  'proposal',
  'committed',
  'active',
  'stale',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

/** Map outreach_status DB values → pipeline stage */
export const STATUS_TO_STAGE: Record<string, PipelineStage> = {
  not_started: 'cold',
  identified: 'cold',
  pending: 'cold',
  nominated: 'warm',
  contacted: 'warm',
  responded: 'proposal',
  in_discussion: 'proposal',
  proposal_sent: 'proposal',
  meeting_scheduled: 'committed',
  committed: 'committed',
  active: 'active',
  engaged: 'active',
  stale: 'stale',
  declined: 'stale',
};

/** Map pipeline stage → canonical outreach_status for DB writes */
export const STAGE_TO_STATUS: Record<string, string> = {
  cold: 'not_started',
  warm: 'contacted',
  proposal: 'proposal_sent',
  committed: 'committed',
  active: 'active',
  stale: 'stale',
};

/** Ordered progression of stages (excluding stale) for "advance" logic */
export const STAGE_ORDER: PipelineStage[] = ['cold', 'warm', 'proposal', 'committed', 'active'];

/**
 * Get the next pipeline stage for a given outreach_status.
 * Returns the outreach_status value (not stage name) for the next stage.
 */
export function getNextStatus(currentOutreachStatus: string): string {
  const currentStage = STATUS_TO_STAGE[currentOutreachStatus] || 'cold';
  const idx = STAGE_ORDER.indexOf(currentStage as PipelineStage);
  const nextStage = STAGE_ORDER[Math.min(idx + 1, STAGE_ORDER.length - 1)];
  return STAGE_TO_STATUS[nextStage];
}

/** All known outreach_status values with display labels */
export const OUTREACH_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', stage: 'cold' as PipelineStage },
  { value: 'contacted', label: 'Contacted', stage: 'warm' as PipelineStage },
  { value: 'responded', label: 'Responded', stage: 'proposal' as PipelineStage },
  { value: 'proposal_sent', label: 'Proposal Sent', stage: 'proposal' as PipelineStage },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled', stage: 'committed' as PipelineStage },
  { value: 'committed', label: 'Committed', stage: 'committed' as PipelineStage },
  { value: 'active', label: 'Active', stage: 'active' as PipelineStage },
] as const;
