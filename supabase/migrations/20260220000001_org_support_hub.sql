-- Org Support Hub: 9 tables for grassroots org management
-- Grants, compliance, sessions, participants, referrals, milestones, action items

-- 1. org_grants: Active grant contracts
CREATE TABLE IF NOT EXISTS org_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  funder_name TEXT NOT NULL,
  grant_name TEXT NOT NULL,
  amount_awarded NUMERIC(12,2),
  contract_start DATE,
  contract_end DATE,
  reporting_system TEXT, -- e.g. 'DEX', 'SmartyGrants', 'manual'
  acquittal_due_date DATE,
  acquittal_status TEXT DEFAULT 'pending' CHECK (acquittal_status IN ('pending', 'in_progress', 'submitted', 'approved')),
  portal_url TEXT,
  application_id UUID REFERENCES alma_funding_applications(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. org_grant_budget_lines: Budget categories per grant
CREATE TABLE IF NOT EXISTS org_grant_budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID NOT NULL REFERENCES org_grants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- e.g. 'Staffing', 'Equipment', 'Travel'
  description TEXT,
  budgeted_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. org_grant_transactions: Individual receipts/payments
CREATE TABLE IF NOT EXISTS org_grant_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_line_id UUID REFERENCES org_grant_budget_lines(id) ON DELETE SET NULL,
  grant_id UUID NOT NULL REFERENCES org_grants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  transaction_type TEXT DEFAULT 'expense' CHECK (transaction_type IN ('expense', 'income', 'adjustment')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. org_compliance_docs: Blue Cards, ORIC, insurance, child safety
CREATE TABLE IF NOT EXISTS org_compliance_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'blue_card', 'oric', 'insurance', 'child_safety', 'abn', 'other'
  title TEXT NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'current', 'expiring', 'expired')),
  document_url TEXT,
  issued_date DATE,
  expiry_date DATE,
  reminder_days INTEGER DEFAULT 30,
  holder_name TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. org_sessions: Gym, camps, school visits, mentoring
CREATE TABLE IF NOT EXISTS org_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  session_type TEXT, -- 'gym', 'camp', 'school_visit', 'mentoring', 'workshop', 'event', 'other'
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  location TEXT,
  duration_hours NUMERIC(4,1),
  staff_count INTEGER DEFAULT 0,
  elder_present BOOLEAN DEFAULT FALSE,
  participant_count INTEGER DEFAULT 0,
  photo_urls TEXT[] DEFAULT '{}',
  voice_memo_url TEXT,
  outcome_summary TEXT,
  grant_id UUID REFERENCES org_grants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. org_participants: De-identified participant registry
CREATE TABLE IF NOT EXISTS org_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  participant_ref TEXT NOT NULL, -- unique per org, e.g. 'P001'
  age_range TEXT, -- '10-14', '15-17', '18-24', '25+'
  gender_category TEXT, -- 'male', 'female', 'non-binary', 'prefer_not_to_say'
  referral_source TEXT, -- 'self', 'school', 'court', 'family', 'community', 'other'
  consent_status TEXT DEFAULT 'verbal' CHECK (consent_status IN ('verbal', 'written', 'guardian', 'withdrawn')),
  engagement_status TEXT DEFAULT 'active' CHECK (engagement_status IN ('active', 'inactive', 'completed', 'referred_out')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, participant_ref)
);

-- 7. org_referrals: Inbound/outbound referrals
CREATE TABLE IF NOT EXISTS org_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  referral_type TEXT, -- 'formal', 'informal', 'warm_handover'
  source_org_name TEXT,
  target_org_name TEXT,
  participant_ref TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  outcome TEXT,
  referral_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. org_milestones: Participant outcomes
CREATE TABLE IF NOT EXISTS org_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  participant_ref TEXT,
  milestone_type TEXT NOT NULL, -- 'attendance', 'skill', 'behaviour', 'education', 'employment', 'housing', 'health', 'cultural', 'other'
  milestone_date DATE DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  evidence TEXT,
  grant_id UUID REFERENCES org_grants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. org_action_items: Actionable queue (agent + manual)
CREATE TABLE IF NOT EXISTS org_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'compliance', 'grant', 'reporting', 'session', 'referral', 'general'
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'dismissed', 'snoozed')),
  due_date DATE,
  source_agent TEXT, -- 'pulse', 'compliance_check', 'grant_match', null for manual
  link_to_table TEXT, -- e.g. 'org_compliance_docs', 'org_grants'
  link_to_id UUID,
  snoozed_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_grants_org ON org_grants(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_grants_acquittal_due ON org_grants(acquittal_due_date);
CREATE INDEX IF NOT EXISTS idx_org_grant_budget_lines_grant ON org_grant_budget_lines(grant_id);
CREATE INDEX IF NOT EXISTS idx_org_grant_transactions_grant ON org_grant_transactions(grant_id);
CREATE INDEX IF NOT EXISTS idx_org_grant_transactions_date ON org_grant_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_org_compliance_docs_org ON org_compliance_docs(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_compliance_docs_expiry ON org_compliance_docs(expiry_date);
CREATE INDEX IF NOT EXISTS idx_org_sessions_org ON org_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_sessions_date ON org_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_org_participants_org ON org_participants(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_referrals_org ON org_referrals(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_milestones_org ON org_milestones(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_action_items_org ON org_action_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_action_items_status ON org_action_items(status);
CREATE INDEX IF NOT EXISTS idx_org_action_items_priority ON org_action_items(priority);

-- RLS
ALTER TABLE org_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_grant_budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_grant_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_compliance_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_action_items ENABLE ROW LEVEL SECURITY;

-- Admin read policies (admin users can read all)
CREATE POLICY "Admins can read org_grants" ON org_grants FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can read org_grant_budget_lines" ON org_grant_budget_lines FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can read org_grant_transactions" ON org_grant_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can read org_compliance_docs" ON org_compliance_docs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can read org_sessions" ON org_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can read org_participants" ON org_participants FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can read org_referrals" ON org_referrals FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can read org_milestones" ON org_milestones FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can read org_action_items" ON org_action_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Service role has full access (writes go through service client)
-- No additional policies needed; service role bypasses RLS

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at_org_grants BEFORE UPDATE ON org_grants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_org_grant_budget_lines BEFORE UPDATE ON org_grant_budget_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_org_compliance_docs BEFORE UPDATE ON org_compliance_docs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_org_sessions BEFORE UPDATE ON org_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_org_participants BEFORE UPDATE ON org_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_org_referrals BEFORE UPDATE ON org_referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_org_action_items BEFORE UPDATE ON org_action_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
