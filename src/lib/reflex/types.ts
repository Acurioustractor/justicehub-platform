/**
 * Reflex Loop Primitive — Core Types
 *
 * The reflex loop is the only working operational pattern in JusticeHub today
 * (extracted from src/app/funding/conversations/[taskId] and
 * src/app/admin/funding/os/followups). It is three nouns:
 *
 *   Task     — something a human owes a system (with owner + due date + status)
 *   Event    — something that happened against a task (response, contact, note)
 *   Outcome  — the consequence we record (with optional link to evidence)
 *
 * This module is intentionally tiny and additive. Existing funding flow code
 * keeps working unchanged. New code (Practice surface, evidence-export bundle,
 * Empathy Ledger accountability events) imports these primitives so the shape
 * is shared.
 *
 * DO NOT import application-specific helpers in here. Keep this layer pure.
 */

export type ReflexTaskStatus =
  | 'queued'
  | 'pending'
  | 'running'
  | 'awaiting_response'
  | 'completed'
  | 'cancelled'
  | 'blocked';

export type ReflexTaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ReflexTask<TPayload = Record<string, unknown>> {
  /** Stable id (uuid or domain-specific gs_id style). */
  id: string;
  /** Source surface or service that owns the task. Examples: 'funding', 'practice', 'compliance'. */
  source: string;
  /** Short human label. */
  title: string;
  /** Optional human description. */
  description?: string | null;
  /** Owning org slug or id. Null for self-serve / cross-org tasks. */
  organizationId?: string | null;
  /** Owning person email or user id. Null when unassigned. */
  ownerId?: string | null;
  /** Current state in the loop. */
  status: ReflexTaskStatus;
  /** Triage priority. */
  priority: ReflexTaskPriority;
  /** ISO timestamp the task is due. */
  dueAt?: string | null;
  /** ISO timestamp created. */
  createdAt: string;
  /** ISO timestamp last updated. */
  updatedAt: string;
  /** Free-form payload — funding stores opportunity ids, practice stores lane keys. */
  payload?: TPayload;
}

export type ReflexEventType =
  | 'created'
  | 'assigned'
  | 'contacted'
  | 'responded'
  | 'note'
  | 'status_changed'
  | 'escalated'
  | 'completed'
  | 'cancelled';

export interface ReflexEvent<TPayload = Record<string, unknown>> {
  id: string;
  taskId: string;
  /** When the event happened. */
  occurredAt: string;
  type: ReflexEventType;
  /** Who triggered it (user id, email, or 'system'). */
  actorId: string;
  /** Optional human note. */
  note?: string | null;
  /** Optional structured payload — funding stores responseKind, practice stores lane transitions. */
  payload?: TPayload;
}

export type ReflexOutcomeKind =
  | 'no_response'
  | 'declined'
  | 'progressed'
  | 'meeting_booked'
  | 'application_started'
  | 'application_submitted'
  | 'funded'
  | 'not_funded'
  | 'community_outcome_recorded'
  | 'evidence_attached'
  | 'other';

export interface ReflexOutcome<TPayload = Record<string, unknown>> {
  id: string;
  taskId: string;
  /** When the outcome was recorded. */
  recordedAt: string;
  kind: ReflexOutcomeKind;
  /** Optional human label. */
  label?: string | null;
  /** Optional pointer to an evidence record (story id, file id, ALMA intervention id). */
  evidenceRef?: string | null;
  /** Optional follow-up task spawned by this outcome (chains the loop). */
  followUpTaskId?: string | null;
  /** Optional structured payload. */
  payload?: TPayload;
}

/**
 * A complete loop view: task plus its full history. Useful for rendering a
 * single conversation, briefing a funder, or feeding the practice surface.
 */
export interface ReflexLoop<TTaskPayload = Record<string, unknown>> {
  task: ReflexTask<TTaskPayload>;
  events: ReflexEvent[];
  outcome?: ReflexOutcome | null;
}
