# Supabase Migration History Re-baseline Blocker

## Summary

Partial migration-history normalization was completed for the JusticeHub Supabase project on February 27, 2026, but the lineage is still not safe for routine `supabase db push`.

- Project ref: `tednluwflfhxyucgwigh`
- Status: remote-only history has been normalized locally, but `71` local-only migrations still remain unmatched on the remote project

## What Was Fixed

The following cleanup work was completed:

1. Duplicate local migration version prefixes were renamed so each local migration now has a unique version.
2. Remote-only migration versions were represented locally as no-op historical placeholder files.
3. The manually applied System 0 preset migrations were marked as `applied` in remote migration history:
   - `20260227000003`
   - `20260227000004`
   - `20260227000005`
4. `20250121000001_unify_services_schema.sql` was fully verified against the remote schema and then marked as `applied`.
5. Additional targeted repairs were completed after full verification:
   - `20250122000002_create_art_innovation_table.sql`
   - `20250123000002_profile_editing_rls.sql`
   - `20250126000000_create_media_library.sql`
   - `20250126000002_fix_blog_posts_rls.sql`
6. Further narrow repairs were completed after batch-3 verification:
   - `20250126000005_add_organizations_profiles.sql`
   - `20250126000006_add_content_suggestions.sql`
   - `20250126000007_add_profile_organization_location.sql`
   - `20250126000008_add_empathy_content_sync.sql`
   - `20250126000009_enhance_articles_for_unification.sql`
   - `20250131000004_fix_portfolio_signals_function.sql`
   - `20250131000005_alma_ingestion_jobs.sql`
7. Additional narrow repairs were completed in batch 4:
   - `20250206000001_fix_articles_rls_policies.sql`
   - `20250206000002_fix_articles_author_fkey.sql`
   - `20260101000001_add_consent_level_to_jobs.sql`
   - `20260101000002_add_media_sentiment_tracking.sql`
   - `20260101000003_add_unique_indexes_for_views.sql`
8. A new remote-only migration version `20260227232618` was normalized locally with a no-op placeholder file.
9. Additional narrow repairs were completed in batch 5:
   - `20260101000004_fix_materialized_views.sql`
   - `20260102000002_alma_funding_data.sql`
10. Additional narrow repairs were completed in batch 6:
   - `20260104000001_allow_public_published_community_controlled.sql`
   - `20260108000001_partner_enrichment_schema.sql`
11. Additional narrow repairs were completed in batch 7:
   - `20260111000001_add_metadata_to_registrations.sql`
   - `20260111000002_add_video_to_events.sql`
12. A new remote-only migration version `20260227233956` was normalized locally with a no-op placeholder file.
13. An additional narrow repair was completed in batch 8:
   - `20260113000001_add_coords_to_services_view.sql`
14. A new remote-only migration version `20260227234809` was normalized locally with a no-op placeholder file.
15. Additional narrow repairs were completed in batch 10:
   - `20260119000003_update_photo_types.sql`
   - `20260119000004_add_video_placement.sql`
   - `20260119100001_basecamp_location_data.sql`
16. Additional structural repairs were completed in batch 11:
   - `20260118000001_create_australian_frameworks.sql`
   - `20260118000002_create_research_items.sql`
   - `20260120000001_alma_funding_opportunities.sql`
   - `20260120000002_alma_weekly_reports.sql`
17. A new remote-only migration version `20260227235611` was normalized locally with a no-op placeholder file.
18. The mission-aligned funding operating system core schema was manually applied and then recorded as `applied`:
   - `20260228000001_funding_operating_system_core.sql`

After that cleanup, the known mismatch moved from "remote-only plus local-only" to "local-only only".

## Remaining Blocker

The remaining issue is not remote drift. It is the set of `71` local migrations that are present in this repo but not recorded in the linked Supabase project's migration history.

That means blind use of either of these is still unsafe:

- `supabase db push`
- `supabase migration repair --status applied ...` across the full local-only set

Marking those migrations as applied without proving the remote schema already contains their changes would create false history and make future schema work less trustworthy.

## Why It Is Still Unsafe

Each local-only migration now needs a deliberate decision:

1. It already exists in the remote schema and can be safely marked as applied.
2. It does not exist remotely and must be applied for real.
3. It is obsolete and should be retired with an explicit lineage decision.

That review has not been completed yet.

## Safe Resolution Path

Before using `supabase db push` as the normal workflow again:

1. Audit the `71` local-only migrations in batches.
2. For each batch, verify whether the remote schema already includes the intended tables, columns, indexes, policies, and functions.
3. Only mark a migration as `applied` when its schema effect is already present remotely.
4. Apply any genuinely missing migrations intentionally, rather than papering over them in history.
5. Re-run `supabase migration list` and confirm local and remote versions fully align.

## Related Record

The required System 0 schema changes were applied manually first, then partially normalized into migration history. That record is here:

- [System 0 Filter Presets Manual Migration Record (2026-02-27)](./SYSTEM0_FILTER_PRESETS_MANUAL_MIGRATION_2026-02-27.md)
- [Supabase Local-Only Migration Audit: Batch 1 (2026-02-27)](./SUPABASE_LOCAL_ONLY_MIGRATION_AUDIT_BATCH_1_2026-02-27.md)
- [Supabase Local-Only Migration Audit: Batch 2 (2026-02-27)](./SUPABASE_LOCAL_ONLY_MIGRATION_AUDIT_BATCH_2_2026-02-27.md)
- [Supabase Local-Only Migration Audit: Batch 3 (2026-02-27)](./SUPABASE_LOCAL_ONLY_MIGRATION_AUDIT_BATCH_3_2026-02-27.md)
- [Supabase Local-Only Migration Audit: Batch 4 (2026-02-27)](./SUPABASE_LOCAL_ONLY_MIGRATION_AUDIT_BATCH_4_2026-02-27.md)
- [Supabase Local-Only Migration Audit: Batch 5 (2026-02-27)](./SUPABASE_LOCAL_ONLY_MIGRATION_AUDIT_BATCH_5_2026-02-27.md)
- [Supabase Local-Only Migration Audit: Batch 6 (2026-02-27)](./SUPABASE_LOCAL_ONLY_MIGRATION_AUDIT_BATCH_6_2026-02-27.md)
- [Supabase Local-Only Migration Audit: Batch 7 (2026-02-27)](./SUPABASE_LOCAL_ONLY_MIGRATION_AUDIT_BATCH_7_2026-02-27.md)
- [Supabase Local-Only Migration Audit: Batch 8 (2026-02-27)](./SUPABASE_LOCAL_ONLY_MIGRATION_AUDIT_BATCH_8_2026-02-27.md)
- [Supabase Local-Only Migration Audit: Batch 9 (2026-02-27)](./SUPABASE_LOCAL_ONLY_MIGRATION_AUDIT_BATCH_9_2026-02-27.md)
- [Supabase Local-Only Migration Audit: Batch 10 (2026-02-27)](./SUPABASE_LOCAL_ONLY_MIGRATION_AUDIT_BATCH_10_2026-02-27.md)
- [Supabase Local-Only Migration Audit: Batch 11 (2026-02-27)](./SUPABASE_LOCAL_ONLY_MIGRATION_AUDIT_BATCH_11_2026-02-27.md)
- [Funding Operating System Core Manual Migration Record (2026-02-28)](./FUNDING_OPERATING_SYSTEM_CORE_MANUAL_MIGRATION_2026-02-28.md)

## Recommendation

Treat the remaining `71` local-only migrations as a dedicated maintenance task on a branch focused only on schema lineage.
