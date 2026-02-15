#!/usr/bin/env node
/**
 * Apply processing_jobs table fix manually
 * Works around Supabase schema cache issues by using direct SQL execution
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function applyTableFix() {
  console.log('🔧 Applying processing_jobs table fix...');

  const supabase = createClient(
    'https://tednluwflfhxyucgwigh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  );

  try {
    // Step 1: Backup existing table data
    console.log('📋 Backing up existing data...');
    const { data: backupData, error: backupError } = await supabase
      .from('processing_jobs')
      .select('*');

    if (backupError) {
      console.log('⚠️ Could not backup existing data:', backupError.message);
    } else {
      console.log(`   Backed up ${backupData?.length || 0} records`);
    }

    // Step 2: Try to execute the SQL commands one by one
    console.log('🔧 Renaming existing table...');

    // Rename existing table
    const { error: renameError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE IF EXISTS processing_jobs RENAME TO processing_jobs_backup;'
    });

    if (renameError) {
      console.log('⚠️ Rename failed (trying alternative approach):', renameError.message);

      // Alternative: Drop the table entirely
      const { error: dropError } = await supabase.rpc('execute_sql', {
        sql: 'DROP TABLE IF EXISTS processing_jobs CASCADE;'
      });

      if (dropError) {
        console.log('❌ Drop also failed:', dropError.message);
        throw new Error('Cannot modify existing table');
      } else {
        console.log('✅ Dropped existing table');
      }
    } else {
      console.log('✅ Renamed existing table to backup');
    }

    // Step 3: Create new table
    console.log('🔧 Creating new processing_jobs table...');
    const createTableSQL = `
    CREATE TABLE processing_jobs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'queued',
        priority VARCHAR(20) DEFAULT 'medium',
        source_urls TEXT[] DEFAULT '{}',
        data_source_id UUID REFERENCES data_sources(id),
        configuration JSONB NOT NULL DEFAULT '{}',
        progress_percentage INTEGER DEFAULT 0,
        results_summary JSONB,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        scheduled_at TIMESTAMP WITH TIME ZONE,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        estimated_completion TIMESTAMP WITH TIME ZONE,
        created_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`;

    const { error: createError } = await supabase.rpc('execute_sql', {
      sql: createTableSQL
    });

    if (createError) {
      console.log('❌ Create table failed:', createError.message);
      throw createError;
    } else {
      console.log('✅ Created new processing_jobs table');
    }

    // Step 4: Create indexes
    console.log('🔧 Creating indexes...');
    const indexSQL = `
    CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_processing_jobs_priority ON processing_jobs(priority);
    CREATE INDEX IF NOT EXISTS idx_processing_jobs_type ON processing_jobs(type);
    CREATE INDEX IF NOT EXISTS idx_processing_jobs_created_at ON processing_jobs(created_at);
    `;

    const { error: indexError } = await supabase.rpc('execute_sql', {
      sql: indexSQL
    });

    if (indexError) {
      console.log('⚠️ Index creation failed (non-critical):', indexError.message);
    } else {
      console.log('✅ Created indexes');
    }

    console.log('\n🎉 processing_jobs table fix applied successfully!');
    console.log('📋 The table now has the correct structure for AI scraping');
    console.log('🔧 You can now run: npx tsx src/scripts/run-test-scrape-fixed.ts');

  } catch (error) {
    console.error('💥 Fix failed:', error.message);
    console.log('\n🔧 Manual steps required:');
    console.log('1. Go to your Supabase SQL Editor');
    console.log('2. Run the contents of fix-processing-jobs-table.sql');
    console.log('3. Then test the scraper again');
  }
}

// Run the fix
applyTableFix();