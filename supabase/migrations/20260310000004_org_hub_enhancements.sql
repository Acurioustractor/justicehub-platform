-- Org Hub Enhancements: Deadlines, issue flagging, grant health view
-- Migrates bgfit-specific features into org_* schema

-- 1. org_deadlines: Reporting and compliance deadlines per grant
CREATE TABLE IF NOT EXISTS org_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  grant_id UUID REFERENCES org_grants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  deadline_type TEXT DEFAULT 'report', -- report, acquittal, milestone, compliance, progress_report, bas, oric_annual, other
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, overdue, submitted
  submitted_date DATE,
  requirements TEXT,
  document_url TEXT,
  reminder_days_before INTEGER DEFAULT 14,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add issue flagging to budget lines
ALTER TABLE org_grant_budget_lines
  ADD COLUMN IF NOT EXISTS has_issue BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS issue_severity TEXT CHECK (issue_severity IN ('low', 'medium', 'high', 'critical')),
  ADD COLUMN IF NOT EXISTS issue_notes TEXT;

-- 3. Add grant status and approved_amount
ALTER TABLE org_grants
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended', 'draft', 'acquitting', 'acquitted', 'closed')),
  ADD COLUMN IF NOT EXISTS approved_amount NUMERIC(12,2);

-- 4. Urgency view for deadlines
CREATE OR REPLACE VIEW v_org_upcoming_deadlines AS
SELECT d.*,
  d.due_date - CURRENT_DATE AS days_until_due,
  CASE
    WHEN d.status IN ('completed', 'submitted') THEN 'done'
    WHEN d.due_date < CURRENT_DATE THEN 'overdue'
    WHEN d.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'urgent'
    WHEN d.due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'upcoming'
    ELSE 'future'
  END AS urgency,
  g.grant_name, g.funder_name
FROM org_deadlines d
LEFT JOIN org_grants g ON g.id = d.grant_id
ORDER BY d.due_date;

-- 5. Grant health view (mirrors v_bgfit_grant_health)
CREATE OR REPLACE VIEW v_org_grant_health AS
SELECT
  g.id, g.grant_name, g.funder_name, g.organization_id,
  COALESCE(g.approved_amount, g.amount_awarded) AS approved_amount,
  g.amount_awarded, g.contract_start, g.contract_end, g.status,
  COALESCE(b.total_budgeted, 0) AS total_budgeted,
  COALESCE(b.total_actual, 0) AS total_spent,
  COALESCE(g.approved_amount, g.amount_awarded, 0) - COALESCE(b.total_actual, 0) AS remaining_budget,
  COALESCE(i.issues_count, 0) AS issues_count
FROM org_grants g
LEFT JOIN (
  SELECT grant_id, SUM(budgeted_amount) AS total_budgeted, SUM(actual_amount) AS total_actual
  FROM org_grant_budget_lines GROUP BY grant_id
) b ON b.grant_id = g.id
LEFT JOIN (
  SELECT bl.grant_id, COUNT(*) AS issues_count
  FROM org_grant_budget_lines bl WHERE bl.has_issue = TRUE GROUP BY bl.grant_id
) i ON i.grant_id = g.id;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_deadlines_org ON org_deadlines(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_deadlines_due ON org_deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_org_deadlines_grant ON org_deadlines(grant_id);
CREATE INDEX IF NOT EXISTS idx_org_deadlines_status ON org_deadlines(status);

-- RLS
ALTER TABLE org_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read org_deadlines" ON org_deadlines FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY org_deadlines_service ON org_deadlines FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER set_updated_at_org_deadlines BEFORE UPDATE ON org_deadlines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
