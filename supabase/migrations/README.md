# supabase/migrations Reference

This directory contains the database migrations for JusticeHub.

## Best Practices

### 1. Naming Convention
All migration files must strictly follow the timestamped format:
`YYYYMMDDHHMMSS_description_of_change.sql`

Example: `20260111_link_stories_to_programs.sql`

**Why?**
Supabase applies migrations in lexicographical order. The timestamp ensures that changes are applied in the exact order they were created.

### 2. Single Source of Truth
- **Tables vs Views**: Be aware of existing views. For example, `articles` is a **VIEW** on top of the `stories` table. Do not try to `ALTER TABLE articles`. Alter `stories` instead.
- **Idempotency**: Use `IF NOT EXISTS` for creating tables/columns and `DROP POLICY IF EXISTS` before creating policies. This prevents errors if a migration is run multiple times.

### 3. Archive
The `archive/` directory contains deprecated, redundant, or "loose" SQL scripts that have been superseded by formal migrations. Do not run files from this directory unless you are manually debugging history.

## Migration Manifest (Key Files)

| File | Description |
|------|-------------|
| `20250120000001_initial_schema.sql` | Core schema (users, orgs, stories). |
| `20250123000001_create_unified_profiles_system.sql` | Start of the profile unification. |
| `20260111_restore_initiatives_and_profiles.sql` | Consolidated migration restoring missing tables and linking profiles. |
| `20260111_link_stories_to_programs.sql` | Links `stories` to `community_programs` via FK. |
| `20260111_seed_oonchiumpa_programs.sql` | Data migration (Seed) for Oonchiumpa initiatives. |
