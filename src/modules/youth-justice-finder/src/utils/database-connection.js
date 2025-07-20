import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool, Client } = pg;

/**
 * Creates a standardized database configuration object
 * @param {Object} options - Override options
 * @returns {Object} Database configuration
 */
export function createDbConfig(options = {}) {
  const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'youth_justice_services',
    user: process.env.DATABASE_USER || 'benknight',
    ssl: process.env.DATABASE_SSL === 'false' ? false : 
         process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    ...options
  };

  // Only add password if it's actually set and not empty
  const password = process.env.DATABASE_PASSWORD;
  if (password && typeof password === 'string' && password.trim() !== '') {
    config.password = password;
  }

  // Remove any undefined password field to prevent SCRAM issues
  if ('password' in config && !config.password) {
    delete config.password;
  }

  return config;
}

/**
 * Creates a standardized database pool
 * @param {Object} options - Override options
 * @returns {Pool} PostgreSQL pool instance
 */
export function createDbPool(options = {}) {
  const config = createDbConfig(options);
  
  // Add pool-specific configuration
  const poolConfig = {
    ...config,
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
    acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
  };

  return new Pool(poolConfig);
}

/**
 * Creates a standardized database client
 * @param {Object} options - Override options
 * @returns {Client} PostgreSQL client instance
 */
export function createDbClient(options = {}) {
  const config = createDbConfig(options);
  return new Client(config);
}

/**
 * Creates a database connection using DATABASE_URL if available
 * @param {Object} options - Override options
 * @returns {Pool} PostgreSQL pool instance
 */
export function createDbPoolFromUrl(options = {}) {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'false' ? false : 
           process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
      ...options
    });
  }
  
  return createDbPool(options);
}

export default {
  createDbConfig,
  createDbPool,
  createDbClient,
  createDbPoolFromUrl
};