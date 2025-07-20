import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    await migrate(db, { migrationsFolder: './src/server/db/migrations' });
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();