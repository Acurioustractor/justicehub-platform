# Supabase Local-Only Migration Audit: Batch 2

## Scope

This is the second audit batch for the remaining local-only Supabase migrations in the JusticeHub repo after the initial lineage cleanup.

- Project ref: `tednluwflfhxyucgwigh`
- Focus: next 10 local-only migrations after batch 1
- Goal: identify safe `applied` repairs versus migrations that are only partial, superseded, or genuinely missing

## Batch

1. `20250122000001_add_organization_links.sql`
2. `20250122000002_create_art_innovation_table.sql`
3. `20250123000001_create_unified_profiles_system.sql`
4. `20250123000002_profile_editing_rls.sql`
5. `20250124000003_create_blog_system.sql`
6. `20250125000000_fix_storage_policies.sql`
7. `20250126000000_create_media_library.sql`
8. `20250126000001_add_reading_time_to_blog_posts.sql`
9. `20250126000002_fix_blog_posts_rls.sql`
10. `20250126000003_add_coordinates_to_international_programs.sql`

## Findings

### 1) `20250122000001_add_organization_links.sql`

Status: not safe to mark as applied

Reason:

- The migration targets `community_programs` and adds `organization_id` and `service_id`.
- Remote verification did not show `community_programs` in the current public table set.
- The expected `community_programs.organization_id` and `community_programs.service_id` columns were not present.
- The index names `idx_community_programs_organization_id` and `idx_community_programs_service_id` do exist remotely, but they are attached to `registered_services`, not `community_programs`.

Assessment:

- This migration is not represented remotely in the form the file describes.
- The reused index names on a different table are a signal to avoid blind repair.

### 2) `20250122000002_create_art_innovation_table.sql`

Status: fully verified and recorded as applied

Reason:

- `art_innovation` exists remotely.
- All expected functional columns from the migration are present, including:
  - core fields like `title`, `slug`, `type`, `status`
  - content/media fields like `tagline`, `description`, `story`, `impact`, `featured_image_url`, `video_url`
  - relational fields like `organization_id`, `program_id`
  - search field `search_vector`
- All named indexes from the migration are present.
- All three named RLS policies from the migration are present.
- The `update_art_innovation_updated_at` trigger is present.
- RLS is enabled on the table.

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 3) `20250123000001_create_unified_profiles_system.sql`

Status: partially represented, not safe to mark as applied

Reason:

- Remote verification showed these key tables exist:
  - `public_profiles`
  - `art_innovation_profiles`
  - `services_profiles`
  - `article_related_art`
  - `article_related_programs`
  - `article_related_services`
  - `article_related_articles`
  - `story_related_art`
  - `story_related_programs`
  - `story_related_services`
- The file’s `ALTER TABLE` additions also exist:
  - `authors.public_profile_id`
  - `profile_appearances.public_profile_id`
- Triggers on `public_profiles` are present:
  - `trigger_update_public_profiles_updated_at`
  - `trigger_generate_public_profile_slug`
- However, `community_programs_profiles` was not present remotely.

Assessment:

- Most of the migration is represented, but not all of it.
- The missing `community_programs_profiles` table is enough to make blind repair unsafe.

### 4) `20250123000002_profile_editing_rls.sql`

Status: fully verified and recorded as applied

Reason:

- The exact public-profile policies created by this migration are present:
  - `Anyone can view public profiles`
  - `Users can view own profile`
  - `Users can update own profile`
  - `Users can create own profile`
  - `Service role full access`
  - `Admins can view all profiles`
  - `Admins can update any profile`
  - `Admins can delete profiles`
- The exact storage image policies created by this migration are present on `storage.objects`:
  - `Public image access`
  - `Authenticated users upload images`
  - `Users update own images`
  - `Users delete own images`
  - `Service role manages all images`
  - `Admins manage all images update`
  - `Admins manage all images delete`
- The helper function `is_admin()` exists remotely.

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 5) `20250124000003_create_blog_system.sql`

Status: partially represented, not safe to mark as applied

Reason:

- The core tables exist:
  - `blog_posts`
  - `blog_media`
  - `blog_content_links`
  - `blog_comments`
- At least one expected index (`idx_blog_posts_slug`) exists.
- However, the following exact objects from this migration were not present in the sampled verification:
  - `Published blog posts are viewable by everyone`
  - `Blog media inherits post permissions`
  - `Blog links inherit post permissions`
  - `trigger_blog_posts_updated_at`

Assessment:

- This migration has meaningful overlap, but not enough to safely record as fully applied.

### 6) `20250125000000_fix_storage_policies.sql`

Status: not safe to mark as applied

Reason:

- The exact `story-images` storage policy names from this migration were not present on `storage.objects`:
  - `Allow authenticated upload to story-images`
  - `Allow public read from story-images`
  - `Allow authenticated update in story-images`
  - `Allow authenticated delete from story-images`

Assessment:

- This migration is not represented remotely under the policy names and scope defined in the file.

### 7) `20250126000000_create_media_library.sql`

Status: fully verified and recorded as applied

Reason:

- `media_library` exists remotely.
- All expected functional columns from the migration are present.
- All named indexes from the migration are present.
- All five named RLS policies from the migration are present.
- The `media_library_updated_at` trigger is present.
- RLS is enabled on the table.

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 8) `20250126000001_add_reading_time_to_blog_posts.sql`

Status: partially represented, not safe to mark as applied

Reason:

- `blog_posts.reading_time_minutes` exists remotely.
- However, the remote column metadata did not show the `DEFAULT 1` defined in this migration.

Assessment:

- The column exists, but the migration effect is not fully represented as written.
- This should not be marked as applied blindly.

### 9) `20250126000002_fix_blog_posts_rls.sql`

Status: fully verified and recorded as applied

Reason:

- The three exact policy names from the migration are present on `blog_posts`:
  - `Users can view their own blog posts`
  - `Authenticated users can create blog posts`
  - `Users can update their own blog posts`
- The live `qual` and `with_check` definitions match the migration’s intended logic:
  - ownership resolves through `public_profiles.user_id = auth.uid()`
  - co-author access resolves through `ANY(co_authors)`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 10) `20250126000003_add_coordinates_to_international_programs.sql`

Status: not safe to mark as applied

Reason:

- `international_programs` exists remotely.
- The expected `latitude` and `longitude` columns were not present.
- The expected `idx_international_programs_coordinates` index was not present.

Assessment:

- This migration is not represented remotely.

## Batch Outcome

From this second batch:

- Repaired after full verification:
  - `20250122000002`
  - `20250123000002`
  - `20250126000000`
  - `20250126000002`
- Clear "not safe to mark applied":
  - `20250122000001`
  - `20250123000001`
  - `20250124000003`
  - `20250125000000`
  - `20250126000001`
  - `20250126000003`

## Result After Batch 2

After these repairs:

- `local_only=97`
- `remote_only=0`

## Recommended Next Step

Continue with batch 3, prioritizing:

1. Small additive schema migrations that are easy to verify.
2. RLS-only migrations with exact policy names and definitions.
3. Avoid broad foundational migrations until narrow candidates are exhausted.
