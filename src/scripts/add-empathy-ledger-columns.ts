import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function addColumns() {
  console.log('Adding Empathy Ledger linking columns to JusticeHub database...\n');

  const sql = readFileSync('supabase/migrations/20250126000004_add_empathy_ledger_linking.sql', 'utf-8');

  // Execute the SQL file using psql via the connection string
  console.log('Please run the following SQL file manually in Supabase SQL Editor:');
  console.log('File: supabase/migrations/20250126000004_add_empathy_ledger_linking.sql\n');
  console.log('OR use this connection string with psql:');
  console.log(`psql ${process.env.YJSF_SUPABASE_DB_URL} < supabase/migrations/20250126000004_add_empathy_ledger_linking.sql\n`);

  console.log('\nAlternatively, I can add the columns individually...\n');

  // Try individual column additions
  const queries = [
    {
      name: 'public_profiles.empathy_ledger_profile_id',
      table: 'public_profiles',
      column: 'empathy_ledger_profile_id',
      type: 'uuid'
    },
    {
      name: 'public_profiles.synced_from_empathy_ledger',
      table: 'public_profiles',
      column: 'synced_from_empathy_ledger',
      type: 'boolean',
      default: false
    },
    {
      name: 'public_profiles.sync_type',
      table: 'public_profiles',
      column: 'sync_type',
      type: 'text',
      default: 'manual'
    },
    {
      name: 'public_profiles.last_synced_at',
      table: 'public_profiles',
      column: 'last_synced_at',
      type: 'timestamp'
    },
    {
      name: 'organizations.empathy_ledger_org_id',
      table: 'organizations',
      column: 'empathy_ledger_org_id',
      type: 'uuid'
    },
    {
      name: 'organizations.synced_from_empathy_ledger',
      table: 'organizations',
      column: 'synced_from_empathy_ledger',
      type: 'boolean',
      default: false
    },
    {
      name: 'organizations.last_synced_at',
      table: 'organizations',
      column: 'last_synced_at',
      type: 'timestamp'
    },
    {
      name: 'community_programs.empathy_ledger_project_id',
      table: 'community_programs',
      column: 'empathy_ledger_project_id',
      type: 'uuid'
    },
    {
      name: 'community_programs.synced_from_empathy_ledger',
      table: 'community_programs',
      column: 'synced_from_empathy_ledger',
      type: 'boolean',
      default: false
    },
    {
      name: 'community_programs.last_synced_at',
      table: 'community_programs',
      column: 'last_synced_at',
      type: 'timestamp'
    }
  ];

  console.log('Copy and paste this into Supabase SQL Editor:\n');
  console.log('----------------------------------------\n');

  for (const q of queries) {
    const defaultClause = q.default !== undefined
      ? ` DEFAULT ${typeof q.default === 'boolean' ? q.default : `'${q.default}'`}`
      : '';
    console.log(`ALTER TABLE ${q.table} ADD COLUMN IF NOT EXISTS ${q.column} ${q.type}${defaultClause};`);
  }

  console.log('\n-- Create sync log tables');
  console.log(`
CREATE TABLE IF NOT EXISTS profile_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_profile_id UUID REFERENCES public_profiles(id) ON DELETE CASCADE,
  empathy_ledger_profile_id UUID,
  sync_action TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  sync_details JSONB,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  empathy_ledger_org_id UUID,
  sync_action TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  sync_details JSONB,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT now()
);
  `);

  console.log('----------------------------------------\n');
}

addColumns();
