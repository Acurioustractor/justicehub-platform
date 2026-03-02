# Supabase Local-Only Migration Audit: Batch 3

## Scope

This batch focused only on narrow migrations that were cheap to verify: additive columns, simple relationship tables, a small audit-log bundle, and two isolated ALMA migrations.

- Project ref: `tednluwflfhxyucgwigh`
- Focus: targeted repair candidates after batch 2
- Goal: reduce local-only history with high-confidence, low-risk repairs

## Batch

1. `20250126000004_add_empathy_ledger_linking.sql`
2. `20250126000005_add_organizations_profiles.sql`
3. `20250126000006_add_content_suggestions.sql`
4. `20250126000007_add_profile_organization_location.sql`
5. `20250126000008_add_empathy_content_sync.sql`
6. `20250126000009_enhance_articles_for_unification.sql`
7. `20250131000004_fix_portfolio_signals_function.sql`
8. `20250131000005_alma_ingestion_jobs.sql`

## Findings

### 1) `20250126000004_add_empathy_ledger_linking.sql`

Status: partially represented, not safe to mark as applied

Reason:

- Present remotely:
  - `public_profiles` columns:
    - `empathy_ledger_profile_id`
    - `synced_from_empathy_ledger`
    - `sync_type`
    - `last_synced_at`
  - `organizations` columns:
    - `empathy_ledger_org_id`
    - `synced_from_empathy_ledger`
    - `last_synced_at`
  - tables:
    - `profile_sync_log`
    - `organization_sync_log`
  - index:
    - `idx_public_profiles_empathy_ledger_id`
- Missing from the sampled verification:
  - `public_profiles_sync_type_check`
  - `idx_public_profiles_synced_from_empathy`
  - `idx_organizations_empathy_ledger_id`
  - `idx_organizations_synced_from_empathy`
  - `idx_community_programs_empathy_ledger_id`

Assessment:

- The migration has meaningful overlap, but not enough to safely record as fully applied.

### 2) `20250126000005_add_organizations_profiles.sql`

Status: fully verified and recorded as applied

Reason:

- `organizations_profiles` exists with the full expected working column set.
- `blog_posts_profiles` exists with the full expected working column set.
- All named indexes from the migration are present.
- `update_organizations_profiles_updated_at` is present.

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 3) `20250126000006_add_content_suggestions.sql`

Status: fully verified and recorded as applied

Reason:

- `content_link_suggestions` exists with the full expected working column set.
- `suggestion_feedback` exists with the full expected column set.
- All named indexes from the migration are present.
- `update_suggestions_updated_at` is present.

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 4) `20250126000007_add_profile_organization_location.sql`

Status: fully verified and recorded as applied

Reason:

- `public_profiles.current_organization` exists.
- `public_profiles.location` exists.
- Both named indexes are present:
  - `idx_profiles_current_organization`
  - `idx_profiles_location`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 5) `20250126000008_add_empathy_content_sync.sql`

Status: fully verified and recorded as applied

Reason:

- All expected `blog_posts` columns exist:
  - `empathy_ledger_transcript_id`
  - `empathy_ledger_story_id`
  - `synced_from_empathy_ledger`
  - `video_url`
  - `audio_url`
  - `cultural_sensitivity_flag`
- All named indexes are present:
  - `idx_blog_posts_empathy_transcript`
  - `idx_blog_posts_empathy_story`
  - `idx_blog_posts_synced_empathy`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 6) `20250126000009_enhance_articles_for_unification.sql`

Status: fully verified and recorded as applied

Reason:

- All expected `articles` columns exist:
  - `featured_image_caption`
  - `co_authors`
  - `tags`
  - `share_count`
  - `categories`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 7) `20250131000004_fix_portfolio_signals_function.sql`

Status: fully verified and recorded as applied

Reason:

- `calculate_portfolio_signals` exists remotely.
- The live function definition includes the fixed signature:
  - `calculate_portfolio_signals(p_intervention_id uuid)`
- The live function body also includes the fixed clause:
  - `WHERE i.id = p_intervention_id`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 8) `20250131000005_alma_ingestion_jobs.sql`

Status: fully verified and recorded as applied

Reason:

- `alma_ingestion_jobs` exists with the full expected working column set.
- All named indexes are present:
  - `idx_alma_ingestion_jobs_status`
  - `idx_alma_ingestion_jobs_created_at`
  - `idx_alma_ingestion_jobs_source_url`
- `update_alma_ingestion_jobs_updated_at` exists.
- `trigger_update_alma_ingestion_jobs_updated_at` exists.

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

## Batch Outcome

From this third batch:

- Repaired after full verification:
  - `20250126000005`
  - `20250126000006`
  - `20250126000007`
  - `20250126000008`
  - `20250126000009`
  - `20250131000004`
  - `20250131000005`
- Clear "not safe to mark applied":
  - `20250126000004`

## Result After Batch 3

After these repairs:

- `local_only=90`
- `remote_only=0`

## Recommended Next Step

Continue with the next narrow candidates before returning to large composite migrations:

1. Prefer additive column migrations and isolated function fixes.
2. Leave broad ALMA foundation and cross-table schema bundles for a separate, slower audit pass.
