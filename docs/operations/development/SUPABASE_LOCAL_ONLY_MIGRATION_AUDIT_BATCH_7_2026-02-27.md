# Supabase Local-Only Migration Audit: Batch 7

## Scope

This batch focused on the next small feature migrations around claims, quant views, event schema, and profile appearances.

- Project ref: `tednluwflfhxyucgwigh`
- Focus: contained feature migrations only
- Goal: continue shrinking local-only history without touching the larger restored/seeded content migrations

## Subset Audited

1. `20260110000001_claim_system.sql`
2. `20260110000002_quant_signals.sql`
3. `20260111000001_add_metadata_to_registrations.sql`
4. `20260111000002_add_video_to_events.sql`
5. `20260111000004_create_profile_appearances.sql`

Deferred for a later pass:

- `20260111000003_auto_create_user_profiles.sql`
- `20260111000005_link_stories_to_programs.sql`
- `20260111000006_restore_initiatives_and_profiles.sql`
- `20260111000007_seed_mount_druitt_campaign.sql`
- `20260111000008_seed_mount_druitt_events.sql`
- `20260111000009_seed_mount_druitt_events_simple.sql`
- `20260111000010_seed_oonchiumpa_programs.sql`

## Findings

### 1) `20260110000001_claim_system.sql`

Status: not safe to mark as applied

Reason:

- The target table from this migration was not present in the remote verification:
  - `community_programs_profiles`
- The added columns were therefore also absent in the live check:
  - `verification_status`
  - `verification_notes`
  - `verified_at`
  - `verified_by`
- The denormalized ALMA field was not present:
  - `alma_interventions.claimed_by_profile_id`
- The expected claim policies were not present:
  - `Users can submit claims for themselves`
  - `Users can view their own claims`

Assessment:

- This migration is not represented remotely.

### 2) `20260110000002_quant_signals.sql`

Status: not safe to mark as applied

Reason:

- The expected view was not present:
  - `view_intervention_alpha`

Assessment:

- This migration is not represented remotely.

### 3) `20260111000001_add_metadata_to_registrations.sql`

Status: fully verified and recorded as applied

Reason:

- The expected additive column exists:
  - `event_registrations.metadata`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 4) `20260111000002_add_video_to_events.sql`

Status: fully verified and recorded as applied

Reason:

- The expected additive columns exist:
  - `events.video_url`
  - `events.gallery_urls`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 5) `20260111000004_create_profile_appearances.sql`

Status: not safe to mark as applied

Reason:

- Much of the migration is represented remotely:
  - `profile_appearances` exists
  - the expected working columns exist
  - the expected indexes exist
  - the expected trigger exists
  - the expected policy names exist
- However, the live admin-write policy logic diverges from the migration:
  - live policy is a simpler `auth.jwt() ->> 'role' = 'service_role'`
  - the migration defines a broader condition using `current_setting('request.jwt.claims', true)` plus `current_user = 'postgres'` and `current_user = 'service_role'`

Assessment:

- The table exists, but the policy behavior is not represented exactly as written.
- This migration should remain unrepaired unless a later audit confirms an intentional superseding change.

## Batch Outcome

From this seventh batch:

- Repaired after full verification:
  - `20260111000001`
  - `20260111000002`
- Clear "not safe to mark applied":
  - `20260110000001`
  - `20260110000002`
  - `20260111000004`

## Result After Batch 7

After these repairs:

- `local_only=79`
- `remote_only=0`

Note:

- A new remote-only migration version `20260227233956` appeared during this pass.
- It was normalized locally by adding:
  - `supabase/migrations/20260227233956_remote_history_placeholder.sql`

## Recommended Next Step

Continue with the same filter:

1. Prefer additive columns and contained feature-table additions.
2. Treat policy logic drift as a blocker for blind history repair.
3. Keep auto-create triggers and seed/restoration migrations in the slower review track.
