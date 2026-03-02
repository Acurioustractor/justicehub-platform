# Supabase Local-Only Migration Audit: Batch 11

## Scope

This batch focused on the next contained structural migrations for Centre of Excellence content and ALMA funding/reporting infrastructure.

- Project ref: `tednluwflfhxyucgwigh`
- Focus: table creation bundles with explicit indexes, triggers, functions, and policies
- Goal: keep shrinking local-only history where the remote schema already fully reflects the migration intent

## Subset Audited

1. `20260118000001_create_australian_frameworks.sql`
2. `20260118000002_create_research_items.sql`
3. `20260120000001_alma_funding_opportunities.sql`
4. `20260120000002_alma_weekly_reports.sql`

## Findings

### 1) `20260118000001_create_australian_frameworks.sql`

Status: fully verified and recorded as applied

Reason:

- `australian_frameworks` exists remotely.
- The expected index family exists:
  - `idx_australian_frameworks_state`
  - `idx_australian_frameworks_display_order`
  - `idx_australian_frameworks_slug`
  - `idx_australian_frameworks_active`
- The expected policies exist:
  - `Public read active frameworks`
  - `Service role manage frameworks`
  - `Authenticated users can insert frameworks`
  - `Authenticated users can update frameworks`
  - `Authenticated users can delete frameworks`
- The expected trigger exists:
  - `update_australian_frameworks_updated_at`
- Representative columns were confirmed:
  - `slug`
  - `state`
  - `outcomes`
  - `resources`
  - `display_order`
  - `is_active`
  - `latitude`
  - `longitude`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 2) `20260118000002_create_research_items.sql`

Status: fully verified and recorded as applied

Reason:

- `research_items` exists remotely.
- The enum types exist:
  - `research_category`
  - `research_jurisdiction`
  - `research_type`
- The expected index family exists, including:
  - `idx_research_items_category`
  - `idx_research_items_jurisdiction`
  - `idx_research_items_type`
  - `idx_research_items_year`
  - `idx_research_items_featured`
  - `idx_research_items_active`
  - `idx_research_items_tags`
  - `idx_research_items_slug`
  - `idx_research_items_search`
- The expected policies exist:
  - `Public read active research`
  - `Service role manage research`
  - `Authenticated users can insert research`
  - `Authenticated users can update research`
  - `Authenticated users can delete research`
- The expected trigger exists:
  - `update_research_items_updated_at`
- Representative columns were confirmed:
  - `slug`
  - `organization`
  - `category`
  - `jurisdiction`
  - `type`
  - `summary`
  - `is_featured`
  - `is_active`
  - `display_order`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 3) `20260120000001_alma_funding_opportunities.sql`

Status: fully verified and recorded as applied

Reason:

- The expected tables exist:
  - `alma_funding_opportunities`
  - `alma_funding_applications`
- The expected index families exist for both tables.
- The expected views exist:
  - `v_funding_pipeline`
  - `v_funders_summary`
- The expected functions exist:
  - `update_funding_opportunities_timestamp()`
  - `update_funding_opportunity_status()`
- The expected triggers exist:
  - `trigger_funding_opportunities_updated`
  - `trigger_funding_status_update`
  - `trigger_funding_applications_updated`
- Representative columns were confirmed on both tables, including:
  - `funder_name`
  - `source_type`
  - `deadline`
  - `jurisdictions`
  - `focus_areas`
  - `source_id`
  - `relevance_score`
  - `opportunity_id`
  - `organization_id`
  - `status`
  - `amount_requested`
  - `internal_match_score`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 4) `20260120000002_alma_weekly_reports.sql`

Status: fully verified and recorded as applied

Reason:

- The expected tables exist:
  - `alma_weekly_reports`
  - `alma_report_subscriptions`
  - `alma_report_deliveries`
- The expected index families exist across all three tables.
- The expected function exists:
  - `generate_weekly_report_data(p_week_start date, p_organization_id uuid)`
- The expected trigger exists:
  - `trigger_weekly_reports_updated`
- Representative columns were confirmed, including:
  - `week_start`
  - `report_type`
  - `organization_id`
  - `funding_section`
  - `stats_snapshot`
  - `status`
  - `user_id`
  - `email`
  - `report_types`
  - `frequency`
  - `delivery_method`
  - `is_active`
  - `report_id`
  - `subscription_id`
  - `recipient_email`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

## Batch Outcome

From this eleventh batch:

- Repaired after full verification:
  - `20260118000001`
  - `20260118000002`
  - `20260120000001`
  - `20260120000002`

## Result After Batch 11

After these repairs and remote-history normalization:

- `local_only=71`
- `remote_only=0`

Note:

- A new remote-only migration version `20260227235611` appeared during this pass.
- It was normalized locally by adding:
  - `supabase/migrations/20260227235611_remote_history_placeholder.sql`

## Recommended Next Step

Continue with the same filter:

1. Prefer contained infrastructure bundles where tables, indexes, triggers, and functions can all be verified directly.
2. Keep seed-heavy and restore-heavy bundles out of the fast path unless their row state is simple to prove.
