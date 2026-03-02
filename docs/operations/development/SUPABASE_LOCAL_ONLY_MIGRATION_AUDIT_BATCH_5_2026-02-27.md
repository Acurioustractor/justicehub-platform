# Supabase Local-Only Migration Audit: Batch 5

## Scope

This batch targeted a narrow subset of the next ALMA migrations, focusing only on the low-risk candidates: one materialized-view fix, one funding-data bundle, and one function-only bundle.

- Project ref: `tednluwflfhxyucgwigh`
- Focus: targeted subset of the next ALMA tranche
- Goal: keep shrinking local-only history while avoiding broad ALMA foundation/unification migrations

## Subset Audited

1. `20260101000004_fix_materialized_views.sql`
2. `20260102000002_alma_funding_data.sql`
3. `20260103164614_alma_signal_functions.sql`

Deferred for a later, slower pass:

- `20260102000001_alma_learning_system.sql`
- `20260102_alma_unification_links.sql`
- `20260103000001_alma_enhanced_data_model.sql`

## Findings

### 1) `20260101000004_fix_materialized_views.sql`

Status: fully verified and recorded as applied

Reason:

- `alma_daily_sentiment` includes the corrected working column set, including:
  - `mixed_count`
- `alma_sentiment_program_correlation` exists with the expected working columns.
- The expected unique indexes exist:
  - `idx_alma_daily_sentiment_unique`
  - `idx_alma_sentiment_program_correlation_unique`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 2) `20260102000002_alma_funding_data.sql`

Status: fully verified and recorded as applied

Reason:

- `alma_funding_data` exists with the expected working column set.
- The expected indexes exist:
  - `idx_funding_jurisdiction`
  - `idx_funding_year`
  - `idx_funding_type`
- The expected view exists:
  - `alma_cost_analysis`
- The expected functions exist with matching signatures:
  - `calculate_community_investment_score(p_jurisdiction text)`
  - `calculate_potential_savings(p_young_people_diverted integer, p_detention_cost_per_day numeric, p_community_cost_per_day numeric, p_avg_detention_days integer)`
- The expected policies exist:
  - `read_funding_data`
  - `admin_funding_data`
- The seeded Productivity Commission row is present:
  - source URL `https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice/`
  - jurisdiction `National`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 3) `20260103164614_alma_signal_functions.sql`

Status: not safe to mark as applied

Reason:

- The signal functions exist:
  - `calculate_evidence_signal`
  - `calculate_community_authority_signal`
  - `calculate_harm_risk_signal`
  - `calculate_implementation_signal`
  - `calculate_option_value_signal`
  - `calculate_portfolio_score`
- However, the live `calculate_portfolio_score` signature diverges from the migration:
  - live signature uses `calculate_portfolio_score(int_id uuid)`
  - the migration defines `calculate_portfolio_score(intervention_id UUID)`

Assessment:

- Even though the function family exists, the signature drift means this migration is not safely represented as written.
- It should remain unrepaired unless later audit confirms a deliberate superseding change.

## Batch Outcome

From this fifth batch:

- Repaired after full verification:
  - `20260101000004`
  - `20260102000002`
- Clear "not safe to mark applied":
  - `20260103164614`

## Result After Batch 5

After these repairs:

- `local_only=83`
- `remote_only=0`

## Recommended Next Step

Continue with the next narrow migrations, but keep the same filter:

1. Prefer isolated schema fixes, additive columns, and small object bundles.
2. Treat broad ALMA framework/unification migrations as separate review work.
3. Treat signature drift as a blocker for blind history repair, even when object names exist.
