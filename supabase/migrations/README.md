# Database Migrations

## Migration Order

Migrations are applied in chronological order based on their timestamp prefix.

### Current Migrations

1. **20250120000001_initial_schema.sql**
   - Initial JusticeHub platform schema
   - Core tables: organizations, users, stories, services, opportunities
   - Basic indexes and constraints

2. **20250120000002_rls_policies.sql**
   - Row Level Security policies
   - Public read access policies
   - Authenticated user policies

3. **20250121000001_unify_services_schema.sql** ✨ NEW
   - Unifies platform services with youth justice service finder
   - Adds scraping-specific fields (data_source, confidence_score, etc.)
   - Creates service_locations and service_contacts tables
   - Creates services_complete view for frontend compatibility
   - Adds helper functions and triggers

4. **20250121000002_migrate_seed_data.sql** ✨ NEW
   - Migrates existing seed data to unified schema
   - Generates slugs for services
   - Sets default values for new fields
   - Marks youth-specific and indigenous-specific services
   - Creates data integrity report

## Running Migrations

### Option 1: Supabase CLI (Recommended)
```bash
# Link to your project (first time only)
npx supabase link --project-ref tednluwflfhxyucgwigh

# Run pending migrations
npx supabase db push

# Check migration status
npx supabase migration list
```

### Option 2: Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/tednluwflfhxyucgwigh/editor
2. Open SQL Editor
3. Copy and paste migration files in order
4. Execute each migration

### Option 3: Manual SQL Execution
```bash
# Using psql
psql "postgresql://postgres:[YOUR-PASSWORD]@db.tednluwflfhxyucgwigh.supabase.co:5432/postgres" \
  -f supabase/migrations/20250121000001_unify_services_schema.sql

psql "postgresql://postgres:[YOUR-PASSWORD]@db.tednluwflfhxyucgwigh.supabase.co:5432/postgres" \
  -f supabase/migrations/20250121000002_migrate_seed_data.sql
```

## Testing Migrations

### Before Running Migration
```sql
-- Check current schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'services'
ORDER BY ordinal_position;

-- Count current services
SELECT COUNT(*) FROM services;
```

### After Running Migration
```sql
-- Verify new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'services'
AND column_name IN ('categories', 'keywords', 'youth_specific', 'indigenous_specific', 'scrape_confidence_score')
ORDER BY ordinal_position;

-- Check new tables
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('service_locations', 'service_contacts');

-- Verify view
SELECT * FROM services_complete LIMIT 1;

-- Check data migration
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE youth_specific = true) as youth_specific,
  COUNT(*) FILTER (WHERE indigenous_specific = true) as indigenous_specific,
  COUNT(*) FILTER (WHERE slug IS NOT NULL) as has_slug
FROM services;
```

## Rollback (if needed)

If you need to rollback the unified schema:

```sql
-- Drop new tables
DROP TABLE IF EXISTS service_contacts CASCADE;
DROP TABLE IF EXISTS service_locations CASCADE;

-- Drop view
DROP VIEW IF EXISTS services_complete;

-- Remove new columns (careful - this loses data!)
ALTER TABLE services DROP COLUMN IF EXISTS categories;
ALTER TABLE services DROP COLUMN IF EXISTS keywords;
-- ... (drop other new columns as needed)
```

## Migration Verification Checklist

Before deploying to production:

- [ ] All migrations run without errors
- [ ] services_complete view returns expected data
- [ ] API routes work with new schema
- [ ] Frontend displays services correctly
- [ ] Search functionality works
- [ ] Stats API returns accurate counts
- [ ] No data loss from original seed data
- [ ] All existing services have slugs
- [ ] Youth-specific and indigenous-specific flags are accurate

## Post-Migration Tasks

1. ✅ Update API routes to use `services_complete` view
2. ✅ Update stats endpoint to query new tables
3. ⏳ Test frontend service finder with real data
4. ⏳ Verify search with categories and keywords
5. ⏳ Install scraping dependencies (Phase 0)
6. ⏳ Build first AI scraper for QLD services

## Environment Variables

Make sure these are set in your `.env`:

```bash
SUPABASE_URL=https://tednluwflfhxyucgwigh.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # For scrapers
```

## Troubleshooting

### Migration fails with "column already exists"
The migrations use `IF NOT EXISTS` clauses, so this shouldn't happen. If it does, check if you ran the migration twice.

### View query fails
Make sure all base tables exist and have the expected columns. Check migration logs for any skipped steps.

### Seed data migration incomplete
Run the verification query to see which fields are missing:
```sql
SELECT
  id, name,
  CASE WHEN slug IS NULL THEN '❌' ELSE '✅' END as has_slug,
  CASE WHEN youth_specific IS NULL THEN '❌' ELSE '✅' END as has_youth_flag
FROM services
WHERE slug IS NULL OR youth_specific IS NULL
LIMIT 10;
```

## Support

- Documentation: docs/SCHEMA_ANALYSIS_AND_SCRAPING_STRATEGY.md
- Issues: Check migration logs and console output
- Supabase Docs: https://supabase.com/docs
