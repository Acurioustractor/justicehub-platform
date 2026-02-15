# JusticeHub Supabase Connection - WORKING

## ✅ Correct Connection Details

**Region**: ap-southeast-2 (NOT us-west-1!)
**Host**: aws-0-ap-southeast-2.pooler.supabase.com
**Port**: 6543
**Database**: postgres
**User**: postgres.tednluwflfhxyucgwigh
**Password**: vixwek-Hafsaz-0ganxa

## Working psql Command

```bash
export PGPASSWORD='vixwek-Hafsaz-0ganxa'
psql -h aws-0-ap-southeast-2.pooler.supabase.com \
     -p 6543 \
     -U postgres.tednluwflfhxyucgwigh \
     -d postgres
```

## Apply SQL File

```bash
export PGPASSWORD='vixwek-Hafsaz-0ganxa'
psql -h aws-0-ap-southeast-2.pooler.supabase.com \
     -p 6543 \
     -U postgres.tednluwflfhxyucgwigh \
     -d postgres \
     -f your-migration.sql
```

## For .env.local

```bash
# Add this to .env.local
SUPABASE_DB_PASSWORD=vixwek-Hafsaz-0ganxa
DATABASE_URL=postgresql://postgres.tednluwflfhxyucgwigh:vixwek-Hafsaz-0ganxa@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres
```

## ⚠️ Common Mistakes

- ❌ Using us-west-1 region (WRONG)
- ✅ Using ap-southeast-2 region (CORRECT)

- ❌ Using service role key as password (WRONG)
- ✅ Using actual database password (CORRECT)

- ❌ Port 5432 (session mode, doesn't work)
- ✅ Port 6543 (transaction mode, WORKS)

## ALMA Deployment Status

✅ **DEPLOYED** - December 31, 2025

All 10 ALMA tables successfully created:
- alma_interventions
- alma_community_contexts
- alma_evidence
- alma_outcomes
- alma_intervention_outcomes
- alma_intervention_evidence
- alma_intervention_contexts
- alma_evidence_outcomes
- alma_consent_ledger
- alma_usage_log

## Verify in Supabase Studio

https://supabase.com/dashboard/project/tednluwflfhxyucgwigh/editor

Navigate to Table Editor → Public schema → Look for tables starting with `alma_`
