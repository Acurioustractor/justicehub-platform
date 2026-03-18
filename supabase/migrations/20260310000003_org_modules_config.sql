-- BG Fit — fix view aggregation, add missing columns, fix RLS policies
-- Applied to hosted Supabase (not via psql — use SQL Editor or MCP)

-- 1. Add organization_id to tables missing it
ALTER TABLE bgfit_suppliers
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)
  DEFAULT '11111111-1111-1111-1111-111111111004';

ALTER TABLE bgfit_financial_periods
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)
  DEFAULT '11111111-1111-1111-1111-111111111004';

-- 2. Recreate grant health view with organization_id and fixed aggregation
-- Original view had cross-join between transactions and budget_items causing inflated totals
DROP VIEW IF EXISTS v_bgfit_grant_health CASCADE;
CREATE VIEW v_bgfit_grant_health AS
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

-- 3. Service role RLS policies (idempotent — skip if already exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bgfit_grants_service' AND tablename = 'bgfit_grants') THEN
    CREATE POLICY "bgfit_grants_service" ON bgfit_grants FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bgfit_budget_items_service' AND tablename = 'bgfit_budget_items') THEN
    CREATE POLICY "bgfit_budget_items_service" ON bgfit_budget_items FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bgfit_transactions_service' AND tablename = 'bgfit_transactions') THEN
    CREATE POLICY "bgfit_transactions_service" ON bgfit_transactions FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bgfit_financial_periods_service' AND tablename = 'bgfit_financial_periods') THEN
    CREATE POLICY "bgfit_financial_periods_service" ON bgfit_financial_periods FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bgfit_suppliers_service' AND tablename = 'bgfit_suppliers') THEN
    CREATE POLICY "bgfit_suppliers_service" ON bgfit_suppliers FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bgfit_deadlines_service' AND tablename = 'bgfit_deadlines') THEN
    CREATE POLICY "bgfit_deadlines_service" ON bgfit_deadlines FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- 4. Authenticated user policies — org members can SELECT
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bgfit_grants_org_read' AND tablename = 'bgfit_grants') THEN
    CREATE POLICY "bgfit_grants_org_read" ON bgfit_grants FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = bgfit_grants.organization_id
        AND om.user_id = auth.uid()
      )
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bgfit_budget_items_org_read' AND tablename = 'bgfit_budget_items') THEN
    CREATE POLICY "bgfit_budget_items_org_read" ON bgfit_budget_items FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM bgfit_grants g
        JOIN organization_members om ON om.organization_id = g.organization_id
        WHERE g.id = bgfit_budget_items.grant_id
        AND om.user_id = auth.uid()
      )
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bgfit_transactions_org_read' AND tablename = 'bgfit_transactions') THEN
    CREATE POLICY "bgfit_transactions_org_read" ON bgfit_transactions FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM bgfit_grants g
        JOIN organization_members om ON om.organization_id = g.organization_id
        WHERE g.id = bgfit_transactions.grant_id
        AND om.user_id = auth.uid()
      )
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bgfit_deadlines_org_read' AND tablename = 'bgfit_deadlines') THEN
    CREATE POLICY "bgfit_deadlines_org_read" ON bgfit_deadlines FOR SELECT USING (
      grant_id IS NULL OR EXISTS (
        SELECT 1 FROM bgfit_grants g
        JOIN organization_members om ON om.organization_id = g.organization_id
        WHERE g.id = bgfit_deadlines.grant_id
        AND om.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 5. Admin ALL policies (org admins can write)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bgfit_grants_org_admin' AND tablename = 'bgfit_grants') THEN
    CREATE POLICY "bgfit_grants_org_admin" ON bgfit_grants FOR ALL USING (
      EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = bgfit_grants.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
      )
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bgfit_budget_items_org_admin' AND tablename = 'bgfit_budget_items') THEN
    CREATE POLICY "bgfit_budget_items_org_admin" ON bgfit_budget_items FOR ALL USING (
      EXISTS (
        SELECT 1 FROM bgfit_grants g
        JOIN organization_members om ON om.organization_id = g.organization_id
        WHERE g.id = bgfit_budget_items.grant_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
      )
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bgfit_transactions_org_admin' AND tablename = 'bgfit_transactions') THEN
    CREATE POLICY "bgfit_transactions_org_admin" ON bgfit_transactions FOR ALL USING (
      EXISTS (
        SELECT 1 FROM bgfit_grants g
        JOIN organization_members om ON om.organization_id = g.organization_id
        WHERE g.id = bgfit_transactions.grant_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
      )
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bgfit_deadlines_org_admin' AND tablename = 'bgfit_deadlines') THEN
    CREATE POLICY "bgfit_deadlines_org_admin" ON bgfit_deadlines FOR ALL USING (
      grant_id IS NULL OR EXISTS (
        SELECT 1 FROM bgfit_grants g
        JOIN organization_members om ON om.organization_id = g.organization_id
        WHERE g.id = bgfit_deadlines.grant_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
      )
    );
  END IF;
END $$;
