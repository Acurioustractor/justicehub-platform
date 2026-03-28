-- Evidence Maturation Log
-- Tracks proposed evidence level changes for human review.
-- Populated by the evidence-maturation cron agent.

CREATE TABLE alma_maturation_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  intervention_id uuid REFERENCES alma_interventions(id),
  current_level text NOT NULL,
  proposed_level text NOT NULL,
  evidence_summary text,
  evidence_count integer DEFAULT 0,
  cost_data_available boolean DEFAULT false,
  confidence numeric DEFAULT 0,
  reviewed boolean DEFAULT false,
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_maturation_log_intervention ON alma_maturation_log(intervention_id);
CREATE INDEX idx_maturation_log_unreviewed ON alma_maturation_log(reviewed) WHERE NOT reviewed;
