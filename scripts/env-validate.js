#!/usr/bin/env node

/**
 * Environment Validation Script
 * 
 * Validates environment configuration and tests API connections
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function testSupabaseConnection() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return { success: false, message: 'Missing main Supabase configuration' };
    }
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // Test basic connection by querying the database info
    // This will work regardless of what tables exist
    const { data, error } = await supabase.rpc('version');
    
    if (error) {
      // If RPC doesn't work, try a simpler approach - just list tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(1);
        
      if (tablesError) {
        throw new Error(`Connection failed: ${tablesError.message} (${tablesError.code || 'no code'})`);
      }
      
      return { 
        success: true, 
        message: `Connected successfully (database accessible, found ${tablesData?.length || 0} tables)` 
      };
    }
    
    return { success: true, message: 'Connected successfully (database version query worked)' };
    
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testYJSFSupabase() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    // Use module-specific credentials like the API routes do
    const supabaseUrl = process.env.YJSF_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.YJSF_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return { success: false, message: 'Missing YJSF Supabase configuration' };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection first
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
      
    if (tablesError) {
      throw new Error(`YJSF DB Connection failed: ${tablesError.message} (${tablesError.code || 'no code'})`);
    }
    
    const tables = tablesData?.map(t => t.table_name) || [];
    const hasServiceTables = tables.some(table => ['services', 'organizations', 'locations'].includes(table));
    
    return { 
      success: true, 
      message: `Service Finder DB connected (${tables.length} tables found${hasServiceTables ? ', includes service tables' : ''})` 
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testQJTSupabase() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    // Use module-specific credentials
    const supabaseUrl = process.env.QJT_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.QJT_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return { success: false, message: 'Missing QJT Supabase configuration' };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection first
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
      
    if (tablesError) {
      throw new Error(`QJT DB Connection failed: ${tablesError.message} (${tablesError.code || 'no code'})`);
    }
    
    const tables = tablesData?.map(t => t.table_name) || [];
    const hasTrackerTables = tables.some(table => ['budget_allocations', 'youth_statistics', 'expenditures'].includes(table));
    
    return { 
      success: true, 
      message: `Justice Tracker DB connected (${tables.length} tables found${hasTrackerTables ? ', includes tracker tables' : ''})` 
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, message: 'No API key provided' };
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return { success: true, message: 'API key valid' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, message: 'No API key provided' };
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });
    
    if (!response.ok && response.status !== 400) { // 400 is expected for minimal request
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return { success: true, message: 'API key valid' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testFirecrawl() {
  if (!process.env.FIRECRAWL_API_KEY) {
    return { success: false, message: 'No API key provided' };
  }
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v0/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://example.com',
        crawlerOptions: { limit: 1 }
      })
    });
    
    if (!response.ok && response.status !== 402) { // 402 may indicate quota limits
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return { success: true, message: 'API key valid' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

function validateRequiredVars() {
  const required = [
    'NODE_ENV',
    'APP_URL',
    'PORT',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    return {
      success: false,
      message: `Missing required variables: ${missing.join(', ')}`
    };
  }
  
  return { success: true, message: 'All required variables present' };
}

function validateUrls() {
  const urlVars = [
    'APP_URL',
    'API_URL',
    'SUPABASE_URL',
    'AUTH0_BASE_URL',
    'AUTH0_ISSUER_BASE_URL'
  ].filter(key => process.env[key]);
  
  const invalidUrls = [];
  
  for (const key of urlVars) {
    try {
      new URL(process.env[key]);
    } catch {
      invalidUrls.push(key);
    }
  }
  
  if (invalidUrls.length > 0) {
    return {
      success: false,
      message: `Invalid URLs: ${invalidUrls.join(', ')}`
    };
  }
  
  return { success: true, message: 'All URLs valid' };
}

function validateSecrets() {
  const secrets = [
    'AUTH0_SECRET',
    'SESSION_SECRET',
    'ENCRYPTION_KEY',
    'JWT_SECRET'
  ].filter(key => process.env[key]);
  
  const weakSecrets = secrets.filter(key => 
    process.env[key] && process.env[key].length < 32
  );
  
  if (weakSecrets.length > 0) {
    return {
      success: false,
      message: `Weak secrets (< 32 chars): ${weakSecrets.join(', ')}`
    };
  }
  
  return { success: true, message: 'Security secrets look good' };
}

async function main() {
  console.log('🔍 JusticeHub Environment Validation');
  console.log('=====================================\n');
  
  // Check if .env.local exists
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envLocalPath)) {
    console.log('❌ .env.local not found');
    console.log('💡 Run `npm run env:setup` to create your environment configuration');
    process.exit(1);
  }
  
  console.log('📁 Configuration file: .env.local ✅\n');
  
  // Validate configuration
  console.log('🔧 CONFIGURATION VALIDATION');
  console.log('============================');
  
  const validations = [
    { name: 'Required Variables', test: validateRequiredVars },
    { name: 'URL Format', test: validateUrls },
    { name: 'Security Secrets', test: validateSecrets }
  ];
  
  let allValid = true;
  
  for (const validation of validations) {
    try {
      const result = validation.test();
      if (result.success) {
        console.log(`✅ ${validation.name}: ${result.message}`);
      } else {
        console.log(`❌ ${validation.name}: ${result.message}`);
        allValid = false;
      }
    } catch (error) {
      console.log(`❌ ${validation.name}: ${error.message}`);
      allValid = false;
    }
  }
  
  console.log('\n🌐 API CONNECTIVITY TESTS');
  console.log('==========================');
  
  const coreTests = [
    { name: 'Supabase Database (Main)', test: testSupabaseConnection, required: false }
  ];
  
  const moduleTests = [
    { name: 'Youth Justice Service Finder DB', test: testYJSFSupabase, required: false },
    { name: 'QLD Justice Tracker DB', test: testQJTSupabase, required: false }
  ];
  
  const aiTests = [
    { name: 'OpenAI API', test: testOpenAI, required: false },
    { name: 'Anthropic API', test: testAnthropic, required: false },
    { name: 'Firecrawl API', test: testFirecrawl, required: false }
  ];
  
  let coreServicesWorking = 0;
  let totalCoreServices = coreTests.length;
  
  console.log('Core Services:');
  for (const test of coreTests) {
    try {
      console.log(`  Testing ${test.name}...`);
      const result = await test.test();
      if (result.success) {
        console.log(`  ✅ ${test.name}: ${result.message}`);
        coreServicesWorking++;
      } else {
        console.log(`  ⚠️  ${test.name}: ${result.message}`);
        if (test.required) allValid = false;
      }
    } catch (error) {
      console.log(`  ❌ ${test.name}: ${error.message}`);
      if (test.required) allValid = false;
    }
  }
  
  console.log('\nModule Services:');
  for (const test of moduleTests) {
    try {
      console.log(`  Testing ${test.name}...`);
      const result = await test.test();
      if (result.success) {
        console.log(`  ✅ ${test.name}: ${result.message}`);
      } else {
        console.log(`  ⚠️  ${test.name}: ${result.message}`);
      }
    } catch (error) {
      console.log(`  ⚠️  ${test.name}: ${error.message}`);
    }
  }
  
  console.log('\nAI Services:');
  for (const test of aiTests) {
    try {
      console.log(`  Testing ${test.name}...`);
      const result = await test.test();
      if (result.success) {
        console.log(`  ✅ ${test.name}: ${result.message}`);
      } else {
        console.log(`  ⚠️  ${test.name}: ${result.message}`);
      }
    } catch (error) {
      console.log(`  ⚠️  ${test.name}: ${error.message}`);
    }
  }
  
  console.log('\n🎛️  FEATURE FLAGS');
  console.log('================');
  
  const features = [
    'ENABLE_AI_INSIGHTS',
    'ENABLE_SERVICE_FINDER',
    'ENABLE_WEB_SCRAPING',
    'ENABLE_PAYMENT_PROCESSING'
  ];
  
  features.forEach(feature => {
    const enabled = process.env[feature] === 'true';
    console.log(`${enabled ? '🟢' : '🔴'} ${feature}: ${enabled ? 'Enabled' : 'Disabled'}`);
  });
  
  console.log('\n📊 SUMMARY');
  console.log('===========');
  
  if (allValid) {
    console.log('✅ Configuration validation passed');
    console.log('🚀 Ready to start development!');
    console.log('\n💡 Next: Run `npm run dev` to start the application');
    
    if (coreServicesWorking === 0) {
      console.log('\n⚠️  DATABASE NOTICE:');
      console.log('   No database connections are working. The app will run but with limited functionality.');
      console.log('   To enable full functionality:');
      console.log('   1. Set up a Supabase project at https://supabase.com');
      console.log('   2. Update SUPABASE_URL and SUPABASE_ANON_KEY in .env.local');
      console.log('   3. For modules, set up YJSF_* and QJT_* variables as needed');
    }
  } else {
    console.log('❌ Configuration validation failed');
    console.log('🔧 Please fix the issues above and run validation again');
    console.log('\n💡 Need help? Check .env.example for reference values');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}