#!/usr/bin/env node
/**
 * Generate SQL Commands for Manual Execution
 * 
 * Outputs the exact SQL commands you need to run in the Supabase SQL Editor
 */

import { readFileSync } from 'fs'
import { join } from 'path'

function generateSQLInstructions() {
  console.log('📋 SQL Commands for Manual Execution\n')
  console.log('Please follow these steps:\n')
  console.log('1. Go to your Supabase Dashboard: https://app.supabase.com/project/tednluwflfhxyucgwigh')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Copy and paste each of the following commands one by one:\n')
  
  const sqlPath = join(process.cwd(), 'src', 'database', 'ai-scraper-schema.sql')
  const sqlContent = readFileSync(sqlPath, 'utf8')
  
  // Split by double newlines to separate CREATE TABLE statements
  const statements = sqlContent
    .split('\n\n')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
  
  statements.forEach((statement, index) => {
    console.log(`\n--- Command ${index + 1} ---`)
    console.log(statement)
    console.log('--- End Command ---\n')
  })
  
  console.log('\n🎉 After running these commands, all AI Scraper tables will be created!')
  console.log('\nNext steps:')
  console.log('1. Run: npx tsx src/scripts/initialize-scraper.ts')
  console.log('2. Run: npx tsx src/scripts/run-test-scrape.ts')
}

generateSQLInstructions()