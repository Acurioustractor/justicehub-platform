# Funding Operating System Core Manual Migration Record

## Summary

This records the manual application of the Funding Operating System Core schema to the linked Supabase project for JusticeHub.

- Project ref: `tednluwflfhxyucgwigh`
- Project URL: `https://tednluwflfhxyucgwigh.supabase.co`
- Applied on: February 28, 2026
- Method: Supabase Management API `POST /v1/projects/{project_ref}/database/query`
- Follow-up: `supabase migration repair --status applied 20260228000001`

## SQL Applied

The following migration file was applied manually:

1. [20260228000001_funding_operating_system_core.sql](../../../supabase/migrations/20260228000001_funding_operating_system_core.sql)

## Result

The following core schema objects are now live in the remote database:

### Tables

- `funding_sources`
- `funding_programs`
- `public_spending_transactions`
- `funding_awards`
- `organization_capability_profiles`
- `organization_capability_signals`
- `community_outcome_definitions`
- `funding_outcome_commitments`
- `funding_outcome_updates`
- `community_outcome_validations`
- `funding_agent_workflows`
- `funding_match_recommendations`

### Views

- `v_funding_award_community_accountability`
- `v_agentic_funding_queue`

### Functions

- `set_funding_os_updated_at()`
- `calculate_funding_match_score(p_opportunity_id uuid, p_organization_id uuid)`

## Verification

The following checks were confirmed after application:

- all 12 new tables exist
- both operational views exist
- both new functions exist
- index families exist on each new table
- RLS policies exist on each new table
- migration version `20260228000001` is recorded as `applied` in remote migration history

## Operational Note

This migration is directly tied to the mission-critical product shift:

- track real funding sources and programs
- link public spending to actual awards
- make community organizations discoverable by capability
- connect awards to community-defined outcomes
- validate outcomes with community
- support agentic matching and reporting workflows

This is a mission-aligned schema addition, not generic maintenance.

## Related Documents

- [Funding Operating System Core Spec (2026-02-28)](../../specs/FUNDING_OPERATING_SYSTEM_CORE_2026-02-28.md)
- [Supabase Migration History Re-baseline Blocker (2026-02-27)](./SUPABASE_MIGRATION_HISTORY_REBASELINE_BLOCKER_2026-02-27.md)
