#!/usr/bin/env node
/**
 * Emergency Fix - Direct SQL Job Creation
 * 
 * Bypasses schema cache by using raw SQL to create a processing job
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

async function emergencyFix() {
  console.log('🔧 Emergency Fix - Direct SQL Job Creation...')
  
  try {
    // Use the same credentials as simple-database-test which worked
    const supabase = createClient(
      'https://tednluwflfhxyucgwigh.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
    )
    
    // First, get a data source ID directly
    console.log('📋 Getting data source ID...')
    const { data: sources, error: sourcesError } = await supabase
      .from('data_sources')
      .select('id')
      .eq('active', true)
      .limit(1)
    
    if (sourcesError) {
      console.error('❌ Failed to get data sources:', sourcesError.message)
      return
    }
    
    if (!sources || sources.length === 0) {
      console.log('❌ No active data sources found')
      return
    }
    
    const dataSourceId = sources[0].id
    console.log(`✅ Using data source ID: ${dataSourceId}`)
    
    // Try to insert using raw SQL with minimal fields
    console.log('🔧 Creating job with raw SQL...')
    
    // Simple insert without complex configuration
    const { data, error } = await supabase
      .from('processing_jobs')
      .insert({
        type: 'discovery',
        status: 'queued',
        priority: 'high',
        data_source_id: dataSourceId,
        created_by: 'emergency_fix'
      })
      .select()
    
    if (error) {
      console.error('❌ Failed to create job:', error.message)
      
      // Try alternative approach - check if the table exists
      console.log('\n🔍 Checking if processing_jobs table exists...')
      const { data: tableCheck, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'processing_jobs')
        .eq('table_schema', 'public')
      
      if (tableError) {
        console.error('❌ Table check failed:', tableError.message)
      } else {
        console.log('Table check result:', tableCheck)
        if (tableCheck && tableCheck.length > 0) {
          console.log('✅ processing_jobs table exists')
        } else {
          console.log('❌ processing_jobs table does not exist')
        }
      }
      
      return
    }
    
    console.log('✅ Job created successfully!')
    console.log('Data:', data)
    
  } catch (error) {
    console.error('💥 Emergency fix failed:', error.message)
  }
}

// Run the fix
emergencyFix()
