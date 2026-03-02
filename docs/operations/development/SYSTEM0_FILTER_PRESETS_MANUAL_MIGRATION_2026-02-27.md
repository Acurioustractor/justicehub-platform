# System 0 Filter Presets Manual Migration Record

## Summary

This records a manual database change applied directly to the Supabase project for JusticeHub System 0 filter presets.

- Project ref: `tednluwflfhxyucgwigh`
- Project URL: `https://tednluwflfhxyucgwigh.supabase.co`
- Applied on: February 27, 2026
- Method: Supabase Management API `POST /v1/projects/{project_ref}/database/query`
- Reason: `supabase db push` was blocked by remote/local migration history mismatch for this repo

## SQL Applied

The following migration files were applied manually, in order:

1. [20260227000003_funding_system0_filter_presets.sql](../../../supabase/migrations/20260227000003_funding_system0_filter_presets.sql)
2. [20260227000004_funding_system0_filter_presets_visibility.sql](../../../supabase/migrations/20260227000004_funding_system0_filter_presets_visibility.sql)
3. [20260227000005_funding_system0_filter_presets_rls.sql](../../../supabase/migrations/20260227000005_funding_system0_filter_presets_rls.sql)

## Result

These changes are now live in the remote database:

- Table `public.funding_system0_filter_presets` exists
- Column `is_shared boolean` exists
- RLS is enabled on `funding_system0_filter_presets`
- Policies confirmed:
  - `Admins read funding_system0_filter_presets`
  - `Admins insert funding_system0_filter_presets`
  - `Admins update funding_system0_filter_presets`
  - `Admins delete funding_system0_filter_presets`
  - `Service manage funding_system0_filter_presets`

## Verification Queries

These checks were used after applying the SQL:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'funding_system0_filter_presets'
  and column_name = 'is_shared';
```

```sql
select policyname, cmd, roles, permissive
from pg_policies
where schemaname = 'public'
  and tablename = 'funding_system0_filter_presets'
order by policyname;
```

## Operational Follow-Up

Important: the schema is applied, and these three migrations were later recorded as `applied` in the remote migration history. However, Supabase CLI migration history is still not fully aligned with this repo.

- `20260227000003`, `20260227000004`, and `20260227000005` were marked as applied via `supabase migration repair --status applied`
- Remote-only migration history was normalized locally with placeholder files
- `supabase db push` still remains unsafe because there are still `71` local-only migrations not yet reconciled against the remote project
- If future work depends on clean CLI migrations, finish the remaining lineage audit before pushing new schema changes

## Recommended Next Step

Before the next schema deployment, either:

1. Audit and reconcile the remaining `71` local-only migrations so local and remote history fully align, or
2. Continue using explicit manual SQL plus targeted migration-history repair for isolated fixes

See also:

- [Supabase Migration History Re-baseline Blocker (2026-02-27)](./SUPABASE_MIGRATION_HISTORY_REBASELINE_BLOCKER_2026-02-27.md)
