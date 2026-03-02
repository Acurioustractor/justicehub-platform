# Supabase Local-Only Migration Audit: Batch 8

## Scope

This batch focused on the next narrow service and sync migrations around service views, local story sync, and organization partner classification.

- Project ref: `tednluwflfhxyucgwigh`
- Focus: contained view and additive schema migrations only
- Goal: continue shrinking local-only history without touching the broader restore and seed migrations

## Subset Audited

1. `20260113000001_add_coords_to_services_view.sql`
2. `20260113100001_create_unified_services_view.sql`
3. `20260117000001_create_story_sync_tables.sql`
4. `20260117000004_add_partner_tier.sql`

Deferred for a later pass:

- `20260111000003_auto_create_user_profiles.sql`
- `20260111000005_link_stories_to_programs.sql`
- `20260111000006_restore_initiatives_and_profiles.sql`
- `20260111000007_seed_mount_druitt_campaign.sql`
- `20260111000008_seed_mount_druitt_events.sql`
- `20260111000009_seed_mount_druitt_events_simple.sql`
- `20260111000010_seed_oonchiumpa_programs.sql`
- `20260117000002_seed_alma_relationships_v2.sql`
- `20260117000003_alma_research_agent_infrastructure.sql`

## Findings

### 1) `20260113000001_add_coords_to_services_view.sql`

Status: fully verified and recorded as applied

Reason:

- The live `services_complete` view includes the intended coordinate fields:
  - `s.latitude AS location_latitude`
  - `s.longitude AS location_longitude`
- The rest of the view shape remains aligned with the migration's purpose.

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 2) `20260113100001_create_unified_services_view.sql`

Status: not safe to mark as applied

Reason:

- The live `services_unified` view exists, but it does not match the migration closely enough:
  - it uses `registered_services` rather than `community_programs`
  - it includes an added `infrastructure_type` field not present in the migration
  - the second union branch is materially different from the migration's structure
- The live `get_unified_services_stats()` function still reports `from_community_programs`, which does not align cleanly with the live view's `registered_services` branch.

Assessment:

- This is a real drift case, not an exact representation of the migration as written.

### 3) `20260117000001_create_story_sync_tables.sql`

Status: not safe to mark as applied

Reason:

- The expected tables were not present in the remote verification:
  - `sync_metadata`
  - `synced_stories`
- The related indexes, policies, and triggers were also absent.

Assessment:

- This migration is not represented remotely.

### 4) `20260117000004_add_partner_tier.sql`

Status: not safe to mark as applied

Reason:

- The remote schema only partially reflects the migration:
  - `organizations.partner_tier` exists
- But the other intended schema objects were absent:
  - `organizations.basecamp_since`
  - `organizations.territory`
  - index `idx_organizations_partner_tier`
  - view `basecamps`

Assessment:

- This migration is only partially represented remotely and should remain unrepaired.

## Batch Outcome

From this eighth batch:

- Repaired after full verification:
  - `20260113000001`
- Clear "not safe to mark applied":
  - `20260113100001`
  - `20260117000001`
  - `20260117000004`

## Result After Batch 8

After this repair:

- `local_only=78`
- `remote_only=0`

Note:

- A new remote-only migration version `20260227234809` appeared during this pass.
- It was normalized locally by adding:
  - `supabase/migrations/20260227234809_remote_history_placeholder.sql`

## Recommended Next Step

Continue with the same filter:

1. Prefer additive columns, compact views, and isolated schema changes.
2. Treat material view or function drift as a blocker for blind history repair.
3. Keep restores, seeds, and broader ALMA foundation migrations in the slower review track.
