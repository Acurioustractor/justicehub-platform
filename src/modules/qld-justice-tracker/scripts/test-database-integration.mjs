#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });
config({ path: '.env.local' });

console.log('🧪 Testing Complete Database Integration\n');

const tests = {
  passed: 0,
  failed: 0,
  results: []
};

function logTest(name, success, details = '') {
  if (success) {
    tests.passed++;
    console.log(`✅ ${name}`);
  } else {
    tests.failed++;
    console.log(`❌ ${name}`);
  }
  if (details) console.log(`   ${details}`);
  tests.results.push({ name, success, details });
}

// Test 1: Environment Variables
console.log('1️⃣ Testing Environment Variables\n');
const envVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_URL': process.env.SUPABASE_URL,
  'SUPABASE_SERVICE_KEY': process.env.SUPABASE_SERVICE_KEY,
};

for (const [key, value] of Object.entries(envVars)) {
  logTest(
    `${key} is set`,
    !!value,
    value ? `Length: ${value.length} chars` : 'Missing'
  );
}

// Test 2: Client Connection (Anon Key)
console.log('\n2️⃣ Testing Client Connection (Anonymous Key)\n');
if (envVars.NEXT_PUBLIC_SUPABASE_URL && envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const clientSupabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    const { data, error, count } = await clientSupabase
      .from('youth_statistics')
      .select('*', { count: 'exact', head: true });

    logTest(
      'Client can connect to database',
      !error,
      error ? error.message : `Found ${count} records`
    );
  } catch (err) {
    logTest('Client can connect to database', false, err.message);
  }
}

// Test 3: Admin Connection (Service Key)
console.log('\n3️⃣ Testing Admin Connection (Service Key)\n');
if (envVars.SUPABASE_URL && envVars.SUPABASE_SERVICE_KEY) {
  const adminSupabase = createClient(
    envVars.SUPABASE_URL,
    envVars.SUPABASE_SERVICE_KEY
  );

  try {
    const { data, error } = await adminSupabase
      .from('youth_statistics')
      .select('*')
      .limit(1);

    logTest(
      'Admin can connect to database',
      !error,
      error ? error.message : `Retrieved ${data?.length || 0} records`
    );

    // Test write capability
    const testData = {
      date: '2024-01-01',
      facility_name: 'Test Facility',
      total_youth: 100,
      indigenous_youth: 50,
      indigenous_percentage: 50,
      scraped_date: new Date().toISOString()
    };

    const { error: insertError } = await adminSupabase
      .from('youth_statistics')
      .insert(testData);

    const canWrite = !insertError || insertError.code === '23505'; // Duplicate is ok
    logTest(
      'Admin can write to database',
      canWrite,
      insertError ? insertError.message : 'Write test successful'
    );

    // Clean up test data if inserted
    if (!insertError) {
      await adminSupabase
        .from('youth_statistics')
        .delete()
        .eq('facility_name', 'Test Facility');
    }
  } catch (err) {
    logTest('Admin can connect to database', false, err.message);
  }
}

// Test 4: Table Access
console.log('\n4️⃣ Testing Table Access\n');
const tables = [
  'youth_statistics',
  'budget_allocations',
  'court_statistics',
  'parliamentary_documents',
  'scraped_content',
  'cost_comparisons',
  'hidden_costs'
];

if (envVars.SUPABASE_URL && envVars.SUPABASE_SERVICE_KEY) {
  const adminSupabase = createClient(
    envVars.SUPABASE_URL,
    envVars.SUPABASE_SERVICE_KEY
  );

  for (const table of tables) {
    try {
      const { error, count } = await adminSupabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      logTest(
        `Table '${table}' is accessible`,
        !error,
        error ? error.message : `${count} records`
      );
    } catch (err) {
      logTest(`Table '${table}' is accessible`, false, err.message);
    }
  }
}

// Test 5: API Endpoints (if running locally)
console.log('\n5️⃣ Testing API Endpoints\n');
const apiEndpoints = [
  '/api/youth-statistics',
  '/api/budget-allocations',
  '/api/parliamentary-documents',
  '/api/health'
];

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000';

console.log(`Testing against: ${baseUrl}\n`);

for (const endpoint of apiEndpoints) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`);
    logTest(
      `API ${endpoint}`,
      response.ok,
      `Status: ${response.status}`
    );
  } catch (err) {
    logTest(
      `API ${endpoint}`,
      false,
      'Not available (server may not be running)'
    );
  }
}

// Summary
console.log('\n📊 Test Summary\n');
console.log(`Total Tests: ${tests.passed + tests.failed}`);
console.log(`Passed: ${tests.passed}`);
console.log(`Failed: ${tests.failed}`);
console.log(`Success Rate: ${Math.round((tests.passed / (tests.passed + tests.failed)) * 100)}%`);

if (tests.failed > 0) {
  console.log('\n❌ Failed Tests:');
  tests.results
    .filter(r => !r.success)
    .forEach(r => console.log(`  - ${r.name}: ${r.details}`));
}

// Recommendations
console.log('\n💡 Recommendations:\n');
if (tests.failed === 0) {
  console.log('✅ All tests passed! Your database integration is working correctly.');
} else {
  console.log('1. Check that all environment variables are correctly set');
  console.log('2. Verify Supabase project is accessible');
  console.log('3. Ensure RLS policies allow read access');
  console.log('4. Check API endpoints are deployed');
}

process.exit(tests.failed > 0 ? 1 : 0);