#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Auditing Supabase Database Structure\n');
console.log(`📍 Database: ${supabaseUrl}\n`);

async function auditTables() {
  // List of tables we expect based on the codebase
  const expectedTables = [
    'youth_statistics',
    'budget_allocations', 
    'court_statistics',
    'parliamentary_documents',
    'scraped_content',
    'scraping_logs',
    'cost_comparisons',
    'hidden_costs'
  ];

  console.log('📊 Checking Tables:');
  console.log('==================\n');

  for (const tableName of expectedTables) {
    try {
      // Get count and sample data
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: false })
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
        continue;
      }

      console.log(`✅ ${tableName}:`);
      console.log(`   Records: ${count || 0}`);
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`   Columns: ${columns.join(', ')}`);
        console.log(`   Sample ID: ${data[0].id || 'No ID field'}`);
      } else {
        console.log(`   Status: Table exists but no data`);
      }
      console.log('');

    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}\n`);
    }
  }

  // Check for RLS policies
  console.log('\n🔒 Row Level Security (RLS) Status:');
  console.log('====================================\n');

  try {
    // This query checks if RLS is enabled on tables
    const { data: tables, error } = await supabase.rpc('get_table_rls_status');
    
    if (error) {
      console.log('ℹ️  Cannot check RLS status automatically (requires custom function)');
      console.log('   Please check RLS status in Supabase dashboard\n');
    } else if (tables) {
      tables.forEach(table => {
        console.log(`${table.table_name}: RLS ${table.rls_enabled ? '✅ Enabled' : '❌ Disabled'}`);
      });
    }
  } catch (err) {
    console.log('ℹ️  RLS status check not available');
  }

  // Test anonymous access
  console.log('\n🔑 Testing Anonymous Access:');
  console.log('============================\n');

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anonKey) {
    const anonSupabase = createClient(supabaseUrl, anonKey);
    
    for (const tableName of ['youth_statistics', 'budget_allocations']) {
      try {
        const { data, error } = await anonSupabase
          .from(tableName)
          .select('id')
          .limit(1);

        if (error) {
          console.log(`❌ ${tableName}: Anonymous access blocked (${error.message})`);
        } else {
          console.log(`✅ ${tableName}: Anonymous read access allowed`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
  }

  // Summary
  console.log('\n📈 Database Health Summary:');
  console.log('==========================\n');
  
  const recommendations = [
    '1. Enable RLS on all tables for production security',
    '2. Create proper RLS policies for anonymous read access',
    '3. Add indexes on frequently queried columns (date, facility_name)',
    '4. Set up database backups and monitoring',
    '5. Implement connection pooling for better performance'
  ];

  recommendations.forEach(rec => console.log(`💡 ${rec}`));
}

// Create a function to check table structure
async function checkTableStructure(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    if (!error) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

auditTables().then(() => {
  console.log('\n✅ Audit complete!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});