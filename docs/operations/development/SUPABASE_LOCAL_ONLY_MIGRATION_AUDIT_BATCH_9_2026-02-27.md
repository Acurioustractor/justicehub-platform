# Supabase Local-Only Migration Audit: Batch 9

## Scope

This batch focused on the next compact user-profile trigger and stories-to-programs linkage migrations.

- Project ref: `tednluwflfhxyucgwigh`
- Focus: small trigger and additive schema migrations only
- Goal: keep auditing narrow candidates before moving into larger restore and seed bundles

## Subset Audited

1. `20260111000003_auto_create_user_profiles.sql`
2. `20260111000005_link_stories_to_programs.sql`

Deferred for a later pass:

- `20260117000005_basecamp_enrichment_data.sql`
- `20260117000006_real_video_urls.sql`
- `20260117000007_basecamp_photos.sql`
- `20260117000008_first_wave_organizations.sql`

## Findings

### 1) `20260111000003_auto_create_user_profiles.sql`

Status: not safe to mark as applied

Reason:

- The live trigger exists:
  - `auth.users` trigger `on_auth_user_created`
- The live function exists:
  - `public.handle_new_user()`
- But the live function behavior is materially different from the migration:
  - live function inserts into `public.profiles`
  - the migration inserts into `public.users` and `public.public_profiles`
  - the migration also includes local-dev mock auth schema setup that is not relevant to the hosted project

Assessment:

- This migration appears to have been superseded by a different implementation.
- It should remain unrepaired unless a later lineage decision explicitly maps it to the newer profile model.

### 2) `20260111000005_link_stories_to_programs.sql`

Status: not safe to mark as applied

Reason:

- The remote schema does not currently represent the migration:
  - `public.community_programs` was not present in the live check
  - `public.stories.program_id` was not present
  - `idx_stories_program_id` was not present
  - `public.programs_with_stories` view was not present

Assessment:

- This migration is not represented remotely.

## Batch Outcome

From this ninth batch:

- Repaired after full verification:
  - none
- Clear "not safe to mark applied":
  - `20260111000003`
  - `20260111000005`

## Result After Batch 9

After this audit:

- `local_only=78`
- `remote_only=0`

## Recommended Next Step

Continue with the same filter:

1. Treat superseded trigger/function implementations as drift, not safe matches.
2. Skip data-only content migrations until the underlying structural tables are confirmed.
3. Keep searching for compact additive schema migrations in later batches.
