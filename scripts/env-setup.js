#!/usr/bin/env node

/**
 * Environment Setup Script
 * 
 * Helps developers set up their environment configuration safely
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 JusticeHub Environment Setup');
  console.log('=====================================\n');
  
  // Check if .env.local already exists
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const overwrite = await question('⚠️  .env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Aborted. Use `npm run env:validate` to check your current configuration.');
      rl.close();
      return;
    }
    
    // Backup existing file
    const backupPath = `${envLocalPath}.backup.${Date.now()}`;
    fs.copyFileSync(envLocalPath, backupPath);
    console.log(`📦 Backup created: ${path.basename(backupPath)}\n`);
  }
  
  console.log('Let\'s set up your environment variables...\n');
  
  // Core configuration
  console.log('📊 CORE CONFIGURATION');
  console.log('======================');
  
  const appUrl = await question('App URL (default: http://localhost:3003): ') || 'http://localhost:3003';
  const port = await question('Port (default: 3003): ') || '3003';
  
  console.log('\n🔐 SECURITY SECRETS');
  console.log('===================');
  console.log('Generating secure secrets...');
  
  const authSecret = generateSecret(32);
  const sessionSecret = generateSecret(32);
  const encryptionKey = generateSecret(32);
  const jwtSecret = generateSecret(32);
  
  console.log('✅ Security secrets generated');
  
  console.log('\n🗄️  DATABASE CONFIGURATION');
  console.log('============================');
  
  const supabaseUrl = await question('Supabase URL (https://your-project.supabase.co): ');
  const supabaseAnonKey = await question('Supabase Anon Key: ');
  const supabaseServiceKey = await question('Supabase Service Key (optional, for admin operations): ');
  
  console.log('\n🤖 AI SERVICES (Optional)');
  console.log('=========================');
  
  const openaiKey = await question('OpenAI API Key (optional): ');
  const anthropicKey = await question('Anthropic API Key (optional): ');
  const perplexityKey = await question('Perplexity API Key (optional): ');
  
  console.log('\n🌐 WEB SCRAPING (Optional)');
  console.log('==========================');
  
  const firecrawlKey = await question('Firecrawl API Key (optional): ');
  
  console.log('\n📧 COMMUNICATION (Optional)');
  console.log('============================');
  
  const sendgridKey = await question('SendGrid API Key (optional): ');
  const fromEmail = await question('From Email (default: noreply@localhost): ') || 'noreply@localhost';
  
  // Generate .env.local content
  const envContent = `# JusticeHub Environment Configuration
# Generated on ${new Date().toISOString()}
# DO NOT commit this file to version control

# Application
NODE_ENV=development
APP_URL=${appUrl}
API_URL=${appUrl}/api
PORT=${port}

# Auth0 Configuration (Update with your Auth0 details)
AUTH0_SECRET=${authSecret}
AUTH0_BASE_URL=${appUrl}
AUTH0_ISSUER_BASE_URL=https://your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_AUDIENCE=${appUrl}/api
AUTH0_SCOPE=openid profile email

# Database - Main Supabase
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseAnonKey}${supabaseServiceKey ? `\nSUPABASE_SERVICE_KEY=${supabaseServiceKey}` : ''}

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
CACHE_TTL=3600

# AI Services${openaiKey ? `\nOPENAI_API_KEY=${openaiKey}` : ''}${anthropicKey ? `\nANTHROPIC_API_KEY=${anthropicKey}` : ''}${perplexityKey ? `\nPERPLEXITY_API_KEY=${perplexityKey}` : ''}

# Web Scraping${firecrawlKey ? `\nFIRECRAWL_API_KEY=${firecrawlKey}` : ''}
PUPPETEER_SKIP_DOWNLOAD=true
PUPPETEER_HEADLESS=true
SCRAPER_USER_AGENT=JusticeHub-Bot/1.0
SCRAPER_DELAY_MS=1000
SCRAPER_TIMEOUT_MS=30000

# External APIs
AIRTABLE_API_KEY=your-airtable-api-key
AIRTABLE_BASE_ID=your-airtable-base-id
AIRTABLE_STORIES_TABLE=Stories

# Communication${sendgridKey ? `\nSENDGRID_API_KEY=${sendgridKey}` : ''}
SENDGRID_FROM_EMAIL=${fromEmail}
SENDGRID_FROM_NAME=JusticeHub

# Payment (Optional)
STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Analytics (Optional)
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
MIXPANEL_TOKEN=your-mixpanel-token

# Security
SESSION_SECRET=${sessionSecret}
ENCRYPTION_KEY=${encryptionKey}
JWT_SECRET=${jwtSecret}
CORS_ORIGIN=${appUrl}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=info
LOG_FORMAT=text

# Feature Flags
ENABLE_AIRTABLE_SYNC=false
ENABLE_AI_INSIGHTS=${openaiKey || anthropicKey ? 'true' : 'false'}
ENABLE_PAYMENT_PROCESSING=false
ENABLE_SMS_NOTIFICATIONS=false
ENABLE_SERVICE_FINDER=true
ENABLE_BUDGET_TRACKER=true
ENABLE_WEB_SCRAPING=${firecrawlKey ? 'true' : 'false'}

# Module Configuration (using main Supabase)
YJSF_SUPABASE_URL=${supabaseUrl}
YJSF_SUPABASE_ANON_KEY=${supabaseAnonKey}${supabaseServiceKey ? `\nYJSF_SUPABASE_SERVICE_KEY=${supabaseServiceKey}` : ''}

QJT_SUPABASE_URL=${supabaseUrl}
QJT_SUPABASE_ANON_KEY=${supabaseAnonKey}${supabaseServiceKey ? `\nQJT_SUPABASE_SERVICE_KEY=${supabaseServiceKey}` : ''}

# Development Tools
NEXT_TELEMETRY_DISABLED=1
`;

  // Write .env.local file
  fs.writeFileSync(envLocalPath, envContent);
  
  console.log('\n✅ Environment configuration complete!');
  console.log(`📁 Created: ${path.basename(envLocalPath)}`);
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Review and update Auth0 configuration');
  console.log('2. Add any missing API keys');
  console.log('3. Run `npm run env:validate` to test your configuration');
  console.log('4. Start development: `npm run dev`');
  
  console.log('\n💡 TIPS:');
  console.log('- Keep your .env.local file secure and never commit it');
  console.log('- Use .env.example as a reference for all available options');
  console.log('- Update feature flags based on your needs');
  
  rl.close();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateSecret };