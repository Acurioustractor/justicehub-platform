/**
 * Vercel Serverless Function: Start Geocoding Process
 */

import { Pool } from 'pg';
import pino from 'pino';
import { systematicGeocoding } from '../scripts/systematic-geocoding.js';

const logger = pino({ name: 'geocoding-start-api' });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Start systematic geocoding process
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const {
      dryRun = false,
      batchSize = 25, // Smaller batch size for serverless
      maxServices = 100, // Limit for serverless timeout
      onlyMissing = true
    } = req.body || {};
    
    logger.info({ dryRun, batchSize, maxServices, onlyMissing }, 'Starting systematic geocoding via API');
    
    // Run geocoding process with limits suitable for serverless
    const result = await systematicGeocoding({
      dryRun,
      batchSize,
      maxServices,
      onlyMissing
    });
    
    res.json({
      success: true,
      message: dryRun ? 'Dry run completed' : 'Geocoding completed',
      result: {
        successful: result.success,
        failed: result.failed,
        skipped: result.skipped,
        stats: result.stats
      }
    });
    
  } catch (error) {
    logger.error({ error: error.message }, 'Systematic geocoding failed');
    res.status(500).json({
      success: false,
      error: 'Systematic geocoding failed',
      details: error.message
    });
  }
}