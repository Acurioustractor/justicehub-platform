import {
  appendEvent,
  createTask,
  fundingConversationToReflexLoop,
  lastEvent,
  loopIsOpen,
  loopIsOverdue,
  recordOutcome,
} from '@/lib/reflex';

describe('reflex loop primitive', () => {
  it('createTask seeds a queued task with a created event', () => {
    const loop = createTask({
      source: 'practice',
      title: 'Reply to family',
      ownerId: 'sam@walumarra.org.au',
      priority: 'high',
    });
    expect(loop.task.status).toBe('queued');
    expect(loop.task.priority).toBe('high');
    expect(loop.events).toHaveLength(1);
    expect(loop.events[0].type).toBe('created');
    expect(loop.outcome).toBeNull();
    expect(loopIsOpen(loop)).toBe(true);
  });

  it('appendEvent transitions status and accumulates events', () => {
    let loop = createTask({ source: 'funding', title: 'Funder follow-up' });
    loop = appendEvent(loop, {
      type: 'contacted',
      actorId: 'ben@act.au',
      newStatus: 'awaiting_response',
    });
    expect(loop.task.status).toBe('awaiting_response');
    expect(loop.events).toHaveLength(2);
    expect(lastEvent(loop)?.type).toBe('contacted');
  });

  it('recordOutcome closes the task by default', () => {
    let loop = createTask({ source: 'funding', title: 'Funder follow-up' });
    loop = recordOutcome(loop, { kind: 'progressed', label: 'Meeting booked' });
    expect(loop.task.status).toBe('completed');
    expect(loop.outcome?.kind).toBe('progressed');
    expect(loopIsOpen(loop)).toBe(false);
  });

  it('loopIsOverdue flags past-due open tasks', () => {
    let loop = createTask({
      source: 'practice',
      title: 'Submit acquittal',
      dueAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(loopIsOverdue(loop)).toBe(true);
    loop = recordOutcome(loop, { kind: 'progressed' });
    expect(loopIsOverdue(loop)).toBe(false);
  });

  it('fundingConversationToReflexLoop projects funding records', () => {
    const loop = fundingConversationToReflexLoop({
      taskId: 'task_123',
      status: 'awaiting_response',
      title: 'Snow Foundation intro',
      respondedAt: '2026-05-20T03:00:00Z',
      responseKind: 'interested',
      responseMessage: 'Keen to chat',
      responderEmail: 'a@snow.org',
      outcomeRecordedAt: '2026-05-21T03:00:00Z',
      outcomeLabel: 'Meeting booked',
    });

    expect(loop.task.id).toBe('task_123');
    expect(loop.task.source).toBe('funding');
    expect(loop.task.status).toBe('awaiting_response');
    expect(loop.events.some((e) => e.type === 'responded')).toBe(true);
    expect(loop.outcome?.kind).toBe('progressed');
    expect(loop.outcome?.label).toBe('Meeting booked');
  });
});
