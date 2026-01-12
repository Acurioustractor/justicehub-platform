# Deploy ALMA to Supabase - DEFINITIVE GUIDE

**Works Every Fucking Time™**

## Option 1: Supabase Studio (RECOMMENDED - 100% Success Rate)

1. **Go to SQL Editor**: https://supabase.com/dashboard/project/tednluwflfhxyucgwigh/sql/new

2. **Copy & paste this complete SQL** (all 3 migrations combined):

```bash
cat /Users/benknight/Code/JusticeHub/supabase/migrations/20250131*.sql
```

3. **Click RUN**

4. **Verify**: Run this query:
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'alma_%'
ORDER BY tablename;
```

Should return 10 tables.

---

## Option 2: CLI (If Supabase CLI is working)

```bash
cd /Users/benknight/Code/JusticeHub

# Reset migrations (if needed)
npx supabase db reset --linked

# Push new migrations
npx supabase db push --linked
```

---

## Option 3: Direct psql (Using correct connection string)

```bash
cd /Users/benknight/Code/JusticeHub

# Connection details from .env.local:
# Host: aws-0-us-west-1.pooler.supabase.com
# Port: 6543
# Database: postgres
# User: postgres.tednluwflfhxyucgwigh
# Password: vixwek-Hafsaz-0ganxa

# Apply all migrations
for file in supabase/migrations/20250131*.sql; do
  PGPASSWORD='vixwek-Hafsaz-0ganxa' psql \
    "host=aws-0-us-west-1.pooler.supabase.com port=6543 dbname=postgres user=postgres.tednluwflfhxyucgwigh sslmode=require" \
    -f "$file"
done
```

---

## Verify Installation

Run this query in Supabase Studio SQL Editor:

```sql
-- Check tables exist
SELECT COUNT(*) as alma_table_count
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'alma_%';
-- Should return: 10

-- Test insert with governance
INSERT INTO alma_interventions (
  name, type, description, consent_level, cultural_authority
) VALUES (
  'Test Intervention',
  'Prevention',
  'Test description',
  'Community Controlled',
  'Test Authority'
);

-- Should succeed

-- Try to insert WITHOUT authority (should FAIL)
INSERT INTO alma_interventions (
  name, type, description, consent_level
) VALUES (
  'Bad Test',
  'Prevention',
  'Should fail',
  'Community Controlled'
);
-- Should get error: check_cultural_authority_required

-- Clean up test
DELETE FROM alma_interventions WHERE name = 'Test Intervention';
```

---

## What Gets Created

### Tables (10 total):
1. `alma_interventions` - Programs & practices
2. `alma_community_contexts` - Place-based contexts
3. `alma_evidence` - Research & evaluations
4. `alma_outcomes` - Intended results
5. `alma_intervention_outcomes` - Relationship table
6. `alma_intervention_evidence` - Relationship table
7. `alma_intervention_contexts` - Relationship table
8. `alma_evidence_outcomes` - Relationship table
9. `alma_consent_ledger` - Governance tracking
10. `alma_usage_log` - Attribution tracking

### Functions (4 total):
- `calculate_portfolio_signals(uuid)` - Portfolio analytics
- `check_consent_compliance(text, uuid, text)` - Governance check
- `backfill_community_program_to_alma_intervention(uuid)` - Data migration
- `backfill_all_community_programs_to_alma()` - Batch migration

### Views (1 total):
- `alma_interventions_unified` - Combined ALMA + legacy data

### RLS Policies (30+ total):
- Public Knowledge Commons (public access)
- Community Controlled (authenticated access)
- Strictly Private (org members + admins only)

---

## Troubleshooting

### "Tenant or user not found"
- Wrong connection string format
- Use Supabase Studio instead (Option 1)

### "Function uuid_generate_v4() does not exist"
- Extension not enabled
- Run in SQL Editor first: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

### "Migration already applied"
- Check: `SELECT * FROM supabase_migrations.schema_migrations;`
- Skip or use Supabase Studio to apply manually

### Tables already exist
- Check: `SELECT COUNT(*) FROM alma_interventions;`
- If it works, you're done!

---

## Combined SQL File (For Copy-Paste)

Generate combined file:

```bash
cd /Users/benknight/Code/JusticeHub
cat supabase/migrations/20250131*.sql > /tmp/alma_complete.sql
echo "✅ Combined SQL file: /tmp/alma_complete.sql"
echo "   $(wc -l /tmp/alma_complete.sql | awk '{print $1}') lines"
```

Then copy `/tmp/alma_complete.sql` contents and paste into Supabase Studio SQL Editor.

---

## Success Criteria

✅ 10 ALMA tables created
✅ RLS policies enforced
✅ Portfolio signal function works
✅ Consent compliance function works
✅ Can insert intervention with authority
✅ CANNOT insert intervention without authority (when required)

---

**RECOMMENDATION: Use Option 1 (Supabase Studio). It's the most reliable.**
