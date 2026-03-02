ALTER TABLE public.funding_agent_workflows
  DROP CONSTRAINT IF EXISTS funding_agent_workflows_workflow_type_check;

ALTER TABLE public.funding_agent_workflows
  ADD CONSTRAINT funding_agent_workflows_workflow_type_check
  CHECK (
    workflow_type IN (
      'source_ingest',
      'opportunity_enrichment',
      'org_profile_refresh',
      'matching',
      'award_reconciliation',
      'community_report',
      'relationship_outreach',
      'community_submission_review'
    )
  );
