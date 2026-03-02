# Supabase Local-Only Migration Audit: Batch 6

## Scope

This batch focused on the next low-risk set after batch 5: one ALMA policy migration, one documentation-only migration, one additive profile-field migration, and one partner-enrichment schema bundle.

- Project ref: `tednluwflfhxyucgwigh`
- Focus: narrow schema and policy candidates only
- Goal: continue reducing local-only history without touching the broader week-sprint and detention bundles

## Subset Audited

1. `20260104000001_allow_public_published_community_controlled.sql`
2. `20260106000001_alma_signals_documentation.sql`
3. `20260107000001_add_metadata_to_profiles.sql`
4. `20260108000001_partner_enrichment_schema.sql`

Deferred for a later, slower pass:

- `20260104000002_alma_learning_system.sql`
- `20260106000002_week_sprint.sql`
- `20260106000003_week_sprint_tables.sql`
- `20260107000002_youth_detention_facilities.sql`
- `20260107100001_update_justicehub_nodes_partners.sql`

## Findings

### 1) `20260104000001_allow_public_published_community_controlled.sql`

Status: fully verified and recorded as applied

Reason:

- The expected replacement policy exists on `alma_interventions`:
  - `Public can view published interventions`
- The live policy logic matches the migration intent:
  - `review_status = 'Published'`
  - `consent_level IN ('Public Knowledge Commons', 'Community Controlled')`
- The older restrictive policy name was not present in the live check:
  - `Public can view published public interventions`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 2) `20260106000001_alma_signals_documentation.sql`

Status: not safe to mark as applied

Reason:

- This migration only adds comments to legacy tables:
  - `youth_profiles`
  - `empathy_ledger_entries`
- Remote verification showed neither target table exists in `public`.

Assessment:

- Because the target tables are absent, this migration is not represented remotely.

### 3) `20260107000001_add_metadata_to_profiles.sql`

Status: not safe to mark as applied

Reason:

- The target column is not present:
  - `public_profiles.metadata`
- The expected GIN index is also not present:
  - `idx_public_profiles_metadata`

Assessment:

- This migration has not been applied remotely.

### 4) `20260108000001_partner_enrichment_schema.sql`

Status: fully verified and recorded as applied

Reason:

- All expected partner tables exist:
  - `partner_videos`
  - `partner_goals`
  - `partner_contacts`
  - `partner_photos`
  - `partner_storytellers`
  - `partner_stories`
  - `partner_impact_metrics`
  - `partner_site_locations`
- The expected working column sets were confirmed across those tables.
- All named indexes from the migration are present.
- The expected public and service-role policies are present across the partner tables.
- RLS is enabled on all eight partner tables.

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

## Batch Outcome

From this sixth batch:

- Repaired after full verification:
  - `20260104000001`
  - `20260108000001`
- Clear "not safe to mark applied":
  - `20260106000001`
  - `20260107000001`

## Result After Batch 6

After these repairs:

- `local_only=81`
- `remote_only=0`

## Recommended Next Step

Continue with the same filter:

1. Prefer isolated policies, additive columns, and contained feature bundles.
2. Keep broad learning-system, week-sprint, and detention-schema migrations in a separate review track.
