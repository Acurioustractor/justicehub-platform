#!/usr/bin/env node

import { execSync } from 'child_process';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
╔════════════════════════════════════════════════════╗
║     Youth Justice Service Finder - Setup Helper    ║
╚════════════════════════════════════════════════════╝
`);

console.log('This script will help you run the demo without Docker.\n');

// Check for PostgreSQL
console.log('Checking for PostgreSQL...');
try {
  execSync('psql --version', { stdio: 'pipe' });
  console.log('✅ PostgreSQL is installed\n');
} catch (error) {
  console.log(`❌ PostgreSQL not found. 

To install PostgreSQL on macOS:
1. Using Homebrew: brew install postgresql@15 postgis
2. Or download from: https://postgresapp.com/

After installing, run this script again.
`);
  process.exit(1);
}

// Install dependencies
console.log('Installing npm dependencies...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Dependencies installed\n');
} catch (error) {
  console.error('Failed to install dependencies:', error.message);
  process.exit(1);
}

// Ask for database setup
rl.question('Do you want to create a new database? (y/n): ', async (answer) => {
  if (answer.toLowerCase() === 'y') {
    console.log('\nCreating database...');
    try {
      // Create database as current user
      execSync('createdb youth_justice_services 2>/dev/null || true', { stdio: 'pipe' });
      console.log('✅ Database created (or already exists)\n');
      
      // Update .env for local setup
      const envContent = `# Database (Local PostgreSQL)
DATABASE_URL=postgresql://localhost:5432/youth_justice_services
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=youth_justice_services
DATABASE_USER=${process.env.USER}
DATABASE_PASSWORD=

# Elasticsearch (Skip for demo)
ELASTICSEARCH_URL=http://localhost:9200

# Firecrawl API
FIRECRAWL_API_KEY=your-firecrawl-api-key
FIRECRAWL_CONCURRENCY=2
FIRECRAWL_RATE_LIMIT=2
FIRECRAWL_CACHE_TTL=3600
FIRECRAWL_MAX_RETRIES=3
FIRECRAWL_TIMEOUT=30000

# Redis (Skip for demo)
REDIS_URL=redis://localhost:6379

# Temporal (Skip for demo)
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default

# Notifications
NOTIFICATION_EMAILS=admin@example.com

# Logging
LOG_LEVEL=info

# Environment
NODE_ENV=development`;

      require('fs').writeFileSync(path.join(__dirname, '..', '.env'), envContent);
      console.log('✅ Updated .env for local PostgreSQL\n');
      
    } catch (error) {
      console.error('Error creating database:', error.message);
    }
  }
  
  rl.close();
  
  // Run setup
  console.log('Setting up database schema...');
  try {
    execSync('npm run setup:db', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (error) {
    console.error('\nError setting up database. You may need to:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check your database credentials in .env');
    console.error('3. Enable PostGIS extension manually: CREATE EXTENSION postgis;');
    process.exit(1);
  }
  
  console.log('\n✅ Setup complete!\n');
  console.log('Now run: npm run scrape:demo\n');
});