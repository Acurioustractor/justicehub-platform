# Supabase Local-Only Migration Audit: Batch 1

## Scope

This is the first audit batch for the remaining local-only Supabase migrations in the JusticeHub repo after remote-only history was normalized on February 27, 2026.

- Project ref: `tednluwflfhxyucgwigh`
- Focus: oldest 8 local-only migrations
- Goal: determine whether each migration is already represented remotely, needs applying, or requires deeper review before any history repair

## Batch

1. `001_empathy_ledger_core.sql`
2. `20250115_story_workspaces.sql`
3. `20250120000001_initial_schema.sql`
4. `20250120000002_rls_policies.sql`
5. `20250120000003_empathy_ledger_integration.sql`
6. `20250120000004_advanced_storytelling.sql`
7. `20250121000001_unify_services_schema.sql`
8. `20250121000002_migrate_seed_data.sql`

## Findings

### 1) `001_empathy_ledger_core.sql`

Status: not safe to mark as applied

Reason:

- The migration creates foundational tables including `empathy_ledger_entries` and a version of `youth_profiles`.
- Remote verification showed `empathy_ledger_entries` is absent.
- Remote verification also showed `youth_profiles` is absent.

Assessment:

- This migration is not represented remotely in a way that supports safe history repair.
- It needs either deliberate application, decomposition, or formal retirement.

### 2) `20250115_story_workspaces.sql`

Status: not applied remotely

Reason:

- The migration creates `story_workspaces` and `story_ownership`.
- Remote verification showed both tables are absent.

Assessment:

- Do not mark this as applied.
- If the workspace flow is still needed, this migration should be intentionally applied or reworked.

### 3) `20250120000001_initial_schema.sql`

Status: partially represented, not safe to mark as applied

Reason:

- Core tables from this migration include `organizations`, `users`, `org_memberships`, `youth_profiles`, `stories`, and others.
- Remote verification showed `organizations`, `users`, and `stories` exist.
- Remote verification showed `org_memberships` and `youth_profiles` are absent.

Assessment:

- The remote schema contains some overlapping objects, but not the full migration effect.
- This cannot be safely repaired as already applied.

### 4) `20250120000002_rls_policies.sql`

Status: blocked by missing base schema, not safe to mark as applied

Reason:

- This migration enables RLS and creates policies across many tables introduced by earlier schema work.
- Several target tables from the related base schema are absent remotely.
- Policy-name checks are not sufficient proof because policy names can exist on different tables.

Assessment:

- This migration should be reviewed only after the underlying table lineage is settled.
- Do not mark it as applied during broad history repair.

### 5) `20250120000003_empathy_ledger_integration.sql`

Status: partially represented, not safe to mark as applied

Reason:

- The migration creates `storytellers`, `projects`, `organizations`, and `stories` if they do not already exist.
- Remote verification showed all four tables exist.
- However, only a subset of checked columns exists remotely:
  - Present: `storytellers.project_id`, `storytellers.organization_id`, `projects.status`
  - Missing from sampled checks: `storytellers.consent_status`, `storytellers.privacy_settings`, `storytellers.metadata`, `projects.project_type`, `projects.settings`, `projects.success_metrics`, `projects.is_public`, `stories.storyteller_id`, `stories.project_id`

Additional verification:

- A fuller comparison confirmed the overlap is incomplete:
  - `storytellers`: `15` expected columns, `8` present, `7` missing
  - `projects`: `12` expected columns, `6` present, `6` missing
  - `organizations`: `13` expected columns, `11` present, `2` missing
  - `stories`: `19` expected columns, `11` present, `8` missing
- Additional table checks:
  - `story_interactions`: absent
  - `cross_project_metrics`: absent
  - `justicehub_users`: absent
  - `consent_records`: present, but not enough to rescue the migration as a whole

Assessment:

- The migration has meaningful overlap with the remote schema, but the missing columns and missing tables make blind history repair incorrect.
- This should be treated as not safely applied.

### 6) `20250120000004_advanced_storytelling.sql`

Status: not safely represented remotely

Reason:

- The migration adds rich-content columns to `stories` and creates `story_drafts`, `story_media_enhanced`, `tags`, `story_tags`, and `story_analytics`.
- Remote verification showed the supporting tables are absent.
- Sampled `stories` columns from this migration were also absent:
  - `content_json`
  - `content_html`
  - `reading_time`
  - `word_count`
  - `media_count`

Assessment:

- This migration should be treated as unapplied unless a later migration replaced it with equivalent structures.

### 7) `20250121000001_unify_services_schema.sql`

Status: fully verified and recorded as applied

Reason:

- This migration is mostly additive, extending `services` and `organizations`.
- Remote verification showed many sampled columns already exist on both tables.
- Confirmed present on `services` from the sampled set:
  - `slug`
  - `program_type`
  - `service_category`
  - `delivery_method`
  - `capacity_total`
  - `is_accepting_referrals`
  - `eligibility_criteria`
  - `contact_phone`
  - `contact_email`
  - `website_url`
  - `categories`
  - `keywords`
  - `youth_specific`
  - `indigenous_specific`
  - `service_area`
  - `data_source`
  - `last_verified_at`
  - `waitlist_time_weeks`
  - `online_booking_url`
  - `project`
  - `parent_service_id`
- Confirmed present on `organizations` from the sampled set:
  - `slug`
  - `type`
  - `description`
  - `email`
  - `phone`
  - `website`
  - `street_address`
  - `city`
  - `state`
  - `postcode`
  - `latitude`
  - `longitude`
  - `verification_status`
  - `is_active`
  - `logo_url`
  - `tags`
  - `settings`

Additional verification:

- A full follow-up diff confirmed:
  - all `47` expected `services` columns exist remotely
  - all `18` expected `organizations` columns exist remotely
  - `service_locations` and `service_contacts` exist
  - `services_complete` exists
  - `mark_service_verified` and `calculate_service_completeness` exist
  - all named indexes, constraints, policies, and triggers from the migration are present

Assessment:

- This migration was sufficiently represented remotely to support safe history repair.
- It was marked `applied` in remote migration history on February 27, 2026.

### 8) `20250121000002_migrate_seed_data.sql`

Status: data migration, defer repair decision

Reason:

- This migration updates existing records in `services`.
- It does not create durable schema objects that can be confirmed through table/column existence alone.

Assessment:

- Do not mark this as applied blindly.
- This needs row-level data validation or an explicit decision to treat it as obsolete/non-critical historical data movement.

## Batch Outcome

From this first batch:

- Repaired after full verification: `20250121000001`
- Clear "not safe to mark applied": `001`, `20250115`, `20250120000001`, `20250120000002`, `20250120000003`, `20250120000004`, `20250121000002`

## Recommended Next Step

Continue with batch 2, but split the work:

1. Continue with the next 8-12 local-only migrations after this batch.
2. Keep data-only migrations separate from schema migrations so they are not mixed into blind history repair.
3. Only spend deeper audit time on migrations that still look plausibly fully represented remotely.
