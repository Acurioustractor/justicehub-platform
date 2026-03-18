-- BG Fit Grant Management System
-- Designed for a community org leader with no accounting background.
-- Tracks: grants received, budget line items, actual transactions, reconciliation.
-- Goal: Brodie focuses on community work, system handles the financial tracking.

-- 1. GRANTS — each funding agreement
CREATE TABLE IF NOT EXISTS bgfit_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111004',

  -- Grant identity
  grant_name TEXT NOT NULL,                    -- e.g. 'BAIL Program - YDPF'
  funder_name TEXT NOT NULL,                   -- e.g. 'Youth Development Partnership Fund'
  funder_department TEXT,                       -- e.g. 'Dept of Tourism, Innovation and Sport'
  reference_number TEXT,                        -- Enquire ref, contract number etc

  -- Money
  approved_amount NUMERIC NOT NULL,            -- Total approved (GST exc)
  gst_inclusive BOOLEAN DEFAULT false,
  received_amount NUMERIC DEFAULT 0,           -- How much actually received
  spent_amount NUMERIC DEFAULT 0,              -- Calculated from transactions

  -- Dates
  start_date DATE,
  end_date DATE,
  acquittal_due DATE,                          -- When the final report is due

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'acquitting', 'acquitted', 'closed')),

  -- Payment tranches
  tranches JSONB DEFAULT '[]',                 -- [{amount: 55000, received_date: '2025-06-01', label: 'Tranche 1'}]

  -- Reporting requirements
  reporting_requirements TEXT,                  -- What reports are needed
  reporting_frequency TEXT,                     -- 'final', 'quarterly', 'six-monthly'

  -- Links
  grantscope_funding_id UUID,                  -- Link to justice_funding in GrantScope
  source_document_url TEXT,                     -- Link to funding agreement PDF

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BUDGET LINE ITEMS — what the grant approved spending on
CREATE TABLE IF NOT EXISTS bgfit_budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID REFERENCES bgfit_grants(id) ON DELETE CASCADE NOT NULL,

  -- Budget structure
  category TEXT NOT NULL,                      -- 'Transport & Vehicles', 'Fitness & Sport', etc
  item_name TEXT NOT NULL,                     -- 'Gym Equipment', 'Fuel & maintenance'
  item_type TEXT DEFAULT 'equipment',          -- 'equipment', 'hire', 'development', 'service'

  -- Budget
  budgeted_amount NUMERIC NOT NULL,
  actual_amount NUMERIC DEFAULT 0,             -- Sum of linked transactions

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',       -- Not yet spent
    'on_track',      -- Spending matches budget
    'underspent',    -- Spent less than budgeted
    'overspent',     -- Spent more than budgeted
    'not_spent',     -- Decided not to purchase
    'not_funded',    -- Tranche not received yet
    'reallocated'    -- Budget moved to another item
  )),

  -- Supplier/receipt info
  supplier_name TEXT,
  receipt_details TEXT,                         -- Free text for receipt references

  -- Flags
  has_issue BOOLEAN DEFAULT false,
  issue_severity TEXT CHECK (issue_severity IN ('info', 'warning', 'critical')),
  issue_description TEXT,

  -- Reallocation tracking
  reallocated_from_item_id UUID REFERENCES bgfit_budget_items(id),
  reallocation_reason TEXT,

  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRANSACTIONS — actual money movements (receipts, invoices, payments)
CREATE TABLE IF NOT EXISTS bgfit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID REFERENCES bgfit_grants(id),
  budget_item_id UUID REFERENCES bgfit_budget_items(id),

  -- Transaction details
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,                   -- What was bought/paid for
  amount NUMERIC NOT NULL,                     -- Positive = expense, negative = income/refund
  gst_amount NUMERIC DEFAULT 0,

  -- Source
  transaction_type TEXT DEFAULT 'expense' CHECK (transaction_type IN (
    'expense',       -- Money out
    'income',        -- Grant money received
    'refund',        -- Money returned
    'transfer'       -- Internal movement
  )),

  -- Supplier
  supplier_name TEXT,
  supplier_abn TEXT,

  -- Receipt
  receipt_number TEXT,
  receipt_image_url TEXT,                       -- Photo of receipt
  receipt_verified BOOLEAN DEFAULT false,

  -- Reconciliation
  reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  bank_statement_ref TEXT,                     -- Reference from bank statement

  -- Source tracking (how this data got here)
  source TEXT DEFAULT 'manual' CHECK (source IN (
    'manual',        -- Entered by hand
    'spreadsheet',   -- Imported from XLSX/CSV
    'bank_csv',      -- From bank statement CSV
    'xero',          -- From Xero API
    'thriday',       -- From Thriday
    'receipt_scan'   -- From receipt photo
  )),
  source_reference TEXT,                       -- Original row/ref from import

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FINANCIAL PERIODS — P&L tracking by period
CREATE TABLE IF NOT EXISTS bgfit_financial_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_name TEXT NOT NULL,                   -- 'Q1 2025-26', 'Jul 2025'
  period_type TEXT DEFAULT 'month',            -- 'month', 'quarter', 'financial_year'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Calculated summaries
  total_income NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  net_position NUMERIC DEFAULT 0,

  -- BAS/GST
  gst_collected NUMERIC DEFAULT 0,
  gst_paid NUMERIC DEFAULT 0,
  gst_owing NUMERIC DEFAULT 0,
  bas_lodged BOOLEAN DEFAULT false,
  bas_lodged_date DATE,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUPPLIERS — track who BG Fit pays
CREATE TABLE IF NOT EXISTS bgfit_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abn TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  location TEXT,
  category TEXT,                                -- 'fuel', 'equipment', 'food', 'services', 'venue'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

-- 6. REPORTING DEADLINES — never miss a report
CREATE TABLE IF NOT EXISTS bgfit_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID REFERENCES bgfit_grants(id),

  deadline_type TEXT NOT NULL,                 -- 'progress_report', 'final_report', 'acquittal', 'bas', 'oric_annual'
  title TEXT NOT NULL,                         -- 'YDPF Final Report'
  due_date DATE NOT NULL,

  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'submitted', 'overdue', 'complete')),
  submitted_date DATE,

  -- What's needed
  requirements TEXT,
  document_url TEXT,

  -- Reminders
  reminder_days_before INTEGER DEFAULT 14,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Views for Brodie's dashboard

-- Grant health overview
CREATE OR REPLACE VIEW v_bgfit_grant_health AS
SELECT
  g.id,
  g.organization_id,
  g.grant_name,
  g.funder_name,
  g.approved_amount,
  g.received_amount,
  COALESCE(ts.total_spent, 0) as total_spent,
  g.approved_amount - COALESCE(ts.total_spent, 0) as remaining_budget,
  g.received_amount - COALESCE(ts.total_spent, 0) as cash_remaining,
  COALESCE(bi_agg.issues_count, 0) as issues_count,
  COALESCE(bi_agg.items_not_purchased, 0) as items_not_purchased,
  g.status,
  g.acquittal_due,
  g.acquittal_due - CURRENT_DATE as days_until_acquittal
FROM bgfit_grants g
LEFT JOIN (
  SELECT grant_id, SUM(amount) as total_spent
  FROM bgfit_transactions WHERE transaction_type = 'expense'
  GROUP BY grant_id
) ts ON ts.grant_id = g.id
LEFT JOIN (
  SELECT grant_id,
    COUNT(*) FILTER (WHERE has_issue) as issues_count,
    COUNT(*) FILTER (WHERE status = 'not_spent') as items_not_purchased
  FROM bgfit_budget_items
  GROUP BY grant_id
) bi_agg ON bi_agg.grant_id = g.id;

-- Budget vs actuals
CREATE OR REPLACE VIEW v_bgfit_budget_vs_actual AS
SELECT
  bi.id,
  bi.grant_id,
  g.grant_name,
  bi.category,
  bi.item_name,
  bi.budgeted_amount,
  COALESCE(SUM(t.amount), 0) as actual_amount,
  bi.budgeted_amount - COALESCE(SUM(t.amount), 0) as variance,
  CASE
    WHEN COALESCE(SUM(t.amount), 0) = 0 THEN 'not_spent'
    WHEN ABS(COALESCE(SUM(t.amount), 0) - bi.budgeted_amount) / bi.budgeted_amount < 0.1 THEN 'on_track'
    WHEN COALESCE(SUM(t.amount), 0) > bi.budgeted_amount THEN 'overspent'
    ELSE 'underspent'
  END as calculated_status,
  bi.status,
  bi.has_issue,
  bi.issue_severity,
  bi.issue_description,
  bi.supplier_name,
  bi.receipt_details
FROM bgfit_budget_items bi
JOIN bgfit_grants g ON g.id = bi.grant_id
LEFT JOIN bgfit_transactions t ON t.budget_item_id = bi.id AND t.transaction_type = 'expense'
GROUP BY bi.id, g.grant_name, g.id;

-- Upcoming deadlines
CREATE OR REPLACE VIEW v_bgfit_upcoming_deadlines AS
SELECT
  d.*,
  g.grant_name,
  g.funder_name,
  d.due_date - CURRENT_DATE as days_until_due,
  CASE
    WHEN d.status IN ('complete', 'submitted') THEN 'done'
    WHEN d.due_date < CURRENT_DATE THEN 'overdue'
    WHEN d.due_date - CURRENT_DATE <= 7 THEN 'urgent'
    WHEN d.due_date - CURRENT_DATE <= 30 THEN 'soon'
    ELSE 'upcoming'
  END as urgency
FROM bgfit_deadlines d
LEFT JOIN bgfit_grants g ON g.id = d.grant_id
ORDER BY d.due_date ASC;

-- Simple P&L view
CREATE OR REPLACE VIEW v_bgfit_pnl AS
SELECT
  date_trunc('month', t.transaction_date)::date as month,
  COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type = 'income'), 0) as income,
  COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type = 'expense'), 0) as expenses,
  COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type = 'income'), 0)
    - COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type = 'expense'), 0) as net,
  COALESCE(SUM(t.gst_amount), 0) as gst_total,
  COUNT(*) as transaction_count
FROM bgfit_transactions t
GROUP BY date_trunc('month', t.transaction_date)
ORDER BY month DESC;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bgfit_grants_org ON bgfit_grants(organization_id);
CREATE INDEX IF NOT EXISTS idx_bgfit_grants_status ON bgfit_grants(status);
CREATE INDEX IF NOT EXISTS idx_bgfit_budget_items_grant ON bgfit_budget_items(grant_id);
CREATE INDEX IF NOT EXISTS idx_bgfit_transactions_grant ON bgfit_transactions(grant_id);
CREATE INDEX IF NOT EXISTS idx_bgfit_transactions_budget_item ON bgfit_transactions(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_bgfit_transactions_date ON bgfit_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bgfit_deadlines_due ON bgfit_deadlines(due_date);

-- RLS
ALTER TABLE bgfit_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bgfit_budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bgfit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bgfit_financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE bgfit_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bgfit_deadlines ENABLE ROW LEVEL SECURITY;

-- Admin + service role access
CREATE POLICY "bgfit_grants_admin" ON bgfit_grants FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "bgfit_budget_items_admin" ON bgfit_budget_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "bgfit_transactions_admin" ON bgfit_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "bgfit_financial_periods_admin" ON bgfit_financial_periods FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "bgfit_suppliers_admin" ON bgfit_suppliers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "bgfit_deadlines_admin" ON bgfit_deadlines FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Service role policies for API/agent access
CREATE POLICY "bgfit_grants_service" ON bgfit_grants FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "bgfit_budget_items_service" ON bgfit_budget_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "bgfit_transactions_service" ON bgfit_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "bgfit_financial_periods_service" ON bgfit_financial_periods FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "bgfit_suppliers_service" ON bgfit_suppliers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "bgfit_deadlines_service" ON bgfit_deadlines FOR ALL USING (auth.role() = 'service_role');
