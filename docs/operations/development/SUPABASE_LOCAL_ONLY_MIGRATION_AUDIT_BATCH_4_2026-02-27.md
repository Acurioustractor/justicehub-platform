# Supabase Local-Only Migration Audit: Batch 4

## Scope

This batch focused on two narrow article fixes and the next small ALMA add-on migrations after the January 2025/January 2026 batches.

- Project ref: `tednluwflfhxyucgwigh`
- Focus: article policy/constraint fixes plus narrow ALMA add-ons
- Goal: continue reducing local-only migration history without touching broad composite migrations

## Batch

1. `20250206000001_fix_articles_rls_policies.sql`
2. `20250206000002_fix_articles_author_fkey.sql`
3. `20250207000001_fix_articles_null_author.sql`
4. `20250209000000_add_alma_sources_table.sql`
5. `20250209000001_update_broken_source_urls.sql`
6. `20250209000002_add_empathy_ledger_stories.sql`
7. `20250213000000_fix_alma_source_urls.sql`
8. `20260101000001_add_consent_level_to_jobs.sql`
9. `20260101000002_add_media_sentiment_tracking.sql`
10. `20260101000003_add_unique_indexes_for_views.sql`

## Findings

### 1) `20250206000001_fix_articles_rls_policies.sql`

Status: fully verified and recorded as applied

Reason:

- The exact policies created by this migration are present on `articles`:
  - `Authenticated users can insert articles`
  - `Users can update their own articles`
  - `Users can delete their own articles`
  - `Users can view their own articles`
- The live policy logic matches the migration intent:
  - insert policy uses `WITH CHECK (true)`
  - ownership checks resolve via `public_profiles.user_id = auth.uid()`
  - authenticated reads allow `status = 'published'` or owned content

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 2) `20250206000002_fix_articles_author_fkey.sql`

Status: fully verified and recorded as applied

Reason:

- `articles_author_id_fkey` exists on `articles`.
- The foreign key points to `public_profiles`, which matches the migration target.

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 3) `20250207000001_fix_articles_null_author.sql`

Status: not safe to mark as applied

Reason:

- The replacement policy from this migration was not present:
  - `Users can update their own articles or claim orphaned articles`
- The older policy still exists instead:
  - `Users can update their own articles`

Assessment:

- The orphan-claiming update policy has not been applied as written.

### 4) `20250209000000_add_alma_sources_table.sql`

Status: not safe to mark as applied

Reason:

- The remote verification did not show the core table:
  - `alma_sources`
- As a result, the associated indexes, policies, and trigger from this migration were also not present.

Assessment:

- This migration is not represented remotely.

### 5) `20250209000001_update_broken_source_urls.sql`

Status: not safe to mark as applied

Reason:

- This is a data-update migration against `alma_sources`.
- The base `alma_sources` table is not present remotely.

Assessment:

- This migration cannot be treated as applied.

### 6) `20250209000002_add_empathy_ledger_stories.sql`

Status: not safe to mark as applied

Reason:

- The remote verification did not show the core objects created by this migration:
  - `empathy_ledger_stories`
  - `story_intervention_links`
  - `story_sync_analytics`
  - `stories_with_interventions`
  - `story_analytics_summary`
- The additive `alma_interventions` columns from this migration were also not present:
  - `story_count`
  - `narrative_score`

Assessment:

- This migration is not represented remotely.

### 7) `20250213000000_fix_alma_source_urls.sql`

Status: not safe to mark as applied

Reason:

- This is a data-update migration against `alma_sources`.
- The base `alma_sources` table is not present remotely.

Assessment:

- This migration cannot be treated as applied.

### 8) `20260101000001_add_consent_level_to_jobs.sql`

Status: fully verified and recorded as applied

Reason:

- The expected `alma_ingestion_jobs` columns exist:
  - `consent_level`
  - `cultural_authority`
  - `category`
- The expected indexes exist:
  - `idx_alma_ingestion_jobs_consent_level`
  - `idx_alma_ingestion_jobs_category`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 9) `20260101000002_add_media_sentiment_tracking.sql`

Status: fully verified and recorded as applied

Reason:

- The expected tables exist:
  - `alma_media_articles`
  - `alma_government_programs`
  - `alma_program_interventions`
- The expected working column sets were confirmed across those tables.
- The expected materialized views exist:
  - `alma_daily_sentiment`
  - `alma_sentiment_program_correlation`
- The expected indexes exist:
  - `idx_alma_media_articles_published_date`
  - `idx_alma_media_articles_sentiment`
  - `idx_alma_media_articles_source`
  - `idx_alma_media_articles_topics`
  - `idx_alma_government_programs_announced_date`
  - `idx_alma_government_programs_community_led`
- The helper function exists:
  - `refresh_sentiment_analytics`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 10) `20260101000003_add_unique_indexes_for_views.sql`

Status: fully verified and recorded as applied

Reason:

- The expected unique index exists:
  - `idx_alma_daily_sentiment_unique`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

## Batch Outcome

From this fourth batch:

- Repaired after full verification:
  - `20250206000001`
  - `20250206000002`
  - `20260101000001`
  - `20260101000002`
  - `20260101000003`
- Clear "not safe to mark applied":
  - `20250207000001`
  - `20250209000000`
  - `20250209000001`
  - `20250209000002`
  - `20250213000000`

## Result After Batch 4

After these repairs:

- `local_only=85`
- `remote_only=0`

Note:

- A new remote-only migration version `20260227232618` appeared during this pass.
- It was normalized locally by adding:
  - `supabase/migrations/20260227232618_remote_history_placeholder.sql`

## Recommended Next Step

Continue with the next narrow migrations, prioritizing:

1. Small additive schema migrations.
2. Isolated constraint/function/index fixes.
3. Leave absent ALMA source/story bundles for explicit future application rather than history repair.
