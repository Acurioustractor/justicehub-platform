ALTER TABLE public.agent_task_queue
  DROP CONSTRAINT IF EXISTS agent_task_queue_status_check;

ALTER TABLE public.agent_task_queue
  ADD CONSTRAINT agent_task_queue_status_check
  CHECK (
    status IN (
      'open',
      'queued',
      'pending',
      'running',
      'in_progress',
      'done',
      'completed',
      'failed',
      'cancelled',
      'dismissed',
      'snoozed'
    )
  );
