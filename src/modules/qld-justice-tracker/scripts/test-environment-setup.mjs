#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { config } from 'dotenv';

console.log('🔍 Queensland Youth Justice Tracker - Environment Configuration Test\n');

// Test 1: Check environment files
console.log('📁 Test 1: Checking environment files...');
try {
  // Load .env for backend variables
  config({ path: '.env' });
  console.log('✅ .env file found');
  
  // Load .env.local for frontend variables
  config({ path: '.env.local' });
  console.log('✅ .env.local file found');
} catch (error) {
  console.error('❌ Error loading environment files:', error.message);
}

// Test 2: Check required environment variables
console.log('\n📋 Test 2: Checking environment variables...');
const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_URL': process.env.SUPABASE_URL,
  'SUPABASE_SERVICE_KEY': process.env.SUPABASE_SERVICE_KEY,
  'FIRECRAWL_API_KEY': process.env.FIRECRAWL_API_KEY
};

let allVarsPresent = true;
for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
    allVarsPresent = false;
  }
}

// Test 3: Verify Supabase URLs match
console.log('\n🔗 Test 3: Verifying Supabase URLs consistency...');
const frontendUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const backendUrl = process.env.SUPABASE_URL;

if (frontendUrl === backendUrl) {
  console.log(`✅ URLs match: ${frontendUrl}`);
} else {
  console.log(`❌ URL mismatch!`);
  console.log(`   Frontend: ${frontendUrl}`);
  console.log(`   Backend: ${backendUrl}`);
}

// Test 4: Verify correct Supabase instance
console.log('\n🏢 Test 4: Verifying Supabase instance...');
const correctInstance = 'oxgkjgurpopntowhxlxm';
const oldInstance = 'ivvvkombgqvjyrrmwmbs';

if (frontendUrl && frontendUrl.includes(correctInstance)) {
  console.log(`✅ Using correct Supabase instance: ${correctInstance}`);
} else if (frontendUrl && frontendUrl.includes(oldInstance)) {
  console.log(`❌ ERROR: Still using OLD Supabase instance: ${oldInstance}`);
  console.log(`   This needs to be updated to: ${correctInstance}`);
} else {
  console.log(`❌ Could not verify Supabase instance`);
}

// Test 5: Test Supabase connection with anon key
console.log('\n🔌 Test 5: Testing Supabase connection (anon key)...');
if (frontendUrl && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  try {
    const supabase = createClient(
      frontendUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data, error } = await supabase
      .from('youth_statistics')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ Anon key connection failed:`, error.message);
    } else {
      console.log(`✅ Anon key connection successful!`);
    }
  } catch (error) {
    console.log(`❌ Connection error:`, error.message);
  }
} else {
  console.log('❌ Missing frontend URL or anon key');
}

// Test 6: Test Supabase connection with service key
console.log('\n🔐 Test 6: Testing Supabase connection (service key)...');
if (backendUrl && process.env.SUPABASE_SERVICE_KEY) {
  try {
    const supabaseAdmin = createClient(
      backendUrl,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    const { data, error } = await supabaseAdmin
      .from('youth_statistics')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Service key connection failed:`, error.message);
    } else {
      console.log(`✅ Service key connection successful!`);
      if (data && data.length > 0) {
        console.log(`   Found ${data.length} record(s) in youth_statistics table`);
      }
    }
  } catch (error) {
    console.log(`❌ Connection error:`, error.message);
  }
} else {
  console.log('❌ Missing backend URL or service key');
}

// Test 7: Check for data in key tables
console.log('\n📊 Test 7: Checking database tables...');
if (backendUrl && process.env.SUPABASE_SERVICE_KEY) {
  const supabaseAdmin = createClient(backendUrl, process.env.SUPABASE_SERVICE_KEY);
  
  const tables = [
    'youth_statistics',
    'budget_allocations',
    'court_statistics',
    'parliamentary_documents',
    'scraped_content'
  ];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0} records`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
}

// Summary
console.log('\n📝 CONFIGURATION SUMMARY:');
console.log('========================');
console.log(`Environment Files: ${allVarsPresent ? '✅ All set' : '❌ Missing variables'}`);
console.log(`Supabase Instance: ${frontendUrl?.includes(correctInstance) ? '✅ Correct' : '❌ Incorrect'}`);
console.log(`Database URL: ${frontendUrl || '❌ Not set'}`);

console.log('\n🎯 NEXT STEPS:');
if (!allVarsPresent) {
  console.log('1. Add missing environment variables to .env and .env.local');
}
if (frontendUrl && !frontendUrl.includes(correctInstance)) {
  console.log('1. Update all Supabase URLs to use: oxgkjgurpopntowhxlxm.supabase.co');
}
console.log('2. Clear browser cache and service worker');
console.log('3. Run: npm run dev');
console.log('4. Visit: http://localhost:3000/data-explorer');

process.exit(0);