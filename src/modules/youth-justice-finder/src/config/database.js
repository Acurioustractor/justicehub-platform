import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  client: 'postgresql',
  connection: process.env.DATABASE_URL || {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'youth_justice_services',
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: process.env.DATABASE_SSL === 'false' ? false : 
         process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
  pool: {
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 900000,
    createRetryIntervalMillis: 200
  },
  migrations: {
    directory: './database/migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './database/seeds'
  },
  debug: process.env.NODE_ENV === 'development'
};

const db = knex(config);

// Test connection with better error handling
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Database connected successfully');
    console.log(`📊 Pool config: min=${config.pool.min}, max=${config.pool.max}`);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('🔧 Connection config:', {
      url: process.env.DATABASE_URL ? 'Set from DATABASE_URL' : 'Using individual params',
      host: process.env.DATABASE_HOST || 'localhost',
      database: process.env.DATABASE_NAME || 'youth_justice_services'
    });
    // Don't exit in production - let server start with error handling
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

export default db;