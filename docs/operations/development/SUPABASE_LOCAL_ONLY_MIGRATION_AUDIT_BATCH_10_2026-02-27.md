# Supabase Local-Only Migration Audit: Batch 10

## Scope

This batch focused on the next compact profile/admin and partner media migrations.

- Project ref: `tednluwflfhxyucgwigh`
- Focus: additive columns, constraints, indexes, and narrowly-scoped data updates
- Goal: keep shrinking local-only history using exact schema and row verification

## Subset Audited

1. `20260119000002_add_is_super_admin.sql`
2. `20260119000003_update_photo_types.sql`
3. `20260119000004_add_video_placement.sql`
4. `20260119000005_descript_thumbnails.sql`
5. `20260119100001_basecamp_location_data.sql`

Deferred for a later pass:

- `20260119000001_grant_test_admin.sql`
- `20260117000005_basecamp_enrichment_data.sql`
- `20260117000006_real_video_urls.sql`
- `20260117000007_basecamp_photos.sql`
- `20260117000008_first_wave_organizations.sql`

## Findings

### 1) `20260119000002_add_is_super_admin.sql`

Status: not safe to mark as applied

Reason:

- The additive column exists:
  - `profiles.is_super_admin`
- But the expected supporting index was absent:
  - `idx_profiles_is_super_admin`

Assessment:

- This migration is only partially represented remotely.
- It should remain unrepaired unless the missing index is confirmed to be intentionally omitted.

### 2) `20260119000003_update_photo_types.sql`

Status: fully verified and recorded as applied

Reason:

- The live `partner_photos_photo_type_check` constraint exists.
- Its allowed values match the migration intent:
  - new values: `card_thumbnail`, `hero_banner`, `gallery`, `team`, `location`, `program`
  - legacy compatibility values: `hero`, `profile`, `event`, `site`, `general`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 3) `20260119000004_add_video_placement.sql`

Status: fully verified and recorded as applied

Reason:

- The additive column exists:
  - `partner_videos.video_placement`
- The supporting index exists:
  - `idx_partner_videos_placement`
- The live row state is aligned with the migration's data update:
  - all featured videos use `video_placement = 'featured'`
  - non-featured rows default to `gallery`

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 4) `20260119000005_descript_thumbnails.sql`

Status: not safe to mark as applied

Reason:

- The five target Descript URLs exist in `partner_videos`.
- But the migration's intended row state is not present:
  - matched rows: `5`
  - rows with `platform = 'descript'` and a non-null `thumbnail_url`: `0`

Assessment:

- This data migration is not represented remotely.

### 5) `20260119100001_basecamp_location_data.sql`

Status: fully verified and recorded as applied

Reason:

- All four target organizations were present and their intended updated values were confirmed:
  - `oonchiumpa`: `city='Alice Springs'`, `state='NT'`, `latitude=-23.698`, `longitude=133.880`
  - `bg-fit`: `location='Mount Isa, QLD'`, `latitude=-20.725`, `longitude=139.498`
  - `mounty-yarns`: `location='Mount Druitt (Western Sydney), NSW'`, `latitude=-33.770`, `longitude=150.820`
  - `picc-townsville`: `location='Townsville, QLD'`, `latitude=-19.26`, `longitude=146.82`

Assessment:

- This migration's data effects were sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

## Batch Outcome

From this tenth batch:

- Repaired after full verification:
  - `20260119000003`
  - `20260119000004`
  - `20260119100001`
- Clear "not safe to mark applied":
  - `20260119000002`
  - `20260119000005`

## Result After Batch 10

After these repairs:

- `local_only=75`
- `remote_only=0`

## Recommended Next Step

Continue with the same filter:

1. Prefer additive schema and small row-state migrations where the exact effect can be verified directly.
2. Treat partial schema representation, especially missing supporting indexes, as a blocker.
3. Leave broader seeded content and enrichment bundles for the slower review track.
