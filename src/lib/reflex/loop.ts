/**
 * Reflex Loop — pure helpers for transitioning the three nouns.
 *
 * No I/O. No Supabase. No fetch. Pure functions that take a loop and return
 * a new loop. Persistence is the caller's job (funding code uses funding-os,
 * practice code uses practice-reflex.ts, evidence-export composes both).
 *
 * Why pure: it lets us unit-test the state machine without touching the DB,
 * and it lets callers batch DB writes however they want.
 */

import type {
  ReflexEvent,
  ReflexEventType,
  ReflexLoop,
  ReflexOutcome,
  ReflexOutcomeKind,
  ReflexTask,
  ReflexTaskPriority,
  ReflexTaskStatus,
} from './types';

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export interface CreateTaskInput {
  source: string;
  title: string;
  description?: string | null;
  organizationId?: string | null;
  ownerId?: string | null;
  priority?: ReflexTaskPriority;
  dueAt?: string | null;
  payload?: Record<string, unknown>;
}

export function createTask(input: CreateTaskInput): ReflexLoop {
  const now = nowIso();
  const task: ReflexTask = {
    id: uid('task'),
    source: input.source,
    title: input.title,
    description: input.description ?? null,
    organizationId: input.organizationId ?? null,
    ownerId: input.ownerId ?? null,
    status: 'queued',
    priority: input.priority ?? 'medium',
    dueAt: input.dueAt ?? null,
    createdAt: now,
    updatedAt: now,
    payload: input.payload,
  };
  const firstEvent: ReflexEvent = {
    id: uid('evt'),
    taskId: task.id,
    occurredAt: now,
    type: 'created',
    actorId: input.ownerId ?? 'system',
  };
  return { task, events: [firstEvent], outcome: null };
}

export interface AppendEventInput {
  type: ReflexEventType;
  actorId: string;
  note?: string | null;
  payload?: Record<string, unknown>;
  /** Optional new status to transition the task to in the same step. */
  newStatus?: ReflexTaskStatus;
}

export function appendEvent(loop: ReflexLoop, input: AppendEventInput): ReflexLoop {
  const now = nowIso();
  const event: ReflexEvent = {
    id: uid('evt'),
    taskId: loop.task.id,
    occurredAt: now,
    type: input.type,
    actorId: input.actorId,
    note: input.note ?? null,
    payload: input.payload,
  };
  const updatedTask: ReflexTask = {
    ...loop.task,
    status: input.newStatus ?? loop.task.status,
    updatedAt: now,
  };
  return { ...loop, task: updatedTask, events: [...loop.events, event] };
}

export interface RecordOutcomeInput {
  kind: ReflexOutcomeKind;
  label?: string | null;
  evidenceRef?: string | null;
  followUpTaskId?: string | null;
  payload?: Record<string, unknown>;
  /** When true the parent task transitions to 'completed'. Defaults to true. */
  closeTask?: boolean;
}

export function recordOutcome(loop: ReflexLoop, input: RecordOutcomeInput): ReflexLoop {
  const now = nowIso();
  const outcome: ReflexOutcome = {
    id: uid('out'),
    taskId: loop.task.id,
    recordedAt: now,
    kind: input.kind,
    label: input.label ?? null,
    evidenceRef: input.evidenceRef ?? null,
    followUpTaskId: input.followUpTaskId ?? null,
    payload: input.payload,
  };
  const close = input.closeTask !== false;
  const updatedTask: ReflexTask = {
    ...loop.task,
    status: close ? 'completed' : loop.task.status,
    updatedAt: now,
  };
  const closedEvent: ReflexEvent | null = close
    ? {
        id: uid('evt'),
        taskId: loop.task.id,
        occurredAt: now,
        type: 'completed',
        actorId: 'system',
        note: input.label ?? null,
      }
    : null;
  return {
    task: updatedTask,
    events: closedEvent ? [...loop.events, closedEvent] : loop.events,
    outcome,
  };
}

/**
 * Convenience derived properties for UI rendering.
 */
export function loopIsOpen(loop: ReflexLoop): boolean {
  return loop.task.status !== 'completed' && loop.task.status !== 'cancelled';
}

export function loopIsOverdue(loop: ReflexLoop, nowMs = Date.now()): boolean {
  if (!loopIsOpen(loop)) return false;
  if (!loop.task.dueAt) return false;
  const due = Date.parse(loop.task.dueAt);
  return Number.isFinite(due) && due < nowMs;
}

export function lastEvent(loop: ReflexLoop): ReflexEvent | null {
  if (!loop.events.length) return null;
  return loop.events[loop.events.length - 1];
}
