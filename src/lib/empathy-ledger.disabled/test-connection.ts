/**
 * Test Empathy Ledger Database Connection
 * 
 * Simple script to test if we can connect to your Supabase instance
 * and verify the required tables exist.
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function testEmpathyLedgerConnection() {
  try {
    console.log('🔍 Testing Empathy Ledger database connection...');
    
    // Create client with your credentials
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY
    );

    // Test basic connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);

    if (healthError) {
      console.error('❌ Connection failed:', healthError.message);
      return {
        success: false,
        error: healthError.message,
        suggestions: [
          'Check if your SUPABASE_URL is correct',
          'Verify your SUPABASE_ANON_KEY is valid and not expired',
          'Ensure the organizations table exists in your database'
        ]
      };
    }

    console.log('✅ Basic connection successful');

    // Check if required tables exist
    const requiredTables = [
      'organizations',
      'projects', 
      'storytellers',
      'stories',
      'story_interactions',
      'consent_records'
    ];

    const tableChecks = [];
    
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);

        if (error) {
          tableChecks.push({
            table,
            exists: false,
            error: error.message
          });
        } else {
          tableChecks.push({
            table,
            exists: true,
            count: data?.length || 0
          });
        }
      } catch (err: any) {
        tableChecks.push({
          table,
          exists: false,
          error: err.message
        });
      }
    }

    const missingTables = tableChecks.filter(check => !check.exists);
    const existingTables = tableChecks.filter(check => check.exists);

    console.log(`✅ Found ${existingTables.length} existing tables:`, existingTables.map(t => t.table));
    
    if (missingTables.length > 0) {
      console.log(`⚠️  Missing ${missingTables.length} tables:`, missingTables.map(t => t.table));
      
      return {
        success: false,
        error: `Missing required tables: ${missingTables.map(t => t.table).join(', ')}`,
        existingTables: existingTables.map(t => t.table),
        missingTables: missingTables.map(t => t.table),
        suggestions: [
          'Run the migration script: supabase/migrations/20250120000003_empathy_ledger_integration.sql',
          'Or create the missing tables manually in your Supabase dashboard',
          'Ensure you have the correct permissions to create tables'
        ]
      };
    }

    // Test data operations
    try {
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .limit(5);

      if (orgsError) {
        console.error('❌ Failed to read organizations:', orgsError.message);
        return {
          success: false,
          error: `Cannot read organizations table: ${orgsError.message}`,
          suggestions: [
            'Check Row Level Security policies',
            'Verify your API key has read permissions',
            'Ensure the organizations table has data'
          ]
        };
      }

      console.log(`✅ Successfully read ${orgs?.length || 0} organizations`);

      return {
        success: true,
        message: 'Empathy Ledger database connection successful',
        existingTables: existingTables.map(t => t.table),
        organizationCount: orgs?.length || 0,
        organizations: orgs?.map(org => ({ id: org.id, name: org.name, slug: org.slug })) || []
      };

    } catch (err: any) {
      console.error('❌ Data operation failed:', err.message);
      return {
        success: false,
        error: `Data operation failed: ${err.message}`,
        suggestions: [
          'Check if you have read permissions',
          'Verify Row Level Security policies allow access',
          'Ensure your API key is not expired'
        ]
      };
    }

  } catch (error: any) {
    console.error('❌ Connection test failed:', error.message);
    return {
      success: false,
      error: error.message,
      suggestions: [
        'Check your internet connection',
        'Verify the Supabase URL format',
        'Ensure the Supabase project is active'
      ]
    };
  }
}

// API endpoint version for testing from the browser
export async function testConnectionAPI() {
  try {
    const response = await fetch('/api/empathy-ledger/test-connection');
    const data = await response.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}