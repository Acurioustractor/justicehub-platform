ALTER TABLE public.agent_task_queue
  DROP CONSTRAINT IF EXISTS agent_task_queue_review_decision_check;

ALTER TABLE public.agent_task_queue
  ADD CONSTRAINT agent_task_queue_review_decision_check
  CHECK (
    review_decision IS NULL
    OR review_decision IN (
      'acknowledged',
      'resolved'
    )
  );
